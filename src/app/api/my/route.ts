import { and, eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryAreas, directoryCategories, notifications, services } from "@/db/schema";
import { ensureSeed, serializeCategory, serializeService, withDirectoryInvalidation } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";
import { sameOrigin } from "@/lib/auth";
import { availabilityUpdate, AVAILABILITY_HOURS, parseServiceItems, parseCenterSchedule, parseServiceOffer, parseWorkingHours, withCenterSubjects, withServiceStages, TEACHER_CENTER_ID, type ServiceCompletionDraft } from "@/lib/catalog";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/**
 * «حسابي» لصاحب الخدمة عبر رابطه السري (ترسله الإدارة على واتسابه):
 * - quick: البيانات الآمنة (الوصف، المواعيد، قائمة الخدمات، طوارئ) تُحفظ فورًا وتصل الإدارة كإشعار للعلم.
 * - request: البيانات الحساسة (الاسم، الهاتف، التخصص، العنوان) تُرسل كمسودة تعتمدها الإدارة بضغطة من «طلبات المهن».
 * - availability: تشغيل/إيقاف «متاح الآن» مثل رابط التجديد تمامًا.
 * - offer: إضافة/إلغاء عرض مؤقت (حتى 30 يومًا) يظهر على البطاقة وفي «عروض الأسبوع».
 * - confirm: «بياناتي صحيحة» — يجدد تاريخ آخر تأكيد (تذكير كل 6 أشهر).
 */
export const POST = withDirectoryInvalidation(async (request: Request) => {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "الحساب غير متاح في وضع المعاينة." }, { status: 503 });
    if (rateLimit(request, "my-account", 80)) throw new InputError("محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.", 429);
    await ensureSeed();
    const body = objectInput(await request.json());
    const token = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9]{40}$/i.test(token)) throw new InputError("رابط الحساب غير صحيح.");
    const [service] = await db.select().from(services).where(eq(services.accountToken, token)).limit(1);
    if (!service) throw new InputError("الرابط غير صحيح أو تم إلغاؤه. اطلب رابطًا جديدًا من إدارة الدليل.", 404);

    if (body.action === "availability") {
      const next = availabilityUpdate(body.state === "stop" ? "stop" : "activate", { availableNow: service.availableNow, availableUntil: service.availableUntil });
      await db.update(services).set(next).where(eq(services.id, service.id));
      const [updated] = await db.select().from(services).where(eq(services.id, service.id)).limit(1);
      return Response.json({ ok: true, hours: AVAILABILITY_HOURS, service: serializeService(updated), message: next.availableNow ? `تم تفعيل «متاح الآن» لمدة ${AVAILABILITY_HOURS} ساعات.` : "تم إيقاف «متاح الآن»." });
    }

    if (body.action === "quick") {
      const description = cleanText(body.description ?? service.description, 1000);
      const hours = cleanText(body.hours ?? service.hours, 120);
      if (description.length < 10) throw new InputError("اكتب وصفًا لا يقل عن ١٠ أحرف.");
      let workingHours, serviceItems: string[], schedule;
      try {
        workingHours = parseWorkingHours(body.workingHours ?? service.workingHours);
        serviceItems = parseServiceItems(body.serviceItems ?? service.serviceItems);
        schedule = service.category === TEACHER_CENTER_ID && body.schedule !== undefined ? parseCenterSchedule(body.schedule) : service.schedule;
      } catch (error) { throw new InputError(error instanceof Error ? error.message : "راجع المواعيد وقائمة الخدمات."); }
      const emergency = typeof body.emergency === "boolean" ? body.emergency : service.emergency;
      // المدرس يحدد مراحله الدراسية بنفسه (تُحفظ كوسوم داخل التخصصات الفرعية).
      let subSpecialties = Array.isArray(body.stages) ? withServiceStages(service.subSpecialties, body.stages) : service.subSpecialties;
      if (Array.isArray(body.subjects) && service.category === TEACHER_CENTER_ID) {
        const catalogRows = await db.select().from(directoryCategories);
        subSpecialties = withCenterSubjects(subSpecialties, body.subjects, catalogRows.map((row) => serializeCategory(row)));
      }
      // لو هناك مسودة تعديل بانتظار الإدارة نحدّث نسختها من هذه الحقول أيضًا حتى لا تُعيد الموافقة القيم القديمة.
      const completionDraft = service.completionStatus === "submitted" && service.completionDraft ? { ...service.completionDraft, description, serviceItems, subSpecialties, emergency } : service.completionDraft;
      await db.update(services).set({ description, hours, workingHours, serviceItems, subSpecialties, schedule, emergency, completionDraft, confirmedAt: new Date() }).where(eq(services.id, service.id));
      const changed = [description !== service.description && "الوصف", hours !== service.hours && "المواعيد النصية", JSON.stringify(workingHours) !== JSON.stringify(service.workingHours) && "الجدول الأسبوعي", JSON.stringify(serviceItems) !== JSON.stringify(service.serviceItems) && "قائمة الخدمات", JSON.stringify(subSpecialties) !== JSON.stringify(service.subSpecialties) && "المراحل الدراسية", JSON.stringify(schedule) !== JSON.stringify(service.schedule) && "جدول الحصص", emergency !== service.emergency && "خدمة الطوارئ"].filter(Boolean) as string[];
      if (changed.length > 0) {
        await db.insert(notifications).values({ type: "service-update", title: `حدّث المهني بياناته بنفسه: ${service.name}`, message: `عدّل من حسابه: ${changed.join("، ")}. التعديل منشور بالفعل ولا يحتاج موافقة.`, entityId: service.id });
        queueAdminWhatsappAlert("suggestion", `✍️ ${service.name} حدّث بياناته بنفسه`, `${changed.join("، ")} — منشور فورًا.`);
      }
      const [updated] = await db.select().from(services).where(eq(services.id, service.id)).limit(1);
      return Response.json({ ok: true, service: serializeService(updated), message: changed.length > 0 ? "تم الحفظ ونشر التعديل على بطاقتك فورًا." : "لا يوجد تغيير لحفظه." });
    }

    if (body.action === "offer") {
      let offer;
      try { offer = parseServiceOffer(body.offer); } catch (error) { throw new InputError(error instanceof Error ? error.message : "راجع بيانات العرض."); }
      await db.update(services).set({ ...offer, confirmedAt: new Date() }).where(eq(services.id, service.id));
      if (offer.offerTitle) {
        await db.insert(notifications).values({ type: "service-update", entityId: service.id, title: `عرض جديد من ${service.name}`, message: `«${offer.offerTitle}» حتى ${offer.offerEndsAt!.toLocaleDateString("ar-EG")} — منشور على بطاقته وفي عروض الأسبوع.` });
        queueAdminWhatsappAlert("suggestion", `🏷️ عرض جديد من ${service.name}`, `«${offer.offerTitle}» حتى ${offer.offerEndsAt!.toLocaleDateString("ar-EG")}.`);
      }
      const [updated] = await db.select().from(services).where(eq(services.id, service.id)).limit(1);
      return Response.json({ ok: true, service: serializeService(updated), message: offer.offerTitle ? "تم نشر العرض على بطاقتك وفي «عروض الأسبوع» بالصفحة الرئيسية." : "تم إلغاء العرض." });
    }

    if (body.action === "confirm") {
      await db.update(services).set({ confirmedAt: new Date() }).where(eq(services.id, service.id));
      const [updated] = await db.select().from(services).where(eq(services.id, service.id)).limit(1);
      return Response.json({ ok: true, service: serializeService(updated), message: "شكرًا! تم تأكيد أن بياناتك صحيحة ومحدّثة." });
    }

    if (body.action === "request") {
      const name = cleanText(body.name ?? service.name, 160);
      const category = cleanText(body.category ?? service.category, 60);
      const area = cleanText(body.area ?? service.area, 80);
      const address = cleanText(body.address ?? service.address, 240) || area;
      const phone = cleanPhone(body.phone ?? service.phone);
      const phoneSecondary = cleanPhone(body.phoneSecondary ?? service.phoneSecondary ?? "");
      if (name.length < 3) throw new InputError("اكتب اسم الخدمة (٣ أحرف على الأقل).");
      if (!validPhone(phone) || (phoneSecondary && !validPhone(phoneSecondary))) throw new InputError("تأكد من رقم الهاتف (مثال: 01012345678).");
      const [specialty] = await db.select({ id: directoryCategories.id }).from(directoryCategories).where(and(eq(directoryCategories.id, category), eq(directoryCategories.active, true))).limit(1);
      if (!specialty) throw new InputError("اختر التخصص من القائمة.");
      if (area !== service.area) {
        const [knownArea] = await db.select({ id: directoryAreas.id }).from(directoryAreas).where(eq(directoryAreas.name, area)).limit(1);
        if (!knownArea) throw new InputError("اختر المنطقة من القائمة.");
      }
      const draft: ServiceCompletionDraft = { name, category, area, address, phone, phoneSecondary, description: service.description, subSpecialties: service.subSpecialties, serviceItems: service.serviceItems, emergency: service.emergency, updatedAt: new Date().toISOString() };
      const diffs = [name !== service.name && `الاسم: ${service.name} ← ${name}`, phone !== service.phone && `الهاتف: ${service.phone} ← ${phone}`, phoneSecondary !== (service.phoneSecondary ?? "") && `هاتف إضافي: ${service.phoneSecondary || "—"} ← ${phoneSecondary || "—"}`, category !== service.category && `التخصص: ${service.category} ← ${category}`, area !== service.area && `المنطقة: ${service.area} ← ${area}`, address !== service.address && `العنوان: ${service.address || "—"} ← ${address}`].filter(Boolean) as string[];
      if (diffs.length === 0) throw new InputError("لم تغيّر شيئًا في هذه البيانات.");
      await db.update(services).set({ completionStatus: "submitted", completionNote: "", completionDraft: draft }).where(eq(services.id, service.id));
      await db.insert(notifications).values({ type: "service", title: `طلب تعديل من صاحب الخدمة: ${service.name}`, message: `${diffs.join(" • ")} — اعتمده أو ارفضه من «طلبات المهن».`, entityId: service.id });
      queueAdminWhatsappAlert("service", `📝 طلب تعديل من صاحب الخدمة: ${service.name}`, `${diffs.join(" • ")} — بانتظار موافقتك.`);
      const [updated] = await db.select().from(services).where(eq(services.id, service.id)).limit(1);
      return Response.json({ ok: true, service: serializeService(updated), message: "وصل طلبك للإدارة؛ سيظهر التعديل على بطاقتك بعد الموافقة." }, { status: 201 });
    }

    throw new InputError("إجراء غير معروف.");
  } catch (error) { return apiError(error); }
});

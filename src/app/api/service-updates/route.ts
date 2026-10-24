import { db } from "@/db";
import { notifications, services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, objectInput, InputError } from "@/lib/inputs";
import { cleanPhone, cleanText, validId, validPhone } from "@/lib/validation";
import { parseServiceItems } from "@/lib/catalog";
import { sameOrigin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    await ensureSeed();
    const body = objectInput(await request.json());
    const serviceId = body.serviceId;
    if (!validId(serviceId)) throw new InputError("الخدمة غير صحيحة.");
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) throw new InputError("الخدمة غير موجودة.", 404);

    if (body.action === "complete-profile") {
      if (service.completionStatus !== "requested" && service.completionStatus !== "rejected") {
        throw new InputError("استكمال البيانات غير مطلوب حاليًا لهذه الخدمة.", 409);
      }
      const name = cleanText(body.name ?? service.name, 160);
      const category = cleanText(body.category ?? service.category, 60);
      const area = cleanText(body.area ?? service.area, 80);
      const address = cleanText(body.address ?? service.address, 240) || area;
      const phone = cleanPhone(body.phone ?? service.phone);
      const phoneSecondary = cleanPhone(body.phoneSecondary ?? service.phoneSecondary ?? "");
      const description = cleanText(body.description ?? service.description, 1000);
      if (name.length < 3 || description.length < 10 || !validPhone(phone) || (phoneSecondary && !validPhone(phoneSecondary))) {
        throw new InputError("تأكد من اسم الخدمة (٣ أحرف على الأقل)، ورقم هاتف صحيح، ووصف لا يقل عن ١٠ أحرف.");
      }
      let subSpecialties: string[] = [];
      let serviceItems: string[] = [];
      try {
        subSpecialties = parseServiceItems(body.subSpecialties ?? []);
        serviceItems = parseServiceItems(body.serviceItems ?? []);
      } catch (err) {
        throw new InputError(err instanceof Error ? err.message : "راجع التخصصات الفرعية والخدمات التفصيلية.");
      }
      const draft = {
        name,
        category,
        area,
        address,
        phone,
        phoneSecondary,
        description,
        subSpecialties,
        serviceItems,
        emergency: body.emergency === true,
        updatedAt: new Date().toISOString(),
      };
      await db.update(services).set({
        completionStatus: "submitted",
        completionNote: "",
        completionDraft: draft,
      }).where(eq(services.id, service.id));
      await db.insert(notifications).values({
        type: "service",
        title: `استكمال بيانات من المهني: ${name}`,
        message: `أرسل المهني استكمال بياناته (${address}) وبانتظار موافقة أو رفض الإدارة.`,
        entityId: service.id,
      });
      queueAdminWhatsappAlert("service", `📝 استكمال بيانات من المهني: ${name}`, `${address} • ${phone} — بانتظار موافقة أو رفض الإدارة.`);
      return Response.json({ ok: true, completionStatus: "submitted", completionDraft: draft, message: "تم إرسال استكمال البيانات للإدارة وبانتظار المراجعة." }, { status: 201 });
    }

    if (body.action === "suggest") {
      // اقتراح تعديل من أي زائر: ملاحظة إلزامية ورقم تواصل اختياري، يصل كإشعار للإدارة دون تغيير البيانات.
      const note = cleanText(body.note ?? "", 400);
      const contact = cleanPhone(body.contact ?? "");
      if (note.length < 5) throw new InputError("اكتب الملاحظة بوضوح (٥ أحرف على الأقل).");
      if (contact && !validPhone(contact)) throw new InputError("رقم التواصل غير صحيح.");
      await db.insert(notifications).values({ type: "suggestion", title: `اقتراح تعديل: ${service.name}`, message: `${note}${contact ? ` — للتواصل: ${contact}` : ""}`, entityId: service.id });
      queueAdminWhatsappAlert("suggestion", `💬 اقتراح تعديل: ${service.name}`, `${note}${contact ? ` — للتواصل: ${contact}` : ""}`);
      return Response.json({ ok: true, message: "شكرًا لك! وصل اقتراحك للإدارة وستراجعه قريبًا." }, { status: 201 });
    }

    const phone = cleanPhone(body.phone ?? "");
    const note = cleanText(body.note ?? "", 240);
    if (!validPhone(phone)) throw new InputError("أدخل رقم هاتف صحيحًا.");
    await db.insert(notifications).values({ type: "service-update", title: `طلب تحديث بيانات: ${service.name}`, message: `الرقم المقترح: ${phone}${note ? ` — ${note}` : ""}`, entityId: service.id });
    queueAdminWhatsappAlert("suggestion", `✏️ طلب تحديث بيانات: ${service.name}`, `الرقم المقترح: ${phone}${note ? ` — ${note}` : ""}`);
    return Response.json({ ok: true, message: "وصل طلبك للإدارة للمراجعة." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

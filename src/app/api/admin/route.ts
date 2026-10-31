import { randomBytes } from "node:crypto";
import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { adBanners, adRequests, categoryIcons, communityListings, designImages, villageEvents, directoryAreas, directoryCategories, directorySettings, members, memberSessions, notifications, serviceRatings, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ICON_LIMITS, autoTransparentKey, designImageLimits, optimizeStoredImage, removeFlatBackground } from "@/lib/image-optimize";
import { ensureSeed, getAdminDirectory, getSettings, readDeletedCategoryIds, withDirectoryInvalidation, writeDeletedCategoryIds } from "@/lib/directory";
import { apiError, categoryInput, InputError, integerInput, objectInput, serviceInput, settingsInput } from "@/lib/inputs";
import { saveServicePhoto } from "@/lib/service-photo";
import { cleanPhone, cleanText, validId, validPhone } from "@/lib/validation";
import { AD_MAX_COUNT, AD_MAX_SECONDS, AD_MIN_SECONDS, availabilityUpdate, getAdTemplate, isAdMotion, isAdTemplateId, isAdTransition, isEventKind, isDesignImageKey, isHexColor, parseAdImageDataUrl, parseCategoryIconDataUrl, parseDesignImageDataUrl, designImageUrl, sanitizeAdPricing, sanitizeGreetingSettings, sanitizeDesignSettings, sanitizeUtilityNumbers, sanitizeAdminPalette } from "@/lib/catalog";
import { saveWhatsappAlertKinds, sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";
import { sanitizeTelecomSettings } from "@/lib/telecom-settings";
import { actorFromViewer, logActivity, resolveActivityLabel, type ActivityActor } from "@/lib/activity-log";

function availabilityInput(action: unknown, current = { availableNow: false, availableUntil: null as Date | null }) {
  try { return availabilityUpdate(action, current); }
  catch { throw new InputError("اختار إجراء إتاحة صحيح."); }
}

export const dynamic = "force-dynamic";
const statusInput = (value: unknown) => {
  if (typeof value !== "string" || !["pending", "approved", "rejected", "needs-info"].includes(value)) throw new InputError("حالة غير صحيحة.");
  return value;
};
function uuid(value: unknown) { if (!validId(value)) throw new InputError("معرّف غير صحيح."); return value; }

/** Shared validation for ad banner create/edit payloads (image handled separately). */
async function adInput(values: Record<string, unknown>) {
  const template = isAdTemplateId(values.template) ? values.template : "";
  if (values.template && !template) throw new InputError("القالب المختار غير معروف.");
  let title = cleanText(values.title, 120);
  if (title.length < 2 && template) title = getAdTemplate(template)?.title || (await getSettings()).siteName;
  const caption = cleanText(values.caption, 240), whatsapp = cleanPhone(values.whatsapp ?? "");
  if (title.length < 2) throw new InputError("اكتب عنوان الإعلان (اسم المعلن).");
  if (whatsapp && !validPhone(whatsapp)) throw new InputError("رقم واتساب المعلن غير صحيح.");
  const serviceId = typeof values.serviceId === "string" && values.serviceId ? uuid(values.serviceId) : null;
  if (serviceId) {
    const [linked] = await db.select({ id: services.id }).from(services).where(eq(services.id, serviceId)).limit(1);
    if (!linked) throw new InputError("المهني المرتبط بالإعلان غير موجود.");
  }
  const parseDate = (value: unknown, label: string) => {
    if (value === undefined || value === null || value === "") return null;
    const date = new Date(typeof value === "string" || typeof value === "number" ? value : NaN);
    if (Number.isNaN(date.getTime())) throw new InputError(`${label} غير صحيح.`);
    return date;
  };
  const startsAt = parseDate(values.startsAt, "تاريخ البداية"), endsAt = parseDate(values.endsAt, "تاريخ النهاية");
  if (startsAt && endsAt && endsAt <= startsAt) throw new InputError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
  const transition = isAdTransition(values.transition) ? values.transition : "random", motion = isAdMotion(values.motion) ? values.motion : "kenburns";
  const accentColor = isHexColor(values.accentColor) ? values.accentColor.toLowerCase() : "";
  return { title, caption, whatsapp, serviceId, startsAt, endsAt, template, transition, motion, accentColor, active: values.active !== false, durationSeconds: integerInput(values.durationSeconds ?? 6, AD_MIN_SECONDS, AD_MAX_SECONDS, "مدة عرض الإعلان بالثواني") };
}
/** Validates a village event from the admin form (dates arrive as local ISO strings from <input type="datetime-local">). */
function eventInput(values: Record<string, unknown>) {
  const title = cleanText(values.title, 160), location = cleanText(values.location, 160), description = cleanText(values.description, 1200);
  if (title.length < 3) throw new InputError("اكتب عنوان المناسبة.");
  const kind = isEventKind(values.kind) ? values.kind : "other";
  const startsAt = typeof values.startsAt === "string" ? new Date(values.startsAt) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) throw new InputError("اختر تاريخ ووقت المناسبة.");
  const endsAt = typeof values.endsAt === "string" && values.endsAt ? new Date(values.endsAt) : null;
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt.getTime() < startsAt.getTime())) throw new InputError("وقت النهاية لازم يكون بعد البداية.");
  return { title, kind, startsAt, endsAt, location, description, pinned: values.pinned === true };
}
/** أيقونة مرفوعة مع نموذج التصنيف: data URL = رفع/استبدال، "__remove__" = حذف، فارغ = بلا تغيير. */
async function applyCategoryIcon(categoryId: string, value: unknown) {
  if (typeof value !== "string" || !value) return;
  if (value === "__remove__") { await db.delete(categoryIcons).where(eq(categoryIcons.categoryId, categoryId)); return; }
  let image: { mime: string; base64: string };
  try { image = parseCategoryIconDataUrl(value); }
  catch (error) { throw new InputError(error instanceof Error ? error.message : "صورة الأيقونة غير صحيحة."); }
  image = await optimizeStoredImage(image, ICON_LIMITS);
  await db.insert(categoryIcons).values({ categoryId, mime: image.mime, data: image.base64, version: 1, updatedAt: new Date() })
    .onConflictDoUpdate({ target: categoryIcons.categoryId, set: { mime: image.mime, data: image.base64, version: sql`${categoryIcons.version} + 1`, updatedAt: new Date() } });
}
function adImageInput(value: unknown) {
  try { return parseAdImageDataUrl(value); }
  catch (error) { throw new InputError(error instanceof Error ? error.message : "صورة الإعلان غير صحيحة."); }
}

async function guard(request?: Request): Promise<"admin" | "moderator"> { return (await guardActor(request)).role; }
async function guardActor(request?: Request): Promise<ActivityActor> {
  if (request && !sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
  const viewer = await getViewer();
  if (viewer.role === "admin" || viewer.role === "moderator") { await ensureSeed(); return actorFromViewer(viewer); }
  throw new InputError(viewer.role === "member" ? "صلاحياتك لا تسمح بفتح لوحة الإدارة." : "يرجى تسجيل الدخول إلى لوحة الإدارة.", viewer.role === "member" ? 403 : 401);
}
function denyModerator() { throw new InputError("هذا الإجراء متاح للأدمن فقط.", 403); }
async function categoryParent(parentId: string | null, id?: string) {
  if (!parentId) return;
  const [parent] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, parentId)).limit(1);
  if (!parent || parent.parentId || parentId === id) throw new InputError("اختار تصنيفًا رئيسيًا صحيحًا. التخصص لا يمكن أن يكون تصنيفًا لنفسه.");
}
export async function GET() {
  try { const role = await guard(); return Response.json(await getAdminDirectory(role)); }
  catch (error) { return apiError(error); }
}
export const POST = withDirectoryInvalidation(async (request: Request) => {
  try {
    const actor = await guardActor(request), role = actor.role;
    const body = objectInput(await request.json());
    const activityLabel = await resolveActivityLabel(body.type, body.id, body.values);
    if (role === "moderator" && body.type !== "category" && body.type !== "area") denyModerator();
    if (body.type === "whatsapp-test") {
      const result = await sendAdminWhatsappAlert("✅ رسالة اختبار من دليل جنزور", "تنبيهات واتساب للإدارة تعمل بنجاح. ستصلك هنا الطلبات والتقييمات والاقتراحات الجديدة.", "test");
      if (!result.ok) throw new InputError(result.detail, result.skipped ? 400 : 502);
      return Response.json({ ok: true, detail: result.detail });
    }
    // صور المظهر (لوجو/سبلاش/بانرات): رفع من الجهاز بدل اللينك. data URL = رفع/استبدال، "__remove__" = حذف.
    if (body.type === "design-image") {
      if (!isDesignImageKey(body.key)) throw new InputError("نوع الصورة غير معروف.");
      if (body.image === "__remove__") {
        await db.delete(designImages).where(eq(designImages.key, body.key));
        await logActivity(actor, "POST", body, `حذف صورة المظهر (${body.key})`);
        return Response.json({ ok: true, url: "" });
      }
      // «__remove_bg__» = جعل خلفية الصورة المخزّنة شفافة (زر في الاستوديو) دون رفع جديد.
      if (body.image === "__remove_bg__") {
        const [stored] = await db.select({ mime: designImages.mime, data: designImages.data }).from(designImages).where(eq(designImages.key, body.key));
        if (!stored) throw new InputError("لا توجد صورة مرفوعة لهذا المكان.", 404);
        const result = await removeFlatBackground({ mime: stored.mime, base64: stored.data });
        if (!result.changed) throw new InputError(`تعذّر جعل الخلفية شفافة: ${result.reason || "لم تُكتشف خلفية صلبة"}. ارفع نسخة PNG شفافة بدلًا منها.`);
        const optimized = await optimizeStoredImage(result, designImageLimits(body.key));
        const [row] = await db.update(designImages).set({ mime: optimized.mime, data: optimized.base64, version: sql`${designImages.version} + 1`, updatedAt: new Date() })
          .where(eq(designImages.key, body.key)).returning({ version: designImages.version });
        await logActivity(actor, "POST", body, `إزالة خلفية صورة المظهر (${body.key})`);
        return Response.json({ ok: true, url: designImageUrl(body.key, row?.version ?? 1) });
      }
      let image: { mime: string; base64: string };
      try { image = parseDesignImageDataUrl(body.image); }
      catch (error) { throw new InputError(error instanceof Error ? error.message : "الصورة غير صحيحة."); }
      // الشعار وصورة شاشة البداية: إزالة الخلفية الصلبة تلقائيًا (إن وُجدت) لتظهر شفافة فوق خلفية التطبيق.
      if (autoTransparentKey(body.key) && body.keepBackground !== true) image = await removeFlatBackground(image);
      image = await optimizeStoredImage(image, designImageLimits(body.key));
      const [row] = await db.insert(designImages).values({ key: body.key, mime: image.mime, data: image.base64, version: 1, updatedAt: new Date() })
        .onConflictDoUpdate({ target: designImages.key, set: { mime: image.mime, data: image.base64, version: sql`${designImages.version} + 1`, updatedAt: new Date() } })
        .returning({ version: designImages.version });
      await logActivity(actor, "POST", body, `رفع صورة المظهر (${body.key})`);
      return Response.json({ ok: true, url: designImageUrl(body.key, row?.version ?? 1) });
    }
    // إجراءات الروابط لا ترسل values؛ لذا تُفحص قبل تحليل قيم النموذج.
    if (body.type === "service" && body.action === "availability-link") {
      const id = uuid(body.id);
      const [existing] = await db.select({ id: services.id, token: services.availabilityToken }).from(services).where(eq(services.id, id));
      if (!existing) throw new InputError("الخدمة غير موجودة.", 404);
      const token = existing.token || randomBytes(20).toString("hex");
      if (!existing.token) await db.update(services).set({ availabilityToken: token }).where(eq(services.id, id));
      await logActivity(actor, "POST", body, activityLabel);
      return Response.json({ ok: true, link: `/availability/${token}`, ...(await getAdminDirectory(role)) });
    }
    if (body.type === "service" && (body.action === "account-link" || body.action === "account-link-reset")) {
      // رابط «حسابي» لصاحب الخدمة: يُنشأ مرة ويُعاد استخدامه؛ «reset» يلغي القديم فورًا ويولّد غيره.
      const id = uuid(body.id);
      const [existing] = await db.select({ id: services.id, token: services.accountToken }).from(services).where(eq(services.id, id));
      if (!existing) throw new InputError("الخدمة غير موجودة.", 404);
      const reset = body.action === "account-link-reset";
      const token = !reset && existing.token ? existing.token : randomBytes(20).toString("hex");
      if (token !== existing.token) await db.update(services).set({ accountToken: token }).where(eq(services.id, id));
      await logActivity(actor, "POST", body, activityLabel);
      return Response.json({ ok: true, link: `/my/${token}`, ...(await getAdminDirectory(role)) });
    }
    const values = objectInput(body.values);
    if (body.type === "category") {
      const category = categoryInput(values);
      await categoryParent(category.parentId);
      const id = cleanText(values.slug, 60).toLowerCase() || `category-${randomBytes(5).toString("hex")}`;
      if (!/^[a-z][a-z0-9-]{1,59}$/.test(id)) throw new InputError("رابط التصنيف يكون حروفًا إنجليزية وأرقامًا وشرطات، بدون مسافات.");
      const siblings = await db.select({ total: count() }).from(directoryCategories).where(category.parentId ? eq(directoryCategories.parentId, category.parentId) : isNull(directoryCategories.parentId));
      // A new category without an explicit order lands at the end of its siblings instead of jumping to the top.
      const inserted = await db.insert(directoryCategories).values({ ...category, id, sortOrder: category.sortOrder || siblings[0].total }).onConflictDoNothing().returning();
      if (!inserted.length) throw new InputError("رابط التصنيف مستخدم بالفعل.", 409);
      await applyCategoryIcon(id, values.iconImage);
      const removed = await readDeletedCategoryIds();
      if (removed.delete(id)) await writeDeletedCategoryIds(removed);
    } else if (body.type === "area") {
      const name = cleanText(values.name, 80);
      if (name.length < 3 || name === "عنوان آخر") throw new InputError("أدخل عنوانًا صحيحًا. اختيار عنوان آخر موجود تلقائيًا.");
      const inserted = await db.insert(directoryAreas).values({ name, sortOrder: integerInput(values.sortOrder ?? 0, 0, 1000, "الترتيب") }).onConflictDoNothing().returning();
      if (!inserted.length) throw new InputError("العنوان موجود بالفعل.", 409);
    } else if (body.type === "ad") {
      const [{ total }] = await db.select({ total: count() }).from(adBanners);
      if (total >= AD_MAX_COUNT) throw new InputError(`الحد الأقصى ${AD_MAX_COUNT} إعلانات. احذف إعلانًا قديمًا أولًا.`);
      const fields = await adInput(values), image = values.image || !fields.template ? adImageInput(values.image) : null;
      await db.insert(adBanners).values({ ...fields, imageMime: image?.mime ?? "", imageData: image?.base64 ?? "", imageVersion: 1, sortOrder: total });
    } else if (body.type === "event") {
      await db.insert(villageEvents).values(eventInput(values));
    } else if (body.type === "service") {
      const { photo, ...basics } = await serviceInput(values, true), status = statusInput(values.status ?? "pending");
      const [createdService] = await db.insert(services).values({ ...basics, ...availabilityInput(values.availabilityAction), status, verified: status === "approved" && values.verified === true, featured: status === "approved" && values.featured === true, demo: false }).returning({ id: services.id });
      await saveServicePhoto(db, createdService.id, photo);
    } else throw new InputError("نوع الإضافة غير صحيح.");
    await logActivity(actor, "POST", body, activityLabel);
    return Response.json({ ok: true, ...(await getAdminDirectory(role)) }, { status: 201 });
  } catch (error) { return apiError(error); }
});
export const PATCH = withDirectoryInvalidation(async (request: Request) => {
  try {
    const actor = await guardActor(request), role = actor.role;
    const body = objectInput(await request.json());
    const { type, action } = body;
    const activityLabel = await resolveActivityLabel(type, body.id, body.values);
    if (type === "community") throw new InputError("تم إلغاء سوق جنزور المجتمعي.", 410);
    const moderatorAllowed = type === "category" || type === "area" || type === "rating" || (type === "notification" && (action === "read" || action === "read-all")) || ((type === "service" || type === "community") && ["approve", "reject", "request-info", "request-completion", "approve-completion", "reject-completion", "notify-provider", "sold", "filled", "availability-link", "account-link", "account-link-reset"].includes(String(action)));
    if (role === "moderator" && !moderatorAllowed) denyModerator();
    if (type === "settings") {
      const settings = settingsInput(objectInput(body.values));
      await db.insert(directorySettings).values({ key: "site_config", value: JSON.stringify(settings) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(settings) } });
    } else if (type === "design-settings") {
      const designSettings = sanitizeDesignSettings(objectInput(body.values));
      await db.insert(directorySettings).values({ key: "design_config", value: JSON.stringify(designSettings) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(designSettings) } });
    } else if (type === "codes-settings") {
      const telecomSettings = sanitizeTelecomSettings(objectInput(body.values));
      await db.insert(directorySettings).values({ key: "telecom_config", value: JSON.stringify(telecomSettings) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(telecomSettings) } });
    } else if (type === "ad-pricing") {
      const pricing = sanitizeAdPricing(body.values);
      await db.insert(directorySettings).values({ key: "ad_pricing", value: JSON.stringify(pricing) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(pricing) } });
    } else if (type === "whatsapp-alert-kinds") {
      await saveWhatsappAlertKinds(body.kinds);
    } else if (type === "greetings") {
      const greetings = sanitizeGreetingSettings(body.values);
      await db.insert(directorySettings).values({ key: "greetings", value: JSON.stringify(greetings) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(greetings) } });
    } else if (type === "event") {
      const id = uuid(body.id);
      if (action === "pin") await db.update(villageEvents).set({ pinned: body.pinned === true }).where(eq(villageEvents.id, id));
      else await db.update(villageEvents).set(eventInput(objectInput(body.values))).where(eq(villageEvents.id, id));
    } else if (type === "admin-palette") {
      const palette = sanitizeAdminPalette(body.palette);
      await db.insert(directorySettings).values({ key: "admin_palette", value: palette }).onConflictDoUpdate({ target: directorySettings.key, set: { value: palette } });
    } else if (type === "utility-numbers") {
      const utilityNumbers = sanitizeUtilityNumbers(body.utilityNumbers);
      await db.insert(directorySettings).values({ key: "utility_numbers", value: JSON.stringify(utilityNumbers) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(utilityNumbers) } });
    } else if (type === "notification") {
      if (action === "read-all") await db.update(notifications).set({ read: true }).where(role === "moderator" ? and(eq(notifications.read, false), inArray(notifications.type, ["service", "rating"])) : eq(notifications.read, false));
      else if (action === "read") await db.update(notifications).set({ read: true }).where(role === "moderator" ? and(eq(notifications.id, uuid(body.id)), inArray(notifications.type, ["service", "rating"])) : eq(notifications.id, uuid(body.id)));
      else throw new InputError("إجراء غير صحيح.");
    } else if (type === "ad") {
      const id = uuid(body.id);
      const [existing] = await db.select().from(adBanners).where(eq(adBanners.id, id));
      if (!existing) throw new InputError("الإعلان غير موجود.", 404);
      if (action === "move") {
        const direction = body.direction === "up" ? -1 : body.direction === "down" ? 1 : 0;
        if (!direction) throw new InputError("اتجاه الترتيب غير صحيح.");
        const rows = await db.select({ id: adBanners.id, sortOrder: adBanners.sortOrder }).from(adBanners).orderBy(asc(adBanners.sortOrder), asc(adBanners.createdAt));
        const index = rows.findIndex((row) => row.id === id), target = index + direction;
        if (index < 0 || target < 0 || target >= rows.length) throw new InputError(direction < 0 ? "الإعلان في أول الترتيب بالفعل." : "الإعلان في آخر الترتيب بالفعل.");
        const reordered = [...rows];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        await db.transaction(async (tx) => { for (const [position, row] of reordered.entries()) await tx.update(adBanners).set({ sortOrder: position }).where(eq(adBanners.id, row.id)); });
      } else if (action === "toggle") {
        await db.update(adBanners).set({ active: !existing.active }).where(eq(adBanners.id, id));
      } else {
        const values = objectInput(body.values), fields = await adInput(values);
        const image = values.image ? adImageInput(values.image) : null;
        const removeImage = fields.template && values.removeImage === true && !image;
        if (!fields.template && !image && !existing.imageData) throw new InputError("ارفع صورة الإعلان أو اختر قالبًا جاهزًا.");
        await db.update(adBanners).set({ ...fields, ...(image ? { imageMime: image.mime, imageData: image.base64, imageVersion: existing.imageVersion + 1 } : {}), ...(removeImage ? { imageMime: "", imageData: "" } : {}) }).where(eq(adBanners.id, id));
      }
    } else if (type === "ad-request") {
      const id = uuid(body.id);
      const status = action === "handle" ? "handled" : action === "reopen" ? "new" : null;
      if (!status) throw new InputError("إجراء غير معروف.");
      await db.update(adRequests).set({ status }).where(eq(adRequests.id, id));
      if (status === "handled") await db.update(notifications).set({ read: true }).where(and(eq(notifications.type, "ad-request"), eq(notifications.entityId, id)));
    } else if (type === "category" && action === "move") {
      const id = cleanText(body.id, 60), direction = body.direction === "up" ? -1 : body.direction === "down" ? 1 : 0;
      if (!direction) throw new InputError("اتجاه الترتيب غير صحيح.");
      const [current] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, id));
      if (!current) throw new InputError("التصنيف غير موجود.", 404);
      const siblings = await db.select().from(directoryCategories).where(current.parentId ? eq(directoryCategories.parentId, current.parentId) : isNull(directoryCategories.parentId)).orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name));
      const index = siblings.findIndex((item) => item.id === id), target = index + direction;
      if (index < 0 || target < 0 || target >= siblings.length) throw new InputError(direction < 0 ? "التصنيف في أول الترتيب بالفعل." : "التصنيف في آخر الترتيب بالفعل.");
      const reordered = [...siblings];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      // Siblings are renumbered sequentially so ties (several rows sharing one sortOrder) cannot undo the move.
      await db.transaction(async (tx) => {
        for (const [position, item] of reordered.entries()) if (item.sortOrder !== position) await tx.update(directoryCategories).set({ sortOrder: position }).where(eq(directoryCategories.id, item.id));
      });
    } else if (type === "category") {
      const id = cleanText(body.id, 60), values = categoryInput(objectInput(body.values));
      const [existing] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, id));
      if (!existing) throw new InputError("التصنيف غير موجود.", 404);
      await categoryParent(values.parentId, id);
      if (Boolean(existing.parentId) !== Boolean(values.parentId)) {
        const children = await db.select({ total: count() }).from(directoryCategories).where(eq(directoryCategories.parentId, id));
        const attached = await db.select({ total: count() }).from(services).where(eq(services.category, id));
        if (children[0].total || attached[0].total) throw new InputError("انقل التخصصات والمهن المرتبطة أولًا قبل تغيير نوع التصنيف.");
      }
      await db.update(directoryCategories).set(values).where(eq(directoryCategories.id, id));
      await applyCategoryIcon(id, objectInput(body.values).iconImage);
    } else if (type === "area") {
      const id = uuid(body.id), values = objectInput(body.values), name = cleanText(values.name, 80);
      const [existing] = await db.select().from(directoryAreas).where(eq(directoryAreas.id, id));
      if (!existing) throw new InputError("العنوان غير موجود.", 404);
      if (name.length < 3 || name === "عنوان آخر") throw new InputError("أدخل عنوانًا صحيحًا.");
      const [duplicate] = await db.select().from(directoryAreas).where(eq(directoryAreas.name, name));
      if (duplicate && duplicate.id !== id) throw new InputError("العنوان موجود بالفعل.", 409);
      await db.transaction(async (tx) => {
        await tx.update(services).set({ address: name }).where(and(eq(services.area, existing.name), eq(services.address, existing.name)));
        await tx.update(services).set({ area: name }).where(eq(services.area, existing.name));
        await tx.update(directoryAreas).set({ name, sortOrder: integerInput(values.sortOrder ?? 0, 0, 1000, "الترتيب") }).where(eq(directoryAreas.id, id));
      });
    } else if (type === "service") {
      const id = uuid(body.id);
      const [existing] = await db.select().from(services).where(eq(services.id, id));
      if (!existing) throw new InputError("الخدمة غير موجودة.", 404);
      if (action === "edit") {
        const values = objectInput(body.values), { photo, ...basics } = await serviceInput(values, true), status = statusInput(values.status);
        await saveServicePhoto(db, id, photo);
        const reviewNote = cleanText(values.reviewNote || existing.reviewNote, 1000);
        if ((status === "rejected" || status === "needs-info") && reviewNote.length < 3) throw new InputError("اكتب سبب الرفض أو البيانات المطلوبة.");
        await db.update(services).set({ ...basics, ...availabilityInput(values.availabilityAction, existing), status, reviewNote: status === "approved" || status === "pending" ? "" : reviewNote, verified: status === "approved" && values.verified === true, featured: status === "approved" && values.featured === true, demo: typeof values.demo === "boolean" ? values.demo : existing.demo }).where(eq(services.id, id));
      } else if (action === "approve") {
        await serviceInput({ ...existing, photo: undefined }, false);
        await db.update(services).set({ status: "approved", verified: true, reviewNote: "" }).where(eq(services.id, id));
      } else if (action === "reject" || action === "request-info") {
        const reviewNote = cleanText(body.reviewNote ?? "", 1000);
        if (reviewNote.length < 3) throw new InputError("اكتب سبب الرفض أو البيانات المطلوب استكمالها.");
        if (action === "request-info" && existing.status === "approved") throw new InputError("طلب الاستكمال متاح للطلبات غير المنشورة فقط.");
        await db.update(services).set({ status: action === "reject" ? "rejected" : "needs-info", reviewNote, ...(action === "request-info" ? { completionStatus: "requested", completionNote: reviewNote } : {}), verified: false, featured: false }).where(eq(services.id, id));
        if (action === "request-info") {
          await db.insert(notifications).values({ type: "provider", title: `مطلوب استكمال بيانات: ${existing.name}`, message: reviewNote.slice(0, 300), entityId: existing.id });
        }
      } else if (action === "request-completion") {
        const completionNote = cleanText(body.completionNote ?? "", 500);
        await db.update(services).set({ completionStatus: "requested", completionNote }).where(eq(services.id, id));
        await db.insert(notifications).values({
          type: "provider",
          title: `مطلوب استكمال بيانات: ${existing.name}`,
          message: (completionNote || `يرجى الضغط على زر استكمال البيانات لتحديث بيانات مهنتك «${existing.name}» في دليل جنزور.`).slice(0, 300),
          entityId: existing.id,
        });
      } else if (action === "approve-completion") {
        const draft = existing.completionDraft;
        const nextValues = draft
          ? {
              name: draft.name || existing.name,
              category: draft.category || existing.category,
              area: draft.area || existing.area,
              address: draft.address || existing.address,
              phone: draft.phone || existing.phone,
              phoneSecondary: draft.phoneSecondary ?? existing.phoneSecondary,
              description: draft.description || existing.description,
              subSpecialties: Array.isArray(draft.subSpecialties) ? draft.subSpecialties : existing.subSpecialties,
              serviceItems: Array.isArray(draft.serviceItems) ? draft.serviceItems : existing.serviceItems,
              emergency: typeof draft.emergency === "boolean" ? draft.emergency : existing.emergency,
            }
          : {};
        await db.update(services).set({ ...nextValues, completionStatus: "none", completionNote: "", completionDraft: null }).where(eq(services.id, id));
        await db.insert(notifications).values({
          type: "provider",
          title: `تمت الموافقة على استكمال بيانات: ${existing.name}`,
          message: `اعتمدت الإدارة التحديثات الجديدة لبيانات «${existing.name}» في دليل جنزور.`,
          entityId: existing.id,
        });
      } else if (action === "reject-completion") {
        const completionNote = cleanText(body.completionNote ?? "", 500) || "يرجى مراجعة البيانات المدخلة وتصحيح الخطأ ثم إعادة الإرسال.";
        await db.update(services).set({ completionStatus: "rejected", completionNote }).where(eq(services.id, id));
        await db.insert(notifications).values({
          type: "provider",
          title: `مطلوب تصحيح بيانات: ${existing.name}`,
          message: completionNote.slice(0, 300),
          entityId: existing.id,
        });
      } else if (action === "notify-provider") {
        const notifTitle = cleanText(body.title ?? "", 160) || `إشعار إلى ${existing.name}`;
        const notifMessage = cleanText(body.message ?? "", 300);
        if (!notifMessage) throw new InputError("نص الإشعار مطلوب.");
        await db.insert(notifications).values({
          type: "provider",
          title: notifTitle,
          message: notifMessage,
          entityId: existing.id,
        });
      }
      else if (action === "feature" && existing.status === "approved") await db.update(services).set({ featured: !existing.featured }).where(eq(services.id, id));
      else throw new InputError("إجراء غير صحيح. لا يمكن تمييز خدمة قبل نشرها.");
    } else if (type === "community") {
      const id = uuid(body.id);
      const [existing] = await db.select().from(communityListings).where(eq(communityListings.id, id));
      if (!existing) throw new InputError("إعلان المجتمع غير موجود.", 404);
      if (action === "approve") await db.update(communityListings).set({ status: "approved" }).where(eq(communityListings.id, id));
      else if (action === "reject") await db.update(communityListings).set({ status: "rejected" }).where(eq(communityListings.id, id));
      // "تم البيع" closes a property ad and "تم شغل الوظيفة" closes a job ad; both hide the listing from the public.
      else if (action === "sold") {
        if (existing.type !== "property") throw new InputError("زر «تم البيع» متاح لإعلانات العقارات فقط.");
        await db.update(communityListings).set({ status: "sold" }).where(eq(communityListings.id, id));
      } else if (action === "filled") {
        if (existing.type !== "job") throw new InputError("زر «تم شغل الوظيفة» متاح لإعلانات الوظائف فقط.");
        await db.update(communityListings).set({ status: "filled" }).where(eq(communityListings.id, id));
      } else throw new InputError("الإجراء غير صحيح.");
    } else if (type === "rating") {
      const id = uuid(body.id);
      const [existing] = await db.select().from(serviceRatings).where(eq(serviceRatings.id, id));
      if (!existing) throw new InputError("التقييم غير موجود.", 404);
      if (action === "approve") await db.update(serviceRatings).set({ status: "approved" }).where(eq(serviceRatings.id, id));
      else if (action === "reject") await db.update(serviceRatings).set({ status: "rejected" }).where(eq(serviceRatings.id, id));
      else throw new InputError("إجراء غير صحيح.");
    } else if (type === "member") {
      const id = uuid(body.id), values = objectInput(body.values);
      const [existing] = await db.select().from(members).where(eq(members.id, id));
      if (!existing) throw new InputError("العضو غير موجود.", 404);
      const name = cleanText(values.name ?? existing.name, 120), phone = cleanPhone(values.phone ?? existing.phone);
      if (name.length < 3 || !validPhone(phone)) throw new InputError("اسم العضو أو رقم الهاتف غير صحيح.");
      const active = typeof values.active === "boolean" ? values.active : existing.active;
      const requestedRole = values.role ?? existing.role;
      if (requestedRole !== "member" && requestedRole !== "moderator") throw new InputError("رتبة العضو غير صحيحة.");
      await db.update(members).set({ name, phone, role: requestedRole, active }).where(eq(members.id, id));
      if (!active) await db.delete(memberSessions).where(eq(memberSessions.memberId, id));
    } else throw new InputError("نوع التعديل غير صحيح.");
    if ((type === "service" || type === "community" || type === "rating") && ["approve", "reject", "sold", "filled"].includes(String(action))) {
      await db.update(notifications).set({ read: true }).where(and(eq(notifications.entityId, uuid(body.id)), eq(notifications.type, type === "community" ? "community" : type)));
    }
    await logActivity(actor, "PATCH", body, activityLabel);
    return Response.json({ ok: true, ...(await getAdminDirectory(role)) });
  } catch (error) { return apiError(error); }
});
export const DELETE = withDirectoryInvalidation(async (request: Request) => {
  try {
    const actor = await guardActor(request), role = actor.role;
    const body = objectInput(await request.json());
    const { type, action } = body;
    const activityLabel = await resolveActivityLabel(type, body.id, body.values);
    const bulkNotificationAction = type === "notification" && (action === "delete-all" || action === "delete-selected");
    if (role === "moderator" && type !== "category" && type !== "area" && !bulkNotificationAction) denyModerator();
    if (type === "service" && action === "purge-all") {
      if (role !== "admin") denyModerator();
      if (body.confirm !== "تفريغ") throw new InputError("اكتب كلمة «تفريغ» لتأكيد مسح جدول المهنيين.");
      const [{ total }] = await db.select({ total: count() }).from(services);
      await db.delete(services);
      await db.delete(notifications).where(inArray(notifications.type, ["service", "rating"]));
      await logActivity(actor, "DELETE", body, activityLabel, `${total} مهنة`);
      return Response.json({ ok: true, removed: total, ...(await getAdminDirectory(role)) });
    }
    if (bulkNotificationAction) {
      if (action === "delete-all") {
        if (role === "moderator") await db.delete(notifications).where(inArray(notifications.type, ["service", "rating"]));
        else await db.delete(notifications);
      } else {
        if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 200) throw new InputError("اختار إشعارًا واحدًا على الأقل للحذف.");
        const ids = [...new Set(body.ids.map(uuid))];
        const condition = inArray(notifications.id, ids);
        await db.delete(notifications).where(role === "moderator" ? and(condition, inArray(notifications.type, ["service", "rating"])) : condition);
      }
    } else if (type === "category") {
      const id = cleanText(body.id, 60);
      const children = await db.select({ total: count() }).from(directoryCategories).where(eq(directoryCategories.parentId, id));
      const attached = await db.select({ total: count() }).from(services).where(eq(services.category, id));
      if (children[0].total || attached[0].total) throw new InputError("التصنيف مرتبط بتخصصات أو مهن. انقلها أو احذفها أولًا، أو أخفِ التصنيف بدل الحذف.", 409);
      await db.delete(directoryCategories).where(eq(directoryCategories.id, id));
      await db.delete(categoryIcons).where(eq(categoryIcons.categoryId, id));
      // Remember the deletion so the built-in seed never re-creates this category on the next start.
      const removed = await readDeletedCategoryIds();
      removed.add(id);
      await writeDeletedCategoryIds(removed);
    } else if (type === "area") {
      const id = uuid(body.id), [area] = await db.select().from(directoryAreas).where(eq(directoryAreas.id, id));
      if (!area) throw new InputError("العنوان غير موجود.", 404);
      const attached = await db.select({ total: count() }).from(services).where(eq(services.area, area.name));
      if (attached[0].total) throw new InputError("انقل المهن المرتبطة بالعنوان إلى عنوان آخر قبل حذفه.", 409);
      await db.delete(directoryAreas).where(eq(directoryAreas.id, id));
    } else {
      const id = uuid(body.id);
      if (type === "service") await db.delete(services).where(eq(services.id, id));
      else if (type === "community") await db.delete(communityListings).where(eq(communityListings.id, id));
      else if (type === "member") await db.delete(members).where(eq(members.id, id));
      else if (type === "notification") await db.delete(notifications).where(eq(notifications.id, id));
      else if (type === "rating") await db.delete(serviceRatings).where(eq(serviceRatings.id, id));
      else if (type === "ad") await db.delete(adBanners).where(eq(adBanners.id, id));
      else if (type === "ad-request") { await db.delete(adRequests).where(eq(adRequests.id, id)); await db.delete(notifications).where(and(eq(notifications.type, "ad-request"), eq(notifications.entityId, id))); }
      else if (type === "event") await db.delete(villageEvents).where(eq(villageEvents.id, id));
      else throw new InputError("نوع الحذف غير صحيح.");
      if (["service", "community", "member"].includes(String(type))) await db.delete(notifications).where(eq(notifications.entityId, id));
    }
    await logActivity(actor, "DELETE", body, activityLabel);
    return Response.json({ ok: true, ...(await getAdminDirectory(role)) });
  } catch (error) { return apiError(error); }
});

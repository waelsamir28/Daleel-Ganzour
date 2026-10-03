import { randomBytes } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { advertisements, directoryAreas, directoryCategories, directorySettings, members, memberSessions, notifications, services } from "@/db/schema";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { getAdminDirectory, getSettings } from "@/lib/directory";
import { adInput, apiError, categoryInput, InputError, integerInput, objectInput, serviceInput, settingsInput } from "@/lib/inputs";
import { cleanPhone, cleanText, validId, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";
const statusInput = (value: unknown) => {
  if (typeof value !== "string" || !["pending", "approved", "rejected"].includes(value)) throw new InputError("حالة غير صحيحة.");
  return value;
};
function uuid(value: unknown) { if (!validId(value)) throw new InputError("معرّف غير صحيح."); return value; }
async function guard(request?: Request) {
  if (request && !sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
  if (!(await isAdmin())) throw new InputError("اللوحة متاحة للأدمن فقط. يرجى تسجيل الدخول.", 401);
}
async function categoryParent(parentId: string | null, id?: string) {
  if (!parentId) return;
  const [parent] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, parentId)).limit(1);
  if (!parent || parent.parentId || parentId === id) throw new InputError("اختار تصنيفًا رئيسيًا صحيحًا. التخصص لا يمكن أن يكون تصنيفًا لنفسه.");
}
async function adValues(values: Record<string, unknown>) {
  const basics = adInput(values), settings = await getSettings();
  const status = statusInput(values.status ?? "pending"), paid = values.paid === true;
  if (status === "approved" && !paid) throw new InputError("أكد استلام المقابل قبل نشر الإعلان.");
  let expiresAt: Date | null = null;
  if (typeof values.expiresAt === "string" && values.expiresAt) { expiresAt = new Date(values.expiresAt); if (Number.isNaN(expiresAt.getTime())) throw new InputError("تاريخ انتهاء الإعلان غير صحيح."); }
  else if (values.expiresAt === undefined && status === "approved") expiresAt = new Date(Date.now() + settings.adDays * 86400000);
  return { ...basics, status, paid, expiresAt, price: integerInput(values.price ?? settings.adPrice, 0, 100000, "سعر الإعلان") };
}
export async function GET() {
  try { await guard(); return Response.json(await getAdminDirectory()); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    await guard(request);
    const body = objectInput(await request.json()), values = objectInput(body.values);
    if (body.type === "category") {
      const category = categoryInput(values);
      await categoryParent(category.parentId);
      const id = cleanText(values.slug, 60).toLowerCase() || `category-${randomBytes(5).toString("hex")}`;
      if (!/^[a-z][a-z0-9-]{1,59}$/.test(id)) throw new InputError("رابط التصنيف يكون حروفًا إنجليزية وأرقامًا وشرطات، بدون مسافات.");
      const inserted = await db.insert(directoryCategories).values({ ...category, id }).onConflictDoNothing().returning();
      if (!inserted.length) throw new InputError("رابط التصنيف مستخدم بالفعل.", 409);
    } else if (body.type === "area") {
      const name = cleanText(values.name, 80);
      if (name.length < 3 || name === "عنوان آخر") throw new InputError("أدخل عنوانًا صحيحًا. اختيار عنوان آخر موجود تلقائيًا.");
      const inserted = await db.insert(directoryAreas).values({ name, sortOrder: integerInput(values.sortOrder ?? 0, 0, 1000, "الترتيب") }).onConflictDoNothing().returning();
      if (!inserted.length) throw new InputError("العنوان موجود بالفعل.", 409);
    } else if (body.type === "service") {
      const basics = await serviceInput(values, true), status = statusInput(values.status ?? "pending");
      await db.insert(services).values({ ...basics, status, verified: status === "approved" && values.verified === true, featured: status === "approved" && values.featured === true, demo: false });
    } else if (body.type === "ad") {
      await db.insert(advertisements).values(await adValues(values));
    } else throw new InputError("نوع الإضافة غير صحيح.");
    return Response.json({ ok: true, ...(await getAdminDirectory()) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    await guard(request);
    const body = objectInput(await request.json());
    const { type, action } = body;
    if (type === "settings") {
      const settings = settingsInput(objectInput(body.values));
      await db.insert(directorySettings).values({ key: "site_config", value: JSON.stringify(settings) }).onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(settings) } });
    } else if (type === "notification") {
      if (action === "read-all") await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
      else if (action === "read") await db.update(notifications).set({ read: true }).where(eq(notifications.id, uuid(body.id)));
      else throw new InputError("إجراء غير صحيح.");
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
        const values = objectInput(body.values), basics = await serviceInput(values, true), status = statusInput(values.status);
        await db.update(services).set({ ...basics, status, verified: status === "approved" && values.verified === true, featured: status === "approved" && values.featured === true, demo: typeof values.demo === "boolean" ? values.demo : existing.demo }).where(eq(services.id, id));
      } else if (action === "approve") {
        await serviceInput({ ...existing }, false);
        await db.update(services).set({ status: "approved", verified: true }).where(eq(services.id, id));
      } else if (action === "reject") await db.update(services).set({ status: "rejected", verified: false, featured: false }).where(eq(services.id, id));
      else if (action === "feature" && existing.status === "approved") await db.update(services).set({ featured: !existing.featured }).where(eq(services.id, id));
      else throw new InputError("إجراء غير صحيح. لا يمكن تمييز خدمة قبل نشرها.");
    } else if (type === "ad") {
      const id = uuid(body.id);
      const [existing] = await db.select().from(advertisements).where(eq(advertisements.id, id));
      if (!existing) throw new InputError("الإعلان غير موجود.", 404);
      if (action === "edit") await db.update(advertisements).set(await adValues(objectInput(body.values))).where(eq(advertisements.id, id));
      else if (action === "approve") {
        const settings = await getSettings();
        await db.update(advertisements).set({ status: "approved", paid: true, expiresAt: new Date(Date.now() + settings.adDays * 86400000) }).where(eq(advertisements.id, id));
      } else if (action === "reject") await db.update(advertisements).set({ status: "rejected" }).where(eq(advertisements.id, id));
      else throw new InputError("إجراء غير صحيح.");
    } else if (type === "member") {
      const id = uuid(body.id), values = objectInput(body.values);
      const [existing] = await db.select().from(members).where(eq(members.id, id));
      if (!existing) throw new InputError("العضو غير موجود.", 404);
      const name = cleanText(values.name ?? existing.name, 120), phone = cleanPhone(values.phone ?? existing.phone);
      if (name.length < 3 || !validPhone(phone)) throw new InputError("اسم العضو أو رقم الهاتف غير صحيح.");
      const active = typeof values.active === "boolean" ? values.active : existing.active;
      await db.update(members).set({ name, phone, active }).where(eq(members.id, id));
      if (!active) await db.delete(memberSessions).where(eq(memberSessions.memberId, id));
    } else throw new InputError("نوع التعديل غير صحيح.");
    if ((type === "service" || type === "ad") && (action === "approve" || action === "reject")) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.entityId, uuid(body.id)));
    }
    return Response.json({ ok: true, ...(await getAdminDirectory()) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    await guard(request);
    const body = objectInput(await request.json());
    const { type } = body;
    if (type === "category") {
      const id = cleanText(body.id, 60);
      const children = await db.select({ total: count() }).from(directoryCategories).where(eq(directoryCategories.parentId, id));
      const attached = await db.select({ total: count() }).from(services).where(eq(services.category, id));
      if (children[0].total || attached[0].total) throw new InputError("التصنيف مرتبط بتخصصات أو مهن. انقلها أو احذفها أولًا، أو أخفِ التصنيف بدل الحذف.", 409);
      await db.delete(directoryCategories).where(eq(directoryCategories.id, id));
    } else if (type === "area") {
      const id = uuid(body.id), [area] = await db.select().from(directoryAreas).where(eq(directoryAreas.id, id));
      if (!area) throw new InputError("العنوان غير موجود.", 404);
      const attached = await db.select({ total: count() }).from(services).where(eq(services.area, area.name));
      if (attached[0].total) throw new InputError("انقل المهن المرتبطة بالعنوان إلى عنوان آخر قبل حذفه.", 409);
      await db.delete(directoryAreas).where(eq(directoryAreas.id, id));
    } else {
      const id = uuid(body.id);
      if (type === "service") await db.delete(services).where(eq(services.id, id));
      else if (type === "ad") await db.delete(advertisements).where(eq(advertisements.id, id));
      else if (type === "member") await db.delete(members).where(eq(members.id, id));
      else if (type === "notification") await db.delete(notifications).where(eq(notifications.id, id));
      else throw new InputError("نوع الحذف غير صحيح.");
      if (["service", "ad", "member"].includes(String(type))) await db.delete(notifications).where(eq(notifications.entityId, id));
    }
    return Response.json({ ok: true, ...(await getAdminDirectory()) });
  } catch (error) { return apiError(error); }
}

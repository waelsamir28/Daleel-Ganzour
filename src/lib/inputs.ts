import "server-only";
import { databaseConfigured, db } from "@/db";
import { directoryAreas, directoryCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { defaultSettings, iconNames, OTHER_ADDRESS, type SiteSettings } from "@/lib/catalog";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";
import { ensureSeed } from "@/lib/directory";

export class InputError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("بيانات الطلب غير صحيحة.");
  return value as Record<string, unknown>;
}
export function integerInput(value: unknown, min: number, max: number, label: string) {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(number) || number < min || number > max) throw new InputError(`${label} يجب أن يكون بين ${min} و ${max}.`);
  return number;
}
export async function serviceInput(body: Record<string, unknown>, admin = false) {
  await ensureSeed();
  const name = cleanText(body.name, 160), description = cleanText(body.description, 1000), phone = cleanPhone(body.phone);
  const phoneSecondary = cleanPhone(body.phoneSecondary ?? "");
  const category = cleanText(body.category, 60), area = cleanText(body.area, 80);
  let address = cleanText(body.address, 240);
  const [selected] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, category)).limit(1);
  const [root] = selected?.parentId ? await db.select().from(directoryCategories).where(eq(directoryCategories.id, selected.parentId)).limit(1) : [];
  const [selectedArea] = await db.select().from(directoryAreas).where(eq(directoryAreas.name, area)).limit(1);
  if (name.length < 3 || description.length < 10 || !validPhone(phone) || (phoneSecondary && !validPhone(phoneSecondary)) || !selected?.parentId || (!admin && (!selected.active || !root?.active))) throw new InputError("أكمل الاسم ووصف الخدمة، واختر تخصصًا صحيحًا، وأدخل رقم هاتف مصري صحيح.");
  if (area === OTHER_ADDRESS) { if (address.length < 3) throw new InputError("اكتب العنوان الآخر في الخانة المخصصة."); }
  else if (!selectedArea && !admin) throw new InputError("اختار عنوانًا من عناوين جنزور أو اختار عنوان آخر.");
  if (!area) throw new InputError("اختار العنوان.");
  if (!address) address = area;
  return { name, description, phone, phoneSecondary, category, area, address, emergency: body.emergency === true };
}
export function categoryInput(body: Record<string, unknown>) {
  const name = cleanText(body.name, 100), description = cleanText(body.description, 240);
  const parentId = cleanText(body.parentId, 60) || null;
  const color = cleanText(body.color, 7), icon = cleanText(body.icon, 40);
  if (name.length < 2 || !/^#[0-9a-f]{6}$/i.test(color) || !iconNames.includes(icon)) throw new InputError("أدخل اسمًا صحيحًا، واختار لونًا وأيقونة من القائمة.");
  return { name, description, parentId, color, icon, sortOrder: integerInput(body.sortOrder ?? 0, 0, 1000, "الترتيب"), active: body.active !== false };
}
export function settingsInput(body: Record<string, unknown>): SiteSettings {
  const next = { ...defaultSettings };
  const textKeys = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright"] as const;
  for (const key of textKeys) { const value = cleanText(body[key], key === "contactText" ? 500 : 240); if (!value) throw new InputError("حقول نصوص الموقع مطلوبة."); next[key] = value; }
  next.phone = cleanPhone(body.phone); if (!validPhone(next.phone)) throw new InputError("رقم تواصل المكتب غير صحيح.");
  next.showEmergency = body.showEmergency === true;
  return next;
}
export function apiError(error: unknown) {
  if (!databaseConfigured) return Response.json({ error: "الحفظ غير متاح في وضع المعاينة دون قاعدة بيانات." }, { status: 503 });
  if (error instanceof InputError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "بيانات الطلب غير صحيحة." }, { status: 400 });
  console.error("Directory request failed", error);
  return Response.json({ error: "تعذر تنفيذ الطلب. حاول مرة أخرى." }, { status: 500 });
}

import "server-only";
import { databaseConfigured, db } from "@/db";
import { directoryAreas, directoryCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { categoryArtOptions, defaultSettings, iconNames, OTHER_ADDRESS, parseWorkingHours, parseServiceItems, type SiteSettings } from "@/lib/catalog";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";
import { ensureSeed } from "@/lib/directory";
import { normalizeWhatsappNumber } from "@/lib/whatsapp-alert-kinds";

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
  const hours = cleanText(body.hours ?? "", 120), menuUrl = cleanText(body.menuUrl ?? "", 500), menuWhatsapp = cleanPhone(body.menuWhatsapp ?? "");
  let workingHours, serviceItems, subSpecialties;
  try {
    workingHours = parseWorkingHours(admin ? body.workingHours : undefined);
    serviceItems = parseServiceItems(body.serviceItems);
    subSpecialties = parseServiceItems(body.subSpecialties);
  }
  catch (error) { throw new InputError(error instanceof Error ? error.message : "مواعيد العمل غير صحيحة."); }
  return { name, description, phone, phoneSecondary, category, area, address, emergency: body.emergency === true, hours, menuUrl, menuWhatsapp, serviceItems, subSpecialties, ...(admin ? { workingHours, neededRank: integerInput(body.neededRank ?? 0, 0, 1000, "ترتيب الأكثر احتياجًا") } : {}) };
}
export function categoryInput(body: Record<string, unknown>) {
  const name = cleanText(body.name, 100), description = cleanText(body.description, 240);
  const parentId = cleanText(body.parentId, 60) || null;
  const color = cleanText(body.color, 7), icon = cleanText(body.icon, 40), art = cleanText(body.art, 40);
  if (name.length < 2 || !/^#[0-9a-f]{6}$/i.test(color) || !iconNames.includes(icon)) throw new InputError("أدخل اسمًا صحيحًا، واختار لونًا وأيقونة من القائمة.");
  if (art && !categoryArtOptions.some((option) => option.id === art)) throw new InputError("اختار أيقونة مجسمة من القائمة.");
  return { name, description, parentId, color, icon, art: parentId ? "" : art, sortOrder: integerInput(body.sortOrder ?? 0, 0, 1000, "الترتيب"), active: body.active !== false };
}
export function settingsInput(body: Record<string, unknown>): SiteSettings {
  const next = { ...defaultSettings };
  const textKeys = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright"] as const;
  for (const key of textKeys) { const value = cleanText(body[key], key === "contactText" ? 500 : 240); if (!value) throw new InputError("حقول نصوص الموقع مطلوبة."); next[key] = value; }
  next.phone = cleanPhone(body.phone); if (!validPhone(next.phone)) throw new InputError("رقم تواصل المكتب غير صحيح.");
  next.showEmergency = body.showEmergency === true;
  // تنبيهات واتساب (CallMeBot): الرقم اختياري (يُستخدم رقم المكتب إن تُرك فارغًا) والمفتاح أرقام/حروف فقط.
  next.whatsappAlertsNumber = normalizeWhatsappNumber(cleanPhone(body.whatsappAlertsNumber ?? ""));
  if (next.whatsappAlertsNumber && !/^20\d{10}$/.test(next.whatsappAlertsNumber)) throw new InputError("رقم واتساب التنبيهات غير صحيح (مثال: 01222355769).");
  next.whatsappAlertsApiKey = cleanText(body.whatsappAlertsApiKey ?? "", 64).replace(/[^A-Za-z0-9_-]/g, "");
  return next;
}
export function apiError(error: unknown) {
  if (error instanceof InputError) return Response.json({ error: error.message }, { status: error.status });
  if (!databaseConfigured) return Response.json({ error: "الحفظ غير متاح في وضع المعاينة دون قاعدة بيانات." }, { status: 503 });
  if (error instanceof SyntaxError) return Response.json({ error: "بيانات الطلب غير صحيحة." }, { status: 400 });
  console.error("Directory request failed", error);
  return Response.json({ error: "تعذر تنفيذ الطلب. حاول مرة أخرى." }, { status: 500 });
}

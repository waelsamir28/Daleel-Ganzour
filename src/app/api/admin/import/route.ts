import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { directoryAreas, directoryCategories, notifications, services } from "@/db/schema";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { InputError, apiError } from "@/lib/inputs";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";
import { normalizeSearch, type CategoryRecord } from "@/lib/catalog";
import { serviceDescriptionVariant } from "@/lib/service-description";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_DATA_ROWS = 500;
const MAX_COLUMNS = 30;
const aliases = {
  name: ["الاسم", "اسم مقدم الخدمة", "اسم النشاط", "name", "provider name"],
  contactName: ["اسم المسؤول", "اسم صاحب المعمل", "اسم صاحب المختبر", "contact name"],
  phone: ["رقم التليفون", "رقم التلفون", "رقم الهاتف", "التليفون", "التلفون", "الهاتف", "رقم الموبايل", "الموبايل", "phone", "mobile", "telephone", "tel"],
  phoneSecondary: ["رقم التليفون 1", "رقم الهاتف 1", "رقم تليفون إضافي", "رقم هاتف إضافي", "هاتف إضافي", "رقم ثانٍ", "phone 1", "phone2", "secondary phone", "alternate phone"],
  profession: ["المهنة", "التخصص", "المهنة أو التخصص", "نوع الخدمة", "profession", "specialty"],
  category: ["التصنيف", "القسم", "التصنيف الرئيسي", "الفئة", "category", "section"],
  address: ["العنوان", "العنوان بالتفصيل", "المنطقة", "address", "location"],
  description: ["وصف الخدمة", "الوصف", "تفاصيل الخدمة", "description", "service description"],
  labName: ["المعمل", "اسم المعمل", "المختبر", "اسم المختبر", "اسم المنشأة", "lab", "laboratory", "lab name"],
} as const;
type RowKind = keyof typeof aliases;
type ParsedRow = {
  rowNumber: number;
  name: string;
  contactName: string;
  phone: string;
  phoneSecondary: string;
  profession: string;
  categoryLabel: string;
  categoryId: string;
  address: string;
  description: string;
  error: string | null;
};
type Candidate = { row: ParsedRow; serviceId: string };

function normalizedCell(value: string) {
  return normalizeSearch(value).replace(/[._-]/g, " ").replace(/\s+/g, " ").trim();
}

function columnFor(headers: string[], key: RowKind) {
  const accepted = aliases[key].map(normalizedCell);
  return headers.findIndex((header) => accepted.includes(normalizedCell(header)));
}

function toStringCell(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    if ("result" in value && (typeof value.result === "string" || typeof value.result === "number")) return String(value.result);
    return "";
  }
  return String(value);
}

function normalizePhone(value: string) {
  const digits = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const cleaned = cleanPhone(digits);
  return /^1[0125]\d{8}$/.test(cleaned) ? `0${cleaned}` : cleaned;
}

function matchCategory(value: string, categories: CategoryRecord[]) {
  const target = normalizedCell(value);
  if (!target) return undefined;
  return categories.find((category) => category.active && (normalizedCell(category.id) === target || normalizedCell(category.name) === target));
}

async function parseWorkbook(file: File, categories: CategoryRecord[], areas: Array<{ name: string }>, fallbackCategoryId: string, defaultArea: string): Promise<ParsedRow[]> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new InputError("ارفع ملف Excel بصيغة ‎.xlsx.");
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new InputError("حجم الملف يجب أن يكون أقل من 5 ميجابايت.");

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new InputError("تعذر قراءة الملف. تأكد أنه ملف Excel بصيغة ‎.xlsx وغير تالف.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) throw new InputError("الملف لا يحتوي على ورقة عمل أو بيانات.");
  if (sheet.columnCount > MAX_COLUMNS) throw new InputError("الورقة تحتوي على أعمدة كثيرة. الحد الأقصى 30 عمودًا.");
  if (sheet.rowCount > MAX_DATA_ROWS + 10) throw new InputError("الملف يتجاوز الحد الأقصى البالغ 500 صف بيانات.");

  let headerRow = 0;
  let columns: Record<RowKind, number> = { name: -1, contactName: -1, phone: -1, phoneSecondary: -1, profession: -1, category: -1, address: -1, description: -1, labName: -1 };
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 10); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const headers = Array.from({ length: Math.min(sheet.columnCount, MAX_COLUMNS) }, (_, index) => toStringCell(row.getCell(index + 1)));
    const detected = Object.fromEntries((Object.keys(aliases) as RowKind[]).map((key) => [key, columnFor(headers, key)])) as Record<RowKind, number>;
    if (detected.phone >= 0 && (detected.name >= 0 || detected.labName >= 0)) {
      headerRow = rowNumber;
      columns = detected;
      break;
    }
  }

  const firstDataRow = headerRow ? headerRow + 1 : 1;
  if (!headerRow) {
    columns = sheet.columnCount <= 3
      ? { name: 0, contactName: -1, phone: 1, phoneSecondary: -1, profession: -1, category: -1, address: -1, description: -1, labName: 2 }
      : { name: 0, contactName: -1, phone: 1, phoneSecondary: 2, profession: 3, category: 4, address: 5, description: 6, labName: -1 };
  }
  const rows: ParsedRow[] = [];
  for (let rowNumber = firstDataRow; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const contactName = cleanText(columns.contactName >= 0 ? toStringCell(row.getCell(columns.contactName + 1)) : "", 120);
    const labName = cleanText(columns.labName >= 0 ? toStringCell(row.getCell(columns.labName + 1)) : "", 160);
    const name = cleanText(columns.name >= 0 ? toStringCell(row.getCell(columns.name + 1)) : "", 160) || labName || contactName;
    const phone = normalizePhone(toStringCell(row.getCell(columns.phone + 1)));
    const phoneSecondary = columns.phoneSecondary >= 0 ? normalizePhone(toStringCell(row.getCell(columns.phoneSecondary + 1))) : "";
    const profession = cleanText(columns.profession >= 0 ? toStringCell(row.getCell(columns.profession + 1)) : "", 100);
    const categoryLabel = cleanText(columns.category >= 0 ? toStringCell(row.getCell(columns.category + 1)) : "", 100);
    const address = cleanText(columns.address >= 0 ? toStringCell(row.getCell(columns.address + 1)) : "", 240);
    const description = cleanText(columns.description >= 0 ? toStringCell(row.getCell(columns.description + 1)) : "", 1000);
    if (!name && !phone && !phoneSecondary && !profession && !categoryLabel && !address && !description) continue;
    let error: string | null = null;
    if (name.length < 3) error = "الاسم ناقص أو غير صحيح.";
    else if (!validPhone(phone)) error = "رقم الهاتف غير صحيح؛ راجع أصفار البداية.";
    else if (phoneSecondary && (!validPhone(phoneSecondary) || phoneSecondary === phone)) error = "رقم الهاتف الإضافي غير صحيح أو مطابق للرقم الأول.";
    let selected = matchCategory(profession, categories);
    const listedCategory = matchCategory(categoryLabel, categories);
    if (!error && categoryLabel && !listedCategory) error = "التصنيف غير مطابق لقسم نشط في الدليل.";
    if (!error && profession && (!selected?.parentId || !selected.active)) error = "المهنة غير مطابقة لتخصص نشط في الدليل.";
    if (!error && !selected && listedCategory?.parentId) selected = listedCategory;
    if (!error && !selected) {
      const fallback = categories.find((category) => category.id === fallbackCategoryId && category.active && category.parentId);
      const requestedRoot = listedCategory && !listedCategory.parentId ? listedCategory.id : undefined;
      if (requestedRoot && fallback?.parentId !== requestedRoot) error = "التصنيف يحتاج إلى مهنة أو تخصص مطابق في العمود السابق.";
      else selected = fallback;
    }
    if (!error && (!selected || !selected.parentId)) error = "اختار مهنة أو تخصصًا صحيحًا، أو أضفه في عمود المهنة.";
    if (!error && selected?.parentId && !categories.some((item) => item.id === selected.parentId && item.active)) error = "التصنيف الرئيسي للمهنة غير نشط.";
    if (!error && listedCategory?.parentId && selected?.id !== listedCategory.id) error = "المهنة لا تتوافق مع التصنيف المحدد.";
    if (!error && listedCategory && !listedCategory.parentId && selected?.parentId !== listedCategory.id) error = "المهنة لا تتبع التصنيف الرئيسي المحدد.";
    rows.push({ rowNumber, name, contactName, phone, phoneSecondary, profession, categoryLabel, categoryId: selected?.id ?? "", address, description, error });
    if (rows.length > MAX_DATA_ROWS) throw new InputError("الملف يتجاوز الحد الأقصى البالغ 500 صف بيانات.");
  }
  if (!rows.length) throw new InputError("لم أجد صفوف بيانات. استخدم أعمدة الاسم ورقم التليفون والمهنة أو المعمل.");

  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();
  for (const row of rows) {
    if (row.error) continue;
    const nameKey = normalizedCell(row.name);
    if (seenPhones.has(row.phone) || (row.phoneSecondary && seenPhones.has(row.phoneSecondary)) || seenNames.has(nameKey)) row.error = "سجل مكرر داخل الملف.";
    else {
      seenPhones.add(row.phone);
      if (row.phoneSecondary) seenPhones.add(row.phoneSecondary);
      seenNames.add(nameKey);
    }
  }
  return rows;
}

async function markExistingDuplicates(rows: ParsedRow[]) {
  const candidates = rows.filter((row) => !row.error);
  if (!candidates.length) return;
  const phones = [...new Set(candidates.flatMap((row) => [row.phone, row.phoneSecondary].filter(Boolean)))];
  const names = [...new Set(candidates.map((row) => row.name))];
  const existing = await db.select({ name: services.name, phone: services.phone, phoneSecondary: services.phoneSecondary }).from(services).where(or(inArray(services.phone, phones), inArray(services.phoneSecondary, phones), inArray(services.name, names)));
  const existingPhones = new Set(existing.flatMap((item) => [item.phone, item.phoneSecondary].filter(Boolean)));
  const existingNames = new Set(existing.map((item) => normalizedCell(item.name)));
  for (const row of candidates) {
    if (existingPhones.has(row.phone) || (row.phoneSecondary && existingPhones.has(row.phoneSecondary)) || existingNames.has(normalizedCell(row.name))) row.error = "الاسم أو رقم الهاتف موجود بالفعل في الدليل.";
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!(await isAdmin())) throw new InputError("الاستيراد متاح للأدمن فقط. يرجى تسجيل الدخول.", 401);
    await ensureSeed();

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new InputError("اختار ملف Excel أولًا.");
    const categoryId = cleanText(form.get("category"), 60);
    const areaName = cleanText(form.get("area"), 80);
    const confirm = form.get("confirm") === "true";
    const [category] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, categoryId)).limit(1);
    if (!category?.parentId || !category.active) throw new InputError("اختار تخصصًا نشطًا صالحًا.");
    const [parent] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, category.parentId)).limit(1);
    if (!parent?.active) throw new InputError("التصنيف الرئيسي للمهنة غير نشط.");
    const [area] = await db.select().from(directoryAreas).where(eq(directoryAreas.name, areaName)).limit(1);
    if (!area) throw new InputError("اختار عنوانًا افتراضيًا صحيحًا من القائمة.");
    const [categories, areas] = await Promise.all([db.select().from(directoryCategories), db.select({ name: directoryAreas.name }).from(directoryAreas)]);

    const rows = await parseWorkbook(file, categories.map((item) => ({ ...item, light: `${item.color}12` })), areas, categoryId, areaName);
    await markExistingDuplicates(rows);
    const ready = rows.filter((row) => !row.error);
    if (!confirm || !ready.length) return Response.json({ rows, total: rows.length, readyCount: ready.length });

    const importedCount = await db.transaction(async (tx) => {
      const phones = [...new Set(ready.flatMap((row) => [row.phone, row.phoneSecondary].filter(Boolean)))];
      const names = [...new Set(ready.map((row) => row.name))];
      const existing = await tx.select({ name: services.name, phone: services.phone, phoneSecondary: services.phoneSecondary }).from(services).where(or(inArray(services.phone, phones), inArray(services.phoneSecondary, phones), inArray(services.name, names)));
      const existingPhones = new Set(existing.flatMap((item) => [item.phone, item.phoneSecondary].filter(Boolean)));
      const existingNames = new Set(existing.map((item) => normalizedCell(item.name)));
      const insertable = ready.filter((row) => !existingPhones.has(row.phone) && (!row.phoneSecondary || !existingPhones.has(row.phoneSecondary)) && !existingNames.has(normalizedCell(row.name)));
      for (const row of ready) {
        if (!insertable.includes(row)) row.error = "تم تسجيل الاسم أو رقم الهاتف منذ المعاينة؛ لم تتم إضافته مرة أخرى.";
      }
      if (!insertable.length) return 0;
      const created: Candidate[] = insertable.map((row) => ({ row, serviceId: randomUUID() }));
      const byId = new Map(categories.map((item) => [item.id, item]));
      await tx.insert(services).values(created.map(({ row, serviceId }) => {
        const specialty = byId.get(row.categoryId);
        const rowArea = areas.find((item) => normalizedCell(item.name) === normalizedCell(row.address));
        const description = row.description.length >= 10 ? row.description : serviceDescriptionVariant(row.categoryId, specialty?.name ?? row.profession, serviceId);
        return {
          id: serviceId,
          name: row.name,
          category: row.categoryId,
          area: rowArea?.name ?? areaName,
          address: row.address || rowArea?.name || areaName,
          phone: row.phone,
          phoneSecondary: row.phoneSecondary,
          description,
          status: "pending",
          verified: false,
          featured: false,
          emergency: false,
          demo: false,
        };
      }));
      await tx.insert(notifications).values(created.map(({ row, serviceId }) => ({
        type: "service",
        title: "طلبات مهن جديدة",
        message: `${row.name} • ${row.phone}${row.phoneSecondary ? ` / ${row.phoneSecondary}` : ""} (استيراد Excel)`,
        entityId: serviceId,
      })));
      return created.length;
    });

    return Response.json({ rows, total: rows.length, readyCount: 0, importedCount });
  } catch (error) {
    return apiError(error);
  }
}

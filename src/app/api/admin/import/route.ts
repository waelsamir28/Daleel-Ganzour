import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { directoryAreas, directoryCategories, notifications, services } from "@/db/schema";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { InputError, apiError } from "@/lib/inputs";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";
import { normalizeSearch } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_DATA_ROWS = 500;
const MAX_COLUMNS = 30;
const aliases = {
  contactName: ["الاسم", "اسم الشخص", "اسم المسؤول", "اسم صاحب المعمل", "اسم صاحب المختبر", "contact name", "name"],
  phone: ["رقم التليفون", "رقم التلفون", "رقم الهاتف", "التليفون", "التلفون", "الهاتف", "رقم الموبايل", "الموبايل", "phone", "mobile", "telephone", "tel"],
  labName: ["المعمل", "اسم المعمل", "المختبر", "اسم المختبر", "اسم المنشأة", "lab", "laboratory", "lab name"],
} as const;
type RowKind = keyof typeof aliases;
type ParsedRow = { rowNumber: number; contactName: string; phone: string; labName: string; error: string | null };
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
    return "";
  }
  return String(value);
}

function normalizePhone(value: string) {
  const digits = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const cleaned = cleanPhone(digits);
  return /^1[0125]\d{8}$/.test(cleaned) ? `0${cleaned}` : cleaned;
}

async function parseWorkbook(file: File): Promise<ParsedRow[]> {
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
  let columns = { contactName: 0, phone: 1, labName: 2 };
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 10); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const headers = Array.from({ length: Math.min(sheet.columnCount, MAX_COLUMNS) }, (_, index) => toStringCell(row.getCell(index + 1)));
    const detected = { contactName: columnFor(headers, "contactName"), phone: columnFor(headers, "phone"), labName: columnFor(headers, "labName") };
    if (detected.contactName >= 0 && detected.phone >= 0 && detected.labName >= 0) {
      headerRow = rowNumber;
      columns = detected;
      break;
    }
  }

  const firstDataRow = headerRow ? headerRow + 1 : 1;
  const rows: ParsedRow[] = [];
  for (let rowNumber = firstDataRow; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const contactName = cleanText(toStringCell(row.getCell(columns.contactName + 1)), 120);
    const phone = normalizePhone(toStringCell(row.getCell(columns.phone + 1)));
    const labName = cleanText(toStringCell(row.getCell(columns.labName + 1)), 160);
    if (!contactName && !phone && !labName) continue;
    let error: string | null = null;
    if (contactName.length < 2) error = "الاسم ناقص أو غير صحيح.";
    else if (!validPhone(phone)) error = "رقم الهاتف غير صحيح؛ راجع أصفار البداية.";
    else if (labName.length < 2) error = "اسم المعمل ناقص أو غير صحيح.";
    rows.push({ rowNumber, contactName, phone, labName, error });
    if (rows.length > MAX_DATA_ROWS) throw new InputError("الملف يتجاوز الحد الأقصى البالغ 500 صف بيانات.");
  }
  if (!rows.length) throw new InputError("لم أجد صفوف بيانات. استخدم أعمدة الاسم ورقم التليفون والمعمل.");

  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();
  for (const row of rows) {
    if (row.error) continue;
    const phoneKey = row.phone;
    const nameKey = normalizedCell(row.labName);
    if (seenPhones.has(phoneKey) || seenNames.has(nameKey)) row.error = "سجل مكرر داخل الملف.";
    else {
      seenPhones.add(phoneKey);
      seenNames.add(nameKey);
    }
  }
  return rows;
}

async function markExistingDuplicates(rows: ParsedRow[]) {
  const candidates = rows.filter((row) => !row.error);
  if (!candidates.length) return;
  const phones = [...new Set(candidates.map((row) => row.phone))];
  const names = [...new Set(candidates.map((row) => row.labName))];
  const existing = await db.select({ name: services.name, phone: services.phone }).from(services).where(or(inArray(services.phone, phones), inArray(services.name, names)));
  const existingPhones = new Set(existing.map((item) => item.phone));
  const existingNames = new Set(existing.map((item) => normalizedCell(item.name)));
  for (const row of candidates) {
    if (existingPhones.has(row.phone) || existingNames.has(normalizedCell(row.labName))) row.error = "المعمل أو رقم الهاتف موجود بالفعل في الدليل.";
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
    if (!category?.parentId || !category.active) throw new InputError("اختار تخصصًا نشطًا صالحًا للمعامل.");
    const [parent] = await db.select().from(directoryCategories).where(eq(directoryCategories.id, category.parentId)).limit(1);
    if (!parent?.active) throw new InputError("التصنيف الرئيسي للتخصص غير نشط.");
    const [area] = await db.select().from(directoryAreas).where(eq(directoryAreas.name, areaName)).limit(1);
    if (!area) throw new InputError("اختار عنوانًا افتراضيًا صحيحًا من القائمة.");

    const rows = await parseWorkbook(file);
    await markExistingDuplicates(rows);
    const ready = rows.filter((row) => !row.error);
    if (!confirm || !ready.length) return Response.json({ rows, total: rows.length, readyCount: ready.length });

    const importedCount = await db.transaction(async (tx) => {
      const phones = [...new Set(ready.map((row) => row.phone))];
      const names = [...new Set(ready.map((row) => row.labName))];
      const existing = await tx.select({ name: services.name, phone: services.phone }).from(services).where(or(inArray(services.phone, phones), inArray(services.name, names)));
      const existingPhones = new Set(existing.map((item) => item.phone));
      const existingNames = new Set(existing.map((item) => normalizedCell(item.name)));
      const insertable = ready.filter((row) => !existingPhones.has(row.phone) && !existingNames.has(normalizedCell(row.labName)));
      for (const row of ready) {
        if (!insertable.includes(row)) row.error = "تم تسجيل المعمل أو رقم الهاتف منذ المعاينة؛ لم تتم إضافته مرة أخرى.";
      }
      if (!insertable.length) return 0;
      const created: Candidate[] = insertable.map((row) => ({ row, serviceId: randomUUID() }));
      await tx.insert(services).values(created.map(({ row, serviceId }) => ({
        id: serviceId,
        name: row.labName,
        category: categoryId,
        area: areaName,
        address: areaName,
        phone: row.phone,
        description: `اسم مسؤول المعمل: ${row.contactName}. معمل تحاليل طبية بقرية جنزور.`,
        status: "pending",
        verified: false,
        featured: false,
        emergency: false,
        demo: false,
      })));
      await tx.insert(notifications).values(created.map(({ row, serviceId }) => ({
        type: "service",
        title: "طلبات معامل جديدة",
        message: `${row.labName} • ${row.phone} (استيراد Excel)`,
        entityId: serviceId,
      })));
      return created.length;
    });

    return Response.json({ rows, total: rows.length, readyCount: 0, importedCount });
  } catch (error) {
    return apiError(error);
  }
}

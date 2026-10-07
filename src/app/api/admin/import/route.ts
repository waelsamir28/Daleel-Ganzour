import { createHash, randomUUID } from "node:crypto";
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
const rootAliases: Record<string, string[]> = {
  clinics: ["أطباء", "الأطباء", "طبيب", "عيادات"],
  crafts: ["حرفيين", "حرفي", "الصنايعية", "مهن حرفية"],
  shops: ["محلات", "محل", "متاجر"],
  labs: ["معامل", "مختبرات", "تحاليل"],
  teachers: ["مدرسين", "مدرس"],
  charities: ["جمعيات خيرية", "جمعيات أهلية", "جمعيات"],
  "other-services": ["خدمات أخرى", "خدمات متنوعة"],
};
const specialtyAliases: Record<string, string[]> = {
  carpentry: ["نجار", "نجارة", "أعمال نجارة"],
  plumbing: ["سباك", "سباكة", "أعمال سباكة"],
  electricity: ["كهربائي", "كهرباء"],
  metalwork: ["حداد", "حدادة"],
  painting: ["نقاش", "دهان", "دهانات"],
  masonry: ["بناء", "محارة"],
  tiles: ["سيراميك", "بلاط"],
  ac: ["تكييف", "تبريد"],
  mechanics: ["ميكانيكي", "ميكانيكا"],
  family: ["باطنة", "طب باطنة", "طب الأسرة"],
  pediatrics: ["أطفال", "طب أطفال"],
  dentistry: ["أسنان", "طب أسنان"],
  gynecology: ["نساء وتوليد"],
  orthopedics: ["عظام"],
  dermatology: ["جلدية"],
  ophthalmology: ["عيون", "عيون ورمد", "رمد"],
  ent: ["أنف وأذن", "أنف وأذن وحنجرة"],
  physiotherapy: ["علاج طبيعي"],
  "medical-labs": ["تحاليل طبية", "مختبرات"],
  pharmacies: ["صيدلية", "صيدلي"],
  groceries: ["بقالة", "بقال", "سوبر ماركت"],
};
const importedSpecialties = [
  { rootId: "clinics", name: "المسالك البولية", aliases: ["مسالك بولية", "مسالك"] },
  { rootId: "clinics", name: "المخ والأعصاب", aliases: ["مخ وأعصاب", "مخ واعصاب"] },
  { rootId: "clinics", name: "القلب والصدر", aliases: ["قلب وصدر"] },
  { rootId: "clinics", name: "الطب البيطري", aliases: ["بيطري", "طب بيطري"] },
] as const;
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
  categoryName: string;
  categoryParentId: string;
  rootName: string;
  newSpecialty: boolean;
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

function withoutDefiniteArticle(value: string) {
  return value.startsWith("ال") && value.length > 2 ? value.slice(2) : value;
}

function sameLabel(first: string, second: string) {
  const firstLabel = normalizedCell(first), secondLabel = normalizedCell(second);
  return firstLabel === secondLabel || withoutDefiniteArticle(firstLabel) === withoutDefiniteArticle(secondLabel);
}

function matchCategory(value: string, categories: CategoryRecord[]) {
  if (!normalizedCell(value)) return undefined;
  return categories.find((category) => category.active && (sameLabel(category.id, value) || sameLabel(category.name, value)));
}

function matchRoot(value: string, categories: CategoryRecord[]) {
  if (!normalizedCell(value)) return undefined;
  return categories.find((category) => category.active && !category.parentId && sameLabel(category.name, value))
    ?? categories.find((category) => category.active && !category.parentId && (rootAliases[category.id] ?? []).some((alias) => sameLabel(alias, value)));
}

function matchSpecialty(value: string, categories: CategoryRecord[]) {
  if (!normalizedCell(value)) return undefined;
  const exact = matchCategory(value, categories);
  if (exact?.parentId) return exact;
  return categories.find((category) => category.active && category.parentId && (specialtyAliases[category.id] ?? []).some((alias) => sameLabel(alias, value)));
}

function importedSpecialtyName(value: string, parentId: string) {
  return importedSpecialties.find((specialty) => specialty.rootId === parentId && specialty.aliases.some((alias) => sameLabel(alias, value)))?.name ?? value;
}

function importedSpecialtyId(parentId: string, name: string) {
  const normalizedName = withoutDefiniteArticle(normalizedCell(name));
  return `import-${createHash("sha256").update(`${parentId}:${normalizedName}`).digest("hex").slice(0, 48)}`;
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
    const listedCategory = matchCategory(categoryLabel, categories) ?? matchSpecialty(categoryLabel, categories);
    const listedRoot = matchRoot(categoryLabel, categories);
    const requestedRoot = listedCategory
      ? listedCategory.parentId ? categories.find((item) => item.id === listedCategory.parentId) : listedCategory
      : listedRoot;
    if (!error && categoryLabel && !listedCategory && !listedRoot) error = "التصنيف غير مطابق لقسم نشط في الدليل.";

    let selected = profession ? matchSpecialty(profession, categories) : undefined;
    let newSpecialty = false;
    if (!error && profession && !selected) {
      if (requestedRoot && !listedCategory?.parentId) {
        const name = importedSpecialtyName(profession, requestedRoot.id);
        selected = {
          id: importedSpecialtyId(requestedRoot.id, name),
          name,
          parentId: requestedRoot.id,
          description: `مقدمو خدمات ${name} بقرية جنزور`,
          color: requestedRoot.color,
          light: `${requestedRoot.color}12`,
          icon: requestedRoot.icon,
          sortOrder: categories.filter((item) => item.parentId === requestedRoot.id).length,
          active: true,
        };
        newSpecialty = true;
      } else {
        error = requestedRoot ? "المهنة غير مطابقة للتصنيف الفرعي المحدد." : "المهنة غير مطابقة لتخصص نشط. اكتب القسم الرئيسي في عمود التصنيف.";
      }
    }
    if (!error && !selected && listedCategory?.parentId) selected = listedCategory;
    if (!error && !selected) {
      const fallback = categories.find((category) => category.id === fallbackCategoryId && category.active && category.parentId);
      if (requestedRoot && fallback?.parentId !== requestedRoot.id) error = "التصنيف يحتاج إلى مهنة أو تخصص مناسب في عمود المهنة.";
      else selected = fallback;
    }
    if (!error && (!selected || !selected.parentId)) error = "اختار مهنة أو تخصصًا صحيحًا، أو اكتبها في عمود المهنة.";
    if (!error && selected?.parentId && !categories.some((item) => item.id === selected?.parentId && item.active)) error = "التصنيف الرئيسي للمهنة غير نشط.";
    if (!error && listedCategory?.parentId && selected?.id !== listedCategory.id) error = "المهنة لا تتوافق مع التصنيف المحدد.";
    if (!error && requestedRoot && selected?.parentId !== requestedRoot.id) error = "المهنة لا تتبع التصنيف الرئيسي المحدد.";

    const categoryName = selected?.name ?? profession;
    const rootName = requestedRoot?.name ?? categories.find((item) => item.id === selected?.parentId)?.name ?? "";
    const finalDescription = description.length >= 10
      ? description
      : selected ? serviceDescriptionVariant(selected.id, selected.name, `${phone}:${normalizedCell(name)}`) : description;
    rows.push({ rowNumber, name, contactName, phone, phoneSecondary, profession, categoryLabel, categoryId: selected?.id ?? "", categoryName, categoryParentId: selected?.parentId ?? "", rootName, newSpecialty, address, description: finalDescription, error });
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
    const newSpecialtyCount = new Set(ready.filter((row) => row.newSpecialty).map((row) => row.categoryId)).size;
  if (!confirm) return Response.json({ rows, total: rows.length, readyCount: ready.length, newSpecialtyCount });
  if (!ready.length) return Response.json({ rows, total: rows.length, readyCount: 0, newSpecialtyCount: 0, importedCount: 0 });

  const importSummary = await db.transaction(async (tx) => {
    const phones = [...new Set(ready.flatMap((row) => [row.phone, row.phoneSecondary].filter(Boolean)))];
    const names = [...new Set(ready.map((row) => row.name))];
    const existing = await tx.select({ name: services.name, phone: services.phone, phoneSecondary: services.phoneSecondary }).from(services).where(or(inArray(services.phone, phones), inArray(services.phoneSecondary, phones), inArray(services.name, names)));
    const existingPhones = new Set(existing.flatMap((item) => [item.phone, item.phoneSecondary].filter(Boolean)));
    const existingNames = new Set(existing.map((item) => normalizedCell(item.name)));
    const insertable = ready.filter((row) => !existingPhones.has(row.phone) && (!row.phoneSecondary || !existingPhones.has(row.phoneSecondary)) && !existingNames.has(normalizedCell(row.name)));
    for (const row of ready) {
      if (!insertable.includes(row)) row.error = "تم تسجيل الاسم أو رقم الهاتف منذ المعاينة؛ لم تتم إضافته مرة أخرى.";
    }
    if (!insertable.length) return { importedCount: 0, newSpecialtyCount: 0 };

    const latestCategories = await tx.select().from(directoryCategories);
    for (const row of insertable) {
      if (!row.newSpecialty) continue;
      const existingSpecialty = latestCategories.find((item) => item.parentId === row.categoryParentId && sameLabel(item.name, row.categoryName));
      if (existingSpecialty && !existingSpecialty.active) throw new InputError(`التخصص «${row.categoryName}» موجود لكنه مخفي. فعّله من التصنيفات قبل الاستيراد.`, 409);
      if (existingSpecialty) {
        row.categoryId = existingSpecialty.id;
        row.categoryName = existingSpecialty.name;
        row.newSpecialty = false;
      }
    }

    const latestById = new Map(latestCategories.map((item) => [item.id, item]));
    const nextOrderByRoot = new Map<string, number>();
    const specialtyRows = [...new Map(insertable.filter((row) => row.newSpecialty).map((row) => [row.categoryId, row])).values()];
    const categoryValues = specialtyRows.map((row) => {
      const parent = latestById.get(row.categoryParentId);
      if (!parent || parent.parentId || !parent.active) throw new InputError("التصنيف الرئيسي للمهنة لم يعد نشطًا. حدّث الصفحة وأعد معاينة الملف.", 409);
      const nextOrder = nextOrderByRoot.get(parent.id) ?? latestCategories.filter((item) => item.parentId === parent.id).reduce((maximum, item) => Math.max(maximum, item.sortOrder), -1) + 1;
      nextOrderByRoot.set(parent.id, nextOrder + 1);
      return {
        id: row.categoryId,
        name: row.categoryName,
        parentId: parent.id,
        description: `مقدمو خدمات ${row.categoryName} بقرية جنزور`,
        color: parent.color,
        icon: parent.icon,
        sortOrder: nextOrder,
        active: true,
      };
    });
    const insertedSpecialties = categoryValues.length
      ? await tx.insert(directoryCategories).values(categoryValues).onConflictDoNothing().returning({ id: directoryCategories.id })
      : [];
    if (categoryValues.length) {
      const savedSpecialties = await tx.select().from(directoryCategories).where(inArray(directoryCategories.id, categoryValues.map((item) => item.id)));
      for (const candidate of categoryValues) {
        const saved = savedSpecialties.find((item) => item.id === candidate.id);
        if (!saved || saved.parentId !== candidate.parentId || !sameLabel(saved.name, candidate.name)) throw new InputError("تعذر تأكيد التخصص الجديد. أعد معاينة الملف وحاول مرة أخرى.", 409);
      }
    }

    const created: Candidate[] = insertable.map((row) => ({ row, serviceId: randomUUID() }));
    await tx.insert(services).values(created.map(({ row, serviceId }) => {
      const rowArea = areas.find((item) => normalizedCell(item.name) === normalizedCell(row.address));
      return {
        id: serviceId,
        name: row.name,
        category: row.categoryId,
        area: rowArea?.name ?? areaName,
        address: row.address || rowArea?.name || areaName,
        phone: row.phone,
        phoneSecondary: row.phoneSecondary,
        description: row.description,
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
    return { importedCount: created.length, newSpecialtyCount: insertedSpecialties.length };
  });

  return Response.json({ rows, total: rows.length, readyCount: 0, importedCount: importSummary.importedCount, newSpecialtyCount: importSummary.newSpecialtyCount });
  } catch (error) {
    return apiError(error);
  }
}

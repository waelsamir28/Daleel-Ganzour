/**
 * الدليل الورقي الشهري: يجمع كل خدمة منشورة تحت قسمها، بأرقام وعناوين منسّقة للطباعة (A4).
 * منطق نقي بلا اعتماديات — تستخدمه صفحة الطباعة والاختبارات.
 */

export type GuideService = {
  id: string;
  name: string;
  category: string;
  area?: string;
  address?: string;
  phone: string;
  featured?: boolean;
  status?: string;
  verified?: boolean;
};

export type GuideCategory = { id: string; name: string; parentId?: string | null; sortOrder?: number; active?: boolean; color?: string };

export type PrintableGuideEntry = { id: string; name: string; phone: string; place: string; featured: boolean; verified: boolean };
export type PrintableGuideSection = { id: string; name: string; color: string; entries: PrintableGuideEntry[] };

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** أرقام عربية للطباعة (أسهل في القراءة على الورق). */
export function arabicDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => AR_DIGITS[Number(digit)]);
}

/** «٤٦١ خدمة في ١٤ قسم» — سطر الملخص أعلى الورقة. */
export function guideSummaryLine(serviceCount: number, sectionCount: number): string {
  return `${arabicDigits(serviceCount)} خدمة ومهنة في ${arabicDigits(sectionCount)} قسم`;
}

/** تاريخ الطبعة بالعربي: «نوفمبر ٢٠٢٦». */
export function guideEditionLabel(now = Date.now(), timeZone = "Africa/Cairo"): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone }).format(new Date(now));
  } catch {
    return "";
  }
}

/** اسم ملف الـPDF المقترح عند الحفظ/الطباعة. */
export function guideFileName(now = Date.now()): string {
  const date = new Date(now).toISOString().slice(0, 7);
  return `daleel-ganzour-guide-${date}`;
}

function place(service: GuideService): string {
  return (service.address || service.area || "").trim();
}

/**
 * تقسيم الخدمات على الأقسام:
 * - الأقسام الرئيسية فقط (التخصصات تحت قسمها تظهر باسم القسم الأم، مع كتابة التخصص جوه السطر).
 * - أقسام من غير خدمات لا تُطبع أصلًا (الورق غالي).
 * - الترتيب: عدد الخدمات تنازليًا ثم اسم القسم، والخدمات داخل القسم أبجديًا.
 */
export function printableGuideSections(
  categories: GuideCategory[],
  services: GuideService[],
): PrintableGuideSection[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const published = services.filter((service) => !service.status || service.status === "published" || service.status === "approved" || service.status === "active");
  const sections = new Map<string, PrintableGuideSection>();

  for (const service of published) {
    const category = byId.get(service.category);
    if (!category) continue;
    const root = category.parentId ? byId.get(category.parentId) ?? category : category;
    const section = sections.get(root.id) ?? { id: root.id, name: root.name, color: root.color || "#0b5f9e", entries: [] };
    // التخصص يظهر بين قوسين لو الخدمة مش على القسم الأم مباشرة.
    const specialty = category.id !== root.id ? ` (${category.name})` : "";
    section.entries.push({
      id: service.id,
      name: `${service.name}${specialty}`,
      phone: service.phone,
      place: place(service),
      featured: Boolean(service.featured),
      verified: Boolean(service.verified),
    });
    sections.set(root.id, section);
  }

  return [...sections.values()]
    .map((section) => ({
      ...section,
      entries: section.entries.sort((a, b) => a.name.localeCompare(b.name, "ar")),
    }))
    .sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, "ar"));
}

/** إجمالي عدد الخدمات المطبوعة (للملخص وسطر الغلاف). */
export function printableGuideCount(sections: PrintableGuideSection[]): number {
  return sections.reduce((total, section) => total + section.entries.length, 0);
}

/**
 * فحص المكررات في الدليل: نفس الرقم أو اسم شديد الشبه داخل نفس التخصص.
 * بيرجّع «مجموعات» (مجموعة لكل تكرار) بدل تحذيرات متفرقة، ومعاها اقتراح مين يفضل ومين يتشال.
 * منطق نقي بلا اعتماديات حتى يُختبر مباشرة.
 */

export type DuplicateCandidate = {
  id: string;
  name: string;
  phone: string;
  phoneSecondary?: string;
  category: string;
  area?: string;
  address?: string;
  status: string;
  createdAt?: string;
  featured?: boolean;
  verified?: boolean;
  photoVersion?: number;
  serviceItems?: string[];
  subSpecialties?: string[];
  description?: string;
  demo?: boolean;
};

export type DuplicateReason = "phone" | "name";

export type DuplicateGroup<T extends DuplicateCandidate = DuplicateCandidate> = {
  id: string;
  reason: DuplicateReason;
  /** الرقم المكرر (لو السبب رقم) أو الاسم المشابه (لو السبب اسم). */
  detail: string;
  /** السجل المقترح الاحتفاظ به. */
  keep: T;
  /** الباقي (مكرر — يُنصح بحذفه أو دمجه). */
  duplicates: T[];
  all: T[];
};

const TITLE_WORDS = new Set(["د", "دكتور", "دكتوره", "الدكتور", "الدكتوره", "م", "مهندس", "المهندس", "أ", "ا", "استاذ", "الاستاذ", "استاذه", "الحاج", "الحاجه", "حاج", "الشيخ", "شيخ", "الاسطى", "اسطى", "الاسطي", "اسطي", "معلم", "المعلم", "عم", "كابتن", "الكابتن", "صيدليه", "عياده", "مركز", "محل", "مكتب", "شركه", "ورشه", "معمل", "مدرسه", "جمعيه", "مؤسسه", "سوبر", "ماركت", "سنتر"]);

/** توحيد الاسم للمقارنة (نفس قاعدة الدليل: بدون ألقاب ولا ال التعريف ولا رموز). */
export function normalizePersonName(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^(ال|و|لل)/, ""))
    .filter((word) => word.length > 1 && !TITLE_WORDS.has(word))
    .join(" ")
    .trim();
}

/** أرقام الهاتف فقط (بدون مسافات أو رموز) للمقارنة. */
export function phoneDigits(value: string): string {
  const latin = (value || "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  return latin.replace(/\D/g, "");
}

function sameName(a: string, b: string): boolean {
  const x = normalizePersonName(a), y = normalizePersonName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.includes(y) || y.includes(x);
}

/** «كمال البيانات» يحدد مين يفضل في المجموعة: الأكمل أولًا ثم الأقدم. */
export function candidateScore(service: DuplicateCandidate): number {
  let score = 0;
  if (service.status === "approved") score += 40;
  if (service.verified) score += 6;
  if (service.featured) score += 4;
  if (service.photoVersion) score += 6;
  if ((service.address || "").trim()) score += 4;
  if ((service.description || "").trim().length >= 30) score += 3;
  score += Math.min(6, (service.serviceItems ?? []).length);
  score += Math.min(4, (service.subSpecialties ?? []).length);
  if (service.phoneSecondary) score += 1;
  return score;
}

/** سبب واضح للسطر في الشاشة. */
export function duplicateReasonLabel(group: Pick<DuplicateGroup, "reason" | "detail">): string {
  return group.reason === "phone" ? `نفس الرقم: ${group.detail}` : `اسم متشابه: ${group.detail}`;
}

/**
 * تجميع المكررات:
 * 1. كل الأرقام المتكررة (بما فيها الرقم الاحتياطي) في مجموعة واحدة لكل رقم.
 * 2. الأسماء المتشابهة داخل نفس التخصص — بس للمهن اللي لسه مش داخلة في مجموعة رقم.
 */
export function duplicateGroups<T extends DuplicateCandidate>(services: T[]): DuplicateGroup<T>[] {
  const real = services.filter((service) => !service.demo);
  const groups: DuplicateGroup<T>[] = [];
  const claimed = new Set<string>();

  const byPhone = new Map<string, T[]>();
  for (const service of real) {
    for (const raw of [service.phone, service.phoneSecondary ?? ""]) {
      const digits = phoneDigits(raw);
      if (digits.length < 7) continue;
      const list = byPhone.get(digits) ?? [];
      if (!list.some((item) => item.id === service.id)) list.push(service);
      byPhone.set(digits, list);
    }
  }
  for (const [digits, list] of byPhone) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => candidateScore(b) - candidateScore(a) || (Date.parse(a.createdAt ?? "") || 0) - (Date.parse(b.createdAt ?? "") || 0));
    groups.push({ id: `phone-${digits}`, reason: "phone", detail: digits, keep: sorted[0], duplicates: sorted.slice(1), all: sorted });
    for (const service of list) claimed.add(service.id);
  }

  const groupOf = new Map<string, string>();
  for (const group of groups) for (const service of group.all) groupOf.set(service.id, group.id);

  const byCategory = new Map<string, T[]>();
  for (const service of real) {
    const list = byCategory.get(service.category) ?? [];
    list.push(service);
    byCategory.set(service.category, list);
  }
  for (const list of byCategory.values()) {
    const handled = new Set<string>();
    for (let i = 0; i < list.length; i += 1) {
      if (handled.has(list[i].id)) continue;
      const cluster = [list[i]];
      for (let j = i + 1; j < list.length; j += 1) {
        if (handled.has(list[j].id)) continue;
        if (sameName(list[i].name, list[j].name)) { cluster.push(list[j]); handled.add(list[j].id); }
      }
      if (cluster.length < 2) continue;
      handled.add(list[i].id);
      // لو كل أفراد المجموعة داخلين في مجموعة رقم واحدة، التكرار متغطي خلاص.
      const owners = new Set(cluster.map((service) => groupOf.get(service.id) ?? `solo-${service.id}`));
      if (owners.size === 1 && !String([...owners][0]).startsWith("solo-")) continue;
      const sorted = [...cluster].sort((a, b) => candidateScore(b) - candidateScore(a) || (Date.parse(a.createdAt ?? "") || 0) - (Date.parse(b.createdAt ?? "") || 0));
      groups.push({ id: `name-${sorted[0].id}-${sorted.length}`, reason: "name", detail: sorted[0].name, keep: sorted[0], duplicates: sorted.slice(1), all: sorted });
    }
  }

  return groups.sort((a, b) => b.all.length - a.all.length || a.detail.localeCompare(b.detail, "ar"));
}

export function duplicateSummary(groups: Array<Pick<DuplicateGroup, "reason" | "duplicates">>): { groups: number; extra: number; phones: number } {
  return {
    groups: groups.length,
    extra: groups.reduce((total, group) => total + group.duplicates.length, 0),
    phones: groups.filter((group) => group.reason === "phone").length,
  };
}

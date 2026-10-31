/**
 * «صحة الدليل» — منطق نقي (بدون قاعدة بيانات) بيحوّل بيانات الدليل لتقرير واضح:
 * مين رقمه قديم، مين بطاقته ناقصة، وأنهي تخصص مفيهوش حد.
 * الإدارة بتفتح التقرير وتلاقي المشكلة + الحل جنب بعض.
 */

export type HealthService = {
  id: string;
  name: string;
  category: string;
  address: string;
  serviceItems: string[];
  subSpecialties: string[];
  confirmedAt?: string;
  createdAt: string;
};

export type HealthCategory = { id: string; name: string; parentId: string | null; active: boolean };

export type HealthIssue<T> = T & { days?: number; missing?: string[] };

export type DirectoryHealthReport = {
  providers: number;
  score: number;
  stale: Array<{ id: string; name: string; days: number }>;
  incomplete: Array<{ id: string; name: string; missing: string[] }>;
  emptySpecialties: Array<{ id: string; name: string }>;
};

/** عدد الأيام من آخر تأكيد للبيانات (أو من تاريخ الإضافة لو مفيش تأكيد). */
export function daysSinceUpdate(service: Pick<HealthService, "confirmedAt" | "createdAt">, now = Date.now()) {
  const stamp = Date.parse(service.confirmedAt || service.createdAt);
  if (!Number.isFinite(stamp)) return 0;
  return Math.max(0, Math.floor((now - stamp) / 86_400_000));
}

/** الحقول الناقصة في بطاقة المهني (نفس قواعد بطاقة الزائر: العنوان + الخدمات + التخصصات). */
export function missingData(service: Pick<HealthService, "address" | "serviceItems" | "subSpecialties">) {
  return [
    !String(service.address ?? "").trim() && "العنوان",
    !(service.serviceItems ?? []).length && "الخدمات التفصيلية",
    !(service.subSpecialties ?? []).length && "التخصصات الفرعية",
  ].filter((item): item is string => typeof item === "string");
}

export const STALE_AFTER_DAYS = 180;

/**
 * التقرير: كل قائمة مرتبة بالأهم (الأقدم تأكيدًا / الأكثر نقصًا)،
 * ودرجة صحة من ١٠٠ تنزل مع كل مشكلة.
 */
export function directoryHealth(
  input: { services: HealthService[]; categories: HealthCategory[] },
  now = Date.now(),
  staleAfterDays = STALE_AFTER_DAYS,
): DirectoryHealthReport {
  const { services, categories } = input;
  const stale = services
    .map((service) => ({ id: service.id, name: service.name, days: daysSinceUpdate(service, now) }))
    .filter((item) => item.days >= staleAfterDays)
    .sort((a, b) => b.days - a.days);
  const incomplete = services
    .map((service) => ({ id: service.id, name: service.name, missing: missingData(service) }))
    .filter((item) => item.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length);
  const used = new Set(services.map((service) => service.category));
  const emptySpecialties = categories
    .filter((category) => category.parentId && category.active && !used.has(category.id))
    .map((category) => ({ id: category.id, name: category.name }));

  const total = services.length;
  // الوزن: البيانات الناقصة أخطر من قِدَم التأكيد، والتخصصات الفاضية مؤشر نمو.
  const penalty = total
    ? Math.min(70, Math.round((incomplete.length / total) * 55)) + Math.min(15, Math.round((stale.length / total) * 20))
    : 0;
  const emptyPenalty = Math.min(15, emptySpecialties.length);
  const score = total ? Math.max(0, 100 - penalty - emptyPenalty) : 0;

  return { providers: total, score, stale, incomplete, emptySpecialties };
}

/** جملة واحدة تشرح الدرجة — تظهر جنب الرقم في اللوحة. */
export function healthVerdict(score: number) {
  if (score >= 85) return { label: "الدليل ممتاز", tone: "good" as const };
  if (score >= 65) return { label: "محتاج تحديث خفيف", tone: "warn" as const };
  if (score >= 40) return { label: "محتاج صيانة قريبة", tone: "warn" as const };
  return { label: "بيانات كتير قديمة أو ناقصة", tone: "bad" as const };
}

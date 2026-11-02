/**
 * شريط «وصل حديثًا»: آخر المهن والخدمات اللي سجلت في الدليل خلال آخر ٧ أيام.
 * منطق نقي بلا اعتماديات — يقدر يشتغل على السيرفر وعلى المتصفح ويمكن اختباره مباشرة.
 */

export const NEW_ARRIVALS_DAYS = 7;
export const NEW_ARRIVALS_LIMIT = 10;

type ArrivalCandidate = { id: string; name?: string; status?: string; featured?: boolean; createdAt?: string | null };

/** الخدمات المنشورة فعليًا فقط (الطلبات المعلّقة والموقوفة لا تظهر للزوار). */
function isPublished(status: string | undefined) {
  return !status || status === "published" || status === "approved" || status === "active";
}

/**
 * آخر الخدمات المضافة (الأحدث أولًا) خلال آخر ٧ أيام.
 * - المميز يظهر في الآخر داخل نفس الشريط حتى لا يزاحم الوافدين الجدد.
 * - الخدمات من غير تاريخ صالح تُستبعد (مفيش طريقة نتأكد إنها جديدة).
 */
export function newArrivalServices<T extends ArrivalCandidate>(services: T[], now = Date.now(), days = NEW_ARRIVALS_DAYS, limit = NEW_ARRIVALS_LIMIT): T[] {
  const windowMs = days * 24 * 60 * 60 * 1000;
  return services
    .filter((service) => isPublished(service.status))
    .map((service) => ({ service, created: Date.parse(String(service.createdAt ?? "")) }))
    .filter((entry) => Number.isFinite(entry.created) && entry.created <= now + 60_000 && now - entry.created < windowMs)
    .sort((a, b) => Number(Boolean(a.service.featured)) - Number(Boolean(b.service.featured)) || b.created - a.created)
    .slice(0, Math.max(1, limit))
    .map((entry) => entry.service);
}

/** «النهاردة» / «إمبارح» / «من ٤ أيام» — تاريخ مختصر مفهوم على الشريط. */
export function arrivalDayLabel(createdAt: string | null | undefined, now = Date.now()): string {
  const created = Date.parse(String(createdAt ?? ""));
  if (!Number.isFinite(created)) return "";
  const days = Math.floor(Math.max(0, now - created) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "النهاردة";
  if (days === 1) return "إمبارح";
  if (days === 2) return "من يومين";
  return `من ${days} أيام`;
}

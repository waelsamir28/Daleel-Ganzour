/**
 * انتهاء الإعلانات المتحركة تلقائيًا + تنبيه الإدارة قبل النهاية بيومين.
 *
 * - الإعلان بيقف لوحده في الميعاد المحدد لأن `isAdLive` بيرفض أي إعلان بعد `endsAt`.
 * - هنا بنحسب حالة كل إعلان (شغال / هينتهي قريبًا / انتهى / مجدول / موقوف)
 *   وبنبني رسالة التنبيه اللي بتوصل للإدارة قبل الانتهاء بـ AD_EXPIRY_WARNING_DAYS يوم.
 */
export const AD_EXPIRY_WARNING_DAYS = 2;
const DAY = 86_400_000;

export type AdExpiryState = "paused" | "scheduled" | "expired" | "expiring" | "live";

export type AdExpiryInfo = {
  state: AdExpiryState;
  /** الأيام المتبقية (٠ لو انتهى أو بلا نهاية). */
  daysLeft: number;
  /** الساعات المتبقية — مفيدة في آخر يوم. */
  hoursLeft: number;
  label: string;
};

type AdLike = { active: boolean; startsAt: string | null; endsAt: string | null; hasImage?: boolean; template?: string };

function parseEnd(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** حالة الإعلان دلوقتي + الكلام اللي يظهر في لوحة التحكم. */
export function adExpiryInfo(ad: AdLike, now = Date.now()): AdExpiryInfo {
  if (!ad.active || (!ad.hasImage && !ad.template)) return { state: "paused", daysLeft: 0, hoursLeft: 0, label: "موقوف" };
  const start = ad.startsAt ? Date.parse(ad.startsAt) : Number.NaN;
  if (Number.isFinite(start) && start > now) return { state: "scheduled", daysLeft: Math.ceil((start - now) / DAY), hoursLeft: Math.ceil((start - now) / 3_600_000), label: "مجدول — لسه ما بدأش" };
  const end = parseEnd(ad.endsAt);
  if (end === null) return { state: "live", daysLeft: 0, hoursLeft: 0, label: "شغال — بلا تاريخ نهاية" };
  const left = end - now;
  if (left <= 0) return { state: "expired", daysLeft: 0, hoursLeft: 0, label: "انتهى — اتوقف تلقائيًا" };
  const hoursLeft = Math.ceil(left / 3_600_000);
  const daysLeft = Math.ceil(left / DAY);
  if (daysLeft <= AD_EXPIRY_WARNING_DAYS) {
    return { state: "expiring", daysLeft, hoursLeft, label: hoursLeft <= 24 ? `هينتهي بعد ${hoursLeft} ساعة` : `هينتهي بعد ${daysLeft} يوم` };
  }
  return { state: "live", daysLeft, hoursLeft, label: `شغال — باقي ${daysLeft} يوم` };
}

/** الإعلانات اللي هتنتهي خلال المدة المحددة (افتراضيًا يومين)، الأقرب نهاية الأول. */
export function expiringAds<T extends AdLike>(ads: T[], now = Date.now(), days = AD_EXPIRY_WARNING_DAYS): Array<T & { info: AdExpiryInfo }> {
  return ads
    .map((ad) => ({ ...ad, info: adExpiryInfo(ad, now) }))
    .filter((ad): ad is T & { info: AdExpiryInfo } => ad.info.state === "expiring")
    .sort((a, b) => a.info.hoursLeft - b.info.hoursLeft);
}

/** ملخّص سريع للوحة التحكم. */
export function adExpirySummary(ads: AdLike[], now = Date.now()) {
  const states = ads.map((ad) => adExpiryInfo(ad, now));
  return {
    total: ads.length,
    live: states.filter((state) => state.state === "live").length,
    expiring: states.filter((state) => state.state === "expiring").length,
    expired: states.filter((state) => state.state === "expired").length,
    scheduled: states.filter((state) => state.state === "scheduled").length,
    paused: states.filter((state) => state.state === "paused").length,
  };
}

/** مفتاح منع تكرار التنبيه: نفس الإعلان بنفس تاريخ النهاية يتبعت عنه تنبيه مرة واحدة. */
export function adExpiryAlertKey(ad: { id: string; endsAt: string | null }): string {
  return `${ad.id}@${ad.endsAt ?? "none"}`;
}

/** نص تنبيه الإدارة (واتساب / إشعار لوحة التحكم). */
export function adExpiryAlertMessage(ad: { title: string; endsAt: string | null }, daysLeft = AD_EXPIRY_WARNING_DAYS): string {
  const when = ad.endsAt ? new Date(ad.endsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }) : "";
  const left = daysLeft <= 1 ? "بكرة" : `بعد ${daysLeft} يوم`;
  return `الإعلان «${ad.title}» هينتهي ${left}${when ? ` (${when})` : ""} وهيتوقف تلقائيًا. مدّد المدة من لوحة التحكم لو عايزه يكمل.`;
}

/** تمديد تاريخ النهاية بعدد أيام من آخر يوم محسوب (أو من الآن لو انتهى/بلا تاريخ). */
export function extendAdEndsAt(endsAt: string | null, days: number, now = Date.now()): string {
  const current = parseEnd(endsAt);
  const base = current && current > now ? current : now;
  return new Date(base + days * DAY).toISOString();
}

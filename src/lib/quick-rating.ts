/**
 * «قيّم تجربتك» بعد الاتصال أو الواتساب — منطق نقي مشترك.
 *
 * الزائر بيتصل بمقدم خدمة، وبعد ثوانٍ تظهر له بطاقة صغيرة: «اتصلت بفلان؟ قيّمه من ٥ نجوم».
 * العضو المسجّل: تقييمه يدخل نظام التقييمات العادي (يظهر بعد مراجعة الإدارة).
 * الزائر غير المسجّل: تقييمه يُحفظ كمؤشر رضا مجهول (نجوم فقط) يظهر في إحصاءات الإدارة.
 *
 * الملف بدون أي اعتماد على المتصفح أو قاعدة البيانات حتى يُختبر مباشرة.
 */

/** الحدث العام الذي يُطلق عند الضغط على «اتصال» أو «واتساب» — تسمعه بطاقة التقييم. */
export const CONTACT_EVENT = "janzour:contact";
/** المفاتيح المحفوظة على جهاز الزائر: من قيّمناه بالفعل، حتى لا نكرر السؤال. */
export const QUICK_RATING_STORAGE_KEY = "janzour-quick-rated-v1";
export const QUICK_RATING_MAX_REMEMBERED = 40;
export const QUICK_RATING_STARS = [1, 2, 3, 4, 5] as const;

export type QuickRatingInput = { serviceId?: unknown; stars?: unknown };
export type CleanQuickRating = { serviceId: string; stars: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** يتحقق من التقييم القادم من المتصفح (٥ نجوم كحد أقصى) أو يرجّع null. */
export function sanitizeQuickRating(input: QuickRatingInput): CleanQuickRating | null {
  const serviceId = typeof input.serviceId === "string" ? input.serviceId.trim() : "";
  const stars = Number(input.stars);
  if (!UUID.test(serviceId)) return null;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return null;
  return { serviceId, stars };
}

/** نص البطاقة: اسم قصير إن وُجد، وإلا صيغة عامة. */
export function quickRatingText(serviceName?: string) {
  const name = (serviceName ?? "").trim();
  return {
    title: name ? `اتصلت بـ ${name}؟` : "قيّمت تجربتك؟",
    body: "قيّم الخدمة من ٥ نجوم — رأيك بيساعد جيرانك على اختيار الأفضل.",
    thanks: "شكرًا! وصلنا تقييمك.",
  };
}

/** قائمة المعرّفات التي قيّمها الجهاز (تُقرأ من localStorage بحذر). */
export function parseRatedServices(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && UUID.test(item)).slice(0, QUICK_RATING_MAX_REMEMBERED) : [];
  } catch { return []; }
}

/** يضيف معرّفًا للقائمة (بدون تكرار) ويحافظ على الحد الأقصى. */
export function rememberRated(raw: string | null | undefined, serviceId: string): string[] {
  const list = parseRatedServices(raw);
  if (list.includes(serviceId)) return list;
  return [serviceId, ...list].slice(0, QUICK_RATING_MAX_REMEMBERED);
}

/** هل نسأل هذا الزائر عن هذه الخدمة؟ (مرة واحدة لكل خدمة على كل جهاز) */
export function shouldAskQuickRating(raw: string | null | undefined, serviceId: string) {
  return UUID.test(serviceId) && !parseRatedServices(raw).includes(serviceId);
}

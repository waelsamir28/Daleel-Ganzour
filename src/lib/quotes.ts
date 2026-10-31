/**
 * «اطلب عرض سعر من ٣ مهنيين» — منطق نقي مشترك (بدون قاعدة بيانات أو متصفح).
 *
 * الزائر بيوصف اللي محتاجه مرة واحدة، والطلب بيوصل لتلات مهنيين في نفس التخصص،
 * وبيظهر له رقم كل واحد وزر واتساب برسالة جاهزة فيها تفاصيل الطلب كاملة.
 * كل ده بدون تسجيل وبدون ما يحتاج يكتب الطلب تاني لكل واحد.
 */

export const QUOTE_DETAILS_MIN = 10;
export const QUOTE_DETAILS_MAX = 400;
export const QUOTE_NAME_MAX = 120;
export const QUOTE_TARGETS = 3;

export type QuoteInput = { name?: unknown; phone?: unknown; details?: unknown; categoryId?: unknown; area?: unknown };
export type CleanQuote = { name: string; phone: string; details: string; categoryId: string; area: string };

/** يتحقق من طلب العرض ويرجّع نسخة نظيفة (بالعربي المفكوك) أو رسالة خطأ مفهومة. */
export function cleanQuoteRequest(input: QuoteInput): { ok: true; value: CleanQuote } | { ok: false; error: string } {
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim().slice(0, QUOTE_NAME_MAX);
  const phone = String(input.phone ?? "").replace(/[^\d+]/g, "").trim();
  const details = String(input.details ?? "").replace(/\s+/g, " ").trim().slice(0, QUOTE_DETAILS_MAX);
  const categoryId = String(input.categoryId ?? "").trim();
  const area = String(input.area ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (name.length < 2) return { ok: false, error: "اكتب اسمك الأول." };
  if (!/^(\+?20)?01[0125]\d{8}$/.test(phone)) return { ok: false, error: "اكتب رقم موبايل مصري صحيح (مثال 01012345678)." };
  if (details.length < QUOTE_DETAILS_MIN) return { ok: false, error: "اكتب تفاصيل أوضح (١٠ حروف على الأقل) — مثال: «تشطيب شقة ١٢٠ متر في السوق القديم»." };
  if (!/^[a-z0-9][a-z0-9-]{1,59}$/i.test(categoryId)) return { ok: false, error: "اختار التخصص المطلوب." };
  return { ok: true, value: { name, phone, details, categoryId, area } };
}

/** رسالة الواتساب اللي بتوصل للمهني — فيها كل تفاصيل الطلب ورقم الزائر. */
export function quoteWhatsappMessage(quote: Pick<CleanQuote, "name" | "phone" | "details" | "area">, serviceName: string, categoryName: string, siteName = "دليل جنزور") {
  return [
    `السلام عليكم ${serviceName} 👋`,
    `وصلت لحضرتك من ${siteName} — طلب عرض سعر لخدمة ${categoryName}.`,
    `التفاصيل: ${quote.details}`,
    quote.area ? `المنطقة: ${quote.area}` : "",
    `الاسم: ${quote.name} — الموبايل: ${quote.phone}`,
    "لو الطلب مناسب لحضرتك، ابعتها بالسعر أو معاد المعاينة. شكرًا 🌿",
  ].filter(Boolean).join("\n");
}

/** نص مختصر يظهر في لوحة الإدارة. */
export function quoteSummary(details: string, max = 120) {
  const text = (details ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

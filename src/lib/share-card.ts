/**
 * «كارت المهني» كصورة جاهزة للمشاركة (واتساب/فيسبوك/ستوري) أو للطباعة.
 *
 * الفكرة: كل مقدم خدمة يقدر يطلّع كارت من بياناته المنشورة (الاسم + التخصص + المنطقة +
 * الأرقام + QR لصفحته) ويحفظه صورة على موبايله ويبعته للعملاء أو يعلّقه في المحل —
 * من غير أي تصميم يدوي ومن غير ما يحتاج حساب على الدليل.
 *
 * هذا الملف نقي (بدون Canvas أو DOM) حتى يُختبر بسهولة؛ الرسم نفسه في
 * `src/components/share-card-modal.tsx`.
 */

/** مقاس الكارت: 1080×1350 (4:5) — نفس مقاس صور السوشيال المرفقة في docs/social. */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

export type ShareCardData = {
  /** اسم المهني أو المحل. */
  name: string;
  /** التخصص كما يظهر في الدليل (مثال: سباكة — الحرفيين). */
  headline: string;
  /** المنطقة/العنوان المختصر. */
  area: string;
  /** رقم أساسي ورقم إضافي (اختياري). */
  phones: string[];
  /** رابط الصفحة التي يفتحها QR. */
  url: string;
  siteName: string;
  /** رقم مكتب الدليل (يُطبع أسفل الكارت). */
  officePhone?: string;
  /** لون القسم — يُستخدم في شريط الكارت والتفاصيل. */
  accent?: string;
  verified?: boolean;
  rating?: string;
  reviews?: number;
  /** صورة شخصية اختيارية (رابط على نفس الموقع). */
  photoUrl?: string;
  /** شعار الموقع الاختياري. */
  logoUrl?: string;
};

export const DEFAULT_CARD_ACCENT = "#0b5f9e";

/** يرجّع لونًا سليمًا للكارت مهما كان المحفوظ غير صحيح. */
export function cardAccent(value?: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : DEFAULT_CARD_ACCENT;
}

/** اسم الملف عند الحفظ — يمنع الرموز التي تكسر التنزيل على أندرويد/ويندوز. */
export function shareCardFileName(name: string, extension = "png") {
  const clean = (name || "").replace(/[\\/:*?"<>|\n\r\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return `كارت-${clean || "مهني"}-دليل-جنزور.${extension}`;
}

/** أرقام الكارت بعد التنظيف (بدون تكرار وبدون فراغات). */
export function shareCardPhones(phones: (string | undefined | null)[]) {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const phone of phones) {
    const value = (phone ?? "").trim();
    if (!value) continue;
    const key = value.replace(/\D/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push(value);
  }
  return list.slice(0, 2);
}

/** النص المرفق مع الصورة لما تُشارك على واتساب. */
export function shareCardCaption(data: ShareCardData) {
  const phones = shareCardPhones(data.phones);
  const lines = [
    `🪪 بطاقة ${data.name}`,
    data.headline ? `🏷️ ${data.headline}` : "",
    data.area ? `📍 ${data.area}` : "",
    phones.length ? `📞 ${phones.join(" — ")}` : "",
    `🔗 ${data.url}`,
    `— من ${data.siteName}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** سطور المعلومات التي تُرسم على الكارت (تختفي الخانات الفارغة). */
export function shareCardFacts(data: ShareCardData) {
  const facts: { label: string; value: string; ltr?: boolean }[] = [];
  const phones = shareCardPhones(data.phones);
  if (phones.length) facts.push({ label: phones.length > 1 ? "أرقام التواصل" : "رقم التواصل", value: phones.join("  •  "), ltr: true });
  if (data.area) facts.push({ label: "المنطقة", value: data.area });
  const rating = Number.parseFloat(data.rating ?? "");
  if (Number.isFinite(rating) && rating > 0) facts.push({ label: "التقييم", value: `${rating.toFixed(1)} من 5${data.reviews ? ` • ${data.reviews} تقييم` : ""}` });
  return facts;
}

/** هل الكارت فيه الحد الأدنى اللي يخليه مفيد؟ (اسم + رابط). */
export function shareCardReady(data: ShareCardData) {
  return Boolean(data.name.trim() && data.url.trim());
}

/**
 * نصوص وروابط ملصق QR لكل قسم (بدون اعتماد على إطار العمل حتى يُختبر مباشرة).
 * الملصق بيتطبع بحجم A6 وبيتحط في الصيدلية/العيادة/المحل: «كل عيادات جنزور في مكان واحد — امسح».
 */
export type SectionLike = { id: string; name: string };

/** عنوان الملصق وسطوره — حسب اسم القسم. */
export function sectionStickerText(name: string) {
  const clean = (name ?? "").replace(/\s+/g, " ").trim() || "خدمات جنزور";
  return {
    title: `كل ${clean} في مكان واحد`,
    action: "امسح الكود",
    sub: "أرقام وعناوين وأزرار اتصال وواتساب فورية",
    hint: "افتح كاميرا الموبايل ووجّهها للرمز، ثم اضغط الرابط",
  };
}

/** رابط القسم اللي بيفتحه الكود. */
export function sectionStickerUrl(origin: string, sectionId: string) {
  return `${(origin || "https://daleel-ganzour.vercel.app").replace(/\/+$/, "")}/categories/${encodeURIComponent(sectionId)}`;
}

/** اسم ملف PNG نضيف (بدون رموز ممنوعة في أسماء الملفات). */
export function sectionStickerFileName(name: string) {
  return `ملصق-${(name ?? "قسم").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim()}.png`;
}

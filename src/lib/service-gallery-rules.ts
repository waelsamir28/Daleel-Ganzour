/**
 * قواعد معرض صور الأعمال (بدون أي اعتماد على الخادم أو قاعدة البيانات،
 * فتصلح للاستخدام في اختبارات الوحدة وفي المتصفح لو احتجنا).
 */
export const SERVICE_GALLERY_MAX = 4;
/**
 * أقصى حجم للصورة الواحدة بعد التصغير والضغط في المتصفح.
 * الصورة تُصغَّر إلى 1400 بكسل بجودة متغيرة حتى تهبط تحت هذا الحد، وعادةً تنتهي بين 60 و200 كيلوبايت.
 */
export const SERVICE_GALLERY_MAX_BYTES = 300 * 1024;
/** الحد الأقصى للملف الأصلي قبل الضغط (٣ ميجابايت) — يُفحص في المتصفح أولًا ثم في الخادم. */
export const SERVICE_GALLERY_MAX_FILE = 3 * 1024 * 1024;
/** صيغ الصور المقبولة في المعرض (بدون GIF حتى تبقى الصورة بالكيلوبايت). */
export const SERVICE_GALLERY_MIME = "image/(?:webp|jpeg|png)";

export type GalleryPhotoPayload = { mime: string; base64: string };

export function gallerySlotNumber(value: unknown): number {
  const slot = Number(value);
  if (!Number.isInteger(slot) || slot < 1 || slot > SERVICE_GALLERY_MAX) throw new Error("خانة الصورة غير صحيحة (1 إلى 4).");
  return slot;
}

/** يحوّل الحقل المخزَّن «1,3» إلى قائمة خانات مرتبة بلا تكرار. */
export function gallerySlotList(stored: string | null | undefined): number[] {
  return (stored ?? "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((slot) => Number.isInteger(slot) && slot >= 1 && slot <= SERVICE_GALLERY_MAX)
    .filter((slot, index, list) => list.indexOf(slot) === index)
    .sort((a, b) => a - b);
}

/**
 * يقرأ صورة معرض واحدة:
 * - null أو "" → حذف الصورة من الخانة
 * - data URL (webp/jpeg/png) → صورة جديدة
 */
export function parseGalleryPhoto(value: unknown): GalleryPhotoPayload | null {
  if (value === null || value === undefined || value === "" || value === false) return null;
  if (typeof value !== "string") throw new Error("صيغة صورة العمل غير صحيحة.");
  const match = new RegExp(`^data:(${SERVICE_GALLERY_MIME});base64,([A-Za-z0-9+/=]+)$`).exec(value.trim());
  if (!match) throw new Error("صور الأعمال يجب أن تكون JPG أو PNG أو WebP.");
  const [, mime, base64] = match;
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (bytes < 200) throw new Error("صورة العمل فارغة أو تالفة.");
  if (bytes > SERVICE_GALLERY_MAX_BYTES) throw new Error("صورة العمل كبيرة بعد الضغط. أعد اختيارها من جديد.");
  return { mime, base64 };
}

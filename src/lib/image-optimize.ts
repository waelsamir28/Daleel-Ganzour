import "server-only";

/**
 * إعادة ترميز الصور المرفوعة (أيقونات التخصصات، لوجو/سبلاش/بانرات المظهر) إلى WebP بمقاس مناسب
 * باستخدام sharp (مرفق مع Next.js). الهدف: صور أصغر 5–20 مرة → فتح الأقسام أسرع واستهلاك بيانات أقل.
 * GIF يُترك كما هو (قد يكون متحركًا)، وعند أي فشل تُعاد الصورة الأصلية دون تغيير.
 */
export type StoredImage = { mime: string; base64: string };
type Limits = { maxWidth: number; maxHeight: number; quality?: number };

export const ICON_LIMITS: Limits = { maxWidth: 320, maxHeight: 320, quality: 84 };
export function designImageLimits(key: string): Limits {
  switch (key) {
    case "header-logo": return { maxWidth: 400, maxHeight: 400, quality: 86 };
    case "splash": return { maxWidth: 700, maxHeight: 700, quality: 86 };
    case "auth-banner": case "auth-banner-dark": case "register-banner": case "register-banner-dark": return { maxWidth: 1400, maxHeight: 900, quality: 82 };
    default: return { maxWidth: 1600, maxHeight: 900, quality: 82 };
  }
}

async function loadSharp() {
  try { return (await import("sharp")).default; } catch { return null; }
}

/** يعيد نسخة WebP مصغّرة إن أمكن؛ `changed=false` تعني أن الأصل أُبقي كما هو. */
export async function optimizeStoredImage(image: StoredImage, limits: Limits): Promise<StoredImage & { changed: boolean }> {
  if (!/^image\/(png|jpeg|webp)$/.test(image.mime)) return { ...image, changed: false };
  const sharp = await loadSharp();
  if (!sharp) return { ...image, changed: false };
  try {
    const input = Buffer.from(image.base64, "base64");
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: limits.maxWidth, height: limits.maxHeight, fit: "inside", withoutEnlargement: true })
      .webp({ quality: limits.quality ?? 82, effort: 4 })
      .toBuffer();
    if (!output.byteLength || (image.mime === "image/webp" && output.byteLength >= input.byteLength)) return { ...image, changed: false };
    return { mime: "image/webp", base64: output.toString("base64"), changed: true };
  } catch { return { ...image, changed: false }; }
}
/** الصور المخزّنة قديمًا بصيغة PNG/JPG تُحوَّل مرة واحدة عند أول طلب ثم تُحفظ محسّنة (الرابط لا يتغير). */
export function needsLazyOptimize(mime: string) { return /^image\/(png|jpeg)$/.test(mime); }
/** ترويسات تخزين الصور الثابتة ذات الرابط المرقّم (?v=): المتصفح + شبكة Vercel الحدودية لسنة كاملة. */
export const IMMUTABLE_IMAGE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
} as const;

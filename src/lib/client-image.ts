/**
 * تصغير الصورة داخل المتصفح قبل رفعها (صور الهاتف 3–8 ميجا تصبح بضع مئات من الكيلوبايت)،
 * حتى لا يفشل الرفع بسبب حدّ الحجم ولا تثقل الصفحات. GIF يُترك كما هو حفاظًا على الحركة.
 */
export type ShrinkOptions = { maxWidth: number; maxHeight: number; quality?: number; preferAlpha?: boolean };

export function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

async function decode(file: File): Promise<{ draw: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { draw: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch { /* نرجع للطريقة التقليدية */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("تعذّر قراءة الصورة."));
      el.src = url;
    });
    return { draw: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

let webpSupported: boolean | null = null;
function canEncodeWebp() {
  if (webpSupported !== null) return webpSupported;
  try { webpSupported = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp"); } catch { webpSupported = false; }
  return webpSupported;
}

/** يعيد data URL مصغّرًا + أبعاد الصورة الأصلية. */
export async function shrinkImageFile(file: File, options: ShrinkOptions): Promise<{ dataUrl: string; width: number; height: number; bytes: number }> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error("صيغة الصورة غير مدعومة. ارفع PNG أو JPG أو WebP أو GIF.");
  if (file.type === "image/gif") return { dataUrl: await readFileAsDataUrl(file), width: 0, height: 0, bytes: file.size };
  const source = await decode(file);
  try {
    const scale = Math.min(1, options.maxWidth / source.width, options.maxHeight / source.height);
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("المتصفح لا يدعم معالجة الصور.");
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.draw, 0, 0, width, height);
    const quality = (options.quality ?? 86) / 100;
    const alphaSource = file.type === "image/png" || file.type === "image/webp";
    const type = canEncodeWebp() ? "image/webp" : alphaSource && options.preferAlpha ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(type, quality);
    const bytes = Math.floor(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);
    // لو التصغير لم يفد (ملف صغير أصلًا) نرفع الأصل كما هو.
    if (bytes >= file.size && scale === 1) return { dataUrl: await readFileAsDataUrl(file), width: source.width, height: source.height, bytes: file.size };
    return { dataUrl, width: source.width, height: source.height, bytes };
  } finally { source.release(); }
}

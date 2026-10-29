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
    case "page-bg": case "page-bg-dark": return { maxWidth: 1600, maxHeight: 2600, quality: 78 };
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
/**
 * إزالة الخلفية الصلبة (بيضاء أو بلون واحد) من شعار/صورة شاشة البداية لتصبح شفافة:
 * - يُستنتج لون الخلفية من حواف الصورة؛ إن لم تكن الحواف بلون شبه موحّد (صورة فوتوغرافية) لا نلمس الصورة.
 * - تعبئة بالفيض من الحواف فقط، فالمساحات البيضاء داخل الشعار (كعين أو حرف) تبقى.
 * - حواف ناعمة (تدرّج شفافية) ثم قصّ الهوامش الشفافة وحفظ WebP بقناة ألفا.
 */
export async function removeFlatBackground(image: StoredImage): Promise<StoredImage & { changed: boolean; reason?: string }> {
  if (!/^image\/(png|jpeg|webp)$/.test(image.mime)) return { ...image, changed: false, reason: "صيغة غير مدعومة" };
  const sharp = await loadSharp();
  if (!sharp) return { ...image, changed: false, reason: "معالج الصور غير متاح" };
  try {
    const input = Buffer.from(image.base64, "base64");
    const { data, info } = await sharp(input, { failOn: "none" }).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info; const ch = 4;
    // لون الخلفية = متوسط عينات الحواف غير الشفافة
    const samples: number[][] = [];
    const push = (x: number, y: number) => { const i = (y * width + x) * ch; if (data[i + 3] > 200) samples.push([data[i], data[i + 1], data[i + 2]]); };
    const step = Math.max(1, Math.floor(Math.max(width, height) / 64));
    for (let x = 0; x < width; x += step) { push(x, 0); push(x, height - 1); }
    for (let y = 0; y < height; y += step) { push(0, y); push(width - 1, y); }
    if (samples.length < 8) return { ...image, changed: false, reason: "الحواف شفافة بالفعل" };
    const bg = [0, 1, 2].map((c) => samples.reduce((sum, px) => sum + px[c], 0) / samples.length);
    const dist = (i: number) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    const TOL = 48, SOFT = 110;
    const uniform = samples.filter((px) => Math.hypot(px[0] - bg[0], px[1] - bg[1], px[2] - bg[2]) <= TOL).length / samples.length;
    if (uniform < 0.85) return { ...image, changed: false, reason: "الخلفية ليست لونًا واحدًا" };
    if (Math.min(...bg) < 60) return { ...image, changed: false, reason: "الخلفية داكنة" };
    const mark = new Uint8Array(width * height);
    const queue = new Int32Array(width * height); let head = 0, tail = 0;
    const tryPush = (x: number, y: number) => {
      const p = y * width + x; if (mark[p]) return; const i = p * ch;
      if (data[i + 3] < 20 || dist(i) <= TOL) { mark[p] = 1; queue[tail++] = p; }
    };
    for (let x = 0; x < width; x++) { tryPush(x, 0); tryPush(x, height - 1); }
    for (let y = 0; y < height; y++) { tryPush(0, y); tryPush(width - 1, y); }
    while (head < tail) {
      const p = queue[head++]; const x = p % width, y = (p - x) / width;
      if (x > 0) tryPush(x - 1, y); if (x < width - 1) tryPush(x + 1, y); if (y > 0) tryPush(x, y - 1); if (y < height - 1) tryPush(x, y + 1);
    }
    const removed = tail;
    if (removed < width * height * 0.02) return { ...image, changed: false, reason: "لا توجد خلفية صلبة حول الشعار" };
    if (removed > width * height * 0.985) return { ...image, changed: false, reason: "الصورة كلها بلون الخلفية" };
    for (let p = 0; p < mark.length; p++) {
      const i = p * ch;
      if (mark[p]) { data[i + 3] = 0; continue; }
      const x = p % width, y = (p - x) / width;
      const nearEdge = (x > 0 && mark[p - 1]) || (x < width - 1 && mark[p + 1]) || (y > 0 && mark[p - width]) || (y < height - 1 && mark[p + width]);
      if (nearEdge) { const d = dist(i); if (d < SOFT) data[i + 3] = Math.min(data[i + 3], Math.round(255 * Math.max(0.15, (d - TOL * 0.5) / (SOFT - TOL * 0.5)))); }
    }
    let pipeline = sharp(data, { raw: { width, height, channels: 4 } });
    try { pipeline = sharp(await pipeline.png().toBuffer()).trim({ threshold: 8 }); } catch { pipeline = sharp(data, { raw: { width, height, channels: 4 } }); }
    const output = await pipeline.webp({ quality: 92, effort: 4, alphaQuality: 95 }).toBuffer();
    if (!output.byteLength) return { ...image, changed: false, reason: "فشل الحفظ" };
    return { mime: "image/webp", base64: output.toString("base64"), changed: true };
  } catch (error) { return { ...image, changed: false, reason: error instanceof Error ? error.message : "فشل المعالجة" }; }
}
/** مفاتيح الصور التي تُزال خلفيتها الصلبة تلقائيًا عند الرفع (شعارات تظهر فوق خلفيات ملوّنة). */
export function autoTransparentKey(key: string) { return key === "splash" || key === "header-logo"; }
/** الصور المخزّنة قديمًا بصيغة PNG/JPG تُحوَّل مرة واحدة عند أول طلب ثم تُحفظ محسّنة (الرابط لا يتغير). */
export function needsLazyOptimize(mime: string) { return /^image\/(png|jpeg)$/.test(mime); }
/** ترويسات تخزين الصور الثابتة ذات الرابط المرقّم (?v=): المتصفح + شبكة Vercel الحدودية لسنة كاملة. */
export const IMMUTABLE_IMAGE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, s-maxage=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
} as const;

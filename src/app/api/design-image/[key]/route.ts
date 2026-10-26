import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { designImages } from "@/db/schema";
import { isDesignImageKey } from "@/lib/catalog";
import { IMMUTABLE_IMAGE_HEADERS, designImageLimits, needsLazyOptimize, optimizeStoredImage } from "@/lib/image-optimize";

export const dynamic = "force-dynamic";

/** يعرض صورة مظهر مرفوعة من الاستوديو (لوجو/سبلاش/بانر). الرابط يحمل `?v=<version>` فيُخزَّن في المتصفح وعلى شبكة Vercel طويلًا. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!databaseConfigured || !isDesignImageKey(key)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: designImages.mime, data: designImages.data }).from(designImages).where(eq(designImages.key, key)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    let image = { mime: row.mime || "image/png", base64: row.data };
    if (needsLazyOptimize(image.mime)) {
      const optimized = await optimizeStoredImage(image, designImageLimits(key));
      if (optimized.changed) {
        image = optimized;
        try { await db.update(designImages).set({ mime: optimized.mime, data: optimized.base64 }).where(eq(designImages.key, key)); } catch { /* نعرض المحسّنة حتى لو فشل الحفظ */ }
      }
    }
    const bytes = Buffer.from(image.base64, "base64");
    return new Response(bytes, { status: 200, headers: { ...IMMUTABLE_IMAGE_HEADERS, "Content-Type": image.mime, "Content-Length": String(bytes.byteLength) } });
  } catch { return new Response("Error", { status: 500 }); }
}

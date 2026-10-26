import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { categoryIcons } from "@/db/schema";
import { ICON_LIMITS, IMMUTABLE_IMAGE_HEADERS, needsLazyOptimize, optimizeStoredImage } from "@/lib/image-optimize";

export const dynamic = "force-dynamic";

/**
 * يعرض أيقونة القسم/التخصص المرفوعة من الإدارة. الرابط يحمل `?v=<version>` فيُخزَّن في المتصفح وعلى شبكة Vercel طويلًا.
 * الأيقونات القديمة (PNG/JPG كبيرة) تُحوَّل إلى WebP صغيرة عند أول طلب وتُحفظ محسّنة.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!databaseConfigured || !/^[a-z][a-z0-9-]{1,59}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: categoryIcons.mime, data: categoryIcons.data }).from(categoryIcons).where(eq(categoryIcons.categoryId, id)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    let image = { mime: row.mime || "image/png", base64: row.data };
    if (needsLazyOptimize(image.mime)) {
      const optimized = await optimizeStoredImage(image, ICON_LIMITS);
      if (optimized.changed) {
        image = optimized;
        try { await db.update(categoryIcons).set({ mime: optimized.mime, data: optimized.base64 }).where(eq(categoryIcons.categoryId, id)); } catch { /* نعرض المحسّنة حتى لو فشل الحفظ */ }
      }
    }
    const bytes = Buffer.from(image.base64, "base64");
    return new Response(bytes, { status: 200, headers: { ...IMMUTABLE_IMAGE_HEADERS, "Content-Type": image.mime, "Content-Length": String(bytes.byteLength) } });
  } catch { return new Response("Error", { status: 500 }); }
}

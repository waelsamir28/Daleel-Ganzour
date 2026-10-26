import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { designImages } from "@/db/schema";
import { isDesignImageKey } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** يعرض صورة مظهر مرفوعة من الاستوديو (لوجو/سبلاش/بانر). الرابط يحمل `?v=<version>` فيُخزَّن في المتصفح طويلًا بأمان. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!databaseConfigured || !isDesignImageKey(key)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: designImages.mime, data: designImages.data }).from(designImages).where(eq(designImages.key, key)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, { status: 200, headers: { "Content-Type": row.mime || "image/png", "Content-Length": String(bytes.byteLength), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Error", { status: 500 }); }
}

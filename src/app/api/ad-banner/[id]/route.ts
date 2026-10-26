import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { adBanners } from "@/db/schema";
import { IMMUTABLE_IMAGE_HEADERS } from "@/lib/image-optimize";
import { validId } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Streams the stored artwork of one ad. The URL carries `?v=<imageVersion>` so browsers may cache it forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!databaseConfigured || !validId(id)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: adBanners.imageMime, data: adBanners.imageData }).from(adBanners).where(eq(adBanners.id, id)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, { status: 200, headers: { ...IMMUTABLE_IMAGE_HEADERS, "Content-Type": row.mime || "image/gif", "Content-Length": String(bytes.byteLength) } });
  } catch { return new Response("Error", { status: 500 }); }
}

import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { servicePhotos } from "@/db/schema";
import { IMMUTABLE_IMAGE_HEADERS } from "@/lib/image-optimize";

export const dynamic = "force-dynamic";

/** الصورة الشخصية للمهني (مقصوصة ومضغوطة في المتصفح قبل الرفع). الرابط يحمل `?v=<version>` فيُخزَّن طويلًا. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!databaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: servicePhotos.mime, data: servicePhotos.data }).from(servicePhotos).where(eq(servicePhotos.serviceId, id)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, { status: 200, headers: { ...IMMUTABLE_IMAGE_HEADERS, "Content-Type": row.mime || "image/webp", "Content-Length": String(bytes.byteLength) } });
  } catch { return new Response("Error", { status: 500 }); }
}

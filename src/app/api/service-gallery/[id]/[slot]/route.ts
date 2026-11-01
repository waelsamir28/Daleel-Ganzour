import { and, eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { serviceGallery } from "@/db/schema";
import { IMMUTABLE_IMAGE_HEADERS } from "@/lib/image-optimize";

export const dynamic = "force-dynamic";

/** صورة من معرض أعمال المهني (مصغَّرة ومضغوطة في المتصفح قبل الرفع). الرابط يحمل `?v=<version>` فيُخزَّن طويلًا. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; slot: string }> }) {
  const { id, slot } = await params;
  const slotNumber = Number(slot);
  if (!databaseConfigured || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 4) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const [row] = await db.select({ mime: serviceGallery.mime, data: serviceGallery.data }).from(serviceGallery)
      .where(and(eq(serviceGallery.serviceId, id), eq(serviceGallery.slot, slotNumber))).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, { status: 200, headers: { ...IMMUTABLE_IMAGE_HEADERS, "Content-Type": row.mime || "image/webp", "Content-Length": String(bytes.byteLength) } });
  } catch { return new Response("Error", { status: 500 }); }
}

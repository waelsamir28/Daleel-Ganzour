import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { categoryIcons } from "@/db/schema";

export const dynamic = "force-dynamic";

/** يعرض أيقونة القسم/التخصص المرفوعة من الإدارة. الرابط يحمل `?v=<version>` فيُخزَّن في المتصفح طويلًا بأمان. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!databaseConfigured || !/^[a-z][a-z0-9-]{1,59}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: categoryIcons.mime, data: categoryIcons.data }).from(categoryIcons).where(eq(categoryIcons.categoryId, id)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, { status: 200, headers: { "Content-Type": row.mime || "image/png", "Content-Length": String(bytes.byteLength), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Error", { status: 500 }); }
}

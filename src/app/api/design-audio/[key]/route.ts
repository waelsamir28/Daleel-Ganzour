import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { designAudio } from "@/db/schema";
import { isDesignAudioKey } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * يقدّم مقطع صوت شاشة البداية المرفوع من الاستوديو.
 * يدعم طلبات النطاق (Range) لأن سفاري على iOS يحتاجها لتشغيل الصوت بسلاسة،
 * والرابط يحمل `?v=<version>` فيُخزَّن في المتصفح طويلًا.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!databaseConfigured || !isDesignAudioKey(key)) return new Response("Not found", { status: 404 });
  try {
    const [row] = await db.select({ mime: designAudio.mime, data: designAudio.data }).from(designAudio).where(eq(designAudio.key, key)).limit(1);
    if (!row?.data) return new Response("Not found", { status: 404 });
    const bytes = Buffer.from(row.data, "base64");
    const total = bytes.byteLength;
    const baseHeaders: Record<string, string> = {
      "Content-Type": row.mime || "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };
    const range = request.headers.get("range");
    const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
      if (Number.isFinite(start) && start <= end && start < total) {
        const chunk = bytes.subarray(start, end + 1);
        return new Response(chunk, {
          status: 206,
          headers: { ...baseHeaders, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(chunk.byteLength) },
        });
      }
    }
    return new Response(bytes, { status: 200, headers: { ...baseHeaders, "Content-Length": String(total) } });
  } catch { return new Response("Error", { status: 500 }); }
}

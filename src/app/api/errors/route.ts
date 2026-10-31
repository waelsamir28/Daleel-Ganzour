import { after } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { errorLog } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { sanitizeErrorReport } from "@/lib/error-report";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { rateLimit } from "@/lib/validation";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/**
 * سجل أخطاء المتصفح: `POST` يستقبل بلاغًا مجهولًا من أي صفحة (JS error أو فشل تحميل)،
 * و`GET` يرجّع الأخطاء مجمّعة بعدد التكرار للإدارة والمشرفين فقط.
 * مفيش بيانات شخصية: الرسالة بتتنظف من الأرقام الطويلة والروابط قبل التخزين.
 */
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "error-report", 20)) throw new InputError("بلاغات كتير من نفس الجهاز.", 429);
    const body = objectInput(await request.json());
    const report = sanitizeErrorReport({
      message: body.message, detail: body.detail, path: body.path, kind: body.kind,
      userAgent: request.headers.get("user-agent") ?? "",
    });
    if (!report) return Response.json({ ok: true, saved: false });
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    // تنبيه مرة واحدة كل ساعة لكل بصمة — حتى لا يزعج المكتب خطأ متكرر في متصفح واحد.
    const [{ recent }] = await db
      .select({ recent: sql<number>`count(*)::int` })
      .from(errorLog)
      .where(sql`${errorLog.fingerprint} = ${report.fingerprint} AND ${errorLog.createdAt} > now() - interval '1 hour'`);
    await db.insert(errorLog).values(report);
    if (Number(recent ?? 0) === 0) {
      after(() => {
        void sendAdminWhatsappAlert(
          "⚠️ خطأ جديد في الموقع",
          `${report.message.slice(0, 160)}\nالصفحة: ${report.path || "/"}\nراجعه من لوحة الإدارة ← الإحصاءات.`,
          "site-error",
        ).catch(() => undefined);
      });
    }
    return Response.json({ ok: true, saved: true });
  } catch (error) { return apiError(error); }
}

/** الأخطاء مجمّعة بالبصمة (الأكثر تكرارًا أولًا) — للإدارة والمشرفين. */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ errors: [], total: 0, since: null });
    await ensureSeed();
    const hits = sql<number>`count(*)::int`;
    const lastAt = sql<string>`max(${errorLog.createdAt})`;
    const firstAt = sql<string>`min(${errorLog.createdAt})`;
    const errors = await db
      .select({
        fingerprint: errorLog.fingerprint, kind: errorLog.kind, message: errorLog.message,
        path: errorLog.path, userAgent: errorLog.userAgent, count: hits, lastAt, firstAt,
      })
      .from(errorLog)
      .groupBy(errorLog.fingerprint, errorLog.kind, errorLog.message, errorLog.path, errorLog.userAgent)
      .orderBy(desc(hits))
      .limit(40);
    const total = errors.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    return Response.json({ errors, total, since: errors[0]?.lastAt ?? null });
  } catch (error) { return apiError(error); }
}

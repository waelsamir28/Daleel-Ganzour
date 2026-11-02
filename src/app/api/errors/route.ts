import { after } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { errorLog, errorResolutions } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { sanitizeErrorReport } from "@/lib/error-report";
import { actorFromViewer, logActivity } from "@/lib/activity-log";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanText, rateLimit } from "@/lib/validation";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/**
 * سجل أخطاء المتصفح:
 * - `POST` يستقبل بلاغًا مجهولًا من أي صفحة (JS error أو فشل تحميل).
 * - `GET` يرجّع الأخطاء مجمّعة بعدد التكرار + حالة كل خطأ (مفتوح / تم إصلاحه / عاد بعد الإصلاح).
 *   `?fingerprint=` يرجّع آخر ظهورات خطأ واحد للتفاصيل الكاملة.
 * - `PATCH` زر «تم الإصلاح» (أو إعادة الفتح) — للإدارة والمشرفين.
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
          `${report.message.slice(0, 160)}\nالصفحة: ${report.path || "/"}\nراجعه من لوحة الإدارة ← الإحصائيات ← أخطاء الموقع.`,
          "site-error",
        ).catch(() => undefined);
      });
    }
    return Response.json({ ok: true, saved: true });
  } catch (error) { return apiError(error); }
}

/** الأخطاء مجمّعة بالبصمة (الأكثر تكرارًا أولًا) — للإدارة والمشرفين. */
export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ errors: [], total: 0, since: null, occurrences: [] });
    await ensureSeed();

    // وضع التفاصيل: آخر ظهورات خطأ واحد بالـ stack والجهاز والصفحة.
    const fingerprint = new URL(request.url).searchParams.get("fingerprint") ?? "";
    if (fingerprint) {
      if (!/^[a-z0-9]{4,40}$/i.test(fingerprint)) throw new InputError("بصمة الخطأ غير صحيحة.");
      const occurrences = await db
        .select({ id: errorLog.id, message: errorLog.message, detail: errorLog.detail, path: errorLog.path, userAgent: errorLog.userAgent, kind: errorLog.kind, createdAt: errorLog.createdAt })
        .from(errorLog)
        .where(eq(errorLog.fingerprint, fingerprint))
        .orderBy(desc(errorLog.createdAt))
        .limit(25);
      const [resolution] = await db.select().from(errorResolutions).where(eq(errorResolutions.fingerprint, fingerprint)).limit(1);
      return Response.json({
        errors: [], total: occurrences.length, since: occurrences[0]?.createdAt ?? null,
        resolution: resolution ? { ...resolution, resolvedAt: resolution.resolvedAt?.toISOString?.() ?? null } : null,
        occurrences: occurrences.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      });
    }

    const hits = sql<number>`count(*)::int`;
    const lastAt = sql<string>`max(${errorLog.createdAt})`;
    const firstAt = sql<string>`min(${errorLog.createdAt})`;
    const errors = await db
      .select({
        fingerprint: errorLog.fingerprint, kind: errorLog.kind, message: errorLog.message,
        path: errorLog.path, userAgent: errorLog.userAgent, count: hits, lastAt, firstAt,
        resolvedAt: errorResolutions.resolvedAt, note: errorResolutions.note, resolvedBy: errorResolutions.resolvedBy,
      })
      .from(errorLog)
      .leftJoin(errorResolutions, eq(errorResolutions.fingerprint, errorLog.fingerprint))
      .groupBy(errorLog.fingerprint, errorLog.kind, errorLog.message, errorLog.path, errorLog.userAgent, errorResolutions.resolvedAt, errorResolutions.note, errorResolutions.resolvedBy)
      .orderBy(desc(hits))
      .limit(60);
    const total = errors.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    return Response.json({ errors, total, since: errors[0]?.lastAt ?? null, occurrences: [] });
  } catch (error) { return apiError(error); }
}

/** «تم الإصلاح» / «إعادة الفتح» لخطأ من السجل. */
export async function PATCH(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) throw new InputError("السجل غير متاح في وضع المعاينة.", 503);
    const body = objectInput(await request.json());
    const fingerprint = typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";
    if (!/^[a-z0-9]{4,40}$/i.test(fingerprint)) throw new InputError("بصمة الخطأ غير صحيحة.");
    const action = body.action === "reopen" ? "reopen" : body.action === "resolve" ? "resolve" : "";
    if (!action) throw new InputError("إجراء غير معروف.");
    const note = cleanText(body.note ?? "", 300);
    const actor = actorFromViewer(viewer);

    if (action === "reopen") {
      await db.delete(errorResolutions).where(eq(errorResolutions.fingerprint, fingerprint));
      await logActivity(actor, "PATCH", { ...body, type: "error-log", action: "reopen" }, `إعادة فتح خطأ في الموقع (${fingerprint})`, note);
      return Response.json({ ok: true, fingerprint, resolvedAt: null, message: "رجع الخطأ لقائمة المفتوح." });
    }

    const [row] = await db.insert(errorResolutions)
      .values({ fingerprint, note, resolvedBy: actor.name.slice(0, 120), resolvedAt: new Date() })
      .onConflictDoUpdate({ target: errorResolutions.fingerprint, set: { note, resolvedBy: actor.name.slice(0, 120), resolvedAt: new Date() } })
      .returning({ resolvedAt: errorResolutions.resolvedAt });
    await logActivity(actor, "PATCH", { ...body, type: "error-log", action: "resolve" }, `إغلاق خطأ في الموقع (${fingerprint})`, note);
    return Response.json({ ok: true, fingerprint, resolvedAt: row?.resolvedAt?.toISOString?.() ?? new Date().toISOString(), message: "تم إغلاق الخطأ — لو رجع تاني هيظهر كـ«عاد بعد الإصلاح»." });
  } catch (error) { return apiError(error); }
}

import { after } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { telecomReports } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanText, rateLimit } from "@/lib/validation";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/** نطاقات الأكواد المسموح بها في البلاغ. */
const SCOPES = new Set(["vodafone", "orange", "etisalat", "we", "landline", "banks", "gov"]);
const SCOPE_LABELS: Record<string, string> = { vodafone: "فودافون", orange: "أورنج", etisalat: "اتصالات", we: "وي", landline: "الخط الأرضي", banks: "البنوك وتطبيقات الدفع", gov: "الأرقام الحكومية والطوارئ" };

/**
 * زر «الكود ده اتغيّر؟» في صفحة /telecom: بلاغ مجهول تمامًا (بدون اسم أو رقم أو IP مخزَّن)،
 * محمي بـ sameOrigin + rate limit، ويظهر مجمّعًا في إحصاءات لوحة الإدارة.
 */
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "code-report", 10)) throw new InputError("وصلتنا بلاغات كتير من نفس الجهاز — جرّب بعد شوية.", 429);
    const body = objectInput(await request.json());
    const scope = cleanText(body.scope ?? "", 20);
    const code = cleanText(body.code ?? "", 60);
    const label = cleanText(body.label ?? "", 160);
    if (!SCOPES.has(scope) || code.length < 2) throw new InputError("بيانات البلاغ غير مكتملة.");
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    await db.insert(telecomReports).values({ scope, code, label });
    // تنبيه واتساب للمكتب (لو مفعّل) — بعد إرسال الرد للزائر حتى لا يتأخر.
    after(() => {
      void sendAdminWhatsappAlert(
        "🚩 بلاغ: كود اتغيّر",
        `${label || "كود"} — ${code}\nالقسم: ${SCOPE_LABELS[scope] ?? scope}\nراجعه من لوحة الإدارة ← الإحصاءات.`,
        "code-report",
      ).catch(() => undefined);
    });
    return Response.json({ ok: true, saved: true });
  } catch (error) { return apiError(error); }
}

/** إحصاءات البلاغات (الأكثر تكرارًا أولًا) — للإدارة والمشرفين فقط. */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ reports: [], total: 0 });
    await ensureSeed();
    const hits = sql<number>`count(*)::int`;
    const lastAt = sql<string>`max(${telecomReports.createdAt})`;
    const reports = await db
      .select({ scope: telecomReports.scope, code: telecomReports.code, label: telecomReports.label, count: hits, lastAt })
      .from(telecomReports)
      .groupBy(telecomReports.scope, telecomReports.code, telecomReports.label)
      .orderBy(desc(hits))
      .limit(40);
    const total = reports.reduce((sum, report) => sum + Number(report.count ?? 0), 0);
    return Response.json({ reports, total, grouped: reports.length });
  } catch (error) { return apiError(error); }
}

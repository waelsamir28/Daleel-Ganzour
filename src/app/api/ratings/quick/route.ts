import { after } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { notifications, quickRatings, serviceRatings, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed, withDirectoryInvalidation } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { sanitizeQuickRating } from "@/lib/quick-rating";
import { cleanText, rateLimit } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/**
 * «قيّم تجربتك» بعد الاتصال:
 * - العضو المسجّل: التقييم يدخل نظام التقييمات العادي (ينتظر مراجعة الإدارة).
 * - الزائر: تقييم مجهول بالنجوم فقط (بدون اسم أو رقم) يظهر كمؤشر رضا في الإحصاءات.
 */
export const POST = withDirectoryInvalidation(async (request: Request) => {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "quick-rating", 12)) throw new InputError("تقييمات كتير من نفس الجهاز — جرّب بعد شوية.", 429);
    const clean = sanitizeQuickRating(objectInput(await request.json()));
    if (!clean) throw new InputError("التقييم غير مكتمل.", 400);
    if (!databaseConfigured) return Response.json({ ok: true, saved: false, mode: "preview" });
    await ensureSeed();
    const [service] = await db.select({ id: services.id, name: services.name, status: services.status }).from(services).where(eq(services.id, clean.serviceId)).limit(1);
    if (!service || service.status !== "approved") throw new InputError("الخدمة غير متاحة للتقييم.", 404);
    const viewer = await getViewer();
    if (viewer.role !== "guest" && viewer.id) {
      await db.insert(serviceRatings).values({ serviceId: clean.serviceId, memberId: viewer.id, stars: clean.stars, comment: "" })
        .onConflictDoUpdate({ target: [serviceRatings.serviceId, serviceRatings.memberId], set: { stars: clean.stars, comment: "", status: "pending", createdAt: new Date() } });
      await db.insert(notifications).values({ type: "rating", title: `تقييم سريع: ${service.name}`, message: `${clean.stars} من 5 من ${viewer.name} (بعد الاتصال)`, entityId: clean.serviceId });
      after(() => { queueAdminWhatsappAlert("rating", "⭐ تقييم سريع", `${service.name}: ${clean.stars} من 5 من ${viewer.name}`); });
      return Response.json({ ok: true, saved: true, mode: "member", message: "شكرًا! تقييمك هيظهر بعد مراجعة الإدارة." }, { status: 201 });
    }
    await db.insert(quickRatings).values({ serviceId: clean.serviceId, stars: clean.stars });
    return Response.json({ ok: true, saved: true, mode: "guest", message: "شكرًا! وصلنا تقييمك." }, { status: 201 });
  } catch (error) { return apiError(error); }
});

/** ملخص رضا الزوار (إجمالي + لكل خدمة) — للإدارة والمشرفين فقط. */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ total: 0, average: 0, services: [] });
    await ensureSeed();
    const hits = sql<number>`count(*)::int`;
    const avg = sql<number>`round(avg(${quickRatings.stars})::numeric, 2)`;
    const rows = await db
      .select({ serviceId: quickRatings.serviceId, name: services.name, count: hits, average: avg, lastAt: sql<string>`max(${quickRatings.createdAt})` })
      .from(quickRatings)
      .leftJoin(services, eq(services.id, quickRatings.serviceId))
      .groupBy(quickRatings.serviceId, services.name)
      .orderBy(desc(hits))
      .limit(30);
    const total = rows.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    const weighted = rows.reduce((sum, row) => sum + Number(row.average ?? 0) * Number(row.count ?? 0), 0);
    return Response.json({
      total,
      average: total ? Number((weighted / total).toFixed(2)) : 0,
      services: rows.map((row) => ({ serviceId: row.serviceId, name: cleanText(row.name ?? "", 120), count: Number(row.count ?? 0), average: Number(row.average ?? 0), lastAt: row.lastAt })),
    });
  } catch (error) { return apiError(error); }
}

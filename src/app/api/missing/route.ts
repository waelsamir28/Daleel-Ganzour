import { desc, eq, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { missingProfessionRequests, notifications, directoryCategories } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanMissingRequest, missingSummary } from "@/lib/missing-profession";
import { rateLimit, validId } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

/**
 * «مهنتي مش موجودة»:
 * - POST (أي زائر): يحفظ الطلب ويوصل للإدارة كإشعار + تنبيه واتساب.
 * - GET (الإدارة): كل الطلبات.
 * - PATCH (الإدارة): تعليم الطلب «اتضاف» أو حذفه.
 */
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "missing-profession", 8)) throw new InputError("وصلت لحد الطلبات من نفس الجهاز — جرّب بعد ربع ساعة.", 429);
    const clean = cleanMissingRequest(objectInput(await request.json()));
    if (!clean.ok) throw new InputError(clean.error, 400);
    const value = clean.value;
    if (!databaseConfigured) return Response.json({ ok: true, saved: false, message: "وصلنا طلبك (وضع المعاينة)." });

    await ensureSeed();
    const [saved] = await db.insert(missingProfessionRequests).values(value).returning({ id: missingProfessionRequests.id });
    await db.insert(notifications).values({
      type: "service",
      title: "طلب مهنة غير موجودة في الدليل",
      message: `${missingSummary(value.need, 200)}${value.name ? ` — ${value.name}` : ""}${value.phone ? ` • ${value.phone}` : ""}`,
      entityId: saved?.id ?? value.categoryId ?? "missing",
    });
    queueAdminWhatsappAlert("service", "🔎 مهنة ناقصة في الدليل", `${missingSummary(value.need, 200)}${value.phone ? ` • ${value.phone}` : ""}`);
    return Response.json({ ok: true, saved: true, message: "وصلنا طلبك — أول ما تتضاف المهنة هنبلّغك." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ total: 0, open: 0, requests: [] });
    await ensureSeed();
    const rows = await db
      .select({ id: missingProfessionRequests.id, need: missingProfessionRequests.need, name: missingProfessionRequests.name, phone: missingProfessionRequests.phone, categoryId: missingProfessionRequests.categoryId, categoryName: directoryCategories.name, status: missingProfessionRequests.status, createdAt: missingProfessionRequests.createdAt })
      .from(missingProfessionRequests)
      .leftJoin(directoryCategories, eq(directoryCategories.id, missingProfessionRequests.categoryId))
      .orderBy(desc(missingProfessionRequests.createdAt))
      .limit(60);
    const [open] = await db.select({ value: sql<number>`count(*)::int` }).from(missingProfessionRequests).where(eq(missingProfessionRequests.status, "open"));
    const [total] = await db.select({ value: sql<number>`count(*)::int` }).from(missingProfessionRequests);
    return Response.json({ total: Number(total?.value ?? 0), open: Number(open?.value ?? 0), requests: rows });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    const body = objectInput(await request.json());
    if (!validId(body.id)) throw new InputError("معرّف غير صحيح.", 400);
    const id = body.id;
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    if (body.action === "delete") await db.delete(missingProfessionRequests).where(eq(missingProfessionRequests.id, id));
    else if (body.action === "added" || body.action === "open") await db.update(missingProfessionRequests).set({ status: body.action === "added" ? "added" : "open" }).where(eq(missingProfessionRequests.id, id));
    else throw new InputError("إجراء غير صحيح.");
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

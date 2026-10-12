import { db, databaseConfigured } from "@/db";
import { notifications, serviceRatings, services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, integerInput, objectInput } from "@/lib/inputs";
import { getViewer, sameOrigin } from "@/lib/auth";
import { cleanText, validId } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

// A member submits one rating per service; resubmitting replaces the previous one
// and returns it to the review queue. Ratings reach the public score only after approval.
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "التقييمات غير متاحة في وضع المعاينة." }, { status: 503 });
    const viewer = await getViewer();
    if (viewer.role === "guest" || !viewer.id) throw new InputError("سجّل دخولك أولًا لتقييم مقدم الخدمة.", 401);
    await ensureSeed();
    const body = objectInput(await request.json());
    const serviceId = body.serviceId;
    if (!validId(serviceId)) throw new InputError("الخدمة غير صحيحة.");
    const stars = integerInput(body.stars, 1, 5, "التقييم");
    const comment = cleanText(body.comment ?? "", 300);
    const [service] = await db.select({ id: services.id, name: services.name, status: services.status }).from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service || service.status !== "approved") throw new InputError("الخدمة غير متاحة للتقييم.", 404);
    await db.insert(serviceRatings).values({ serviceId, memberId: viewer.id, stars, comment }).onConflictDoUpdate({ target: [serviceRatings.serviceId, serviceRatings.memberId], set: { stars, comment, status: "pending", createdAt: new Date() } });
    await db.insert(notifications).values({ type: "rating", title: `تقييم جديد: ${service.name}`, message: `${stars} من 5 من ${viewer.name}${comment ? ` — ${comment}` : ""}`, entityId: serviceId });
    void sendAdminWhatsappAlert("⭐ تقييم جديد", `${service.name}: ${stars} من 5 من ${viewer.name}${comment ? ` — ${comment}` : ""}`);
    return Response.json({ ok: true, message: "شكرًا لتقييمك.. هيظهر بعد مراجعة الإدارة." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

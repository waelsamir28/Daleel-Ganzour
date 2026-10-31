import { eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { countPushSubscribers, pushConfigured, pushPublicKey, sendPushToAll } from "@/lib/push";
import { sanitizePushMessage, sanitizePushSubscription, sanitizePushTopics } from "@/lib/push-shared";
import { rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * إشعارات المتصفح:
 * - GET: هل الميزة مفعّلة + المفتاح العام (والعدد للإدارة فقط).
 * - POST: تسجيل اشتراك الجهاز.
 * - PATCH: تعديل الأقسام اللي الزائر عايز إشعارات عنها.
 * - DELETE: إلغاء الاشتراك.
 * - PUT: إرسال إشعار لكل المشتركين (أدمن فقط).
 */
export async function GET(request: Request) {
  try {
    // المفاتيح بتتولّد وتتحفظ على الخادم أول مرة، فالميزة بتشتغل بعد النشر بدون إعداد يدوي.
    const configured = await pushConfigured();
    if (!configured) return Response.json({ configured: false, publicKey: "", subscribers: 0, topics: [] });
    let subscribers = 0;
    // مواضيع الجهاز الحالي (لأزرار «اختار أقسامك» في الفوتر).
    const endpoint = new URL(request.url).searchParams.get("endpoint")?.trim() ?? "";
    let topics: string[] = [];
    if (databaseConfigured && endpoint.length >= 24) {
      try {
        await ensureSeed();
        const [row] = await db.select({ topics: pushSubscriptions.topics }).from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).limit(1);
        topics = row?.topics ?? [];
      } catch { topics = []; }
    }
    const viewer = await getViewer();
    if (databaseConfigured && (viewer.role === "admin" || viewer.role === "moderator")) {
      try { await ensureSeed(); subscribers = await countPushSubscribers(); } catch { subscribers = 0; }
    }
    return Response.json({ configured, publicKey: await pushPublicKey(), subscribers, topics });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!(await pushConfigured())) throw new InputError("إشعارات المتصفح غير مفعّلة على الموقع حاليًا.", 503);
    if (rateLimit(request, "push-subscribe", 20)) throw new InputError("محاولات كتير — جرّب بعد شوية.", 429);
    const body = objectInput(await request.json());
    const clean = sanitizePushSubscription(body.subscription ?? body);
    if (!clean) throw new InputError("اشتراك الإشعارات غير صالح.", 400);
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    const topics = sanitizePushTopics(body.topics);
    await db.insert(pushSubscriptions).values({ ...clean, topics }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { subscription: clean.subscription, topics } });
    return Response.json({ ok: true, saved: true }, { status: 201 });
  } catch (error) { return apiError(error); }
}

/** تحديث مواضيع الاشتراك (أقسام يهمّها الزائر) بعد التفعيل. */
export async function PATCH(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "push-topics", 40)) throw new InputError("محاولات كتير — جرّب بعد شوية.", 429);
    const body = objectInput(await request.json());
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    if (endpoint.length < 24) throw new InputError("الاشتراك غير معروف.", 400);
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    const topics = sanitizePushTopics(body.topics);
    await db.update(pushSubscriptions).set({ topics }).where(eq(pushSubscriptions.endpoint, endpoint));
    return Response.json({ ok: true, topics });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    const body = objectInput(await request.json().catch(() => ({})));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    if (endpoint.length < 24) throw new InputError("الاشتراك غير معروف.", 400);
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!(await pushConfigured())) throw new InputError("إشعارات المتصفح غير مفعّلة — تأكد من الاتصال بقاعدة البيانات.", 400);
    if (!databaseConfigured) throw new InputError("الحفظ غير متاح في وضع المعاينة.", 503);
    const body = objectInput(await request.json());
    const message = sanitizePushMessage(body);
    if (!message) throw new InputError("اكتب عنوانًا ونصًا للإشعار.", 400);
    const sectionId = typeof body.section === "string" && /^[a-z0-9][a-z0-9-]{1,59}$/i.test(body.section.trim()) ? body.section.trim() : undefined;
    await ensureSeed();
    const result = await sendPushToAll(message, { sectionId });
    return Response.json({ ok: true, ...result });
  } catch (error) { return apiError(error); }
}

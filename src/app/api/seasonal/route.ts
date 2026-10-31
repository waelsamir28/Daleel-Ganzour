import { getViewer, sameOrigin } from "@/lib/auth";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { pushConfigured, sendPushToAll } from "@/lib/push";
import { sanitizePushMessage } from "@/lib/push-shared";
import { SEASONAL_REMINDERS, dueSeasonalReminders, seasonalUrl, upcomingSeasonalReminders } from "@/lib/seasonal-reminders";
import { rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * التذكيرات الموسمية:
 * - GET (الإدارة): المستحق الآن + القادم، مع النص الجاهز لكل واحد.
 * - POST (الإدارة): إرسال تذكير لكل المشتركين بالإشعارات بضغطة واحدة.
 */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    return Response.json({
      configured: await pushConfigured(),
      due: dueSeasonalReminders().map((reminder) => ({ ...reminder, url: seasonalUrl(reminder) })),
      upcoming: upcomingSeasonalReminders().map((reminder) => ({ id: reminder.id, label: reminder.label, emoji: reminder.emoji, months: reminder.months })),
      total: SEASONAL_REMINDERS.length,
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "seasonal-send", 10)) throw new InputError("محاولات كتير — جرّب بعد شوية.", 429);
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!(await pushConfigured())) throw new InputError("الإشعارات مش جاهزة — تأكد من الاتصال بقاعدة البيانات.", 400);
    const body = objectInput(await request.json());
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const reminder = SEASONAL_REMINDERS.find((item) => item.id === id);
    // التذكير الجاهز له نص ثابت محسوب، وأي نص مخصص بيعدي على نفس التحقق بتاع الإشعارات.
    const message = reminder
      ? { title: reminder.title, body: reminder.body, url: seasonalUrl(reminder) }
      : sanitizePushMessage(body);
    if (!message) throw new InputError("التذكير غير معروف.", 404);
    const result = await sendPushToAll(message);
    return Response.json({ ok: true, ...result, title: message.title });
  } catch (error) { return apiError(error); }
}

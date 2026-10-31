import "server-only";
import webpush from "web-push";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { isExpiredSubscriptionError, pushPayload, pushTargetsTopics, type PushMessage } from "@/lib/push-shared";
import { directoryCategories } from "@/db/schema";

/**
 * إرسال إشعارات المتصفح للزوار المشتركين (Web Push).
 *
 * يحتاج مفتاحين في متغيرات البيئة (يُولَّدان مرة واحدة بأمر `npx web-push generate-vapid-keys`):
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY (يقرأه المتصفح عبر /api/push)
 * - VAPID_PRIVATE_KEY (سري — على الخادم فقط)
 * بدونهم الميزة بتختفي بهدوء من الواجهة ولا يحصل أي خطأ.
 */

const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@daleel-ganzour.vercel.app";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

let configuredOnce = false;

export function pushPublicKey() {
  return PUBLIC_KEY;
}

/** الميزة جاهزة فقط لو الاتنين موجودين وصالحين. */
export function pushConfigured() {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  if (!configuredOnce) {
    try {
      webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
      configuredOnce = true;
    } catch { return false; }
  }
  return configuredOnce;
}

/** عدد الزوار المشتركين (للإدارة). */
export async function countPushSubscribers() {
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(pushSubscriptions);
  return Number(row?.total ?? 0);
}

export type PushSendResult = { sent: number; failed: number; removed: number; total: number };

/**
 * يبعت الإشعار لكل المشتركين ويمسح الاشتراكات الميتة (404/410) تلقائيًا،
 * وأي فشل لجهاز واحد لا يوقف الباقي.
 */
export async function sendPushToAll(message: PushMessage, options: { sectionId?: string; limit?: number } = {}): Promise<PushSendResult> {
  if (!pushConfigured()) return { sent: 0, failed: 0, removed: 0, total: 0 };
  const { sectionId, limit = 500 } = options;
  const all = await db.select({ id: pushSubscriptions.id, subscription: pushSubscriptions.subscription, topics: pushSubscriptions.topics }).from(pushSubscriptions).limit(limit);
  // الزائر اللي اختار أقسام معيّنة يوصل له إشعار قسمه (أو الخبر العام)، واللي مختارش بيوصل له الكل.
  const rows = all.filter((row) => pushTargetsTopics(row.topics, sectionId));
  let sent = 0; let failed = 0; let removed = 0;
  const payload = pushPayload(message);
  const stale: string[] = [];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.subscription) as { endpoint: string; keys: { p256dh: string; auth: string } };
      await webpush.sendNotification({ endpoint: parsed.endpoint, keys: parsed.keys }, payload, { TTL: 60 * 60 * 24 * 7 });
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (isExpiredSubscriptionError(statusCode)) { stale.push(row.id); removed += 1; }
      else failed += 1;
    }
  }
  for (const id of stale) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  return { sent, failed, removed, total: rows.length };
}

/**
 * إشعار «مهنة جديدة»: يوصل تلقائيًا لكل المشتركين لما الإدارة تنشر مهني جديد،
 * والضغط عليه بيفتح صفحة قسمه. العنوان بيتغيّر حسب القسم («الأطباء والعيادات»، «المدرسين»…).
 */
export async function pushNewProvider(input: { name: string; categoryId: string; area?: string }) {
  if (!pushConfigured()) return { sent: 0, failed: 0, removed: 0, total: 0 };
  const [category] = await db.select({ name: directoryCategories.name, parentId: directoryCategories.parentId }).from(directoryCategories).where(eq(directoryCategories.id, input.categoryId)).limit(1);
  const section = category?.parentId ?? input.categoryId;
  const message: PushMessage = {
    title: `${category?.name ?? "مهنة"} جديدة في جنزور`,
    body: `${input.name}${input.area ? ` — ${input.area}` : ""}: رقمه وأزرار التواصل جاهزة على الدليل.`,
    url: `/categories/${section}`,
  };
  return sendPushToAll(message, { sectionId: section });
}

/** إشعار «تقييم جديد» بعد اعتماد الإدارة له — يفتح بطاقة المهني صاحب التقييم. */
export async function pushApprovedRating(input: { serviceName: string; serviceId: string; stars: number }) {
  if (!pushConfigured()) return { sent: 0, failed: 0, removed: 0, total: 0 };
  return sendPushToAll({
    title: "تقييم جديد على الدليل",
    body: `${input.serviceName}: ${input.stars} من 5 نجوم من أحد الزوار.`,
    url: `/?service=${input.serviceId}`,
  });
}

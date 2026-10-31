import "server-only";
import webpush from "web-push";
import { eq, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryCategories, directorySettings, pushSubscriptions } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { isExpiredSubscriptionError, pushPayload, pushTargetsTopics, type PushMessage } from "@/lib/push-shared";

/**
 * إرسال إشعارات المتصفح للزوار المشتركين (Web Push).
 *
 * أولوية المفاتيح:
 * 1) متغيرات البيئة `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (لو حبيت تتحكم فيها).
 * 2) لو مش موجودة: بيتولّد زوج مفاتيح تلقائيًا أول مرة ويُحفظ في قاعدة البيانات
 *    (`directory_settings / vapid_keys`) — يعني الميزة شغالة بعد النشر بدون أي إعداد.
 *    المفتاح الخاص ما بيخرجش من الخادم أبدًا؛ المتصفح بياخد المفتاح العام بس من /api/push.
 * 3) لو مفيش قاعدة بيانات (وضع المعاينة): الميزة بتختفي بهدوء من الواجهة بدون أي خطأ.
 */

const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@daleel-ganzour.vercel.app";
const ENV_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const ENV_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SETTINGS_KEY = "vapid_keys";

type VapidPair = { publicKey: string; privateKey: string };
let cached: VapidPair | null = null;

function envKeys(): VapidPair | null {
  return ENV_PUBLIC_KEY && ENV_PRIVATE_KEY ? { publicKey: ENV_PUBLIC_KEY, privateKey: ENV_PRIVATE_KEY } : null;
}

async function storedKeys(): Promise<VapidPair | null> {
  if (!databaseConfigured) return null;
  try {
    const [row] = await db.select({ value: directorySettings.value }).from(directorySettings).where(eq(directorySettings.key, VAPID_SETTINGS_KEY)).limit(1);
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as Partial<VapidPair>;
    return parsed.publicKey && parsed.privateKey ? { publicKey: parsed.publicKey, privateKey: parsed.privateKey } : null;
  } catch {
    return null;
  }
}

/** يرجّع المفاتيح الجاهزة، ويولّد ويحفظ زوجًا جديدًا أول مرة لو مفيش مفاتيح في البيئة. */
async function resolveKeys(): Promise<VapidPair | null> {
  if (cached) return cached;
  const fromEnv = envKeys();
  if (fromEnv) { cached = fromEnv; return cached; }
  if (!databaseConfigured) return null;
  // الجداول لازم تكون موجودة قبل توليد المفاتيح وحفظها.
  try { await ensureSeed(); } catch { return null; }
  const stored = await storedKeys();
  if (stored) { cached = stored; return cached; }
  try {
    const generated = webpush.generateVAPIDKeys();
    await db.insert(directorySettings).values({ key: VAPID_SETTINGS_KEY, value: JSON.stringify(generated) })
      .onConflictDoUpdate({ target: directorySettings.key, set: { value: JSON.stringify(generated) } });
    cached = generated;
    return cached;
  } catch {
    return null;
  }
}

function applyKeys(keys: VapidPair) {
  try {
    webpush.setVapidDetails(SUBJECT, keys.publicKey, keys.privateKey);
    return true;
  } catch {
    return false;
  }
}

/** المفتاح العام اللي المتصفح بيستخدمه في الاشتراك (فاضي = الميزة غير جاهزة). */
export async function pushPublicKey() {
  const keys = await resolveKeys();
  return keys?.publicKey ?? "";
}

/** هل الإشعارات جاهزة للإرسال الآن؟ (مفاتيح بيئة أو مفاتيح محفوظة/مولّدة على الخادم) */
export async function pushConfigured() {
  const keys = await resolveKeys();
  return keys ? applyKeys(keys) : false;
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
  if (!(await pushConfigured())) return { sent: 0, failed: 0, removed: 0, total: 0 };
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
  if (!(await pushConfigured())) return { sent: 0, failed: 0, removed: 0, total: 0 };
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
  if (!(await pushConfigured())) return { sent: 0, failed: 0, removed: 0, total: 0 };
  return sendPushToAll({
    title: "تقييم جديد على الدليل",
    body: `${input.serviceName}: ${input.stars} من 5 نجوم من أحد الزوار.`,
    url: `/?service=${input.serviceId}`,
  });
}

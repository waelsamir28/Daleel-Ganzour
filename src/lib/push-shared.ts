/**
 * إشعارات المتصفح (Web Push) — منطق مشترك نقي بين الخادم والمتصفح.
 *
 * الفكرة: الزائر يفعّل الإشعارات مرة واحدة من فوتر الموقع، فيوصله تنبيه لما الإدارة
 * تبعت خبرًا (مهنة جديدة، عرض، تنبيه موسمي) من لوحة التحكم — بدون تطبيق وبدون رقم هاتف.
 *
 * الملف بدون أي اعتماد على Node أو المتصفح حتى يُختبر مباشرة.
 */

export const PUSH_TITLE_MAX = 60;
export const PUSH_BODY_MAX = 160;
export const PUSH_URL_MAX = 200;

export type PushMessage = { title: string; body: string; url: string };
export type PushSubscriptionPayload = { endpoint: string; subscription: string };

/** ما يُخزَّن في directory_push_subscriptions بعد التحقق. */
export type CleanPushSubscription = { endpoint: string; subscription: string };
/** أقصى عدد أقسام يقدر الزائر يختارها لمتابعتها. */
export const PUSH_TOPICS_MAX = 14;

/**
 * الأقسام اللي الزائر عايز إشعارات عنها (معرّفات أقسام الدليل).
 * مصفوفة فاضية = كل الأقسام، والقيم غير الصالحة تُهمَل بهدوء.
 */
export function sanitizePushTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const topics = value
    .filter((item): item is string => typeof item === "string" && /^[a-z0-9][a-z0-9-]{1,59}$/i.test(item.trim()))
    .map((item) => item.trim())
    .filter((item, index, list) => list.indexOf(item) === index);
  return topics.slice(0, PUSH_TOPICS_MAX);
}

/** هل الإشعار الخاص بقسم معيّن يهمّ مشتركًا اختار هذه المواضيع؟ (بدون اختيار = يهمّه الكل) */
export function pushTargetsTopics(topics: string[] | undefined, sectionId: string | undefined) {
  if (!sectionId) return true;
  const list = topics ?? [];
  return list.length === 0 || list.includes(sectionId);
}

/**
 * يتحقق من اشتراك المتصفح (Endpoint + مفاتيح التشفير) ويرجّع نسخة جاهزة للتخزين،
 * أو null لو الاشتراك ناقص/غير صالح.
 */
export function sanitizePushSubscription(value: unknown): CleanPushSubscription | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint.trim() : "";
  if (!/^https:\/\/[\w.\-:/?=&%+]+$/.test(endpoint) || endpoint.length < 24 || endpoint.length > 1000) return null;
  const keys = raw.keys && typeof raw.keys === "object" ? (raw.keys as Record<string, unknown>) : {};
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = typeof keys.auth === "string" ? keys.auth.trim() : "";
  if (p256dh.length < 20 || auth.length < 8) return null;
  return { endpoint, subscription: JSON.stringify({ endpoint, keys: { p256dh, auth } }) };
}

/** رسالة الإشعار: عنوان قصير + نص + رابط داخلي يفتح عند الضغط. */
export function sanitizePushMessage(value: unknown): PushMessage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const title = (typeof raw.title === "string" ? raw.title : "").replace(/\s+/g, " ").trim().slice(0, PUSH_TITLE_MAX);
  const body = (typeof raw.body === "string" ? raw.body : "").replace(/\s+/g, " ").trim().slice(0, PUSH_BODY_MAX);
  if (title.length < 2 || body.length < 2) return null;
  const rawUrl = (typeof raw.url === "string" ? raw.url : "").trim();
  const url = rawUrl.startsWith("/") && !rawUrl.startsWith("//") ? rawUrl.slice(0, PUSH_URL_MAX) : "/";
  return { title, body, url };
}

/** الحمولة التي يقرأها الـ service worker (public/sw.js) عند وصول الإشعار. */
export function pushPayload(message: PushMessage) {
  return JSON.stringify({ title: message.title, body: message.body, url: message.url });
}

/** هل هذا الخطأ يعني أن الاشتراك انتهى (الجهاز حذف التطبيق/ألغى الإذن)؟ */
export function isExpiredSubscriptionError(error: number | { statusCode?: number } | null | undefined) {
  const statusCode = typeof error === "number" ? error : error?.statusCode;
  return statusCode === 404 || statusCode === 410;
}

/** مفتاح VAPID العام (Base64 URL) → بايتات لمتصفح الاشتراك. */
export function urlBase64ToUint8Array(base64: string) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

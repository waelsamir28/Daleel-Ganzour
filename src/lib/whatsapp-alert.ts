import "server-only";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { directorySettings } from "@/db/schema";
import { OFFICE_PHONE } from "@/lib/catalog";
import { getSettings } from "@/lib/directory";
import { allWhatsappAlertKinds, normalizeWhatsappNumber, sanitizeWhatsappAlertKinds, type WhatsappAlertKind } from "@/lib/whatsapp-alert-kinds";

// تنبيهات واتساب فورية للإدارة عبر خدمة CallMeBot المجانية:
// الإدارة تفعّلها مرة واحدة (رقم واتساب + مفتاح API من إعدادات الموقع)، وتختار أنواع الأحداث التي تصلها.
// التنبيه محاولة بلا أثر عند الفشل — إشعار لوحة التحكم يظل موجودًا دائمًا.
const KINDS_KEY = "whatsapp_alert_kinds";
const STATUS_KEY = "whatsapp_alert_status";

export type WhatsappAlertStatus = { lastSentAt: string | null; lastResult: string; lastKind: string };
export type WhatsappAlertResult = { ok: boolean; detail: string; skipped?: boolean };

export async function getWhatsappAlertKinds(): Promise<WhatsappAlertKind[]> {
  try {
    const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, KINDS_KEY));
    if (!row) return [...allWhatsappAlertKinds];
    return sanitizeWhatsappAlertKinds(JSON.parse(row.value));
  } catch { return [...allWhatsappAlertKinds]; }
}
export async function saveWhatsappAlertKinds(value: unknown): Promise<WhatsappAlertKind[]> {
  const kinds = sanitizeWhatsappAlertKinds(value);
  const json = JSON.stringify(kinds);
  await db.insert(directorySettings).values({ key: KINDS_KEY, value: json }).onConflictDoUpdate({ target: directorySettings.key, set: { value: json } });
  return kinds;
}
export async function getWhatsappAlertStatus(): Promise<WhatsappAlertStatus> {
  try {
    const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, STATUS_KEY));
    const parsed = row ? (JSON.parse(row.value) as Partial<WhatsappAlertStatus>) : {};
    return { lastSentAt: typeof parsed.lastSentAt === "string" ? parsed.lastSentAt : null, lastResult: typeof parsed.lastResult === "string" ? parsed.lastResult : "", lastKind: typeof parsed.lastKind === "string" ? parsed.lastKind : "" };
  } catch { return { lastSentAt: null, lastResult: "", lastKind: "" }; }
}
async function rememberStatus(status: WhatsappAlertStatus) {
  try {
    const json = JSON.stringify(status);
    await db.insert(directorySettings).values({ key: STATUS_KEY, value: json }).onConflictDoUpdate({ target: directorySettings.key, set: { value: json } });
  } catch { /* best effort */ }
}

/** يرسل رسالة واتساب للإدارة الآن ويرجع نتيجة واضحة (يُستخدم لزر الاختبار ولأحداث الموقع). */
export async function sendAdminWhatsappAlert(title: string, message: string, kind: WhatsappAlertKind | "test" = "test"): Promise<WhatsappAlertResult> {
  try {
    const { whatsappAlertsNumber, whatsappAlertsApiKey } = await getSettings();
    const phone = normalizeWhatsappNumber(whatsappAlertsNumber || OFFICE_PHONE);
    const apiKey = whatsappAlertsApiKey.trim();
    if (!apiKey) return { ok: false, skipped: true, detail: "لم يُحفظ مفتاح CallMeBot بعد." };
    if (phone.length < 11) return { ok: false, skipped: true, detail: "رقم الواتساب غير صحيح." };
    if (kind !== "test") {
      const kinds = await getWhatsappAlertKinds();
      if (!kinds.includes(kind)) return { ok: false, skipped: true, detail: "هذا النوع من الأحداث غير مفعّل." };
    }
    const text = `${title}\n${message}`.slice(0, 900);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(text)}`;
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000) });
    const bodyText = (await response.text().catch(() => "")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const ok = response.ok && !/not\s*authorized|invalid\s*api|error|wrong/i.test(bodyText);
    const detail = ok ? "تم الإرسال بنجاح." : bodyText.slice(0, 160) || `فشل الإرسال (HTTP ${response.status}).`;
    await rememberStatus({ lastSentAt: new Date().toISOString(), lastResult: ok ? "ok" : detail, lastKind: kind });
    return { ok, detail };
  } catch (error) {
    const detail = error instanceof Error && error.name === "TimeoutError" ? "انتهت مهلة الاتصال بخدمة CallMeBot." : "تعذر الاتصال بخدمة CallMeBot.";
    await rememberStatus({ lastSentAt: new Date().toISOString(), lastResult: detail, lastKind: kind });
    return { ok: false, detail };
  }
}

/** يجدول الإرسال بعد إرجاع الاستجابة للزائر حتى لا يبطئ الطلب ولا يُقطع على Vercel. */
export function queueAdminWhatsappAlert(kind: WhatsappAlertKind, title: string, message: string) {
  const run = () => sendAdminWhatsappAlert(title, message, kind).then(() => undefined, () => undefined);
  try { after(run); } catch { void run(); }
}

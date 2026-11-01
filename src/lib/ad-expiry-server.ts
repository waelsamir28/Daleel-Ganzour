import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { directorySettings } from "@/db/schema";
import { AD_EXPIRY_WARNING_DAYS, adExpiryAlertKey, adExpiryAlertMessage, expiringAds } from "@/lib/ad-expiry";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

/**
 * تنبيه الإدارة قبل انتهاء الإعلان بيومين:
 * بيتبعت مرة واحدة بس لكل إعلان بنفس تاريخ النهاية (منع التكرار محفوظ في إعدادات الموقع)،
 * والإعلان نفسه بيقف تلقائيًا في ميعاده لأن `isAdLive` بيرفض أي إعلان بعد `endsAt`.
 */
const KEY = "ad_expiry_alerts";
const KEEP = 60;

type AdLike = { id: string; title: string; active: boolean; startsAt: string | null; endsAt: string | null; hasImage?: boolean; template?: string };

async function readSent(): Promise<Record<string, string>> {
  try {
    const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, KEY));
    if (!row) return {};
    const parsed = JSON.parse(row.value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch { return {}; }
}

async function writeSent(map: Record<string, string>) {
  const entries = Object.entries(map).slice(-KEEP);
  const json = JSON.stringify(Object.fromEntries(entries));
  await db.insert(directorySettings).values({ key: KEY, value: json })
    .onConflictDoUpdate({ target: directorySettings.key, set: { value: json } });
}

export type AdExpiryAlertResult = { sent: string[]; skipped: string[] };

/** يبعت تنبيهات للإعلانات اللي هتنتهي خلال يومين (مع منع التكرار) ويرجّع اللي اتبعت. */
export async function alertExpiringAds(ads: AdLike[], now = Date.now()): Promise<AdExpiryAlertResult> {
  const due = expiringAds(ads, now);
  if (!due.length) return { sent: [], skipped: [] };
  const sent = await readSent();
  const fresh = due.filter((ad) => !sent[adExpiryAlertKey(ad)]);
  if (!fresh.length) return { sent: [], skipped: due.map((ad) => ad.title) };
  for (const ad of fresh) {
    queueAdminWhatsappAlert("ad-expiry", "إعلان قرب ينتهي", adExpiryAlertMessage(ad, Math.max(1, Math.min(AD_EXPIRY_WARNING_DAYS, ad.info.daysLeft))));
    sent[adExpiryAlertKey(ad)] = new Date(now).toISOString();
  }
  await writeSent(sent).catch(() => undefined);
  return { sent: fresh.map((ad) => ad.title), skipped: due.filter((ad) => !fresh.includes(ad)).map((ad) => ad.title) };
}

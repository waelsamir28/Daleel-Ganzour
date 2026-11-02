/**
 * حالة صوت شاشة البداية في الجلسة — منطق نقي بلا اعتماديات حتى يُختبر مباشرة.
 * الهدف: المقطع يشتغل **مرة واحدة فقط** في الجلسة الواحدة، مهما فتح الزائر الصفحة
 * الرئيسية أو رجع ليها أو المتصفح رفض التشغيل التلقائي.
 */

/** المفتاح في sessionStorage: «الصوت اتحاول يتشغل في الجلسة دي». */
export const SPLASH_AUDIO_SESSION_KEY = "janzour-splash-audio-played";

type SessionStore = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** هل الجلسة دي شافت تشغيل للمقطع خلاص؟ */
export function hasPlayedThisSession(store: SessionStore | null | undefined): boolean {
  if (!store) return false;
  try { return store.getItem(SPLASH_AUDIO_SESSION_KEY) === "1"; } catch { return false; }
}

/** تعليم الجلسة إن المقطع اتشغل (بنتخطى أخطاء التخزين في المتصفحات المقيّدة). */
export function markPlayedThisSession(store: SessionStore | null | undefined): void {
  if (!store) return;
  try { store.setItem(SPLASH_AUDIO_SESSION_KEY, "1"); } catch { /* ignore */ }
}

/**
 * «حجز» تشغيل واحد للجلسة: بيرجّع true أول مرة بس، وأي محاولة تانية (تنقل بين
 * الصفحات أو إعادة تحميل) بترجّع false. `alreadyClaimed` بيمنع التكرار داخل نفس تحميل الصفحة.
 */
export function claimSessionPlay(store: SessionStore | null | undefined, alreadyClaimed: boolean): boolean {
  if (alreadyClaimed || hasPlayedThisSession(store)) return false;
  markPlayedThisSession(store);
  return true;
}

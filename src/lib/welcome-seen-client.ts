"use client";

import { isValidWelcomeKey, parseSeenKeys, rememberSeenKey } from "@/lib/welcome-messages";

/**
 * تسجيل إن الرسالة الترحيبية اتشافت — على الجهاز (سرعة) وعلى الخادم (مرة واحدة للأبد).
 * أي مكوّن بيعرض رسالة عائمة بيستخدم نفس الدالة عشان ما تتكررش من مكانين.
 */
export const WELCOME_LOCAL_KEY = "janzour-welcome-seen-v2";

export function readLocalSeen(): string[] {
  try { return parseSeenKeys(localStorage.getItem(WELCOME_LOCAL_KEY)); } catch { return []; }
}

export function writeLocalSeen(key: string) {
  try { localStorage.setItem(WELCOME_LOCAL_KEY, rememberSeenKey(localStorage.getItem(WELCOME_LOCAL_KEY), key)); } catch { /* التخزين ممنوع */ }
}

/** يعلّم الرسالة كمقروءة محليًا + على الخادم (أفضل جهد، بدون تعطيل الواجهة). */
export async function markWelcomeSeen(key: string) {
  if (!isValidWelcomeKey(key)) return;
  writeLocalSeen(key);
  try {
    await fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }), keepalive: true });
  } catch {
    // الشبكة مش متاحة — التسجيل المحلي كفاية.
  }
}

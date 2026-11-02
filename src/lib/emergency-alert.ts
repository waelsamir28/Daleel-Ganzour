/**
 * شريط التنبيه الطارئ (مياه/كهرباء/طقس/أي حاجة عاجلة).
 * - الأدمن يكتب سطر واحد ويختار المدة، والشريط يظهر فورًا أعلى الموقع لكل الزوار.
 * - ينتهي لوحده بعد المدة (مفيش نسيان شريط قديم على الموقع).
 * - منطق نقي بلا أي اعتماديات، فيمكن اختباره مباشرة.
 */

export type EmergencyAlertLevel = "info" | "warning" | "danger";

export const EMERGENCY_ALERT_MAX_LENGTH = 200;
/** أطول مدة يسمح بيها التنبيه (يوم كامل) حتى لا يتحول لشريط دائم بالسهو. */
export const EMERGENCY_ALERT_MAX_HOURS = 24;
export const EMERGENCY_ALERT_LEVELS: Array<{ id: EmergencyAlertLevel; label: string; hint: string }> = [
  { id: "info", label: "تنبيه عادي (أزرق)", hint: "خبر أو تنويه عام لأهل القرية" },
  { id: "warning", label: "تحذير (برتقالي)", hint: "انقطاع متوقع أو تنبيه مهم" },
  { id: "danger", label: "طارئ (أحمر)", hint: "خطر أو انقطاع حاصل بالفعل" },
];

export type EmergencyAlertSettings = {
  emergencyAlertText?: string;
  emergencyAlertLevel?: string;
  emergencyAlertUntil?: string;
};

export type EmergencyAlertDecision =
  | { active: true; text: string; level: EmergencyAlertLevel; until: string | null; minutesLeft: number | null }
  | { active: false; reason: "empty" | "expired" };

export function normalizeEmergencyLevel(value: unknown): EmergencyAlertLevel {
  return value === "warning" || value === "danger" ? value : "info";
}

/** تنظيف نص التنبيه: سطر واحد، بدون فراغات زايدة، وبحد أقصى آمن للعرض على الموبايل. */
export function normalizeEmergencyText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, EMERGENCY_ALERT_MAX_LENGTH);
}

export function emergencyAlertHoursToIso(hours: unknown, now = Date.now()): string {
  const value = Number(hours);
  const safe = Number.isFinite(value) && value > 0 ? Math.min(value, EMERGENCY_ALERT_MAX_HOURS) : 0;
  return safe ? new Date(now + safe * 3_600_000).toISOString() : "";
}

/**
 * هل الشريط ظاهر الآن؟
 * - مفيش نص → مخفي.
 * - فيه نص ومفيش تاريخ انتهاء → ظاهر لحد ما الأدمن يمسحه.
 * - فيه تاريخ انتهاء غير صالح → نعتبره منتهي (الأمان أهم من شريط غلط).
 */
export function activeEmergencyAlert(settings: EmergencyAlertSettings | null | undefined, now = Date.now()): EmergencyAlertDecision {
  const text = normalizeEmergencyText(settings?.emergencyAlertText);
  if (!text) return { active: false, reason: "empty" };
  const raw = (settings?.emergencyAlertUntil ?? "").trim();
  const level = normalizeEmergencyLevel(settings?.emergencyAlertLevel);
  if (!raw) return { active: true, text, level, until: null, minutesLeft: null };
  const until = Date.parse(raw);
  if (!Number.isFinite(until)) return { active: false, reason: "expired" };
  const remaining = until - now;
  if (remaining <= 0) return { active: false, reason: "expired" };
  return { active: true, text, level, until: new Date(until).toISOString(), minutesLeft: Math.max(1, Math.round(remaining / 60_000)) };
}

/** «باقي ٣ ساعات و٢٠ دقيقة» — مدة مفهومة للأدمن في اللوحة. */
export function remainingAlertLabel(minutesLeft: number | null): string {
  if (minutesLeft === null) return "ظاهر لحد ما تمسحه";
  if (minutesLeft < 60) return `باقي ${minutesLeft} دقيقة`;
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  return `باقي ${hours} ساعة${minutes ? ` و${minutes} دقيقة` : ""}`;
}

/** مفتاح «شفت التنبيه ده» حتى لا يتكرر نفس التنبيه على الزائر بعد ما يقفله. */
export function emergencyAlertKey(text: string, until: string | null): string {
  return `${until ?? "open"}::${text.slice(0, 60)}`;
}

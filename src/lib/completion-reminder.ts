/**
 * تذكير الاستكمال التلقائي — منطق نقي (بدون شبكة أو قاعدة بيانات) حتى يُختبر مباشرة.
 *
 * الفكرة: الإدارة تطلب استكمال بيانات مهنة، ولو صاحبها مردّش خلال **٣ أيام**
 * يتبعتله **إشعار واحد فقط** تلقائيًا (مش كل يوم) — «فاضل خطوة واحدة وتظهر بياناتك كاملة».
 * لو الإدارة بعتت طلب استكمال جديد، العدّاد يبدأ من جديد ويسمح بتذكير واحد جديد.
 */

export const COMPLETION_REMINDER_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  completionStatus?: string | null;
  completionRequestedAt?: string | null;
  completionReminderAt?: string | null;
};

export type ReminderDecision =
  | { due: true; daysWaiting: number }
  | { due: false; reason: "not-requested" | "no-date" | "too-early" | "already-reminded" };

/**
 * يستحق تذكير؟
 * - الحالة لازم تكون `requested` (لسه ما ردّش ولا أكّد الاستكمال).
 * - عدّى ٣ أيام من وقت آخر طلب استكمال.
 * - مفيش تذكير اتبعت بعد تاريخ الطلب ده (تذكير واحد لكل طلب).
 */
export function completionReminderDecision(service: ReminderCandidate, now = Date.now()): ReminderDecision {
  if (service.completionStatus !== "requested") return { due: false, reason: "not-requested" };
  const requestedAt = service.completionRequestedAt ? Date.parse(service.completionRequestedAt) : NaN;
  if (!Number.isFinite(requestedAt)) return { due: false, reason: "no-date" };
  const remindedAt = service.completionReminderAt ? Date.parse(service.completionReminderAt) : NaN;
  // التذكير بيتبعت مرة واحدة لكل طلب: أي تذكير بعد تاريخ الطلب يمنع تكراره.
  if (Number.isFinite(remindedAt) && remindedAt > requestedAt) return { due: false, reason: "already-reminded" };
  const elapsed = now - requestedAt;
  if (elapsed < COMPLETION_REMINDER_DAYS * DAY_MS) return { due: false, reason: "too-early" };
  return { due: true, daysWaiting: Math.floor(elapsed / DAY_MS) };
}

/** نص الإشعار التلقائي — مختصر وواضح، ومعاه أيام الانتظار. */
export function completionReminderMessage(input: { name: string; daysWaiting: number }) {
  const days = Math.max(COMPLETION_REMINDER_DAYS, Math.round(input.daysWaiting));
  return {
    title: `تذكير: استكمال بيانات ${input.name}`.slice(0, 160),
    body: `مضى ${days} أيام على طلب استكمال بيانات «${input.name}» في دليل جنزور. دقيقة واحدة وتضغط «استكمال بيانات» في صفحة حسابك وتظبط كل حاجة.`.slice(0, 300),
  };
}

/** عدد المهن المستحقة للتذكير الآن (لعرضه في اللوحة قبل/بعد الإرسال). */
export function dueReminderCount(services: ReminderCandidate[], now = Date.now()) {
  return services.filter((service) => completionReminderDecision(service, now).due).length;
}

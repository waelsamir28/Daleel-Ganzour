/**
 * مراقبة أخطاء المتصفح — تنظيف وتجميع البلاغات (بدون بيانات شخصية).
 *
 * الفكرة: لو حصل خطأ JavaScript أو فشل تحميل عند زائر/مهني، يوصل بلاغ مجهول للإدارة
 * مع مسار الصفحة ونوع المتصفح. مفيش أسماء ولا أرقام ولا كوكيز — والرسالة بتتنظف من
 * الأرقام الطويلة (هواتف) والروابط قبل التخزين.
 *
 * هذا الملف نقي (بدون شبكة أو قاعدة بيانات) حتى يُختبر مباشرة.
 */

export type ErrorReportInput = {
  message?: unknown;
  detail?: unknown;
  path?: unknown;
  kind?: unknown;
  userAgent?: unknown;
};

export type CleanErrorReport = {
  kind: "client" | "server";
  message: string;
  detail: string;
  path: string;
  userAgent: string;
  fingerprint: string;
};

const MAX_MESSAGE = 400;
const MAX_DETAIL = 1200;
const MAX_PATH = 200;

/** يشيل الهواتف والأرقام الطويلة من نص الخطأ (حتى لا تُخزَّن بيانات شخصية بالخطأ). */
export function redactErrorText(value: string) {
  return (value || "")
    .replace(/0\d{9,10}/g, "[رقم]")
    .replace(/\+?\d{10,15}/g, "[رقم]")
    .replace(/(?:token|key|password|secret)=[^\s&]+/gi, "$1=[محجوب]")
    .replace(/\s+/g, " ")
    .trim();
}

/** أول سطر مفيد من رسالة الخطأ (بدون مسارات الملفات المولّدة). */
function firstLine(value: string) {
  const line = (value || "").split("\n").map((part) => part.trim()).find(Boolean) ?? "";
  return line.replace(/https?:\/\/[^\s]+/g, "[رابط]").slice(0, MAX_MESSAGE);
}

/** بصمة قصيرة (8 حروف) لتجميع نفس الخطأ المتكرر — تعتمد على النوع + أول كلمات الرسالة. */
export function errorFingerprint(kind: string, message: string) {
  const normalized = `${kind}|${(message || "").toLowerCase().replace(/[0-9]+/g, "#").replace(/\s+/g, " ").slice(0, 140)}`;
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) hash = ((hash << 5) + hash + normalized.charCodeAt(index)) >>> 0;
  return hash.toString(36).padStart(8, "0").slice(-8);
}

/** يتحقق من البلاغ القادم من المتصفح ويرجّعه نظيفًا (أو null لو غير صالح). */
export function sanitizeErrorReport(input: ErrorReportInput): CleanErrorReport | null {
  const kind = input.kind === "server" ? "server" : "client";
  const message = redactErrorText(firstLine(String(input.message ?? ""))).slice(0, MAX_MESSAGE);
  if (message.length < 3) return null;
  const detail = redactErrorText(String(input.detail ?? "").split("\n").slice(0, 12).join("\n")).slice(0, MAX_DETAIL);
  const rawPath = String(input.path ?? "").split("?")[0].split("#")[0];
  const path = (rawPath.startsWith("/") ? rawPath : `/${rawPath}`).slice(0, MAX_PATH);
  const userAgent = String(input.userAgent ?? "").slice(0, 180);
  return { kind, message, detail, path, userAgent, fingerprint: errorFingerprint(kind, message) };
}

/**
 * «طلبي وصل فين؟» — الزائر يدخل رقم موبايله ويشوف حالة طلباته بدون ما يتصل يسأل.
 * خصوصية: الاسم بيظهر مختصرًا (الاسم الأول + الحرف الأول)، ومفيش أي بيانات تانية عن الطلب.
 * منطق نقي بلا اعتماديات.
 */

export type LookupStatus = "pending" | "approved" | "rejected" | "needs-info";

export type OrderLookupRow = {
  id: string;
  name: string;
  status: string;
  createdAt?: string | null;
  statusUpdatedAt?: string | null;
  reviewNote?: string | null;
};

export type OrderLookupResult = {
  id: string;
  name: string;
  status: LookupStatus;
  statusLabel: string;
  hint: string;
  submittedAt: string;
  updatedAt: string;
  hasNote: boolean;
  publicHref: string;
  canComplete: boolean;
};

/** أقصى عدد طلبات يظهر في نتيجة واحدة. */
export const LOOKUP_MAX_RESULTS = 8;

const STATUS_INFO: Record<LookupStatus, { label: string; hint: string }> = {
  pending: { label: "قيد المراجعة", hint: "طلبك وصل للإدارة وبيراجعوه — مفيش حاجة مطلوبة منك دلوقتي." },
  approved: { label: "تمت الموافقة والنشر", hint: "طلبك منشور في الدليل — دور عليه باسمك في قسمه." },
  rejected: { label: "محتاج تعديل / لم يُنشر", hint: "الإدارة مش موافقة على الطلب بحالته الحالية — تواصل مع المكتب لمعرفة السبب." },
  "needs-info": { label: "مطلوب استكمال بيانات", hint: "افتح رابط الاستكمال اللي وصلك وكمّل البيانات الناقصة." },
};

export function statusInfo(status: string): { label: string; hint: string } {
  return STATUS_INFO[(status as LookupStatus)] ?? STATUS_INFO.pending;
}

/** رقم مصري صحيح للبحث؟ (نفس قاعدة الموقع: ١١ رقمًا تبدأ بـ010/011/012/015). */
export function normalizeLookupPhone(value: string): string {
  const latin = (value || "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  let digits = latin.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);          // 0020… → 20…
  const local = digits.startsWith("20") && digits.length >= 12 ? `0${digits.slice(2)}` : digits;
  if (/^1[0125]\d{8}$/.test(local)) return `0${local}`;
  return /^01[0125]\d{8}$/.test(local) ? local : "";
}

/** اختصار الاسم للخصوصية: «أحمد محمود» → «أحمد م.» */
export function maskName(name: string): string {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "طلب بدون اسم";
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1].charAt(0)}.`;
}

function iso(value: string | null | undefined): string {
  if (!value) return "";
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

/** يحوّل صفوف الطلبات لنتيجة معروضة (مرتبة بالأحدث، وبحد أقصى آمن). */
export function orderLookupResults(rows: OrderLookupRow[], siteUrl = ""): OrderLookupResult[] {
  return rows
    .slice()
    .sort((a, b) => (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0))
    .slice(0, LOOKUP_MAX_RESULTS)
    .map((row) => {
      const status = (["pending", "approved", "rejected", "needs-info"].includes(row.status) ? row.status : "pending") as LookupStatus;
      const info = STATUS_INFO[status];
      return {
        id: row.id,
        name: maskName(row.name),
        status,
        statusLabel: info.label,
        hint: info.hint,
        submittedAt: iso(row.createdAt),
        updatedAt: iso(row.statusUpdatedAt) || iso(row.createdAt),
        hasNote: Boolean((row.reviewNote ?? "").trim()),
        publicHref: status === "approved" ? `${siteUrl.replace(/\/+$/, "")}/?service=${encodeURIComponent(row.id)}` : "",
        canComplete: status === "needs-info",
      };
    });
}

/** «آخر تحديث النهاردة» — وصف مختصر للتاريخ. */
export function lookupTimeLabel(value: string, now = Date.now(), timeZone = "Africa/Cairo"): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  const days = Math.floor(Math.max(0, now - time) / 86_400_000);
  if (days <= 0) return "النهاردة";
  if (days === 1) return "إمبارح";
  if (days <= 10) return `من ${days} أيام`;
  try {
    return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", timeZone }).format(new Date(time));
  } catch {
    return new Date(time).toISOString().slice(0, 10);
  }
}

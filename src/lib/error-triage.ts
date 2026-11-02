/**
 * تصنيف أخطاء المتصفح — منطق نقي (بدون شبكة أو قاعدة بيانات) حتى يُختبر مباشرة.
 *
 * الهدف: البدل ما المسؤول يشوف «Script error.» و«Failed to load chunk» ويقف حاير،
 * كل خطأ بياخد نوع + شرح عربي + خطوة عملية واحدة، وحالة: مفتوح / تم إصلاحه / عاد بعد الإصلاح.
 */

export type ErrorKind = "chunk" | "webview" | "external-script" | "network" | "storage" | "app";
export type ErrorStatus = "open" | "resolved" | "regressed";

type Rule = { kind: ErrorKind; label: string; hint: string; patterns: RegExp[] };

const RULES: Rule[] = [
  {
    kind: "chunk",
    label: "ملف من نسخة قديمة",
    hint: "بنتحدّث الصفحة تلقائيًا للزائر، وبيتحل غالبًا لوحده. لو اتكرر كتير: أعد نشر الموقع (Redeploy) وتأكد إن آخر نسخة اتنشرت.",
    patterns: [/chunkloaderror/i, /loading chunk/i, /failed to load chunk/i, /importing a module script failed/i, /error loading dynamically imported module/i, /\/_next\/static\/chunks\//i],
  },
  {
    kind: "webview",
    label: "متصفح داخل تطبيق (فيسبوك/إنستجرام)",
    hint: "الخطأ جاي من جسر المتصفح الداخلي للتطبيق مش من كودنا. الحل: شجّع الزائر يفتح الموقع في Chrome بضغطة «افتح في المتصفح».",
    patterns: [/java object is gone/i, /error invoking postmessage/i, /webkit\.messagehandlers/i],
  },
  {
    kind: "external-script",
    label: "سكربت خارجي",
    hint: "غالبًا إضافة على جهاز الزائر أو حقن من متصفح. مش من كود الموقع، وبيتم تجاهله عادةً.",
    patterns: [/^script error\.?$/i],
  },
  {
    kind: "network",
    label: "انقطاع الشبكة",
    hint: "الطلب فشل بسبب نت الزائر. لو متكرر على نفس الصفحة راجع حجم الملفات أو مهلة الخادم.",
    patterns: [/failed to fetch/i, /networkerror/i, /err_internet_disconnected/i, /err_network/i, /timeout/i, /load failed/i],
  },
  {
    kind: "storage",
    label: "تخزين المتصفح",
    hint: "المتصفح رافض التخزين (وضع خاص أو مساحة ممتلئة). الكود لازم يشتغل بدون التخزين، راجع آخر تعديل على localStorage.",
    patterns: [/quotaexceeded/i, /localstorage/i, /sessionstorage/i, /indexeddb/i, /securityerror.*storage/i],
  },
];

/** نوع الخطأ + شرحه وخطوة العلاج المقترحة. */
export function classifyError(message: string): { kind: ErrorKind; label: string; hint: string } {
  const text = message || "";
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return { kind: rule.kind, label: rule.label, hint: rule.hint };
  }
  return { kind: "app", label: "خطأ في كود الموقع", hint: "خطأ حقيقي محتاج مراجعة: افتح التفاصيل، شوف الصفحة والجهاز، وصلّح السبب ثم اضغط «تم الإصلاح»." };
}

/**
 * حالة الخطأ:
 * - resolved: اتقفل ومفيش ظهور جديد بعده.
 * - regressed: اتقفل لكن ظهر تاني بعد تاريخ الإصلاح (لازم يرجع للقائمة).
 * - open: لسه مفتوح.
 */
export function errorStatus(row: { lastAt?: string | null; resolvedAt?: string | null }): ErrorStatus {
  if (!row.resolvedAt) return "open";
  const resolved = Date.parse(row.resolvedAt);
  const last = row.lastAt ? Date.parse(row.lastAt) : 0;
  if (!Number.isFinite(resolved)) return "open";
  return Number.isFinite(last) && last > resolved ? "regressed" : "resolved";
}

/** ملخص الأرقام اللي يظهر فوق السجل. */
export function errorSummary(rows: Array<{ count: number; lastAt?: string | null; resolvedAt?: string | null }>) {
  let open = 0, resolved = 0, regressed = 0, occurrences = 0;
  for (const row of rows) {
    const status = errorStatus(row);
    if (status === "open") open += 1;
    else if (status === "resolved") resolved += 1;
    else regressed += 1;
    occurrences += Number(row.count) || 0;
  }
  return { open, resolved, regressed, occurrences, kinds: rows.length };
}

/** نص مختصر لعمر آخر ظهور: «قبل ٥ دقايق» بدل تاريخ كامل. */
export function ageLabel(value: string | null | undefined, now = Date.now()) {
  const stamp = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(stamp)) return "";
  const minutes = Math.max(0, Math.round((now - stamp) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  return days === 1 ? "قبل يوم" : `قبل ${days} أيام`;
}

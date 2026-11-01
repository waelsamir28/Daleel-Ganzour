/**
 * مولّد باركود Code 39 (بدون أي مكتبة خارجية):
 * كل حرف بيتحوّل لـ ٩ عناصر (٥ خطوط و٤ مسافات) مجموع عرضهم ١٥ وحدة،
 * والبداية والنهاية دايمًا علامة «*».
 * الجدول الرقمي هو جدول Code 39 القياسي (نفس ترتيب القيم المستخدم في مواصفة الباركود).
 */
const CODE39_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
// قيمة كل حرف كنمط ثنائي (١ = خط أسود، ٠ = مسافة) — الحرف الأخير «*» = ١٧٧٨٩.
const CODE39_MODULES = [
  20957, 29783, 23639, 30485, 20951, 29813, 23669, 20855, 29789, 23645,
  29975, 23831, 30533, 22295, 30149, 24005, 21623, 29981, 23837, 22301,
  30023, 23879, 30545, 22343, 30161, 24017, 21959, 30065, 23921, 22385,
  29015, 18263, 29141, 17879, 29045, 18293, 17783, 29021, 18269, 17477,
  17489, 17681, 20753, 17789,
];

/** ينظّف النص ليقبل في Code 39 (حروف إنجليزية كبيرة وأرقام ورموز محدودة). */
export function barcodeValue(value: string, maxLength = 28): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z\-. $/+%]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** نمط الحرف الواحد كسلسلة «١/٠» بطول ١٥ وحدة. */
function encodeChar(char: string): string {
  const index = CODE39_CHARS.indexOf(char);
  if (index < 0) return "";
  return CODE39_MODULES[index].toString(2).padStart(15, "0");
}

/**
 * يرجّع وحدات الباركود (خط/مسافة) لعرضها كـ SVG.
 * كل عنصر = { bar, width } وعرض الوحدة بيتحدد وقت الرسم.
 */
export function code39Modules(value: string): Array<{ bar: boolean; width: number }> {
  const text = barcodeValue(value);
  if (!text) return [];
  const binary = `*${text}*`.split("").map((char) => `${encodeChar(char)}0`).join("");
  const modules: Array<{ bar: boolean; width: number }> = [];
  for (const bit of binary) {
    const bar = bit === "1";
    const last = modules[modules.length - 1];
    if (last && last.bar === bar) last.width += 1;
    else modules.push({ bar, width: 1 });
  }
  // علامة النهاية مسافة زايدة — بتتشال عشان الباركود يخلص بخط.
  while (modules.length && !modules[modules.length - 1].bar) modules.pop();
  return modules;
}

/** إجمالي عدد وحدات العرض (يساعد في حساب مقاس الـ SVG). */
export function code39Width(value: string): number {
  return code39Modules(value).reduce((sum, module) => sum + module.width, 0);
}

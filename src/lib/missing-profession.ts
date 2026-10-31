/**
 * «مهنة ناقصة في الدليل» — منطق نقي:
 * الزائر بيكتب اللي محتاجه ومش لاقيه، والطلب بيوصل للإدارة، ولما تتضاف المهنة
 * بنجهّز رسالة واتساب جاهزة تقول له «اللي طلبته بقى موجود».
 */

export const MISSING_NEED_MIN = 6;
export const MISSING_NEED_MAX = 300;

export type MissingInput = { need?: unknown; name?: unknown; phone?: unknown; categoryId?: unknown };
export type CleanMissing = { need: string; name: string; phone: string; categoryId: string };

/** تحقق من الطلب — الاسم اختياري، والرقم اختياري (لو حبيت نبلغه)، والنص مطلوب. */
export function cleanMissingRequest(input: MissingInput): { ok: true; value: CleanMissing } | { ok: false; error: string } {
  const need = String(input.need ?? "").replace(/\s+/g, " ").trim().slice(0, MISSING_NEED_MAX);
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const phone = String(input.phone ?? "").replace(/[^\d+]/g, "").trim();
  const categoryId = String(input.categoryId ?? "").trim();
  if (need.length < MISSING_NEED_MIN) return { ok: false, error: "اكتب اللي محتاجه بكلام بسيط (٦ حروف على الأقل)." };
  if (phone && !/^(\+?20)?01[0125]\d{8}$/.test(phone)) return { ok: false, error: "لو هنسجّل رقمك، اكتبه صح (مثال 01012345678) أو سيبه فاضي." };
  if (categoryId && !/^[a-z0-9][a-z0-9-]{1,59}$/i.test(categoryId)) return { ok: false, error: "القسم غير صحيح." };
  return { ok: true, value: { need, name, phone, categoryId } };
}

/** رسالة «اللي طلبته بقى موجود» — جاهزة للإرسال من لوحة الإدارة بضغطة. */
export function missingFulfilledMessage(input: { name?: string; need: string; title: string; url: string }, siteName = "دليل جنزور") {
  const name = (input.name ?? "").trim();
  return [
    `السلام عليكم${name ? ` ${name}` : ""} 👋`,
    `كنت طلبت من ${siteName}: «${input.need}» — وده بقى متاح على الدليل: ${input.title}.`,
    `تقدر تشوفه وتتواصل مباشرة من هنا: ${input.url}`,
    "لو محتاج حاجة تانية، ابعتلنا في أي وقت 🌿",
  ].join("\n");
}

/** تصنيف سريع للطلب في اللوحة: «مهنة» ولا «خدمة» ولا «محل» — للعرض فقط. */
export function missingKindLabel(need: string) {
  const text = String(need ?? "");
  if (/حداد|نجار|سباك|كهرب|نقاش|فني|معلم|مدرس|دكتور|طبيب|محامي/.test(text)) return "مهني";
  if (/محل|مكتب|سنتر|عيادة|صيدلية|مصنع/.test(text)) return "مكان";
  return "خدمة";
}

/** نص مختصر للعرض في الكروت. */
export function missingSummary(need: string, max = 120) {
  const text = String(need ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

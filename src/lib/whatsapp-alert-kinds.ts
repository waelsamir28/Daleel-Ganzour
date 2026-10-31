// أنواع أحداث تنبيهات واتساب للإدارة (مشتركة بين الخادم ولوحة التحكم — بلا اعتماد على قاعدة البيانات).
export const whatsappAlertKinds = [
  { id: "service", label: "طلب مهنة جديد / استكمال بيانات", hint: "كل طلب إضافة مهنة أو استكمال بيانات من المهني" },
  { id: "rating", label: "تقييم جديد", hint: "تقييمات الأعضاء بانتظار المراجعة" },
  { id: "suggestion", label: "اقتراح تعديل / طلب تحديث بيانات", hint: "ملاحظات الزوار على بيانات مقدمي الخدمة" },
  { id: "community", label: "منشور مجتمع جديد", hint: "عمالة أو عقارات أو وظائف" },
  { id: "ad-request", label: "طلب إعلان", hint: "طلبات الإعلان من صفحة «أعلن معنا»" },
  { id: "member", label: "عضو جديد", hint: "تسجيل عضوية جديدة في الموقع" },
  { id: "code-report", label: "بلاغ كود اتغيّر", hint: "بلاغات الزوار من صفحة الأكواد: «الكود ده اتغيّر؟»" },
  { id: "site-error", label: "خطأ في الموقع", hint: "خطأ جديد يظهر عند الزوار (مرة واحدة كل ساعة لنفس الخطأ)" },
] as const;
export type WhatsappAlertKind = (typeof whatsappAlertKinds)[number]["id"];
export const allWhatsappAlertKinds: WhatsappAlertKind[] = whatsappAlertKinds.map((kind) => kind.id);

/** يقبل مصفوفة أو نصًا مفصولًا بفواصل ويرجع الأنواع الصحيحة فقط (بلا تكرار). `null` يعني «كل الأنواع». */
export function sanitizeWhatsappAlertKinds(value: unknown): WhatsappAlertKind[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : null;
  if (!raw) return [...allWhatsappAlertKinds];
  const seen = new Set<WhatsappAlertKind>();
  for (const entry of raw) {
    const id = String(entry).trim() as WhatsappAlertKind;
    if ((allWhatsappAlertKinds as string[]).includes(id)) seen.add(id);
  }
  return allWhatsappAlertKinds.filter((id) => seen.has(id));
}

/** يحوّل أي صيغة لرقم مصري إلى الصيغة الدولية بدون «+» كما تطلبها CallMeBot: 01222355769 → 201222355769. */
export function normalizeWhatsappNumber(value: string): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (/^0?1\d{9}$/.test(digits)) return `20${digits.slice(-10)}`;
  if (/^20\d{10}$/.test(digits)) return digits;
  if (/^00/.test(digits)) return digits.slice(2);
  return digits;
}

/** يستخرج أول رقم موبايل مصري من نص الإشعار (للرد السريع عبر واتساب). */
export function extractEgyptPhone(text: string): string {
  const match = String(text ?? "").replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)).match(/(?:\+?2|00?2)?0?1[0125]\d{8}/);
  if (!match) return "";
  const digits = match[0].replace(/\D/g, "");
  return normalizeWhatsappNumber(digits.length === 10 ? `0${digits}` : digits);
}

/** رابط واتساب جاهز للرد على صاحب الطلب برسالة افتتاحية من الإدارة. */
export function whatsappReplyLink(phone: string, subject: string): string {
  const text = `السلام عليكم، معك إدارة دليل قرية جنزور بخصوص: ${subject}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

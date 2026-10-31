/**
 * التذكيرات الموسمية — منطق نقي (بدون شبكة أو قاعدة بيانات).
 *
 * فكرة بسيطة: أهل القرية بيفتكروا الصيانة في آخر لحظة. الدليل بيجهّز الخبر جاهز
 * في وقته (قبل الصيف: التكييف — قبل الشتا: السخان — قبل المدرسة: المدرسين…)،
 * والإدارة بتبعتُه بضغطة واحدة بالإشعارات. كل نص مكتوب وجاهز للإرسال.
 */

export type SeasonalReminder = {
  id: string;
  /** اسم الموعد (يظهر في لوحة الإدارة). */
  label: string;
  /** الشهور الميلادية اللي التذكير بيشتغل فيها (1 = يناير). */
  months: number[];
  /** الأيام المتبقية قبل بداية الموسم — لعرض «باقي كام يوم». */
  lead: string;
  title: string;
  body: string;
  /** مكان في الموقع يفتحه الزائر عند الضغط. */
  url: string;
  emoji: string;
};

export const SEASONAL_REMINDERS: readonly SeasonalReminder[] = [
  {
    id: "ac-before-summer",
    label: "صيانة التكييف قبل الصيف",
    months: [4, 5],
    lead: "قبل الحر",
    emoji: "❄️",
    title: "قبل ما الحر يبدأ.. نضّف تكييفك",
    body: "فنيين التكييف والتبريد في جنزور — أرقامهم ومواعيدهم جاهزة. الصيانة دلوقتي أرخص من الإصلاح في عز الصيف.",
    url: "/categories/crafts?specialty=ac",
  },
  {
    id: "water-heater-before-winter",
    label: "السخان قبل الشتا",
    months: [10, 11],
    lead: "قبل البرد",
    emoji: "🔥",
    title: "قبل الشتا.. اتأكد إن السخان شغال",
    body: "سباكين وكهربائية جنزور جاهزين لفحص السخان والمواسير قبل البرد — اتصل بأقرب فني في دقيقة.",
    url: "/categories/crafts?specialty=plumbing",
  },
  {
    id: "school-before-term",
    label: "دروس ومدرسين قبل الدراسة",
    months: [8, 9],
    lead: "قبل الدراسة",
    emoji: "🎓",
    title: "استعد للدراسة.. المدرسين والسناتر",
    body: "دروس ومراجعات لكل المراحل والمواد في جنزور. احجز مكانك قبل ما السنتر يتملى.",
    url: "/categories/teachers",
  },
  {
    id: "ramadan-prep",
    label: "استعداد رمضان",
    months: [2, 3],
    lead: "قبل رمضان",
    emoji: "🌙",
    title: "استعد لرمضان من دلوقتي",
    body: "مطاعم وحلويات وتوصيل للمنازل في جنزور — كل الأرقام في مكان واحد، وطلبك يوصلك للبيت.",
    url: "/categories/shops",
  },
  {
    id: "paint-before-eid",
    label: "نقاشة وتشطيب قبل العيد",
    months: [5, 6, 8, 9],
    lead: "قبل العيد",
    emoji: "🎨",
    title: "غيّر شكل بيتك قبل العيد",
    body: "نقاشين ودهانات وديكورات في جنزور — اطلب مقايسة مجانية بضغطة من الدليل.",
    url: "/categories/crafts?specialty=painting",
  },
  {
    id: "water-tank-summer",
    label: "غسيل الخزانات قبل الصيف",
    months: [4, 5, 6],
    lead: "قبل الصيف",
    emoji: "🚿",
    title: "اغسل الخزان قبل الصيف",
    body: "شركات ومهنيين تنظيف خزانات وشقق في جنزور — اتصل واطلب معاد يناسبك.",
    url: "/categories/cleaning",
  },
  {
    id: "car-ac-before-summer",
    label: "تكييف السيارة",
    months: [4, 5, 6],
    lead: "قبل السفر",
    emoji: "🚗",
    title: "تكييف عربيتك جاهز للسفر؟",
    body: "كهربائية وميكانيكا سيارات في جنزور — فحص سريع قبل المشاوير الطويلة.",
    url: "/categories/crafts?specialty=mechanics",
  },
  {
    id: "winter-gas-check",
    label: "فحص الغاز قبل الشتا",
    months: [10, 11, 12],
    lead: "أمان البيت",
    emoji: "🛟",
    title: "اتأكد من وصلات الغاز قبل الشتا",
    body: "فنيين معتمدين لفحص وصلات وسخانات الغاز في جنزور — الأمان أولًا.",
    url: "/categories/crafts?specialty=plumbing",
  },
  {
    id: "summer-nights-out",
    label: "الأفراح والمناسبات في الصيف",
    months: [5, 6, 7, 8],
    lead: "موسم الأفراح",
    emoji: "🎉",
    title: "فرحك في الصيف؟ احجز من دلوقتي",
    body: "صالات ومطابخ وأفراح وتصوير في جنزور — كل حاجة لفرحك في دليل واحد.",
    url: "/categories/events",
  },
];

/** الشهور المتاحة الآن (١–١٢) — مصر بتستخدم نفس التوقيت الميلادي. */
export function currentMonth(now: Date = new Date()) {
  return now.getMonth() + 1;
}

/** التذكيرات المستحقة في الشهر الحالي أو الشهر الجاي. */
export function dueSeasonalReminders(now: Date = new Date()): SeasonalReminder[] {
  const month = currentMonth(now);
  const next = (month % 12) + 1;
  return SEASONAL_REMINDERS.filter((item) => item.months.includes(month) || item.months.includes(next));
}

/** رابط التذكير — يتحقق إنه داخلي فقط. */
export function seasonalUrl(reminder: SeasonalReminder) {
  return reminder.url.startsWith("/") && !reminder.url.startsWith("//") ? reminder.url : "/";
}

/** التذكير القادم بعد الشهر الحالي (للعرض «قادم» في لوحة الإدارة). */
export function upcomingSeasonalReminders(now: Date = new Date()): SeasonalReminder[] {
  const due = new Set(dueSeasonalReminders(now).map((item) => item.id));
  return SEASONAL_REMINDERS.filter((item) => !due.has(item.id));
}

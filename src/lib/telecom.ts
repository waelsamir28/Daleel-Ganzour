/**
 * أرقام وأكواد شركات المحمول المصرية (فودافون / أورنج / اتصالات / وي).
 *
 * البيانات ثابتة هنا (وليس في قاعدة البيانات) لأنها أكواد رسمية تخص الشركات نفسها وليست أرقام
 * أهل القرية؛ أي تحديث يصير في هذا الملف `kind`:
 *  - number: رقم مختصر يُطلب مباشرة (مثل 888) — يُفتح عبر tel:
 *  - ussd: كود نجمة/شباك (مثل *550#) — يُفتح عبر tel: مع ترميز # إلى %23 أو يُنسخ.
 * الأكواد قد تتغير من وقت لآخر من الشركات؛ لذلك يظهر تنبيه أسفل كل نافذة.
 */
export type TelecomRowKind = "number" | "ussd";

export type TelecomRow = {
  label: string;
  code: string;
  kind: TelecomRowKind;
  note?: string;
};

export type TelecomGroupIcon = "phone" | "wallet" | "wifi" | "sim" | "card" | "support";

export type TelecomGroup = {
  title: string;
  icon: TelecomGroupIcon;
  rows: TelecomRow[];
};

export type TelecomOperator = {
  id: "vodafone" | "orange" | "etisalat" | "we";
  /** الاسم العربي كما يكتبه أهل القرية. */
  name: string;
  /** الاسم اللاتيني/العلمي للشركة. */
  latin: string;
  /** اللون الأساسي للشعار. */
  color: string;
  /** اللون الأغمق المستخدم في نهاية التدرّج. */
  colorDeep: string;
  /** جملة قصيرة تظهر في نافذة الشركة. */
  summary: string;
  /** أهم ثلاثة أرقام/أكواد تظهر على الزر نفسه: العملاء، الرصيد، الشحن. */
  quick: { label: string; row: TelecomRow }[];
  groups: TelecomGroup[];
};

const HOTLINE_NOTE = "من خط الشركة نفسها";

export const telecomOperators: TelecomOperator[] = [
  {
    id: "vodafone",
    name: "فودافون",
    latin: "Vodafone Egypt",
    color: "#e60000",
    colorDeep: "#a80000",
    summary: "أرقام وأكواد فودافون المهمة في مكان واحد: الكول سنتر، الرصيد، الشحن، الباقات، وفودافون كاش.",
    quick: [
      { label: "العملاء", row: { label: "خدمة عملاء فودافون", code: "888", kind: "number" } },
      { label: "الرصيد", row: { label: "الاستعلام عن الرصيد", code: "*888#", kind: "ussd" } },
      { label: "الشحن", row: { label: "شحن كارت الرصيد", code: "*858*", kind: "ussd" } },
    ],
    groups: [
      {
        title: "خدمة العملاء والدعم",
        icon: "support",
        rows: [
          { label: "خدمة العملاء من خط فودافون", code: "888", kind: "number", note: HOTLINE_NOTE },
          { label: "خدمة العملاء من أي خط آخر", code: "16888", kind: "number" },
          { label: "خدمة العملاء من خط أرضي", code: "0225292888", kind: "number" },
        ],
      },
      {
        title: "الرصيد والشحن والتحويل",
        icon: "wallet",
        rows: [
          { label: "الاستعلام عن الرصيد", code: "*888#", kind: "ussd" },
          { label: "الاستعلام عن الرصيد (كود بديل)", code: "*868*1#", kind: "ussd" },
          { label: "تحويل الرصيد", code: "*868*2#", kind: "ussd", note: "ثم اتبع القائمة: رقم المستلم ثم المبلغ" },
          { label: "شحن كارت الرصيد", code: "*858*", kind: "ussd", note: "ثم أدخل رقم الكارت" },
          { label: "سلفني شكرًا", code: "*8683#", kind: "ussd" },
          { label: "معرفة رقم الخط", code: "*878#", kind: "ussd" },
          { label: "آخر رقم حاول الاتصال بك", code: "*150#", kind: "ussd" },
        ],
      },
      {
        title: "الإنترنت والباقات",
        icon: "wifi",
        rows: [
          { label: "خدمات الموبايل إنترنت", code: "*888*4#", kind: "ussd" },
          { label: "متابعة استهلاك الفليكسات", code: "*60#", kind: "ussd" },
          { label: "نقاط فودافون وان", code: "*818*2#", kind: "ussd" },
          { label: "الكول تون", code: "*500#", kind: "ussd" },
        ],
      },
      {
        title: "فودافون كاش",
        icon: "card",
        rows: [
          { label: "القائمة الرئيسية للمحفظة", code: "*9#", kind: "ussd" },
          { label: "رصيد محفظة فودافون كاش", code: "*9*13#", kind: "ussd" },
          { label: "تحويل الأموال", code: "*9*7#", kind: "ussd", note: "ثم رقم المستلم والمبلغ" },
          { label: "خدمة عملاء فودافون كاش", code: "7000", kind: "number" },
        ],
      },
    ],
  },
  {
    id: "orange",
    name: "أورنج",
    latin: "Orange Egypt",
    color: "#ff7900",
    colorDeep: "#d95a00",
    summary: "أرقام وأكواد أورنج: الكول سنتر، الرصيد، باقات الإنترنت، سلفني وكلمني، وأورنج كاش.",
    quick: [
      { label: "العملاء", row: { label: "خدمة عملاء أورنج", code: "110", kind: "number" } },
      { label: "الرصيد", row: { label: "قائمة الرصيد والخدمات", code: "#100#", kind: "ussd" } },
      { label: "الشحن", row: { label: "شحن كارت الرصيد", code: "*102*", kind: "ussd" } },
    ],
    groups: [
      {
        title: "خدمة العملاء والدعم",
        icon: "support",
        rows: [
          { label: "خدمة العملاء من خط أورنج", code: "110", kind: "number", note: HOTLINE_NOTE },
          { label: "خدمة العملاء من أي خط", code: "16110", kind: "number" },
          { label: "النظام الصوتي (الرصيد والشحن)", code: "400", kind: "number" },
        ],
      },
      {
        title: "الرصيد والشحن",
        icon: "wallet",
        rows: [
          { label: "قائمة أورنج الرئيسية", code: "#100#", kind: "ussd" },
          { label: "معرفة الرصيد سريعًا", code: "#16#", kind: "ussd" },
          { label: "شحن كارت الرصيد", code: "*102*", kind: "ussd", note: "ثم أدخل رقم الكارت" },
          { label: "معرفة رقم الخط", code: "#119#", kind: "ussd" },
          { label: "سلفني شكرًا", code: "#444#", kind: "ussd" },
          { label: "كلمني شكرًا", code: "*121*", kind: "ussd", note: "ثم رقم الهاتف المطلوب" },
        ],
      },
      {
        title: "الإنترنت والباقات",
        icon: "wifi",
        rows: [
          { label: "إدارة باقات الإنترنت GO", code: "#222#", kind: "ussd" },
          { label: "استهلاك باقة الإنترنت", code: "#136#", kind: "ussd" },
          { label: "إدارة الباقة والتجديد", code: "#0#", kind: "ussd" },
          { label: "العروض اليومية", code: "#12#", kind: "ussd" },
        ],
      },
      {
        title: "أورنج كاش",
        icon: "card",
        rows: [
          { label: "رصيد محفظة أورنج كاش", code: "#115*1#", kind: "ussd" },
          { label: "كشف حساب المحفظة", code: "#115*2#", kind: "ussd" },
        ],
      },
    ],
  },
  {
    id: "etisalat",
    name: "اتصالات",
    latin: "e& Egypt",
    color: "#00a651",
    colorDeep: "#007a3d",
    summary: "أرقام وأكواد اتصالات (e&): الكول سنتر، الرصيد، باقات حكاية، سلفني، واتصالات كاش.",
    quick: [
      { label: "العملاء", row: { label: "خدمة عملاء اتصالات", code: "333", kind: "number" } },
      { label: "الرصيد", row: { label: "الاستعلام عن الرصيد", code: "*555#", kind: "ussd" } },
      { label: "الشحن", row: { label: "شحن كارت الرصيد", code: "*556*", kind: "ussd" } },
    ],
    groups: [
      {
        title: "خدمة العملاء والدعم",
        icon: "support",
        rows: [
          { label: "خدمة العملاء من خط اتصالات", code: "333", kind: "number", note: HOTLINE_NOTE },
          { label: "خدمة العملاء من أي خط", code: "01111234333", kind: "number" },
          { label: "خدمة العملاء من خط أرضي", code: "0235346333", kind: "number" },
        ],
      },
      {
        title: "الرصيد والشحن والتحويل",
        icon: "wallet",
        rows: [
          { label: "الاستعلام عن الرصيد", code: "*555#", kind: "ussd" },
          { label: "الاستعلام عن الرصيد (كود بديل)", code: "*888#", kind: "ussd" },
          { label: "تحويل الرصيد", code: "*557#", kind: "ussd", note: "ثم اتبع القائمة: رقم المستلم ثم المبلغ" },
          { label: "شحن كارت الرصيد", code: "*556*", kind: "ussd", note: "ثم أدخل رقم الكارت" },
          { label: "سلفني شكرًا", code: "*911#", kind: "ussd" },
          { label: "كلمني شكرًا", code: "*111*", kind: "ussd", note: "ثم رقم الهاتف المطلوب" },
          { label: "معرفة رقم الخط", code: "*947#", kind: "ussd" },
        ],
      },
      {
        title: "الإنترنت والباقات",
        icon: "wifi",
        rows: [
          { label: "باقات الإنترنت", code: "*566#", kind: "ussd" },
          { label: "استهلاك باقة الإنترنت", code: "*558*5#", kind: "ussd" },
          { label: "استهلاك الباقة (مكالمات وإنترنت)", code: "*852#", kind: "ussd" },
          { label: "تجديد الباقة مبكرًا", code: "*807#", kind: "ussd" },
          { label: "الكول تون", code: "1500", kind: "number" },
        ],
      },
      {
        title: "اتصالات كاش",
        icon: "card",
        rows: [
          { label: "القائمة الرئيسية للمحفظة", code: "*777#", kind: "ussd" },
          { label: "خدمة عملاء اتصالات كاش", code: "778", kind: "number" },
        ],
      },
    ],
  },
  {
    id: "we",
    name: "وي",
    latin: "WE — المصرية للاتصالات",
    color: "#6d2077",
    colorDeep: "#430f4a",
    summary: "أرقام وأكواد وي (المصرية للاتصالات): الكول سنتر، الرصيد، باقات نيترو، سلفني، ووي باي.",
    quick: [
      { label: "العملاء", row: { label: "خدمة عملاء وي", code: "111", kind: "number" } },
      { label: "الرصيد", row: { label: "الاستعلام عن الرصيد", code: "*550#", kind: "ussd" } },
      { label: "الشحن", row: { label: "شحن كارت الرصيد", code: "*555*", kind: "ussd" } },
    ],
    groups: [
      {
        title: "خدمة العملاء والدعم",
        icon: "support",
        rows: [
          { label: "خدمة العملاء من خط وي", code: "111", kind: "number", note: HOTLINE_NOTE },
          { label: "خدمة العملاء من أي خط", code: "19777", kind: "number" },
        ],
      },
      {
        title: "الرصيد والشحن والتحويل",
        icon: "wallet",
        rows: [
          { label: "الاستعلام عن الرصيد", code: "*550#", kind: "ussd" },
          { label: "شحن كارت الرصيد", code: "*555*", kind: "ussd", note: "ثم أدخل رقم الكارت" },
          { label: "تحويل الرصيد", code: "*551#", kind: "ussd", note: "ثم اتبع القائمة: رقم المستلم ثم المبلغ" },
          { label: "سلفني", code: "*504#", kind: "ussd" },
          { label: "كلمني", code: "*515*", kind: "ussd", note: "ثم رقم الهاتف المطلوب" },
          { label: "معرفة رقم الخط", code: "*688#", kind: "ussd" },
        ],
      },
      {
        title: "الإنترنت والباقات",
        icon: "wifi",
        rows: [
          { label: "المتبقي من الباقة", code: "*414#", kind: "ussd" },
          { label: "باقات الإنترنت (نيترو)", code: "*999#", kind: "ussd" },
          { label: "باقات كنترول كيكس", code: "*666#", kind: "ussd" },
          { label: "العروض اليومية", code: "*015#", kind: "ussd" },
        ],
      },
      {
        title: "وي باي والخدمات",
        icon: "card",
        rows: [
          { label: "خدمة عملاء وي باي", code: "565", kind: "number" },
          { label: "حظر المكالمات", code: "*205#", kind: "ussd" },
          { label: "الكول تون", code: "*777#", kind: "ussd" },
        ],
      },
    ],
  },
];

export function telecomOperatorById(id: string) {
  return telecomOperators.find((operator) => operator.id === id);
}

/** رابط الطلب من الهاتف: الأرقام كما هي، وأكواد USSD مع ترميز # إلى %23. */
export function telecomDialHref(row: Pick<TelecomRow, "code" | "kind">) {
  if (row.kind === "number") return `tel:${row.code.replace(/[^\d+]/g, "")}`;
  return `tel:${encodeURIComponent(row.code)}`;
}

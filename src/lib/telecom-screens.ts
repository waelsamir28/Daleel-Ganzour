/**
 * شاشات صفحة /telecom: كل شاشة = زر مربّع في الصفحة الرئيسية (4 شركات محمول + الخط الأرضي + البنوك).
 *
 * كل شاشة عندها عنوان على سطرين بلون الشركة، ووصف مختصر، ومجموعات (الدعم/الرصيد/الإنترنت/المحفظة)
 * تظهر كأزرار مربّعة ملوّنة. الأرقام الحكومية والمرافق العامة **مش** هنا لأن لها زر خاص بها في الدليل.
 */
import type { TelecomGroup, TelecomGroupIcon, TelecomOperator, TelecomReadyAction, TelecomRow } from "@/lib/telecom";
import { telecomOperators } from "@/lib/telecom";
import { landlineGroups } from "@/lib/landline";
import { paymentServices } from "@/lib/payments";

export type TelecomScreenIcon = "company" | "landline" | "bank";

export type TelecomScreen = {
  id: string;
  /** اسم مختصر يظهر على الزر المربّع. */
  name: string;
  latin: string;
  /** العنوان على سطرين — بلون الشاشة. */
  title: [string, string];
  /** وصف مختصر أسفل العنوان. */
  summary: string;
  /** شرح إضافي واضح للعميل. */
  help: string;
  color: string;
  colorDeep: string;
  icon: TelecomScreenIcon;
  /** نطاق البلاغات المحفوظة في جدول directory_telecom_reports. */
  scope: string;
  groups: TelecomGroup[];
  /** أكواد جاهزة تُولَّد من رقم الزائر (الشركات فقط). */
  ready: TelecomReadyAction[];
  operator?: TelecomOperator;
};

const bankRow = (name: string, number: string, note?: string): TelecomRow => ({ label: name, code: number, kind: "number", ...(note ? { note } : {}) });

const paymentApps = paymentServices.filter((service) => service.group === "app");
const bankServices = paymentServices.filter((service) => service.group === "bank");

/** مجموعة أرقام البنوك وتطبيقات الدفع — بنفس شكل بطاقات الشركات. */
export const bankGroups: TelecomGroup[] = [
  {
    title: "تطبيقات الدفع والمحافظ",
    tab: "تطبيقات",
    icon: "card" as TelecomGroupIcon,
    rows: paymentApps.map((service) => bankRow(service.name, service.number, service.note)),
  },
  {
    title: "البنوك",
    tab: "البنوك",
    icon: "wallet" as TelecomGroupIcon,
    rows: bankServices.map((service) => bankRow(service.name, service.number, service.note)),
  },
];

const operatorScreens: TelecomScreen[] = telecomOperators.map((operator) => ({
  id: operator.id,
  name: operator.name,
  latin: operator.latin,
  title: ["أرقام وأكواد", operator.name],
  summary: operator.summary,
  help: "اختار القسم اللي محتاجه من المربعات الملوّنة، أو دوس «كل الأكواد» تشوف أكواد الشركة كلها مرة واحدة.",
  color: operator.color,
  colorDeep: operator.colorDeep,
  icon: "company",
  scope: operator.id,
  groups: operator.groups,
  ready: operator.ready,
  operator,
}));

const landlineScreen: TelecomScreen = {
  id: "landline",
  name: "الخط الأرضي",
  latin: "WE Landline & Home Internet",
  title: ["أرقام الخط الأرضي", "والإنترنت المنزلي"],
  summary: "رقم واحد لكل خدمات وي الأرضية: 111 من الأرضي مجانًا، و19777 من الموبايل.",
  help: "أكواد تحويل المكالمات وانتظارها وإخفاء الرقم موحّدة على كل الخطوط الأرضية، والدعم الفني للفايبر على نفس الرقم 111.",
  color: "#6d2077",
  colorDeep: "#430f4a",
  icon: "landline",
  scope: "landline",
  groups: landlineGroups,
  ready: [],
};

const bankScreen: TelecomScreen = {
  id: "banks",
  name: "البنوك",
  latin: "Banks & Wallets Hotlines",
  title: ["أرقام البنوك", "وتطبيقات الدفع"],
  summary: "خطوط خدمة العملاء للبنوك المصرية وتطبيقات الدفع والمدفوعات اللحظية.",
  help: "كل الأرقام قصيرة وتعمل من أي هاتف — اضغط الرقم للاتصال أو انسخه، ولو رقم اتغيّر بلّغنا من نفس البطاقة.",
  color: "#0b5f9e",
  colorDeep: "#08375c",
  icon: "bank",
  scope: "banks",
  groups: bankGroups,
  ready: [],
};

export const telecomScreens: TelecomScreen[] = [...operatorScreens, landlineScreen, bankScreen];

export function telecomScreenById(id: string) {
  return telecomScreens.find((screen) => screen.id === id);
}

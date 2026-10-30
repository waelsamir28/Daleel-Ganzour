/**
 * أرقام خدمة عملاء تطبيقات الدفع والبنوك المصرية.
 * القائمة مختصرة على الأرقام الرسمية المتداولة (خطوط ساخنة قصيرة تُطلب مباشرة)،
 * وكل رقم منها يمكن أن يتغيّر — لذلك يظهر تنبيه أسفل القسم.
 */
export type PaymentService = {
  id: string;
  name: string;
  number: string;
  group: "app" | "bank";
  note?: string;
  /** كلمة بحث إضافية (اسم لاتيني/مرادف). */
  keywords?: string;
};

export const paymentServices: PaymentService[] = [
  { id: "instapay", name: "انستاباي", number: "15989", group: "app", note: "شبكة المدفوعات اللحظية — خدمة العملاء على مدار الساعة", keywords: "InstaPay تحويل أموال" },
  { id: "vfcash", name: "فودافون كاش", number: "7000", group: "app", note: "خدمة عملاء المحفظة", keywords: "محفظة كاش" },
  { id: "nbe", name: "البنك الأهلي المصري", number: "19623", group: "bank", keywords: "NBE الأهلي" },
  { id: "banquemisr", name: "بنك مصر", number: "19888", group: "bank", keywords: "Banque Misr" },
  { id: "cib", name: "البنك التجاري الدولي CIB", number: "19666", group: "bank", keywords: "CIB" },
  { id: "banquecairo", name: "بنك القاهرة", number: "16990", group: "bank", keywords: "Banque du Caire" },
  { id: "hdb", name: "بنك التعمير والإسكان", number: "19995", group: "bank", keywords: "HDB" },
  { id: "attijari", name: "التجاري وفا بنك", number: "16222", group: "bank", keywords: "Attijariwafa" },
  { id: "aub", name: "البنك الأهلي المتحد", number: "19072", group: "bank", keywords: "Al Ahli United" },
  { id: "saib", name: "بنك SAIB", number: "16668", group: "bank", keywords: "الشركة المصرفية العربية الدولية" },
  { id: "ebank", name: "البنك المصري لتنمية الصادرات ebank", number: "16710", group: "bank", keywords: "EBank" },
  { id: "aib", name: "بنك الاستثمار العربي", number: "16697", group: "bank", keywords: "AIB" },
  { id: "arab-bank", name: "البنك العربي", number: "19100", group: "bank", keywords: "Arab Bank" },
  { id: "egbank", name: "البنك المصري الخليجي EG Bank", number: "19342", group: "bank", keywords: "EGBank" },
  { id: "adib", name: "بنك أبو ظبي الإسلامي", number: "19951", group: "bank", keywords: "ADIB" },
  { id: "suez", name: "بنك قناة السويس", number: "19093", group: "bank", keywords: "Suez Canal Bank" },
  { id: "baraka", name: "بنك البركة", number: "19373", group: "bank", keywords: "Al Baraka" },
  { id: "blom", name: "بنك بلوم", number: "19233", group: "bank", keywords: "BLOM" },
  { id: "ouda", name: "بنك عودة", number: "16555", group: "bank", keywords: "Bank Audi" },
  { id: "greek", name: "البنك الأهلي اليوناني", number: "16272", group: "bank", keywords: "NBG" },
];

export function paymentDialHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

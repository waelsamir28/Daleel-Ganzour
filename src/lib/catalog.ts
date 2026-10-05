export const OFFICE_PHONE = "01222355769";
export const OFFICE_WHATSAPP = "https://wa.me/201222355769";
export const AD_PRICE = 50;
export const OTHER_ADDRESS = "عنوان آخر";

export type CategoryRecord = {
  id: string; name: string; parentId: string | null; description: string;
  color: string; light: string; icon: string; sortOrder: number; active: boolean;
};
export type AreaRecord = { id: string; name: string; sortOrder: number };
export type ServiceRecord = {
  id: string; name: string; category: string; area: string; address: string; phone: string;
  description: string; status: string; verified: boolean; featured: boolean; demo: boolean;
  emergency: boolean; rating: string; reviews: number; createdAt: string;
};
export type AdRecord = {
  id: string; businessName: string; text: string; phone: string; status: string;
  price: number; paid: boolean; expiresAt: string | null; createdAt: string;
};
export type MemberRecord = { id: string; name: string; username: string; phone: string; active: boolean; createdAt: string };
export type NotificationRecord = { id: string; type: string; title: string; message: string; entityId: string; read: boolean; createdAt: string };
export type Viewer = { role: "guest" | "member" | "admin"; id?: string; name?: string; username?: string };
export const marqueeMotionOptions = [
  { id: "right", label: "انسيابي لليمين" },
  { id: "left", label: "انسيابي لليسار" },
  { id: "bounce", label: "ذهاب وعودة" },
  { id: "fade", label: "ظهور واختفاء" },
  { id: "wave", label: "موجة متحركة" },
  { id: "float", label: "طفو وانسياب" },
  { id: "pulse", label: "نبض وانسياب" },
  { id: "glow", label: "توهج متحرك" },
  { id: "blur", label: "ضباب وانسياب" },
  { id: "static", label: "ثابت بدون حركة" },
] as const;
export const marqueeEmojis = ["📢", "⚡", "💪", "📱", "❓", "🥰", "😉", "♥️", "🎯", "❤️‍🔥", "😀", "💥", "💯", "💋", "💗", "🌹", "🔥", "🎉", "🎈", "🎁", "🏆", "☎️", "📌", "🔊", "🚬", "❌", "📳"] as const;
export const marqueeIconOptions = [{ icon: "Sparkles", label: "لمعة" }] as const;
export const marqueeTextColors = [
  { color: "#745827", label: "ذهبي داكن" },
  { color: "#155e91", label: "أزرق" },
  { color: "#16734a", label: "أخضر" },
  { color: "#a43f60", label: "وردي" },
  { color: "#5d48a1", label: "بنفسجي" },
  { color: "#27384a", label: "كحلي" },
  { color: "#f0ece6", label: "عاجي فاتح" },
  { color: "#ffffff", label: "أبيض" },
  { color: "#ffd88a", label: "ذهبي فاتح" },
] as const;
export const marqueeIconColors = [
  { color: "#e6a329", label: "ذهبي" },
  { color: "#1684d4", label: "أزرق" },
  { color: "#20a66d", label: "أخضر" },
  { color: "#e75d83", label: "وردي" },
  { color: "#8561d5", label: "بنفسجي" },
  { color: "#13a0a0", label: "فيروزي" },
] as const;
export const marqueeBackgroundColors = [
  { color: "#0e0f11", label: "أسود" },
  { color: "#173453", label: "أزرق داكن" },
  { color: "#174437", label: "أخضر داكن" },
  { color: "#49365d", label: "بنفسجي داكن" },
  { color: "#71404c", label: "خمري" },
  { color: "#fff6e8", label: "كريمي" },
  { color: "#eaf4ff", label: "أزرق فاتح" },
  { color: "#eaf7ef", label: "أخضر فاتح" },
  { color: "#fff0f4", label: "وردي فاتح" },
  { color: "#f2efff", label: "بنفسجي فاتح" },
] as const;
export type SiteSettings = {
  siteName: string; heroSubtitle: string; heroEyebrow: string; tagline: string;
  benefitsHeading: string; benefitsText: string; contactText: string; copyright: string;
  phone: string; adPrice: number; adDays: number; marqueeEnabled: boolean; marqueeSpeed: number;
  marqueeMotion: typeof marqueeMotionOptions[number]["id"]; marqueeTextColor: typeof marqueeTextColors[number]["color"];
  marqueeNameColor: typeof marqueeTextColors[number]["color"];
  marqueeIcon: string; marqueeIconColor: string;
  marqueeBackgroundColor: typeof marqueeBackgroundColors[number]["color"];
  marqueeFallback: string; showEmergency: boolean;
};
export type PublicDirectory = {
  services: ServiceRecord[]; ads: AdRecord[]; categories: CategoryRecord[];
  areas: AreaRecord[]; settings: SiteSettings; memberCount: number;
};
export type AdminDirectory = PublicDirectory & { members: MemberRecord[]; notifications: NotificationRecord[]; notificationUnread: number };

export const defaultSettings: SiteSettings = {
  siteName: "دليل المهن والخدمات بقرية جنزور",
  heroSubtitle: "أهل الخبرة قريبين منك.. كل خدمات جنزور في مكان واحد",
  heroEyebrow: "دليل أهل جنزور", tagline: "بسهولة • بسرعة • بثقة",
  benefitsHeading: "ليه تختار دليل قرية جنزور؟",
  benefitsText: "دليل يجمع أهل القرية.. ويوصّل كل خدمة لأصحابها",
  contactText: "لحجز إعلان، متابعة طلب إضافة مهنة، أو أي استفسار عن الدليل، تواصل مع مكتب الجمال مباشرة.",
  copyright: "جميع الحقوق محفوظة لمكتب الجمال للدعاية والإعلان.", phone: OFFICE_PHONE,
  adPrice: AD_PRICE, adDays: 7, marqueeEnabled: true, marqueeSpeed: 38,
  marqueeMotion: "right", marqueeTextColor: "#ffffff", marqueeNameColor: "#ffd88a", marqueeIcon: "Sparkles", marqueeIconColor: "#e6a329", marqueeBackgroundColor: "#0e0f11",
  marqueeFallback: "مساحتك الإعلانية هنا.. خلّي شغلك يوصل لكل أهل جنزور مع مكتب الجمال", showEmergency: true,
};

export const areas = ["جنزور / الناحية الشرقية", "جنزور / الناحية الغربية", "جنزور / بجوار المسجد البحري", "جنزور / شارع حسيب", "جنزور / السوق القديم", "جنزور / بجوار مكتبة الجمال", "جنزور / شارع السويقة"];

const roots: Array<[string, string, string, string, string]> = [
  ["crafts", "الحرفيين", "#ff941f", "Wrench", "أهل الصنعة والخبرة في القرية"],
  ["clinics", "العيادات", "#22b96d", "Stethoscope", "اختار التخصص الطبي المناسب"],
  ["labs", "المعامل", "#0eb0b1", "FlaskConical", "معامل التحاليل والخدمات الطبية"],
  ["shops", "المحلات", "#078cf0", "Store", "كل اللي تحتاجه من محلات جنزور"],
  ["teachers", "المدرسين", "#9160df", "GraduationCap", "مدرسين لكل المواد والمراحل"],
  ["charities", "جمعيات خيرية", "#ef5d82", "HandHeart", "إيد في إيد.. لخدمة أهل القرية"],
  ["other-services", "خدمات أخرى", "#0eb0b1", "Grid2X2", "خدمات متنوعة لأهل جنزور"],
];
const specialties: Record<string, Array<[string, string, string]>> = {
  crafts: [["carpentry", "النجارة", "Hammer"], ["plumbing", "السباكة", "Droplets"], ["electricity", "الكهرباء", "Zap"], ["metalwork", "الحدادة", "Anvil"], ["painting", "النقاشة والدهانات", "Paintbrush"], ["masonry", "البناء والمحارة", "BrickWall"], ["tiles", "السيراميك والبلاط", "PanelsTopLeft"], ["aluminum", "الألوميتال", "PanelsTopLeft"], ["glass", "الزجاج والمرايا", "PanelsTopLeft"], ["ac", "التكييف والتبريد", "Snowflake"], ["mechanics", "ميكانيكا السيارات", "Cog"], ["upholstery", "التنجيد", "Armchair"]],
  clinics: [["family", "طب الأسرة والباطنة", "Stethoscope"], ["pediatrics", "الأطفال", "Baby"], ["dentistry", "الأسنان", "Smile"], ["gynecology", "النساء والتوليد", "HeartPulse"], ["orthopedics", "العظام", "Bone"], ["dermatology", "الجلدية", "Sparkles"], ["ophthalmology", "العيون", "Eye"], ["ent", "الأنف والأذن والحنجرة", "Stethoscope"], ["physiotherapy", "العلاج الطبيعي", "Activity"]],
  labs: [["medical-labs", "معامل التحاليل", "FlaskConical"]],
  shops: [["groceries", "البقالة والسوبر ماركت", "ShoppingBasket"], ["pharmacies", "الصيدليات", "Pill"], ["clothing", "الملابس", "Shirt"], ["stationery", "المكتبات والأدوات المدرسية", "BookOpen"], ["appliances", "الأجهزة الكهربائية", "Tv"], ["food", "المطاعم والمأكولات", "Utensils"], ["mobile-shops", "الموبايلات والكمبيوتر", "Smartphone"]],
  teachers: [["arabic", "اللغة العربية", "BookOpen"], ["english", "اللغة الإنجليزية", "Languages"], ["math", "الرياضيات", "Calculator"], ["science", "العلوم والكيمياء والفيزياء", "FlaskConical"], ["social-studies", "الدراسات والتاريخ والجغرافيا", "Globe"]],
  charities: [["charitable-associations", "الجمعيات الأهلية", "HandHeart"], ["orphan-care", "رعاية الأيتام", "Heart"], ["community-support", "التكافل والمساعدات", "UsersRound"]],
  "other-services": [["law", "المحاماة والاستشارات", "Scale"], ["transport", "النقل والمواصلات", "Truck"], ["cameras", "كام��رات المراقبة", "Cctv"], ["solar", "الطاقة الشمسية", "Sun"], ["cleaning", "النظافة والخدمات المنزلية", "Sparkles"], ["other", "خدمات متنوعة", "Ellipsis"]],
};
export const iconNames = ["Wrench", "Stethoscope", "Store", "GraduationCap", "HandHeart", "Grid2X2", "Hammer", "Droplets", "Zap", "Anvil", "Paintbrush", "BrickWall", "PanelsTopLeft", "Snowflake", "Cog", "Armchair", "Baby", "Smile", "HeartPulse", "Bone", "Sparkles", "Eye", "Activity", "ShoppingBasket", "Pill", "Shirt", "BookOpen", "Tv", "Utensils", "Smartphone", "Languages", "Calculator", "FlaskConical", "Globe", "Heart", "UsersRound", "Scale", "Truck", "Cctv", "Sun", "Ellipsis"];
export const initialCategories: CategoryRecord[] = roots.flatMap(([id, name, color, icon, description], sortOrder) => [
  { id, name, color, light: `${color}12`, icon, description, sortOrder, parentId: null, active: true },
  ...specialties[id].map(([childId, childName, childIcon], order) => ({ id: childId, name: childName, color, light: `${color}12`, icon: childIcon, description: `مقدمو خدمات ${childName} بقرية جنزور`, sortOrder: order, parentId: id, active: true })),
]);
export const categories = initialCategories.filter((category) => !category.parentId);

export function getCategory(id: string, catalog: CategoryRecord[] = initialCategories): CategoryRecord {
  return catalog.find((category) => category.id === id) ?? { id, name: "خدمة", color: "#0876e1", light: "#edf6ff", icon: "Wrench", parentId: null, sortOrder: 0, active: true, description: "" };
}
export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
export function whatsappUrl(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
export const sampleServices = [
  { id: "00000000-0000-4000-8000-000000000001", name: "كهربائي منازل", category: "electricity", area: areas[0], address: areas[0], phone: "01044556677", description: "تركيب وصيانة الكهرباء الحديثة، وإصلاح الأعطال وتجهيز اللوحات الكهربائية.", rating: "4.8", reviews: 112, emergency: true, featured: true },
  { id: "00000000-0000-4000-8000-000000000002", name: "ميكانيكي سيارات", category: "mechanics", area: areas[1], address: areas[1], phone: "01055667788", description: "فحص وصيانة السيارات وتشخيص أعطال المحرك والصيانة الدورية.", rating: "4.7", reviews: 86, emergency: true, featured: true },
  { id: "00000000-0000-4000-8000-000000000003", name: "فني تكييف وتبريد", category: "ac", area: areas[3], address: areas[3], phone: "01098765432", description: "صيانة وتركيب التكييف، وتنظيف الوحدات وشحن الفريون.", rating: "4.9", reviews: 98, emergency: false, featured: true },
  { id: "00000000-0000-4000-8000-000000000004", name: "شركة النور للطاقة الشمسية", category: "solar", area: areas[4], address: areas[4], phone: "01012345678", description: "تركيب وصيانة أنظمة الطاقة الشمسية وحلول موفرة للطاقة.", rating: "4.8", reviews: 124, emergency: false, featured: true },
  { id: "00000000-0000-4000-8000-000000000005", name: "محمد حسن للسباكة", category: "plumbing", area: areas[2], address: areas[2], phone: "01022334455", description: "تأسيس وصيانة السباكة وإصلاح تسرب المياه وتركيب الأدوات الصحية.", rating: "4.6", reviews: 42, emergency: true, featured: false },
  { id: "00000000-0000-4000-8000-000000000006", name: "أحمد للنجارة والديكور", category: "carpentry", area: areas[5], address: areas[5], phone: "01033445566", description: "تفصيل الأثاث والمطابخ والديكور الخشبي وصيانة وتجديد الأثاث.", rating: "4.8", reviews: 35, emergency: false, featured: false },
  { id: "00000000-0000-4000-8000-000000000007", name: "د. سارة أحمد", category: "family", area: areas[6], address: areas[6], phone: "01066778899", description: "عيادة طب الأسرة والباطنة، متابعة وفحوصات دورية. يرجى الاتصال لحجز موعد.", rating: "4.9", reviews: 61, emergency: false, featured: false },
  { id: "00000000-0000-4000-8000-000000000008", name: "مكتب العدالة للمحاماة", category: "law", area: areas[0], address: areas[0], phone: "01077889900", description: "استشارات قانونية وصياغة العقود وخدمات تأسيس الشركات.", rating: "4.7", reviews: 24, emergency: false, featured: false },
];

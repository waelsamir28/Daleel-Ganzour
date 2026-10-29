export const OFFICE_PHONE = "01222355769";
export const OFFICE_WHATSAPP = "https://wa.me/201222355769";
export const OTHER_ADDRESS = "عنوان آخر";

export function parseServiceItems(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new Error("أدخل حتى ٢٠ خدمة تفصيلية.");
  return [...new Set(value.map((item) => {
    if (typeof item !== "string" || !item.trim() || item.trim().length > 100) throw new Error("كل خدمة يجب أن تكون نصًا من ١ إلى ١٠٠ حرف.");
    return item.trim();
  }))];
}

export function serviceWhatsappMessage(service: { name: string }, specialty: string, selectedArea = "", selectedService = "") {
  return `مرحبًا ${service.name}، وصلت إليك من دليل جنزور. محتاج ${selectedService || specialty}${selectedArea ? ` في ${selectedArea}` : ""}. هل الخدمة متاحة؟`;
}

export const specialtySynonyms: Record<string, string[]> = {
  "tch-center": ["سنتر", "مجموعات", "تقوية", "مركز تعليمي", "دروس خصوصية", "سناتر"],
  cardiology: ["قلب", "ضغط", "رسم قلب", "إيكو", "أوعية"],
  pulmonology: ["صدر", "صدرية", "ربو", "حساسية", "تنفس"],
  neurology: ["مخ", "أعصاب", "صداع", "صرع", "جلطة"],
  gastroenterology: ["جهاز هضمي", "معدة", "قولون", "كبد", "مناظير"],
  urology: ["مسالك", "كلى", "حصوات", "بروستاتا"],
  endocrinology: ["غدد", "سكر", "سكري", "درقية", "هرمونات", "سمنة"],
  radiology: ["أشعة", "رنين", "مقطعية", "سونار", "موجات صوتية"],
  "cosmetic-surgery": ["تجميل", "ليزر", "فيلر", "بوتوكس", "نضارة"],
  andrology: ["ذكورة", "عقم", "تأخر إنجاب", "خصوبة"],
  "medical-centers": ["مستشفى", "مركز طبي", "طوارئ", "استقبال"],
  "engineering-office": ["مهندس", "مكتب هندسي", "مقاول", "مقاولات", "تشطيب", "رسومات"],
  programming: ["مبرمج", "برمجة", "موقع", "تطبيق", "متجر إلكتروني", "ويب"],
  accounting: ["محاسب", "ضرائب", "تأمينات", "إقرار", "دفاتر"],
  travel: ["سفر", "سياحة", "حج", "عمرة", "طيران", "تأشيرة", "رحلات"],
  catering: ["طباخ", "طباخة", "ولائم", "عزومة", "كيترينج", "أكل بيتي"],
  security: ["أمن", "حراسة", "حارس", "سكيورتي"],
  arts: ["رسام", "رسم", "خطاط", "خط عربي", "لوحات", "جداريات"],
  "real-estate": ["عقارات", "سمسار", "شقق", "إيجار", "أراضي", "بيع وشراء"],
  nurseries: ["حضانة", "روضة", "كي جي", "أطفال", "نرسري"],
  "water-filters": ["فلتر", "فلاتر", "شمعات", "تحلية", "مياه"],
  "tch-arabic": ["عربي", "نحو", "بلاغة", "قراءة", "إملاء", "تعبير", "مدرس عربي"],
  "tch-english": ["إنجليزي", "انجليزي", "English", "قواعد", "محادثة", "لغة"],
  "tch-math": ["ماث", "حساب", "جبر", "هندسة", "تفاضل", "تكامل", "إحصاء", "math"],
  "tch-science": ["ساينس", "علوم", "science"],
  "tch-social": ["دراسات", "تاريخ", "جغرافيا", "اجتماعيات"],
  "tch-religion": ["دين", "قرآن", "تحفيظ", "تجويد", "تربية إسلامية"],
  "tch-foundation": ["تأسيس", "كي جي", "KG", "روضة", "صعوبات تعلم", "حضانة"],
  "tch-french": ["فرنساوي", "فرنسي", "French", "لغة ثانية"],
  "tch-german": ["ألماني", "الماني", "German", "لغة ثانية"],
  "tch-computer": ["كمبيوتر", "حاسب", "برمجة", "ICT", "تكنولوجيا"],
  "tch-physics": ["فيزياء", "physics", "ميكانيكا", "كهربية"],
  "tch-chemistry": ["كيمياء", "chemistry", "عضوية"],
  "tch-biology": ["أحياء", "احياء", "biology", "وراثة"],
  "tch-geology": ["جيولوجيا", "علوم بيئة", "geology"],
  "tch-philosophy": ["فلسفة", "منطق"],
  "tch-psychology": ["علم نفس", "اجتماع"],
  "tch-history": ["تاريخ"],
  "tch-geography": ["جغرافيا"],
  plumbing: ["موتور مياه", "ماتور مياه", "حنفيه", "مواسير", "صرف", "تسريب", "تسرب", "سخان", "فلتر", "بلاعه", "خلاط مياه", "قاعده حمام", "حوض", "سباك", "بتنقط", "تنقط", "تنقيط", "بتسرب", "ميه"],
  electricity: ["قفله", "فيشه", "لمبه", "عداد", "كابل", "لوحه", "شورت", "مفتاح كهرباء", "اناره", "نجفه", "سلك", "كهربائي"],
  carpentry: ["باب خشب", "شباك خشب", "غرفه نوم", "مطبخ خشب", "مفصله", "كالون", "سرير", "دولاب", "نيش", "نجار", "عفش"],
  metalwork: ["بوابه حديد", "تنده", "كريتال", "لحام", "شباك حديد", "سور حديد", "حداد", "فرم"],
  painting: ["دهان", "معجون", "بويه", "ورنيش", "رطوبه", "ديكور", "نقاش", "الوان حوائط", "شروخ"],
  masonry: ["محاره", "مباني", "طوب", "اسمنت", "رمل", "جبس", "بنا", "مبيض محاره", "تشطيب"],
  tiles: ["سيراميك", "بورسلين", "ارضيات", "حوائط", "رخام", "جرانيت", "درج سلم", "مبلط"],
  aluminum: ["شباك الوميتال", "مطبخ الوميتال", "تند", "سلك شباك", "قطاع بي اس", "جامبو", "فني الوميتال"],
  glass: ["مرايا", "زجاج سيكوريت", "بلور", "فاترينه", "قرصه زجاج"],
  ac: ["تكييف", "فريون", "تبريد", "ثلاجه", "غساله", "ديب فريزر", "سخان غاز", "بوتاجاز", "صيانه اجهزه"],
  mechanics: ["عربيه", "موتور سياره", "عفشه", "فرامل", "زيت", "كاوتش", "بطاريه", "ميكانيكي", "عطل سياره"],
  upholstery: ["تنجيد", "ركنه", "انتريه", "صالون", "مراتب", "قماش", "سفنج", "منجد"],
  family: ["باطنه", "ضغط", "سكر", "قولون", "معده", "كبد", "برد", "سخونيه", "كشف منزلي", "دكتور باطنه"],
  pediatrics: ["اطفال", "رضع", "حديثي الولاده", "حساسيه صدر", "تطعيم", "سخونيه طفل", "كحه", "نزله معويه", "دكتور اطفال"],
  dentistry: ["ضرس", "سنان", "اسنان", "تقويم", "حشو عصب", "خلع", "تركيبات", "لثه", "تبييض", "دكتور سنان"],
  gynecology: ["حمل", "ولاده", "سونار", "متابعه حمل", "نساء", "توليد", "قيصريه", "دكتوره نساء"],
  orthopedics: ["كسر", "ركبه", "ظهر", "غضروف", "مفاصل", "خشونه", "عمود فقري", "جبس", "دكتور عظام"],
  dermatology: ["حساسيه", "حبوب", "اكزيما", "بشره", "شعر", "تساقط", "ليزر", "تجميل", "دكتور جلديه"],
  ophthalmology: ["نظر", "نضاره", "عين", "مياه بيضاء", "شبكيه", "عدسات", "قاع عين", "دكتور عيون", "رمد"],
  ent: ["انف", "اذن", "حنجره", "لوز", "لحميه", "جيوب انفيه", "سمع", "غسيل اذن", "احتقان"],
  physiotherapy: ["علاج طبيعي", "تاهيل", "مساج علاجي", "انزلاق", "جلسات كهرباء", "اصابات ملاعب"],
  "medical-labs": ["تحليل", "تحاليل", "صوره دم", "سكر تراكمي", "وظائف كبد", "وظائف كلي", "مزرعه", "سحب عينه من المنزل", "معمل"],
  groceries: ["بقاله", "سوبر ماركت", "تموين", "جبنه", "لبن", "زيت", "سكر", "ارز", "خزين البيت", "عطاره"],
  pharmacies: ["صيدليه", "دواء", "علاج", "حقنه", "قياس ضغط", "قياس سكر", "روشته", "مناوبه", "طوارئ دواء", "لبن اطفال"],
  clothing: ["هدوم", "ملابس", "عبايات", "احذيه", "شنط", "جهاز عروسه", "ملابس اطفال", "ملابس رجالي", "ملابس حريمي"],
  stationery: ["مكتبه", "تصوير ورق", "طباعه", "كشاكيل", "اقلام", "ادوات مدرسيه", "مذكرات", "هدايا"],
  appliances: ["اجهزه كهربائيه", "شاشات", "تلفزيون", "مراوح", "خلاط", "مكواه", "جهاز عروسه كهرباء"],
  food: ["اكل", "مطعم", "كشري", "مشويات", "فول وطعميه", "كريب", "بيتزا", "ساندوتشات", "حلويات", "مخبز", "فرن عيش", "فطير", "عصير", "كافيه"],
  "mobile-shops": ["موبايل", "تليفون", "شاشه موبايل", "بطاريه موبايل", "شاحن", "سماعه", "جراب", "كمبيوتر", "لابتوب", "صيانه موبايل", "تحويل كاش", "فودافون كاش"],
  arabic: ["عربي", "نحو", "قراءه", "تاسيس", "بلاغه", "مدرس عربي"],
  english: ["انجليزي", "تاسيس انجليزي", "كورس انجليزي", "فونكس", "مدرس انجليزي"],
  math: ["رياضه", "حساب", "جبر", "هندسه", "احصاء", "ماث", "مدرس رياضه"],
  science: ["علوم", "كيمياء", "فيزياء", "احياء", "ساينس", "مدرس علوم"],
  "social-studies": ["دراسات", "تاريخ", "جغرافيا", "فلسفه", "علم نفس", "مدرس دراسات"],
  law: ["محامي", "قضيه", "عقد", "شهر عقاري", "استشاره قانونيه", "ميراث", "احوال شخصيه"],
  "community-pharmacies": ["صيدليه", "صيدليات", "دواء", "روشته", "علاج", "قياس ضغط", "قياس سكر", "حقنه"],
  "night-pharmacies": ["صيدليه 24 ساعه", "صيدليه مناوبه", "صيدليه ليلي", "طوارئ دواء", "صيدليه بالليل"],
  "medical-supplies": ["مستلزمات طبيه", "اجهزه طبيه", "جهاز ضغط", "جهاز سكر", "كرسي متحرك", "اكسجين", "مشايه"],
  lawyers: ["محامي", "محاميه", "قضيه", "محكمه", "نيابه", "جنايات", "احوال شخصيه", "ميراث", "طلاق", "نفقه"],
  "legal-consulting": ["استشاره قانونيه", "استشارات", "مستشار قانوني", "حقوق", "نزاع", "شكوى"],
  contracts: ["عقد", "عقود", "شهر عقاري", "توثيق", "توكيل", "تسجيل ملكيه", "عقد ايجار", "عقد بيع"],
  transport: ["مواصلات", "عربيه", "ميكروباص", "توكتوك", "نقل عفش", "توصيل", "مشوار", "سوزوكي", "ربع نقل"],
  cameras: ["كاميرات مراقبه", "انتركوم", "انذار", "شبكات", "راوتر", "واي فاي", "دش", "رسيفر"],
  solar: ["طاقه شمسيه", "الواح شمسيه", "انفرتر", "بطاريات طاقه"],
  cleaning: ["نظافه", "غسيل سجاد", "تنظيف منازل", "مكافحه حشرات", "رش حشرات"],
  "print-shops": ["مطبعه", "طباعه", "تصوير مستندات", "كروت", "كارت", "كروت شخصيه", "فواتير", "دفاتر", "مطبوعات"],
  advertising: ["دعايه", "اعلان", "كروت", "كارت", "كروت دعاية", "كروت اعلانيه", "تصميم كروت", "بزنس كارد", "يفط", "لافتات", "بنر", "واجهات محلات", "فلكس", "كلادينج"],
  "graphic-design": ["تصميم", "جرافيك", "لوجو", "شعار", "سوشيال ميديا", "فوتوشوب"],
  photography: ["مصور", "تصوير افراح", "فوتوسيشن", "فيديو", "مونتاج", "كاميرا"],
  dj: ["دي جي", "دى جى", "صوت", "اضاءه", "سماعات", "حفلات", "زفه"],
  hairdressers: ["كوافير", "كوافيره", "تصفيف شعر", "عروسه", "صالون", "حلاق"],
  makeup: ["ميكب", "مكياج", "ميكاب", "ميك اب", "عروسه", "تجميل"],
  "wedding-planning": ["تجهيز افراح", "كوشه", "فرح", "سرادق", "قاعه", "ديكور افراح", "خطوبه", "مناسبات"],
  moving: ["نقل عفش", "نقل اثاث", "ونش رفع عفش", "فك وتركيب", "تغليف"],
  freight: ["نقل بضائع", "سياره نقل", "ربع نقل", "جامبو", "نصف نقل", "تريله"],
  rides: ["مشوار", "مشاوير", "توكتوك", "ميكروباص", "عربيه ملاكي", "توصيل", "مطار"],
  "apartment-cleaning": ["تنظيف شقق", "تنظيف منازل", "نظافه شقه", "تنظيف بعد التشطيب", "شركه نظافه"],
  "carpet-cleaning": ["غسيل سجاد", "مغسله سجاد", "تنظيف سجاد", "غسيل موكيت", "تنظيف انتريه", "بخار"],
  "satellite-dish": ["دش", "رسيفر", "ريسيفر", "قمر صناعي", "تركيب دش", "ضبط دش", "ستالايت"],
  "locksmith": ["كوالين", "كالون", "مفاتيح", "نسخ مفتاح", "فتح باب", "كوالينجي", "قفل"],
  "gypsum-decor": ["جبس", "جبس بورد", "ديكور", "اسقف معلقه", "كرانيش", "ديكورات"],
  "appliance-repair": ["صيانه ثلاجه", "صيانه غساله", "صيانه بوتاجاز", "سخان", "ديب فريزر", "صيانه اجهزه", "فني اجهزه"],
  "home-nursing": ["تمريض", "ممرض", "ممرضه", "حقن", "محاليل", "رعايه منزليه", "قياس ضغط منزلي", "تمريض منزلي"],
  "psychiatry": ["نفسيه", "طبيب نفسي", "اعصاب", "اكتئاب", "قلق", "استشاره نفسيه", "مخ واعصاب"],
  "butchers": ["جزار", "جزاره", "لحمه", "لحم", "كندوز", "ضاني", "مفروم", "كبده"],
  "poultry": ["فراخ", "دواجن", "بيض", "بط", "ديك رومي", "فرخه", "فراخ بلدي"],
  "fish-shops": ["سمك", "اسماك", "بلطي", "بوري", "جمبري", "سمك مشوي", "ماكريل"],
  "bakeries": ["مخبز", "عيش", "فينو", "حلواني", "كيك", "تورته", "بسكويت", "كحك", "مخبوزات", "بتي فور"],
  "produce": ["خضار", "فاكهه", "خضروات", "طماطم", "بطاطس", "موز", "برتقال", "خضري", "فكهاني"],
  "cafes": ["كافيه", "قهوه", "عصير", "عصائر", "شيشه", "كافيتيريا", "مشروبات", "قهوه بلدي"],
  "hardware": ["ادوات صحيه", "ادوات كهربائيه", "خلاط", "حنفيه", "سلك", "لمبات", "مواسير", "محل كهرباء"],
  "furniture": ["موبيليا", "اثاث", "انتريه", "غرفه نوم", "سفره", "مفروشات", "مراتب", "ركنه"],
  "quran": ["تحفيظ", "قران", "قرآن", "شيخ", "تجويد", "كتاب", "محفظ", "حفظ قران"],
  "kindergarten": ["حضانه", "روضه", "كي جي", "اطفال", "حضانه اطفال", "نرسري", "رياض اطفال"],
  "barbers": ["حلاق", "حلاقه", "حلاق رجالي", "صالون رجالي", "قص شعر", "دقن", "تشذيب", "مزين"],
  "tailors": ["ترزي", "خياط", "خياطه", "تفصيل", "تضييق", "تقصير", "ماكينه خياطه", "خياط حريمي"],
  "laundry": ["مغسله", "مكوجي", "مكوه", "غسيل", "دراي كلين", "كي", "تنظيف ملابس"],
  "veterinary": ["بيطري", "دكتور بيطري", "طبيب بيطري", "مواشي", "بهايم", "قطط", "كلاب", "تطعيم حيوانات"],
  "gyms": ["جيم", "لياقه", "كمال اجسام", "مدرب", "تخسيس", "رياضه", "فتنس", "تمارين"],
  "agri-engineering": ["مهندس زراعي", "مشتل", "شتلات", "زراعه", "سماد", "مبيد", "نخيل", "تقليم", "ارض زراعيه"],
};

export function getSpecialtyKeywords(categoryId: string): string {
  return (specialtySynonyms[categoryId] ?? []).join(" ");
}

export function matchesServiceQuery(service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties" | "category" | "address" | "phone" | "phoneSecondary">, categoryName: string, query: string): boolean {
  const normalizedQuery = normalizeSearch(query.trim());
  if (!normalizedQuery) return true;
  const haystack = normalizeSearch(`${service.name} ${service.description} ${(service.serviceItems ?? []).join(" ")} ${(service.subSpecialties ?? []).join(" ")} ${categoryName} ${getSpecialtyKeywords(service.category)} ${service.address} ${service.phone} ${service.phoneSecondary}`);
  if (haystack.includes(normalizedQuery)) return true;
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 1);
  return words.length > 1 && words.every((word) => haystack.includes(word));
}

const serviceIntentStopWords = new Set("عايز عايزه عايزين عاوز عاوزه عاوزين محتاج محتاجه محتاجين اريد ابغي نفسي اعمل اعمللي ممكن ياريت لو سمحت من فضلك عندي عندنا عنده عندها معايا عند لمحل للمحل بالمحل محل المحل في فيا فى من الى الي على علي ليا له لها هو هي انا انت احنا احنا ده دي دا ديه كده كدا كتير كثير جدا شويه شوية قوي او او و ولا عشان علشان بس خدمة خدمات حاجه حاجة شيء مياه ميه ماء الميه الميه كتيراً".split(/\s+/));
const serviceIntentPrefixes = ["وال", "فال", "بال", "كال", "ولل", "لل", "ال"];

export function extractServiceIntentTokens(query: string): string[] {
  return [...new Set(normalizeSearch(query).split(/[^\p{L}\p{N}]+/u).map((rawToken) => {
    let token = rawToken;
    for (const prefix of serviceIntentPrefixes) {
      if (token.startsWith(prefix) && token.length - prefix.length >= 2) {
        token = token.slice(prefix.length);
        break;
      }
    }
    return token;
  }).filter((token) => token.length > 1 && !serviceIntentStopWords.has(token)))];
}

export function matchesServiceIntentQuery(service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties" | "category" | "address" | "phone" | "phoneSecondary">, categoryName: string, query: string): boolean {
  const queryTokens = extractServiceIntentTokens(query);
  if (!queryTokens.length) return false;
  const searchableText = [service.name, service.description, categoryName, ...(service.serviceItems ?? []), ...(service.subSpecialties ?? []), ...(specialtySynonyms[service.category] ?? [])].join(" ");
  const searchableTokens = new Set(extractServiceIntentTokens(searchableText));
  return queryTokens.some((token) => searchableTokens.has(token));
}

export function suggestServiceIntentCategories(query: string, catalog: CategoryRecord[]): CategoryRecord[] {
  const queryTokens = extractServiceIntentTokens(query);
  if (!queryTokens.length) return [];
  return catalog.filter((category) => {
    if (!category.active || !category.parentId) return false;
    const categoryText = [category.name, category.description, ...(specialtySynonyms[category.id] ?? [])].join(" ");
    const categoryTokens = new Set(extractServiceIntentTokens(categoryText));
    return queryTokens.some((token) => categoryTokens.has(token));
  }).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);
}

export function suggestSpecialties(query: string, catalog: CategoryRecord[], providers: { category: string }[], rootId?: string) {
  const words = normalizeSearch(query).split(/\s+/).filter((word) => word.length > 1);
  return catalog.filter((item) => item.active && item.parentId && (!rootId || item.parentId === rootId) && providers.some((service) => service.category === item.id))
    .map((item) => {
      const searchable = normalizeSearch(`${item.name} ${item.description} ${getSpecialtyKeywords(item.id)}`);
      return { item, score: words.reduce((score, word) => score + (searchable.includes(word) ? 1 : 0), 0) };
    })
    .sort((a, b) => b.score - a.score || a.item.sortOrder - b.item.sortOrder)
    .slice(0, 3).map(({ item }) => item);
}

export const AVAILABILITY_HOURS = 4;
export const WEEK_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;
export type WorkingDay = { closed: boolean; opens: string; closes: string };
export type WorkingHours = WorkingDay[];

export function parseWorkingHours(value: unknown): WorkingHours {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || (value.length !== 0 && value.length !== 7)) throw new Error("أدخل مواعيد الأيام السبعة.");
  return value.map((day) => {
    if (!day || typeof day !== "object" || typeof day.closed !== "boolean") throw new Error("حدد أيام العمل والإجازات.");
    if (day.closed) return { closed: true, opens: "", closes: "" };
    const validTime = (time: unknown) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (!validTime(day.opens) || !validTime(day.closes) || day.opens === day.closes) throw new Error("أدخل وقت فتح وإغلاق صحيحين ومختلفين.");
    return { closed: false, opens: day.opens as string, closes: day.closes as string };
  });
}

export function isAvailableNow(service: { availableNow: boolean; availableUntil?: string | null }, now = Date.now()) {
  return service.availableNow && Boolean(service.availableUntil) && Date.parse(service.availableUntil!) > now;
}

export function isOpenByWorkingHours(workingHours: WorkingHours | undefined | null, now = Date.now()): boolean {
  if (!Array.isArray(workingHours) || workingHours.length !== 7) return false;
  const date = new Date(now);
  const toMinutes = (time: string) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
    return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
  };
  const dayIndex = date.getDay();
  const minutesNow = date.getHours() * 60 + date.getMinutes();
  const today = workingHours[dayIndex];
  if (today && !today.closed) {
    const opens = toMinutes(today.opens);
    const closes = toMinutes(today.closes);
    if (opens >= 0 && closes >= 0) {
      if (opens < closes && minutesNow >= opens && minutesNow < closes) return true;
      if (opens > closes && (minutesNow >= opens || minutesNow < closes)) return true;
    }
  }
  const yesterday = workingHours[(dayIndex + 6) % 7];
  if (yesterday && !yesterday.closed) {
    const opens = toMinutes(yesterday.opens);
    const closes = toMinutes(yesterday.closes);
    if (opens > closes && closes >= 0 && minutesNow < closes) return true;
  }
  return false;
}

export function isServiceOpenOrAvailableNow(
  service: Pick<ServiceRecord, "availableNow" | "availableUntil"> & { workingHours?: WorkingHours | null },
  now = Date.now(),
): boolean {
  return isAvailableNow(service, now) || isOpenByWorkingHours(service.workingHours, now);
}

export type GanzourPrayerItem = {
  id: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  name: string;
  time24: string;
  time12: string;
  minutes: number;
};

export type GanzourPrayerWeatherInfo = {
  locationLabel: string;
  dateLabel: string;
  prayers: GanzourPrayerItem[];
  nextPrayer: {
    id: GanzourPrayerItem["id"];
    name: string;
    time12: string;
    remainingText: string;
  };
  weather: {
    tempC: number;
    label: string;
    period: "day" | "night";
  };
};

export function getGanzourPrayerAndWeather(now = Date.now()): GanzourPrayerWeatherInfo {
  const date = new Date(now);
  const month = date.getMonth(); // 0..11
  const hour = date.getHours();
  const minute = date.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Seasonal offsets for Ganzour, Menoufia (approx. 30.62N, 31.04E)
  const summerFactor = Math.sin(((month - 2) / 12) * Math.PI * 2); // peaks in May-July
  const fajrMin = Math.round(275 - summerFactor * 48); // ~3:47 AM in summer, ~5:20 AM in winter
  const dhuhrMin = Math.round(722 + summerFactor * 6); // ~12:02 PM
  const asrMin = Math.round(935 + summerFactor * 22); // ~3:15 PM - 3:55 PM
  const maghribMin = Math.round(1075 + summerFactor * 68); // ~4:55 PM in winter, ~7:00 PM in summer
  const ishaMin = maghribMin + 82;

  const fmt24 = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const fmt12 = (m: number) => {
    const h24 = Math.floor(m / 60);
    const mins = String(m % 60).padStart(2, "0");
    const period = h24 >= 12 ? "م" : "ص";
    const h12 = h24 % 12 || 12;
    return `${h12}:${mins} ${period}`;
  };

  const prayers: GanzourPrayerItem[] = [
    { id: "fajr", name: "الفجر", time24: fmt24(fajrMin), time12: fmt12(fajrMin), minutes: fajrMin },
    { id: "dhuhr", name: "الظهر", time24: fmt24(dhuhrMin), time12: fmt12(dhuhrMin), minutes: dhuhrMin },
    { id: "asr", name: "العصر", time24: fmt24(asrMin), time12: fmt12(asrMin), minutes: asrMin },
    { id: "maghrib", name: "المغرب", time24: fmt24(maghribMin), time12: fmt12(maghribMin), minutes: maghribMin },
    { id: "isha", name: "العشاء", time24: fmt24(ishaMin), time12: fmt12(ishaMin), minutes: ishaMin },
  ];

  const upcoming = prayers.find((item) => item.minutes > currentMinutes) ?? prayers[0];
  const diffMinutes = upcoming.minutes > currentMinutes
    ? upcoming.minutes - currentMinutes
    : 24 * 60 - currentMinutes + upcoming.minutes;
  const remHours = Math.floor(diffMinutes / 60);
  const remMins = diffMinutes % 60;
  const remainingText = remHours > 0
    ? `متبقي ${remHours} س و ${remMins} د`
    : `متبقي ${remMins} دقيقة`;

  // Realistic seasonal temperature for Ganzour, Menoufia
  const baseTemps = [18, 19, 23, 27, 32, 35, 36, 35, 33, 29, 24, 19];
  const baseTemp = baseTemps[month] ?? 26;
  const diurnalDelta = hour >= 12 && hour <= 16 ? 2 : hour >= 7 && hour < 12 ? 0 : -5;
  const tempC = baseTemp + diurnalDelta;
  const isNight = hour >= 18 || hour < 6;
  const weatherLabel = isNight
    ? tempC <= 17 ? "أجواء باردة ليلاً في جنزور" : "أجواء ليلية لطيفة في جنزور"
    : tempC >= 33 ? "مشمس وحار نهاراً في جنزور" : "أجواء صافية ومعتدلة في جنزور";

  let dateLabel = "";
  try {
    dateLabel = date.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    dateLabel = "اليوم في جنزور";
  }

  return {
    locationLabel: "قرية جنزور • المنوفية",
    dateLabel,
    prayers,
    nextPrayer: {
      id: upcoming.id,
      name: upcoming.name,
      time12: upcoming.time12,
      remainingText,
    },
    weather: {
      tempC,
      label: weatherLabel,
      period: isNight ? "night" : "day",
    },
  };
}

// Only an explicit activation renews availability; editing other fields preserves the deadline.
export function availabilityUpdate(action: unknown, current: { availableNow: boolean; availableUntil: Date | null }, now = Date.now()) {
  // Return only the availability columns: callers spread this into update payloads, so
  // handing back the full `current` row would silently overwrite every other edited field.
  if (action === undefined || action === "keep") return { availableNow: current.availableNow, availableUntil: current.availableUntil };
  if (action === "stop") return { availableNow: false, availableUntil: null };
  if (action === "activate") return { availableNow: true, availableUntil: new Date(now + AVAILABILITY_HOURS * 60 * 60 * 1000) };
  throw new Error("اختار إجراء إتاحة صحيح.");
}

export type CategoryRecord = {
  id: string; name: string; parentId: string | null; description: string;
  color: string; light: string; icon: string; sortOrder: number; active: boolean;
  /** Dimensional (3D) artwork symbol for root sections; empty means "derive from the icon". */
  art: string;
  /** رقم نسخة الأيقونة المرفوعة من الإدارة (0 أو غير موجود = لا توجد). */
  imageVersion?: number;
  /** (تخصصات المدرسين) المراحل الدراسية مفصولة بفواصل: primary,prep,secondary — فارغ = يظهر في كل المراحل. */
  stages?: string;
};

/** المراحل الدراسية لقسم «المدرسين»: تظهر شاشة اختيار المرحلة قبل التخصصات. */
export const TEACHERS_ROOT_ID = "teachers";
export type TeacherStageId = "primary" | "prep" | "secondary";
export type TeacherStage = { id: TeacherStageId; name: string; short: string; hint: string; color: string; sticker: string };
export const TEACHER_STAGES: TeacherStage[] = [
  { id: "primary", name: "المرحلة الابتدائية", short: "ابتدائي", hint: "من الصف الأول حتى السادس الابتدائي", color: "#2f8be8", sticker: "/images/stage-stickers/primary.webp" },
  { id: "prep", name: "المرحلة الإعدادية", short: "إعدادي", hint: "الصفوف الأول والثاني والثالث الإعدادي", color: "#16a37a", sticker: "/images/stage-stickers/prep.webp" },
  { id: "secondary", name: "المرحلة الثانوية", short: "ثانوي", hint: "الصفوف الأول والثاني والثالث الثانوي", color: "#e8792f", sticker: "/images/stage-stickers/secondary.webp" },
];
export function getTeacherStage(id: unknown): TeacherStage | null {
  return TEACHER_STAGES.find((stage) => stage.id === id) ?? null;
}
/** يحوّل أي مدخل (قائمة أو نص مفصول بفواصل) إلى نص مراحل صالح ومرتب. */
export function normalizeStages(value: unknown): string {
  const raw = Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(/[,\s]+/) : [];
  return TEACHER_STAGES.filter((stage) => raw.includes(stage.id)).map((stage) => stage.id).join(",");
}
export function categoryStageIds(category: Pick<CategoryRecord, "stages">): TeacherStageId[] {
  return normalizeStages(category.stages ?? "").split(",").filter(Boolean) as TeacherStageId[];
}
/** التخصص بلا مراحل محددة يظهر في كل المراحل حتى لا يختفي شيء. */
export function categoryInStage(category: Pick<CategoryRecord, "stages">, stageId: TeacherStageId): boolean {
  const ids = categoryStageIds(category);
  return !ids.length || ids.includes(stageId);
}
/** المدرس يحدد مراحله في «التخصصات الفرعية» بوسم اسم المرحلة؛ من لم يحدد يظهر في كل المراحل. */
export function serviceStageIds(service: Pick<ServiceRecord, "subSpecialties">): TeacherStageId[] {
  const tags = (service.subSpecialties ?? []).map((item) => normalizeSearch(item));
  return TEACHER_STAGES.filter((stage) => tags.includes(normalizeSearch(stage.name))).map((stage) => stage.id);
}
export function serviceInStage(service: Pick<ServiceRecord, "subSpecialties">, stageId: TeacherStageId): boolean {
  const ids = serviceStageIds(service);
  return !ids.length || ids.includes(stageId);
}
/** يستبدل وسوم المراحل داخل «التخصصات الفرعية» بالمراحل المختارة ويحافظ على باقي الوسوم. */
export function withServiceStages(subSpecialties: string[], stageIds: unknown): string[] {
  const chosen = normalizeStages(stageIds).split(",").filter(Boolean);
  const stageNames = TEACHER_STAGES.map((stage) => normalizeSearch(stage.name));
  const rest = (subSpecialties ?? []).filter((item) => !stageNames.includes(normalizeSearch(item)));
  return [...TEACHER_STAGES.filter((stage) => chosen.includes(stage.id)).map((stage) => stage.name), ...rest].slice(0, 20);
}
export function stageHref(rootId: string, stageId: TeacherStageId | null | undefined, specialtyId?: string): string {
  return `/categories/${rootId}${specialtyId ? `/${specialtyId}` : ""}${stageId ? `?stage=${stageId}` : ""}`;
}
/** The 3D symbols available in /images/category-3d.svg that a root section can display. */
export const categoryArtOptions: Array<{ id: string; label: string }> = [
  { id: "crafts", label: "مفتاح وشاكوش (حرفيين)" },
  { id: "clinics", label: "سماعة طبيب (عيادات)" },
  { id: "labs", label: "دورق معمل (معامل)" },
  { id: "pharmacy", label: "صيدلية وكبسولة (صيدليات)" },
  { id: "shops", label: "واجهة محل (محلات)" },
  { id: "food", label: "طبق وأدوات مائدة (مطاعم)" },
  { id: "teachers", label: "كتب وقبعة تخرج (مدرسين)" },
  { id: "charities", label: "قلب بين يدين (جمعيات)" },
  { id: "printing", label: "طابعة (طباعة ودعاية)" },
  { id: "events", label: "بالونات واحتفال (أفراح)" },
  { id: "transport", label: "سيارة نقل (نقل وتوصيل)" },
  { id: "cleaning", label: "بخاخ وجردل (نظافة)" },
  { id: "law", label: "ميزان العدالة (محاماة)" },
  { id: "tech", label: "لابتوب وموبايل (تقنية)" },
  { id: "home", label: "منزل (عقارات وسكن)" },
  { id: "beauty", label: "مرآة ومقص (تجميل)" },
  { id: "agriculture", label: "نبتة وأرض (زراعة)" },
  { id: "money", label: "عملات ونقود (مالية)" },
  { id: "duty", label: "صليب طبي (مناوبة)" },
  { id: "utilities", label: "هاتف طوارئ (أرقام مهمة)" },
  { id: "quick", label: "برق (خدمات سريعة)" },
  { id: "featured", label: "تاج (مميز)" },
  { id: "other", label: "صندوق أدوات (خدمات أخرى)" },
];
const iconArtDefaults: Record<string, string> = { Wrench: "crafts", Stethoscope: "clinics", FlaskConical: "labs", Pill: "pharmacy", Store: "shops", Utensils: "food", GraduationCap: "teachers", HandHeart: "charities", Grid2X2: "other", Printer: "printing", PartyPopper: "events", Truck: "transport", SprayCan: "cleaning", Scale: "law", Smartphone: "tech", Scissors: "beauty" };
/** Resolves the 3D symbol id a section renders: the stored choice first, then the icon's default. */
export function categoryArt(category: Pick<CategoryRecord, "icon" | "art">): string {
  if (category.art && categoryArtOptions.some((option) => option.id === category.art)) return category.art;
  return iconArtDefaults[category.icon] ?? "other";
}
export function isPharmacyCategory(categoryId: string, catalog: CategoryRecord[] = initialCategories): boolean {
  if (categoryId === "pharmacies") return true;
  return catalog.find((category) => category.id === categoryId)?.parentId === "pharmacies";
}
export type AreaRecord = { id: string; name: string; sortOrder: number };
export type CompletionStatus = "none" | "requested" | "submitted" | "rejected";
export type ServiceCompletionDraft = {
  name: string;
  category: string;
  area: string;
  address: string;
  phone: string;
  phoneSecondary: string;
  description: string;
  subSpecialties: string[];
  serviceItems: string[];
  emergency: boolean;
  updatedAt?: string;
};
export type ServiceRecord = {
  id: string; name: string; category: string; area: string; address: string; phone: string; phoneSecondary: string;
  description: string; status: string; verified: boolean; featured: boolean; demo: boolean;
  availabilityToken?: string; comments?: ServiceComment[]; weeklyStar?: boolean; emergency: boolean; availableNow: boolean; availableUntil: string | null; workingHours: WorkingHours; serviceItems: string[]; subSpecialties: string[]; /** جدول حصص السنتر التعليمي. */ schedule?: CenterSchedule; neededRank: number; hours: string; menuUrl: string; menuWhatsapp: string; rating: string; reviews: number; createdAt: string;
  completionStatus?: CompletionStatus; completionNote?: string; completionDraft?: ServiceCompletionDraft | null;
  /** عرض/خصم مؤقت (اختياري). */
  offerTitle?: string; offerDetails?: string; offerEndsAt?: string | null;
  /** آخر تأكيد/تحديث للبيانات من المهني. */
  confirmedAt?: string;
  /** رقم إصدار الصورة الشخصية (0 = بدون صورة). */
  photoVersion?: number;
};
/** رابط الصورة الشخصية للمهني أو "" إن لم يرفع صورة. */
export function servicePhotoUrl(service: Pick<ServiceRecord, "id" | "photoVersion">): string {
  return service.photoVersion ? `/api/service-photo/${service.id}?v=${service.photoVersion}` : "";
}
/** رابط الصورة الشخصية لعضو الموقع (تحمل رقم الإصدار لتتجدد فورًا). */
export function memberPhotoUrl(memberId: string, photoVersion: number): string {
  return photoVersion > 0 ? `/api/member-photo/${memberId}?v=${photoVersion}` : "";
}
/** رابط الملف الشخصي العام (يقبل معرّف عضو أو معرّف مهنة). */
export function profileUrl(id: string): string { return `/profile/${encodeURIComponent(id)}`; }
/** أرقام الهاتف فقط بصيغة محلية موحدة للمقارنة (+20 → 0). */
export function phoneDigits(value: string): string {
  const digits = (value || "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
  return digits.startsWith("20") && digits.length === 12 ? `0${digits.slice(2)}` : digits;
}
/** خانات الملف الشخصي الاختيارية (كلها يمكن تركها فارغة). */
export const MEMBER_PROFILE_FIELDS = [
  { key: "jobTitle", label: "المؤهل / الوظيفة", placeholder: "مثال: بكالوريوس تجارة — محاسب", type: "text", max: 120 },
  { key: "email", label: "البريد الإلكتروني", placeholder: "name@example.com", type: "email", max: 160 },
  { key: "birthDate", label: "تاريخ الميلاد", placeholder: "", type: "date", max: 10 },
  { key: "address", label: "العنوان / المنطقة", placeholder: "مثال: جنزور — شارع المدارس", type: "text", max: 200 },
  { key: "whatsapp", label: "رقم واتساب بديل", placeholder: "01xxxxxxxxx", type: "tel", max: 24 },
  { key: "facebook", label: "رابط فيسبوك", placeholder: "https://facebook.com/...", type: "url", max: 300 },
  { key: "bio", label: "نبذة عني", placeholder: "اكتب سطرين عنك، هواياتك، أو ما تحب أن يعرفه أهل جنزور عنك", type: "textarea", max: 600 },
] as const;
export type MemberProfileFieldKey = (typeof MEMBER_PROFILE_FIELDS)[number]["key"];
export type MemberProfileValues = Record<MemberProfileFieldKey, string>;
export const emptyMemberProfile: MemberProfileValues = { jobTitle: "", email: "", birthDate: "", address: "", whatsapp: "", facebook: "", bio: "" };
/** ما يراه أي زائر في صفحة الملف الشخصي (بيانات العضو إن وُجد + مهنه المنشورة بنفس الرقم). */
export type PublicProfile = {
  id: string;
  kind: "member" | "service";
  name: string;
  photoUrl: string;
  phone: string;
  memberSince: string;
  profile: MemberProfileValues;
  services: { id: string; name: string; categoryId: string; categoryName: string; address: string; description: string; photoUrl: string; rating: string; reviews: number; verified: boolean }[];
};
/** الحد الأقصى لملف الصورة الشخصية قبل الضغط في المتصفح. */
export const SERVICE_PHOTO_MAX_FILE = 3 * 1024 * 1024;

/* ===== العروض والخصومات المؤقتة ===== */
export const OFFER_MAX_DAYS = 30;
export type ServiceOffer = { title: string; details: string; endsAt: string };
/** العرض النشط للخدمة (عنوان + تاريخ انتهاء لم يمرّ بعد) أو null. */
export function activeOffer(service: Pick<ServiceRecord, "offerTitle" | "offerDetails" | "offerEndsAt">, now = Date.now()): ServiceOffer | null {
  const title = (service.offerTitle ?? "").trim();
  const endsAt = service.offerEndsAt ?? null;
  if (!title || !endsAt) return null;
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end) || end <= now) return null;
  return { title, details: (service.offerDetails ?? "").trim(), endsAt };
}
/** يتحقق من بيانات العرض المرسلة: عنوان 3–120 حرفًا، تفاصيل حتى 300، مدة 1–30 يومًا. يرجع القيم الجاهزة للحفظ، أو قيمًا فارغة عند الإلغاء (null). */
export function parseServiceOffer(value: unknown, now = Date.now()): { offerTitle: string; offerDetails: string; offerEndsAt: Date | null } {
  if (value === null || value === undefined || value === "" || value === false) return { offerTitle: "", offerDetails: "", offerEndsAt: null };
  if (typeof value !== "object") throw new Error("بيانات العرض غير صحيحة.");
  const record = value as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  if (title.length < 3) throw new Error("اكتب عنوان العرض (٣ أحرف على الأقل)، مثال: خصم ٢٠٪ على التركيب.");
  const details = typeof record.details === "string" ? record.details.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  let days = Number(record.days);
  if (!Number.isFinite(days)) {
    const end = typeof record.endsAt === "string" ? Date.parse(record.endsAt) : Number.NaN;
    if (!Number.isFinite(end)) throw new Error("حدد مدة العرض بالأيام (من ١ إلى ٣٠ يومًا).");
    days = Math.ceil((end - now) / 86_400_000);
  }
  days = Math.round(days);
  if (days < 1 || days > OFFER_MAX_DAYS) throw new Error(`مدة العرض من يوم واحد حتى ${OFFER_MAX_DAYS} يومًا.`);
  const offerEndsAt = new Date(now + days * 86_400_000);
  offerEndsAt.setHours(23, 59, 59, 0);
  return { offerTitle: title, offerDetails: details, offerEndsAt };
}
/** الأيام المتبقية على انتهاء العرض (١ على الأقل ما دام نشطًا). */
export function offerDaysLeft(offer: Pick<ServiceOffer, "endsAt">, now = Date.now()) {
  return Math.max(1, Math.ceil((Date.parse(offer.endsAt) - now) / 86_400_000));
}
/** عدّاد تنازلي للعرض: أيام وساعات (ودقائق في آخر ساعة) مع نص عربي جاهز، و`urgent` في آخر ٢٤ ساعة. */
export function offerTimeLeft(offer: Pick<ServiceOffer, "endsAt">, now = Date.now()): { days: number; hours: number; minutes: number; urgent: boolean; label: string } {
  const left = Math.max(0, Date.parse(offer.endsAt) - now);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const urgent = left < 86_400_000;
  const dayWord = (n: number) => (n === 1 ? "يوم" : n === 2 ? "يومين" : n <= 10 ? `${n} أيام` : `${n} يوم`);
  const hourWord = (n: number) => (n === 1 ? "ساعة" : n === 2 ? "ساعتين" : n <= 10 ? `${n} ساعات` : `${n} ساعة`);
  let label: string;
  if (left === 0) label = "انتهى";
  else if (days === 0 && hours === 0) label = `باقي ${Math.max(1, minutes)} دقيقة`;
  else if (days === 0) label = `باقي ${hourWord(hours)}`;
  else if (hours === 0) label = `باقي ${dayWord(days)}`;
  else label = `باقي ${dayWord(days)} و${hourWord(hours)}`;
  return { days, hours, minutes, urgent, label };
}
/** عرض انتهى مؤخرًا (خلال ١٤ يومًا) وما زال عنوانه محفوظًا — لعرض زر «جدّد العرض» لصاحب الخدمة. */
export function recentlyExpiredOffer(service: Pick<ServiceRecord, "offerTitle" | "offerDetails" | "offerEndsAt">, now = Date.now()): ServiceOffer | null {
  const title = (service.offerTitle ?? "").trim();
  const endsAt = service.offerEndsAt ?? null;
  if (!title || !endsAt) return null;
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end) || end > now || now - end > 14 * 86_400_000) return null;
  return { title, details: (service.offerDetails ?? "").trim(), endsAt };
}
/** الخدمات التي لديها عرض نشط، الأقرب انتهاءً أولًا (ليشعر الزائر بالاستعجال)، والمميزون أولًا عند التساوي. */
export function servicesWithOffers<T extends Pick<ServiceRecord, "offerTitle" | "offerDetails" | "offerEndsAt" | "featured" | "status">>(items: T[], now = Date.now()): T[] {
  return items
    .filter((item) => item.status === "approved" && activeOffer(item, now))
    .sort((a, b) => Date.parse(a.offerEndsAt!) - Date.parse(b.offerEndsAt!) || Number(b.featured) - Number(a.featured));
}

/* ===== تذكير تجديد البيانات ===== */
export const DATA_CONFIRM_MONTHS = 6;
/** عدد الأيام منذ آخر تأكيد/تحديث للبيانات. */
export function daysSinceConfirmed(service: Pick<ServiceRecord, "confirmedAt" | "createdAt">, now = Date.now()) {
  const last = Date.parse(service.confirmedAt || service.createdAt);
  if (!Number.isFinite(last)) return 0;
  return Math.max(0, Math.floor((now - last) / 86_400_000));
}
/** هل مرّ على آخر تحديث أكثر من 6 أشهر (≈ 182 يومًا)؟ */
export function needsDataConfirmation(service: Pick<ServiceRecord, "confirmedAt" | "createdAt">, now = Date.now()) {
  return daysSinceConfirmed(service, now) >= Math.round(DATA_CONFIRM_MONTHS * 30.4);
}

export function missingServiceData(service: ServiceRecord) {
  return [
    !service.address.trim() && "العنوان",
    !service.serviceItems.length && "الخدمات التفصيلية",
    !service.subSpecialties.length && "التخصصات الفرعية",
  ].filter((item): item is string => typeof item === "string");
}

export type TrustBadge = {
  id: "weekly-star" | "complete-profile" | "community-recommended" | "fast-response";
  label: string;
  tone: "emerald" | "amber" | "blue";
};

export function getServiceTrustBadges(
  service: Pick<ServiceRecord, "address" | "description" | "serviceItems" | "subSpecialties" | "rating" | "reviews" | "comments" | "featured" | "verified" | "availableNow" | "availableUntil" | "emergency" | "phoneSecondary">,
  now = Date.now(),
): TrustBadge[] {
  const badges: TrustBadge[] = [];
  if ("weeklyStar" in service && (service as { weeklyStar?: boolean }).weeklyStar) badges.push({ id: "weekly-star", label: "نجم الأسبوع ⭐", tone: "amber" });
  const isComplete = Boolean(service.address?.trim() && service.description?.trim() && service.serviceItems?.length && service.subSpecialties?.length);
  if (isComplete) badges.push({ id: "complete-profile", label: "ملف مكتمل ١٠٠٪", tone: "emerald" });
  const score = Number.parseFloat(service.rating) || 0;
  const positiveComments = service.comments?.filter((item) => item.stars >= 4).length ?? 0;
  if ((score >= 4.5 && (service.reviews || 0) >= 3) || positiveComments >= 2 || (service.featured && service.verified)) {
    badges.push({ id: "community-recommended", label: "موصى به من الأهالي", tone: "amber" });
  }
  if ((now > 0 && isAvailableNow(service, now)) || service.emergency || Boolean(service.phoneSecondary?.trim())) {
    badges.push({ id: "fast-response", label: "استجابة سريعة", tone: "blue" });
  }
  return badges;
}

export type DutyFilter = "all" | "pharmacies" | "clinics" | "emergency";
export type DutyShiftInfo = {
  mode: "night" | "friday" | "day";
  badge: string;
  title: string;
  subtitle: string;
};

export function getDutyShiftInfo(input: Date | number = new Date()): DutyShiftInfo {
  const date = typeof input === "number" ? new Date(input) : input;
  const hour = date.getHours();
  const day = date.getDay();
  if (hour >= 19 || hour < 7) {
    return {
      mode: "night",
      badge: "مناوبة الليل والطوارئ المسائية",
      title: "الصيدليات والعيادات والطوارئ المناوبة الآن",
      subtitle: "قائمة فورية للصيدليات والأطباء وخدمات الطوارئ المتاحة خلال الفترة المسائية والليلية بقرية جنزور",
    };
  }
  if (day === 5) {
    return {
      mode: "friday",
      badge: "مناوبة يوم الجمعة والعطلات",
      title: "الصيدليات والعيادات المناوبة يوم الجمعة",
      subtitle: "تواصل مباشر مع الصيدليات والعيادات وخدمات الطوارئ المتاحة اليوم لخدمة أهالي جنزور",
    };
  }
  return {
    mode: "day",
    badge: "مناوبة وطوارئ على مدار اليوم",
    title: "الصيدليات والعيادات والطوارئ المتاحة الآن",
    subtitle: "وصول سريع للصيدليات والأطباء وخدمات الطوارئ المستعدة لخدمة أهالي جنزور",
  };
}

export function getOnDutyServices(
  services: ServiceRecord[],
  catalog: CategoryRecord[],
  filter: DutyFilter = "all",
  now = Date.now(),
): ServiceRecord[] {
  return services
    .filter((service) => {
      const category = getCategory(service.category, catalog);
      const isPharmacy = isPharmacyCategory(service.category, catalog);
      const isClinicOrLab = category.parentId === "clinics" || category.parentId === "labs";
      const isEmergencyOrAvailable = Boolean(service.emergency) || (now > 0 && isAvailableNow(service, now));
      if (filter === "pharmacies") return isPharmacy;
      if (filter === "clinics") return isClinicOrLab;
      if (filter === "emergency") return isEmergencyOrAvailable;
      return isPharmacy || isClinicOrLab || isEmergencyOrAvailable;
    })
    .sort((a, b) => {
      const aLive = now > 0 && isAvailableNow(a, now) ? 1 : 0;
      const bLive = now > 0 && isAvailableNow(b, now) ? 1 : 0;
      if (bLive !== aLive) return bLive - aLive;
      if (Number(b.emergency) !== Number(a.emergency)) return Number(b.emergency) - Number(a.emergency);
      if (Number(b.featured) !== Number(a.featured)) return Number(b.featured) - Number(a.featured);
      return (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0);
    });
}

export type PublicUtilityContact = {
  id: string;
  name: string;
  number: string;
  category: string;
  detail: string;
  tone: "red" | "blue" | "amber" | "emerald";
};

export const publicUtilityNumbers: PublicUtilityContact[] = [
  { id: "ambulance", name: "الإسعاف والطوارئ الطبية", number: "123", category: "طوارئ طبية", detail: "للحالات الطبية الطارئة ونقل المرضى على مدار ٢٤ ساعة", tone: "red" },
  { id: "police", name: "شرطة النجدة", number: "122", category: "أمن وبلاغات", detail: "للطوارئ والبلاغات الأمنية العاجلة", tone: "blue" },
  { id: "fire", name: "المطافئ والحماية المدنية", number: "180", category: "إطفاء وإنقاذ", detail: "للحرائق والإنقاذ والحوادث الطارئة", tone: "amber" },
  { id: "electricity-emergency", name: "طوارئ الكهرباء", number: "121", category: "مرافق عامة", detail: "الإبلاغ عن أعطال وانقطاع التيار الكهربائي", tone: "amber" },
  { id: "water-emergency", name: "طوارئ المياه والصرف الصحي", number: "125", category: "مرافق عامة", detail: "بلاغات أعطال وكسور خطوط المياه والصرف", tone: "blue" },
  { id: "gas-emergency", name: "طوارئ الغاز الطبيعي", number: "129", category: "مرافق عامة", detail: "بلاغات تسريب وأعطال الغاز الطبيعي", tone: "red" },
  { id: "health-hotline", name: "وزارة الصحة والرعاية الحرجة", number: "105", category: "خدمات صحية", detail: "الاستفسارات الصحية وتنسيق الرعاية المركزة والحضّانات (137)", tone: "emerald" },
  { id: "cabinet-complaints", name: "شكاوى المرافق والخدمات الحكومية", number: "16528", category: "خدمات عامة", detail: "الخط الساخن لمنظومة الشكاوى الحكومية الموحدة", tone: "emerald" },
  { id: "daleel-office", name: "خدمة دليل جنزور — مكتب الجمال", number: OFFICE_PHONE, category: "إدارة الدليل", detail: "لإضافة أو تحديث أرقام المهنيين والمرافق بقرية جنزور", tone: "blue" },
];

export function sanitizeUtilityNumbers(value: unknown): PublicUtilityContact[] {
  if (!Array.isArray(value)) return publicUtilityNumbers;
  const tones = new Set(["red", "blue", "amber", "emerald"]);
  const cleaned = value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item, index) => {
      const id = typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 60) : `utility-${index + 1}`;
      const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : "";
      const number = typeof item.number === "string" ? item.number.replace(/[^\d+]/g, "").slice(0, 24) : "";
      const category = typeof item.category === "string" && item.category.trim() ? item.category.trim().slice(0, 60) : "مرافق وخدمات";
      const detail = typeof item.detail === "string" ? item.detail.trim().slice(0, 240) : "";
      const tone = (typeof item.tone === "string" && tones.has(item.tone) ? item.tone : "blue") as PublicUtilityContact["tone"];
      return { id, name, number, category, detail, tone };
    })
    .filter((item) => item.name.length >= 2 && item.number.length >= 2);
  return cleaned.length > 0 ? cleaned : publicUtilityNumbers;
}

export type CompletionFieldSuggestions = {
  names: string[];
  addresses: string[];
  descriptions: string[];
  subSpecialties: string[];
  serviceItems: string[];
};

const specialtyServiceItemSuggestions: Record<string, string[]> = {
  plumbing: ["تأسيس سباكة حمام ومطبخ", "صيانة وإصلاح مواتير المياه", "تركيب وصيانة فلاتر المياه", "تركيب سخانات غاز وكهرباء", "كشف وإصلاح تسريبات المياه", "تسليك خطوط الصرف الصحي"],
  electricity: ["تأسيس وتشطيب شبكات الكهرباء", "إصلاح القفلات والأعطال الطارئة", "تركيب لوحات التوزيع والقواطع", "تركيب النجف والكشافات الحديثة", "تمديد كابلات الإنترنت والدش"],
  carpentry: ["تفصيل وتركيب الأبواب والشبابيك", "تصنيع غرف النوم والأطفال", "تفصيل مطابخ خشب عمولة", "صيانة المفصلات والكوالين", "فك وتركيب الأثاث والعفش"],
  metalwork: ["تصنيع وتركيب البوابات الحديد", "أعمال الكريتال والأسوار", "تصنيع التندات والمظلات", "أعمال اللحام الفوري بالمنزل", "حمايات الشبابيك والبلكونات"],
  painting: ["دهانات بلاستيك حديثة للغرف", "تأسيس معجون وتشطيب سوبر لوكس", "معالجة الرطوبة والشروخ", "دهانات أخشاب وأبواب لاكيه وأستر", "ديكورات حوائط وورق حائط"],
  masonry: ["بناء حوائط وتقسيم شقق", "طرطشة ومحارة بالبؤج والأوتار", "ترميم المباني القديمة", "أعمال التشطيبات والمباني"],
  tiles: ["تركيب سيراميك حمامات ومطابخ", "تركيب بورسلين بالليزر والكلبسات", "تركيب رخام وجرانيت للسلالم والمطابخ", "إصلاح وترقيع البلاط والسيراميك"],
  aluminum: ["تفصيل شبابيك وأبواب ألوميتال", "مطابخ ألوميتال وخشمونيوم", "تركيب سلك مانع للحشرات", "صيانة العجل والمفصلات والزجاج"],
  glass: ["قص وتركيب زجاج الشبابيك والأبواب", "تفصيل مرايات حمامات وديكور", "زجاج سيكوريت للواجهات والمحلات", "قرص زجاج للسفرة والركنة"],
  ac: ["شحن فريون وصيانة التكييفات", "فك وتركيب التكييف الاسبليت", "إصلاح الثلاجات والديب فريزر بالمنزل", "صيانة الغسالات الأوتوماتيك والسخانات"],
  mechanics: ["عمرة وصيانة الموتور", "ضبط العفشة والفرامل", "تغيير زيت وفلاتر", "كشف أعطال بالكمبيوتر", "نجدة أعطال سيارات على الطريق"],
  upholstery: ["تنجيد وتجديد الانتريهات والركن", "تفصيل ستائر وبراقع حديثة", "تغيير قماش وسفنج عالي الكثافة", "تنجيد مراتب ومجالس عربي"],
  family: ["كشف باطنة وجهاز هضمي", "متابعة الضغط والسكر والأمراض المزمنة", "كشف منزلي للحالات الطارئة وكبار السن", "استشارات طبية شاملة للأسرة"],
  pediatrics: ["كشف ومتابعة حديثي الولادة والرضع", "علاج نزلات البرد وحساسية الصدر", "جلسات بخار وقياس الصفراء", "متابعة النمو والتغذية والتطعيمات"],
  dentistry: ["حشو عصب وعلاج الجذور", "تركيبات ثابتة زيركون وبورسلين", "حشو تجميلي بالليزر وتبييض الأسنان", "خلع عادي وجراحي للضروس", "علاج ومتابعة أسنان الأطفال"],
  gynecology: ["متابعة الحمل بالسونار رباعي الأبعاد", "علاج تأخر الإنجاب وتنظيم الأسرة", "عمليات الولادة الطبيعية والقيصرية", "الكشف المبكر ومتابعة صحة المرأة"],
  orthopedics: ["علاج كسور العظام والجبس", "علاج خشونة الركبة والمفاصل", "علاج آلام العمود الفقري والغضروف", "إصابات الملاعب والتمزقات العضلية"],
  dermatology: ["علاج الحساسية والأكزيما وحب الشباب", "جلسات ليزر وعناية بالبشرة", "علاج تساقط الشعر ومشاكل فروة الرأس", "إزالة الزوائد الجلدية والسنط"],
  ophthalmology: ["فحص النظر ومقاس النظارات", "فحص قاع العين وضغط العين", "متابعة المياه البيضاء والزرقاء", "علاج حساسية وجفاف العين"],
  ent: ["علاج التهابات الأذن والجيوب الأنفية", "غسيل الأذن واختبار السمع", "علاج حساسية الأنف والتهاب اللوزتين", "متابعة مشاكل الحنجرة والأحبال الصوتية"],
  physiotherapy: ["تأهيل ما بعد الكسور والعمليات", "جلسات علاج طبيعي للعمود الفقري", "تأهيل حالات الجلطات والشلل", "جلسات علاج طبيعي منزلية"],
  "medical-labs": ["صورة دم كاملة وتحاليل شاملة", "تحليل سكر تراكمي ودهون ثلاثية", "وظائف كبد وكلى وغدة درقية", "خدمة سحب العينات من المنازل بجنزور", "إرسال نتائج التحاليل عبر واتساب"],
  groceries: ["جميع السلع الغذائية والتموينية", "ألبان وأجبان طازجة يوميًا", "عطارة وبقوليات ومنظفات", "خدمة توصيل الطلبات للمنازل"],
  pharmacies: ["صرف جميع الأدوية والروشتات الطبية", "قياس الضغط والسكر والوزن", "مستلزمات العناية بالطفل والأم", "خدمة توصيل الأدوية للمنازل بجنزور", "مناوبة واستفسارات دوائية على واتساب"],
  clothing: ["ملابس كاجوال وكلاسيك", "ملابس أطفال وحديثي الولادة", "عبايات وملابس حريمي", "أحذية وشنط ومستلزمات العروسة"],
  stationery: ["جميع الأدوات المدرسية والمكتبية", "تصوير وطباعة الأوراق والمذكرات", "تغليف حراري وسلك للكتب", "هدايا وألعاب أطفال"],
  appliances: ["أجهزة كهربائية منزلية بالضمان", "شاشات ومراوح وخلاطات ومكاوي", "تجهيز العرائس بأفضل الأسعار", "خدمة التوصيل والتركيب"],
  food: ["وجبات سريعة وساندوتشات طازجة", "مشويات وطواجن ومأكولات بيتي", "مخبوزات وفطير وحلويات شرقية", "خدمة التوصيل السريع داخل جنزور"],
  "mobile-shops": ["بيع الهواتف الذكية والإكسسوارات", "صيانة الشاشات والبطاريات والسوفت وير", "شحن رصيد ودفع فواتير وتحويل كاش", "صيانة الكمبيوتر واللابتوب"],
  arabic: ["تأسيس القراءة والكتابة والإملاء", "شرح مبسط للنحو والبلاغة", "مراجعات نهائية وامتحانات دورية", "متابعة مستمرة لمستوى الطالب مع ولي الأمر"],
  english: ["تأسيس فونكس وقواعد اللغة الإنجليزية", "تنمية مهارات المحادثة والاستماع", "شرح المناهج الدراسية لكل المراحل", "مراجعات واختبارات دورية"],
  math: ["تأسيس الحساب والرياضيات والماث", "تبسيط الجبر والهندسة وحل المسائل", "تدريب مكثف على نماذج الامتحانات", "متابعة فردية لمستوى الطالب"],
  science: ["شرح مبسط للعلوم والفيزياء والكيمياء والأحياء", "تجارب وتطبيقات عملية لتثبيت المعلومة", "مراجعات شاملة وحل بنوك الأسئلة"],
  "social-studies": ["شرح التاريخ والجغرافيا بالخرائط الذهنية", "مراجعات شاملة وتلخيصات مبسطة", "تدريب على أسئلة الخرائط والمفاهيم"],
  law: ["استشارات قانونية وصياغة العقود", "قضايا الأسرة والأحوال الشخصية والمواريث", "قضايا مدنية وجنائية وإجراءات الشهر العقاري"],
  transport: ["توصيل مشاوير خاصة داخل وخارج جنزور", "نقل عفش وبضائع بسيارات مجهزة", "التزام تام بالمواعيد وأسعار مناسبة للأهالي"],
  cameras: ["تركيب وصيانة كاميرات المراقبة", "برمجة المتابعة من الموبايل عن بعد", "تركيب شبكات الإنترنت والراوتر والدش"],
  solar: ["توريد وتركيب ألواح الطاقة الشمسية", "أنظمة طاقة شمسية للمنازل والمزارع", "صيانة الانفرتر والبطاريات"],
  cleaning: ["تنظيف شامل للمنازل والشقق", "غسيل السجاد والانتريهات بالبخار", "مكافحة ورش الحشرات بمواد آمنة"],
};

export const HOME_DELIVERY_TAG = "خدمة التوصيل للمنازل بجنزور";
const homeDeliveryRegex = /توصيل|دليفري|للمنازل|من المنازل|من المنزل|بالمنزل|منزلي|منزليه|زياره منزليه|كشف منزلي|سحب عينات من المنزل|لباب البيت/;

export function supportsHomeDelivery(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties" | "category">,
): boolean {
  if (["transport", "moving", "freight", "rides"].includes(service.category)) return true;
  const haystack = normalizeSearch(
    `${service.name} ${service.description} ${(service.serviceItems ?? []).join(" ")} ${(service.subSpecialties ?? []).join(" ")}`,
  );
  return homeDeliveryRegex.test(haystack);
}

export type ClinicBookingFilter = "all" | "appointment" | "walk-in" | "open-today";
export type ClinicBookingMode = "appointment" | "walk-in" | "both";
export const CLINIC_APPOINTMENT_TAG = "الكشف بالحجز المسبق";
export const CLINIC_WALKIN_TAG = "الكشف بأسبقية الحضور";

const clinicAppointmentRegex = /حجز مسبق|بالحجز|حجز موعد|لحجز موعد|بحجز|حجز تليفون|حجز بالهاتف|حجز واتساب/;
const clinicWalkInRegex = /باسبقيه الحضور|اسبقيه الحضور|بدون حجز|حضور مباشر|دخول مباشر|اسبقيه الحجز/;

export function getClinicBookingMode(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties">,
): ClinicBookingMode {
  const haystack = normalizeSearch(
    `${service.name} ${service.description} ${(service.serviceItems ?? []).join(" ")} ${(service.subSpecialties ?? []).join(" ")}`,
  );
  const hasAppointment = clinicAppointmentRegex.test(haystack);
  const hasWalkIn = clinicWalkInRegex.test(haystack);
  if (hasAppointment && hasWalkIn) return "both";
  if (hasWalkIn) return "walk-in";
  if (hasAppointment || haystack.includes("حجز")) return "appointment";
  return "walk-in";
}

export function getClinicBookingLabel(mode: ClinicBookingMode): string {
  if (mode === "both") return "حجز مسبق أو بأسبقية الحضور";
  if (mode === "appointment") return "حجز مسبق";
  return "بأسبقية الحضور";
}

function formatHour12Ar(time24: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time24);
  if (!match) return time24;
  const h24 = Number(match[1]);
  const mins = match[2];
  const period = h24 >= 12 ? "م" : "ص";
  const h12 = h24 % 12 || 12;
  return mins === "00" ? `${h12} ${period}` : `${h12}:${mins} ${period}`;
}

export type ClinicScheduleSummary = {
  daysText: string;
  todayHoursText: string;
  isOpenToday: boolean;
};

export function getClinicScheduleSummary(
  service: Pick<ServiceRecord, "description" | "serviceItems" | "subSpecialties"> & { workingHours?: WorkingHours | null },
  now = Date.now(),
): ClinicScheduleSummary {
  const date = new Date(now);
  const todayIdx = date.getDay(); // 0 = Sunday .. 6 = Saturday
  const wh = service.workingHours;

  if (Array.isArray(wh) && wh.length === 7) {
    const openDays = WEEK_DAYS.filter((_, idx) => !wh[idx]?.closed);
    const closedDays = WEEK_DAYS.filter((_, idx) => Boolean(wh[idx]?.closed));
    const todaySlot = wh[todayIdx];
    const isOpenToday = Boolean(todaySlot && !todaySlot.closed);
    const todayHoursText = isOpenToday && todaySlot
      ? `مواعيد اليوم (${WEEK_DAYS[todayIdx]}): ${formatHour12Ar(todaySlot.opens)} – ${formatHour12Ar(todaySlot.closes)}`
      : `إجازة اليوم (${WEEK_DAYS[todayIdx]})`;

    let daysText = "يرجى الاتصال لمعرفة المواعيد";
    if (openDays.length === 7) {
      daysText = "متواجد يومياً طوال الأسبوع";
    } else if (openDays.length === 6 && closedDays.length === 1) {
      daysText = `يومياً عدا ${closedDays[0]}`;
    } else if (openDays.length > 0) {
      daysText = `أيام التواجد: ${openDays.join(" • ")}`;
    }
    return { daysText, todayHoursText, isOpenToday };
  }

  const haystack = normalizeSearch(
    `${service.description} ${(service.serviceItems ?? []).join(" ")} ${(service.subSpecialties ?? []).join(" ")}`,
  );
  const mentionedDays = WEEK_DAYS.filter((day) => haystack.includes(normalizeSearch(day)));
  if (mentionedDays.length > 0 && mentionedDays.length < 7) {
    const isOpenToday = mentionedDays.includes(WEEK_DAYS[todayIdx]);
    return {
      daysText: `أيام التواجد: ${mentionedDays.join(" • ")}`,
      todayHoursText: isOpenToday ? `متاح اليوم (${WEEK_DAYS[todayIdx]})` : `غير متواجد اليوم (${WEEK_DAYS[todayIdx]})`,
      isOpenToday,
    };
  }

  const isFriday = todayIdx === 5;
  return {
    daysText: "يومياً عدا الجمعة (تواصل لتأكيد الموعد)",
    todayHoursText: isFriday ? "الجمعة (يرجى الاتصال للتأكد)" : `متاح اليوم (${WEEK_DAYS[todayIdx]})`,
    isOpenToday: !isFriday,
  };
}

export function matchesClinicFilter(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties" | "availableNow" | "availableUntil"> & { workingHours?: WorkingHours | null },
  filter: ClinicBookingFilter,
  now = Date.now(),
): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "open-today") {
    return isAvailableNow(service, now) || getClinicScheduleSummary(service, now).isOpenToday;
  }
  const mode = getClinicBookingMode(service);
  if (filter === "appointment") return mode === "appointment" || mode === "both";
  if (filter === "walk-in") return mode === "walk-in" || mode === "both";
  return true;
}

export type ShopCatalogItem = {
  raw: string;
  name: string;
  price: string | null;
};

export const shopSampleMenuItems: Record<string, string[]> = {
  groceries: [
    "كرتونة بيض طازج — بسعر اليوم",
    "جبنة قريش وجبنة ثلاجة طازجة",
    "لبن جاموسي وبقري طازج يومياً",
    "شنطة خزين البيت (أرز • مكرونة • زيت • سكر)",
  ],
  pharmacies: [
    "صرف الروشتات الطبية وبدائل الأدوية",
    "قياس الضغط والسكر بالصيدلية",
    "ألبان ومستلزمات العناية بالطفل",
    "أدوية الطوارئ والمسكنات والفيتامينات",
  ],
  clothing: [
    "تشكيلة ملابس كاجوال وخروج حديثة",
    "ملابس أطفال وحديثي الولادة",
    "عبايات بيتي وخروج بأسعار مميزة",
    "أحذية وشنط ومستلزمات العرائس",
  ],
  stationery: [
    "تصوير وطباعة المذكرات والأوراق",
    "تشكيلة كشاكيل وأقلام وأدوات مدرسية",
    "تغليف حراري وتكعيب سلك للكتب",
    "هدايا وألعاب أطفال تعليمية",
  ],
  appliances: [
    "مراوح وشاشات وأجهزة منزلية بالضمان",
    "خلاطات ومكاوي وغلايات كهربائية",
    "عروض خاصة لتجهيز العرائس بجنزور",
    "توصيل وتركيب الأجهزة للمنزل",
  ],
  food: [
    "وجبات سريعة وساندوتشات طازجة",
    "مشويات وطواجن ومأكولات بيتي",
    "فطير مشلتت ومخبوزات وحلويات",
    "وجبات عائلية مع توصيل سريع بجنزور",
  ],
  "mobile-shops": [
    "إكسسوارات موبايل (جرابات • اسكرينة • شواحن أصلية)",
    "تغيير شاشات وبطاريات وصيانة فورية",
    "تحويل فودافون كاش وشحن رصيد وفواتير",
    "سماعات أيربودز وكابلات أصلية بالضمان",
  ],
};

export function parseShopItemString(rawItem: string): ShopCatalogItem {
  const cleaned = rawItem.trim();
  const dashSplit = cleaned.split(/\s*(?:—|–|-|:)\s*/);
  if (dashSplit.length >= 2) {
    const possiblePrice = dashSplit[dashSplit.length - 1].trim();
    const itemName = dashSplit.slice(0, -1).join(" - ").trim();
    if (itemName && (/\d|ج\.?م|جنيه|سعر|عرض/.test(possiblePrice) || possiblePrice.length <= 24)) {
      return { raw: cleaned, name: itemName, price: possiblePrice };
    }
  }
  const priceMatch = /^(.*?)\s+(?:بـ|بسعر)\s+(.+)$/.exec(cleaned);
  if (priceMatch && priceMatch[1].trim() && priceMatch[2].trim()) {
    return { raw: cleaned, name: priceMatch[1].trim(), price: priceMatch[2].trim() };
  }
  return { raw: cleaned, name: cleaned, price: null };
}

export function getShopCatalogItems(
  service: Pick<ServiceRecord, "category" | "serviceItems">,
): ShopCatalogItem[] {
  const explicitItems = (service.serviceItems ?? [])
    .map((item) => item.trim())
    .filter((item) => item && item !== HOME_DELIVERY_TAG && !/^خدمه التوصيل للمنازل/.test(normalizeSearch(item)));
  const sourceList = explicitItems.length > 0
    ? explicitItems
    : (shopSampleMenuItems[service.category] ?? specialtyServiceItemSuggestions[service.category] ?? []).slice(0, 4);
  return sourceList.slice(0, 8).map(parseShopItemString);
}

export function buildShopWhatsappOrderMessage(
  service: { name: string },
  selectedItems: string[],
  selectedArea = "",
  customNote = "",
  wantsDelivery = false,
): string {
  const cleanItems = selectedItems.map((item) => item.trim()).filter(Boolean);
  const lines: string[] = [
    `مرحبًا ${service.name}، وصلت إليك من دليل جنزور.`,
  ];
  if (cleanItems.length > 0) {
    lines.push("أرغب في طلب / الاستفسار عن الأصناف التالية:");
    for (const item of cleanItems) {
      lines.push(`• ${item}`);
    }
  } else {
    lines.push("أرغب في الاستفسار عن الأصناف والأسعار المتاحة لديكم.");
  }
  if (selectedArea.trim()) {
    lines.push(`📍 العنوان: ${selectedArea.trim()}`);
  }
  if (wantsDelivery) {
    lines.push("🛵 التوصيل: مطلوب توصيل الطلب للمنزل");
  }
  if (customNote.trim()) {
    lines.push(`📝 ملاحظة: ${customNote.trim()}`);
  }
  lines.push("هل الطلب متاح حالياً؟");
  return lines.join("\n");
}

export function parseAnnouncementItems(
  design: Pick<DesignSettings, "announcementText" | "announcementItems">,
): string[] {
  const raw = (design.announcementItems || "").trim();
  const list = raw
    .split(/\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (list.length > 0) return list;
  return design.announcementText?.trim() ? [design.announcementText.trim()] : [];
}

/** أسماء الألوان المسموح بها في بداية خبر الشريط: `[أحمر] عاجل: …` — قيم مقروءة على الخلفيات الداكنة والفاتحة. */
export const TICKER_COLOR_NAMES: Record<string, string> = {
  "أحمر": "#ff6b6b", "أصفر": "#ffe066", "ذهبي": "#fbbf24", "برتقالي": "#fb923c", "أخضر": "#4ade80", "أزرق": "#60a5fa",
  "سماوي": "#67e8f9", "بنفسجي": "#c084fc", "وردي": "#f9a8d4", "أبيض": "#ffffff", "رمادي": "#cbd5e1", "كحلي": "#0f2340", "أسود": "#111111",
};
export type TickerSegment = { text: string; highlight: boolean };
export type TickerItem = { color: string; segments: TickerSegment[]; plain: string };
/**
 * يحلّل نص خبر واحد في الشريط المتحرك:
 * - `[أحمر] …` أو `[#ff0000] …` في البداية = لون الخبر كله (يُحذف الرمز من النص).
 * - `**كلمة**` = كلمة مميزة بلون الإبراز.
 */
export function parseTickerItem(raw: string): TickerItem {
  let text = String(raw ?? "").trim();
  let color = "";
  const token = /^\[\s*([^\]]{1,24}?)\s*\]\s*/.exec(text);
  if (token) {
    const name = token[1].trim();
    const hex = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(name) ? name : "";
    const named = TICKER_COLOR_NAMES[name] || TICKER_COLOR_NAMES[name.replace(/^ال/, "")] || "";
    if (hex || named) { color = hex || named; text = text.slice(token[0].length); }
  }
  const segments: TickerSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0; let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), highlight: false });
    segments.push({ text: match[1], highlight: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), highlight: false });
  if (segments.length === 0) segments.push({ text, highlight: false });
  return { color, segments, plain: segments.map((segment) => segment.text).join("") };
}

export function getCompletionFieldSuggestions(
  categoryId: string,
  catalog: CategoryRecord[] = initialCategories,
  providerName = "",
  areaName = "",
): CompletionFieldSuggestions {
  const category = getCategory(categoryId, catalog);
  const specName = category.name !== "خدمة" ? category.name : "الخدمات المهنية";
  const baseName = providerName.trim() || "مقدم الخدمة";
  const areaPrefix = areaName && areaName !== OTHER_ADDRESS ? `${areaName} — ` : "جنزور — ";

  const names = category.parentId === "clinics"
    ? [`عيادة د. ${baseName} (${specName})`, `مركز د. ${baseName} التخصصي`, `د. ${baseName} — أخصائي ${specName}`]
    : category.id === "pharmacies" || category.parentId === "pharmacies"
      ? [`صيدلية د. ${baseName}`, `صيدلية ${baseName} — خدمة التوصيل بجنزور`]
      : category.parentId === "labs"
        ? [`معمل ${baseName} للتحاليل الطبية`, `معمل د. ${baseName} بجنزور`]
        : category.parentId === "teachers"
          ? [`أ. ${baseName} — مدرس ${specName}`, `سنتر أ. ${baseName} لتدريس ${specName}`]
          : category.parentId === "shops"
            ? [`${baseName} (${specName})`, `معرض ومحل ${baseName} بجنزور`]
            : [`${baseName} — فني ${specName}`, `المعلم ${baseName} لأعمال ${specName}`, `ورشة ${baseName} (${specName})`];

  const addresses = [
    `${areaPrefix}الشارع الرئيسي وسط البلد`,
    `${areaPrefix}بجوار المسجد الكبير بجنزور`,
    `${areaPrefix}أمام الوحدة الصحية بجنزور`,
    `${areaPrefix}بجوار المزلقان وموقف السيارات`,
    `${areaPrefix}بجوار مجمع المدارس`,
    `${areaPrefix}بجوار مكتبة الجمال`,
  ];

  const descriptions = [
    `نقدم خدمات ${specName} لأهالي قرية جنزور والمناطق المجاورة بدقة عالية ومواعيد منضبطة وأسعار مناسبة للجميع.`,
    `خبرة متميزة في كافة أعمال وخدمات ${specName} مع سرعة الاستجابة والتواصل المباشر عبر الهاتف أو واتساب.`,
    category.parentId === "clinics" || category.parentId === "labs" || category.id === "pharmacies" || category.parentId === "pharmacies"
      ? `رعاية طبية متكاملة في ${specName} بأحدث الأجهزة، مع إمكانية الحجز والاستفسار المسبق ومتابعة الحالات الطارئة بجنزور.`
      : `تنفيذ وصيانة جميع أعمال ${specName} بأفضل الخامات، مع المعاينة والمتابعة لخدمة أهالي قرية جنزور.`,
  ];

  const rawKeywords = specialtySynonyms[categoryId] ?? [];
  const isTeacher = category.parentId === "teachers" || category.id === "teachers";
  const isClinic = category.parentId === "clinics" || category.id === "clinics";
  const isShop = category.parentId === "shops" || category.id === "shops";
  const subSpecialties = isTeacher
    ? [...TEACHER_STAGES.map((stage) => stage.name), ...(categoryId === TEACHER_CENTER_ID ? teacherSubjects(catalog).map((subject) => subject.name) : rawKeywords.slice(0, 5))]
    : isClinic
      ? [CLINIC_APPOINTMENT_TAG, CLINIC_WALKIN_TAG, "يومياً عدا الجمعة", "السبت والاثنين والأربعاء", "الأحد والثلاثاء والخميس", ...rawKeywords.slice(0, 4)]
      : rawKeywords.length > 0
        ? rawKeywords.slice(0, 7)
        : [`أعمال ${specName} العامة`, `صيانة ومتابعة دورية`, `استشارات ومعاينة`, `طوارئ وخدمة سريعة`];

  const baseItems = isShop && shopSampleMenuItems[categoryId]
    ? [...shopSampleMenuItems[categoryId], ...(specialtyServiceItemSuggestions[categoryId] ?? []).slice(0, 2)]
    : specialtyServiceItemSuggestions[categoryId] ?? [
        `خدمة ${specName} متكاملة`,
        "معاينة واستشارة فنية",
        "صيانة وإصلاح الأعطال",
        "خدمة طوارئ سريعة داخل جنزور",
      ];
  const serviceItems = baseItems.some((item) => item.includes("توصيل") || item.includes("منزل"))
    ? baseItems
    : [...baseItems, HOME_DELIVERY_TAG];

  return { names, addresses, descriptions, subSpecialties, serviceItems };
}

// A provider counts as new in the directory for this many days after it was created.
export const NEW_SERVICE_DAYS = 30;
export function isNewService(service: Pick<ServiceRecord, "createdAt">, now = Date.now()) {
  const age = now - Date.parse(service.createdAt);
  return Number.isFinite(age) && age >= 0 && age < NEW_SERVICE_DAYS * 24 * 60 * 60 * 1000;
}

export type MemberRole = "member" | "moderator";
export type MemberRecord = { id: string; name: string; username: string; phone: string; role: MemberRole; active: boolean; createdAt: string };
export type NotificationRecord = { id: string; type: string; title: string; message: string; entityId: string; read: boolean; createdAt: string };
export type CommunityListingType = "labor" | "property" | "job";
export type CommunityListingRecord = {
  id: string; type: CommunityListingType; title: string; profession: string; description: string;
  phone: string; whatsapp: string; area: string; price: string; status: string; createdAt: string;
};
export type Viewer = { role: "guest" | "member" | "moderator" | "admin"; id?: string; name?: string; username?: string; phone?: string };

export function normalizePhoneForMatch(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  if (digits.startsWith("20") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

export function isServiceOwner(
  service: Pick<ServiceRecord, "id" | "name" | "phone" | "phoneSecondary">,
  viewer: Viewer,
  ownedServiceIds: string[] = [],
): boolean {
  if (ownedServiceIds.includes(service.id)) return true;
  if (!viewer || viewer.role === "guest") return false;
  if (viewer.phone) {
    const viewerPhone = normalizePhoneForMatch(viewer.phone);
    if (viewerPhone.length >= 7) {
      const primary = normalizePhoneForMatch(service.phone || "");
      const secondary = normalizePhoneForMatch(service.phoneSecondary || "");
      if (viewerPhone === primary || (secondary && viewerPhone === secondary)) return true;
    }
  }
  if (viewer.name && service.name) {
    const vName = normalizeSearch(viewer.name.trim());
    const sName = normalizeSearch(service.name.trim());
    if (vName.length >= 3 && vName === sName) return true;
  }
  return false;
}
export type SiteSettings = {
  siteName: string; heroSubtitle: string; heroEyebrow: string; tagline: string;
  benefitsHeading: string; benefitsText: string; contactText: string; copyright: string;
  phone: string; showEmergency: boolean;
  whatsappAlertsNumber: string; whatsappAlertsApiKey: string;
};
export type DesignThemePresetId =
  | "royal-blue"
  | "classic-blue"
  | "emerald"
  | "royal-navy"
  | "warm-gold"
  | "festive"
  | "ramadan"
  | "eid"
  | "schools"
  | "winter-emergency"
  | "sunset-coral"
  | "turquoise-nile"
  | "lavender-soft"
  | "graphite-modern"
  | "olive-country"
  | "vista-aero"
  | "vista-frost"
  | "vista-ultimate"
  | "vista-emerald"
  | "vista-sunset"
  | "vista-violet"
  | "vista-ruby"
  | "vista-gold"
  | "vista-pearl"
  | "vista-midnight"
  | "win11-bloom"
  | "win11-dark"
  | "win11-mica"
  | "win11-sunrise"
  | "win11-glow"
  | "win11-flow"
  | "win11-motion"
  | "win11-sunset"
  | "win11-graphite"
  | "win11-ocean"
  | "win10-blue"
  | "win10-dark"
  | "win10-teal"
  | "win10-purple"
  | "win10-red"
  | "custom";

export type DesignSettings = {
  // 1. Themes & Colors
  themePreset: DesignThemePresetId;
  primaryColor: string;
  pageBgColor: string;
  modalHeaderBg: string;
  buttonColor: string;
  themeMode: "auto" | "light" | "dark";
  // 2. Typography & Alignment
  headingAlign: "center" | "right" | "left";
  cardTextAlign: "center" | "right" | "left";
  noticeAlign: "center" | "right" | "left";
  fontScale: "small" | "normal" | "large" | "xlarge";
  fontWeight: "normal" | "bold" | "extrabold";
  fontFamily: "cairo" | "tajawal" | "almarai" | "readex";
  sectionHeadingStyle:
    | "plain"
    | "clean"
    | "pill"
    | "pill-badge"
    | "underline"
    | "framed"
    | "boxed"
    | "right-bar"
    | "sky-gradient"
    | "royal-ribbon"
    | "neon-border"
    | "double-frame"
    | "glass-card"
    | "3d-banner"
    | "neon-glow"
    | "glass-3d"
    | "gold-crest"
    | "ribbon-banner"
    | "side-blade"
    | "floating-capsule"
    | "double-royal";
  // 3. Cards, Frames & Borders
  borderWidth: "none" | "thin" | "medium" | "double";
  borderColor: string;
  cardBgColor: string;
  cardRadius: "sharp" | "medium" | "rounded" | "pill";
  cardShadow: "none" | "soft" | "elevated-3d";
  // 4. Buttons Style
  buttonShape:
    | "pill"
    | "rounded"
    | "square"
    | "sharp"
    | "soft-square"
    | "soft-arch"
    | "cut-corner"
    | "leaf"
    | "capsule-3d"
    | "capsule-wide"
    | "bevel";
  buttonEffect:
    | "gradient"
    | "gradient-flow"
    | "glow"
    | "solid"
    | "flat"
    | "outline"
    | "3d"
    | "3d-press"
    | "lift"
    | "pulse"
    | "ripple-shine"
    | "glass-glow"
    | "neon-border"
    | "metallic-shine"
    | "double-ring"
    | "soft-pulse"
    | "cyber-gradient";
  buttonAlign: "center" | "right" | "full";
  // 5. Icons & Layout Structure
  iconStyle: "3d" | "flat" | "glow";
  iconSize: "small" | "medium" | "large";
  iconPosition: "top-center" | "left" | "right";
  mobileColumns: "2" | "3";
  desktopColumns: "3" | "4";
  sectionOrder: string;
  showHero: boolean;
  showFeatureCards: boolean;
  showFeaturedSection: boolean;
  /** صف «عروض الأسبوع» (الخدمات التي لديها عرض نشط) في الصفحة الرئيسية. */
  showOffersSection: boolean;
  showCategoriesSection: boolean;
  showAddProfessionBanner: boolean;
  featuredDefaultOpen: boolean;
  // 6. Header, Footer & Splash
  headerSticky: boolean;
  headerBgColor: string;
  headerLogoUrl: string;
  showHeaderBell: boolean;
  showHeaderFavorites: boolean;
  showHeaderDarkToggle: boolean;
  showHeaderLoginBtn: boolean;
  footerBgColor: string;
  showFooterWhatsapp: boolean;
  splashEnabled: boolean;
  splashImageUrl: string;
  splashDuration: "900" | "1500" | "2500";
  /** لمن تظهر شاشة البداية: التطبيق المثبّت على الهاتف فقط، أو كل الزوار (مرة في الجلسة). */
  splashAudience: "installed" | "all";
  /** الملصقات 3D تتجمع حول الشعار في شاشة البداية. */
  splashStickers: boolean;
  // 7. Login & Register Customizer
  authShowBanner: boolean;
  /** بانر شاشة الدخول (فارغ = البانر الافتراضي المصمم للتطبيق). */
  authBannerImage: string;
  /** نسخة الوضع الداكن من بانر الدخول (فارغ = يُشتق تلقائيًا: المخصص الفاتح أو الافتراضي الليلي). */
  authBannerImageDark: string;
  /** بانر شاشة العضوية (فارغ = بانر الدخول المخصص إن وُجد، وإلا الافتراضي الخاص بالعضوية). */
  registerBannerImage: string;
  /** نسخة الوضع الداكن من بانر العضوية. */
  registerBannerImageDark: string;
  /** صورة البانر الترحيبي أعلى الرئيسية (فارغ = صورة سماء جنزور الافتراضية). */
  heroBannerImage: string;
  /** نسخة الوضع الداكن من البانر الترحيبي (فارغ = المخصص الفاتح إن وُجد، وإلا النسخة الليلية الافتراضية). */
  heroBannerImageDark: string;
  /** درجة تعتيم طبقة فوق صورة البانر الترحيبي (0 = بلا تعتيم … 80%). */
  heroBannerOverlay: number;
  /** إظهار اسم الدليل وسطر ترحيبي أبيض فوق صورة البانر. */
  heroBannerText: boolean;
  /** ارتفاع البانر: auto = النسبة الطبيعية للصورة؛ غير ذلك ارتفاع ثابت مع قصّ/احتواء. */
  heroBannerHeight: "auto" | "small" | "medium" | "large";
  heroBannerFit: "cover" | "contain";
  /** استدارة زوايا عناصر ثيمات Windows 10 بالبكسل. */
  win10Radius: "0" | "2" | "6" | "12";
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  authFieldsLayout: "two-col" | "one-col";
  authInputBorderColor: string;
  // 8. Additional Components: Top Announcement Bar, Hero & Search, Provider Cards, Spacing & Dividers
  announcementEnabled: boolean;
  announcementText: string;
  announcementBgColor: string;
  announcementBgColorLight: string;
  /** لون نص الشريط المتحرك في الوضع الليلي (فارغ = تلقائي أبيض). */
  announcementTextColor: string;
  /** لون نص الشريط المتحرك في الوضع النهاري (فارغ = تلقائي: أبيض على خلفية داكنة أو كحلي على فاتحة). */
  announcementTextColorLight: string;
  /** لون إبراز الكلمات المكتوبة بين **نجمتين** داخل الشريط (فارغ = تلقائي أصفر ذهبي). */
  announcementHighlightColor: string;
  announcementStyle: "static" | "badge" | "soft";
  heroStyle: "sky-banner" | "gradient-card" | "compact-minimal";
  searchBoxStyle: "rounded" | "pill" | "floating-glass";
  providerCardLayout: "classic" | "compact" | "centered";
  showProviderBadges: boolean;
  showProviderShareBtn: boolean;
  tapFeedback: "off" | "haptic" | "sound" | "both";
  providerEdgeTools: string;
  providerEdgeToolsPosition: "left" | "right" | "bottom";
  showTopProfessions: boolean;
  topProfessionsPinned: string;
  showWeeklyStars: boolean;
  specialtyArt3d: boolean;
  /** أيقونات «الملصقات 3D» (الجاهزة + المرفوعة من الإدارة) بدل الرسم اليدوي حيثما توفرت. */
  specialtyStickerIcons: boolean;
  /** شكل أيقونات التخصصات فقط (الأقسام الرئيسية لا تتأثر): مجسمة 3D (ملصقات/رسم) أو فلات كلاسيكية. */
  specialtyIconStyle: "3d" | "flat";
  powerSaveMode: "auto" | "on" | "off";
  showProviderWhatsappBtn: boolean;
  whatsappButtonColor: string;
  sectionSpacing: "compact" | "normal" | "relaxed";
  cardHoverEffect:
    | "lift"
    | "glow"
    | "scale"
    | "tilt"
    | "tilt-3d"
    | "float-3d"
    | "border-pulse"
    | "neon-sweep"
    | "spring-pop"
    | "shine-glint"
    | "shimmer-sweep"
    | "float-bounce"
    | "neon-aura"
    | "slide-up-glow"
    | "none";
  sectionDividerStyle: "none" | "line" | "dots" | "gradient";
  floatingWhatsappEnabled: boolean;
  // 9. Seasonal Ribbon, Footer & Social Customizer, Mobile Bottom Nav & Community Widgets
  seasonalRibbon: "none" | "ramadan" | "eid" | "schools" | "winter";
  footerDescription: string;
  footerFacebookUrl: string;
  footerWhatsappGroupUrl: string;
  showFooterStats: boolean;
  mobileBottomNavEnabled: boolean;
  showPrayerWeatherBar: boolean;
  showTransitGuide: boolean;
  showInstallAppBanner: boolean;
  showAdminQuickEdit: boolean;
  /** Members-only browsing: guests are sent to the registration page before they can open the directory. */
  membershipRequired: boolean;
  // 10. Multi-Item News Ticker & Subtle Background Patterns
  announcementItems: string;
  announcementTickerMode: "single" | "rotate" | "marquee" | "marquee-reverse" | "vertical-slide" | "pulse-glow" | "bounce";
  announcementSpeed:
    | "ultra-slow"
    | "very-slow"
    | "slow"
    | "normal"
    | "medium-fast"
    | "fast"
    | "very-fast"
    | "turbo"
    | "flash";
  headerPattern: "none" | "dots" | "grid" | "islamic" | "waves";
  heroPattern: "none" | "dots" | "grid" | "islamic" | "waves" | "stars";
  patternOpacity: "subtle" | "medium" | "clear";
  // 11. Extended Studio & Site Controls
  prayerCardStyle: "dark-sky" | "royal-navy" | "emerald";
  prayerDefaultOpen: boolean;
  categorySearchDefaultOpen: boolean;
  showCategoryCounts: boolean;
  providerCallStripStyle: "sky" | "emerald" | "solid-blue";
  cardAnimationSpeed: "ultra-slow" | "slow" | "instant" | "fast" | "normal" | "smooth" | "cinematic" | "spring" | "bouncy";
  officeAddress: string;
  officeWorkingHours: string;
  whatsappDefaultGreeting: string;
  allowPublicSubmissions: boolean;
  detailNameBoxColor: string;
  outerCardStyle: "modern" | "bordered" | "soft-gradient";
  searchTriggerStyle: "pill-gradient" | "glass-outline" | "gold-accent";
  badgesDefaultOpen: boolean;
  // 12. Sponsorship & VIP Packages (باقات الرعاية والتميز)
  sponsorModalEnabled: boolean;
  sponsorModalDelaySeconds: number;
  sponsorModalTitle: string;
  sponsorModalSubtitle: string;
  sponsorModalOfferBanner: string;
  sponsorModalPhone: string;
  showDailyOffersSection: boolean;
  showSponsorsRibbon: boolean;
  sponsoredProvidersJson: string;
  // 13. Dark Mode Palette & Shimmer Animations
  darkPageBgColor: string;
  darkCardBgColor: string;
  darkBorderColor: string;
  darkPrimaryColor: string;
  shimmerEffectEnabled: boolean;
};

export type SponsoredProviderConfig = {
  serviceId: string;
  providerName: string;
  categoryName: string;
  phone: string;
  active: boolean;
  planType: "trial-10-days" | "monthly-vip";
  badgeLabel: string;
  dailyOfferTitle: string;
  dailyOfferDiscount: string;
  tickerAdText: string;
  trialStartDate: string;
};

export type SponsorTrialStatus = {
  isTrial: boolean;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  progressPercent: number;
  statusLabel: string;
  endDateFormatted: string;
  tone: "emerald" | "amber" | "red" | "gold";
};

export function getSponsorTrialStatus(
  sponsor: Pick<SponsoredProviderConfig, "planType" | "trialStartDate">,
  nowInput: Date | number = new Date(),
): SponsorTrialStatus {
  const totalDays = 10;
  const nowDate = typeof nowInput === "number" ? new Date(nowInput) : nowInput;
  const nowUtcMidnight = Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  const parts = (sponsor.trialStartDate || "").split("-").map((n) => Number.parseInt(n, 10));
  const startUtcMidnight =
    parts.length === 3 && parts.every((n) => Number.isFinite(n))
      ? Date.UTC(parts[0], parts[1] - 1, parts[2])
      : nowUtcMidnight;

  const endUtc = startUtcMidnight + totalDays * 86_400_000;
  const endDateObj = new Date(endUtc);
  const endDateFormatted = `${endDateObj.getUTCFullYear()}-${String(endDateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(endDateObj.getUTCDate()).padStart(2, "0")}`;

  if (sponsor.planType === "monthly-vip") {
    return {
      isTrial: false,
      totalDays: 30,
      elapsedDays: 0,
      remainingDays: 30,
      isExpired: false,
      isExpiringSoon: false,
      progressPercent: 100,
      statusLabel: "👑 اشتراك باقة التميز VIP مفعل",
      endDateFormatted,
      tone: "gold",
    };
  }

  const rawDiffDays = Math.floor((nowUtcMidnight - startUtcMidnight) / 86_400_000);
  const elapsedDays = Math.max(0, rawDiffDays);
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const isExpired = elapsedDays >= totalDays;
  const isExpiringSoon = !isExpired && remainingDays <= 3;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  let statusLabel = `⏳ التجربة المجانية سارية — متبقي ${remainingDays} أيام من ١٠ (مضى ${elapsedDays} يوم)`;
  let tone: SponsorTrialStatus["tone"] = "emerald";

  if (isExpired) {
    statusLabel = "🚨 انتهت الـ ١٠ أيام المجانية — بانتظار تجديد الاشتراك!";
    tone = "red";
  } else if (isExpiringSoon) {
    statusLabel = `⚠️ قاربت التجربة على الانتهاء — متبقي ${remainingDays} أيام فقط (مضى ${elapsedDays} يوم)`;
    tone = "amber";
  }

  return {
    isTrial: true,
    totalDays,
    elapsedDays,
    remainingDays,
    isExpired,
    isExpiringSoon,
    progressPercent,
    statusLabel,
    endDateFormatted,
    tone,
  };
}

export type DailyOfferFilterGroup = "all" | "clinics" | "labs" | "shops";

export function getSponsorOfferCategoryGroup(
  sponsor: Pick<SponsoredProviderConfig, "serviceId" | "categoryName" | "providerName">,
  services: ServiceRecord[] = [],
  catalog: CategoryRecord[] = initialCategories,
): Exclude<DailyOfferFilterGroup, "all"> {
  const matched = services.find((srv) => srv.id === sponsor.serviceId);
  if (matched) {
    const cat = getCategory(matched.category, catalog);
    const rootId = cat.parentId ?? cat.id;
    if (rootId === "clinics") return "clinics";
    if (rootId === "labs") return "labs";
    if (rootId === "shops") return "shops";
  }
  const text = normalizeSearch(`${sponsor.categoryName} ${sponsor.providerName}`);
  if (/معمل|تحاليل|اشعه|مختبر/.test(text)) return "labs";
  if (/عياد|طبيب|دكتور|د\.|اسنان|اطفال|باطن|نساء|عظام|جلدي|عيون|علاج طبيعي/.test(text)) return "clinics";
  return "shops";
}

export const defaultSponsoredProviders: SponsoredProviderConfig[] = [
  {
    serviceId: "00000000-0000-4000-8000-000000000007",
    providerName: "د. سارة أحمد — عيادة طب الأسرة والباطنة",
    categoryName: "العيادات والأطباء",
    phone: OFFICE_PHONE,
    active: true,
    planType: "trial-10-days",
    badgeLabel: "راعي معتمد 👑",
    dailyOfferTitle: "حجز كشف واستشارة طبية فورية عبر واتساب مع متابعة دورية شاملة لأهالي جنزور",
    dailyOfferDiscount: "حجز مباشر 🩺",
    tickerAdText: "👑 عيادة د. سارة أحمد لطب الأسرة والباطنة — متاح الآن الحجز والاستفسار المباشر عبر دليل قرية جنزور",
    trialStartDate: "2026-10-13",
  },
  {
    serviceId: "sponsor-demo-lab",
    providerName: "معمل التحاليل الطبية الشامل بجنزور (نموذج باقة التميز)",
    categoryName: "معامل التحاليل",
    phone: OFFICE_PHONE,
    active: true,
    planType: "trial-10-days",
    badgeLabel: "راعي معتمد 👑",
    dailyOfferTitle: "خصم ٢٠٪ على باقة الفحص الشامل + خدمة سحب العينات من المنزل وإرسال النتيجة على واتساب",
    dailyOfferDiscount: "خصم ٢٠٪ 🔥",
    tickerAdText: "👑 عرض خاص بمعامل التحاليل المشتركة في باقة التميز: خصومات لأهالي جنزور وسحب عينات من المنزل",
    trialStartDate: "2026-10-13",
  },
  {
    serviceId: "sponsor-demo-shop",
    providerName: "عروض المحلات والسوبر ماركت بجنزور (نموذج باقة التميز)",
    categoryName: "المحلات التجارية",
    phone: OFFICE_PHONE,
    active: true,
    planType: "trial-10-days",
    badgeLabel: "راعي معتمد 👑",
    dailyOfferTitle: "اطلب احتياجات منزلك من المنيو التفاعلي بالأسعار مع توصيل سريع لباب البيت في جنزور",
    dailyOfferDiscount: "توصيل مجاني 🛵",
    tickerAdText: "👑 انضم الآن لباقة الرعاية والتميز للعيادات والمعامل والمحلات بقرية جنزور — ١٠ أيام تجربة مجانية كاملة!",
    trialStartDate: "2026-10-13",
  },
];

export function parseSponsoredProviders(jsonText: string | undefined | null): SponsoredProviderConfig[] {
  if (!jsonText || !jsonText.trim()) return defaultSponsoredProviders;
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return defaultSponsoredProviders;
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        serviceId: typeof item.serviceId === "string" ? item.serviceId.trim() : "",
        providerName: typeof item.providerName === "string" ? item.providerName.trim().slice(0, 140) : "",
        categoryName: typeof item.categoryName === "string" ? item.categoryName.trim().slice(0, 80) : "العيادات والمعامل والمحلات",
        phone: typeof item.phone === "string" && item.phone.trim() ? item.phone.trim().slice(0, 30) : OFFICE_PHONE,
        active: typeof item.active === "boolean" ? item.active : true,
        planType: item.planType === "monthly-vip" ? ("monthly-vip" as const) : ("trial-10-days" as const),
        badgeLabel: typeof item.badgeLabel === "string" && item.badgeLabel.trim() ? item.badgeLabel.trim().slice(0, 60) : "راعي معتمد 👑",
        dailyOfferTitle: typeof item.dailyOfferTitle === "string" ? item.dailyOfferTitle.trim().slice(0, 260) : "",
        dailyOfferDiscount: typeof item.dailyOfferDiscount === "string" ? item.dailyOfferDiscount.trim().slice(0, 50) : "عرض مميز 🔥",
        tickerAdText: typeof item.tickerAdText === "string" ? item.tickerAdText.trim().slice(0, 260) : "",
        trialStartDate: typeof item.trialStartDate === "string" ? item.trialStartDate.trim().slice(0, 30) : "2026-10-13",
      }))
      .filter((item) => Boolean(item.serviceId || item.providerName));
  } catch {
    return defaultSponsoredProviders;
  }
}

export const defaultDesignSettings: DesignSettings = {
  themePreset: "royal-blue",
  primaryColor: "#095de2",
  pageBgColor: "#edf7ff",
  modalHeaderBg: "#d7edff",
  buttonColor: "#1079ff",
  themeMode: "auto",
  headingAlign: "right",
  cardTextAlign: "center",
  noticeAlign: "center",
  fontScale: "normal",
  fontWeight: "bold",
  fontFamily: "cairo",
  sectionHeadingStyle: "clean",
  borderWidth: "thin",
  borderColor: "#b8e0ff",
  cardBgColor: "#ffffff",
  cardRadius: "rounded",
  cardShadow: "soft",
  buttonShape: "rounded",
  buttonEffect: "gradient",
  buttonAlign: "center",
  iconStyle: "3d",
  iconSize: "medium",
  iconPosition: "top-center",
  mobileColumns: "2",
  desktopColumns: "4",
  sectionOrder: "hero,features,featured,offers,categories,transit,professionBanner",
  showHero: true,
  showFeatureCards: true,
  showFeaturedSection: true,
  showOffersSection: true,
  showCategoriesSection: true,
  showAddProfessionBanner: true,
  featuredDefaultOpen: false,
  headerSticky: true,
  headerBgColor: "#ffffff",
  headerLogoUrl: "",
  showHeaderBell: true,
  showHeaderFavorites: true,
  showHeaderDarkToggle: true,
  showHeaderLoginBtn: true,
  footerBgColor: "#112b5a",
  showFooterWhatsapp: true,
  splashEnabled: true,
  splashImageUrl: "/images/logo-daleel-transparent.png",
  splashDuration: "900",
  splashAudience: "installed",
  splashStickers: true,
  authShowBanner: true,
  authBannerImage: "",
  authBannerImageDark: "",
  registerBannerImage: "",
  registerBannerImageDark: "",
  heroBannerImage: "",
  heroBannerImageDark: "",
  heroBannerOverlay: 0,
  heroBannerText: false,
  heroBannerHeight: "auto",
  heroBannerFit: "cover",
  win10Radius: "2",
  loginTitle: "دخول الأعضاء وإدارة الموقع",
  loginSubtitle: "للأعضاء المسجلين أو إدارة الموقع",
  registerTitle: "أنشئ حساب عضو جديد",
  registerSubtitle: "عضوية مجانية وسريعة لأهالي قرية جنزور",
  authFieldsLayout: "two-col",
  authInputBorderColor: "#b8e0ff",
  announcementEnabled: true,
  announcementText: "أهلاً بكم في دليل جنزور — أضف مهنتك مجاناً وتواصل مع أهل القرية مباشرة",
  announcementBgColor: "#0f4ebe",
  announcementBgColorLight: "#0b4a93",
  announcementTextColor: "",
  announcementTextColorLight: "",
  announcementHighlightColor: "",
  announcementStyle: "badge",
  heroStyle: "sky-banner",
  searchBoxStyle: "rounded",
  providerCardLayout: "classic",
  showProviderBadges: true,
  showProviderShareBtn: true,
  tapFeedback: "both",
  providerEdgeTools: "call,whatsapp,share,favorite",
  providerEdgeToolsPosition: "left",
  showTopProfessions: false,
  topProfessionsPinned: "",
  showWeeklyStars: true,
  specialtyArt3d: true,
  specialtyStickerIcons: true,
  specialtyIconStyle: "3d",
  powerSaveMode: "auto",
  showProviderWhatsappBtn: true,
  whatsappButtonColor: "#1fa855",
  sectionSpacing: "normal",
  cardHoverEffect: "lift",
  sectionDividerStyle: "none",
  floatingWhatsappEnabled: false,
  seasonalRibbon: "none",
  footerDescription: "دليل المهن والخدمات.. من أهل القرية لأهلها",
  footerFacebookUrl: "",
  footerWhatsappGroupUrl: "",
  showFooterStats: true,
  mobileBottomNavEnabled: false,
  showPrayerWeatherBar: false,
  showTransitGuide: false,
  showInstallAppBanner: true,
  showAdminQuickEdit: false,
  membershipRequired: true,
  announcementItems:
    "📣 لكل أعضاء الدليل: التطبيق لسه في بدايته — أضف مهنتك أو محلك أو عيادتك الآن مجاناً وكن أول من يظهر لأهل القرية\nأهلاً بكم في دليل جنزور — كل خدمات القرية في مكان واحد\nصاحب مهنة؟ اضغط «أضف مهنتك» وهتظهر لكل أهل جنزور بعد مراجعة الإدارة\nالصيدليات والعيادات المناوبة وأرقام الطوارئ متاحة على مدار الساعة",
  announcementTickerMode: "marquee",
  announcementSpeed: "normal",
  headerPattern: "none",
  heroPattern: "none",
  patternOpacity: "subtle",
  prayerCardStyle: "dark-sky",
  prayerDefaultOpen: false,
  categorySearchDefaultOpen: false,
  showCategoryCounts: true,
  providerCallStripStyle: "sky",
  cardAnimationSpeed: "normal",
  officeAddress: "قرية جنزور — مركز بركة السبع — محافظة المنوفية (بجوار مكتبة الجمال)",
  officeWorkingHours: "يومياً من ٩ صباحاً حتى ١١ مساءً",
  whatsappDefaultGreeting: "مرحبًا، وصلت إليك من دليل المهن والخدمات بقرية جنزور.",
  allowPublicSubmissions: true,
  detailNameBoxColor: "#134595",
  outerCardStyle: "modern",
  searchTriggerStyle: "pill-gradient",
  badgesDefaultOpen: false,
  sponsorModalEnabled: false,
  sponsorModalDelaySeconds: 10,
  sponsorModalTitle: "باقات الرعاية والتميز للعيادات والمعامل والمحلات التجارية",
  sponsorModalSubtitle:
    "دليل قرية جنزور خدمة مجانية ١٠٠٪ لوجه الله لجميع المهن والحرفيين والأهالي.. ولضمان استمرار الموقع وتطويره بأعلى جودة، خصصنا (باقة الرعاية والتميز الذهبية) للعيادات والمعامل والمحلات التجارية الراغبة في ظهور استثنائي وخدمات إلكترونية متكاملة.",
  sponsorModalOfferBanner:
    "🎁 عرض خاص لفترة محدودة: تجربة مجانية كاملة لمدة ١٠ أيام للعيادات والمعامل والمحلات التجارية بقرية جنزور — فعّل باقتك الآن وجرّب كل المميزات الذهبية بنفسك أولاً مجاناً وبدون أي التزام!",
  sponsorModalPhone: OFFICE_PHONE,
  showDailyOffersSection: false,
  showSponsorsRibbon: false,
  sponsoredProvidersJson: JSON.stringify(defaultSponsoredProviders),
  darkPageBgColor: "#112b5a",
  darkCardBgColor: "#134595",
  darkBorderColor: "#0f4ebe",
  darkPrimaryColor: "#50b4ff",
  shimmerEffectEnabled: true,
};

export type GradientThemePresetEntry = {
  label: string;
  description: string;
  badge?: string;
  /** ثيم قديم مخفي من استوديو التصميم (يبقى صالحًا لمن اختاره سابقًا). */
  retired?: boolean;
  gradientPreview: string;
  colors: Pick<
    DesignSettings,
    | "primaryColor"
    | "pageBgColor"
    | "modalHeaderBg"
    | "buttonColor"
    | "borderColor"
    | "cardBgColor"
    | "headerBgColor"
    | "footerBgColor"
  >;
  darkColors: Pick<
    DesignSettings,
    "darkPageBgColor" | "darkCardBgColor" | "darkBorderColor" | "darkPrimaryColor" | "announcementBgColor" | "detailNameBoxColor"
  >;
};

export const designThemePresets: Record<Exclude<DesignSettings["themePreset"], "custom">, GradientThemePresetEntry> = {
  "royal-blue": {
    label: "🌌 جريديانت الأزرق الملكي والنيون الليلي",
    badge: "الافتراضي",
    description: "تدرج Royal Blue الفاخر (50–950) المتناغم مع براويز العناوين الرئيسية في الليل والنهار",
    gradientPreview: "linear-gradient(135deg, #112b5a 0%, #095de2 52%, #50b4ff 100%)",
    colors: { primaryColor: "#095de2", pageBgColor: "#edf7ff", modalHeaderBg: "#d7edff", buttonColor: "#1079ff", borderColor: "#b8e0ff", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#112b5a" },
    darkColors: { darkPageBgColor: "#112b5a", darkCardBgColor: "#134595", darkBorderColor: "#0f4ebe", darkPrimaryColor: "#50b4ff", announcementBgColor: "#0f4ebe", detailNameBoxColor: "#134595" },
  },
  "classic-blue": {
    label: "💎 جريديانت السافير والسماوي المضيء",
    badge: "جريديانت",
    description: "تدرج السافير الأزرق مع إطارات عناوين مضيئة وتباين ليلي ونهاري مريح للعين",
    gradientPreview: "linear-gradient(135deg, #08203e 0%, #0878c9 55%, #38bdf8 100%)",
    colors: { primaryColor: "#0878c9", pageBgColor: "#f0f8ff", modalHeaderBg: "#dcecfb", buttonColor: "#0284c7", borderColor: "#bae6fd", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#08203e" },
    darkColors: { darkPageBgColor: "#081b33", darkCardBgColor: "#0f2d52", darkBorderColor: "#0284c7", darkPrimaryColor: "#38bdf8", announcementBgColor: "#0369a1", detailNameBoxColor: "#0f2d52" },
  },
  emerald: {
    label: "❇️ جريديانت الشفق الزمردي والتركواز",
    badge: "جريديانت",
    description: "تدرج الزمرد الملكي والتركواز المشرق لبراويز العناوين والكروت الليلية والنهارية",
    gradientPreview: "linear-gradient(135deg, #022c22 0%, #059669 55%, #34d399 100%)",
    colors: { primaryColor: "#047857", pageBgColor: "#ecfdf5", modalHeaderBg: "#d1fae5", buttonColor: "#059669", borderColor: "#a7f3d0", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#022c22" },
    darkColors: { darkPageBgColor: "#041f18", darkCardBgColor: "#06372a", darkBorderColor: "#059669", darkPrimaryColor: "#34d399", announcementBgColor: "#065f46", detailNameBoxColor: "#064e3b" },
  },
  "royal-navy": {
    retired: true,
    label: "⚡ جريديانت الكوبالت والأزرق الكهربائي",
    badge: "جريديانت",
    description: "تدرج الكحلي الإمبراطوري والأزرق الكهربائي لبراويز عناوين فخمة وعصرية",
    gradientPreview: "linear-gradient(135deg, #090d16 0%, #1d4ed8 52%, #60a5fa 100%)",
    colors: { primaryColor: "#1d4ed8", pageBgColor: "#eff6ff", modalHeaderBg: "#dbeafe", buttonColor: "#2563eb", borderColor: "#bfdbfe", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#0f172a" },
    darkColors: { darkPageBgColor: "#091124", darkCardBgColor: "#132347", darkBorderColor: "#2563eb", darkPrimaryColor: "#60a5fa", announcementBgColor: "#1e40af", detailNameBoxColor: "#172554" },
  },
  "warm-gold": {
    label: "👑 جريديانت الذهب الإمبراطوري والكحلي",
    badge: "جريديانت",
    description: "تدرج الكهرمان الذهبي مع الكحلي الليلي الفاخر لبراويز العناوين والأزرار",
    gradientPreview: "linear-gradient(135deg, #271505 0%, #b45309 52%, #fbbf24 100%)",
    colors: { primaryColor: "#b45309", pageBgColor: "#fffbeb", modalHeaderBg: "#fef3c7", buttonColor: "#d97706", borderColor: "#fde68a", cardBgColor: "#ffffff", headerBgColor: "#fffdf9", footerBgColor: "#271505" },
    darkColors: { darkPageBgColor: "#181006", darkCardBgColor: "#2b1c0b", darkBorderColor: "#d97706", darkPrimaryColor: "#fbbf24", announcementBgColor: "#92400e", detailNameBoxColor: "#451a03" },
  },
  festive: {
    retired: true,
    label: "🔮 جريديانت البنفسجي الكوني والأرجواني",
    badge: "جريديانت",
    description: "تدرج الأميثيست البنفسجي والنيون الأرجواني المتناغم مع الوضع الليلي والنهاري",
    gradientPreview: "linear-gradient(135deg, #170a2e 0%, #6d28d9 52%, #c084fc 100%)",
    colors: { primaryColor: "#6d28d9", pageBgColor: "#f5f3ff", modalHeaderBg: "#ede9fe", buttonColor: "#7c3aed", borderColor: "#ddd6fe", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#170a2e" },
    darkColors: { darkPageBgColor: "#120924", darkCardBgColor: "#241346", darkBorderColor: "#7c3aed", darkPrimaryColor: "#c084fc", announcementBgColor: "#5b21b6", detailNameBoxColor: "#2e1065" },
  },
  ramadan: {
    retired: true,
    label: "🌙 جريديانت الهلال الذهبي والياقوت الليلي",
    badge: "جريديانت",
    description: "تدرج الكحلي الليلي مع الذهب المضيء لبراويز عناوين دافئة وفخمة",
    gradientPreview: "linear-gradient(135deg, #0b192c 0%, #0f3d5e 50%, #f59e0b 100%)",
    colors: { primaryColor: "#b45309", pageBgColor: "#fbf8f1", modalHeaderBg: "#fef3c7", buttonColor: "#0f3d5e", borderColor: "#e8dcc4", cardBgColor: "#ffffff", headerBgColor: "#fffdf8", footerBgColor: "#0c1f33" },
    darkColors: { darkPageBgColor: "#0b192c", darkCardBgColor: "#152c4a", darkBorderColor: "#d97706", darkPrimaryColor: "#fbbf24", announcementBgColor: "#0f3d5e", detailNameBoxColor: "#152c4a" },
  },
  eid: {
    retired: true,
    label: "🌊 جريديانت المحيط الفيروزي واللؤلؤ",
    badge: "جريديانت",
    description: "تدرج الفيروزي المشرق والأكوا المضيء في الوضع الليلي والنهاري",
    gradientPreview: "linear-gradient(135deg, #062826 0%, #0d9488 52%, #2dd4bf 100%)",
    colors: { primaryColor: "#0d9488", pageBgColor: "#f0fdfa", modalHeaderBg: "#ccfbf1", buttonColor: "#0f766e", borderColor: "#99f6e4", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#062826" },
    darkColors: { darkPageBgColor: "#05201f", darkCardBgColor: "#0b3936", darkBorderColor: "#0d9488", darkPrimaryColor: "#2dd4bf", announcementBgColor: "#115e59", detailNameBoxColor: "#134e4a" },
  },
  schools: {
    retired: true,
    label: "✨ جريديانت النيلي والذهبي المتألق",
    badge: "جريديانت",
    description: "تدرج مزدوج بين الأزرق النيلي والكهرمان الذهبي لبراويز عناوين بارزة",
    gradientPreview: "linear-gradient(135deg, #172554 0%, #2563eb 55%, #f59e0b 100%)",
    colors: { primaryColor: "#2563eb", pageBgColor: "#f4f7ff", modalHeaderBg: "#dbeafe", buttonColor: "#d97706", borderColor: "#bfdbfe", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#172554" },
    darkColors: { darkPageBgColor: "#0c1636", darkCardBgColor: "#172554", darkBorderColor: "#3b82f6", darkPrimaryColor: "#fbbf24", announcementBgColor: "#1e3a8a", detailNameBoxColor: "#1e3a8a" },
  },
  "winter-emergency": {
    retired: true,
    label: "❄️ جريديانت الجليد القطبي والياقوت",
    badge: "جريديانت",
    description: "تدرج الأزرق الجليدي العميق مع السماوي القطبي عالي الوضوح",
    gradientPreview: "linear-gradient(135deg, #082032 0%, #0369a1 52%, #38bdf8 100%)",
    colors: { primaryColor: "#0369a1", pageBgColor: "#f0f9ff", modalHeaderBg: "#bae6fd", buttonColor: "#0284c7", borderColor: "#7dd3fc", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#082032" },
    darkColors: { darkPageBgColor: "#071929", darkCardBgColor: "#0c2d48", darkBorderColor: "#0284c7", darkPrimaryColor: "#38bdf8", announcementBgColor: "#075985", detailNameBoxColor: "#0c4a6e" },
  },
  "sunset-coral": {
    label: "🔥 جريديانت الياقوت الأحمر والغروب المرجاني",
    badge: "جريديانت",
    description: "تدرج الياقوت القرمزي والمرجاني المضيء لبراويز عناوين نابضة بالحياة",
    gradientPreview: "linear-gradient(135deg, #310b19 0%, #e11d48 55%, #fb7185 100%)",
    colors: { primaryColor: "#e11d48", pageBgColor: "#fff1f2", modalHeaderBg: "#ffe4e6", buttonColor: "#be123c", borderColor: "#fecdd3", cardBgColor: "#ffffff", headerBgColor: "#fffafa", footerBgColor: "#310b19" },
    darkColors: { darkPageBgColor: "#1f0812", darkCardBgColor: "#3b0d21", darkBorderColor: "#e11d48", darkPrimaryColor: "#fb7185", announcementBgColor: "#9f1239", detailNameBoxColor: "#4c0519" },
  },
  "turquoise-nile": {
    retired: true,
    label: "🌊 جريديانت سيان النيل والأزرق الفيروزي",
    badge: "جريديانت",
    description: "تدرج السيان المضيء والأزرق النيلي لبراويز العناوين والكروت في الليل والنهار",
    gradientPreview: "linear-gradient(135deg, #083344 0%, #0891b2 52%, #22d3ee 100%)",
    colors: { primaryColor: "#0284c7", pageBgColor: "#ecfeff", modalHeaderBg: "#cffafe", buttonColor: "#0891b2", borderColor: "#a5f3fc", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#083344" },
    darkColors: { darkPageBgColor: "#06212d", darkCardBgColor: "#0b394c", darkBorderColor: "#0891b2", darkPrimaryColor: "#22d3ee", announcementBgColor: "#155e75", detailNameBoxColor: "#164e63" },
  },
  "lavender-soft": {
    retired: true,
    label: "🌌 جريديانت السديم البنفسجي والإنديجو",
    badge: "جريديانت",
    description: "تدرج الإنديجو واللافندر المضيء المتناغم مع الوضع الليلي والنهاري",
    gradientPreview: "linear-gradient(135deg, #1e1b4b 0%, #6366f1 52%, #a5b4fc 100%)",
    colors: { primaryColor: "#4f46e5", pageBgColor: "#eef2ff", modalHeaderBg: "#e0e7ff", buttonColor: "#6366f1", borderColor: "#c7d2fe", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#1e1b4b" },
    darkColors: { darkPageBgColor: "#11102e", darkCardBgColor: "#1e1b4b", darkBorderColor: "#6366f1", darkPrimaryColor: "#a5b4fc", announcementBgColor: "#3730a3", detailNameBoxColor: "#312e81" },
  },
  "graphite-modern": {
    retired: true,
    label: "🛡️ جريديانت التيتانيوم والفولاذ الأزرق",
    badge: "جريديانت",
    description: "تدرج الفولاذ الكحلي والتيتانيوم العصري لبراويز عناوين فائقة الأناقة",
    gradientPreview: "linear-gradient(135deg, #090d16 0%, #334155 52%, #94a3b8 100%)",
    colors: { primaryColor: "#334155", pageBgColor: "#f8fafc", modalHeaderBg: "#e2e8f0", buttonColor: "#1e293b", borderColor: "#cbd5e1", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#090d16" },
    darkColors: { darkPageBgColor: "#090d16", darkCardBgColor: "#1e293b", darkBorderColor: "#475569", darkPrimaryColor: "#93c5fd", announcementBgColor: "#1e293b", detailNameBoxColor: "#0f172a" },
  },
  "olive-country": {
    retired: true,
    label: "🌿 جريديانت اليشم الأخضر والذهب الريفي",
    badge: "جريديانت",
    description: "تدرج اليشم الأخضر والذهبي الهادئ المتناسق مع الليل والنهار",
    gradientPreview: "linear-gradient(135deg, #142604 0%, #3f6212 52%, #a3e635 100%)",
    colors: { primaryColor: "#3f6212", pageBgColor: "#f7fee7", modalHeaderBg: "#ecfccb", buttonColor: "#4d7c0f", borderColor: "#d9f99d", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#1a2e05" },
    darkColors: { darkPageBgColor: "#111f04", darkCardBgColor: "#1e3508", darkBorderColor: "#4d7c0f", darkPrimaryColor: "#a3e635", announcementBgColor: "#365314", detailNameBoxColor: "#1a2e05" },
  },
  "vista-aero": {
    label: "🪟 سمة Windows Vista Aero الزجاجية",
    badge: "Vista",
    description: "زجاج Aero الأزرق الشفاف: هيدر وكروت ونوافذ ضبابية لامعة فوق خلفية Aurora مثل سطح مكتب Vista، بأزرار لامعة بخط منتصف",
    gradientPreview: "linear-gradient(135deg, #062a55 0%, #1b74d0 45%, #9fdcff 100%)",
    colors: { primaryColor: "#1b5fb4", pageBgColor: "#dfeefc", modalHeaderBg: "#cfe3f8", buttonColor: "#2a7fd4", borderColor: "#a9c9ea", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#0b2a4d" },
    darkColors: { darkPageBgColor: "#0b1c30", darkCardBgColor: "#12304f", darkBorderColor: "#2f6aa8", darkPrimaryColor: "#7cc3ff", announcementBgColor: "#1b4f8f", detailNameBoxColor: "#12304f" },
  },
  "vista-frost": {
    label: "🧊 سمة Vista Frost الجليدية التركواز",
    badge: "Vista",
    description: "زجاج Aero بلمسة جليدية تركواز وخلفية Aurora باردة، مع نفس اللمعان والشفافية في النوافذ والقوائم",
    gradientPreview: "linear-gradient(135deg, #083344 0%, #0e94b4 50%, #c7f3ff 100%)",
    colors: { primaryColor: "#0e7490", pageBgColor: "#e6f6fb", modalHeaderBg: "#d2eef7", buttonColor: "#0891b2", borderColor: "#a5dbea", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#083344" },
    darkColors: { darkPageBgColor: "#071e26", darkCardBgColor: "#0d3340", darkBorderColor: "#0e7490", darkPrimaryColor: "#67e8f9", announcementBgColor: "#155e75", detailNameBoxColor: "#0d3340" },
  },
  "vista-ultimate": {
    retired: true,
    label: "🖤 سمة Vista Ultimate السوداء الزجاجية",
    badge: "Vista",
    description: "زجاج Aero داكن فوق شفق Ultimate الأخضر والأزرق، الأنسب للوضع الليلي مع كروت ونوافذ شبه شفافة",
    gradientPreview: "linear-gradient(135deg, #020a12 0%, #0f6e8f 45%, #7ef2c8 100%)",
    colors: { primaryColor: "#0f6e8f", pageBgColor: "#e3f1f1", modalHeaderBg: "#cfe9ea", buttonColor: "#11889a", borderColor: "#9fd3d6", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#04121c" },
    darkColors: { darkPageBgColor: "#04121c", darkCardBgColor: "#0b2430", darkBorderColor: "#166e7c", darkPrimaryColor: "#5eead4", announcementBgColor: "#0f4c5c", detailNameBoxColor: "#0b2430" },
  },
  "vista-emerald": {
    label: "🌿 سمة Vista Emerald الزمردية الزجاجية",
    badge: "Vista",
    description: "زجاج Aero بتدرج زمردي وشفق أخضر هادئ، مريح للعين في الليل والنهار",
    gradientPreview: "linear-gradient(135deg, #03301f 0%, #0f9f6e 50%, #a7f3d0 100%)",
    colors: { primaryColor: "#0f7a55", pageBgColor: "#e6f7ef", modalHeaderBg: "#d1f0e1", buttonColor: "#13925f", borderColor: "#a3dfc4", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#03301f" },
    darkColors: { darkPageBgColor: "#052419", darkCardBgColor: "#0b3a2a", darkBorderColor: "#15805a", darkPrimaryColor: "#6ee7b7", announcementBgColor: "#0f5f44", detailNameBoxColor: "#0b3a2a" },
  },
  "vista-sunset": {
    label: "🌇 سمة Vista Sunset الغروب الزجاجي",
    badge: "Vista",
    description: "زجاج Aero بألوان الغروب البرتقالي والوردي مع لمعان دافئ وأزرار كهرمانية",
    gradientPreview: "linear-gradient(135deg, #4a1326 0%, #f05a28 50%, #ffd27a 100%)",
    colors: { primaryColor: "#d9480f", pageBgColor: "#fff3ea", modalHeaderBg: "#ffe3cf", buttonColor: "#ea580c", borderColor: "#ffc9a3", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#4a1326" },
    darkColors: { darkPageBgColor: "#2a0f14", darkCardBgColor: "#44191f", darkBorderColor: "#c2410c", darkPrimaryColor: "#fdba74", announcementBgColor: "#9a3412", detailNameBoxColor: "#44191f" },
  },
  "vista-violet": {
    retired: true,
    label: "💜 سمة Vista Violet البنفسجية الزجاجية",
    badge: "Vista",
    description: "زجاج Aero بنفسجي ملكي مع شفق أرجواني وأزرار لامعة بخط المنتصف",
    gradientPreview: "linear-gradient(135deg, #2e1065 0%, #7c3aed 50%, #e9d5ff 100%)",
    colors: { primaryColor: "#6d28d9", pageBgColor: "#f4efff", modalHeaderBg: "#e9ddff", buttonColor: "#7c3aed", borderColor: "#d5c2fb", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#2e1065" },
    darkColors: { darkPageBgColor: "#180b33", darkCardBgColor: "#2a1558", darkBorderColor: "#6d28d9", darkPrimaryColor: "#c4b5fd", announcementBgColor: "#4c1d95", detailNameBoxColor: "#2a1558" },
  },
  "vista-ruby": {
    retired: true,
    label: "❤️ سمة Vista Ruby الياقوتية الزجاجية",
    badge: "Vista",
    description: "زجاج Aero أحمر ياقوتي فاخر مع شفق وردي، مناسب للمناسبات والعروض",
    gradientPreview: "linear-gradient(135deg, #4c0519 0%, #e11d48 50%, #fecdd3 100%)",
    colors: { primaryColor: "#be123c", pageBgColor: "#fff1f3", modalHeaderBg: "#ffe0e6", buttonColor: "#e11d48", borderColor: "#fbc3cf", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#4c0519" },
    darkColors: { darkPageBgColor: "#2b0711", darkCardBgColor: "#4a0e1f", darkBorderColor: "#be123c", darkPrimaryColor: "#fda4af", announcementBgColor: "#9f1239", detailNameBoxColor: "#4a0e1f" },
  },
  "vista-gold": {
    retired: true,
    label: "👑 سمة Vista Gold الذهبية الزجاجية",
    badge: "Vista",
    description: "زجاج Aero ذهبي كهرماني مع شفق بني دافئ وأزرار ذهبية لامعة",
    gradientPreview: "linear-gradient(135deg, #3b2104 0%, #d97706 50%, #fde68a 100%)",
    colors: { primaryColor: "#b45309", pageBgColor: "#fff8e6", modalHeaderBg: "#ffefc4", buttonColor: "#d97706", borderColor: "#fcd98a", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#3b2104" },
    darkColors: { darkPageBgColor: "#1f1204", darkCardBgColor: "#3a2408", darkBorderColor: "#b45309", darkPrimaryColor: "#fcd34d", announcementBgColor: "#92400e", detailNameBoxColor: "#3a2408" },
  },
  "vista-pearl": {
    retired: true,
    label: "🤍 سمة Vista Pearl اللؤلؤية الفضية",
    badge: "Vista",
    description: "زجاج Aero فاتح لؤلؤي فضي بأقل قدر من الألوان، أنيق وهادئ للنهار",
    gradientPreview: "linear-gradient(135deg, #1f2937 0%, #64748b 50%, #f1f5f9 100%)",
    colors: { primaryColor: "#334155", pageBgColor: "#f6f8fb", modalHeaderBg: "#e8edf3", buttonColor: "#475569", borderColor: "#cbd5e1", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#1f2937" },
    darkColors: { darkPageBgColor: "#0f172a", darkCardBgColor: "#1e293b", darkBorderColor: "#475569", darkPrimaryColor: "#cbd5e1", announcementBgColor: "#334155", detailNameBoxColor: "#1e293b" },
  },
  "vista-midnight": {
    label: "🌙 سمة Vista Midnight منتصف الليل",
    badge: "Vista",
    description: "زجاج Aero كحلي عميق مع شفق نيلي وبنفسجي، الأفضل للوضع الليلي الكامل",
    gradientPreview: "linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #818cf8 100%)",
    colors: { primaryColor: "#1e3a8a", pageBgColor: "#eef1fb", modalHeaderBg: "#dfe5fa", buttonColor: "#3730a3", borderColor: "#c3ccf5", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#020617" },
    darkColors: { darkPageBgColor: "#030816", darkCardBgColor: "#0f1a3d", darkBorderColor: "#3730a3", darkPrimaryColor: "#a5b4fc", announcementBgColor: "#1e1b4b", detailNameBoxColor: "#0f1a3d" },
  },
  "win11-bloom": {
    label: "🪟 سمة Windows 11 Bloom الزرقاء",
    badge: "Win 11",
    description: "خلفية Bloom الزرقاء الشهيرة مع أسطح Mica شبه شفافة، زوايا 8px ناعمة، وأزرار Fluent مسطحة بلون التمييز الأزرق",
    gradientPreview: "linear-gradient(135deg, #0067c0 0%, #4cc2ff 55%, #dbeafe 100%)",
    colors: { primaryColor: "#0067c0", pageBgColor: "#f3f6fb", modalHeaderBg: "#e8f1fb", buttonColor: "#005fb8", borderColor: "#c9d9ea", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#1b2a3d" },
    darkColors: { darkPageBgColor: "#202020", darkCardBgColor: "#2b2b2b", darkBorderColor: "#3a3a3a", darkPrimaryColor: "#60cdff", announcementBgColor: "#1f3550", detailNameBoxColor: "#2b2b2b" },
  },
  "win11-dark": {
    label: "🌑 سمة Windows 11 Dark الداكنة",
    badge: "Win 11",
    description: "Bloom داكن بأسطح Mica رمادية غامقة ولمسة تمييز سماوية — الأنسب لمحبي الوضع الليلي الكامل",
    gradientPreview: "linear-gradient(135deg, #1e5fa8 0%, #60cdff 55%, #c7d2fe 100%)",
    colors: { primaryColor: "#1e5fa8", pageBgColor: "#eef1f6", modalHeaderBg: "#e3e8f0", buttonColor: "#1e5fa8", borderColor: "#c6cfdc", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#161616" },
    darkColors: { darkPageBgColor: "#161616", darkCardBgColor: "#232323", darkBorderColor: "#333333", darkPrimaryColor: "#60cdff", announcementBgColor: "#1f2f45", detailNameBoxColor: "#232323" },
  },
  "win11-mica": {
    label: "🩶 سمة Windows 11 Mica الهادئة",
    badge: "Win 11",
    description: "أسطح Mica الرمادية الفاتحة الهادئة كما في تطبيقات ويندوز 11 الأصلية، تمييز أزرق هادئ وبدون ضجيج لوني",
    gradientPreview: "linear-gradient(135deg, #005fb8 0%, #8fbce8 55%, #f3f3f3 100%)",
    colors: { primaryColor: "#005fb8", pageBgColor: "#f3f3f3", modalHeaderBg: "#e9e9e9", buttonColor: "#005fb8", borderColor: "#d6d6d6", cardBgColor: "#fbfbfb", headerBgColor: "#fbfbfb", footerBgColor: "#2b2b2b" },
    darkColors: { darkPageBgColor: "#202020", darkCardBgColor: "#2c2c2c", darkBorderColor: "#3b3b3b", darkPrimaryColor: "#8fbce8", announcementBgColor: "#2c3a4a", detailNameBoxColor: "#2c2c2c" },
  },
  "win11-sunrise": {
    label: "🌅 سمة Windows 11 Sunrise البرتقالية",
    badge: "Win 11",
    description: "Bloom بألوان الشروق البرتقالية والوردية مع أسطح Mica دافئة وأزرار Fluent بلون المرجان",
    gradientPreview: "linear-gradient(135deg, #c2410c 0%, #fb923c 55%, #ffe4d6 100%)",
    colors: { primaryColor: "#c2410c", pageBgColor: "#fff5ef", modalHeaderBg: "#ffe8db", buttonColor: "#c2410c", borderColor: "#f5cdb6", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#3b1a0a" },
    darkColors: { darkPageBgColor: "#1f1511", darkCardBgColor: "#2d1f19", darkBorderColor: "#4a2f24", darkPrimaryColor: "#fdba74", announcementBgColor: "#4a2314", detailNameBoxColor: "#2d1f19" },
  },
  "win11-glow": {
    label: "💜 سمة Windows 11 Glow البنفسجية",
    badge: "Win 11",
    description: "Bloom بنفسجي متوهج مع أسطح Mica أرجوانية فاتحة وأزرار Fluent بنفسجية",
    gradientPreview: "linear-gradient(135deg, #6b21a8 0%, #a855f7 55%, #ede9fe 100%)",
    colors: { primaryColor: "#6b21a8", pageBgColor: "#f7f3ff", modalHeaderBg: "#ece4fb", buttonColor: "#6d28d9", borderColor: "#d9cdf3", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#2a1246" },
    darkColors: { darkPageBgColor: "#17112a", darkCardBgColor: "#231a3a", darkBorderColor: "#3a2b5a", darkPrimaryColor: "#c4b5fd", announcementBgColor: "#3b1e6a", detailNameBoxColor: "#231a3a" },
  },
  "win11-flow": {
    label: "🌿 سمة Windows 11 Flow الخضراء",
    badge: "Win 11",
    description: "Bloom بالأخضر الزمردي مع أسطح Mica نعناعية وأزرار Fluent خضراء",
    gradientPreview: "linear-gradient(135deg, #047857 0%, #34d399 55%, #d1fae5 100%)",
    colors: { primaryColor: "#047857", pageBgColor: "#f1fbf6", modalHeaderBg: "#e1f5ea", buttonColor: "#047857", borderColor: "#bfe6d2", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#06281d" },
    darkColors: { darkPageBgColor: "#0f1d18", darkCardBgColor: "#17302a", darkBorderColor: "#24473c", darkPrimaryColor: "#6ee7b7", announcementBgColor: "#0b3a2c", detailNameBoxColor: "#17302a" },
  },
  "win11-motion": {
    label: "🌹 سمة Windows 11 Motion الوردية",
    badge: "Win 11",
    description: "Bloom وردي أحمر مستوحى من Captured Motion مع أسطح Mica وردية فاتحة وأزرار Fluent قرمزية",
    gradientPreview: "linear-gradient(135deg, #be123c 0%, #fb7185 55%, #ffe4e6 100%)",
    colors: { primaryColor: "#be123c", pageBgColor: "#fff4f6", modalHeaderBg: "#ffe1e7", buttonColor: "#be123c", borderColor: "#f5c1cc", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#3b0a16" },
    darkColors: { darkPageBgColor: "#1f1216", darkCardBgColor: "#2e1a20", darkBorderColor: "#4c2a33", darkPrimaryColor: "#fda4af", announcementBgColor: "#4c1120", detailNameBoxColor: "#2e1a20" },
  },
  "win11-sunset": {
    label: "🌇 سمة Windows 11 Sunset الذهبية",
    badge: "Win 11",
    description: "Bloom ذهبي كهرماني مع أسطح Mica عسلية وأزرار Fluent بلون العنبر",
    gradientPreview: "linear-gradient(135deg, #b45309 0%, #fbbf24 55%, #fef3c7 100%)",
    colors: { primaryColor: "#b45309", pageBgColor: "#fff9ec", modalHeaderBg: "#fdeecf", buttonColor: "#b45309", borderColor: "#f1d8a6", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#3a2605" },
    darkColors: { darkPageBgColor: "#1f1810", darkCardBgColor: "#2e2416", darkBorderColor: "#4a3a22", darkPrimaryColor: "#fcd34d", announcementBgColor: "#4a3008", detailNameBoxColor: "#2e2416" },
  },
  "win11-graphite": {
    label: "🩶 سمة Windows 11 Graphite الرمادية",
    badge: "Win 11",
    description: "Bloom رمادي فولاذي أنيق مع أسطح Mica محايدة وأزرار Fluent بلون الأردواز — مظهر رسمي هادئ",
    gradientPreview: "linear-gradient(135deg, #334155 0%, #94a3b8 55%, #f1f5f9 100%)",
    colors: { primaryColor: "#334155", pageBgColor: "#f3f5f8", modalHeaderBg: "#e6eaf0", buttonColor: "#334155", borderColor: "#cfd6df", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#0f172a" },
    darkColors: { darkPageBgColor: "#141a24", darkCardBgColor: "#1e2633", darkBorderColor: "#2f3b4d", darkPrimaryColor: "#cbd5e1", announcementBgColor: "#1e293b", detailNameBoxColor: "#1e2633" },
  },
  "win11-ocean": {
    label: "🌊 سمة Windows 11 Ocean البحرية",
    badge: "Win 11",
    description: "Bloom كحلي وسماوي كأعماق البحر مع أسطح Mica زرقاء فاتحة وأزرار Fluent سماوية",
    gradientPreview: "linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 55%, #e0f2fe 100%)",
    colors: { primaryColor: "#0c4a6e", pageBgColor: "#eff8fe", modalHeaderBg: "#def0fb", buttonColor: "#0369a1", borderColor: "#bcdcf0", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#082f49" },
    darkColors: { darkPageBgColor: "#0b1a26", darkCardBgColor: "#12283a", darkBorderColor: "#1f405a", darkPrimaryColor: "#7dd3fc", announcementBgColor: "#0c3a55", detailNameBoxColor: "#12283a" },
  },
  "win10-blue": {
    label: "🟦 سمة Windows 10 الزرقاء الكلاسيكية",
    badge: "Win 10",
    description: "واجهة Windows 10 الحقيقية: زوايا حادة، أزرار مسطحة بإطار رمادي، هيدر كشريط عنوان بلون التمييز الأزرق، قائمة ابدأ داكنة، وفوتر كشريط المهام",
    gradientPreview: "linear-gradient(135deg, #003e92 0%, #0078d7 55%, #e6e6e6 100%)",
    colors: { primaryColor: "#0078d7", pageBgColor: "#e6e6e6", modalHeaderBg: "#f2f2f2", buttonColor: "#0078d7", borderColor: "#adadad", cardBgColor: "#ffffff", headerBgColor: "#0078d7", footerBgColor: "#101010" },
    darkColors: { darkPageBgColor: "#000000", darkCardBgColor: "#1f1f1f", darkBorderColor: "#2b2b2b", darkPrimaryColor: "#4cc2ff", announcementBgColor: "#0063b1", detailNameBoxColor: "#1f1f1f" },
  },
  "win10-dark": {
    label: "⬛ سمة Windows 10 الداكنة (Dark Mode)",
    badge: "Win 10",
    description: "الوضع الداكن الأصلي لويندوز 10: خلفيات سوداء ورمادي فحمي، تمييز أزرق فاتح، أزرار وقوائم مسطحة حادة الزوايا",
    gradientPreview: "linear-gradient(135deg, #000000 0%, #1f1f1f 55%, #4cc2ff 100%)",
    colors: { primaryColor: "#0063b1", pageBgColor: "#ebebeb", modalHeaderBg: "#f2f2f2", buttonColor: "#0063b1", borderColor: "#adadad", cardBgColor: "#ffffff", headerBgColor: "#1f1f1f", footerBgColor: "#000000" },
    darkColors: { darkPageBgColor: "#000000", darkCardBgColor: "#1f1f1f", darkBorderColor: "#333333", darkPrimaryColor: "#4cc2ff", announcementBgColor: "#0063b1", detailNameBoxColor: "#1f1f1f" },
  },
  "win10-teal": {
    label: "🟩 سمة Windows 10 التركواز",
    badge: "Win 10",
    description: "لون تمييز Teal الشهير في ويندوز 10 مع نفس الواجهة الحادة المسطحة وشريط العنوان الملوّن",
    gradientPreview: "linear-gradient(135deg, #004b50 0%, #038387 55%, #e6e6e6 100%)",
    colors: { primaryColor: "#038387", pageBgColor: "#e6e6e6", modalHeaderBg: "#f2f2f2", buttonColor: "#038387", borderColor: "#adadad", cardBgColor: "#ffffff", headerBgColor: "#038387", footerBgColor: "#101010" },
    darkColors: { darkPageBgColor: "#000000", darkCardBgColor: "#1f1f1f", darkBorderColor: "#2b2b2b", darkPrimaryColor: "#00b7c3", announcementBgColor: "#005f63", detailNameBoxColor: "#1f1f1f" },
  },
  "win10-purple": {
    label: "🟪 سمة Windows 10 البنفسجية",
    badge: "Win 10",
    description: "لون تمييز Iris Purple من لوحة ألوان ويندوز 10 مع الواجهة المسطحة حادة الزوايا",
    gradientPreview: "linear-gradient(135deg, #3b2a6e 0%, #744da9 55%, #e6e6e6 100%)",
    colors: { primaryColor: "#744da9", pageBgColor: "#e6e6e6", modalHeaderBg: "#f2f2f2", buttonColor: "#744da9", borderColor: "#adadad", cardBgColor: "#ffffff", headerBgColor: "#744da9", footerBgColor: "#101010" },
    darkColors: { darkPageBgColor: "#000000", darkCardBgColor: "#1f1f1f", darkBorderColor: "#2b2b2b", darkPrimaryColor: "#b4a0ff", announcementBgColor: "#5c2e91", detailNameBoxColor: "#1f1f1f" },
  },
  "win10-red": {
    label: "🟥 سمة Windows 10 الحمراء",
    badge: "Win 10",
    description: "لون تمييز Red الأصلي في ويندوز 10 مع شريط عنوان أحمر وأزرار مسطحة حادة",
    gradientPreview: "linear-gradient(135deg, #7a0b16 0%, #e81123 55%, #e6e6e6 100%)",
    colors: { primaryColor: "#e81123", pageBgColor: "#e6e6e6", modalHeaderBg: "#f2f2f2", buttonColor: "#e81123", borderColor: "#adadad", cardBgColor: "#ffffff", headerBgColor: "#e81123", footerBgColor: "#101010" },
    darkColors: { darkPageBgColor: "#000000", darkCardBgColor: "#1f1f1f", darkBorderColor: "#2b2b2b", darkPrimaryColor: "#ff6b6b", announcementBgColor: "#a4262c", detailNameBoxColor: "#1f1f1f" },
  },
};

// Quick circular tools on the provider card: order = display order, missing ids = hidden.
export const providerEdgeToolIds = ["call", "whatsapp", "share", "favorite", "copy", "suggest"] as const;
export type ProviderEdgeToolId = (typeof providerEdgeToolIds)[number];
export const providerEdgeToolLabels: Record<ProviderEdgeToolId, string> = { call: "اتصال", whatsapp: "واتساب", share: "مشاركة", favorite: "المفضلة", copy: "نسخ الرقم", suggest: "اقترح تعديل" };
export function parseProviderEdgeTools(value: string | undefined): ProviderEdgeToolId[] {
  const seen = new Set<string>();
  const out: ProviderEdgeToolId[] = [];
  for (const part of String(value ?? "").split(",")) {
    const id = part.trim() as ProviderEdgeToolId;
    if ((providerEdgeToolIds as readonly string[]).includes(id) && !seen.has(id)) { seen.add(id); out.push(id); }
  }
  return out;
}
function sanitizeProviderEdgeTools(value: unknown): string {
  if (typeof value !== "string") return defaultDesignSettings.providerEdgeTools;
  return parseProviderEdgeTools(value).join(",");
}
export function sanitizeDesignSettings(saved: unknown): DesignSettings {
  const next: DesignSettings = { ...defaultDesignSettings };
  if (!saved || typeof saved !== "object") return next;
  const record = saved as Record<string, unknown>;
  const hexColor = (val: unknown, fallback: string) => (typeof val === "string" && /^#[0-9a-fA-F]{3,8}$/.test(val.trim()) ? val.trim() : fallback);
  const pickEnum = <T extends string>(val: unknown, allowed: readonly T[], fallback: T): T =>
    typeof val === "string" && (allowed as readonly string[]).includes(val) ? (val as T) : fallback;
  const pickBool = (val: unknown, fallback: boolean) => (typeof val === "boolean" ? val : fallback);
  const pickText = (val: unknown, fallback: string, max = 200, allowEmpty = false) => {
    if (typeof val !== "string") return fallback;
    const trimmed = val.trim().slice(0, max);
    return trimmed || allowEmpty ? trimmed : fallback;
  };

  next.themePreset = pickEnum(
    record.themePreset,
    ["royal-blue", "classic-blue", "emerald", "royal-navy", "warm-gold", "festive", "ramadan", "eid", "schools", "winter-emergency", "sunset-coral", "turquoise-nile", "lavender-soft", "graphite-modern", "olive-country", "vista-aero", "vista-frost", "vista-ultimate", "vista-emerald", "vista-sunset", "vista-violet", "vista-ruby", "vista-gold", "vista-pearl", "vista-midnight", "win11-bloom", "win11-dark", "win11-mica", "win11-sunrise", "win11-glow", "win11-flow", "win11-motion", "win11-sunset", "win11-graphite", "win11-ocean", "win10-blue", "win10-dark", "win10-teal", "win10-purple", "win10-red", "custom"] as const,
    defaultDesignSettings.themePreset,
  );
  next.primaryColor = hexColor(record.primaryColor, defaultDesignSettings.primaryColor);
  next.pageBgColor = hexColor(record.pageBgColor, defaultDesignSettings.pageBgColor);
  next.modalHeaderBg = hexColor(record.modalHeaderBg, defaultDesignSettings.modalHeaderBg);
  next.buttonColor = hexColor(record.buttonColor, defaultDesignSettings.buttonColor);
  next.themeMode = pickEnum(record.themeMode, ["auto", "light", "dark"] as const, defaultDesignSettings.themeMode);

  next.headingAlign = pickEnum(record.headingAlign, ["center", "right", "left"] as const, defaultDesignSettings.headingAlign);
  next.cardTextAlign = pickEnum(record.cardTextAlign, ["center", "right", "left"] as const, defaultDesignSettings.cardTextAlign);
  next.noticeAlign = pickEnum(record.noticeAlign, ["center", "right", "left"] as const, defaultDesignSettings.noticeAlign);
  next.fontScale = pickEnum(record.fontScale, ["small", "normal", "large", "xlarge"] as const, defaultDesignSettings.fontScale);
  next.fontWeight = pickEnum(record.fontWeight, ["normal", "bold", "extrabold"] as const, defaultDesignSettings.fontWeight);
  next.fontFamily = pickEnum(record.fontFamily, ["cairo", "tajawal", "almarai", "readex"] as const, defaultDesignSettings.fontFamily);
  next.sectionHeadingStyle = pickEnum(
    record.sectionHeadingStyle,
    [
      "plain",
      "clean",
      "pill",
      "pill-badge",
      "underline",
      "framed",
      "boxed",
      "right-bar",
      "sky-gradient",
      "royal-ribbon",
      "neon-border",
      "double-frame",
      "glass-card",
      "3d-banner",
      "neon-glow",
      "glass-3d",
      "gold-crest",
      "ribbon-banner",
      "side-blade",
      "floating-capsule",
      "double-royal",
    ] as const,
    defaultDesignSettings.sectionHeadingStyle,
  );

  next.borderWidth = pickEnum(record.borderWidth, ["none", "thin", "medium", "double"] as const, defaultDesignSettings.borderWidth);
  next.borderColor = hexColor(record.borderColor, defaultDesignSettings.borderColor);
  next.cardBgColor = hexColor(record.cardBgColor, defaultDesignSettings.cardBgColor);
  next.cardRadius = pickEnum(record.cardRadius, ["sharp", "medium", "rounded", "pill"] as const, defaultDesignSettings.cardRadius);
  next.cardShadow = pickEnum(record.cardShadow, ["none", "soft", "elevated-3d"] as const, defaultDesignSettings.cardShadow);

  next.buttonShape = pickEnum(
    record.buttonShape,
    ["pill", "rounded", "square", "sharp", "soft-square", "soft-arch", "cut-corner", "leaf", "capsule-3d", "capsule-wide", "bevel"] as const,
    defaultDesignSettings.buttonShape,
  );
  next.buttonEffect = pickEnum(
    record.buttonEffect,
    [
      "gradient",
      "gradient-flow",
      "glow",
      "solid",
      "flat",
      "outline",
      "3d",
      "3d-press",
      "lift",
      "pulse",
      "ripple-shine",
      "glass-glow",
      "neon-border",
      "metallic-shine",
      "double-ring",
      "soft-pulse",
      "cyber-gradient",
    ] as const,
    defaultDesignSettings.buttonEffect,
  );
  next.buttonAlign = pickEnum(record.buttonAlign, ["center", "right", "full"] as const, defaultDesignSettings.buttonAlign);

  next.iconStyle = pickEnum(record.iconStyle, ["3d", "flat", "glow"] as const, defaultDesignSettings.iconStyle);
  next.iconSize = pickEnum(record.iconSize, ["small", "medium", "large"] as const, defaultDesignSettings.iconSize);
  next.iconPosition = pickEnum(record.iconPosition, ["top-center", "left", "right"] as const, defaultDesignSettings.iconPosition);
  next.mobileColumns = pickEnum(record.mobileColumns, ["2", "3"] as const, defaultDesignSettings.mobileColumns);
  next.desktopColumns = pickEnum(record.desktopColumns, ["3", "4"] as const, defaultDesignSettings.desktopColumns);
  next.sectionOrder = pickText(record.sectionOrder, defaultDesignSettings.sectionOrder, 120);
  next.showHero = pickBool(record.showHero, defaultDesignSettings.showHero);
  next.showFeatureCards = pickBool(record.showFeatureCards, defaultDesignSettings.showFeatureCards);
  next.showFeaturedSection = pickBool(record.showFeaturedSection, defaultDesignSettings.showFeaturedSection);
  next.showOffersSection = pickBool(record.showOffersSection, defaultDesignSettings.showOffersSection);
  next.showCategoriesSection = pickBool(record.showCategoriesSection, defaultDesignSettings.showCategoriesSection);
  next.showAddProfessionBanner = pickBool(record.showAddProfessionBanner, defaultDesignSettings.showAddProfessionBanner);
  next.featuredDefaultOpen = pickBool(record.featuredDefaultOpen, defaultDesignSettings.featuredDefaultOpen);

  next.headerSticky = pickBool(record.headerSticky, defaultDesignSettings.headerSticky);
  next.headerBgColor = hexColor(record.headerBgColor, defaultDesignSettings.headerBgColor);
  next.headerLogoUrl = pickText(record.headerLogoUrl, defaultDesignSettings.headerLogoUrl, 300, true);
  next.showHeaderBell = pickBool(record.showHeaderBell, defaultDesignSettings.showHeaderBell);
  next.showHeaderFavorites = pickBool(record.showHeaderFavorites, defaultDesignSettings.showHeaderFavorites);
  next.showHeaderDarkToggle = pickBool(record.showHeaderDarkToggle, defaultDesignSettings.showHeaderDarkToggle);
  next.showHeaderLoginBtn = pickBool(record.showHeaderLoginBtn, defaultDesignSettings.showHeaderLoginBtn);
  next.footerBgColor = hexColor(record.footerBgColor, defaultDesignSettings.footerBgColor);
  next.showFooterWhatsapp = pickBool(record.showFooterWhatsapp, defaultDesignSettings.showFooterWhatsapp);
  next.splashEnabled = pickBool(record.splashEnabled, defaultDesignSettings.splashEnabled);
  next.splashImageUrl = pickText(record.splashImageUrl, defaultDesignSettings.splashImageUrl, 300);
  next.splashDuration = pickEnum(record.splashDuration, ["900", "1500", "2500"] as const, defaultDesignSettings.splashDuration);
  next.splashAudience = pickEnum(record.splashAudience, ["installed", "all"] as const, defaultDesignSettings.splashAudience);
  next.splashStickers = pickBool(record.splashStickers, defaultDesignSettings.splashStickers);

  next.authShowBanner = pickBool(record.authShowBanner, defaultDesignSettings.authShowBanner);
  next.authBannerImage = pickText(record.authBannerImage, defaultDesignSettings.authBannerImage, 300, true);
  next.authBannerImageDark = pickText(record.authBannerImageDark, defaultDesignSettings.authBannerImageDark, 300, true);
  next.registerBannerImage = pickText(record.registerBannerImage, defaultDesignSettings.registerBannerImage, 300, true);
  next.registerBannerImageDark = pickText(record.registerBannerImageDark, defaultDesignSettings.registerBannerImageDark, 300, true);
  next.heroBannerImage = pickText(record.heroBannerImage, defaultDesignSettings.heroBannerImage, 300, true);
  next.heroBannerImageDark = pickText(record.heroBannerImageDark, defaultDesignSettings.heroBannerImageDark, 300, true);
  const rawOverlay = typeof record.heroBannerOverlay === "number" ? record.heroBannerOverlay : Number(record.heroBannerOverlay);
  next.heroBannerOverlay = Number.isFinite(rawOverlay) && rawOverlay >= 0 && rawOverlay <= 80 ? Math.round(rawOverlay / 10) * 10 : defaultDesignSettings.heroBannerOverlay;
  next.heroBannerText = pickBool(record.heroBannerText, defaultDesignSettings.heroBannerText);
  next.heroBannerHeight = pickEnum(record.heroBannerHeight, ["auto", "small", "medium", "large"] as const, defaultDesignSettings.heroBannerHeight);
  next.heroBannerFit = pickEnum(record.heroBannerFit, ["cover", "contain"] as const, defaultDesignSettings.heroBannerFit);
  next.win10Radius = pickEnum(record.win10Radius, ["0", "2", "6", "12"] as const, defaultDesignSettings.win10Radius);
  next.loginTitle = pickText(record.loginTitle, defaultDesignSettings.loginTitle, 120);
  next.loginSubtitle = pickText(record.loginSubtitle, defaultDesignSettings.loginSubtitle, 180);
  next.registerTitle = pickText(record.registerTitle, defaultDesignSettings.registerTitle, 120);
  next.registerSubtitle = pickText(record.registerSubtitle, defaultDesignSettings.registerSubtitle, 180);
  next.authFieldsLayout = pickEnum(record.authFieldsLayout, ["two-col", "one-col"] as const, defaultDesignSettings.authFieldsLayout);
  next.authInputBorderColor = hexColor(record.authInputBorderColor, defaultDesignSettings.authInputBorderColor);

  next.announcementEnabled = pickBool(record.announcementEnabled, defaultDesignSettings.announcementEnabled);
  next.announcementText = pickText(record.announcementText, defaultDesignSettings.announcementText, 240);
  next.announcementBgColor = hexColor(record.announcementBgColor, defaultDesignSettings.announcementBgColor);
  next.announcementBgColorLight = hexColor(record.announcementBgColorLight, defaultDesignSettings.announcementBgColorLight);
  next.announcementTextColor = hexColor(record.announcementTextColor, "");
  next.announcementTextColorLight = hexColor(record.announcementTextColorLight, "");
  next.announcementHighlightColor = hexColor(record.announcementHighlightColor, "");
  next.announcementStyle = pickEnum(record.announcementStyle, ["static", "badge", "soft"] as const, defaultDesignSettings.announcementStyle);
  next.heroStyle = pickEnum(record.heroStyle, ["sky-banner", "gradient-card", "compact-minimal"] as const, defaultDesignSettings.heroStyle);
  next.searchBoxStyle = pickEnum(record.searchBoxStyle, ["rounded", "pill", "floating-glass"] as const, defaultDesignSettings.searchBoxStyle);
  next.providerCardLayout = pickEnum(record.providerCardLayout, ["classic", "compact", "centered"] as const, defaultDesignSettings.providerCardLayout);
  next.showProviderBadges = pickBool(record.showProviderBadges, defaultDesignSettings.showProviderBadges);
  next.showProviderShareBtn = pickBool(record.showProviderShareBtn, defaultDesignSettings.showProviderShareBtn);
  next.tapFeedback = pickEnum(record.tapFeedback ?? record.menuFeedback, ["off", "haptic", "sound", "both"] as const, defaultDesignSettings.tapFeedback);
  next.providerEdgeTools = sanitizeProviderEdgeTools(record.providerEdgeTools);
  next.providerEdgeToolsPosition = pickEnum(record.providerEdgeToolsPosition, ["left", "right", "bottom"] as const, defaultDesignSettings.providerEdgeToolsPosition);
  next.showTopProfessions = pickBool(record.showTopProfessions, defaultDesignSettings.showTopProfessions);
  next.specialtyArt3d = pickBool(record.specialtyArt3d, defaultDesignSettings.specialtyArt3d);
  next.specialtyStickerIcons = pickBool(record.specialtyStickerIcons, defaultDesignSettings.specialtyStickerIcons);
  next.specialtyIconStyle = pickEnum(record.specialtyIconStyle, ["3d", "flat"] as const, defaultDesignSettings.specialtyIconStyle);
  next.topProfessionsPinned = parsePinnedProfessions(record.topProfessionsPinned).join(",");
  next.showWeeklyStars = pickBool(record.showWeeklyStars, defaultDesignSettings.showWeeklyStars);
  next.powerSaveMode = pickEnum(record.powerSaveMode, ["auto", "on", "off"] as const, defaultDesignSettings.powerSaveMode);
  next.showProviderWhatsappBtn = pickBool(record.showProviderWhatsappBtn, defaultDesignSettings.showProviderWhatsappBtn);
  next.whatsappButtonColor = hexColor(record.whatsappButtonColor, defaultDesignSettings.whatsappButtonColor);
  next.sectionSpacing = pickEnum(record.sectionSpacing, ["compact", "normal", "relaxed"] as const, defaultDesignSettings.sectionSpacing);
  next.cardHoverEffect = pickEnum(
    record.cardHoverEffect,
    [
      "lift",
      "glow",
      "scale",
      "tilt",
      "tilt-3d",
      "float-3d",
      "border-pulse",
      "neon-sweep",
      "spring-pop",
      "shine-glint",
      "shimmer-sweep",
      "float-bounce",
      "neon-aura",
      "slide-up-glow",
      "none",
    ] as const,
    defaultDesignSettings.cardHoverEffect,
  );
  next.sectionDividerStyle = pickEnum(record.sectionDividerStyle, ["none", "line", "dots", "gradient"] as const, defaultDesignSettings.sectionDividerStyle);
  next.floatingWhatsappEnabled = pickBool(record.floatingWhatsappEnabled, defaultDesignSettings.floatingWhatsappEnabled);

  next.seasonalRibbon = pickEnum(record.seasonalRibbon, ["none", "ramadan", "eid", "schools", "winter"] as const, defaultDesignSettings.seasonalRibbon);
  next.footerDescription = pickText(record.footerDescription, defaultDesignSettings.footerDescription, 260, true);
  next.footerFacebookUrl = pickText(record.footerFacebookUrl, defaultDesignSettings.footerFacebookUrl, 300, true);
  next.footerWhatsappGroupUrl = pickText(record.footerWhatsappGroupUrl, defaultDesignSettings.footerWhatsappGroupUrl, 300, true);
  next.showFooterStats = pickBool(record.showFooterStats, defaultDesignSettings.showFooterStats);
  next.mobileBottomNavEnabled = pickBool(record.mobileBottomNavEnabled, defaultDesignSettings.mobileBottomNavEnabled);
  next.showPrayerWeatherBar = pickBool(record.showPrayerWeatherBar, defaultDesignSettings.showPrayerWeatherBar);
  next.showTransitGuide = pickBool(record.showTransitGuide, defaultDesignSettings.showTransitGuide);
  next.showInstallAppBanner = pickBool(record.showInstallAppBanner, defaultDesignSettings.showInstallAppBanner);
  next.showAdminQuickEdit = pickBool(record.showAdminQuickEdit, defaultDesignSettings.showAdminQuickEdit);
  next.membershipRequired = pickBool(record.membershipRequired, defaultDesignSettings.membershipRequired);

  next.announcementItems = pickText(record.announcementItems, defaultDesignSettings.announcementItems, 1200, true);
  next.announcementTickerMode = pickEnum(
    record.announcementTickerMode,
    ["single", "rotate", "marquee", "marquee-reverse", "vertical-slide", "pulse-glow", "bounce"] as const,
    defaultDesignSettings.announcementTickerMode,
  );
  next.announcementSpeed = pickEnum(
    record.announcementSpeed,
    ["ultra-slow", "very-slow", "slow", "normal", "medium-fast", "fast", "very-fast", "turbo", "flash"] as const,
    defaultDesignSettings.announcementSpeed,
  );
  next.headerPattern = pickEnum(record.headerPattern, ["none", "dots", "grid", "islamic", "waves"] as const, defaultDesignSettings.headerPattern);
  next.heroPattern = pickEnum(record.heroPattern, ["none", "dots", "grid", "islamic", "waves", "stars"] as const, defaultDesignSettings.heroPattern);
  next.patternOpacity = pickEnum(record.patternOpacity, ["subtle", "medium", "clear"] as const, defaultDesignSettings.patternOpacity);

  next.prayerCardStyle = pickEnum(record.prayerCardStyle, ["dark-sky", "royal-navy", "emerald"] as const, defaultDesignSettings.prayerCardStyle);
  next.prayerDefaultOpen = pickBool(record.prayerDefaultOpen, defaultDesignSettings.prayerDefaultOpen);
  next.categorySearchDefaultOpen = pickBool(record.categorySearchDefaultOpen, defaultDesignSettings.categorySearchDefaultOpen);
  next.showCategoryCounts = pickBool(record.showCategoryCounts, defaultDesignSettings.showCategoryCounts);
  next.providerCallStripStyle = pickEnum(record.providerCallStripStyle, ["sky", "emerald", "solid-blue"] as const, defaultDesignSettings.providerCallStripStyle);
  next.cardAnimationSpeed = pickEnum(
    record.cardAnimationSpeed,
    ["ultra-slow", "slow", "instant", "fast", "normal", "smooth", "cinematic", "spring", "bouncy"] as const,
    defaultDesignSettings.cardAnimationSpeed,
  );
  next.officeAddress = pickText(record.officeAddress, defaultDesignSettings.officeAddress, 240);
  next.officeWorkingHours = pickText(record.officeWorkingHours, defaultDesignSettings.officeWorkingHours, 160);
  next.whatsappDefaultGreeting = pickText(record.whatsappDefaultGreeting, defaultDesignSettings.whatsappDefaultGreeting, 240);
  next.allowPublicSubmissions = pickBool(record.allowPublicSubmissions, defaultDesignSettings.allowPublicSubmissions);
  next.detailNameBoxColor = hexColor(record.detailNameBoxColor, defaultDesignSettings.detailNameBoxColor);
  next.outerCardStyle = pickEnum(record.outerCardStyle, ["modern", "bordered", "soft-gradient"] as const, defaultDesignSettings.outerCardStyle);
  next.searchTriggerStyle = pickEnum(record.searchTriggerStyle, ["pill-gradient", "glass-outline", "gold-accent"] as const, defaultDesignSettings.searchTriggerStyle);
  next.badgesDefaultOpen = pickBool(record.badgesDefaultOpen, defaultDesignSettings.badgesDefaultOpen);

  next.sponsorModalEnabled = pickBool(record.sponsorModalEnabled, defaultDesignSettings.sponsorModalEnabled);
  const rawDelay = typeof record.sponsorModalDelaySeconds === "number" ? record.sponsorModalDelaySeconds : Number(record.sponsorModalDelaySeconds);
  next.sponsorModalDelaySeconds = Number.isFinite(rawDelay) && rawDelay >= 0 && rawDelay <= 60 ? Math.round(rawDelay) : defaultDesignSettings.sponsorModalDelaySeconds;
  next.sponsorModalTitle = pickText(record.sponsorModalTitle, defaultDesignSettings.sponsorModalTitle, 200);
  next.sponsorModalSubtitle = pickText(record.sponsorModalSubtitle, defaultDesignSettings.sponsorModalSubtitle, 600);
  next.sponsorModalOfferBanner = pickText(record.sponsorModalOfferBanner, defaultDesignSettings.sponsorModalOfferBanner, 400);
  next.sponsorModalPhone = pickText(record.sponsorModalPhone, defaultDesignSettings.sponsorModalPhone, 30);
  next.showDailyOffersSection = pickBool(record.showDailyOffersSection, defaultDesignSettings.showDailyOffersSection);
  next.showSponsorsRibbon = pickBool(record.showSponsorsRibbon, defaultDesignSettings.showSponsorsRibbon);
  next.sponsoredProvidersJson = typeof record.sponsoredProvidersJson === "string" && record.sponsoredProvidersJson.trim()
    ? JSON.stringify(parseSponsoredProviders(record.sponsoredProvidersJson))
    : defaultDesignSettings.sponsoredProvidersJson;

  next.darkPageBgColor = hexColor(record.darkPageBgColor, defaultDesignSettings.darkPageBgColor);
  next.darkCardBgColor = hexColor(record.darkCardBgColor, defaultDesignSettings.darkCardBgColor);
  next.darkBorderColor = hexColor(record.darkBorderColor, defaultDesignSettings.darkBorderColor);
  next.darkPrimaryColor = hexColor(record.darkPrimaryColor, defaultDesignSettings.darkPrimaryColor);
  next.shimmerEffectEnabled = pickBool(record.shimmerEffectEnabled, defaultDesignSettings.shimmerEffectEnabled);

  return next;
}

export function parseColorScaleOrThemeJson(
  rawInput: string,
  base: DesignSettings = defaultDesignSettings,
): { settings: DesignSettings; detectedFormat: "scale-50-950" | "design-json"; label: string } {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) {
    throw new Error("النص أو الملف فارغ.");
  }

  // First try parsing as full DesignSettings JSON (or { settings: {...} })
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.primaryColor === "string" || typeof obj.pageBgColor === "string" || typeof obj.themePreset === "string") {
        return {
          settings: sanitizeDesignSettings({ ...base, ...obj }),
          detectedFormat: "design-json",
          label: "ملف إعدادات مظهر كامل (JSON)",
        };
      }
      if (obj.settings && typeof obj.settings === "object") {
        return {
          settings: sanitizeDesignSettings({ ...base, ...(obj.settings as Record<string, unknown>) }),
          detectedFormat: "design-json",
          label: typeof obj.name === "string" ? obj.name : "ملف ثيم JSON",
        };
      }
    }
  } catch {
    // Fall through to regex extraction for Tailwind/UI Colors JS/JSON snippets (e.g. 'royal-blue': { '50': '#edf7ff', ... })
  }

  // Extract shade pairs ('50': '#edf7ff' or "50": "#edf7ff" or 50: "#edf7ff")
  const shadeRegex = /['"]?(50|100|200|300|400|500|600|700|800|900|950)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/g;
  const shades: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = shadeRegex.exec(trimmed)) !== null) {
    shades[match[1]] = match[2];
  }

  if (Object.keys(shades).length >= 3) {
    const nameMatch = /['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*\{/.exec(trimmed);
    const scaleName = nameMatch?.[1] ?? "custom-scale";
    const s50 = shades["50"] || base.pageBgColor;
    const s100 = shades["100"] || s50;
    const s200 = shades["200"] || s100;
    const s400 = shades["400"] || shades["300"] || "#50b4ff";
    const s600 = shades["600"] || shades["500"] || base.buttonColor;
    const s700 = shades["700"] || s600;
    const s800 = shades["800"] || s700;
    const s900 = shades["900"] || s800;
    const s950 = shades["950"] || s900;

    const merged = sanitizeDesignSettings({
      ...base,
      themePreset: scaleName === "royal-blue" ? "royal-blue" : "custom",
      pageBgColor: s50,
      modalHeaderBg: s100,
      borderColor: s200,
      authInputBorderColor: s200,
      buttonColor: s600,
      primaryColor: s700,
      announcementBgColor: s800,
      detailNameBoxColor: s900,
      footerBgColor: s950,
      darkPageBgColor: s950,
      darkCardBgColor: s900,
      darkBorderColor: s800,
      darkPrimaryColor: s400,
    });

    return {
      settings: merged,
      detectedFormat: "scale-50-950",
      label: `تدرج ألوان (${scaleName}) للنهاري والليلي`,
    };
  }

  throw new Error("لم يتم العثور على درجات ألوان صالحة (50–950) أو إعدادات JSON.");
}

export type PublicDirectory = {
  services: ServiceRecord[]; categories: CategoryRecord[];
  areas: AreaRecord[]; settings: SiteSettings; memberCount: number; previewMode?: boolean;
  utilityNumbers?: PublicUtilityContact[];
  providerNotifications?: NotificationRecord[];
  designSettings?: DesignSettings;
  /** Live promotional banners for the rotating ad slot (image bytes are served separately by /api/ad-banner/:id). */
  ads?: AdBannerRecord[];
  /** Advertising price list in Egyptian pounds shown in the ad slot and the request message. */
  adPricing?: AdPricing;
  /** Upcoming (and recent) village events for the calendar page and the ticker. */
  events?: VillageEventRecord[];
  /** Seasonal greetings active today (computed server-side in Cairo time). */
  greetings?: ActiveGreeting[];
  /** «أهم مهن القرية»: up to 8 specialties ranked by real usage (views + 2×contacts), topped up by provider count. */
  topCategories?: TopCategoryRecord[];
};

export type TopCategoryRecord = { id: string; score: number; providers: number; pinned?: boolean };

/** Rotating ad banner metadata (never includes the image payload). */
export type AdBannerRecord = {
  id: string; title: string; caption: string; serviceId: string | null; whatsapp: string;
  active: boolean; startsAt: string | null; endsAt: string | null; sortOrder: number;
  durationSeconds: number; imageMime: string; imageVersion: number; hasImage: boolean; createdAt: string;
  /** Built-in animated template id; empty when the ad shows an uploaded image. */
  template: string;
  transition: string;
  motion: string;
  accentColor: string;
};
export const AD_TRANSITIONS = [
  { id: "random", name: "عشوائي (مختلف كل مرة)" },
  { id: "fade", name: "تلاشي ناعم" },
  { id: "slide", name: "انزلاق جانبي" },
  { id: "zoom", name: "تكبير" },
  { id: "flip", name: "قلب ثلاثي الأبعاد" },
  { id: "blur", name: "ضبابي ثم واضح" },
  { id: "curtain", name: "ستارة" },
  { id: "drop", name: "سقوط من أعلى" },
] as const;
export const AD_MOTIONS = [
  { id: "kenburns", name: "تقريب بطيء (Ken Burns)" },
  { id: "float", name: "طفو خفيف" },
  { id: "pulse", name: "نبض" },
  { id: "shine", name: "لمعة تمر على الإعلان" },
  { id: "tilt", name: "ميل ثلاثي الأبعاد" },
  { id: "none", name: "ثابت بدون حركة" },
] as const;
export type AdTransition = (typeof AD_TRANSITIONS)[number]["id"];
export type AdMotion = (typeof AD_MOTIONS)[number]["id"];
export function isAdTransition(value: unknown): value is AdTransition { return typeof value === "string" && AD_TRANSITIONS.some((item) => item.id === value); }
export function isAdMotion(value: unknown): value is AdMotion { return typeof value === "string" && AD_MOTIONS.some((item) => item.id === value); }
export function isHexColor(value: unknown): value is string { return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value); }
/** Lightens/darkens a hex colour by mixing with white (positive) or black (negative). */
export function shadeHex(hex: string, amount: number) {
  if (!isHexColor(hex)) return hex;
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16);
    const mixed = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount);
    return Math.round(Math.min(255, Math.max(0, mixed))).toString(16).padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
export const AD_ACCENT_PRESETS = ["#0b63c9", "#059669", "#e11d48", "#7c3aed", "#f59e0b", "#0891b2", "#b45309", "#111827"];
/** Pick the next effect; "random" never repeats the previous one so consecutive slides always look different. */
export function nextAdTransition(preferred: string, previous: string): Exclude<AdTransition, "random"> {
  const pool = AD_TRANSITIONS.map((item) => item.id).filter((id): id is Exclude<AdTransition, "random"> => id !== "random");
  if (preferred !== "random" && isAdTransition(preferred)) return preferred as Exclude<AdTransition, "random">;
  const candidates = pool.filter((id) => id !== previous);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
export type AdRequestRecord = { id: string; name: string; business: string; phone: string; tierLabel: string; kind: string; template: string; notes: string; status: string; createdAt: string };
export const AD_REQUEST_KINDS: Record<string, string> = { template: "قالب متحرك جاهز من التطبيق", gif: "عندي GIF جاهز", design: "محتاج تصميم إعلان" };
/** Ready-made animated banners the admin can publish without uploading a file. Title/caption of the ad override the defaults. */
export type AdTemplateId = "ad-space" | "app-promo" | "add-profession" | "special-offer" | "grand-opening" | "design-office" | "greeting" | "pro-of-week" | "shop-of-month" | "most-reviewed" | "new-in-directory";
export const adTemplates: { id: AdTemplateId; name: string; description: string; title: string; caption: string; auto?: boolean }[] = [
  { id: "pro-of-week", name: "مهني الأسبوع (تلقائي)", description: "يختار أعلى مهني تقييمًا كل أسبوع ويعرضه تلقائيًا — محتوى مجاني يحرّك المساحة.", title: "مهني الأسبوع", caption: "اختيار الأسبوع من أعلى التقييمات في جنزور", auto: true },
  { id: "shop-of-month", name: "محل الشهر (تلقائي)", description: "أعلى محل تقييمًا في قسم المحلات، يتبدّل كل شهر.", title: "محل الشهر", caption: "اختيار الشهر من محلات جنزور الأعلى تقييمًا", auto: true },
  { id: "most-reviewed", name: "الأكثر طلبًا (تلقائي)", description: "المهني صاحب أكبر عدد تقييمات من الأعضاء — يتبدّل أسبوعيًا بين الأعلى خمسة.", title: "الأكثر طلبًا", caption: "الأكثر تقييمًا من أعضاء الدليل", auto: true },
  { id: "new-in-directory", name: "جديد في الدليل (تلقائي)", description: "يرحّب بآخر مهني انضم للدليل ويعرّف الناس عليه.", title: "جديد في الدليل", caption: "انضم حديثًا لدليل جنزور — رحّبوا به", auto: true },
  { id: "ad-space", name: "مساحة إعلانية — اطلب الآن", description: "دعوة للمعلنين مع السعر بالجنيه.", title: "مساحة إعلانية", caption: "إعلانك هنا يوصل لكل أهل جنزور — اطلب الآن" },
  { id: "app-promo", name: "التطبيق: الاسم والأيقونة ونبذة", description: "يعرض شعار التطبيق واسمه ونبذة قصيرة.", title: "", caption: "كل مهن وخدمات جنزور في مكان واحد — ابحث، اتصل، وشارك" },
  { id: "add-profession", name: "أضف مهنتك مجانًا", description: "يشجع أصحاب المهن على التسجيل.", title: "أضف مهنتك مجانًا", caption: "سجّل في الدليل وخلّي أهل جنزور يوصلولك بضغطة" },
  { id: "special-offer", name: "عرض خاص", description: "لافتة عروض وخصومات باسم المعلن.", title: "عرض خاص", caption: "خصم لفترة محدودة — اسأل عن التفاصيل" },
  { id: "grand-opening", name: "افتتاح جديد", description: "إعلان افتتاح محل أو عيادة جديدة.", title: "افتتاح جديد", caption: "نورونا — زورونا واستمتعوا بعروض الافتتاح" },
  { id: "design-office", name: "مكتب الجمال للدعاية والإعلان", description: "تصميم إعلانك المتحرك وطباعتك.", title: "مكتب الجمال للدعاية والإعلان", caption: "تصميم إعلانات متحركة ولافتات وكروت — كلّمنا واتساب" },
  { id: "greeting", name: "تهنئة ومناسبات", description: "كل عام وأنتم بخير / تهنئة باسم المعلن.", title: "كل عام وأنتم بخير", caption: "أطيب التهاني لأهل جنزور الكرام" },
];
/** ISO-8601 week number, used so the automatic "provider of the week" changes every Monday. */
export function isoWeekNumber(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(utc.getUTCFullYear(), 0, 1);
  return Math.ceil(((utc.getTime() - yearStart) / 86400000 + 1) / 7);
}
/** Top-rated approved providers; the weekly pick rotates through the best five so the slot stays fresh without admin work. */
export function pickProviderOfWeek(services: ServiceRecord[], date = new Date()): ServiceRecord | null {
  const ranked = services
    .filter((service) => service.status === "approved" && !service.demo && Number(service.rating) > 0)
    .sort((a, b) => Number(b.rating) - Number(a.rating) || b.reviews - a.reviews || Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name, "ar"));
  const pool = ranked.slice(0, 5);
  if (!pool.length) return null;
  return pool[(isoWeekNumber(date) + date.getFullYear()) % pool.length];
}
const SHOP_ROOTS = ["shops", "markets", "stores", "commerce"];
/** Resolves the provider shown by each automatic template. Returns null when the directory has no suitable provider yet. */
export function autoTemplateService(template: string, services: ServiceRecord[], categories: CategoryRecord[] = [], date = new Date()): ServiceRecord | null {
  const approved = services.filter((service) => service.status === "approved" && !service.demo);
  if (template === "pro-of-week") return pickProviderOfWeek(services, date);
  if (template === "most-reviewed") {
    const pool = approved.filter((service) => service.reviews > 0).sort((a, b) => b.reviews - a.reviews || Number(b.rating) - Number(a.rating)).slice(0, 5);
    return pool.length ? pool[(isoWeekNumber(date) + 2) % pool.length] : null;
  }
  if (template === "new-in-directory") {
    return [...approved].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
  }
  if (template === "shop-of-month") {
    const shopIds = new Set(categories.filter((category) => SHOP_ROOTS.includes(category.id) || SHOP_ROOTS.includes(category.parentId ?? "") || /محل|متجر|سوبر|بقال/.test(category.name)).map((category) => category.id));
    const shops = approved.filter((service) => shopIds.has(service.category)).sort((a, b) => Number(b.rating) - Number(a.rating) || b.reviews - a.reviews || a.name.localeCompare(b.name, "ar"));
    const pool = (shops.length ? shops : approved.filter((service) => Number(service.rating) > 0).sort((a, b) => Number(b.rating) - Number(a.rating))).slice(0, 5);
    return pool.length ? pool[(date.getFullYear() * 12 + date.getMonth()) % pool.length] : null;
  }
  return null;
}
export function isAdTemplateId(value: unknown): value is AdTemplateId { return typeof value === "string" && adTemplates.some((template) => template.id === value); }
export function getAdTemplate(id: string) { return adTemplates.find((template) => template.id === id) ?? null; }
/** Advertising price list shown to members (Egyptian pounds), editable by the admin. */
export type AdPricingTier = { label: string; days: number; price: number };
export type AdPricing = { enabled: boolean; tiers: AdPricingTier[]; note: string };
export const AD_CURRENCY = "ج.م";
export const defaultAdPricing: AdPricing = {
  enabled: true,
  tiers: [
    { label: "أسبوع", days: 7, price: 150 },
    { label: "شهر", days: 30, price: 400 },
    { label: "٣ شهور", days: 90, price: 1000 },
  ],
  note: "السعر يشمل ظهور الإعلان في كل صفحات الدليل. تصميم الـ GIF متاح بسعر إضافي عند الطلب.",
};
export function sanitizeAdPricing(value: unknown): AdPricing {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawTiers = Array.isArray(input.tiers) ? input.tiers.slice(0, 6) : defaultAdPricing.tiers;
  const tiers = rawTiers.flatMap((tier): AdPricingTier[] => {
    if (!tier || typeof tier !== "object") return [];
    const record = tier as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim().slice(0, 40) : "";
    const days = Number(record.days), price = Number(record.price);
    if (!label || !Number.isFinite(days) || days < 1 || days > 3650 || !Number.isFinite(price) || price < 0 || price > 1_000_000) return [];
    return [{ label, days: Math.round(days), price: Math.round(price) }];
  });
  return { enabled: input.enabled !== false, tiers: tiers.length ? tiers : defaultAdPricing.tiers, note: typeof input.note === "string" ? input.note.trim().slice(0, 300) : defaultAdPricing.note };
}
export function formatEgp(amount: number) { return `${amount.toLocaleString("ar-EG")} ${AD_CURRENCY}`; }
export function cheapestAdTier(pricing: AdPricing) { return pricing.tiers.reduce<AdPricingTier | null>((best, tier) => (!best || tier.price < best.price ? tier : best), null); }
/** WhatsApp text generated by the public «أعلن معنا» request form. */
export function advertiseRequestMessage(input: { siteName: string; name: string; business: string; phone: string; tier?: AdPricingTier | null; kind: string; template?: string; notes: string }) {
  const lines = [
    `مرحبًا، أرغب في حجز إعلان متحرك في ${input.siteName}.`,
    `الاسم: ${input.name || "—"}`,
    `النشاط / المحل: ${input.business || "—"}`,
    `رقم التواصل: ${input.phone || "—"}`,
    input.tier ? `الباقة: ${input.tier.label} (${input.tier.days} يوم) — ${formatEgp(input.tier.price)}` : "الباقة: أحتاج استشارة",
    `نوع الإعلان: ${input.kind}${input.template ? ` — قالب «${getAdTemplate(input.template)?.name ?? input.template}»` : ""}`,
  ];
  if (input.notes.trim()) lines.push(`ملاحظات: ${input.notes.trim()}`);
  return lines.join("\n");
}
export function adPricingSummary(pricing: AdPricing) { return pricing.tiers.map((tier) => `${tier.label}: ${formatEgp(tier.price)}`).join(" • "); }
export const AD_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const AD_IMAGE_MIMES = ["image/gif", "image/png", "image/jpeg", "image/webp"] as const;
export const AD_MIN_SECONDS = 3, AD_MAX_SECONDS = 60, AD_MAX_COUNT = 10;
/** Whether an ad should be displayed right now: active, has artwork and inside its optional date window. */
export function isAdLive(ad: Pick<AdBannerRecord, "active" | "startsAt" | "endsAt" | "hasImage"> & { template?: string }, now = Date.now()) {
  if (!ad.active || !(ad.hasImage || ad.template)) return false;
  if (ad.startsAt) { const start = Date.parse(ad.startsAt); if (Number.isFinite(start) && start > now) return false; }
  if (ad.endsAt) { const end = Date.parse(ad.endsAt); if (Number.isFinite(end) && end <= now) return false; }
  return true;
}
export function adImageUrl(ad: Pick<AdBannerRecord, "id" | "imageVersion">) { return `/api/ad-banner/${ad.id}?v=${ad.imageVersion}`; }
/** Parses a `data:image/...;base64,...` upload, enforcing the allowed formats and the size cap. */
export function parseAdImageDataUrl(value: unknown): { mime: string; base64: string } {
  if (typeof value !== "string") throw new Error("ارفع صورة الإعلان أولًا.");
  const match = /^data:(image\/(?:gif|png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(value.trim());
  if (!match) throw new Error("صيغة الصورة غير مدعومة. ارفع GIF أو PNG أو JPG أو WebP.");
  const base64 = match[2].replace(/\s+/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes < 100) throw new Error("ملف الصورة فارغ أو تالف.");
  if (bytes > AD_IMAGE_MAX_BYTES) throw new Error("حجم الصورة أكبر من ٣ ميجا. صغّر الـ GIF وحاول مرة أخرى.");
  return { mime: match[1], base64 };
}
/** أيقونات «الملصقات 3D» الجاهزة (مولّدة بأسلوب صورة المرجع) — ملف WebP 256px لكل تخصص/قسم في `/images/specialty-stickers/`. */
export const stickerIconIds = [
  // الحرفيين (القسم + 16 تخصصًا)
  "crafts", "carpentry", "plumbing", "electricity", "metalwork", "painting", "masonry", "tiles", "aluminum", "glass", "ac", "mechanics", "upholstery", "satellite-dish", "locksmith", "gypsum-decor", "appliance-repair",
  // العيادات (القسم + 11 تخصصًا)
  "clinics", "family", "pediatrics", "dentistry", "gynecology", "orthopedics", "dermatology", "ophthalmology", "ent", "physiotherapy", "home-nursing", "psychiatry",
  // مقصوصة من صورة المرجع مباشرة
  "labs", "medical-labs", "pharmacies", "photography", "lawyers", "law",
  // المحلات (القسم + 14 تخصصًا)
  "shops", "groceries", "butchers", "poultry", "fish-shops", "produce", "bakeries", "cafes", "clothing", "mobile-shops", "food", "stationery", "appliances", "hardware", "furniture",
  // الصيدليات (3 تخصصات؛ القسم أعلاه)
  "community-pharmacies", "night-pharmacies", "medical-supplies",
  // الحلاقة والتجميل (القسم + 3)
  "beauty", "barbers", "hairdressers", "makeup",
  // مواد المدرسين
  "tch-arabic", "tch-english", "tch-math", "tch-science", "tch-social", "tch-physics", "tch-chemistry", "tch-biology", "tch-french", "tch-religion",
  "tch-foundation", "tch-german", "tch-computer", "tch-geology", "tch-philosophy", "tch-psychology", "tch-history", "tch-geography", "tch-center",
  // العيادات (10 تخصصات إضافية مقصوصة من صورة المرجع)
  "cardiology", "pulmonology", "neurology", "gastroenterology", "urology", "endocrinology", "radiology", "cosmetic-surgery", "andrology", "medical-centers",
  // خدمات أخرى (10 تخصصات إضافية)
  "engineering-office", "programming", "accounting", "travel", "catering", "security", "arts", "real-estate", "nurseries", "water-filters",
  // الطباعة والدعاية: التصميم الجرافيكي (مقصوص من المرجع)
  "graphic-design",
  // الأفراح والمناسبات (القسم + 3؛ التصوير أعلاه)
  "events", "dj", "wedding-planning",
  // النقل والتوصيل (القسم + 3)
  "transport", "moving", "freight", "rides",
  // النظافة (القسم + 2)
  "cleaning", "apartment-cleaning", "carpet-cleaning",
  // الطباعة والدعاية (القسم + 3؛ التصميم الجرافيكي أعلاه)
  "printing", "print-shops", "advertising",
  // الجمعيات الخيرية (القسم + 3)
  "charities", "community-support", "charitable-associations", "orphan-care",
  // المحاماة والاستشارات (3؛ القسم والقضايا أعلاه)
  "legal-consulting", "contracts",
  // خدمات أخرى (القسم + 8)
  "other-services", "cameras", "solar", "tailors", "laundry", "other", "veterinary", "gyms", "agri-engineering",
  // المدرسين (القسم؛ تخصصاته يضيفها المدير)
  "teachers",
] as const;
export function hasStickerIcon(categoryId: string) { return (stickerIconIds as readonly string[]).includes(categoryId); }
export function stickerIconUrl(categoryId: string) { return `/images/specialty-stickers/${categoryId}.webp`; }
/** رابط الأيقونة المرفوعة من الإدارة؛ يحمل رقم النسخة ليُخزَّن في المتصفح بأمان. */
export function categoryImageUrl(category: Pick<CategoryRecord, "id" | "imageVersion">) { return `/api/category-icon/${category.id}?v=${category.imageVersion ?? 0}`; }
/** الصورة التي تمثّل التصنيف بالملصقات: المرفوعة أولًا ثم الجاهزة، وإلا فارغ (يرجع للرسم اليدوي/التلقائي). */
export function categoryStickerSrc(category: Pick<CategoryRecord, "id" | "imageVersion"> & { name?: string }): string {
  if (category.imageVersion) return categoryImageUrl(category);
  if (hasStickerIcon(category.id)) return stickerIconUrl(category.id);
  const byName = category.name ? stickerIdForName(category.name) : "";
  return byName ? stickerIconUrl(byName) : "";
}
/** ملصقات إضافية غير مرتبطة بتخصص مُضمَّن (تُستخدم عبر مطابقة الاسم فقط). */
const extraStickerIds = ["computer-services", "demolition"] as const;
/** مطابقة ملصق جاهز حسب اسم التخصص — للتخصصات التي أنشأها الأدمن بمعرّف عشوائي ولم يرفع لها أيقونة. */
const stickerNameHints: [string, RegExp][] = [
  ["mobile-shops", /موبايل|هواتف|هاتف|محمول|تليفون/],
  ["computer-services", /كمبيوتر|حاسب|حاسوب|لاب ?توب/],
  ["demolition", /هدم|تكسير|هدّ|تخريم/],
  ["cameras", /كاميرا|مراقبة/],
];
export function stickerIdForName(name: string): string {
  for (const [id, pattern] of stickerNameHints) if (pattern.test(name) && (hasStickerIcon(id) || (extraStickerIds as readonly string[]).includes(id))) return id;
  return "";
}
/** صورة معاينة المشاركة (واتساب/فيسبوك) للقسم أو التخصص: ملصقه + اسمه، تُولَّد بـ scripts/make-category-og.cjs (نفس هوية og-style.cjs). فارغ = تُستخدم صورة الدليل العامة. */
export const OG_IMAGE_VERSION = 2;
export function categoryOgImage(categoryId: string, name: string) {
  if (!hasStickerIcon(categoryId)) return undefined;
  return [{ url: `/images/og/${categoryId}.jpg?v=${OG_IMAGE_VERSION}`, width: 1200, height: 630, type: "image/jpeg", alt: `${name} — دليل المهن والخدمات بقرية جنزور` }];
}
export const CATEGORY_ICON_MAX_BYTES = 800 * 1024;
/** يتحقق من صورة أيقونة مرفوعة (PNG/JPG/WebP/GIF حتى 800 كيلوبايت). */
export function parseCategoryIconDataUrl(value: unknown): { mime: string; base64: string } {
  if (typeof value !== "string") throw new Error("ارفع صورة الأيقونة أولًا.");
  const match = /^data:(image\/(?:gif|png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(value.trim());
  if (!match) throw new Error("صيغة الأيقونة غير مدعومة. ارفع PNG أو JPG أو WebP.");
  const base64 = match[2].replace(/\s+/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes < 100) throw new Error("ملف الأيقونة فارغ أو تالف.");
  if (bytes > CATEGORY_ICON_MAX_BYTES) throw new Error("حجم الأيقونة أكبر من 800 كيلوبايت. صغّر الصورة (256×256 يكفي) وحاول مرة أخرى.");
  return { mime: match[1], base64 };
}
/** صور المظهر القابلة للرفع من استوديو التصميم. */
export const DESIGN_IMAGE_KEYS = ["header-logo", "splash", "auth-banner", "auth-banner-dark", "register-banner", "register-banner-dark", "hero-banner", "hero-banner-dark"] as const;
export type DesignImageKey = (typeof DESIGN_IMAGE_KEYS)[number];
export function isDesignImageKey(value: unknown): value is DesignImageKey { return typeof value === "string" && (DESIGN_IMAGE_KEYS as readonly string[]).includes(value); }
export const DESIGN_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
/** 1 سم على الشاشة ≈ 37.8 بكسل (96 نقطة/بوصة) — يُستخدم لكتابة مقاسات البانرات بالسنتيمتر كما طلب المدير. */
export const PX_PER_CM = 96 / 2.54;
export function pxToCm(px: number, digits = 1): string {
  const cm = px / PX_PER_CM;
  return cm.toFixed(digits).replace(/\.0$/, "");
}
/** المقاس المقترح لكل صورة مظهر: بالبكسل الفعلي وبالسنتيمتر. */
export const DESIGN_IMAGE_GUIDE: Record<DesignImageKey, { label: string; width: number; height: number; hint: string }> = {
  "header-logo": { label: "لوجو الهيدر", width: 300, height: 300, hint: "مربع بخلفية شفافة (PNG) يظهر صغيرًا بجانب اسم الدليل" },
  "splash": { label: "صورة شاشة البداية", width: 600, height: 600, hint: "مربع بخلفية شفافة؛ تتجمع حوله الملصقات 3D" },
  "auth-banner": { label: "بانر تسجيل الدخول (الوضع الفاتح)", width: 1200, height: 500, hint: "عريض؛ يظهر في لوحة الصورة بشاشة تسجيل الدخول" },
  "auth-banner-dark": { label: "بانر تسجيل الدخول (الوضع الداكن)", width: 1200, height: 500, hint: "نفس المقاس؛ يظهر بدل الفاتح عند تفعيل الوضع الليلي" },
  "register-banner": { label: "بانر العضوية (الوضع الفاتح)", width: 1200, height: 500, hint: "عريض؛ يظهر في شاشة إنشاء العضوية" },
  "register-banner-dark": { label: "بانر العضوية (الوضع الداكن)", width: 1200, height: 500, hint: "نفس المقاس؛ يظهر بدل الفاتح عند تفعيل الوضع الليلي" },
  "hero-banner": { label: "البانر الترحيبي الرئيسي", width: 2048, height: 768, hint: "عريض 8:3 مثل صورة سماء جنزور الافتراضية؛ يظهر أعلى الصفحة الرئيسية فوق مربع البحث" },
  "hero-banner-dark": { label: "البانر الترحيبي الرئيسي (الوضع الداكن)", width: 2048, height: 768, hint: "نفس المقاس 8:3؛ يظهر بدل الفاتح عند تفعيل الوضع الليلي (فارغ = النسخة الليلية الافتراضية)" },
};
/** البانرات الافتراضية المصممة للتطبيق (WebP خفيفة ≈ 100 ك.ب). */
export const AUTH_BANNER_DEFAULTS = {
  login: { light: "/images/auth-banner-default.webp", dark: "/images/auth-banner-default-dark.webp" },
  register: { light: "/images/register-banner-default.webp", dark: "/images/register-banner-default-dark.webp" },
} as const;
/** البانر الترحيبي الافتراضي أعلى الرئيسية: سماء جنزور نهارًا، ونسخة ليلية منها للوضع الداكن (نفس النصوص حرفيًا). */
export const HERO_BANNER_DEFAULTS = { light: "/images/home-banner-sky.png", dark: "/images/home-banner-sky-dark.webp" } as const;
export function resolveHeroBanner(design: Pick<DesignSettings, "heroBannerImage" | "heroBannerImageDark">, dark: boolean) {
  if (dark) return design.heroBannerImageDark || design.heroBannerImage || HERO_BANNER_DEFAULTS.dark;
  return design.heroBannerImage || HERO_BANNER_DEFAULTS.light;
}
/**
 * اختيار بانر شاشة الدخول/العضوية: المخصص المطابق للصفحة والوضع أولًا، ثم المخصص الأقرب، ثم الافتراضي.
 * العضوية ترث بانر الدخول المخصص حتى لا يتغير سلوك من رفع بانرًا واحدًا قبل إضافة الخانات الجديدة.
 */
export function resolveAuthBanner(design: Pick<DesignSettings, "authBannerImage" | "authBannerImageDark" | "registerBannerImage" | "registerBannerImageDark">, page: "login" | "register", dark: boolean) {
  const defaults = AUTH_BANNER_DEFAULTS[page];
  if (page === "register") {
    if (dark) return design.registerBannerImageDark || design.registerBannerImage || design.authBannerImageDark || design.authBannerImage || defaults.dark;
    return design.registerBannerImage || design.authBannerImage || defaults.light;
  }
  if (dark) return design.authBannerImageDark || design.authBannerImage || defaults.dark;
  return design.authBannerImage || defaults.light;
}
export function designImageSizeText(key: DesignImageKey) {
  const guide = DESIGN_IMAGE_GUIDE[key];
  return `${pxToCm(guide.width)} × ${pxToCm(guide.height)} سم (≈ ${guide.width} × ${guide.height} بكسل)`;
}
export function designImageUrl(key: DesignImageKey, version: number) { return `/api/design-image/${key}?v=${version}`; }
/** يتحقق من صورة مظهر مرفوعة (PNG/JPG/WebP/GIF حتى 2 ميجابايت). */
export function parseDesignImageDataUrl(value: unknown): { mime: string; base64: string } {
  if (typeof value !== "string") throw new Error("اختر صورة من جهازك أولًا.");
  const match = /^data:(image\/(?:gif|png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(value.trim());
  if (!match) throw new Error("صيغة الصورة غير مدعومة. ارفع PNG أو JPG أو WebP أو GIF.");
  const base64 = match[2].replace(/\s+/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes < 100) throw new Error("ملف الصورة فارغ أو تالف.");
  if (bytes > DESIGN_IMAGE_MAX_BYTES) throw new Error("حجم الصورة أكبر من 2 ميجابايت. صغّر الصورة وحاول مرة أخرى.");
  return { mime: match[1], base64 };
}
export type RatingRecord = { id: string; serviceId: string; serviceName: string; memberName: string; stars: number; comment: string; status: string; createdAt: string };
export type ServiceComment = { stars: number; comment: string; member: string; date: string };
export type FollowFeedItem = { id: string; createdAt: string };
export type FollowState = { followed: string[]; feed: FollowFeedItem[] };
export type ActivityLogRecord = { id: string; actorRole: string; actorName: string; actorUsername: string; action: string; entityKind: string; entityId: string; entityLabel: string; detail: string; createdAt: string };
/** لوحات ألوان لوحة الإدارة (اختيار مشترك لكل الأدمنز والمشرفين يُحفظ في الإعدادات). */
export const ADMIN_PALETTE_IDS = ["indigo", "teal", "graphite", "maroon", "midnight", "copper", "forest", "ocean", "plum", "cocoa", "rose", "steel", "royal"] as const;
export type AdminPaletteId = (typeof ADMIN_PALETTE_IDS)[number];
export const DEFAULT_ADMIN_PALETTE: AdminPaletteId = "indigo";
export function sanitizeAdminPalette(value: unknown): AdminPaletteId {
  return typeof value === "string" && (ADMIN_PALETTE_IDS as readonly string[]).includes(value) ? (value as AdminPaletteId) : DEFAULT_ADMIN_PALETTE;
}
export type AdminDirectory = PublicDirectory & { adminPalette?: AdminPaletteId; activityLog?: ActivityLogRecord[]; ads: AdBannerRecord[]; adRequests: AdRequestRecord[]; greetingSettings: GreetingSettings; members: MemberRecord[]; communityListings: CommunityListingRecord[]; notifications: NotificationRecord[]; notificationUnread: number; ratings: RatingRecord[]; whatsappAlertKinds?: string[]; whatsappAlertStatus?: { lastSentAt: string | null; lastResult: string; lastKind: string } };

export const defaultSettings: SiteSettings = {
  siteName: "دليل المهن والخدمات بقرية جنزور",
  heroSubtitle: "أهل الخبرة قريبين منك.. كل خدمات جنزور في مكان واحد",
  heroEyebrow: "دليل أهل جنزور", tagline: "بسهولة • بسرعة • بثقة",
  benefitsHeading: "ليه تختار دليل قرية جنزور؟",
  benefitsText: "دليل يجمع أهل القرية.. ويوصّل كل خدمة لأصحابها",
  contactText: "لمتابعة طلب إضافة مهنة، أو أي استفسار عن الدليل، تواصل مع مكتب الجمال مباشرة.",
  copyright: "جميع الحقوق محفوظة لمكتب الجمال للدعاية والإعلان.", phone: OFFICE_PHONE,
  showEmergency: true,
  whatsappAlertsNumber: "", whatsappAlertsApiKey: "",
};

// Settings rows saved by older releases still carry advertising fields (adPrice, adDays, marquee*).
// Only the current keys are ever served, so removed settings cannot leak back to the client.
export const settingsTextKeys = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright", "phone"] as const;
export function sanitizeSettings(saved: Record<string, unknown>): SiteSettings {
  const next: SiteSettings = { ...defaultSettings };
  for (const key of settingsTextKeys) { const value = saved[key]; if (typeof value === "string" && value.trim()) next[key] = value; }
  next.copyright = next.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").replace(/\s{2,}/g, " ").trim() || defaultSettings.copyright;
  if (typeof saved.showEmergency === "boolean") next.showEmergency = saved.showEmergency;
  for (const key of ["whatsappAlertsNumber", "whatsappAlertsApiKey"] as const) { const value = saved[key]; if (typeof value === "string") next[key] = value.trim(); }
  return next;
}

export const areas = ["جنزور / الناحية الشرقية", "جنزور / الناحية الغربية", "جنزور / بجوار المسجد البحري", "جنزور / شارع حسيب", "جنزور / السوق القديم", "جنزور / بجوار مكتبة الجمال", "جنزور / شارع السويقة"];

const sectionDescriptions: Record<string, string> = {
  crafts: "يجمع الحرفيين والفنيين المتخصصين في أعمال الصيانة والتشطيبات والإصلاحات المختلفة داخل قرية جنزور. يساعدك على الوصول إلى أصحاب الخبرة في الحرف المختلفة والتواصل معهم لمعرفة تفاصيل الخدمات المتاحة.",
  clinics: "دليل للعيادات ومقدمي الخدمات الطبية في مختلف التخصصات، لمساعدة أهالي جنزور والمناطق المجاورة على الوصول إلى التخصص المناسب. يمكنك التعرف على بيانات التواصل مع مقدم الخدمة والاستفسار عن مواعيد الكشف.",
  labs: "يضم معامل التحاليل والخدمات المرتبطة بالفحوصات الطبية، لتسهيل الوصول إلى المعامل المتاحة داخل القرية. يمكنك التواصل مع المعمل للاستفسار عن أنواع التحاليل ومواعيد العمل والخدمات المقدمة.",
  shops: "دليل للمحلات والأنشطة التجارية داخل قرية جنزور، يشمل مجموعة متنوعة من المنتجات والاحتياجات اليومية. يساعدك على التعرف على المحلات القريبة والوصول إلى بيانات الاتصال بها للاستفسار عن المنتجات المتاحة.",
  teachers: "يضم المدرسين المتخصصين في المواد الدراسية المختلفة والمراحل التعليمية المتنوعة، لمساعدة الطلاب وأولياء الأمور على الوصول إلى المدرس المناسب. يمكنك التواصل للاستفسار عن المواد التي يتم تدريسها والمراحل الدراسية ومواعيد الحصص.",
  charities: "دليل للجمعيات والمبادرات المعنية بالعمل الخيري والتكافل المجتمعي داخل قرية جنزور. يتيح التعرف على الجهات التي تقدم أنشطة ومساعدات مجتمعية، والوصول إلى بيانات التواصل للاستفسار عن الخدمات المتاحة.",
  printing: "دليل للمطابع ومكاتب الدعاية والإعلان داخل قرية جنزور، من طباعة المستندات والكروت والمطبوعات إلى اللافتات واليفط والتصميم الجرافيكي. يساعدك على الوصول إلى الجهة المناسبة لاحتياجك والتواصل معها مباشرة.",
  events: "كل ما يحتاجه فرحك أو مناسبتك في مكان واحد: مصورين، دي جي، وتجهيز القاعات والأفراح. تواصل مباشرة مع مقدمي الخدمة لمعرفة التفاصيل والمواعيد والأسعار.",
  beauty: "صالونات الحلاقة الرجالي والكوافير وخبيرات الميكب في جنزور: قص وتصفيف وعناية بالشعر والبشرة وتجهيز العرايس والمناسبات. تواصل مباشرة لمعرفة المواعيد والأسعار.",
  transport: "دليل لخدمات النقل والتوصيل داخل قرية جنزور وخارجها: نقل العفش بسيارات مجهزة، نقل البضائع، والمشاوير الخاصة. تواصل مع السائق أو مقدم الخدمة للاتفاق على الوجهة والموعد والتكلفة.",
  cleaning: "دليل لمقدمي خدمات النظافة والعناية بالمنازل في جنزور، من تنظيف الشقق قبل السكن أو بعد التشطيب إلى غسيل السجاد والمفروشات. تواصل للاستفسار عن نوع الخدمة والمواعيد والتكلفة.",
  pharmacies: "دليل لصيدليات قرية جنزور، من الصيدليات العامة وصيدليات الـ٢٤ ساعة إلى محلات المستلزمات والأجهزة الطبية، مع إمكانية الاستفسار عن توافر الأدوية وخدمة التوصيل للمنازل.",
  law: "دليل للمحامين ومكاتب الاستشارات القانونية داخل قرية جنزور، من القضايا والمرافعات إلى الاستشارات وصياغة العقود وإجراءات الشهر العقاري. تواصل مباشرة للاستفسار عن طبيعة القضية وأتعاب الخدمة.",
  "other-services": "يضم مجموعة من الخدمات المهنية والمتخصصة التي يحتاج إليها أهالي جنزور ولا تندرج تحت الأقسام الرئيسية الأخرى. يساعدك على الوصول إلى مقدمي الخدمات المختلفة والتواصل معهم لمعرفة التفاصيل وطرق الاستفادة منها.",
};

const specialtyDescriptions: Record<string, string> = {
  "tch-center": "سناتر تعليمية ومجموعات تقوية تضم أكثر من مادة ومرحلة في مكان واحد، مع جداول الحصص وأسماء المدرسين.",
  cardiology: "أطباء القلب والأوعية الدموية: ضغط الدم، رسم القلب، الإيكو ومتابعة أمراض القلب المزمنة.",
  pulmonology: "أطباء الصدر والجهاز التنفسي: الربو والحساسية والالتهابات الرئوية وضيق التنفس.",
  neurology: "أطباء المخ والأعصاب: الصداع والصرع والجلطات وآلام الأعصاب والعمود الفقري.",
  gastroenterology: "أطباء الجهاز الهضمي والكبد: المعدة والقولون والمناظير وفيروسات الكبد.",
  urology: "أطباء المسالك البولية والكلى: الحصوات والبروستاتا والتهابات المسالك.",
  endocrinology: "أطباء الغدد الصماء والسكر: السكري والغدة الدرقية والسمنة واضطرابات الهرمونات.",
  radiology: "مراكز الأشعة والتصوير الطبي: أشعة عادية ومقطعية ورنين وموجات صوتية.",
  "cosmetic-surgery": "عيادات التجميل والليزر: إزالة الشعر، نضارة البشرة، الفيلر والبوتوكس والجراحات التجميلية.",
  andrology: "أطباء الذكورة والعقم: تأخر الإنجاب والصحة الجنسية والعلاج بالهرمونات.",
  "medical-centers": "المراكز الطبية والمستشفيات في جنزور والمناطق المجاورة: استقبال وطوارئ وعيادات متعددة.",
  "engineering-office": "مكاتب هندسية ومقاولون: تصميم ورسومات وإشراف وتنفيذ وتشطيب للمباني والفيلات.",
  programming: "مبرمجون ومصممو مواقع وتطبيقات ومتاجر إلكترونية وصفحات تواصل اجتماعي.",
  accounting: "محاسبون قانونيون: ضرائب وتأمينات وإقرارات ومسك دفاتر وتأسيس شركات.",
  travel: "مكاتب السفر والسياحة: حجز طيران ورحلات داخلية وحج وعمرة وتأشيرات.",
  catering: "طباخون وطباخات لتجهيز الولائم والعزومات والمناسبات في المنزل.",
  security: "شركات وأفراد الأمن والحراسة للمحلات والمنشآت والمناسبات.",
  arts: "رسامون وخطاطون وفنانون: لوحات وجداريات وخط عربي ولافتات فنية.",
  "real-estate": "سماسرة ومكاتب عقارية: بيع وشراء وإيجار الشقق والأراضي والمحلات.",
  nurseries: "حضانات ورياض أطفال في جنزور: رعاية وتعليم مبكر وأنشطة للأطفال.",
  "water-filters": "تركيب وصيانة فلاتر المياه وتغيير الشمعات ومحطات التحلية المنزلية.",
  "tch-arabic": "مدرسو اللغة العربية لكل المراحل: نحو وبلاغة وقراءة وتعبير وإملاء، مع متابعة الواجبات والاختبارات.",
  "tch-english": "مدرسو اللغة الإنجليزية: قواعد ومحادثة وقراءة واستعداد للامتحانات لكل المراحل الدراسية.",
  "tch-math": "مدرسو الرياضيات: حساب وجبر وهندسة وتفاضل وتكامل وإحصاء حسب المرحلة الدراسية.",
  "tch-science": "مدرسو العلوم للمرحلتين الابتدائية والإعدادية: شرح مبسط وتجارب وأسئلة الامتحانات.",
  "tch-social": "مدرسو الدراسات الاجتماعية (تاريخ وجغرافيا) للمرحلتين الابتدائية والإعدادية.",
  "tch-religion": "مدرسو التربية الدينية وتحفيظ القرآن الكريم والتجويد لكل الأعمار.",
  "tch-foundation": "تأسيس الأطفال في القراءة والكتابة والحساب وعلاج صعوبات التعلم ومرحلة الروضة.",
  "tch-french": "مدرسو اللغة الفرنسية للمرحلتين الإعدادية والثانوية كلغة ثانية.",
  "tch-german": "مدرسو اللغة الألمانية للمرحلة الثانوية كلغة ثانية.",
  "tch-computer": "مدرسو الحاسب الآلي وتكنولوجيا المعلومات والبرمجة للطلاب.",
  "tch-physics": "مدرسو الفيزياء للمرحلة الثانوية: ميكانيكا وكهربية وفيزياء حديثة مع حل المسائل.",
  "tch-chemistry": "مدرسو الكيمياء للمرحلة الثانوية: عضوية وغير عضوية ومعادلات وحسابات كيميائية.",
  "tch-biology": "مدرسو الأحياء للمرحلة الثانوية: وراثة وتشريح وتصنيف مع الرسومات والأسئلة.",
  "tch-geology": "مدرسو الجيولوجيا وعلوم البيئة للمرحلة الثانوية.",
  "tch-philosophy": "مدرسو الفلسفة والمنطق للمرحلة الثانوية (القسم الأدبي).",
  "tch-psychology": "مدرسو علم النفس والاجتماع للمرحلة الثانوية (القسم الأدبي).",
  "tch-history": "مدرسو التاريخ للمرحلة الثانوية (القسم الأدبي).",
  "tch-geography": "مدرسو الجغرافيا للمرحلة الثانوية (القسم الأدبي).",
  carpentry: "خدمات الأعمال الخشبية وتصنيع الأثاث وتركيبه وإصلاحه، بما يشمل الأبواب والشبابيك والمطابخ وغيرها من المشغولات الخشبية، وفقًا لنوع الأعمال التي يقدمها كل نجار.",
  plumbing: "خدمات تركيب وصيانة شبكات المياه والصرف الصحي وإصلاح التسريبات والأعطال المتعلقة بها. يشمل التخصص أعمال السباكة المنزلية وتجهيزات الحمامات والمطابخ حسب خبرة الفني ونطاق عمله.",
  electricity: "خدمات التركيبات والصيانة الكهربائية للمنازل والمنشآت، بما يشمل الإضاءة والمفاتيح والتوصيلات ومعالجة الأعطال. يمكن التواصل مع الفني للاستفسار عن نوع الأعمال التي يتولى تنفيذها.",
  metalwork: "أعمال تشكيل المعادن وتصنيع وتركيب المشغولات الحديدية، مثل الأبواب والشبابيك والأسوار والهياكل المعدنية. يتيح الدليل الوصول إلى الحدادين والاستفسار عن الأعمال والتصميمات المتاحة.",
  painting: "خدمات تجهيز الحوائط ودهانها وتشطيب الأسطح الداخلية والخارجية، مع تنفيذ أعمال الألوان والدهانات وفقًا لاحتياجات المكان. يمكن التواصل للاستفسار عن أنواع التشطيبات والأعمال التي يقدمها كل فني.",
  masonry: "خدمات أعمال البناء والمحارة وتجهيز الحوائط والأسطح ضمن مراحل إنشاء المباني وتشطيبها. يساعدك الدليل على الوصول إلى الفنيين والعاملين في هذا المجال والاستفسار عن الأعمال المتاحة.",
  tiles: "خدمات تركيب السيراميك والبلاط للأرضيات والحوائط، مع تنفيذ أعمال التجهيز والتسوية والتشطيب اللازمة. يمكنك التواصل مع المتخصص لمعرفة أنواع التركيبات والأعمال التي يستطيع تنفيذها.",
  aluminum: "خدمات تصنيع وتركيب وصيانة قطاعات الألوميتال المستخدمة في الأبواب والشبابيك والمطابخ والواجهات. يساعدك الدليل على الوصول إلى الفنيين والاستفسار عن المقاسات والتصميمات والأعمال المتاحة.",
  glass: "خدمات تجهيز وتركيب الزجاج والمرايا للاستخدامات المنزلية والتجارية والديكورية. يمكنك التواصل مع المتخصص للاستفسار عن المقاسات والتجهيزات وأنواع الزجاج والمرايا التي يوفرها.",
  ac: "خدمات تركيب وصيانة أجهزة التكييف والتبريد، وفحص الأعطال وتنظيف الوحدات وصيانة مكوناتها حسب تخصص الفني. يُنصح بالتواصل لمعرفة الأجهزة التي يتعامل معها ونطاق الخدمات المتاحة.",
  mechanics: "خدمات فحص وصيانة وإصلاح الأعطال الميكانيكية للسيارات، والتعامل مع المشكلات المتعلقة بالمحرك والأجزاء الميكانيكية وفقًا لتخصص الفني. يمكنك التواصل للاستفسار عن أنواع السيارات والأعمال التي يتولاها.",
  upholstery: "خدمات تنجيد وتجديد الأثاث والمقاعد والصالونات، مع تغيير الأقمشة والحشوات وإصلاح الأجزاء المتعلقة بالتنجيد. يتيح الدليل الوصول إلى المتخصصين والاستفسار عن الخامات والتصميمات والأعمال المتاحة.",
  family: "خدمات الكشف والمتابعة الطبية المتعلقة بصحة البالغين وأفراد الأسرة، وتقييم الأعراض ومتابعة الحالات التي تحتاج إلى رعاية دورية. يمكنك التواصل للاستفسار عن مواعيد الكشف والخدمات المتاحة لدى الطبيب.",
  pediatrics: "خدمات طب الأطفال لمتابعة النمو والتطور الصحي، وتقييم المشكلات الصحية الشائعة لدى الأطفال وفقًا لعمر الطفل وحالته. يتيح الدليل الوصول إلى الأطباء المتخصصين والاستفسار عن مواعيد الكشف.",
  dentistry: "خدمات طب الأسنان للكشف على الأسنان واللثة وتقييم المشكلات المتعلقة بصحة الفم، مع توفير العلاجات والإجراءات التي تدخل ضمن تخصص الطبيب. يمكنك التواصل للاستفسار عن الخدمات المتاحة ومواعيد الحجز.",
  gynecology: "خدمات الرعاية الطبية المتخصصة في صحة المرأة ومتابعة الحمل والحالات المتعلقة بأمراض النساء والتوليد. يساعدك الدليل على الوصول إلى الأطباء المتخصصين والاستفسار عن مواعيد الكشف والخدمات المقدمة.",
  orthopedics: "خدمات الكشف والتقييم الطبي للمشكلات المتعلقة بالعظام والمفاصل والعضلات والإصابات الحركية. يمكنك التواصل مع الطبيب للاستفسار عن التخصصات الدقيقة ومواعيد الكشف وطرق المتابعة.",
  dermatology: "خدمات طب الجلدية لتقييم مشكلات الجلد والشعر والأظافر، والتعامل مع الحالات الجلدية وفقًا للتشخيص الطبي. يتيح الدليل الوصول إلى الأطباء المتخصصين والاستفسار عن مواعيد الكشف والخدمات المتاحة.",
  ophthalmology: "خدمات الكشف على العين وتقييم مشكلات الإبصار والحالات المتعلقة بصحة العين، مع تحديد الفحوصات أو المتابعة المناسبة حسب الحالة. يمكنك التواصل للاستفسار عن مواعيد الكشف والخدمات التي تقدمها العيادة.",
  ent: "خدمات الكشف والتقييم الطبي للحالات المتعلقة بالأنف والأذن والحنجرة، بما يشمل مشكلات السمع والجيوب الأنفية والحلق. يمكنك الوصول إلى الطبيب المتخصص والاستفسار عن مواعيد الكشف والخدمات المتاحة.",
  physiotherapy: "خدمات العلاج الطبيعي والتأهيل الحركي للمساعدة في استعادة الحركة وتحسين الأداء البدني في الحالات التي يناسبها هذا النوع من العلاج. يتم تحديد البرنامج التأهيلي وفقًا لتقييم الحالة وتوصيات المختص.",
  "medical-labs": "خدمات إجراء التحاليل والفحوصات الطبية وسحب العينات وفقًا للإمكانات المتاحة في كل معمل. يمكنك التواصل للاستفسار عن التحاليل المطلوبة، ومتطلبات إجرائها، ومواعيد العمل واستلام النتائج.",
  groceries: "محلات توفر السلع الغذائية والمنتجات الأساسية والاحتياجات اليومية للأسر، مع اختلاف الأصناف والعلامات التجارية من محل لآخر. يساعدك الدليل على الوصول إلى المحلات والاستفسار عن المنتجات المتاحة.",
  pharmacies: "دليل للصيدليات التي توفر الأدوية والمستلزمات الطبية ومنتجات العناية الشخصية، وفقًا للتوافر والاشتراطات المعمول بها. يمكنك التواصل للاستفسار عن توافر دواء معين ومواعيد العمل.",
  clothing: "محلات بيع الملابس بمختلف أنواعها وموديلاتها واحتياجاتها، مع تنوع المنتجات والمقاسات والفئات التي تستهدفها كل جهة تجارية. يمكنك التواصل للاستفسار عن الأصناف المتاحة ومواعيد العمل.",
  stationery: "مكتبات توفر الأدوات المدرسية والمستلزمات ا��مكتبية والمنتجات التعليمية التي يحتاج إليها الطلاب وأولياء الأمور. يساعدك الدليل على الوصول إلى المكتبات والاستفسار عن المنتجات المتاحة.",
  appliances: "محلات متخصصة في بيع الأجهزة الكهربائية والمنزلية بمختلف أنواعها، لتلبية احتياجات المنازل وتجهيزاتها. يمكنك التواصل للاستفسار عن الأجهزة والموديلات المتاحة والأسعار وخدمات البيع التي يوفرها كل محل.",
  food: "دليل للمطاعم ومقدمي المأكولات داخل قرية جنزور، للتعرف على أماكن تقديم الطعام والاختيارات المتاحة. يمكنك التواصل للاستفسار عن قائمة الأطعمة والأسعار ومواعيد العمل وخدمات الطلب أو التوصيل إن توفرت.",
  "mobile-shops": "محلات متخصصة في بيع الهواتف المحمولة وأجهزة الكمبيوتر وملحقاتها، وقد تشمل خدماتها الصيانة أو توفير الإكسسوارات حسب نشاط كل محل. يمكنك التواصل للاستفسار عن الأجهزة والمنتجات والخدمات المتاحة.",
  arabic: "مدرسون متخصصون في تدريس اللغة العربية ومهارات القراءة والكتابة والنحو والقواعد والتعبير، وفقًا للمناهج والمراحل التعليمية التي يتعامل معها كل مدرس. يمكن التواصل للاستفسار عن الصفوف الدراسية ومواعيد الحصص.",
  english: "مدرسون متخصصون في تعليم اللغة الإنجليزية، بما يشمل القواعد والمفردات والقراءة والكتابة ومهارات اللغة المختلفة. يتيح الدليل لأولياء الأمور والطلاب الوصول إلى المدرسين والاستفسار عن المراحل والمناهج المتاحة.",
  math: "مدرسون متخصصون في تدريس الرياضيات وشرح المفاهيم والقواعد والمسائل الحسابية والهندسية حسب المرحلة الدراسية. يمكنك التواصل للاستفسار عن الصفوف التي يتم تدريسها ومواعيد الحصص ونظام الدراسة.",
  science: "مدرسون متخصصون في المواد العلمية، بما يشمل العلوم والكيمياء والفيزياء وفقًا للمراحل والمناهج التعليمية المختلفة. يساعدك الدليل على الوصول إلى المدرس المناسب والاستفسار عن المادة والصف الدراسي ومواعيد التدريس.",
  "social-studies": "مدرسون متخصصون في تدريس الدراسات الاجتماعية والتاريخ والجغرافيا، مع شرح المناهج والمفاهيم والأحداث والموضوعات المقررة لكل مرحلة. يمكنك التواصل لمعرفة الصفوف الدراسية المتاحة ومواعيد الحصص.",
  law: "خدمات المحاماة والاستشارات القانونية المتعلقة بالقضايا والإجراءات الرسمية ومراجعة العقود وصياغتها في نطاق التخصص. يمكنك التواصل مع المحامي للاستفسار عن مجالات الممارسة ومواعيد المقابلات والخدمات القانونية المتاحة.",
  transport: "دليل لمقدمي خدمات النقل والمواصلات داخل قرية جنزور والمناطق المحيطة بها، لتسهيل الوصول إلى وسائل التنقل المتاحة. يمكنك التواصل للاستفسار عن الوجهات وخطوط السير والمواعيد والتكلفة حسب الخدمة.",
  cameras: "خدمات تركيب وتجهيز وصيانة أنظمة كاميرات المراقبة وملحقاتها، بما يتناسب مع احتياجات المنازل والمحلات والمنشآت. يمكنك التواصل للاستفسار عن أنواع الأنظمة المتاحة وطرق التركيب والصيانة التي يقدمها الفني.",
  solar: "خدمات مرتبطة بتجهيز وتركيب وصيانة أنظمة الطاقة الشمسية ومكوناتها للاستفادة من الطاقة المتجددة. يتيح الدليل الوصول إلى المتخصصين والاستفسار عن الأنظمة المناسبة والقدرات المتاحة وتفاصيل التنفيذ.",
  "community-pharmacies": "صيدليات عامة تصرف الأدوية والروشتات وتوفر مستحضرات العناية، مع قياس الضغط والسكر وخدمة التوصيل للمنازل عند توافرها. تواصل للاستفسار عن توافر الدواء.",
  "night-pharmacies": "صيدليات تعمل على مدار ٢٤ ساعة أو بنظام المناوبة الليلية لتوفير الأدوية والطوارئ في أي وقت. تواصل للتأكد من مواعيد العمل والتوافر.",
  "medical-supplies": "محلات المستلزمات والأجهزة الطبية: أجهزة الضغط والسكر، الكراسي المتحركة، المشايات، الأكسجين، والمستلزمات التمريضية. تواصل للاستفسار عن التوافر والأسعار.",
  lawyers: "المحاماة والقضايا بمختلف أنواعها: مدني وجنائي وأحوال شخصية ومواريث وعمالي، مع المتابعة أمام المحاكم والنيابات. تواصل لعرض تفاصيل القضية ومعرفة الأتعاب.",
  "legal-consulting": "الاستشارات القانونية للأفراد والشركات في المعاملات والعقود والنزاعات، وتوضيح الإجراءات والحقوق قبل اتخاذ أي خطوة. تواصل لحجز استشارة.",
  contracts: "صياغة ومراجعة العقود وإجراءات الشهر العقاري والتوثيق وتسجيل الملكيات والتوكيلات. تواصل لمعرفة المستندات المطلوبة والتكلفة.",
  "print-shops": "طباعة المستندات وتصويرها، الكروت الشخصية، الفواتير والدفاتر، والمطبوعات الورقية بمختلف الأحجام. تواصل لمعرفة الأسعار ومدة التنفيذ.",
  advertising: "تصميم وتنفيذ اللافتات واليفط والبنرات وواجهات المحلات، وحملات الدعاية والإعلان المطبوعة والرقمية. تواصل لمعرفة الخامات والمقاسات والأسعار.",
  "graphic-design": "تصميم الشعارات والهويات البصرية والمنشورات ومواد السوشيال ميديا والإعلانات المطبوعة. تواصل لعرض نماذج الأعمال والاتفاق على التفاصيل.",
  photography: "تصوير الأفراح والخطوبة والمناسبات فوتوغرافيًا وفيديو، مع إمكانية المونتاج وتسليم الألبومات. تواصل لمعرفة الباقات والمواعيد المتاحة.",
  dj: "تجهيزات الصوت والإضاءة والدي جي للأفراح والمناسبات والحفلات داخل جنزور والمناطق المجاورة. تواصل لمعرفة التجهيزات المتاحة والأسعار.",
  hairdressers: "كوافير العرائس والمناسبات وتصفيف الشعر والعناية به، في الصالون أو بالمنزل. تواصل لحجز الموعد ومعرفة الأسعار.",
  makeup: "ميكب أرتست للعرائس والمناسبات والسهرات بخامات موثوقة، مع إمكانية الحضور للمنزل. تواصل لحجز الموعد ومعرفة الباقات.",
  "wedding-planning": "تجهيز الأفراح والمناسبات: الكوشة والديكور والفرش والإضاءة والضيافة وتنسيق القاعات والسرادقات. تواصل لمعرفة الباقات والأسعار.",
  moving: "نقل العفش والأثاث بسيارات مجهزة مع فك وتركيب وتغليف عند الحاجة، داخل جنزور وإلى أي محافظة. تواصل للاتفاق على الموعد والتكلفة.",
  freight: "نقل البضائع والطلبيات التجارية والمواد بسيارات نقل مختلفة الأحجام. تواصل لمعرفة السعات المتاحة والأسعار.",
  rides: "مشاوير خاصة داخل جنزور وخارجها بالسيارات الملاكي والميكروباص والتوك توك، مع الالتزام بالمواعيد. تواصل للاتفاق على الوجهة والتكلفة.",
  "apartment-cleaning": "تنظيف الشقق والمنازل تنظيفًا شاملًا قبل السكن أو بعد التشطيب أو بشكل دوري، بمواد آمنة ومعدات مناسبة. تواصل لمعرفة المواعيد والأسعار.",
  "carpet-cleaning": "غسيل السجاد والموكيت والمفروشات والانتريهات بالبخار مع الاستلام والتسليم من المنزل. تواصل لمعرفة الأسعار ومدة التنفيذ.",
  cleaning: "دليل لمقدمي خدمات النظافة والعناية بالمنازل والمساحات المختلفة، وفقًا لطبيعة الخدمة التي يوفرها كل مقدم. يمكنك التواصل للاستفسار عن أنواع الأعمال المتاحة ومواعيد التنفيذ ونطاق الخدمة والتكلفة.",
  other: "مساحة للخدمات المهنية والمجتمعية المتنوعة التي لا تندرج ضمن التخصصات الأخرى في الدليل. تساعدك على التعرف على مقدمي الخدمات داخل جنزور والوصول إلى بيانات التواصل للاستفسار عن طبيعة الخدمة وتفاصيلها.",
  "satellite-dish": "تركيب وضبط أطباق الدش والريسيفرات وتوزيع الإشارة على الشقق والعمارات مع حل مشاكل الصورة والقنوات.",
  "locksmith": "تركيب وإصلاح الكوالين والأقفال ونسخ المفاتيح وفتح الأبواب المغلقة بأمان على مدار اليوم.",
  "gypsum-decor": "تنفيذ أسقف الجبس بورد والكرانيش والديكورات الداخلية والإضاءة المخفية للشقق والمحلات.",
  "appliance-repair": "صيانة وإصلاح الثلاجات والغسالات والبوتاجازات والسخانات وباقي الأجهزة المنزلية في المنزل.",
  "home-nursing": "خدمات التمريض المنزلي من حقن ومحاليل وقياس ضغط وسكر ورعاية المرضى وكبار السن في البيت.",
  "psychiatry": "عيادات الطب النفسي والمخ والأعصاب والاستشارات النفسية للكبار والأطفال بسرية تامة.",
  "butchers": "محلات الجزارة وبيع اللحوم البلدي الطازجة والمفروم والكبدة مع خدمة التجهيز والتوصيل.",
  "poultry": "بيع الدواجن والبيض البلدي والبط والرومي طازجًا مع الذبح والتنظيف حسب الطلب.",
  "fish-shops": "محلات الأسماك الطازجة والمجمدة والجمبري مع التنظيف والتجهيز للشوي والقلي.",
  "bakeries": "المخابز الأفرنجي والبلدي ومحلات الحلواني والتورت والكحك والمخبوزات الطازجة يوميًا.",
  "produce": "محلات الخضار والفاكهة الطازجة من المزارع المحلية بأسعار مناسبة مع إمكانية التوصيل.",
  "cafes": "الكافيهات ومحلات العصائر والمشروبات الساخنة والباردة وأماكن الجلسات العائلية.",
  "hardware": "محلات الأدوات الصحية والكهربائية ومستلزمات السباكة والإضاءة والمواسير والخلاطات.",
  "furniture": "معارض الموبيليا والأثاث والمفروشات والمراتب وغرف النوم والأنتريهات بالتقسيط والكاش.",
  "quran": "محفظو القرآن الكريم ودروس التجويد للأطفال والكبار في البيوت والكتاتيب والمساجد.",
  "kindergarten": "الحضانات ورياض الأطفال التي تستقبل الصغار بأنشطة تعليمية وترفيهية آمنة.",
  "barbers": "صالونات الحلاقة الرجالي وقص الشعر وتشذيب الذقن والعناية بالبشرة للرجال والأطفال.",
  "tailors": "الترزية والخياطون لتفصيل الملابس الرجالي والحريمي والتضييق والتقصير والتعديلات.",
  "laundry": "المغاسل والمكوجية لغسيل وكي الملابس والدراي كلين مع الاستلام والتسليم من المنزل.",
  "veterinary": "الأطباء البيطريون لعلاج وتطعيم المواشي والدواجن والحيوانات الأليفة والزيارات المنزلية.",
  "gyms": "صالات الجيم واللياقة البدنية والمدربون الشخصيون وبرامج التخسيس وكمال الأجسام.",
  "agri-engineering": "المهندسون الزراعيون والمشاتل واستشارات الزراعة والتسميد ومكافحة الآفات وتقليم الأشجار.",
};

const roots: Array<[string, string, string, string, string]> = [
  ["crafts", "الحرفيين", "#ff941f", "Wrench", "أهل الصنعة والخبرة في القرية"],
  ["clinics", "العيادات", "#22b96d", "Stethoscope", "اختار التخصص الطبي المناسب"],
  ["labs", "المعامل", "#0eb0b1", "FlaskConical", "معامل التحاليل والخدمات الطبية"],
  ["pharmacies", "الصيدليات", "#15a37f", "Pill", "صيدليات جنزور والمستلزمات الطبية"],
  ["shops", "المحلات", "#078cf0", "Store", "كل اللي تحتاجه من محلات جنزور"],
  ["teachers", "المدرسين", "#9160df", "GraduationCap", "مدرسين لكل المواد والمراحل"],
  ["charities", "جمعيات خيرية", "#ef5d82", "HandHeart", "إيد في إيد.. لخدمة أهل القرية"],
  ["printing", "الطباعة والدعاية والإعلان", "#5b5fe8", "Printer", "مطابع ودعاية وإعلان ولافتات"],
  ["events", "الأفراح والمناسبات", "#ff5a36", "PartyPopper", "كل ما تحتاجه لفرحك ومناسباتك"],
  ["beauty", "الحلاقة والتجميل", "#e0409a", "Scissors", "حلاقة رجالي وكوافير وميكب"],
  ["transport", "النقل والتوصيل", "#f2a900", "Truck", "نقل عفش وبضائع ومشاوير"],
  ["cleaning", "النظافة والخدمات المنزلية", "#19b4d8", "SprayCan", "تنظيف الشقق وغسيل السجاد"],
  ["law", "المحاماة والاستشارات", "#8a6a2f", "Scale", "محامون واستشارات قانونية"],
  ["other-services", "خدمات أخرى", "#0eb0b1", "Grid2X2", "خدمات متنوعة لأهل جنزور"],
];
const specialties: Record<string, Array<[string, string, string]>> = {
  crafts: [["carpentry", "النجارة", "Hammer"], ["plumbing", "السباكة", "Droplets"], ["electricity", "الكهرباء", "Zap"], ["metalwork", "الحدادة", "Anvil"], ["painting", "النقاشة والدهانات", "Paintbrush"], ["masonry", "البناء والمحارة", "BrickWall"], ["tiles", "السيراميك والبلاط", "PanelsTopLeft"], ["aluminum", "الألوميتال", "PanelsTopLeft"], ["glass", "الزجاج والمرايا", "PanelsTopLeft"], ["ac", "التكييف والتبريد", "Snowflake"], ["mechanics", "ميكانيكا السيارات", "Cog"], ["upholstery", "التنجيد", "Armchair"], ["satellite-dish", "الدش والريسيفر", "Satellite"], ["locksmith", "الكوالين والمفاتيح", "Key"], ["gypsum-decor", "الجبس بورد والديكور", "Ruler"], ["appliance-repair", "صيانة الأجهزة المنزلية", "Refrigerator"]],
  clinics: [["family", "طب الأسرة والباطنة", "Stethoscope"], ["pediatrics", "الأطفال", "Baby"], ["dentistry", "الأسنان", "Smile"], ["gynecology", "النساء والتوليد", "HeartPulse"], ["orthopedics", "العظام", "Bone"], ["dermatology", "الجلدية", "Sparkles"], ["ophthalmology", "العيون", "Eye"], ["ent", "الأنف والأذن والحنجرة", "Stethoscope"], ["physiotherapy", "العلاج الطبيعي", "Activity"], ["home-nursing", "التمريض المنزلي", "Syringe"], ["psychiatry", "النفسية والأعصاب", "Brain"], ["cardiology", "القلب والأوعية الدموية", "HeartPulse"], ["pulmonology", "الصدر والجهاز التنفسي", "Activity"], ["neurology", "المخ والأعصاب", "Brain"], ["gastroenterology", "الجهاز الهضمي والكبد", "Utensils"], ["urology", "المسالك البولية والكلى", "Droplets"], ["endocrinology", "الغدد الصماء والسكر", "Thermometer"], ["radiology", "الأشعة والتصوير الطبي", "Monitor"], ["cosmetic-surgery", "التجميل والليزر", "Sparkles"], ["andrology", "الذكورة والعقم", "HeartHandshake"], ["medical-centers", "المراكز الطبية والمستشفيات", "Hospital"]],
  labs: [["medical-labs", "معامل التحاليل", "FlaskConical"]],
  pharmacies: [["community-pharmacies", "صيدليات عامة", "Pill"], ["night-pharmacies", "صيدليات ٢٤ ساعة", "HeartPulse"], ["medical-supplies", "مستلزمات طبية وأجهزة", "Activity"]],
  shops: [["groceries", "البقالة والسوبر ماركت", "ShoppingBasket"], ["clothing", "الملابس", "Shirt"], ["stationery", "المكتبات والأدوات المدرسية", "BookOpen"], ["appliances", "الأجهزة الكهربائية", "Tv"], ["food", "المطاعم والمأكولات", "Utensils"], ["mobile-shops", "الموبايلات والكمبيوتر", "Smartphone"], ["butchers", "الجزارة واللحوم", "Beef"], ["poultry", "الدواجن والبيض", "Drumstick"], ["fish-shops", "الأسماك", "Fish"], ["bakeries", "المخابز والحلواني", "Croissant"], ["produce", "الخضار والفاكهة", "Carrot"], ["cafes", "الكافيهات والعصائر", "Coffee"], ["hardware", "الأدوات الصحية والكهربائية", "Plug"], ["furniture", "الموبيليا والمفروشات", "Bed"]],
  // مواد المدرسين الجاهزة لكل مرحلة (الإدارة تعدلها أو تضيف غيرها؛ مراحل كل مادة في teacherSpecialtyStages).
  teachers: [
    ["tch-arabic", "لغة عربية", "BookOpen"], ["tch-english", "لغة إنجليزية", "Languages"], ["tch-math", "رياضيات", "Calculator"],
    ["tch-science", "علوم", "Microscope"], ["tch-social", "دراسات اجتماعية", "Globe"], ["tch-religion", "تربية دينية وقرآن", "MoonStar"],
    ["tch-foundation", "تأسيس وصعوبات تعلم", "Backpack"], ["tch-french", "لغة فرنسية", "Feather"], ["tch-german", "لغة ألمانية", "Type"],
    ["tch-computer", "حاسب آلي وتكنولوجيا", "Laptop"], ["tch-physics", "فيزياء", "Atom"], ["tch-chemistry", "كيمياء", "FlaskConical"],
    ["tch-biology", "أحياء", "Dna"], ["tch-geology", "جيولوجيا وعلوم بيئة", "Telescope"], ["tch-philosophy", "فلسفة ومنطق", "Brain"],
    ["tch-psychology", "علم نفس واجتماع", "UsersRound"], ["tch-history", "تاريخ", "Landmark"], ["tch-geography", "جغرافيا", "Map"],
    ["tch-center", "سنتر تعليمي ومجموعات تقوية", "School"],
  ],
  charities: [["charitable-associations", "الجمعيات الأهلية", "HandHeart"], ["orphan-care", "رعاية الأيتام", "Heart"], ["community-support", "التكافل والمساعدات", "UsersRound"]],
  printing: [["print-shops", "الطباعة وتصوير المستندات", "Printer"], ["advertising", "الدعاية والإعلان واللافتات", "Megaphone"], ["graphic-design", "التصميم الجرافيكي", "Palette"]],
  events: [["photography", "التصوير", "Camera"], ["dj", "الدي جي", "Disc3"], ["wedding-planning", "تجهيز الأفراح", "PartyPopper"]],
  beauty: [["barbers", "الحلاقة الرجالي", "Scissors"], ["hairdressers", "الكوافير", "Brush"], ["makeup", "الميكب", "WandSparkles"]],
  transport: [["moving", "نقل العفش", "Sofa"], ["freight", "نقل البضائع", "PackageOpen"], ["rides", "المشاوير", "Car"]],
  cleaning: [["apartment-cleaning", "تنظيف الشقق", "SprayCan"], ["carpet-cleaning", "غسيل السجاد", "WashingMachine"]],
  law: [["lawyers", "المحاماة والقضايا", "Gavel"], ["legal-consulting", "الاستشارات القانونية", "Scale"], ["contracts", "العقود والشهر العقاري", "ScrollText"]],
  "other-services": [["cameras", "كاميرات المراقبة", "Cctv"], ["solar", "الطاقة الشمسية", "Sun"], ["other", "خدمات متنوعة", "Ellipsis"], ["tailors", "الترزية والخياطة", "Shirt"], ["laundry", "المغاسل والمكوجي", "WashingMachine"], ["veterinary", "الطب البيطري", "PawPrint"], ["gyms", "الجيم واللياقة البدنية", "Dumbbell"], ["agri-engineering", "المهندس الزراعي والمشاتل", "Sprout"], ["engineering-office", "المكاتب الهندسية والمقاولات", "HardHat"], ["programming", "البرمجة وتصميم المواقع", "Code"], ["accounting", "المحاسبة والضرائب", "Calculator"], ["travel", "السفر والسياحة والحج والعمرة", "Plane"], ["catering", "الطباخين وتجهيز الولائم", "ChefHat"], ["security", "الأمن والحراسة", "Shield"], ["arts", "الرسم والفنون والخط", "Palette"], ["real-estate", "العقارات والسمسرة", "House"], ["nurseries", "الحضانات ورياض الأطفال", "Baby"], ["water-filters", "فلاتر المياه", "GlassWater"]],
};
export const iconNames = ["Wrench", "Stethoscope", "Store", "GraduationCap", "HandHeart", "Grid2X2", "Hammer", "Droplets", "Zap", "Anvil", "Paintbrush", "BrickWall", "PanelsTopLeft", "Snowflake", "Cog", "Armchair", "Baby", "Smile", "HeartPulse", "Bone", "Sparkles", "Eye", "Activity", "ShoppingBasket", "Pill", "Shirt", "BookOpen", "Tv", "Utensils", "Smartphone", "Languages", "Calculator", "FlaskConical", "Globe", "Heart", "UsersRound", "Scale", "Truck", "Cctv", "Sun", "Ellipsis", "Printer", "Megaphone", "Palette", "Camera", "Disc3", "Scissors", "WandSparkles", "PartyPopper", "Sofa", "PackageOpen", "Car", "SprayCan", "WashingMachine", "Gavel", "ScrollText", "Drill", "Pickaxe", "Shovel", "Axe", "PaintRoller", "PaintBucket", "Ruler", "HardHat", "Construction", "Fence", "Lightbulb", "Plug", "BatteryCharging", "Fan", "AirVent", "Thermometer", "ShowerHead", "Bath", "Toilet", "Flame", "Key", "DoorOpen", "Blinds", "Bed", "Lamp", "Refrigerator", "Microwave", "Nut", "CircuitBoard", "Cuboid", "Boxes", "Waves", "CarFront", "Fuel", "Gauge", "Bus", "Bike", "Tractor", "Forklift", "Plane", "TrafficCone", "Route", "Navigation", "ChefHat", "CookingPot", "Beef", "Drumstick", "Fish", "Croissant", "Cake", "Coffee", "CupSoda", "Apple", "Carrot", "Wheat", "Egg", "Milk", "IceCreamCone", "Pizza", "Sandwich", "Candy", "Cookie", "Salad", "Citrus", "GlassWater", "UtensilsCrossed", "Brush", "Ribbon", "Crown", "Gem", "Watch", "Glasses", "Footprints", "Hand", "Flower", "Gift", "Puzzle", "Gamepad2", "Laptop", "Monitor", "Cpu", "Wifi", "Satellite", "Router", "Keyboard", "Headphones", "Speaker", "Radio", "Code", "Bot", "Antenna", "TabletSmartphone", "Phone", "HardDrive", "Book", "Library", "NotebookPen", "Backpack", "School", "Pencil", "PenTool", "Music", "Guitar", "Mic", "Atom", "Sigma", "Telescope", "Compass", "BookMarked", "MoonStar", "Presentation", "Feather", "Type", "Syringe", "Tablets", "Brain", "Ear", "Microscope", "TestTube", "Dna", "Ambulance", "Hospital", "Cross", "Accessibility", "Dumbbell", "Trophy", "Medal", "Volleyball", "Bandage", "BriefcaseMedical", "HeartHandshake", "PawPrint", "Dog", "Briefcase", "FileText", "Banknote", "CreditCard", "Coins", "PiggyBank", "Receipt", "Wallet", "HandCoins", "Landmark", "Building2", "Hotel", "House", "Warehouse", "Factory", "Stamp", "Signature", "ClipboardList", "Mail", "Send", "Ticket", "ChartBar", "Leaf", "Sprout", "TreePine", "Trees", "Bird", "Bug", "Tent", "Umbrella", "Rabbit", "Shield", "ShieldCheck", "Siren", "BellRing", "Lock", "Flashlight", "Recycle", "Trash2", "Clapperboard", "Video", "Newspaper", "Theater", "Star", "MapPin", "Map", "Moon", "Users", "UserRound", "PersonStanding", "Settings", "Server"];
export const iconArabicLabels: Record<string, string> = {
  Wrench: "مفتاح عدة (حرفيين وصيانة)",
  Stethoscope: "سماعة طبيب (عيادات)",
  Store: "متجر ومحل تجاري",
  GraduationCap: "قبعة تخرج (مدرسين وتعليم)",
  HandHeart: "يد وعطاء (جمعيات خيرية)",
  Grid2X2: "شبكة أقسام (خدمات عامة)",
  Hammer: "شاكوش (نجارة)",
  Droplets: "قطرات مياه (سباكة)",
  Zap: "كهرباء وطاقة",
  Anvil: "سندان (حدادة)",
  Paintbrush: "فرشاة دهان (نقاشة)",
  BrickWall: "جدار طوب (بناء ومحارة)",
  PanelsTopLeft: "ألواح وواجهات (سيراميك / ألوميتال / زجاج)",
  Snowflake: "تبريد وتكييف",
  Cog: "ترس ميكانيكا (سيارات ومعدات)",
  Armchair: "مقعد وأثاث (تنجيد)",
  Baby: "طفل (طب الأطفال)",
  Smile: "ابتسامة (طب الأسنان)",
  HeartPulse: "نبض القلب (نساء وتوليد / قلب)",
  Bone: "عظام ومفاصل",
  Sparkles: "بريق ولمعان (جلدية / نظافة)",
  Eye: "عين (طب العيون)",
  Activity: "نشاط وحركة (علاج طبيعي)",
  ShoppingBasket: "سلة تسوق (بقالة وسوبر ماركت)",
  Pill: "كبسولة دواء (صيدليات)",
  Shirt: "ملابس وأزياء",
  BookOpen: "كتاب مفتوح (مكتبات ولغة عربية)",
  Tv: "شاشة وتلفزيون (أجهزة كهربائية)",
  Utensils: "أدوات مائدة (مطاعم ومأكولات)",
  Smartphone: "هاتف محمول (موبايلات وكمبيوتر)",
  Languages: "لغات وترجمة (لغة إنجليزية)",
  Calculator: "آلة حاسبة (رياضيات ومحاسبة)",
  FlaskConical: "دورق معمل (تحاليل وعلوم)",
  Globe: "كرة أرضية (دراسات وجغرافيا)",
  Heart: "قلب (رعاية الأيتام)",
  UsersRound: "مجموعة أفراد (تكافل ومجتمع)",
  Scale: "ميزان العدالة (محاماة واستشارات)",
  Truck: "سيارة نقل ومواصلات",
  Cctv: "كاميرا مراقبة وأمان",
  Sun: "شمس (طاقة شمسية)",
  Ellipsis: "نقاط متنوعة (خدمات أخرى)",
  Printer: "طابعة (طباعة ومطابع)",
  Megaphone: "مكبر صوت (دعاية وإعلان)",
  Palette: "لوحة ألوان (تصميم جرافيك)",
  Camera: "كاميرا تصوير (مصورين)",
  Disc3: "أسطوانة موسيقى (دي جي)",
  Scissors: "مقص (حلاق رجالي وكوافير)",
  WandSparkles: "عصا لامعة (ميكب وتجميل)",
  PartyPopper: "مفرقعات احتفال (أفراح ومناسبات)",
  Sofa: "كنبة (نقل عفش)",
  PackageOpen: "طرد بضائع (نقل بضائع)",
  Car: "سيارة (مشاوير)",
  SprayCan: "بخاخ تنظيف (نظافة)",
  WashingMachine: "غسالة (غسيل سجاد)",
  Gavel: "مطرقة قاضٍ (محاماة وقضايا)",
  ScrollText: "وثيقة ملفوفة (عقود وشهر عقاري)",
  Drill: "حرف | دريل وشنيور (حفر وتركيب)",
  Pickaxe: "حرف | فأس تكسير (هدم وحفر)",
  Shovel: "حرف | جاروف (حفر وردم)",
  Axe: "حرف | بلطة (تقطيع وخشب)",
  PaintRoller: "حرف | رولة دهان (نقاش)",
  PaintBucket: "حرف | جردل دهان (دهانات)",
  Ruler: "حرف | مسطرة (جبس وديكور وقياس)",
  HardHat: "حرف | خوذة عمال (مقاولات)",
  Construction: "حرف | إنشاءات (مقاولات عامة)",
  Fence: "حرف | سور (أسوار وحدائق)",
  Lightbulb: "حرف | لمبة (كهرباء منزلية)",
  Plug: "حرف | فيشة (كهربائي وأدوات كهربائية)",
  BatteryCharging: "حرف | بطارية (بطاريات وشحن)",
  Fan: "حرف | مروحة (مراوح وتهوية)",
  AirVent: "حرف | تكييف مركزي",
  Thermometer: "حرف | ترمومتر (تبريد وتدفئة)",
  ShowerHead: "حرف | دش حمام (سباكة حمامات)",
  Bath: "حرف | بانيو (أطقم حمامات)",
  Toilet: "حرف | مرحاض (صرف صحي)",
  Flame: "حرف | شعلة (غاز وبوتاجازات)",
  Key: "حرف | مفتاح (كوالين ومفاتيح)",
  DoorOpen: "حرف | باب (أبواب ونوافذ)",
  Blinds: "حرف | ستائر (ستائر ومفروشات)",
  Bed: "حرف | سرير (مراتب وموبيليا)",
  Lamp: "حرف | أباجورة (إضاءة ونجف)",
  Refrigerator: "حرف | ثلاجة (صيانة أجهزة منزلية)",
  Microwave: "حرف | ميكروويف (صيانة أجهزة)",
  Nut: "حرف | صامولة (قطع غيار)",
  CircuitBoard: "حرف | لوحة إلكترونية (إلكترونيات)",
  Cuboid: "حرف | مكعب (رخام وجرانيت)",
  Boxes: "حرف | صناديق (تغليف ومخازن)",
  Waves: "حرف | مياه (خزانات وفلاتر)",
  CarFront: "سيارات | سيارة (كهربائي سيارات)",
  Fuel: "سيارات | بنزينة (وقود وزيوت)",
  Gauge: "سيارات | عداد (سمكرة ودوكو)",
  Bus: "سيارات | أتوبيس (ميكروباص)",
  Bike: "سيارات | دراجة (دراجات وموتوسيكلات)",
  Tractor: "سيارات | جرار (جرارات زراعية)",
  Forklift: "سيارات | ونش (رفع وأوناش)",
  Plane: "سيارات | طائرة (سفر وحج وعمرة)",
  TrafficCone: "سيارات | مخروط (تعليم قيادة)",
  Route: "سيارات | مسار (توصيل طلبات)",
  Navigation: "سيارات | ملاحة (دليفري)",
  ChefHat: "طعام | طاقية شيف (طباخ وبوفيه)",
  CookingPot: "طعام | حلة (مطبخ منزلي)",
  Beef: "طعام | لحمة (جزار)",
  Drumstick: "طعام | فرخة (دواجن)",
  Fish: "طعام | سمكة (أسماك)",
  Croissant: "طعام | كرواسون (مخبز وحلواني)",
  Cake: "طعام | تورتة (تورت وحلويات)",
  Coffee: "طعام | قهوة (كافيه)",
  CupSoda: "طعام | عصير (عصائر ومشروبات)",
  Apple: "طعام | تفاحة (فاكهة)",
  Carrot: "طعام | جزرة (خضار)",
  Wheat: "طعام | سنبلة (مخبز بلدي وغلال)",
  Egg: "طعام | بيض (بيض ودواجن)",
  Milk: "طعام | لبن (ألبان وجبن)",
  IceCreamCone: "طعام | آيس كريم",
  Pizza: "طعام | بيتزا وفطائر",
  Sandwich: "طعام | سندوتشات وفول",
  Candy: "طعام | حلويات وبونبون",
  Cookie: "طعام | بسكويت ومخبوزات",
  Salad: "طعام | سلطة (أكل صحي)",
  Citrus: "طعام | برتقال (موالح)",
  GlassWater: "طعام | كوب ماء (مياه معدنية)",
  UtensilsCrossed: "طعام | شوكة وسكينة (مطاعم)",
  Brush: "جمال | فرشاة شعر (كوافير)",
  Ribbon: "جمال | شريطة (فساتين زفاف)",
  Crown: "جمال | تاج (تجهيز عرايس)",
  Gem: "جمال | جوهرة (مجوهرات وذهب)",
  Watch: "جمال | ساعة (ساعات وإكسسوارات)",
  Glasses: "جمال | نظارة (نظارات وبصريات)",
  Footprints: "جمال | أقدام (أحذية)",
  Hand: "جمال | يد (مانيكير وحنة)",
  Flower: "جمال | وردة (محل ورد)",
  Gift: "جمال | هدية (هدايا وتغليف)",
  Puzzle: "جمال | بازل (ألعاب أطفال)",
  Gamepad2: "جمال | دراع ألعاب (بلايستيشن)",
  Laptop: "تقنية | لابتوب (صيانة كمبيوتر)",
  Monitor: "تقنية | شاشة (شاشات وأجهزة)",
  Cpu: "تقنية | معالج (قطع كمبيوتر)",
  Wifi: "تقنية | واي فاي (إنترنت وشبكات)",
  Satellite: "تقنية | قمر صناعي (دش وريسيفر)",
  Router: "تقنية | راوتر (شبكات)",
  Keyboard: "تقنية | كيبورد (مستلزمات كمبيوتر)",
  Headphones: "تقنية | سماعات (صوتيات)",
  Speaker: "تقنية | سماعة صوت (صوتيات أفراح)",
  Radio: "تقنية | راديو",
  Code: "تقنية | كود (برمجة ومواقع)",
  Bot: "تقنية | روبوت (ذكاء اصطناعي)",
  Antenna: "تقنية | إيريال (هوائيات)",
  TabletSmartphone: "تقنية | تابلت وموبايل (صيانة موبايل)",
  Phone: "تقنية | تليفون (سنترال وخطوط)",
  HardDrive: "تقنية | هارد (استرجاع بيانات)",
  Book: "تعليم | كتاب (كتب ومكتبة)",
  Library: "تعليم | مكتبة عامة",
  NotebookPen: "تعليم | كشكول وقلم (دروس خصوصية)",
  Backpack: "تعليم | شنطة مدرسة (مستلزمات مدرسية)",
  School: "تعليم | مدرسة (مدارس وحضانات)",
  Pencil: "تعليم | قلم رصاص (رسم وتلوين)",
  PenTool: "تعليم | قلم تصميم (مصمم جرافيك)",
  Music: "تعليم | نوتة (موسيقى)",
  Guitar: "تعليم | جيتار (آلات موسيقية)",
  Mic: "تعليم | ميكروفون (مطرب ومنشد)",
  Atom: "تعليم | ذرة (فيزياء وكيمياء)",
  Sigma: "تعليم | سيجما (رياضيات)",
  Telescope: "تعليم | تلسكوب (فلك وعلوم)",
  Compass: "تعليم | بوصلة (هندسة ورسم)",
  BookMarked: "تعليم | مصحف (تحفيظ قرآن)",
  MoonStar: "تعليم | هلال ونجمة (مسجد وشؤون دينية)",
  Presentation: "تعليم | عرض (كورسات وتدريب)",
  Feather: "تعليم | ريشة (كتابة وخطاط)",
  Type: "تعليم | حروف (خط عربي)",
  Syringe: "صحة | حقنة (تمريض منزلي)",
  Tablets: "صحة | أقراص (صيدلية)",
  Brain: "صحة | مخ (نفسية وأعصاب)",
  Ear: "صحة | أذن (سمعيات)",
  Microscope: "صحة | ميكروسكوب (معمل تحاليل)",
  TestTube: "صحة | أنبوبة (تحاليل)",
  Dna: "صحة | DNA (وراثة)",
  Ambulance: "صحة | إسعاف (نقل مرضى)",
  Hospital: "صحة | مستشفى (مستشفيات ومراكز)",
  Cross: "صحة | صليب طبي (رعاية صحية)",
  Accessibility: "صحة | ذوي الهمم (أجهزة تعويضية)",
  Dumbbell: "صحة | دمبل (جيم ولياقة)",
  Trophy: "صحة | كأس (أكاديمية رياضية)",
  Medal: "صحة | ميدالية (تدريب رياضي)",
  Volleyball: "صحة | كرة (ملاعب ورياضة)",
  Bandage: "صحة | ضمادة (إسعافات أولية)",
  BriefcaseMedical: "صحة | شنطة طبية (زيارات منزلية)",
  HeartHandshake: "صحة | رعاية مسنين",
  PawPrint: "صحة | كف حيوان (طبيب بيطري)",
  Dog: "صحة | كلب (مستلزمات حيوانات)",
  Briefcase: "أعمال | حقيبة (مكاتب وشركات)",
  FileText: "أعمال | مستند (أوراق ومعاملات)",
  Banknote: "أعمال | نقود (صرافة وتحويلات)",
  CreditCard: "أعمال | بطاقة (دفع إلكتروني وكاش)",
  Coins: "أعمال | عملات (جمعيات وتوفير)",
  PiggyBank: "أعمال | حصالة (ادخار)",
  Receipt: "أعمال | فاتورة (محاسب)",
  Wallet: "أعمال | محفظة (تحويل أموال)",
  HandCoins: "أعمال | يد ونقود (تمويل)",
  Landmark: "أعمال | مبنى حكومي (بنك وبريد)",
  Building2: "أعمال | مبنى (عقارات وسمسرة)",
  Hotel: "أعمال | فندق (شقق مفروشة)",
  House: "أعمال | بيت (بيع وإيجار منازل)",
  Warehouse: "أعمال | مخزن (تخزين)",
  Factory: "أعمال | مصنع (مصانع وورش)",
  Stamp: "أعمال | ختم (توثيق وتوكيلات)",
  Signature: "أعمال | توقيع (محرر عقود)",
  ClipboardList: "أعمال | قائمة (استخراج أوراق)",
  Mail: "أعمال | بريد (بريد وشحن)",
  Send: "أعمال | إرسال (شحن سريع)",
  Ticket: "أعمال | تذكرة (حجز تذاكر)",
  ChartBar: "أعمال | رسم بياني (تسويق)",
  Leaf: "زراعة | ورقة شجر (نباتات وزراعة)",
  Sprout: "زراعة | شتلة (مشاتل ومهندس زراعي)",
  TreePine: "زراعة | شجرة (أشجار وحدائق)",
  Trees: "زراعة | أشجار (تنسيق حدائق)",
  Bird: "زراعة | عصفور (طيور وزينة)",
  Bug: "زراعة | حشرة (مكافحة حشرات)",
  Tent: "زراعة | خيمة (فرش وخيام مناسبات)",
  Umbrella: "زراعة | شمسية (مظلات وتندات)",
  Rabbit: "زراعة | أرنب (أرانب ومواشي)",
  Shield: "خدمات | درع (أمن وحراسة)",
  ShieldCheck: "خدمات | درع معتمد (شركات أمن)",
  Siren: "خدمات | صفارة (طوارئ)",
  BellRing: "خدمات | جرس (أجراس وإنتركم)",
  Lock: "خدمات | قفل (أقفال وخزن)",
  Flashlight: "خدمات | كشاف (إضاءة طوارئ)",
  Recycle: "خدمات | إعادة تدوير (خردة وبيئة)",
  Trash2: "خدمات | سلة (رفع مخلفات)",
  Clapperboard: "خدمات | كلاكيت (مونتاج وفيديو)",
  Video: "خدمات | كاميرا فيديو (تصوير فيديو)",
  Newspaper: "خدمات | جريدة (صحافة وإعلام)",
  Theater: "خدمات | مسرح وفنون",
  Star: "خدمات | نجمة (خدمات مميزة)",
  MapPin: "خدمات | دبوس (عناوين ومواقع)",
  Map: "خدمات | خريطة (دليل وإرشاد)",
  Moon: "خدمات | هلال (خدمات ليلية)",
  Users: "خدمات | أشخاص (مبادرات)",
  UserRound: "خدمات | شخص (خدمات شخصية)",
  PersonStanding: "خدمات | شخص واقف (عمالة يومية)",
  Settings: "خدمات | ترس (صيانة عامة)",
  Server: "خدمات | سيرفر (استضافة وأنظمة)",
};
/** مراحل كل مادة جاهزة تحت «المدرسين» (الإدارة تعدلها من لوحة التحكم). */
export const teacherSpecialtyStages: Record<string, string> = {
  "tch-arabic": "primary,prep,secondary", "tch-english": "primary,prep,secondary", "tch-math": "primary,prep,secondary", "tch-religion": "primary,prep,secondary",
  "tch-science": "primary,prep", "tch-social": "primary,prep", "tch-foundation": "primary",
  "tch-french": "prep,secondary", "tch-computer": "prep,secondary",
  "tch-german": "secondary", "tch-physics": "secondary", "tch-chemistry": "secondary", "tch-biology": "secondary", "tch-geology": "secondary",
  "tch-philosophy": "secondary", "tch-psychology": "secondary", "tch-history": "secondary", "tch-geography": "secondary",
  "tch-center": "primary,prep,secondary",
};
/** حصة في جدول السنتر التعليمي الأسبوعي. day = رقم اليوم في WEEK_DAYS (0 الأحد … 6 السبت). */
export type CenterLesson = { day: number; subject: string; teacher: string; time: string; stage: string };
export type CenterSchedule = CenterLesson[];
export const CENTER_SCHEDULE_MAX = 60;
/** يتحقق من جدول الحصص: حتى 60 حصة، كل حصة بيوم صحيح ومادة ووقت؛ المدرس والمرحلة اختياريان. */
export function parseCenterSchedule(value: unknown): CenterSchedule {
  if (value === undefined || value === null || value === "") return [];
  if (!Array.isArray(value)) throw new Error("جدول الحصص غير صالح.");
  if (value.length > CENTER_SCHEDULE_MAX) throw new Error(`جدول الحصص حتى ${CENTER_SCHEDULE_MAX} حصة.`);
  const clean = (input: unknown, max: number) => String(input ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return value.map((row) => {
    const item = typeof row === "object" && row !== null ? row as Record<string, unknown> : {};
    const day = Number(item.day);
    const subject = clean(item.subject, 60), teacher = clean(item.teacher, 60), time = clean(item.time, 40), stage = clean(item.stage, 30);
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error("اختر يوم الحصة.");
    if (!subject) throw new Error("اكتب اسم المادة لكل حصة.");
    if (!time) throw new Error("اكتب موعد كل حصة (مثال: ٤ – ٦ م).");
    return { day, subject, teacher, time, stage };
  }).sort((a, b) => a.day - b.day);
}
/** الأيام التي بها حصص مرتبة من السبت (بداية الأسبوع الدراسي) مع حصصها. */
export function groupScheduleByDay(schedule: CenterSchedule): Array<{ day: number; label: string; lessons: CenterLesson[] }> {
  const order = [6, 0, 1, 2, 3, 4, 5];
  return order.map((day) => ({ day, label: WEEK_DAYS[day], lessons: schedule.filter((lesson) => lesson.day === day) })).filter((group) => group.lessons.length > 0);
}
/** نص الجدول لمشاركته على واتساب. */
export function centerScheduleText(name: string, schedule: CenterSchedule, siteUrl = "https://daleel-ganzour.vercel.app"): string {
  const lines = groupScheduleByDay(schedule).map((group) => `📅 ${group.label}\n${group.lessons.map((lesson) => `• ${lesson.subject}${lesson.stage ? ` (${lesson.stage})` : ""}${lesson.teacher ? ` — ${lesson.teacher}` : ""} ⏰ ${lesson.time}`).join("\n")}`);
  return `🗓️ جدول حصص ${name}\n\n${lines.join("\n\n")}\n\nمن دليل جنزور ${siteUrl}`;
}
/** السنتر التعليمي: نوع داخل قسم المدرسين يضم أكثر من مادة؛ المواد تُحفظ بأسمائها داخل «التخصصات الفرعية». */
export const TEACHER_CENTER_ID = "tch-center";
export function teacherSubjects(catalog: CategoryRecord[] = initialCategories): CategoryRecord[] {
  return catalog.filter((category) => category.parentId === TEACHERS_ROOT_ID && category.id !== TEACHER_CENTER_ID && category.active);
}
/** أسماء المواد التي يقدمها السنتر (من وسومه الفرعية) بترتيب الكتالوج. */
export function centerSubjectNames(service: Pick<ServiceRecord, "subSpecialties">, catalog: CategoryRecord[] = initialCategories): string[] {
  const tags = (service.subSpecialties ?? []).map((item) => normalizeSearch(item));
  return teacherSubjects(catalog).filter((subject) => tags.includes(normalizeSearch(subject.name))).map((subject) => subject.name);
}
/** هل يدرّس السنتر هذه المادة؟ (يظهر في صفحة المادة بجانب مدرسيها) */
export function serviceTeachesSubject(service: Pick<ServiceRecord, "subSpecialties" | "category">, subject: Pick<CategoryRecord, "name" | "parentId">): boolean {
  if (service.category !== TEACHER_CENTER_ID || subject.parentId !== TEACHERS_ROOT_ID) return false;
  const target = normalizeSearch(subject.name);
  return (service.subSpecialties ?? []).some((item) => normalizeSearch(item) === target);
}
/** يستبدل وسوم المواد داخل «التخصصات الفرعية» بالمواد المختارة ويحافظ على المراحل وباقي الوسوم. */
export function withCenterSubjects(subSpecialties: string[], subjects: unknown, catalog: CategoryRecord[] = initialCategories): string[] {
  const names = teacherSubjects(catalog).map((subject) => subject.name);
  const normalized = names.map((name) => normalizeSearch(name));
  const chosen = Array.isArray(subjects) ? subjects.map((item) => normalizeSearch(String(item))) : [];
  const rest = (subSpecialties ?? []).filter((item) => !normalized.includes(normalizeSearch(item)));
  const stageNames = TEACHER_STAGES.map((stage) => normalizeSearch(stage.name));
  const stages = rest.filter((item) => stageNames.includes(normalizeSearch(item)));
  const others = rest.filter((item) => !stageNames.includes(normalizeSearch(item)));
  return [...stages, ...names.filter((name) => chosen.includes(normalizeSearch(name))), ...others].slice(0, 20);
}
export const initialCategories: CategoryRecord[] = roots.flatMap(([id, name, color, icon, description], sortOrder) => [
  { id, name, color, light: `${color}12`, icon, art: iconArtDefaults[icon] ?? "other", description: sectionDescriptions[id] ?? description, sortOrder, parentId: null, active: true },
  ...specialties[id].map(([childId, childName, childIcon], order) => ({ id: childId, name: childName, color, light: `${color}12`, icon: childIcon, art: "", description: `${specialtyDescriptions[childId] ?? `مقدمو خدمات ${childName} بقرية جنزور`} المجال: ${childName}.`, sortOrder: order, parentId: id, active: true, stages: teacherSpecialtyStages[childId] ?? "" })),
]);
export const categories = initialCategories.filter((category) => !category.parentId);

export function getCategory(id: string, catalog: CategoryRecord[] = initialCategories): CategoryRecord {
  return catalog.find((category) => category.id === id) ?? { id, name: "خدمة", color: "#0876e1", light: "#edf6ff", icon: "Wrench", art: "", parentId: null, sortOrder: 0, active: true, description: "" };
}
export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
// Daily labor is scoped to demolition and breaking, sand/cement staging, and general helper work.
// Painting (نقاشة) and ceramics/tiles (سيراميك) each keep their own crafts section in the directory,
// so a labor submission advertising those trades is redirected there instead of being published.
const laborTradeExclusions = /نقاش|دهان|صبغ|سيراميك|بلاط|رخام/;
export function isOutsideLaborScope(...values: string[]) {
  return values.some((value) => laborTradeExclusions.test(normalizeSearch(value)));
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
  { id: "00000000-0000-4000-8000-000000000008", name: "مكتب العدالة للمحاماة", category: "lawyers", area: areas[0], address: areas[0], phone: "01077889900", description: "استشارات قانونية وصياغة العقود وخدمات تأسيس الشركات.", rating: "4.7", reviews: 24, emergency: false, featured: false },
];

/* ------------------------------------------------------------------ */
/* Village events calendar («مناسبات القرية»)                           */
/* ------------------------------------------------------------------ */
export type VillageEventRecord = { id: string; title: string; kind: string; startsAt: string; endsAt: string | null; location: string; description: string; pinned: boolean; createdAt: string };
export const EVENT_KINDS: Array<{ id: string; name: string; icon: string; color: string }> = [
  { id: "wedding", name: "فرح", icon: "💍", color: "#db2777" },
  { id: "condolence", name: "عزاء", icon: "🕊️", color: "#475569" },
  { id: "medical", name: "قافلة / حملة طبية", icon: "🩺", color: "#dc2626" },
  { id: "exhibition", name: "معرض / سوق", icon: "🛍️", color: "#d97706" },
  { id: "meeting", name: "اجتماع / ندوة", icon: "🗣️", color: "#0b63c9" },
  { id: "religious", name: "ديني", icon: "🕌", color: "#047857" },
  { id: "charity", name: "خيري / تطوعي", icon: "🤝", color: "#7c3aed" },
  { id: "sport", name: "رياضي", icon: "⚽", color: "#0891b2" },
  { id: "other", name: "أخرى", icon: "📌", color: "#64748b" },
];
export function getEventKind(id: string) { return EVENT_KINDS.find((kind) => kind.id === id) ?? EVENT_KINDS[EVENT_KINDS.length - 1]; }
export function isEventKind(value: unknown): value is string { return typeof value === "string" && EVENT_KINDS.some((kind) => kind.id === value); }
export const CAIRO_TZ = "Africa/Cairo";
export function formatEventDate(iso: string, withTime = true) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: CAIRO_TZ });
  if (!withTime) return day;
  const time = date.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit", timeZone: CAIRO_TZ });
  return `${day} — ${time}`;
}
/** Local date key (YYYY-MM-DD) in Cairo time, used for "today / upcoming" grouping. */
export function cairoDateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
export function eventPhase(event: Pick<VillageEventRecord, "startsAt" | "endsAt">, now = new Date()): "today" | "upcoming" | "past" {
  const start = new Date(event.startsAt), end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 3 * 3600_000);
  if (end.getTime() < now.getTime() && cairoDateKey(start) !== cairoDateKey(now)) return "past";
  return cairoDateKey(start) <= cairoDateKey(now) ? "today" : "upcoming";
}
const icsStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (match) => `\\${match}`);
/** iCalendar payload for «ذكّرني» — opens the phone's calendar app with a reminder one day and one hour before. */
export function eventIcs(event: VillageEventRecord, siteName: string, url: string) {
  const start = new Date(event.startsAt), end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 2 * 3600_000);
  const kind = getEventKind(event.kind);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${icsEscape(siteName)}//AR`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${event.id}@daleel-ganzour`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`, `SUMMARY:${icsEscape(`${kind.icon} ${event.title}`)}`,
    `DESCRIPTION:${icsEscape(`${event.description || kind.name}\n${siteName}: ${url}`)}`, ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []), `URL:${url}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(`غدًا: ${event.title}`)}`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(`بعد ساعة: ${event.title}`)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export function googleCalendarUrl(event: VillageEventRecord, siteName: string) {
  const start = new Date(event.startsAt), end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 2 * 3600_000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${icsStamp(start)}/${icsStamp(end)}`, details: `${event.description || getEventKind(event.kind).name} — ${siteName}`, location: event.location, ctz: CAIRO_TZ });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
export function eventShareText(event: VillageEventRecord, siteName: string, url: string) {
  return `${getEventKind(event.kind).icon} ${event.title}\n🗓️ ${formatEventDate(event.startsAt)}${event.location ? `\n📍 ${event.location}` : ""}${event.description ? `\n${event.description}` : ""}\n— ${siteName}\n${url}`;
}

/* ------------------------------------------------------------------ */
/* Seasonal greetings («تهاني موسمية») — Hijri dates come from ICU       */
/* ------------------------------------------------------------------ */
export type GreetingOverride = { enabled?: boolean; message?: string; start?: string; end?: string };
export type CustomGreeting = { id: string; name: string; icon: string; message: string; start: string; end: string };
export type GreetingSettings = { enabled: boolean; showHeaderBadge: boolean; overrides: Record<string, GreetingOverride>; custom: CustomGreeting[] };
export const defaultGreetingSettings: GreetingSettings = { enabled: true, showHeaderBadge: true, overrides: {}, custom: [] };
export type GreetingOccasion = { id: string; name: string; icon: string; message: string; start: string; end: string; enabled: boolean; custom?: boolean; source: "hijri" | "fixed" | "computed" | "custom" };
type OccasionDef = { id: string; name: string; icon: string; message: string } & ({ hijri: [month: number, day: number, days: number] } | { fixed: [month: number, day: number, days: number] } | { computed: "sham-el-nessim" });
const OCCASIONS: OccasionDef[] = [
  { id: "ramadan", name: "شهر رمضان", icon: "🌙", message: "رمضان كريم 🌙 كل عام وأهل جنزور بخير وصحة وسلام — تقبل الله صيامكم وقيامكم", hijri: [9, 1, 30] },
  { id: "eid-fitr", name: "عيد الفطر", icon: "🎉", message: "عيد فطر مبارك 🎉 كل سنة وأهل جنزور طيبين — وعساكم من عواده", hijri: [10, 1, 3] },
  { id: "eid-adha", name: "عيد الأضحى", icon: "🐑", message: "عيد أضحى مبارك 🐑 كل عام وأنتم بخير — تقبل الله طاعتكم وأضاحيكم", hijri: [12, 9, 5] },
  { id: "hijri-new-year", name: "رأس السنة الهجرية", icon: "☪️", message: "كل عام وأنتم بخير بمناسبة العام الهجري الجديد ☪️ أعاده الله على أهل جنزور باليُمن والبركات", hijri: [1, 1, 2] },
  { id: "mawlid", name: "المولد النبوي الشريف", icon: "🕌", message: "كل عام وأنتم بخير بمناسبة ذكرى المولد النبوي الشريف 🕌 ﷺ", hijri: [3, 12, 2] },
  { id: "new-year", name: "رأس السنة الميلادية", icon: "🎆", message: "كل عام وأهل جنزور بخير 🎆 سنة جديدة سعيدة", fixed: [1, 1, 2] },
  { id: "coptic-christmas", name: "عيد الميلاد المجيد", icon: "🎄", message: "كل سنة وإخوتنا الأقباط طيبين 🎄 عيد ميلاد مجيد", fixed: [1, 6, 2] },
  { id: "jan25", name: "عيد الشرطة و٢٥ يناير", icon: "🇪🇬", message: "كل عام ومصر بخير 🇪🇬 ذكرى ٢٥ يناير وعيد الشرطة", fixed: [1, 25, 1] },
  { id: "mothers-day", name: "عيد الأم", icon: "💐", message: "كل سنة وكل أمهات جنزور بخير 💐 عيد أم سعيد", fixed: [3, 21, 1] },
  { id: "sham-el-nessim", name: "عيد القيامة وشم النسيم", icon: "🌸", message: "كل سنة وأهل جنزور طيبين 🌸 عيد قيامة مجيد وشم نسيم سعيد", computed: "sham-el-nessim" },
  { id: "sinai", name: "عيد تحرير سيناء", icon: "🇪🇬", message: "كل عام ومصر بخير 🇪🇬 ذكرى تحرير سيناء", fixed: [4, 25, 1] },
  { id: "labour", name: "عيد العمال", icon: "🛠️", message: "كل سنة وكل العمال والمهنيين في جنزور بخير 🛠️ عيد عمال سعيد", fixed: [5, 1, 1] },
  { id: "june30", name: "ذكرى ٣٠ يونيو", icon: "🇪🇬", message: "كل عام ومصر بخير 🇪🇬 ذكرى ٣٠ يونيو", fixed: [6, 30, 1] },
  { id: "july23", name: "ثورة ٢٣ يوليو", icon: "🇪🇬", message: "كل عام ومصر بخير 🇪🇬 ذكرى ثورة ٢٣ يوليو", fixed: [7, 23, 1] },
  { id: "oct6", name: "انتصارات أكتوبر", icon: "🎖️", message: "كل عام ومصر بخير 🎖️ ذكرى انتصارات السادس من أكتوبر المجيدة", fixed: [10, 6, 1] },
  { id: "back-to-school", name: "بداية العام الدراسي", icon: "🎒", message: "سنة دراسية سعيدة لكل طلاب جنزور 🎒 ولو محتاج مدرّس خصوصي الدليل فيه كل التخصصات", fixed: [9, 20, 3] },
];
const dateKey = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const addDays = (key: string, days: number) => { const [y, m, d] = key.split("-").map(Number); const date = new Date(Date.UTC(y, m - 1, d + days)); return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()); };
let hijriFormatter: Intl.DateTimeFormat | null | undefined;
function hijriParts(date: Date): { month: number; day: number } | null {
  if (hijriFormatter === undefined) { try { hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: CAIRO_TZ, day: "numeric", month: "numeric", year: "numeric" }); } catch { hijriFormatter = null; } }
  if (!hijriFormatter) return null;
  const parts = hijriFormatter.formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value), day = Number(parts.find((part) => part.type === "day")?.value);
  return Number.isFinite(month) && Number.isFinite(day) ? { month, day } : null;
}
const hijriCache = new Map<number, Map<string, string[]>>();
/** Gregorian dates (Cairo) on which each requested Hijri month/day falls inside a Gregorian year (a Hijri date can occur twice). */
function hijriDatesInYear(year: number) {
  const cached = hijriCache.get(year); if (cached) return cached;
  const map = new Map<string, string[]>();
  for (let offset = 0; offset < 366; offset += 1) {
    const date = new Date(Date.UTC(year, 0, 1 + offset, 12));
    if (date.getUTCFullYear() !== year) break;
    const parts = hijriParts(date); if (!parts) break;
    const key = `${parts.month}/${parts.day}`;
    map.set(key, [...(map.get(key) ?? []), dateKey(year, date.getUTCMonth() + 1, date.getUTCDate())]);
  }
  hijriCache.set(year, map); return map;
}
/** Orthodox (Coptic) Easter Sunday in the Gregorian calendar — Meeus' Julian algorithm + 13-day offset (valid 1900–2099). */
export function orthodoxEaster(year: number) {
  const a = year % 4, b = year % 7, c = year % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  const julian = new Date(Date.UTC(year, month - 1, day + 13));
  return dateKey(julian.getUTCFullYear(), julian.getUTCMonth() + 1, julian.getUTCDate());
}
/** All built-in occasions with their dates for one Gregorian year (Hijri ones may appear twice or be absent that year). */
export function occasionsForYear(year: number): GreetingOccasion[] {
  const list: GreetingOccasion[] = [];
  for (const def of OCCASIONS) {
    if ("fixed" in def) { const start = dateKey(year, def.fixed[0], def.fixed[1]); list.push({ id: def.id, name: def.name, icon: def.icon, message: def.message, start, end: addDays(start, def.fixed[2] - 1), enabled: true, source: "fixed" }); }
    else if ("computed" in def) { const start = orthodoxEaster(year); list.push({ id: def.id, name: def.name, icon: def.icon, message: def.message, start, end: addDays(start, 1), enabled: true, source: "computed" }); }
    else for (const start of hijriDatesInYear(year).get(`${def.hijri[0]}/${def.hijri[1]}`) ?? []) list.push({ id: def.id, name: def.name, icon: def.icon, message: def.message, start, end: addDays(start, def.hijri[2] - 1), enabled: true, source: "hijri" });
  }
  return list.sort((a, b) => a.start.localeCompare(b.start));
}
export function sanitizeGreetingSettings(input: unknown): GreetingSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const day = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");
  const overrides: Record<string, GreetingOverride> = {};
  const rawOverrides = (raw.overrides && typeof raw.overrides === "object" ? raw.overrides : {}) as Record<string, Record<string, unknown>>;
  for (const def of OCCASIONS) {
    const item = rawOverrides[def.id]; if (!item || typeof item !== "object") continue;
    const entry: GreetingOverride = {};
    if (item.enabled === false) entry.enabled = false;
    if (text(item.message, 260)) entry.message = text(item.message, 260);
    if (day(item.start)) entry.start = day(item.start);
    if (day(item.end)) entry.end = day(item.end);
    if (Object.keys(entry).length) overrides[def.id] = entry;
  }
  const custom = (Array.isArray(raw.custom) ? raw.custom : []).slice(0, 20).map((item) => {
    const entry = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const start = day(entry.start), end = day(entry.end) || start;
    return { id: text(entry.id, 40) || `custom-${Math.random().toString(36).slice(2, 8)}`, name: text(entry.name, 80), icon: text(entry.icon, 4) || "🎊", message: text(entry.message, 260), start, end: end < start ? start : end };
  }).filter((item) => item.name && item.message && item.start);
  return { enabled: raw.enabled !== false, showHeaderBadge: raw.showHeaderBadge !== false, overrides, custom };
}
/** Built-in + custom occasions for a year with the admin's overrides applied — what the admin edits and what the ticker reads. */
export function resolvedGreetings(settings: GreetingSettings, year: number): GreetingOccasion[] {
  const builtIn = occasionsForYear(year).map((item) => {
    const override = settings.overrides[item.id] ?? {};
    // Date overrides are year-specific: an admin correction for 2026 must not stretch the 2025 instance.
    const sameYear = (value?: string) => Boolean(value && value.startsWith(String(year)));
    const start = sameYear(override.start) ? override.start! : item.start;
    const end = sameYear(override.end) && override.end! >= start ? override.end! : sameYear(override.start) ? start : item.end;
    return { ...item, enabled: override.enabled !== false, message: override.message || item.message, start, end };
  });
  const custom = settings.custom.map((item) => ({ ...item, enabled: true, custom: true, source: "custom" as const }));
  return [...builtIn, ...custom].sort((a, b) => a.start.localeCompare(b.start));
}
export type ActiveGreeting = { id: string; name: string; icon: string; message: string };
/** Greetings that should be visible right now (Cairo date), de-duplicated by occasion. */
export function activeGreetings(settings: GreetingSettings, now = new Date()): ActiveGreeting[] {
  if (!settings.enabled) return [];
  const today = cairoDateKey(now), year = Number(today.slice(0, 4));
  const seen = new Set<string>(), result: ActiveGreeting[] = [];
  for (const item of [...resolvedGreetings(settings, year - 1), ...resolvedGreetings(settings, year)]) {
    if (!item.enabled || item.start > today || item.end < today || seen.has(item.id)) continue;
    seen.add(item.id); result.push({ id: item.id, name: item.name, icon: item.icon, message: item.message });
  }
  return result;
}
/** Extra ticker lines: active greetings first, then the nearest event within two weeks. */
export function liveTickerItems(greetings: ActiveGreeting[] | undefined, events: VillageEventRecord[] | undefined, now = new Date()): string[] {
  const lines = (greetings ?? []).map((item) => `${item.icon} ${item.message}`);
  const soon = (events ?? []).filter((event) => eventPhase(event, now) !== "past" && new Date(event.startsAt).getTime() - now.getTime() < 14 * 86_400_000).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  if (soon) lines.push(`📅 ${eventPhase(soon, now) === "today" ? "اليوم" : "قريبًا"}: ${soon.title} — ${formatEventDate(soon.startsAt, false)}${soon.location ? ` — ${soon.location}` : ""}`);
  return lines;
}


/** المهن التي لها رسم ثلاثي الأبعاد مرسوم باليد (الباقي يُولَّد تلقائيًا بنفس الأسلوب من أيقونته) في /images/profession-art.svg (معرّف التصنيف = معرّف الرمز). */
export const professionArtIds = ["electricity", "plumbing", "carpentry", "painting", "ac", "mechanics", "dentistry", "pharmacies", "teachers", "barbers", "groceries", "photography", "metalwork", "masonry", "tiles", "family", "pediatrics", "ophthalmology", "medical-labs", "butchers", "bakeries", "produce", "cafes", "mobile-shops", "cameras", "rides", "lawyers", "clothing", "hairdressers", "makeup", "dj", "wedding-planning", "moving", "apartment-cleaning", "solar", "gyms", "veterinary", "tailors", "poultry", "fish-shops", "stationery"] as const;
export function hasProfessionArt(categoryId: string) { return (professionArtIds as readonly string[]).includes(categoryId); }
/** أسماء عربية لرسومات المهن اليدوية (لاختيار رسمة لتخصص جديد من لوحة الإدارة). */
export const professionArtLabels: Record<(typeof professionArtIds)[number], string> = {
  electricity: "كهربائي", plumbing: "سباك", carpentry: "نجار", painting: "نقاش", ac: "تكييف", mechanics: "ميكانيكي", dentistry: "أسنان", pharmacies: "صيدلية", teachers: "مدرّس", barbers: "حلاق", groceries: "بقالة", photography: "مصوّر",
  metalwork: "حدادة", masonry: "بناء ومحارة", tiles: "سيراميك", family: "طبيب", pediatrics: "أطفال", ophthalmology: "عيون", "medical-labs": "معمل تحاليل", butchers: "جزارة", bakeries: "مخبز", produce: "خضار وفاكهة", cafes: "كافيه", "mobile-shops": "موبايلات", cameras: "كاميرات", rides: "سيارة ومشاوير", lawyers: "محاماة", clothing: "ملابس",
  hairdressers: "كوافير", makeup: "ميكب", dj: "دي جي", "wedding-planning": "أفراح", moving: "نقل عفش", "apartment-cleaning": "تنظيف", solar: "طاقة شمسية", gyms: "جيم", veterinary: "بيطري", tailors: "ترزي", poultry: "دواجن", "fish-shops": "أسماك", stationery: "مكتبة",
};

/** معرّفات التخصصات المثبّتة يدويًا في أول صف «أهم مهن القرية» (مفصولة بفواصل، بحد أقصى 6). */
export function parsePinnedProfessions(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const seen = new Set<string>(); const out: string[] = [];
  for (const raw of value.split(",")) {
    const id = raw.trim().toLowerCase();
    if (/^[a-z0-9-]{2,60}$/.test(id) && !seen.has(id)) { seen.add(id); out.push(id); }
    if (out.length >= 6) break;
  }
  return out;
}

/** يقرر لون نص مقروء (أبيض أو داكن) تلقائيًا حسب إضاءة لون الخلفية (WCAG relative luminance). */
/** لون نص الشريط النهاري: المخصص من الاستوديو إن وُجد، وإلا تلقائي حسب الخلفية. */
export function announcementTextLight(design: Pick<DesignSettings, "announcementBgColorLight" | "announcementTextColorLight">): string {
  return design.announcementTextColorLight || readableTextOn(design.announcementBgColorLight);
}
export function readableTextOn(hex: string, dark = "#0f2340", light = "#ffffff"): string {
  const clean = String(hex ?? "").trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return light;
  const channel = (i: number) => { const v = parseInt(full.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.42 ? dark : light;
}

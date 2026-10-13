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
  plumbing: ["موتور مياه", "ماتور مياه", "حنفيه", "مواسير", "صرف", "تسريب", "سخان", "فلتر", "بلاعه", "خلاط مياه", "قاعده حمام", "حوض", "سباك"],
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
  transport: ["مواصلات", "عربيه", "ميكروباص", "توكتوك", "نقل عفش", "توصيل", "مشوار", "سوزوكي", "ربع نقل"],
  cameras: ["كاميرات مراقبه", "انتركوم", "انذار", "شبكات", "راوتر", "واي فاي", "دش", "رسيفر"],
  solar: ["طاقه شمسيه", "الواح شمسيه", "انفرتر", "بطاريات طاقه"],
  cleaning: ["نظافه", "غسيل سجاد", "تنظيف منازل", "مكافحه حشرات", "رش حشرات"],
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

export type GanzourTransitRoute = {
  id: string;
  title: string;
  fromTo: string;
  station: string;
  schedule: string;
  vehicleType: string;
  notes: string;
  tone: "blue" | "emerald" | "amber" | "purple";
};

export const ganzourTransitRoutes: GanzourTransitRoute[] = [
  {
    id: "shibin",
    title: "خط جنزور ↔ شبين الكوم",
    fromTo: "جنزور ⇄ شبين الكوم",
    station: "الموقف الرئيسي بمدخل جنزور / موقف شبين",
    schedule: "يومياً من ٦:٠٠ صباحاً حتى ١١:٠٠ مساءً",
    vehicleType: "ميكروباص وسرفيس",
    notes: "يربط قرية جنزور بمصالح ومستشفيات وجامعة شبين الكوم مباشرة.",
    tone: "blue",
  },
  {
    id: "berket-elsabaa",
    title: "خط جنزور ↔ بركة السبع",
    fromTo: "جنزور ⇄ بركة السبع",
    station: "مدخل جنزور / موقف بركة السبع",
    schedule: "يومياً من ٦:٠٠ صباحاً حتى ١١:٣٠ مساءً",
    vehicleType: "ميكروباص مستمر",
    notes: "وصول سريع لمركز بركة السبع ومحطة القطار والمستشفى المركزي والبنوك.",
    tone: "emerald",
  },
  {
    id: "tanta",
    title: "خط جنزور ↔ طنطا",
    fromTo: "جنزور ⇄ طنطا",
    station: "الطريق الزراعي / موقف بركة السبع",
    schedule: "يومياً من ٦:٠٠ صباحاً حتى ١٠:٣٠ مساءً",
    vehicleType: "ميكروباص وسرفيس",
    notes: "للوصول السريع إلى جامعة ومستشفيات وأسواق مدينة طنطا.",
    tone: "amber",
  },
  {
    id: "cairo",
    title: "خط جنزور ↔ القاهرة الكبرى",
    fromTo: "جنزور ⇄ المؤسسة / عبود / السلام",
    station: "عبر موقف بركة السبع أو شبين الكوم",
    schedule: "يومياً من ٥:٠٠ فجراً حتى ١٠:٠٠ مساءً",
    vehicleType: "ميكروباص الخط السريع والقطارات",
    notes: "خطوط منتظمة للقاهرة الكبرى عبر الطريق الزراعي أو محطة قطار بركة السبع.",
    tone: "purple",
  },
];

// Only an explicit activation renews availability; editing other fields preserves the deadline.
export function availabilityUpdate(action: unknown, current: { availableNow: boolean; availableUntil: Date | null }, now = Date.now()) {
  if (action === undefined || action === "keep") return current;
  if (action === "stop") return { availableNow: false, availableUntil: null };
  if (action === "activate") return { availableNow: true, availableUntil: new Date(now + AVAILABILITY_HOURS * 60 * 60 * 1000) };
  throw new Error("اختار إجراء إتاحة صحيح.");
}

export type CategoryRecord = {
  id: string; name: string; parentId: string | null; description: string;
  color: string; light: string; icon: string; sortOrder: number; active: boolean;
};
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
  availabilityToken?: string; comments?: ServiceComment[]; emergency: boolean; availableNow: boolean; availableUntil: string | null; workingHours: WorkingHours; serviceItems: string[]; subSpecialties: string[]; neededRank: number; hours: string; menuUrl: string; menuWhatsapp: string; rating: string; reviews: number; createdAt: string;
  completionStatus?: CompletionStatus; completionNote?: string; completionDraft?: ServiceCompletionDraft | null;
};

export function missingServiceData(service: ServiceRecord) {
  return [
    !service.address.trim() && "العنوان",
    !service.serviceItems.length && "الخدمات التفصيلية",
    !service.subSpecialties.length && "التخصصات الفرعية",
  ].filter((item): item is string => typeof item === "string");
}

export type TrustBadge = {
  id: "complete-profile" | "community-recommended" | "fast-response";
  label: string;
  tone: "emerald" | "amber" | "blue";
};

export function getServiceTrustBadges(
  service: Pick<ServiceRecord, "address" | "description" | "serviceItems" | "subSpecialties" | "rating" | "reviews" | "comments" | "featured" | "verified" | "availableNow" | "availableUntil" | "emergency" | "phoneSecondary">,
  now = Date.now(),
): TrustBadge[] {
  const badges: TrustBadge[] = [];
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
      const isPharmacy = service.category === "pharmacies";
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

export type TeacherStageId = "all" | "foundation" | "primary" | "prep" | "secondary" | "azhar";
export type TeacherStageOption = {
  id: Exclude<TeacherStageId, "all">;
  label: string;
  shortLabel: string;
  keywords: string[];
};

export const TEACHER_STAGES: TeacherStageOption[] = [
  { id: "foundation", label: "تأسيس ورياض أطفال", shortLabel: "تأسيس", keywords: ["تاسيس", "رياض اطفال", "كي جي", "حضانه", "قراءه وكتابه", "فونكس"] },
  { id: "primary", label: "المرحلة الابتدائية", shortLabel: "ابتدائي", keywords: ["ابتدائي", "الابتدائيه", "ابتدائيه", "رابعه ابتدائي", "خامسه ابتدائي", "سته ابتدائي"] },
  { id: "prep", label: "المرحلة الإعدادية", shortLabel: "إعدادي", keywords: ["اعدادي", "الاعداديه", "اعداديه", "تالته اعدادي", "الشهاده الاعداديه"] },
  { id: "secondary", label: "المرحلة الثانوية", shortLabel: "ثانوي", keywords: ["ثانوي", "الثانويه", "ثانويه عامه", "اولي ثانوي", "تانيه ثانوي", "تالته ثانوي"] },
  { id: "azhar", label: "التعليم الأزهري", shortLabel: "أزهري", keywords: ["ازهر", "ازهري", "الازهريه", "معهد ازهري", "قران", "تجويد", "شرعي"] },
];

export function getTeacherStagesForService(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties">,
): TeacherStageOption[] {
  const haystack = normalizeSearch(
    `${service.name} ${service.description} ${(service.subSpecialties ?? []).join(" ")} ${(service.serviceItems ?? []).join(" ")}`,
  );
  const allStages = /كل المراحل|جميع المراحل|لكل المراحل/.test(haystack);
  return TEACHER_STAGES.filter((stage) => {
    if (stage.keywords.some((kw) => haystack.includes(normalizeSearch(kw)))) return true;
    if (allStages && (stage.id === "primary" || stage.id === "prep" || stage.id === "secondary")) return true;
    return false;
  });
}

export function matchesTeacherStage(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties">,
  stageId: TeacherStageId,
): boolean {
  if (!stageId || stageId === "all") return true;
  const matched = getTeacherStagesForService(service);
  return matched.some((item) => item.id === stageId);
}

export const HOME_DELIVERY_TAG = "خدمة التوصيل للمنازل بجنزور";
const homeDeliveryRegex = /توصيل|دليفري|للمنازل|من المنازل|من المنزل|بالمنزل|منزلي|منزليه|زياره منزليه|كشف منزلي|سحب عينات من المنزل|لباب البيت/;

export function supportsHomeDelivery(
  service: Pick<ServiceRecord, "name" | "description" | "serviceItems" | "subSpecialties" | "category">,
): boolean {
  if (service.category === "transport") return true;
  const haystack = normalizeSearch(
    `${service.name} ${service.description} ${(service.serviceItems ?? []).join(" ")} ${(service.subSpecialties ?? []).join(" ")}`,
  );
  return homeDeliveryRegex.test(haystack);
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
    : category.id === "pharmacies"
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
    category.parentId === "clinics" || category.parentId === "labs" || category.id === "pharmacies"
      ? `رعاية طبية متكاملة في ${specName} بأحدث الأجهزة، مع إمكانية الحجز والاستفسار المسبق ومتابعة الحالات الطارئة بجنزور.`
      : `تنفيذ وصيانة جميع أعمال ${specName} بأفضل الخامات، مع المعاينة والمتابعة لخدمة أهالي قرية جنزور.`,
  ];

  const rawKeywords = specialtySynonyms[categoryId] ?? [];
  const isTeacher = category.parentId === "teachers" || category.id === "teachers";
  const subSpecialties = isTeacher
    ? [...TEACHER_STAGES.map((stage) => stage.label), ...rawKeywords.slice(0, 4)]
    : rawKeywords.length > 0
      ? rawKeywords.slice(0, 7)
      : [`أعمال ${specName} العامة`, `صيانة ومتابعة دورية`, `استشارات ومعاينة`, `طوارئ وخدمة سريعة`];

  const baseItems = specialtyServiceItemSuggestions[categoryId] ?? [
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
  | "classic-blue"
  | "emerald"
  | "royal-navy"
  | "warm-gold"
  | "festive"
  | "ramadan"
  | "eid"
  | "schools"
  | "winter-emergency"
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
  sectionHeadingStyle: "plain" | "pill" | "underline" | "framed";
  // 3. Cards, Frames & Borders
  borderWidth: "none" | "thin" | "medium" | "double";
  borderColor: string;
  cardBgColor: string;
  cardRadius: "sharp" | "medium" | "rounded" | "pill";
  cardShadow: "none" | "soft" | "elevated-3d";
  // 4. Buttons Style
  buttonShape: "pill" | "rounded" | "square";
  buttonEffect: "gradient" | "solid" | "outline" | "3d";
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
  // 7. Login & Register Customizer
  authShowBanner: boolean;
  authBannerImage: string;
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
  announcementStyle: "static" | "badge" | "soft";
  heroStyle: "sky-banner" | "gradient-card" | "compact-minimal";
  searchBoxStyle: "rounded" | "pill" | "floating-glass";
  providerCardLayout: "classic" | "compact" | "centered";
  showProviderBadges: boolean;
  showProviderShareBtn: boolean;
  showProviderWhatsappBtn: boolean;
  whatsappButtonColor: string;
  sectionSpacing: "compact" | "normal" | "relaxed";
  cardHoverEffect: "lift" | "glow" | "scale" | "none";
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
  // 10. Multi-Item News Ticker & Subtle Background Patterns
  announcementItems: string;
  announcementTickerMode: "single" | "rotate" | "marquee";
  announcementSpeed: "slow" | "normal" | "fast";
  headerPattern: "none" | "dots" | "grid" | "islamic" | "waves";
  heroPattern: "none" | "dots" | "grid" | "islamic" | "waves" | "stars";
  patternOpacity: "subtle" | "medium" | "clear";
};

export const defaultDesignSettings: DesignSettings = {
  themePreset: "classic-blue",
  primaryColor: "#0878c9",
  pageBgColor: "#f3f7fa",
  modalHeaderBg: "#dcecfb",
  buttonColor: "#0c72c7",
  themeMode: "auto",
  headingAlign: "right",
  cardTextAlign: "center",
  noticeAlign: "center",
  fontScale: "normal",
  fontWeight: "bold",
  fontFamily: "cairo",
  sectionHeadingStyle: "pill",
  borderWidth: "thin",
  borderColor: "#dce6ef",
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
  sectionOrder: "hero,features,featured,categories,transit,professionBanner",
  showHero: true,
  showFeatureCards: true,
  showFeaturedSection: true,
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
  footerBgColor: "#102437",
  showFooterWhatsapp: true,
  splashEnabled: true,
  splashImageUrl: "/images/logo-daleel-transparent.png",
  splashDuration: "900",
  authShowBanner: true,
  authBannerImage: "",
  loginTitle: "دخول الأعضاء وإدارة الموقع",
  loginSubtitle: "للأعضاء المسجلين أو إدارة الموقع",
  registerTitle: "أنشئ حساب عضو جديد",
  registerSubtitle: "عضوية مجانية وسريعة لأهالي قرية جنزور",
  authFieldsLayout: "two-col",
  authInputBorderColor: "#c8ddf0",
  announcementEnabled: false,
  announcementText: "أهلاً بكم في دليل جنزور — أضف مهنتك مجاناً وتواصل مع أهل القرية مباشرة",
  announcementBgColor: "#0c72c7",
  announcementStyle: "static",
  heroStyle: "sky-banner",
  searchBoxStyle: "rounded",
  providerCardLayout: "classic",
  showProviderBadges: true,
  showProviderShareBtn: true,
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
  mobileBottomNavEnabled: true,
  showPrayerWeatherBar: true,
  showTransitGuide: true,
  showInstallAppBanner: true,
  showAdminQuickEdit: true,
  announcementItems:
    "أهلاً بكم في دليل جنزور — كل خدمات القرية في مكان واحد\nأضف مهنتك أو نشاطك التجاري مجاناً وتواصل مع الأهالي مباشرة\nالصيدليات والعيادات المناوبة وأرقام الطوارئ متاحة على مدار الساعة",
  announcementTickerMode: "rotate",
  announcementSpeed: "normal",
  headerPattern: "none",
  heroPattern: "none",
  patternOpacity: "subtle",
};

export const designThemePresets: Record<Exclude<DesignSettings["themePreset"], "custom">, { label: string; description: string; badge?: string; colors: Pick<DesignSettings, "primaryColor" | "pageBgColor" | "modalHeaderBg" | "buttonColor" | "borderColor" | "cardBgColor" | "headerBgColor" | "footerBgColor"> }> = {
  "classic-blue": {
    label: "أزرق جنزور الكلاسيكي",
    description: "الهوية الافتراضية المريحة للعين بتدرجات السماوي والأزرق",
    colors: { primaryColor: "#0878c9", pageBgColor: "#f3f7fa", modalHeaderBg: "#dcecfb", buttonColor: "#0c72c7", borderColor: "#dce6ef", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#102437" },
  },
  emerald: {
    label: "أخضر زمردي طبيعي",
    description: "ثيم هادئ بألوان الطبيعة والزمرد مع خلفية ناعمة",
    colors: { primaryColor: "#0d8a5f", pageBgColor: "#f2f8f5", modalHeaderBg: "#d6f2e6", buttonColor: "#0f8c62", borderColor: "#cfe6dc", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#0d2920" },
  },
  "royal-navy": {
    label: "كحلي ملكي فاخر",
    description: "تصميم رسمي أنيق بدرجات الكحلي الملكي والأزرق العميق",
    colors: { primaryColor: "#1d4ed8", pageBgColor: "#f1f5f9", modalHeaderBg: "#dbeafe", buttonColor: "#1e40af", borderColor: "#cbd5e1", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#0f172a" },
  },
  "warm-gold": {
    label: "ذهبي دافئ وتراثي",
    description: "ألوان دافئة تجمع بين الكهرمان الذهبي والكحلي",
    colors: { primaryColor: "#b45309", pageBgColor: "#faf7f2", modalHeaderBg: "#fde6c4", buttonColor: "#c2610c", borderColor: "#eadbc8", cardBgColor: "#ffffff", headerBgColor: "#fffdf9", footerBgColor: "#271a0c" },
  },
  festive: {
    label: "ثيم المناسبات العام",
    description: "طابع احتفالي مميز للأعياد والمناسبات العامة",
    colors: { primaryColor: "#6d28d9", pageBgColor: "#f6f4fb", modalHeaderBg: "#e9d5ff", buttonColor: "#7c3aed", borderColor: "#ddd6fe", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#1e1035" },
  },
  ramadan: {
    label: "🌙 ثيم شهر رمضان المبارك",
    badge: "موسمي",
    description: "ألوان الكحلي الرمضاني والذهبي الدافئ مع أجواء روحانية لأهل جنزور",
    colors: { primaryColor: "#b45309", pageBgColor: "#fbf8f1", modalHeaderBg: "#fef3c7", buttonColor: "#0f3d5e", borderColor: "#e8dcc4", cardBgColor: "#ffffff", headerBgColor: "#fffdf8", footerBgColor: "#0c1f33" },
  },
  eid: {
    label: "🎉 ثيم العيد والفرحة",
    badge: "موسمي",
    description: "ألوان الفيروزي المشرق والبهجة لاحتفالات عيد الفطر وعيد الأضحى",
    colors: { primaryColor: "#0d9488", pageBgColor: "#f0fdf9", modalHeaderBg: "#ccfbf1", buttonColor: "#0f766e", borderColor: "#b9ece3", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#112a28" },
  },
  schools: {
    label: "🎒 ثيم العودة للمدارس",
    badge: "موسمي",
    description: "طابع تعليمي نشط يبرز قسم المدرسين والمكتبات والخدمات التعليمية",
    colors: { primaryColor: "#2563eb", pageBgColor: "#f4f7ff", modalHeaderBg: "#dbeafe", buttonColor: "#d97706", borderColor: "#d4e0f7", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#172554" },
  },
  "winter-emergency": {
    label: "🌧️ ثيم الطوارئ والشتاء",
    badge: "موسمي",
    description: "تباين عالٍ وواضح يبرز أرقام الطوارئ والصيدليات والخدمات العاجلة",
    colors: { primaryColor: "#0369a1", pageBgColor: "#f0f6fa", modalHeaderBg: "#bae6fd", buttonColor: "#dc2626", borderColor: "#c5d9e8", cardBgColor: "#ffffff", headerBgColor: "#ffffff", footerBgColor: "#082032" },
  },
};

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
    ["classic-blue", "emerald", "royal-navy", "warm-gold", "festive", "ramadan", "eid", "schools", "winter-emergency", "custom"] as const,
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
  next.sectionHeadingStyle = pickEnum(record.sectionHeadingStyle, ["plain", "pill", "underline", "framed"] as const, defaultDesignSettings.sectionHeadingStyle);

  next.borderWidth = pickEnum(record.borderWidth, ["none", "thin", "medium", "double"] as const, defaultDesignSettings.borderWidth);
  next.borderColor = hexColor(record.borderColor, defaultDesignSettings.borderColor);
  next.cardBgColor = hexColor(record.cardBgColor, defaultDesignSettings.cardBgColor);
  next.cardRadius = pickEnum(record.cardRadius, ["sharp", "medium", "rounded", "pill"] as const, defaultDesignSettings.cardRadius);
  next.cardShadow = pickEnum(record.cardShadow, ["none", "soft", "elevated-3d"] as const, defaultDesignSettings.cardShadow);

  next.buttonShape = pickEnum(record.buttonShape, ["pill", "rounded", "square"] as const, defaultDesignSettings.buttonShape);
  next.buttonEffect = pickEnum(record.buttonEffect, ["gradient", "solid", "outline", "3d"] as const, defaultDesignSettings.buttonEffect);
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

  next.authShowBanner = pickBool(record.authShowBanner, defaultDesignSettings.authShowBanner);
  next.authBannerImage = pickText(record.authBannerImage, defaultDesignSettings.authBannerImage, 300, true);
  next.loginTitle = pickText(record.loginTitle, defaultDesignSettings.loginTitle, 120);
  next.loginSubtitle = pickText(record.loginSubtitle, defaultDesignSettings.loginSubtitle, 180);
  next.registerTitle = pickText(record.registerTitle, defaultDesignSettings.registerTitle, 120);
  next.registerSubtitle = pickText(record.registerSubtitle, defaultDesignSettings.registerSubtitle, 180);
  next.authFieldsLayout = pickEnum(record.authFieldsLayout, ["two-col", "one-col"] as const, defaultDesignSettings.authFieldsLayout);
  next.authInputBorderColor = hexColor(record.authInputBorderColor, defaultDesignSettings.authInputBorderColor);

  next.announcementEnabled = pickBool(record.announcementEnabled, defaultDesignSettings.announcementEnabled);
  next.announcementText = pickText(record.announcementText, defaultDesignSettings.announcementText, 240);
  next.announcementBgColor = hexColor(record.announcementBgColor, defaultDesignSettings.announcementBgColor);
  next.announcementStyle = pickEnum(record.announcementStyle, ["static", "badge", "soft"] as const, defaultDesignSettings.announcementStyle);
  next.heroStyle = pickEnum(record.heroStyle, ["sky-banner", "gradient-card", "compact-minimal"] as const, defaultDesignSettings.heroStyle);
  next.searchBoxStyle = pickEnum(record.searchBoxStyle, ["rounded", "pill", "floating-glass"] as const, defaultDesignSettings.searchBoxStyle);
  next.providerCardLayout = pickEnum(record.providerCardLayout, ["classic", "compact", "centered"] as const, defaultDesignSettings.providerCardLayout);
  next.showProviderBadges = pickBool(record.showProviderBadges, defaultDesignSettings.showProviderBadges);
  next.showProviderShareBtn = pickBool(record.showProviderShareBtn, defaultDesignSettings.showProviderShareBtn);
  next.showProviderWhatsappBtn = pickBool(record.showProviderWhatsappBtn, defaultDesignSettings.showProviderWhatsappBtn);
  next.whatsappButtonColor = hexColor(record.whatsappButtonColor, defaultDesignSettings.whatsappButtonColor);
  next.sectionSpacing = pickEnum(record.sectionSpacing, ["compact", "normal", "relaxed"] as const, defaultDesignSettings.sectionSpacing);
  next.cardHoverEffect = pickEnum(record.cardHoverEffect, ["lift", "glow", "scale", "none"] as const, defaultDesignSettings.cardHoverEffect);
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

  next.announcementItems = pickText(record.announcementItems, defaultDesignSettings.announcementItems, 1200, true);
  next.announcementTickerMode = pickEnum(record.announcementTickerMode, ["single", "rotate", "marquee"] as const, defaultDesignSettings.announcementTickerMode);
  next.announcementSpeed = pickEnum(record.announcementSpeed, ["slow", "normal", "fast"] as const, defaultDesignSettings.announcementSpeed);
  next.headerPattern = pickEnum(record.headerPattern, ["none", "dots", "grid", "islamic", "waves"] as const, defaultDesignSettings.headerPattern);
  next.heroPattern = pickEnum(record.heroPattern, ["none", "dots", "grid", "islamic", "waves", "stars"] as const, defaultDesignSettings.heroPattern);
  next.patternOpacity = pickEnum(record.patternOpacity, ["subtle", "medium", "clear"] as const, defaultDesignSettings.patternOpacity);

  return next;
}

export type PublicDirectory = {
  services: ServiceRecord[]; categories: CategoryRecord[];
  areas: AreaRecord[]; settings: SiteSettings; memberCount: number; previewMode?: boolean;
  utilityNumbers?: PublicUtilityContact[];
  providerNotifications?: NotificationRecord[];
  designSettings?: DesignSettings;
};
export type RatingRecord = { id: string; serviceId: string; serviceName: string; memberName: string; stars: number; comment: string; status: string; createdAt: string };
export type ServiceComment = { stars: number; comment: string; member: string; date: string };
export type FollowFeedItem = { id: string; createdAt: string };
export type FollowState = { followed: string[]; feed: FollowFeedItem[] };
export type AdminDirectory = PublicDirectory & { members: MemberRecord[]; communityListings: CommunityListingRecord[]; notifications: NotificationRecord[]; notificationUnread: number; ratings: RatingRecord[] };

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
  "other-services": "يضم مجموعة من الخدمات المهنية والمتخصصة التي يحتاج إليها أهالي جنزور ولا تندرج تحت الأقسام الرئيسية الأخرى. يساعدك على الوصول إلى مقدمي الخدمات المختلفة والتواصل معهم لمعرفة التفاصيل وطرق الاستفادة منها.",
};

const specialtyDescriptions: Record<string, string> = {
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
  cleaning: "دليل لمقدمي خدمات النظافة والعناية بالمنازل والمساحات المختلفة، وفقًا لطبيعة الخدمة التي يوفرها كل مقدم. يمكنك التواصل للاستفسار عن أنواع الأعمال المتاحة ومواعيد التنفيذ ونطاق الخدمة والتكلفة.",
  other: "مساحة للخدمات المهنية والمجتمعية المتنوعة التي لا تندرج ضمن التخصصات الأخرى في الدليل. تساعدك على التعرف على مقدمي الخدمات داخل جنزور والوصول إلى بيانات التواصل للاستفسار عن طبيعة الخدمة وتفاصيلها.",
};

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
  "other-services": [["law", "المحاماة والاستشارات", "Scale"], ["transport", "النقل والمواصلات", "Truck"], ["cameras", "كاميرات المراقبة", "Cctv"], ["solar", "الطاقة الشمسية", "Sun"], ["cleaning", "النظافة والخدمات المنزلية", "Sparkles"], ["other", "خدمات متنوعة", "Ellipsis"]],
};
export const iconNames = ["Wrench", "Stethoscope", "Store", "GraduationCap", "HandHeart", "Grid2X2", "Hammer", "Droplets", "Zap", "Anvil", "Paintbrush", "BrickWall", "PanelsTopLeft", "Snowflake", "Cog", "Armchair", "Baby", "Smile", "HeartPulse", "Bone", "Sparkles", "Eye", "Activity", "ShoppingBasket", "Pill", "Shirt", "BookOpen", "Tv", "Utensils", "Smartphone", "Languages", "Calculator", "FlaskConical", "Globe", "Heart", "UsersRound", "Scale", "Truck", "Cctv", "Sun", "Ellipsis"];
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
};
export const initialCategories: CategoryRecord[] = roots.flatMap(([id, name, color, icon, description], sortOrder) => [
  { id, name, color, light: `${color}12`, icon, description: sectionDescriptions[id] ?? description, sortOrder, parentId: null, active: true },
  ...specialties[id].map(([childId, childName, childIcon], order) => ({ id: childId, name: childName, color, light: `${color}12`, icon: childIcon, description: `${specialtyDescriptions[childId] ?? `مقدمو خدمات ${childName} بقرية جنزور`} المجال: ${childName}.`, sortOrder: order, parentId: id, active: true })),
]);
export const categories = initialCategories.filter((category) => !category.parentId);

export function getCategory(id: string, catalog: CategoryRecord[] = initialCategories): CategoryRecord {
  return catalog.find((category) => category.id === id) ?? { id, name: "خدمة", color: "#0876e1", light: "#edf6ff", icon: "Wrench", parentId: null, sortOrder: 0, active: true, description: "" };
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
  { id: "00000000-0000-4000-8000-000000000008", name: "مكتب العدالة للمحاماة", category: "law", area: areas[0], address: areas[0], phone: "01077889900", description: "استشارات قانونية وصياغة العقود وخدمات تأسيس الشركات.", rating: "4.7", reviews: 24, emergency: false, featured: false },
];

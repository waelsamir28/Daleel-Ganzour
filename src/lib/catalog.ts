export const OFFICE_PHONE = "01222355769";
export const OFFICE_WHATSAPP = "https://wa.me/201222355769";
export const OTHER_ADDRESS = "عنوان آخر";

export type CategoryRecord = {
  id: string; name: string; parentId: string | null; description: string;
  color: string; light: string; icon: string; sortOrder: number; active: boolean;
};
export type AreaRecord = { id: string; name: string; sortOrder: number };
export type ServiceRecord = {
  id: string; name: string; category: string; area: string; address: string; phone: string; phoneSecondary: string;
  description: string; status: string; verified: boolean; featured: boolean; demo: boolean;
  emergency: boolean; rating: string; reviews: number; createdAt: string;
};

// A provider counts as new in the directory for this many days after it was created.
export const NEW_SERVICE_DAYS = 30;
export function isNewService(service: Pick<ServiceRecord, "createdAt">, now = Date.now()) {
  const age = now - Date.parse(service.createdAt);
  return Number.isFinite(age) && age >= 0 && age < NEW_SERVICE_DAYS * 24 * 60 * 60 * 1000;
}

export type MemberRole = "member" | "moderator";
export type MemberRecord = { id: string; name: string; username: string; phone: string; role: MemberRole; active: boolean; createdAt: string };
export type NotificationRecord = { id: string; type: string; title: string; message: string; entityId: string; read: boolean; createdAt: string };
export type Viewer = { role: "guest" | "member" | "moderator" | "admin"; id?: string; name?: string; username?: string };
export type SiteSettings = {
  siteName: string; heroSubtitle: string; heroEyebrow: string; tagline: string;
  benefitsHeading: string; benefitsText: string; contactText: string; copyright: string;
  phone: string; showEmergency: boolean;
};
export type PublicDirectory = {
  services: ServiceRecord[]; categories: CategoryRecord[];
  areas: AreaRecord[]; settings: SiteSettings; memberCount: number; previewMode?: boolean;
};
export type AdminDirectory = PublicDirectory & { members: MemberRecord[]; notifications: NotificationRecord[]; notificationUnread: number };

export const defaultSettings: SiteSettings = {
  siteName: "دليل المهن والخدمات بقرية جنزور",
  heroSubtitle: "أهل الخبرة قريبين منك.. كل خدمات جنزور في مكان واحد",
  heroEyebrow: "دليل أهل جنزور", tagline: "بسهولة • بسرعة • بثقة",
  benefitsHeading: "ليه تختار دليل قرية جنزور؟",
  benefitsText: "دليل يجمع أهل القرية.. ويوصّل كل خدمة لأصحابها",
  contactText: "لمتابعة طلب إضافة مهنة، أو أي استفسار عن الدليل، تواصل مع مكتب الجمال مباشرة.",
  copyright: "جميع الحقوق محفوظة لمكتب الجمال للدعاية والإعلان.", phone: OFFICE_PHONE,
  showEmergency: true,
};

// Settings rows saved by older releases still carry advertising fields (adPrice, adDays, marquee*).
// Only the current keys are ever served, so removed settings cannot leak back to the client.
export const settingsTextKeys = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright", "phone"] as const;
export function sanitizeSettings(saved: Record<string, unknown>): SiteSettings {
  const next: SiteSettings = { ...defaultSettings };
  for (const key of settingsTextKeys) { const value = saved[key]; if (typeof value === "string" && value.trim()) next[key] = value; }
  if (typeof saved.showEmergency === "boolean") next.showEmergency = saved.showEmergency;
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
  stationery: "مكتبات توفر الأدوات المدرسية والمستلزمات المكتبية والمنتجات التعليمية التي يحتاج إليها الطلاب وأولياء الأمور. يساعدك الدليل على الوصول إلى المكتبات والاستفسار عن المنتجات المتاحة.",
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

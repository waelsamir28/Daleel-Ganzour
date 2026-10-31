import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index, jsonb, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import type { CenterSchedule, ServiceCompletionDraft, WorkingHours } from "@/lib/catalog";

export const services = pgTable("directory_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  address: varchar("address", { length: 240 }).notNull().default(""),
  phone: varchar("phone", { length: 24 }).notNull(),
  phoneSecondary: varchar("phone_secondary", { length: 24 }).notNull().default(""),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  /** وقت آخر تغيير في الحالة — بيستخدمه الموقع يعرض رسالة «تمت الموافقة» للمهني أول ما يفتح. */
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).notNull().defaultNow(),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  emergency: boolean("emergency").notNull().default(false),
  availableNow: boolean("available_now").notNull().default(false),
  availableUntil: timestamp("available_until", { withTimezone: true }),
  workingHours: jsonb("working_hours").$type<WorkingHours>().notNull().default([]),
  serviceItems: jsonb("service_items").$type<string[]>().notNull().default([]),
  subSpecialties: jsonb("sub_specialties").$type<string[]>().notNull().default([]),
  /** جدول حصص السنتر التعليمي (مادة/مدرس/يوم/ساعة). */
  schedule: jsonb("schedule").$type<CenterSchedule>().notNull().default([]),
  /** عرض/خصم مؤقت يضيفه المهني أو الإدارة (حتى 30 يومًا). */
  offerTitle: varchar("offer_title", { length: 120 }).notNull().default(""),
  offerDetails: text("offer_details").notNull().default(""),
  offerEndsAt: timestamp("offer_ends_at", { withTimezone: true }),
  /** وقت نشر/تجديد العرض — لشارة «جديد» خلال أول 48 ساعة. */
  offerStartedAt: timestamp("offer_started_at", { withTimezone: true }),
  /** آخر مرة أكّد فيها المهني (أو عدّل) بياناته — لتذكير تجديد البيانات كل 6 أشهر. */
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
  /** رقم إصدار الصورة الشخصية للمهني (0 = لا توجد صورة)؛ الصورة نفسها في directory_service_photos. */
  photoVersion: integer("photo_version").notNull().default(0),
  neededRank: integer("needed_rank").notNull().default(0),
  reviewNote: text("review_note").notNull().default(""),
  completionStatus: varchar("completion_status", { length: 20 }).notNull().default("none"),
  completionNote: text("completion_note").notNull().default(""),
  completionDraft: jsonb("completion_draft").$type<ServiceCompletionDraft | null>().default(null),
  hours: varchar("hours", { length: 120 }).notNull().default(""),
  menuUrl: text("menu_url").notNull().default(""),
  menuWhatsapp: varchar("menu_whatsapp", { length: 24 }).notNull().default(""),
  demo: boolean("demo").notNull().default(false),
  availabilityToken: varchar("availability_token", { length: 40 }).notNull().default(""),
  /** رابط «حسابي» السري الذي ترسله الإدارة لصاحب الخدمة على واتسابه ليعدّل بياناته بنفسه. */
  accountToken: varchar("account_token", { length: 40 }).notNull().default(""),
  rating: varchar("rating", { length: 8 }).notNull().default("0"),
  reviews: integer("reviews").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_services_status_idx").on(table.status)]);

export const directoryCategories = pgTable("directory_categories", {
  id: varchar("id", { length: 60 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: varchar("parent_id", { length: 60 }),
  description: text("description").notNull().default(""),
  color: varchar("color", { length: 7 }).notNull().default("#0876e1"),
  icon: varchar("icon", { length: 40 }).notNull().default("Wrench"),
  art: varchar("art", { length: 40 }).notNull().default(""),
  /** مراحل تخصصات المدرسين (primary,prep,secondary) مفصولة بفواصل؛ فارغ = كل المراحل. */
  stages: varchar("stages", { length: 40 }).notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const directoryAreas = pgTable("directory_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const members = pgTable("directory_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 40 }).notNull().unique(),
  phone: varchar("phone", { length: 24 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberSessions = pgTable("directory_member_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("directory_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  message: varchar("message", { length: 300 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_notifications_read_idx").on(table.read)]);

export const directorySettings = pgTable("directory_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
});

export const adminSessions = pgTable("directory_admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityListings = pgTable("directory_community_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  profession: varchar("profession", { length: 120 }).notNull().default(""),
  description: text("description").notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 24 }).notNull().default(""),
  area: varchar("area", { length: 100 }).notNull().default(""),
  price: varchar("price", { length: 80 }).notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityComplaints = pgTable("directory_community_complaints", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("directory_push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  subscription: text("subscription").notNull(),
  /** الأقسام اللي الزائر عايز ينبّه لها (فاضية = كل الأقسام). */
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissionTracking = pgTable("directory_submission_tracking", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
});

export const serviceRatings = pgTable("directory_service_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull(),
  comment: text("comment").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("directory_service_ratings_one_per_member").on(table.serviceId, table.memberId)]);

export const specialtyFollows = pgTable("directory_specialty_follows", {
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 60 }).notNull().references(() => directoryCategories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.memberId, table.categoryId] })]);

// Aggregated real usage per specialty (opened pages/details + calls/WhatsApp) feeding «أهم مهن القرية».
export const categoryHits = pgTable("directory_category_hits", {
  categoryId: varchar("category_id", { length: 60 }).primaryKey().references(() => directoryCategories.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  contacts: integer("contacts").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * سجل «الرسالة الترحيبية اتشافت» — على الخادم مش المتصفح،
 * فالرسالة بتظهر مرة واحدة للعضو/المهني مهما فتح من جهاز، ومش بترجع تاني خالص.
 */
export const welcomeSeen = pgTable("directory_welcome_seen", {
  key: varchar("key", { length: 80 }).primaryKey(),
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * «مهنة ناقصة»: الزائر يكتب اللي محتاجه ومش لاقيه في الدليل، والإدارة تتابعه
 * وتجهّز له رسالة واتساب أول ما يتضاف — فالدليل بيتبني من احتياج الناس الحقيقي.
 */
export const missingProfessionRequests = pgTable("directory_missing_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  need: text("need").notNull(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  phone: varchar("phone", { length: 24 }).notNull().default(""),
  categoryId: varchar("category_id", { length: 60 }).notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_missing_requests_created_idx").on(table.createdAt)]);

/**
 * طلبات عرض السعر («اطلب من ٣ مهنيين»): الزائر يكتب طلبه مرة واحدة،
 * ويُخزَّن مع أرقام المهنيين اللي اتبعتلهم — للمتابعة في لوحة الإدارة.
 */
export const quoteRequests = pgTable("directory_quote_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: varchar("category_id", { length: 60 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  details: text("details").notNull(),
  area: varchar("area", { length: 80 }).notNull().default(""),
  /** معرّفات المهنيين اللي اتبعتلهم الطلب (٣ كحد أقصى). */
  serviceIds: jsonb("service_ids").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_quote_requests_created_idx").on(table.createdAt)]);

/**
 * إحصاء حقيقي لكل مهني (فتح البطاقة مرة، ضغط اتصال/واتساب مرة) — مجهول بالكامل،
 * وبيُغذّي «الأكثر تفاعلًا» في إحصاءات الإدارة بدل أرقام المتصفح المحلية.
 */
export const serviceHits = pgTable("directory_service_hits", {
  serviceId: uuid("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  contacts: integer("contacts").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentRequests = pgTable("directory_appointment_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  preference: varchar("preference", { length: 240 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("waiting"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * الملف الشخصي للعضو (مستقل تمامًا عن بيانات المهنة): صورة شخصية مشتركة مع كارت المهنة إن كان الرقم متطابقًا،
 * وخانات اختيارية (إيميل، تاريخ ميلاد، عنوان، نبذة، فيسبوك، واتساب بديل، المؤهل/الوظيفة).
 */
export const memberProfiles = pgTable("directory_member_profiles", {
  memberId: uuid("member_id").primaryKey().references(() => members.id, { onDelete: "cascade" }),
  photoVersion: integer("photo_version").notNull().default(0),
  photoMime: varchar("photo_mime", { length: 60 }).notNull().default("image/webp"),
  photoData: text("photo_data").notNull().default(""),
  email: varchar("email", { length: 160 }).notNull().default(""),
  birthDate: varchar("birth_date", { length: 10 }).notNull().default(""),
  address: varchar("address", { length: 200 }).notNull().default(""),
  bio: text("bio").notNull().default(""),
  facebook: varchar("facebook", { length: 300 }).notNull().default(""),
  whatsapp: varchar("whatsapp", { length: 24 }).notNull().default(""),
  jobTitle: varchar("job_title", { length: 120 }).notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** أيقونة مرفوعة من الإدارة لقسم أو تخصص (تُخزَّن داخل القاعدة لأن Vercel بلا قرص دائم). */
/** الصورة الشخصية للمهني/المحل (دائرة صغيرة مقصوصة ومضغوطة في المتصفح) — داخل القاعدة لأن Vercel بلا قرص دائم. */
export const servicePhotos = pgTable("directory_service_photos", {
  serviceId: uuid("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  mime: varchar("mime", { length: 60 }).notNull().default("image/webp"),
  data: text("data").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoryIcons = pgTable("directory_category_icons", {
  categoryId: varchar("category_id", { length: 60 }).primaryKey(),
  mime: varchar("mime", { length: 60 }).notNull().default("image/png"),
  data: text("data").notNull().default(""),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** صور المظهر المرفوعة من استوديو التصميم (لوجو الهيدر، شاشة البداية، بانر الدخول، البانر الترحيبي) — داخل القاعدة لأن Vercel بلا قرص دائم. */
export const designImages = pgTable("directory_design_images", {
  key: varchar("key", { length: 40 }).primaryKey(),
  mime: varchar("mime", { length: 60 }).notNull().default("image/png"),
  data: text("data").notNull().default(""),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Rotating promotional banners shown above the directory; the image itself is stored inline (Vercel has no persistent disk). */
export const adBanners = pgTable("directory_ad_banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  caption: varchar("caption", { length: 240 }).notNull().default(""),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  whatsapp: varchar("whatsapp", { length: 24 }).notNull().default(""),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(6),
  imageMime: varchar("image_mime", { length: 60 }).notNull().default("image/gif"),
  imageData: text("image_data").notNull().default(""),
  imageVersion: integer("image_version").notNull().default(1),
  /** Built-in animated template id (empty when the ad uses an uploaded image). */
  template: varchar("template", { length: 40 }).notNull().default(""),
  /** Slide-change effect (fade, slide, zoom, flip, blur, curtain, random). */
  transition: varchar("transition", { length: 20 }).notNull().default("random"),
  /** Motion applied while the ad is on screen (none, kenburns, float, pulse, shine). */
  motion: varchar("motion", { length: 20 }).notNull().default("kenburns"),
  /** Advertiser brand colour (hex) used by the templates; empty keeps the template default. */
  accentColor: varchar("accent_color", { length: 9 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Advertising requests sent from the public «أعلن معنا» page, kept so the admin can convert them into ads. */
export const adRequests = pgTable("directory_ad_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  business: varchar("business", { length: 120 }).notNull().default(""),
  phone: varchar("phone", { length: 16 }).notNull(),
  tierLabel: varchar("tier_label", { length: 60 }).notNull().default(""),
  kind: varchar("kind", { length: 20 }).notNull().default("template"),
  template: varchar("template", { length: 40 }).notNull().default(""),
  notes: varchar("notes", { length: 400 }).notNull().default(""),
  status: varchar("status", { length: 12 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Village events calendar («مناسبات القرية») maintained by the admin. */
export const villageEvents = pgTable("directory_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull().default("other"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: varchar("location", { length: 160 }).notNull().default(""),
  description: text("description").notNull().default(""),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_events_starts_idx").on(table.startsAt)]);

/** سجل نشاط الإدارة والمشرفين: كل إجراء (قبول/رفض/تعديل/حذف…) باسم من نفّذه. */
export const activityLog = pgTable("directory_activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorRole: varchar("actor_role", { length: 12 }).notNull(),
  actorName: varchar("actor_name", { length: 120 }).notNull(),
  actorUsername: varchar("actor_username", { length: 80 }).notNull().default(""),
  action: varchar("action", { length: 40 }).notNull(),
  entityKind: varchar("entity_kind", { length: 24 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull().default(""),
  entityLabel: varchar("entity_label", { length: 160 }).notNull().default(""),
  detail: varchar("detail", { length: 300 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_activity_log_created_idx").on(table.createdAt)]);

/**
 * سجل أخطاء المتصفح: أي خطأ JavaScript أو فشل تحميل عند الزائر/المهني بيوصل هنا مجهولًا
 * (من غير بيانات شخصية) مع بصمة موحّدة، ويظهر في لوحة الإدارة مجمّعًا بعدد التكرار.
 */
export const errorLog = pgTable("directory_error_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** مكان الخطأ: client (متصفح) أو server (صفحة/طلب). */
  kind: varchar("kind", { length: 12 }).notNull().default("client"),
  /** بصمة مختصرة (نوع + أول سطر من الرسالة) لتجميع الأخطاء المتكررة. */
  fingerprint: varchar("fingerprint", { length: 40 }).notNull().default(""),
  message: varchar("message", { length: 400 }).notNull().default(""),
  /** أول 1200 حرف من الـ stack (بدون بيانات شخصية). */
  detail: text("detail").notNull().default(""),
  path: varchar("path", { length: 200 }).notNull().default(""),
  userAgent: varchar("user_agent", { length: 180 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("directory_error_log_created_idx").on(table.createdAt),
  index("directory_error_log_fingerprint_idx").on(table.fingerprint),
]);

/**
 * تقييم سريع مجهول بعد الاتصال/الواتساب (نجوم فقط، بدون اسم أو رقم):
 * مؤشر رضا يظهر في إحصاءات الإدارة، وللعضو المسجّل يدخل نظام التقييمات العادي.
 */
export const quickRatings = pgTable("directory_quick_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_quick_ratings_created_idx").on(table.createdAt)]);

/** بلاغات مجهولة عن أكواد المحمول/الأرضي/الأرقام الحكومية اللي اتغيّرت (إحصاءات الإدارة). */
export const telecomReports = pgTable("directory_telecom_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: varchar("scope", { length: 20 }).notNull(),
  code: varchar("code", { length: 60 }).notNull(),
  label: varchar("label", { length: 160 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("directory_telecom_reports_created_idx").on(table.createdAt)]);

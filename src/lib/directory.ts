import "server-only";
import { and, asc, avg, count, desc, eq, inArray, like, ne, notInArray, or, sql } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { adBanners, communityListings, directoryAreas, directoryCategories, directorySettings, members, notifications, serviceRatings, services, specialtyFollows } from "@/db/schema";
import { areas, defaultDesignSettings, isAdLive, defaultSettings, initialCategories, publicUtilityNumbers, sampleServices, sanitizeDesignSettings, sanitizeSettings, sanitizeUtilityNumbers, type AdBannerRecord, type AdminDirectory, type CategoryRecord, type CompletionStatus, type CommunityListingType, type DesignSettings, type PublicDirectory, type PublicUtilityContact, type ServiceComment, type ServiceRecord, type SiteSettings } from "@/lib/catalog";

let seedPromise: Promise<void> | undefined;
export const DELETED_CATEGORIES_KEY = "deleted_categories";
type Queryable = Pick<typeof db, "select" | "insert">;
/** Ids of built-in categories the admin removed on purpose; the seed must not resurrect them. */
export async function readDeletedCategoryIds(client: Queryable = db): Promise<Set<string>> {
  const [row] = await client.select().from(directorySettings).where(eq(directorySettings.key, DELETED_CATEGORIES_KEY));
  if (!row) return new Set();
  try {
    const parsed = JSON.parse(row.value) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch { return new Set(); }
}
export async function writeDeletedCategoryIds(ids: Set<string>) {
  const value = JSON.stringify([...ids]);
  await db.insert(directorySettings).values({ key: DELETED_CATEGORIES_KEY, value }).onConflictDoUpdate({ target: directorySettings.key, set: { value } });
}
function getPreviewDirectory(): PublicDirectory {
  return {
    services: sampleServices.map((service) => ({ ...service, phoneSecondary: "", status: "approved", verified: true, availableNow: false, availableUntil: null, workingHours: [], serviceItems: [], subSpecialties: [], neededRank: 0, hours: "8 صباحًا - 10 مساءً", menuUrl: "", menuWhatsapp: "", demo: true, createdAt: "2026-01-01T00:00:00.000Z", completionStatus: "none", completionNote: "", completionDraft: null })),
    categories: initialCategories,
    areas: areas.map((name, sortOrder) => ({ id: `preview-area-${sortOrder + 1}`, name, sortOrder })),
    settings: defaultSettings,
    designSettings: defaultDesignSettings,
    utilityNumbers: publicUtilityNumbers,
    memberCount: 0,
    ads: [],
    previewMode: true,
  };
}
export async function ensureSeed() {
  if (!databaseConfigured) throw new Error("Database operations are unavailable in preview mode.");
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS phone_secondary varchar(24) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS available_now boolean NOT NULL DEFAULT false`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS available_until timestamptz`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS working_hours jsonb NOT NULL DEFAULT '[]'::jsonb`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS service_items jsonb NOT NULL DEFAULT '[]'::jsonb`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS sub_specialties jsonb NOT NULL DEFAULT '[]'::jsonb`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS needed_rank integer NOT NULL DEFAULT 0`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS completion_status varchar(20) NOT NULL DEFAULT 'none'`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS completion_note text NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS completion_draft jsonb`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_submission_tracking (token_hash varchar(64) PRIMARY KEY, service_id uuid NOT NULL REFERENCES directory_services(id) ON DELETE CASCADE)`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_appointment_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL REFERENCES directory_services(id) ON DELETE CASCADE, name varchar(120) NOT NULL, phone varchar(24) NOT NULL, preference varchar(240) NOT NULL, status varchar(20) NOT NULL DEFAULT 'waiting', created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS hours varchar(120) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS menu_url text NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS menu_whatsapp varchar(24) NOT NULL DEFAULT ''`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_community_listings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type varchar(20) NOT NULL, title varchar(160) NOT NULL, profession varchar(120) NOT NULL DEFAULT '', description text NOT NULL, phone varchar(24) NOT NULL, whatsapp varchar(24) NOT NULL DEFAULT '', area varchar(100) NOT NULL DEFAULT '', price varchar(80) NOT NULL DEFAULT '', status varchar(20) NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`ALTER TABLE directory_community_listings ADD COLUMN IF NOT EXISTS profession varchar(120) NOT NULL DEFAULT ''`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_community_complaints (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, phone varchar(24) NOT NULL, message text NOT NULL, status varchar(20) NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS availability_token varchar(40) NOT NULL DEFAULT ''`);
      await tx.execute(sql`UPDATE directory_services SET availability_token = substr(md5(random()::text || id::text), 1, 32) || substr(md5(random()::text), 1, 8) WHERE availability_token = ''`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_service_ratings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL REFERENCES directory_services(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES directory_members(id) ON DELETE CASCADE, stars integer NOT NULL, comment text NOT NULL DEFAULT '', status varchar(20) NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS directory_service_ratings_one_per_member ON directory_service_ratings (service_id, member_id)`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_specialty_follows (member_id uuid NOT NULL REFERENCES directory_members(id) ON DELETE CASCADE, category_id varchar(60) NOT NULL REFERENCES directory_categories(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (member_id, category_id))`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_push_subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), endpoint text NOT NULL UNIQUE, subscription text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`ALTER TABLE directory_members ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'member'`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_ad_banners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(120) NOT NULL, caption varchar(240) NOT NULL DEFAULT '', service_id uuid REFERENCES directory_services(id) ON DELETE SET NULL, whatsapp varchar(24) NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, starts_at timestamptz, ends_at timestamptz, sort_order integer NOT NULL DEFAULT 0, duration_seconds integer NOT NULL DEFAULT 6, image_mime varchar(60) NOT NULL DEFAULT 'image/gif', image_data text NOT NULL DEFAULT '', image_version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now())`);
      await tx.execute(sql`ALTER TABLE directory_categories ALTER COLUMN description TYPE text`);
      await tx.execute(sql`ALTER TABLE directory_categories ADD COLUMN IF NOT EXISTS art varchar(40) NOT NULL DEFAULT ''`);
      // Advertising was removed from the product: clean the legacy tables and their notifications
      // so existing databases are tidied up as soon as this release is deployed.
      await tx.execute(sql`DROP TABLE IF EXISTS directory_advertisement_events`);
      await tx.execute(sql`DROP TABLE IF EXISTS directory_advertisements`);
      await tx.delete(notifications).where(eq(notifications.type, "ad"));
      // A stored contact text that still sells advertising is rewritten to the advertising-free default.
      const [config] = await tx.select().from(directorySettings).where(eq(directorySettings.key, "site_config"));
      if (config?.value.includes("لحجز إعلان")) {
        try {
          const stored = sanitizeSettings(JSON.parse(config.value) as Record<string, unknown>);
          await tx.update(directorySettings).set({ value: JSON.stringify({ ...stored, contactText: defaultSettings.contactText }) }).where(eq(directorySettings.key, "site_config"));
        } catch { /* An unparsable row already falls back to the defaults. */ }
      }
      // The owner asked for an empty professionals table: a one-time purge removes every stored
      // provider (demo samples and legacy rows alike) together with their notifications. New
      // providers are added normally from the app afterwards; the marker keeps this from re-running.
      const purge = await tx.insert(directorySettings).values({ key: "services_purged_v1", value: new Date().toISOString() }).onConflictDoNothing().returning();
      if (purge.length) {
        await tx.delete(services);
        await tx.delete(notifications).where(inArray(notifications.type, ["service", "rating"]));
        await tx.insert(directorySettings).values({ key: "sample_data_v1", value: "disabled" }).onConflictDoNothing();
      }
      // «المحاماة والاستشارات» moves out of خدمات أخرى into its own section. The legacy specialty row
      // and any hand-made law categories (which the admin could not delete) are removed once, together
      // with their children, before the fresh section and its specialties are seeded below.
      const lawReset = await tx.insert(directorySettings).values({ key: "law_section_v1", value: new Date().toISOString() }).onConflictDoNothing().returning();
      if (lawReset.length) {
        const legacy = await tx.select({ id: directoryCategories.id }).from(directoryCategories).where(or(eq(directoryCategories.id, "law"), like(directoryCategories.name, "%محاما%")));
        const legacyIds = legacy.map((row) => row.id);
        if (legacyIds.length) {
          const children = await tx.select({ id: directoryCategories.id }).from(directoryCategories).where(inArray(directoryCategories.parentId, legacyIds));
          const doomed = [...new Set([...legacyIds, ...children.map((row) => row.id)])];
          await tx.update(services).set({ category: "lawyers" }).where(inArray(services.category, doomed));
          await tx.delete(directoryCategories).where(inArray(directoryCategories.id, doomed));
        }
      }
      const marker = await tx.insert(directorySettings).values({ key: "janzour_v2", value: "initialized" }).onConflictDoNothing().returning();
      // Catalogue sync policy: the built-in sections are pushed into the database in full exactly once
      // (so the latest code layout — new sections, promoted roots — lands everywhere), and from then on
      // the admin panel owns the table: names, parents, icons, order and visibility edited there are
      // never overwritten, and sections the admin deleted are remembered so they do not come back.
      const sync = await tx.insert(directorySettings).values({ key: "catalog_sync_v3", value: new Date().toISOString() }).onConflictDoNothing().returning();
      const seedRows = initialCategories.map(({ light: _light, ...category }) => category);
      if (sync.length) {
        await tx.insert(directoryCategories).values(seedRows).onConflictDoUpdate({ target: directoryCategories.id, set: { name: sql`excluded.name`, parentId: sql`excluded.parent_id`, description: sql`excluded.description`, color: sql`excluded.color`, icon: sql`excluded.icon`, art: sql`excluded.art`, sortOrder: sql`excluded.sort_order`, active: sql`excluded.active` } });
      } else {
        const removed = await readDeletedCategoryIds(tx);
        const fresh = seedRows.filter((row) => !removed.has(row.id) && !(row.parentId && removed.has(row.parentId)));
        if (fresh.length) await tx.insert(directoryCategories).values(fresh).onConflictDoNothing();
      }
      if (!marker.length) return;
      await tx.insert(directoryAreas).values(areas.map((name, sortOrder) => ({ name, sortOrder }))).onConflictDoNothing();
      await tx.insert(directorySettings).values({ key: "site_config", value: JSON.stringify(defaultSettings) }).onConflictDoNothing();
      // Demo sample providers are no longer seeded: the directory starts empty and fills up only
      // with real submissions approved from the admin panel.
      await tx.insert(directorySettings).values({ key: "sample_data_v1", value: "disabled" }).onConflictDoNothing();
      await tx.update(services).set({ category: "family" }).where(eq(services.category, "doctors"));
      await tx.update(services).set({ category: "lawyers" }).where(eq(services.category, "law"));
    }).catch((error) => { seedPromise = undefined; throw error; });
  }
  await seedPromise;
}
export async function getSettings(): Promise<SiteSettings> {
  if (!databaseConfigured) return defaultSettings;
  await ensureSeed();
  const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, "site_config"));
  if (!row) return defaultSettings;
  try { return sanitizeSettings(JSON.parse(row.value) as Record<string, unknown>); } catch { return defaultSettings; }
}
export async function getUtilityNumbers(): Promise<PublicUtilityContact[]> {
  if (!databaseConfigured) return publicUtilityNumbers;
  await ensureSeed();
  const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, "utility_numbers"));
  if (!row) return publicUtilityNumbers;
  try { return sanitizeUtilityNumbers(JSON.parse(row.value)); } catch { return publicUtilityNumbers; }
}
export async function getDesignSettings(): Promise<DesignSettings> {
  if (!databaseConfigured) return defaultDesignSettings;
  await ensureSeed();
  const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, "design_config"));
  if (!row) return defaultDesignSettings;
  try { return sanitizeDesignSettings(JSON.parse(row.value)); } catch { return defaultDesignSettings; }
}
export function serializeService(item: typeof services.$inferSelect): ServiceRecord {
  const { reviewNote: _privateNote, availabilityToken: _privateToken, ...publicItem } = item;
  const completionStatus = (["none", "requested", "submitted", "rejected"].includes(item.completionStatus) ? item.completionStatus : "none") as CompletionStatus;
  return { ...publicItem, completionStatus, completionNote: item.completionNote ?? "", completionDraft: item.completionDraft ?? null, availableNow: item.availableNow && Boolean(item.availableUntil && item.availableUntil.getTime() > Date.now()), availableUntil: item.availableUntil?.toISOString() ?? null, createdAt: item.createdAt.toISOString() };
}
export function serializeCategory(item: typeof directoryCategories.$inferSelect): CategoryRecord { return { ...item, light: `${item.color}12` }; }
const adColumns = { id: adBanners.id, title: adBanners.title, caption: adBanners.caption, serviceId: adBanners.serviceId, whatsapp: adBanners.whatsapp, active: adBanners.active, startsAt: adBanners.startsAt, endsAt: adBanners.endsAt, sortOrder: adBanners.sortOrder, durationSeconds: adBanners.durationSeconds, imageMime: adBanners.imageMime, imageVersion: adBanners.imageVersion, hasImage: sql<boolean>`length(${adBanners.imageData}) > 0`, createdAt: adBanners.createdAt };
export function serializeAd(row: { id: string; title: string; caption: string; serviceId: string | null; whatsapp: string; active: boolean; startsAt: Date | null; endsAt: Date | null; sortOrder: number; durationSeconds: number; imageMime: string; imageVersion: number; hasImage: boolean; createdAt: Date }): AdBannerRecord {
  return { ...row, hasImage: Boolean(row.hasImage), startsAt: row.startsAt?.toISOString() ?? null, endsAt: row.endsAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}
/** Ad metadata only (the image payload is streamed by /api/ad-banner/:id). */
export async function listAds(): Promise<AdBannerRecord[]> {
  const rows = await db.select(adColumns).from(adBanners).orderBy(asc(adBanners.sortOrder), asc(adBanners.createdAt));
  return rows.map(serializeAd);
}
async function getCatalog() {
  await ensureSeed();
  const [categoryRows, areaRows, settings, utilityNumbers, designSettings, memberTotal, ads] = await Promise.all([
    db.select().from(directoryCategories).orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name)),
    db.select().from(directoryAreas).orderBy(asc(directoryAreas.sortOrder), asc(directoryAreas.name)),
    getSettings(), getUtilityNumbers(), getDesignSettings(), db.select({ total: sql<number>`count(*)::int` }).from(members), listAds(),
  ]);
  return { categories: categoryRows.map(serializeCategory), areas: areaRows, settings, utilityNumbers, designSettings, memberCount: Number(memberTotal[0]?.total ?? 0), ads };
}
export async function getPublicDirectory(): Promise<PublicDirectory> {
  if (!databaseConfigured) return getPreviewDirectory();
  const catalog = await getCatalog();
  const visibleRoots = catalog.categories.filter((category) => !category.parentId && category.active).map((category) => category.id);
  const visibleCategories = catalog.categories.filter((category) => category.active && (!category.parentId || visibleRoots.includes(category.parentId)));
  const ids = visibleCategories.filter((category) => category.parentId).map((category) => category.id);
  const providers = ids.length ? await db.select().from(services).where(and(eq(services.status, "approved"), inArray(services.category, ids))).orderBy(desc(services.featured), asc(services.id)) : [];
  const providerIds = providers.map((row) => row.id);
  const ratingRows = providerIds.length ? await db.select({ serviceId: serviceRatings.serviceId, total: count(), avgStars: avg(serviceRatings.stars) }).from(serviceRatings).where(and(eq(serviceRatings.status, "approved"), inArray(serviceRatings.serviceId, providerIds))).groupBy(serviceRatings.serviceId) : [];
  const ratingByService = new Map(ratingRows.map((row) => [row.serviceId, row]));
  const commentRows = providerIds.length ? await db.select({ serviceId: serviceRatings.serviceId, stars: serviceRatings.stars, comment: serviceRatings.comment, createdAt: serviceRatings.createdAt, memberName: members.name }).from(serviceRatings).innerJoin(members, eq(serviceRatings.memberId, members.id)).where(and(eq(serviceRatings.status, "approved"), ne(serviceRatings.comment, ""), inArray(serviceRatings.serviceId, providerIds))).orderBy(desc(serviceRatings.createdAt)).limit(150) : [];
  const commentsByService = new Map<string, ServiceComment[]>();
  for (const row of commentRows) {
    const list = commentsByService.get(row.serviceId) ?? [];
    if (list.length < 5) list.push({ stars: row.stars, comment: row.comment, member: row.memberName.trim().split(/\s+/)[0], date: row.createdAt.toISOString() });
    commentsByService.set(row.serviceId, list);
  }
  const providerNotificationRows = await db.select().from(notifications).where(eq(notifications.type, "provider")).orderBy(desc(notifications.createdAt)).limit(60);
  // Approved member ratings blend into the seeded score, weighted by the existing review count.
  const blended = providers.map((row) => {
    const record = serializeService(row);
    const extra = ratingByService.get(row.id);
    if (extra && extra.total > 0) {
      const baseScore = Number.parseFloat(record.rating) || 0, total = record.reviews + extra.total;
      record.rating = total > 0 ? ((baseScore * record.reviews + Number(extra.avgStars ?? 0) * extra.total) / total).toFixed(1) : record.rating;
      record.reviews = total;
    }
    const comments = commentsByService.get(row.id);
    if (comments?.length) record.comments = comments;
    return record;
  });
  return { ...catalog, ads: catalog.ads.filter((ad) => isAdLive(ad)), categories: visibleCategories, services: blended, providerNotifications: providerNotificationRows.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })) };
}
export async function getAdminDirectory(role: "admin" | "moderator" = "admin"): Promise<AdminDirectory> {
  const catalog = await getCatalog();
  const reviewNotificationTypes = ["service", "rating"];
  const excludedAdminNotificationTypes = ["community", "provider"];
  const [providers, communityRows, memberRows, notificationRows, unreadTotal] = await Promise.all([
    db.select().from(services).orderBy(desc(services.createdAt)),
    Promise.resolve([] as (typeof communityListings.$inferSelect)[]),
    role === "admin" ? db.select({ id: members.id, name: members.name, username: members.username, phone: members.phone, role: members.role, active: members.active, createdAt: members.createdAt }).from(members).orderBy(desc(members.createdAt)) : Promise.resolve([]),
    role === "admin" ? db.select().from(notifications).where(notInArray(notifications.type, excludedAdminNotificationTypes)).orderBy(desc(notifications.createdAt)).limit(200) : db.select().from(notifications).where(inArray(notifications.type, reviewNotificationTypes)).orderBy(desc(notifications.createdAt)).limit(200),
    role === "admin" ? db.select({ total: count() }).from(notifications).where(and(eq(notifications.read, false), notInArray(notifications.type, excludedAdminNotificationTypes))) : db.select({ total: count() }).from(notifications).where(and(eq(notifications.read, false), inArray(notifications.type, reviewNotificationTypes))),
  ]);
  const ratingRows = await db.select({ id: serviceRatings.id, serviceId: serviceRatings.serviceId, stars: serviceRatings.stars, comment: serviceRatings.comment, status: serviceRatings.status, createdAt: serviceRatings.createdAt, memberName: members.name, serviceName: services.name }).from(serviceRatings).innerJoin(members, eq(serviceRatings.memberId, members.id)).innerJoin(services, eq(serviceRatings.serviceId, services.id)).orderBy(desc(serviceRatings.createdAt)).limit(200);
  return { ...catalog, memberCount: role === "admin" ? catalog.memberCount : 0, services: providers.map((row) => ({ ...serializeService(row), availabilityToken: row.availabilityToken || undefined })), ratings: ratingRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })), communityListings: communityRows.map((listing) => ({ ...listing, type: listing.type as CommunityListingType, createdAt: listing.createdAt.toISOString() })), members: memberRows.map((member) => ({ ...member, role: member.role === "moderator" ? "moderator" : "member", createdAt: member.createdAt.toISOString() })), notifications: notificationRows.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })), notificationUnread: unreadTotal[0]?.total ?? 0 };
}

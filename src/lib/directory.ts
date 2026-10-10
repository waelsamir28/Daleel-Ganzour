import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { advertisements, directoryAreas, directoryCategories, directorySettings, members, notifications, services } from "@/db/schema";
import { areas, defaultSettings, initialCategories, sampleServices, adTypeOptions, adPlacementOptions, type AdRecord, type AdminDirectory, type CategoryRecord, type PublicDirectory, type ServiceRecord, type SiteSettings } from "@/lib/catalog";

let seedPromise: Promise<void> | undefined;
function getPreviewDirectory(): PublicDirectory {
  return {
    services: sampleServices.map((service) => ({ ...service, phoneSecondary: "", status: "approved", verified: true, demo: true, createdAt: "2026-01-01T00:00:00.000Z" })),
    ads: [],
    categories: initialCategories,
    areas: areas.map((name, sortOrder) => ({ id: `preview-area-${sortOrder + 1}`, name, sortOrder })),
    settings: defaultSettings,
    memberCount: 0,
    previewMode: true,
  };
}
export async function ensureSeed() {
  if (!databaseConfigured) throw new Error("Database operations are unavailable in preview mode.");
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS phone_secondary varchar(24) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_members ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'member'`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS background_color varchar(7) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS icon varchar(40) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS text_size integer NOT NULL DEFAULT 17`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS highlight_word varchar(60) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS motion varchar(12) NOT NULL DEFAULT 'static'`);
      await tx.execute(sql`ALTER TABLE directory_advertisements ADD COLUMN IF NOT EXISTS image_url varchar(1000) NOT NULL DEFAULT ''`);
      await tx.execute(sql`ALTER TABLE directory_advertisements
        ADD COLUMN IF NOT EXISTS name varchar(160) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS category_id varchar(60) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS ad_type varchar(12) NOT NULL DEFAULT 'banner',
        ADD COLUMN IF NOT EXISTS placement varchar(12) NOT NULL DEFAULT 'hero',
        ADD COLUMN IF NOT EXISTS video_url varchar(1000) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS destination_url varchar(1000) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS whatsapp_phone varchar(24) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS offer_text varchar(100) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS starts_at timestamptz,
        ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS campaign_status varchar(12) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS impressions integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0`);
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS directory_advertisement_events (
        ad_id uuid NOT NULL REFERENCES directory_advertisements(id) ON DELETE CASCADE,
        event_id uuid NOT NULL, event_type varchar(12) NOT NULL, action varchar(12) NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (ad_id, event_id))`);
      await tx.execute(sql`CREATE INDEX IF NOT EXISTS directory_ad_events_created_idx ON directory_advertisement_events(created_at)`);
      const marker = await tx.insert(directorySettings).values({ key: "janzour_v2", value: "initialized" }).onConflictDoNothing().returning();
      await tx.insert(directoryCategories).values(initialCategories.map(({ light: _light, ...category }) => category)).onConflictDoNothing();
      if (!marker.length) return;
      await tx.insert(directoryAreas).values(areas.map((name, sortOrder) => ({ name, sortOrder }))).onConflictDoNothing();
      await tx.insert(directorySettings).values({ key: "site_config", value: JSON.stringify(defaultSettings) }).onConflictDoNothing();
      const [legacy] = await tx.select().from(directorySettings).where(eq(directorySettings.key, "sample_data_v1"));
      if (!legacy) {
        await tx.insert(services).values(sampleServices.map((service) => ({ ...service, status: "approved", verified: true, demo: true }))).onConflictDoNothing();
        await tx.insert(directorySettings).values({ key: "sample_data_v1", value: "initialized" }).onConflictDoNothing();
      } else {
        for (const sample of sampleServices) await tx.update(services).set({ area: sample.area, address: sample.address, category: sample.category, demo: true }).where(eq(services.id, sample.id));
      }
      await tx.update(services).set({ category: "family" }).where(eq(services.category, "doctors"));
      await tx.update(services).set({ category: "law" }).where(eq(services.category, "lawyers"));
      if (!legacy) await tx.insert(advertisements).values([
        { id: "10000000-0000-4000-8000-000000000001", businessName: "مكتب الجمال للدعاية والإعلان", text: "خلّي شغلك يوصل لكل أهل جنزور! احجز إعلانك هنا بسعر بسيط", phone: defaultSettings.phone, status: "approved", paid: true, price: 0 },
      ]).onConflictDoNothing();
      await tx.update(advertisements).set({ businessName: defaultSettings.siteName, text: "صاحب مهنة أو خدمة في جنزور؟ انضم للدليل مجانًا بعد مراجعة بياناتك" }).where(eq(advertisements.id, "10000000-0000-4000-8000-000000000002"));
    }).catch((error) => { seedPromise = undefined; throw error; });
  }
  await seedPromise;
}
export async function getSettings(): Promise<SiteSettings> {
  if (!databaseConfigured) return defaultSettings;
  await ensureSeed();
  const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, "site_config"));
  if (!row) return defaultSettings;
  try { const saved = JSON.parse(row.value) as Partial<SiteSettings>; return { ...defaultSettings, ...saved }; } catch { return defaultSettings; }
}
export function serializeService(item: typeof services.$inferSelect): ServiceRecord { return { ...item, createdAt: item.createdAt.toISOString() }; }
export function serializeAd(item: typeof advertisements.$inferSelect, publicView = false): AdRecord {
  return { ...item, name: publicView ? "" : item.name || item.businessName,
    impressions: publicView ? 0 : item.impressions, clicks: publicView ? 0 : item.clicks,
    adType: adTypeOptions.find((o) => o.id === item.adType)?.id ?? "banner",
    placement: adPlacementOptions.find((o) => o.id === item.placement)?.id ?? "hero",
    campaignStatus: item.campaignStatus === "paused" ? "paused" : "active",
    startsAt: item.startsAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(), expiresAt: item.expiresAt?.toISOString() ?? null };
}
export function serializeCategory(item: typeof directoryCategories.$inferSelect): CategoryRecord { return { ...item, light: `${item.color}12` }; }
async function getCatalog() {
  await ensureSeed();
  const [categoryRows, areaRows, settings, memberTotal] = await Promise.all([
    db.select().from(directoryCategories).orderBy(asc(directoryCategories.sortOrder), asc(directoryCategories.name)),
    db.select().from(directoryAreas).orderBy(asc(directoryAreas.sortOrder), asc(directoryAreas.name)),
    getSettings(), db.select({ total: count() }).from(members),
  ]);
  return { categories: categoryRows.map(serializeCategory), areas: areaRows, settings, memberCount: memberTotal[0]?.total ?? 0 };
}
export async function getPublicDirectory(): Promise<PublicDirectory> {
  if (!databaseConfigured) return getPreviewDirectory();
  const catalog = await getCatalog();
  const visibleRoots = catalog.categories.filter((category) => !category.parentId && category.active).map((category) => category.id);
  const visibleCategories = catalog.categories.filter((category) => category.active && (!category.parentId || visibleRoots.includes(category.parentId)));
  const ids = visibleCategories.filter((category) => category.parentId).map((category) => category.id);
  const providers = ids.length ? await db.select().from(services).where(and(eq(services.status, "approved"), inArray(services.category, ids))).orderBy(desc(services.featured), asc(services.id)) : [];
  return { ...catalog, categories: visibleCategories, services: providers.map(serializeService), ads: [] };
}
export async function getAdminDirectory(role: "admin" | "moderator" = "admin"): Promise<AdminDirectory> {
  const catalog = await getCatalog();
  const [providers, ads, memberRows, notificationRows, unreadTotal] = await Promise.all([
    db.select().from(services).orderBy(desc(services.createdAt)),
    db.select().from(advertisements).orderBy(desc(advertisements.createdAt)),
    role === "admin" ? db.select({ id: members.id, name: members.name, username: members.username, phone: members.phone, role: members.role, active: members.active, createdAt: members.createdAt }).from(members).orderBy(desc(members.createdAt)) : Promise.resolve([]),
    role === "admin" ? db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(200) : db.select().from(notifications).where(inArray(notifications.type, ["service", "ad"])).orderBy(desc(notifications.createdAt)).limit(200),
    role === "admin" ? db.select({ total: count() }).from(notifications).where(eq(notifications.read, false)) : db.select({ total: count() }).from(notifications).where(and(eq(notifications.read, false), inArray(notifications.type, ["service", "ad"]))),
  ]);
  return { ...catalog, memberCount: role === "admin" ? catalog.memberCount : 0, services: providers.map(serializeService), ads: ads.map((ad) => serializeAd(ad)), members: memberRows.map((member) => ({ ...member, role: member.role === "moderator" ? "moderator" : "member", createdAt: member.createdAt.toISOString() })), notifications: notificationRows.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })), notificationUnread: unreadTotal[0]?.total ?? 0 };
}

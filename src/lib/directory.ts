import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { directoryAreas, directoryCategories, directorySettings, members, notifications, services } from "@/db/schema";
import { areas, defaultSettings, initialCategories, sampleServices, sanitizeSettings, type AdminDirectory, type CategoryRecord, type PublicDirectory, type ServiceRecord, type SiteSettings } from "@/lib/catalog";

let seedPromise: Promise<void> | undefined;
function getPreviewDirectory(): PublicDirectory {
  return {
    services: sampleServices.map((service) => ({ ...service, phoneSecondary: "", status: "approved", verified: true, demo: true, createdAt: "2026-01-01T00:00:00.000Z" })),
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
      const marker = await tx.insert(directorySettings).values({ key: "janzour_v2", value: "initialized" }).onConflictDoNothing().returning();
      await tx.insert(directoryCategories).values(initialCategories.map(({ light: _light, ...category }) => category)).onConflictDoUpdate({ target: directoryCategories.id, set: { name: sql`excluded.name`, parentId: sql`excluded.parent_id`, description: sql`excluded.description`, color: sql`excluded.color`, icon: sql`excluded.icon`, sortOrder: sql`excluded.sort_order`, active: sql`excluded.active` } });
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
export function serializeService(item: typeof services.$inferSelect): ServiceRecord { return { ...item, createdAt: item.createdAt.toISOString() }; }
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
  return { ...catalog, categories: visibleCategories, services: providers.map(serializeService) };
}
export async function getAdminDirectory(role: "admin" | "moderator" = "admin"): Promise<AdminDirectory> {
  const catalog = await getCatalog();
  const [providers, memberRows, notificationRows, unreadTotal] = await Promise.all([
    db.select().from(services).orderBy(desc(services.createdAt)),
    role === "admin" ? db.select({ id: members.id, name: members.name, username: members.username, phone: members.phone, role: members.role, active: members.active, createdAt: members.createdAt }).from(members).orderBy(desc(members.createdAt)) : Promise.resolve([]),
    role === "admin" ? db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(200) : db.select().from(notifications).where(eq(notifications.type, "service")).orderBy(desc(notifications.createdAt)).limit(200),
    role === "admin" ? db.select({ total: count() }).from(notifications).where(eq(notifications.read, false)) : db.select({ total: count() }).from(notifications).where(and(eq(notifications.read, false), eq(notifications.type, "service"))),
  ]);
  return { ...catalog, memberCount: role === "admin" ? catalog.memberCount : 0, services: providers.map(serializeService), members: memberRows.map((member) => ({ ...member, role: member.role === "moderator" ? "moderator" : "member", createdAt: member.createdAt.toISOString() })), notifications: notificationRows.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })), notificationUnread: unreadTotal[0]?.total ?? 0 };
}

import "server-only";
import { and, asc, count, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { advertisements, directoryAreas, directoryCategories, directorySettings, members, notifications, services } from "@/db/schema";
import { areas, defaultSettings, initialCategories, sampleServices, type AdRecord, type AdminDirectory, type CategoryRecord, type PublicDirectory, type ServiceRecord, type SiteSettings } from "@/lib/catalog";

let seedPromise: Promise<void> | undefined;
export async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE directory_services ADD COLUMN IF NOT EXISTS phone_secondary varchar(24) NOT NULL DEFAULT ''`);
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
  await ensureSeed();
  const [row] = await db.select().from(directorySettings).where(eq(directorySettings.key, "site_config"));
  if (!row) return defaultSettings;
  try { const saved = JSON.parse(row.value) as Partial<SiteSettings>; return { ...defaultSettings, ...saved, marqueeTextColor: !saved.marqueeBackgroundColor && saved.marqueeTextColor === "#745827" ? defaultSettings.marqueeTextColor : saved.marqueeTextColor ?? defaultSettings.marqueeTextColor }; } catch { return defaultSettings; }
}
export function serializeService(item: typeof services.$inferSelect): ServiceRecord { return { ...item, createdAt: item.createdAt.toISOString() }; }
export function serializeAd(item: typeof advertisements.$inferSelect): AdRecord { return { ...item, createdAt: item.createdAt.toISOString(), expiresAt: item.expiresAt?.toISOString() ?? null }; }
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
  const catalog = await getCatalog();
  const visibleRoots = catalog.categories.filter((category) => !category.parentId && category.active).map((category) => category.id);
  const visibleCategories = catalog.categories.filter((category) => category.active && (!category.parentId || visibleRoots.includes(category.parentId)));
  const ids = visibleCategories.filter((category) => category.parentId).map((category) => category.id);
  const [providers, ads] = await Promise.all([
    ids.length ? db.select().from(services).where(and(eq(services.status, "approved"), inArray(services.category, ids))).orderBy(desc(services.featured), asc(services.id)) : Promise.resolve([]),
    db.select().from(advertisements).where(and(eq(advertisements.status, "approved"), eq(advertisements.paid, true), or(isNull(advertisements.expiresAt), gt(advertisements.expiresAt, new Date())))).orderBy(desc(advertisements.createdAt)),
  ]);
  return { ...catalog, categories: visibleCategories, services: providers.map(serializeService), ads: ads.map(serializeAd) };
}
export async function getAdminDirectory(): Promise<AdminDirectory> {
  const catalog = await getCatalog();
  const [providers, ads, memberRows, notificationRows, unreadTotal] = await Promise.all([
    db.select().from(services).orderBy(desc(services.createdAt)),
    db.select().from(advertisements).orderBy(desc(advertisements.createdAt)),
    db.select({ id: members.id, name: members.name, username: members.username, phone: members.phone, active: members.active, createdAt: members.createdAt }).from(members).orderBy(desc(members.createdAt)),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(200),
    db.select({ total: count() }).from(notifications).where(eq(notifications.read, false)),
  ]);
  return { ...catalog, services: providers.map(serializeService), ads: ads.map(serializeAd), members: memberRows.map((member) => ({ ...member, createdAt: member.createdAt.toISOString() })), notifications: notificationRows.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })), notificationUnread: unreadTotal[0]?.total ?? 0 };
}

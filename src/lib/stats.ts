import { activeOffer, getCategory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";

/** أرقام القرية العامة لصفحة «جنزور في أرقام» — لا تحتوي أي بيانات اتصال. */
export type VillageStats = {
  providers: number;
  verified: number;
  featured: number;
  emergency: number;
  availableNow: number;
  newThisMonth: number;
  offers: number;
  roots: number;
  specialties: number;
  areas: number;
  members: number;
  reviews: number;
  averageRating: number;
  topRated: { name: string; category: string; rating: number; reviews: number }[];
  topRoots: { id: string; name: string; color: string; count: number; share: number }[];
  topSpecialties: { id: string; name: string; parentName: string; color: string; count: number }[];
  newest: { name: string; category: string; createdAt: string }[];
  generatedAt: string;
};

export function computeVillageStats(input: { services: ServiceRecord[]; categories: CategoryRecord[]; areas: { name: string }[]; memberCount: number }, now = Date.now()): VillageStats {
  const approved = input.services.filter((service) => service.status === "approved" && !service.demo);
  const activeCategories = input.categories.filter((category) => category.active);
  const roots = activeCategories.filter((category) => !category.parentId);
  const specialties = activeCategories.filter((category) => category.parentId);
  const byRoot = new Map<string, number>();
  const bySpecialty = new Map<string, number>();
  for (const service of approved) {
    const category = getCategory(service.category, input.categories);
    const rootId = category.parentId ?? category.id;
    byRoot.set(rootId, (byRoot.get(rootId) ?? 0) + 1);
    bySpecialty.set(category.id, (bySpecialty.get(category.id) ?? 0) + 1);
  }
  const rated = approved.filter((service) => Number(service.reviews) > 0 && Number.parseFloat(service.rating) > 0);
  const reviews = approved.reduce((sum, service) => sum + (Number(service.reviews) || 0), 0);
  const weighted = rated.reduce((sum, service) => sum + Number.parseFloat(service.rating) * Number(service.reviews), 0);
  const topRoots = roots
    .map((root) => ({ id: root.id, name: root.name, color: root.color, count: byRoot.get(root.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ ...item, share: approved.length ? Math.round((item.count / approved.length) * 100) : 0 }));
  const topSpecialties = specialties
    .map((category) => ({ id: category.id, name: category.name, parentName: getCategory(category.parentId!, input.categories).name, color: category.color, count: bySpecialty.get(category.id) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ar"))
    .slice(0, 8);
  const month = 30 * 86_400_000;
  return {
    providers: approved.length,
    verified: approved.filter((service) => service.verified).length,
    featured: approved.filter((service) => service.featured).length,
    emergency: approved.filter((service) => service.emergency).length,
    availableNow: approved.filter((service) => service.availableNow && service.availableUntil && Date.parse(service.availableUntil) > now).length,
    newThisMonth: approved.filter((service) => now - Date.parse(service.createdAt) <= month).length,
    offers: approved.filter((service) => activeOffer(service, now)).length,
    roots: roots.length,
    specialties: specialties.length,
    areas: input.areas.length,
    members: input.memberCount,
    reviews,
    averageRating: reviews ? Math.round((weighted / rated.reduce((sum, service) => sum + Number(service.reviews), 0)) * 10) / 10 : 0,
    topRated: rated
      .filter((service) => Number(service.reviews) >= 2)
      .sort((a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating) || Number(b.reviews) - Number(a.reviews))
      .slice(0, 5)
      .map((service) => ({ name: service.name, category: getCategory(service.category, input.categories).name, rating: Number.parseFloat(service.rating), reviews: Number(service.reviews) })),
    topRoots,
    topSpecialties,
    newest: [...approved]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 5)
      .map((service) => ({ name: service.name, category: getCategory(service.category, input.categories).name, createdAt: service.createdAt })),
    generatedAt: new Date(now).toISOString(),
  };
}

/** نص مشاركة مختصر لواتساب. */
export function villageStatsShareText(stats: VillageStats, siteName: string, url: string) {
  const lines = [
    `📊 ${siteName} في أرقام`,
    `👷 ${stats.providers} مهني وخدمة منشورة`,
    `🗂️ ${stats.roots} قسمًا و${stats.specialties} تخصصًا`,
    `⭐ ${stats.reviews} تقييمًا من أهل القرية${stats.averageRating ? ` بمتوسط ${stats.averageRating}/5` : ""}`,
  ];
  if (stats.newThisMonth) lines.push(`🆕 ${stats.newThisMonth} انضموا هذا الشهر`);
  if (stats.offers) lines.push(`🏷️ ${stats.offers} عروض نشطة الآن`);
  lines.push(url);
  return lines.join("\n");
}

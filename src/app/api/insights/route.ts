import { desc, eq, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { categoryHits, directoryCategories, serviceHits, services } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError } from "@/lib/inputs";
import { cleanText } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * إحصاءات استخدام حقيقية للإدارة (أرقام مجهولة على الخادم، مش محفوظة في متصفح الزائر):
 * - إجمالي مشاهدات البطاقات ونقرات الاتصال/واتساب.
 * - أكثر المهن تفاعلًا.
 * - أكثر الأقسام استخدامًا.
 */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ views: 0, contacts: 0, providers: [], sections: [] });
    await ensureSeed();

    const [totals] = await db
      .select({ views: sql<number>`coalesce(sum(${serviceHits.views}), 0)::int`, contacts: sql<number>`coalesce(sum(${serviceHits.contacts}), 0)::int` })
      .from(serviceHits);

    const providers = await db
      .select({
        serviceId: serviceHits.serviceId,
        views: serviceHits.views,
        contacts: serviceHits.contacts,
        updatedAt: serviceHits.updatedAt,
        name: services.name,
        area: services.area,
        category: services.category,
        categoryName: directoryCategories.name,
      })
      .from(serviceHits)
      .leftJoin(services, eq(services.id, serviceHits.serviceId))
      .leftJoin(directoryCategories, eq(directoryCategories.id, services.category))
      .orderBy(desc(serviceHits.contacts), desc(serviceHits.views))
      .limit(20);

    const sections = await db
      .select({ categoryId: categoryHits.categoryId, name: directoryCategories.name, views: categoryHits.views, contacts: categoryHits.contacts })
      .from(categoryHits)
      .leftJoin(directoryCategories, eq(directoryCategories.id, categoryHits.categoryId))
      .orderBy(desc(categoryHits.contacts), desc(categoryHits.views))
      .limit(12);

    return Response.json({
      views: Number(totals?.views ?? 0),
      contacts: Number(totals?.contacts ?? 0),
      providers: providers.filter((row) => row.name).map((row) => ({
        serviceId: row.serviceId,
        name: cleanText(row.name ?? "", 160),
        area: cleanText(row.area ?? "", 80),
        categoryName: cleanText(row.categoryName ?? "", 120),
        views: Number(row.views ?? 0),
        contacts: Number(row.contacts ?? 0),
        updatedAt: row.updatedAt,
      })),
      sections: sections.filter((row) => row.name).map((row) => ({ categoryId: row.categoryId, name: cleanText(row.name ?? "", 120), views: Number(row.views ?? 0), contacts: Number(row.contacts ?? 0) })),
    });
  } catch (error) { return apiError(error); }
}

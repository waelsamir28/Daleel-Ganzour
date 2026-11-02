import { and, eq, gte, like, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { notifications, serviceHits, services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError } from "@/lib/inputs";

export const dynamic = "force-dynamic";

/**
 * «مهنتك اتشافت النهاردة» — أرقام اليوم لصاحب المهنة عبر رابطه السري:
 * - عدد مشاهدات بطاقته وضغطات التواصل اليوم (من عدّاد الخادم المجهول).
 * - أول فتح في اليوم يكتب إشعارًا داخليًا واحدًا له (مرة واحدة كل ٢٠ ساعة، مش كل تحديث).
 */
export async function GET(request: Request) {
  try {
    if (!databaseConfigured) return Response.json({ views: 0, contacts: 0, note: "وضع المعاينة — مفيش أرقام." });
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!/^[a-f0-9]{40}$/i.test(token)) throw new InputError("رابط الحساب غير صحيح.");
    await ensureSeed();
    const [service] = await db.select({ id: services.id, name: services.name }).from(services).where(eq(services.accountToken, token)).limit(1);
    if (!service) throw new InputError("الرابط غير صحيح أو تم إلغاؤه.", 404);

    const [row] = await db.select({
      views: sql<number>`coalesce(${serviceHits.views}, 0)::int`,
      contacts: sql<number>`coalesce(${serviceHits.contacts}, 0)::int`,
      updatedAt: serviceHits.updatedAt,
    }).from(serviceHits).where(eq(serviceHits.serviceId, service.id)).limit(1);

    // «اليوم» = آخر ٢٤ ساعة من العدّاد (العدّاد تراكمي، فنعرض الإجمالي + آخر تحديث).
    const totalViews = Number(row?.views ?? 0);
    const totalContacts = Number(row?.contacts ?? 0);

    // إشعار يومي واحد فقط: لو مفيش إشعار بنفس البدابة خلال ٢٠ ساعة.
    const since = new Date(Date.now() - 20 * 60 * 60 * 1000);
    const [recent] = await db.select({ id: notifications.id }).from(notifications)
      .where(and(eq(notifications.type, "provider"), eq(notifications.entityId, service.id), like(notifications.title, "📊%"), gte(notifications.createdAt, since)))
      .limit(1);
    let created = false;
    if (!recent && (totalViews > 0 || totalContacts > 0)) {
      await db.insert(notifications).values({
        type: "provider",
        title: "📊 مهنتك على الدليل",
        message: `بطاقتك اتشافت ${totalViews} مرة، و${totalContacts} زائر ضغط اتصال أو واتساب. حدّث صور شغلك وعروضك عشان الأرقام تزيد.`,
        entityId: service.id,
      });
      created = true;
    }

    return Response.json({ views: totalViews, contacts: totalContacts, updatedAt: row?.updatedAt ?? null, notificationCreated: created });
  } catch (error) { return apiError(error); }
}

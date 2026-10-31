import { desc, inArray } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { services } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError } from "@/lib/inputs";
import { ownedServiceIds } from "@/lib/member-profile";

export const dynamic = "force-dynamic";

/**
 * بيانات الرسائل الترحيبية العائمة للعضو الحالي:
 * - العضو نفسه (لعرض الاسم في رسالة الترحيب بعد التسجيل).
 * - آخر مهنة مرتبطة برقمه وحالتها + وقت آخر تغيير، عشان الموقع يعرض
 *   «قيد المراجعة» أو «تمت الموافقة» مرة واحدة لكل تغيير (حتى لو التطبيق كان مقفول).
 */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role === "guest" || !viewer.id) return Response.json({ member: null, provider: null });
    const member = { id: viewer.id, name: viewer.name ?? "" };
    if (!databaseConfigured) return Response.json({ member, provider: null });
    await ensureSeed();
    const ids = await ownedServiceIds(viewer.phone ?? "").catch(() => [] as string[]);
    if (!ids.length) return Response.json({ member, provider: null });
    const [row] = await db
      .select({
        id: services.id,
        name: services.name,
        status: services.status,
        statusUpdatedAt: services.statusUpdatedAt,
        reviewNote: services.reviewNote,
        accountToken: services.accountToken,
      })
      .from(services)
      .where(inArray(services.id, ids))
      .orderBy(desc(services.statusUpdatedAt))
      .limit(1);
    if (!row) return Response.json({ member, provider: null });
    return Response.json({
      member,
      provider: {
        serviceId: row.id,
        name: row.name,
        status: row.status,
        statusUpdatedAt: row.statusUpdatedAt,
        reviewNote: row.reviewNote,
        accountHref: row.accountToken ? `/my/${row.accountToken}` : "",
        publicHref: `/?service=${row.id}`,
      },
    });
  } catch (error) { return apiError(error); }
}

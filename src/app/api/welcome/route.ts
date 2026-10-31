import { desc, inArray } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { services, welcomeSeen } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { ownedServiceIds } from "@/lib/member-profile";
import { isValidWelcomeKey, providerStatusKey } from "@/lib/welcome-messages";

export const dynamic = "force-dynamic";

/**
 * الرسائل الترحيبية العائمة:
 * - GET: بيانات العضو + آخر مهنة مرتبطة برقمه + قائمة الرسائل اللي اتشافت (من الخادم).
 * - POST: تعليم رسالة إنها اتشافت — فمش بتظهر تاني خالص على أي جهاز.
 */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role === "guest" || !viewer.id) return Response.json({ member: null, provider: null, seen: [] });
    const member = { id: viewer.id, name: viewer.name ?? "" };
    if (!databaseConfigured) return Response.json({ member, provider: null, seen: [] });
    await ensureSeed();
    const ids = await ownedServiceIds(viewer.phone ?? "").catch(() => [] as string[]);
    if (!ids.length) {
      const seen = await readSeen([`member:${viewer.id}`]);
      return Response.json({ member, provider: null, seen });
    }
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
    if (!row) return Response.json({ member, provider: null, seen: [] });
    // بنسأل عن مفتاح الحالة الحالية بس (الرسالة التانية مش هتظهر أصلًا لو حالتها اتغيرت).
    const candidateKeys = [`member:${viewer.id}`, providerStatusKey(row.id, row.status as never)];
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
      seen: await readSeen(candidateKeys),
    });
  } catch (error) { return apiError(error); }
}

async function readSeen(keys: string[]) {
  if (!databaseConfigured || !keys.length) return [];
  try {
    const rows = await db.select({ key: welcomeSeen.key }).from(welcomeSeen).where(inArray(welcomeSeen.key, keys));
    return rows.map((row) => row.key);
  } catch { return []; }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    const body = objectInput(await request.json());
    if (!isValidWelcomeKey(body.key)) throw new InputError("مفتاح غير صحيح.", 400);
    if (!databaseConfigured) return Response.json({ ok: true, saved: false });
    await ensureSeed();
    await db.insert(welcomeSeen).values({ key: body.key }).onConflictDoNothing();
    return Response.json({ ok: true, saved: true });
  } catch (error) { return apiError(error); }
}

import { and, desc, eq, inArray } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryCategories, services, specialtyFollows } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { getViewer, sameOrigin } from "@/lib/auth";
import { cleanText, rateLimit } from "@/lib/validation";
import type { FollowState } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const FOLLOW_LIMIT = 30;

// Followed specialties for the signed-in member, plus the latest approved services
// in those specialties (the client highlights what is newer than its last seen mark).
export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ followed: [], feed: [] } satisfies FollowState);
    const viewer = await getViewer();
    if (viewer.role !== "member" && viewer.role !== "moderator" && viewer.role !== "admin" || !viewer.id) return Response.json({ followed: [], feed: [] } satisfies FollowState);
    await ensureSeed();
    const followed = (await db.select({ categoryId: specialtyFollows.categoryId }).from(specialtyFollows).where(eq(specialtyFollows.memberId, viewer.id))).map((row) => row.categoryId);
    const feed = followed.length
      ? await db.select({ id: services.id, createdAt: services.createdAt }).from(services).where(and(eq(services.status, "approved"), inArray(services.category, followed))).orderBy(desc(services.createdAt)).limit(20)
      : [];
    return Response.json({ followed, feed: feed.map((row) => ({ id: row.id, createdAt: row.createdAt.toISOString() })) } satisfies FollowState);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "follow", 40)) throw new InputError("طلبات كثيرة. حاول بعد قليل.", 429);
    if (!databaseConfigured) throw new InputError("المتابعة غير متاحة في وضع المعاينة.", 503);
    const viewer = await getViewer();
    if (viewer.role === "guest" || !viewer.id) throw new InputError("سجّل دخولك أولًا لمتابعة التخصصات.", 401);
    await ensureSeed();
    const body = objectInput(await request.json());
    const categoryId = cleanText(body.categoryId ?? "", 60);
    const [category] = await db.select({ id: directoryCategories.id, parentId: directoryCategories.parentId, active: directoryCategories.active }).from(directoryCategories).where(eq(directoryCategories.id, categoryId)).limit(1);
    if (!category || !category.active || !category.parentId) throw new InputError("التخصص غير متاح للمتابعة.");
    const existing = await db.select({ categoryId: specialtyFollows.categoryId }).from(specialtyFollows).where(eq(specialtyFollows.memberId, viewer.id));
    const isFollowed = existing.some((row) => row.categoryId === categoryId);
    if (isFollowed) {
      await db.delete(specialtyFollows).where(and(eq(specialtyFollows.memberId, viewer.id), eq(specialtyFollows.categoryId, categoryId)));
      return Response.json({ ok: true, following: false, message: "تم إلغاء متابعة التخصص." });
    }
    if (existing.length >= FOLLOW_LIMIT) throw new InputError(`يمكنك متابعة حتى ${FOLLOW_LIMIT} تخصص. ألغِ متابعة واحد وأعد المحاولة.`);
    await db.insert(specialtyFollows).values({ memberId: viewer.id, categoryId }).onConflictDoNothing();
    return Response.json({ ok: true, following: true, message: "تمت المتابعة.. أول ما ينزل مهنة جديدة في التخصص هيظهرلك في الجرس." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

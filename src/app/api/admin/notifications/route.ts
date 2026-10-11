import { and, count, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { apiError } from "@/lib/inputs";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const [items, totals] = await Promise.all([db.select().from(notifications).where(ne(notifications.type, "community")).orderBy(desc(notifications.createdAt)).limit(20), db.select({ total: count() }).from(notifications).where(and(eq(notifications.read, false), ne(notifications.type, "community")))]);
    return Response.json({ notifications: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), unread: totals[0]?.total ?? 0 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "غير مصرح." }, { status: 401 });
  try { await db.update(notifications).set({ read: true }).where(eq(notifications.read, false)); return Response.json({ ok: true }); }
  catch (error) { return apiError(error); }
}

import { databaseConfigured, db } from "@/db";
import { sql } from "drizzle-orm";
import { members } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseConfigured) return Response.json({ ok: false, databaseConfigured: false }, { status: 503 });
  try {
    await db.execute(sql`select 1`);
    const [row] = await db.select({ total: sql<number>`count(*)::int`, active: sql<number>`count(*) filter (where active)::int` }).from(members);
    return Response.json({ ok: true, databaseConfigured: true, members: Number(row?.total ?? 0), activeMembers: Number(row?.active ?? 0) });
  } catch {
    return Response.json({ ok: false, databaseConfigured: true }, { status: 500 });
  }
}

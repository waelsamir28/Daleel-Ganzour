import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { categoryHits, directoryCategories, serviceHits, services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError } from "@/lib/inputs";

export const dynamic = "force-dynamic";

/** حالة الدليل العامة (أرقام مجهولة تمامًا، بلا أي بيانات شخصية) — تظهر على شاشة البداية. */
export type DirectoryStatus = {
  professions: number;
  providers: number;
  visits: number;
  contacts: number;
  updatedAt: string;
};

const CACHE_MS = 60_000;
let cache: { data: DirectoryStatus; expires: number } | undefined;

async function readStatus(): Promise<DirectoryStatus> {
  const [professionRow] = await db.select({ total: sql<number>`count(*)::int` }).from(directoryCategories)
    .where(and(eq(directoryCategories.active, true), isNotNull(directoryCategories.parentId)));
  const [providerRow] = await db.select({ total: sql<number>`count(*)::int` }).from(services).where(eq(services.status, "approved"));
  const [hitRow] = await db.select({
    visits: sql<number>`coalesce(sum(${serviceHits.views}), 0)::int`,
    contacts: sql<number>`coalesce(sum(${serviceHits.contacts}), 0)::int`,
  }).from(serviceHits);
  const [sectionRow] = await db.select({
    visits: sql<number>`coalesce(sum(${categoryHits.views}), 0)::int`,
    contacts: sql<number>`coalesce(sum(${categoryHits.contacts}), 0)::int`,
  }).from(categoryHits);
  return {
    professions: Number(professionRow?.total ?? 0),
    providers: Number(providerRow?.total ?? 0),
    visits: Number(hitRow?.visits ?? 0) + Number(sectionRow?.visits ?? 0),
    contacts: Number(hitRow?.contacts ?? 0) + Number(sectionRow?.contacts ?? 0),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ professions: 0, providers: 0, visits: 0, contacts: 0, updatedAt: new Date().toISOString() } satisfies DirectoryStatus);
    if (cache && cache.expires > Date.now()) return Response.json(cache.data);
    await ensureSeed();
    const data = await readStatus();
    cache = { data, expires: Date.now() + CACHE_MS };
    return Response.json(data);
  } catch (error) { return apiError(error); }
}

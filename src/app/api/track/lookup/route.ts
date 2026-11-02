import { and, desc, eq, inArray } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError } from "@/lib/inputs";
import { normalizeLookupPhone, orderLookupResults } from "@/lib/order-lookup";

export const dynamic = "force-dynamic";

/**
 * «طلبي وصل فين؟» — بحث عام برقم الموبايل يرجّع **حالة الطلبات فقط**:
 * اسم مختصر (أحمد م.) + الحالة + التواريخ، بدون أي بيانات تواصل أو تفاصيل.
 * حد بسيط لكل IP حتى لا يُستخدم البحث للتجسس على أرقام الآخرين.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_LOOKUPS_PER_WINDOW = 12;
const attempts = new Map<string, number[]>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function allowed(key: string, now = Date.now()) {
  const list = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (list.length >= MAX_LOOKUPS_PER_WINDOW) { attempts.set(key, list); return false; }
  list.push(now);
  attempts.set(key, list);
  return true;
}

export async function POST(request: Request) {
  try {
    if (!allowed(clientKey(request))) throw new InputError("عدد المحاولات كتير — جرّب تاني بعد شوية أو اتصل بالمكتب.", 429);
    if (!databaseConfigured) return Response.json({ ok: true, results: [] });
    await ensureSeed();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phone = normalizeLookupPhone(String(body.phone ?? ""));
    if (!phone) throw new InputError("اكتب رقم موبايل مصري صحيح (١١ رقمًا يبدأ بـ 010 أو 011 أو 012 أو 015).");
    const rows = await db.select({
      id: services.id,
      name: services.name,
      status: services.status,
      createdAt: services.createdAt,
      statusUpdatedAt: services.statusUpdatedAt,
      reviewNote: services.reviewNote,
    }).from(services).where(and(eq(services.phone, phone), inArray(services.status, ["pending", "approved", "rejected", "needs-info"]))).orderBy(desc(services.createdAt)).limit(8);
    const results = orderLookupResults(rows.map((row) => ({
      ...row,
      createdAt: row.createdAt?.toISOString?.() ?? null,
      statusUpdatedAt: row.statusUpdatedAt?.toISOString?.() ?? null,
    })));
    return Response.json({ ok: true, results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

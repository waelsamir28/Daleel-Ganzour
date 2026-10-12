import { db, databaseConfigured } from "@/db";
import { services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { sameOrigin } from "@/lib/auth";
import { availabilityUpdate, AVAILABILITY_HOURS } from "@/lib/catalog";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// The provider's private renewal link lands here: one untappable tap extends the
// availability window by AVAILABILITY_HOURS, exactly like the admin activation does.
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "التجديد غير متاح في وضع المعاينة." }, { status: 503 });
    await ensureSeed();
    const body = objectInput(await request.json());
    const token = typeof body.token === "string" ? body.token : "";
    if (!/^[a-f0-9]{40}$/i.test(token)) throw new InputError("رابط التجديد غير صحيح.");
    const [service] = await db.select({ id: services.id, name: services.name, availableNow: services.availableNow, availableUntil: services.availableUntil }).from(services).where(eq(services.availabilityToken, token)).limit(1);
    if (!service) throw new InputError("الرابط غير صحيح أو تم تجديده. اطلب لينك جديد من الإدارة.", 404);
    const next = availabilityUpdate("activate", { availableNow: service.availableNow, availableUntil: service.availableUntil });
    await db.update(services).set(next).where(eq(services.id, service.id));
    return Response.json({ ok: true, name: service.name, hours: AVAILABILITY_HOURS, until: next.availableUntil?.toISOString() ?? null });
  } catch (error) { return apiError(error); }
}

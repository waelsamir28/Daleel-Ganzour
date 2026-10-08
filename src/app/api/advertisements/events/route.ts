import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { advertisements, advertisementEvents } from "@/db/schema";
import { sameOrigin } from "@/lib/auth";
import { isAdActive } from "@/lib/catalog";
import { ensureSeed, serializeAd } from "@/lib/directory";
import { InputError, apiError, objectInput } from "@/lib/inputs";
import { rateLimit, validId } from "@/lib/validation";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!request.headers.get("origin") || !sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "ad-events", 300, 5 * 60 * 1000)) return Response.json({ error: "طلبات كثيرة." }, { status: 429 });
  try {
    const raw = await request.text();
    if (raw.length > 2048) throw new InputError("حجم الطلب غير صحيح.");
    const { adId, eventId, eventType, action = "" } = objectInput(JSON.parse(raw));
    if (!validId(adId) || !validId(eventId) || typeof eventType !== "string" || !["impression", "click"].includes(eventType)
      || typeof action !== "string" || !["", "call", "whatsapp", "details"].includes(action)
      || eventType === "impression" && action !== "" || eventType === "click" && action === "") throw new InputError("حدث الإعلان غير صحيح.");
    await ensureSeed();
    const recorded = await db.transaction(async (tx) => {
      const [ad] = await tx.select().from(advertisements).where(eq(advertisements.id, adId)).limit(1).for("update");
      if (!ad || !isAdActive(serializeAd(ad))) return false;
      const inserted = await tx.insert(advertisementEvents).values({ adId, eventId, eventType, action }).onConflictDoNothing().returning({ eventId: advertisementEvents.eventId });
      if (!inserted.length) return false;
      await tx.update(advertisements).set(eventType === "impression"
        ? { impressions: sql`${advertisements.impressions} + 1` }
        : { clicks: sql`${advertisements.clicks} + 1` }).where(eq(advertisements.id, adId));
      return true;
    });
    return Response.json({ recorded });
  } catch (error) { return apiError(error); }
}

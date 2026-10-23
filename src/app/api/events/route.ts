import { eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { villageEvents } from "@/db/schema";
import { ensureSeed, getSettings, listEvents, serializeEvent } from "@/lib/directory";
import { apiError } from "@/lib/inputs";
import { eventIcs } from "@/lib/catalog";
import { validId } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** `GET /api/events` → upcoming events JSON; `GET /api/events?ics=<id>` → an .ics file that opens the phone's calendar («ذكّرني»). */
export async function GET(request: Request) {
  try {
    if (!databaseConfigured) return Response.json({ events: [] });
    const url = new URL(request.url), icsId = url.searchParams.get("ics");
    if (!icsId) return Response.json({ events: await listEvents() });
    if (!validId(icsId)) return Response.json({ error: "المناسبة غير موجودة." }, { status: 404 });
    await ensureSeed();
    const [row] = await db.select().from(villageEvents).where(eq(villageEvents.id, icsId)).limit(1);
    if (!row) return Response.json({ error: "المناسبة غير موجودة." }, { status: 404 });
    const settings = await getSettings();
    const body = eventIcs(serializeEvent(row), settings.siteName, `${url.origin}/events?event=${row.id}`);
    return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="event-${row.id.slice(0, 8)}.ics"`, "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

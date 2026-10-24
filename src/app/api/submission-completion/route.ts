import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, services, submissionTracking } from "@/db/schema";
import { sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "submission-completion", 5)) return Response.json({ error: "حاول بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const body = objectInput(await request.json());
    if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) throw new InputError("رابط غير صالح.", 404);
    const note = cleanText(body.note, 1000), name = cleanText(body.name ?? "", 160), phone = cleanPhone(body.phone ?? ""), address = cleanText(body.address ?? "", 240), description = cleanText(body.description ?? "", 1000);
    if (note.length < 3 || (name && name.length < 3) || (phone && !validPhone(phone)) || (address && address.length < 3) || (description && description.length < 10)) throw new InputError("راجع البيانات المدخلة.");
    await ensureSeed();
    const tokenHash = createHash("sha256").update(body.token).digest("hex");
    await db.transaction(async (tx) => {
      const [tracking] = await tx.select().from(submissionTracking).where(eq(submissionTracking.tokenHash, tokenHash));
      if (!tracking) throw new InputError("رابط غير صالح.", 404);
      // Conditional update prevents stale or repeated submissions from editing a reviewed/published service.
      const updated = await tx.update(services).set({ ...(name ? { name } : {}), ...(phone ? { phone } : {}), ...(address ? { address } : {}), ...(description ? { description } : {}), status: "pending", reviewNote: "", verified: false, featured: false })
        .where(and(eq(services.id, tracking.serviceId), eq(services.status, "needs-info"))).returning({ id: services.id });
      if (!updated.length) throw new InputError("الطلب ليس في انتظار استكمال البيانات.", 409);
      await tx.insert(notifications).values({ type: "service", title: "استكمال بيانات طلب مهنة", message: note, entityId: tracking.serviceId });
    });
    queueAdminWhatsappAlert("service", "📝 استكمال بيانات طلب مهنة", note);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

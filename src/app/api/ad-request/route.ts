import { db, databaseConfigured } from "@/db";
import { adRequests, notifications } from "@/db/schema";
import { sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { AD_REQUEST_KINDS, isAdTemplateId } from "@/lib/catalog";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

/** Public endpoint behind the «أعلن معنا» form: stores the request and raises an admin notification. */
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) throw new InputError("قاعدة البيانات غير مهيأة.", 503);
    if (rateLimit(request, "ad-request", 5)) throw new InputError("طلبات كثيرة. حاول بعد قليل.", 429);
    const values = objectInput(await request.json());
    const name = cleanText(values.name, 80), business = cleanText(values.business, 120), phone = cleanPhone(values.phone ?? "");
    if (name.length < 2) throw new InputError("اكتب اسمك.");
    if (!validPhone(phone)) throw new InputError("رقم الموبايل غير صحيح.");
    const kind = typeof values.kind === "string" && values.kind in AD_REQUEST_KINDS ? values.kind : "template";
    const template = kind === "template" && isAdTemplateId(values.template) ? values.template : "";
    const tierLabel = cleanText(values.tierLabel, 60), notes = cleanText(values.notes, 400);
    await ensureSeed();
    const [row] = await db.insert(adRequests).values({ name, business, phone, tierLabel, kind, template, notes }).returning({ id: adRequests.id });
    await db.insert(notifications).values({ type: "ad-request", title: `طلب إعلان جديد من ${business || name}`, message: `${name} • ${phone}${tierLabel ? ` • ${tierLabel}` : ""} • ${AD_REQUEST_KINDS[kind]}`.slice(0, 300), entityId: row.id });
    queueAdminWhatsappAlert("ad-request", `📢 طلب إعلان جديد من ${business || name}`, `${name} • ${phone}${tierLabel ? ` • ${tierLabel}` : ""} • ${AD_REQUEST_KINDS[kind]}`);
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}

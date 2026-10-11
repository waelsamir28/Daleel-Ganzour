import { db } from "@/db";
import { notifications, services } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, objectInput, InputError } from "@/lib/inputs";
import { cleanPhone, cleanText, validId, validPhone } from "@/lib/validation";
import { sameOrigin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    await ensureSeed();
    const body = objectInput(await request.json());
    const serviceId = body.serviceId;
    if (!validId(serviceId)) throw new InputError("الخدمة غير صحيحة.");
    const [service] = await db.select({ id: services.id, name: services.name }).from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) throw new InputError("الخدمة غير موجودة.", 404);
    const phone = cleanPhone(body.phone ?? "");
    const note = cleanText(body.note ?? "", 240);
    if (!validPhone(phone)) throw new InputError("أدخل رقم هاتف صحيحًا.");
    await db.insert(notifications).values({ type: "service-update", title: `طلب تحديث بيانات: ${service.name}`, message: `الرقم المقترح: ${phone}${note ? ` — ${note}` : ""}`, entityId: service.id });
    return Response.json({ ok: true, message: "وصل طلبك للإدارة للمراجعة." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

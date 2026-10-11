import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointmentRequests, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanPhone, cleanText, rateLimit, validId, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";
async function admin() {
  if ((await getViewer()).role !== "admin") throw new InputError("متاح للإدارة فقط.", 403);
  await ensureSeed();
}
export async function GET() {
  try {
    await admin();
    const items = await db.select({ id: appointmentRequests.id, name: appointmentRequests.name, phone: appointmentRequests.phone, preference: appointmentRequests.preference, status: appointmentRequests.status, serviceName: services.name, serviceId: appointmentRequests.serviceId, createdAt: appointmentRequests.createdAt })
      .from(appointmentRequests).innerJoin(services, eq(services.id, appointmentRequests.serviceId)).orderBy(desc(appointmentRequests.createdAt)).limit(200);
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "appointment", 5)) return Response.json({ error: "حاول بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const body = objectInput(await request.json()), name = cleanText(body.name, 120), phone = cleanPhone(body.phone), preference = cleanText(body.preference, 240);
    if (!validId(body.serviceId) || name.length < 2 || !validPhone(phone) || preference.length < 3) throw new InputError("أدخل الاسم ورقم صحيح والموعد المفضل.");
    await ensureSeed();
    const [service] = await db.select({ id: services.id }).from(services).where(and(eq(services.id, body.serviceId), eq(services.status, "approved"), eq(services.demo, false)));
    if (!service) throw new InputError("الخدمة غير متاحة لطلب موعد.", 404);
    const [created] = await db.insert(appointmentRequests).values({ serviceId: service.id, name, phone, preference }).returning({ id: appointmentRequests.id });
    return Response.json({ ...created, message: "وصل طلب الموعد للإدارة. ده طلب انتظار وليس حجزًا مؤكدًا؛ الإدارة هتتواصل معاك." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  try {
    await admin();
    const body = objectInput(await request.json());
    if (!validId(body.id) || !["waiting", "contacted", "closed"].includes(String(body.status))) throw new InputError("بيانات غير صحيحة.");
    const updated = await db.update(appointmentRequests).set({ status: String(body.status) }).where(eq(appointmentRequests.id, body.id)).returning({ id: appointmentRequests.id });
    if (!updated.length) throw new InputError("الطلب غير موجود.", 404);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

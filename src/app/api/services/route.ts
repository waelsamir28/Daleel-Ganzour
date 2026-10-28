import { db } from "@/db";
import { notifications, services, submissionTracking } from "@/db/schema";
import { createHash, randomBytes } from "node:crypto";
import { getPublicDirectory, withDirectoryInvalidation } from "@/lib/directory";
import { getViewer, sameOrigin } from "@/lib/auth";
import { apiError, InputError, objectInput, serviceInput } from "@/lib/inputs";
import { rateLimit } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";
import { directoryForViewer } from "@/lib/membership-gate";
import { saveServicePhoto } from "@/lib/service-photo";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [data, viewer] = await Promise.all([getPublicDirectory(), getViewer()]);
    return Response.json(directoryForViewer(data, viewer));
  }
  catch (error) { return apiError(error); }
}
export const POST = withDirectoryInvalidation(async (request: Request) => {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "service", 10)) return Response.json({ error: "طلبات كثيرة. يرجى المحاولة بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const viewer = await getViewer();
    if (viewer.role === "guest") throw new InputError("سجّل عضويتك أولًا لتتمكن من إضافة مهنتك.", 401);
    const body = objectInput(await request.json());
    const { photo, ...values } = await serviceInput(body);
    const token = randomBytes(32).toString("hex");
    const service = await db.transaction(async (tx) => {
      const [created] = await tx.insert(services).values({ ...values, status: "pending", verified: false, featured: false, demo: false }).returning({ id: services.id, status: services.status });
      await saveServicePhoto(tx, created.id, photo);
      await tx.insert(submissionTracking).values({ serviceId: created.id, tokenHash: createHash("sha256").update(token).digest("hex") });
      await tx.insert(notifications).values({ type: "service", title: "طلب مهنة جديد بانتظارك", message: `${values.name} أرسل طلب إضافة خدمة • ${values.phone}. راجع البيانات قبل النشر.`, entityId: created.id });
      return created;
    });
    queueAdminWhatsappAlert("service", "🔔 طلب مهنة جديد بانتظارك", `${values.name} أرسل طلب إضافة مهنة (${values.category}) • ${values.phone}. راجع البيانات قبل النشر.`);
    return Response.json({ ...service, trackingUrl: `/track/${token}`, message: "وصل طلبك للإدارة ومعاه إشعار. خدمتك مش هتظهر في الدليل إلا بعد الموافقة." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
});

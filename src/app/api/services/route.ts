import { db } from "@/db";
import { notifications, services } from "@/db/schema";
import { getPublicDirectory } from "@/lib/directory";
import { sameOrigin } from "@/lib/auth";
import { apiError, objectInput, serviceInput } from "@/lib/inputs";
import { rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await getPublicDirectory()); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "service", 10)) return Response.json({ error: "طلبات كثيرة. يرجى المحاولة بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const body = objectInput(await request.json());
    const values = await serviceInput(body);
    const service = await db.transaction(async (tx) => {
      const [created] = await tx.insert(services).values({ ...values, status: "pending", verified: false, featured: false, demo: false }).returning({ id: services.id, status: services.status });
      await tx.insert(notifications).values({ type: "service", title: "طلب مهنة جديد بانتظارك", message: `${values.name} أرسل طلب إضافة خدمة. راجع البيانات قبل النشر.`, entityId: created.id });
      return created;
    });
    return Response.json({ ...service, message: "وصل طلبك للإدارة ومعاه إشعار. خدمتك مش هتظهر في الدليل إلا بعد الموافقة." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

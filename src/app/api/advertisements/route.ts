import { db } from "@/db";
import { advertisements, notifications } from "@/db/schema";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { sameOrigin } from "@/lib/auth";
import { adInput, apiError, objectInput } from "@/lib/inputs";
import { rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ ads: (await getPublicDirectory()).ads }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "ad", 10)) return Response.json({ error: "طلبات كثيرة. يرجى المحاولة لاحقًا." }, { status: 429 });
  try {
    const values = adInput(objectInput(await request.json()));
    const settings = await getSettings();
    const ad = await db.transaction(async (tx) => {
      const [created] = await tx.insert(advertisements).values({ ...values, price: settings.adPrice, status: "pending", paid: false }).returning({ id: advertisements.id, status: advertisements.status });
      await tx.insert(notifications).values({ type: "ad", title: "طلب إعلان جديد", message: `${values.businessName} طلب حجز مساحة إعلانية. راجع الإعلان وأكد الدفع قبل تفعيله.`, entityId: created.id });
      return created;
    });
    return Response.json({ ...ad, message: "إعلانك وصل للإدارة. تواصل مع مكتب الجمال لإتمام الدفع وتفعيل الإعلان." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

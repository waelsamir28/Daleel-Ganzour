import { desc, eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { communityComplaints, communityListings, pushSubscriptions } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, objectInput } from "@/lib/inputs";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";
const listingTypes = ["labor", "property", "job"] as const;
function text(value: unknown, max: number) { return cleanText(value ?? "", max); }
export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ listings: [] });
    await ensureSeed();
    const listings = await db.select().from(communityListings).where(eq(communityListings.status, "approved")).orderBy(desc(communityListings.createdAt)).limit(60);
    return Response.json({ listings });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    if (!databaseConfigured) return Response.json({ message: "الخدمة ستتاح بعد ربط قاعدة البيانات." }, { status: 503 });
    await ensureSeed();
    const body = objectInput(await request.json()), type = text(body.type, 20), title = text(body.title, 160), description = text(body.description, 2000), phone = cleanPhone(body.phone), whatsapp = cleanPhone(body.whatsapp ?? ""), area = text(body.area, 100), price = text(body.price, 80);
    if (!listingTypes.includes(type as (typeof listingTypes)[number]) || title.length < 3 || description.length < 8 || !validPhone(phone)) return Response.json({ message: "أكمل نوع الإعلان والعنوان والوصف ورقم هاتف صحيح." }, { status: 400 });
    await db.insert(communityListings).values({ type, title, description, phone, whatsapp, area, price, status: "pending" });
    return Response.json({ message: "تم إرسال الإعلان للمراجعة قبل نشره." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    if (!databaseConfigured) return Response.json({ message: "الخدمة غير متاحة." }, { status: 503 });
    const body = objectInput(await request.json()), endpoint = text(body.endpoint, 1000), subscription = JSON.stringify(body.subscription ?? {});
    if (endpoint.length < 10) return Response.json({ message: "اشتراك الإشعارات غير صحيح." }, { status: 400 });
    await db.insert(pushSubscriptions).values({ endpoint, subscription }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { subscription } });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    const body = objectInput(await request.json());
    if (body.type === "complaint") {
      const name = text(body.name, 120), phone = cleanPhone(body.phone), message = text(body.message, 3000);
      if (name.length < 2 || message.length < 10 || !validPhone(phone)) return Response.json({ message: "اكتب الاسم ورقم صحيح وتفاصيل المشكلة." }, { status: 400 });
      await ensureSeed(); await db.insert(communityComplaints).values({ name, phone, message });
      return Response.json({ message: "وصلت رسالتك لمكتب الجمال، وسيتم التواصل معك وديًا." }, { status: 201 });
    }
    return Response.json({ message: "الطلب غير صحيح." }, { status: 400 });
  } catch (error) { return apiError(error); }
}

import { desc, eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { communityComplaints, communityListings, notifications, pushSubscriptions } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, objectInput } from "@/lib/inputs";
import { sameOrigin } from "@/lib/auth";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";
const listingTypes = ["labor", "property", "job"] as const;
const listingTypeLabels = { labor: "عامل يومي", property: "عقار", job: "وظيفة" } as const;
function text(value: unknown, max: number) { return cleanText(value ?? "", max); }

export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ listings: [] });
    await ensureSeed();
    const listings = await db.select().from(communityListings).where(eq(communityListings.status, "approved")).orderBy(desc(communityListings.createdAt)).limit(100);
    return Response.json({ listings });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ message: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "community-listing", 8)) return Response.json({ message: "وصلت لعدد الطلبات المسموح. حاول مرة أخرى بعد ١٥ دقيقة." }, { status: 429 });
  try {
    if (!databaseConfigured) return Response.json({ message: "الخدمة ستتاح بعد ربط قاعدة البيانات." }, { status: 503 });
    await ensureSeed();
    const body = objectInput(await request.json());
    const type = text(body.type, 20), title = text(body.title, 160), profession = text(body.profession, 120);
    const description = text(body.description, 2000), phone = cleanPhone(body.phone), whatsapp = cleanPhone(body.whatsapp ?? "");
    const area = text(body.area, 100), price = text(body.price, 80);
    const validType = listingTypes.includes(type as (typeof listingTypes)[number]);
    const detailsValid = type === "labor" ? profession.length >= 2 : description.length >= 8;
    if (!validType || title.length < 3 || !detailsValid || !validPhone(phone) || (whatsapp && !validPhone(whatsapp))) {
      return Response.json({ message: type === "labor" ? "اكتب اسم العامل ومهنته ورقم هاتف صحيح." : "أكمل عنوان الإعلان وتفاصيله، وأدخل رقم هاتف صحيح." }, { status: 400 });
    }

    const created = await db.transaction(async (tx) => {
      const [listing] = await tx.insert(communityListings).values({ type, title, profession: type === "labor" ? profession : "", description, phone, whatsapp, area, price, status: "pending" }).returning();
      await tx.insert(notifications).values({
        type: "community",
        title: "إعلان مجتمعي جديد بانتظار المراجعة",
        message: `${listingTypeLabels[type as keyof typeof listingTypeLabels]}: ${title}. راجع البيانات قبل النشر.`,
        entityId: listing.id,
      });
      return listing;
    });
    return Response.json({ id: created.id, status: created.status, message: "وصل إعلانك للإدارة للمراجعة. سيظهر في القسم المناسب بعد الموافقة." }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  try {
    if (!databaseConfigured) return Response.json({ message: "الخدمة غير متاحة." }, { status: 503 });
    const body = objectInput(await request.json()), endpoint = text(body.endpoint, 1000), subscription = JSON.stringify(body.subscription ?? {});
    if (endpoint.length < 10 || subscription.length > 10000) return Response.json({ message: "اشتراك الإشعارات غير صحيح." }, { status: 400 });
    await ensureSeed();
    await db.insert(pushSubscriptions).values({ endpoint, subscription }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { subscription } });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ message: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "community-complaint", 5)) return Response.json({ message: "وصلت لعدد الرسائل المسموح. حاول مرة أخرى بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const body = objectInput(await request.json());
    if (body.type === "complaint") {
      if (!databaseConfigured) return Response.json({ message: "الخدمة غير متاحة حاليًا." }, { status: 503 });
      const name = text(body.name, 120), phone = cleanPhone(body.phone), message = text(body.message, 3000);
      if (name.length < 2 || message.length < 10 || !validPhone(phone)) return Response.json({ message: "اكتب الاسم ورقم صحيح وتفاصيل المشكلة." }, { status: 400 });
      await ensureSeed();
      await db.insert(communityComplaints).values({ name, phone, message });
      return Response.json({ message: "وصلت رسالتك لمكتب الجمال، وسيتم التواصل معك وديًا." }, { status: 201 });
    }
    return Response.json({ message: "الطلب غير صحيح." }, { status: 400 });
  } catch (error) { return apiError(error); }
}

import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryCategories, notifications, quoteRequests, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanQuoteRequest, quoteSummary, QUOTE_TARGETS } from "@/lib/quotes";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";
import { rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * «اطلب عرض سعر من ٣ مهنيين»:
 * - POST (زائر): يحفظ الطلب ويختار ٣ مهنيين منشورين في نفس التخصص (بالترتيب الأقل استلامًا
 *   للطلبات حتى يتوزّع بالتساوي) ويرجّع أرقامهم ورسالة واتساب جاهزة لكل واحد.
 * - GET (الإدارة): آخر الطلبات مع حالة كل واحد.
 */

const SERVICE_COLUMNS = { id: services.id, name: services.name, phone: services.phone, area: services.area, category: services.category };

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "quote-request", 6)) throw new InputError("وصلت لحد الطلبات من نفس الجهاز — جرّب بعد ربع ساعة.", 429);
    const clean = cleanQuoteRequest(objectInput(await request.json()));
    if (!clean.ok) throw new InputError(clean.error, 400);
    const quote = clean.value;
    if (!databaseConfigured) return Response.json({ ok: true, saved: false, targets: [], message: "وضع المعاينة — الطلب مش محفوظ." });

    await ensureSeed();
    const [category] = await db
      .select({ id: directoryCategories.id, name: directoryCategories.name, parentId: directoryCategories.parentId })
      .from(directoryCategories)
      .where(eq(directoryCategories.id, quote.categoryId))
      .limit(1);
    if (!category) throw new InputError("التخصص غير موجود.", 404);

    // التخصصات الفرعية بتشمل مهنييها، والقسم الرئيسي بيشمل كل تخصصاته.
    const scope = category.parentId
      ? eq(services.category, category.id)
      : inArray(services.category, (await db.select({ id: directoryCategories.id }).from(directoryCategories).where(eq(directoryCategories.parentId, category.id))).map((row) => row.id).concat(category.id));

    // توزيع عادل: الأقل استلامًا لطلبات سابقة الأول، وبعدها الأقدم إضافةً.
    const targets = await db
      .select({ ...SERVICE_COLUMNS, quotes: sql<number>`coalesce((select count(*) from jsonb_array_elements_text(${quoteRequests.serviceIds}) as t where t.value = ${services.id}::text), 0)::int` })
      .from(services)
      .where(sql`${services.status} = 'approved' and ${scope}`)
      .orderBy(sql`coalesce((select count(*) from jsonb_array_elements_text(${quoteRequests.serviceIds}) as t where t.value = ${services.id}::text), 0) asc`, sql`${services.createdAt} asc`)
      .limit(QUOTE_TARGETS);

    if (!targets.length) throw new InputError("مفيش مهنيين متاحين في التخصص ده لحد الآن — جرّب قسم تاني.", 404);

    const [saved] = await db.insert(quoteRequests).values({
      categoryId: category.id,
      name: quote.name,
      phone: quote.phone,
      details: quote.details,
      area: quote.area,
      serviceIds: targets.map((row) => row.id),
    }).returning({ id: quoteRequests.id });
    await db.insert(notifications).values({
      type: "service",
      title: `طلب عرض سعر: ${category.name}`,
      message: `${quote.name} • ${quote.phone}: ${quoteSummary(quote.details)} — اتبعت لـ${targets.length} مهنيين.`,
      entityId: saved?.id ?? targets[0]?.id ?? category.id,
    });
    queueAdminWhatsappAlert("service", "🧾 طلب عرض سعر جديد", `${category.name} — ${quote.name} • ${quote.phone}: ${quoteSummary(quote.details, 200)}`);

    return Response.json({
      ok: true,
      saved: true,
      categoryName: category.name,
      targets: targets.map((row) => ({ id: row.id, name: row.name, phone: row.phone, area: row.area })),
      message: `الطلب جاهز — ابعته لـ${targets.length} مهنيين بضغطة واحدة لكل واحد.`,
    }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function GET() {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin" && viewer.role !== "moderator") throw new InputError("غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ total: 0, requests: [] });
    await ensureSeed();
    const rows = await db
      .select({ id: quoteRequests.id, categoryId: quoteRequests.categoryId, categoryName: directoryCategories.name, name: quoteRequests.name, phone: quoteRequests.phone, details: quoteRequests.details, area: quoteRequests.area, serviceIds: quoteRequests.serviceIds, status: quoteRequests.status, createdAt: quoteRequests.createdAt })
      .from(quoteRequests)
      .leftJoin(directoryCategories, eq(directoryCategories.id, quoteRequests.categoryId))
      .orderBy(desc(quoteRequests.createdAt))
      .limit(40);
    const [total] = await db.select({ value: sql<number>`count(*)::int` }).from(quoteRequests);
    return Response.json({
      total: Number(total?.value ?? 0),
      requests: rows.map((row) => ({ ...row, details: quoteSummary(row.details, 240), targets: row.serviceIds.length })),
    });
  } catch (error) { return apiError(error); }
}

import { db, databaseConfigured } from "@/db";
import { communityComplaints, pushSubscriptions } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";
import { apiError, objectInput } from "@/lib/inputs";
import { sameOrigin } from "@/lib/auth";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";
import { queueAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";
function text(value: unknown, max: number) { return cleanText(value ?? "", max); }

// Retired market endpoints cannot publish or accept new listings.
export async function GET() {
  return Response.json({ message: "تم إلغاء سوق جنزور المجتمعي." }, { status: 410 });
}
export async function POST() {
  return Response.json({ message: "تم إلغاء سوق جنزور المجتمعي." }, { status: 410 });
}

// Keep unrelated notification subscriptions and contact messages available.
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
      queueAdminWhatsappAlert("community", "📨 رسالة/شكوى من المجتمع", `${name} • ${phone}: ${message.slice(0, 300)}`);
      return Response.json({ message: "وصلت رسالتك لمكتب الجمال، وسيتم التواصل معك وديًا." }, { status: 201 });
    }
    return Response.json({ message: "الطلب غير صحيح." }, { status: 400 });
  } catch (error) { return apiError(error); }
}

import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { members, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { memberPhotoUrl } from "@/lib/catalog";
import { ensureSeed, withDirectoryInvalidation } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { getMemberProfileRow, memberOwnsService, ownedServiceIds, profileValues, sanitizeProfileValues, saveMemberPhoto, saveMemberProfileValues } from "@/lib/member-profile";
import { parsePhotoInput } from "@/lib/service-photo";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * الملف الشخصي للعضو المسجّل (مستقل عن المهنة):
 * - GET: من أنا؟ (الاسم، الرقم، الصورة، مهني بنفس الرقم) — يستخدمه الكارت ليعرف إن كان الزائر صاحب المهنة.
 * - POST update: حفظ الاسم/الرقم والخانات الإضافية والصورة (الصورة وحدها تُنسخ إلى كارت مهنه بنفس الرقم).
 * - POST service-photo: رفع/تغيير صورة مهنة يملكها العضو من دائرة الكارت مباشرة.
 */
async function currentMember() {
  const viewer = await getViewer();
  if (viewer.role !== "member" && viewer.role !== "moderator") return null;
  const [member] = await db.select().from(members).where(eq(members.id, viewer.id!)).limit(1);
  return member && member.active ? member : null;
}

async function snapshot(member: typeof members.$inferSelect) {
  const [profile, owned] = await Promise.all([getMemberProfileRow(member.id), ownedServiceIds(member.phone)]);
  return {
    ok: true,
    member: { id: member.id, name: member.name, username: member.username, phone: member.phone, role: member.role, createdAt: member.createdAt.toISOString() },
    profile: profileValues(profile),
    photoUrl: memberPhotoUrl(member.id, profile?.photoVersion ?? 0),
    photoVersion: profile?.photoVersion ?? 0,
    ownedServiceIds: owned,
  };
}

export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ ok: true, member: null });
    await ensureSeed();
    const member = await currentMember();
    if (!member) return Response.json({ ok: true, member: null }, { headers: { "Cache-Control": "no-store" } });
    return Response.json(await snapshot(member), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export const POST = withDirectoryInvalidation(async (request: Request) => {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "الملف الشخصي غير متاح في وضع المعاينة." }, { status: 503 });
    if (rateLimit(request, "member-profile", 60)) throw new InputError("محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.", 429);
    await ensureSeed();
    const member = await currentMember();
    if (!member) throw new InputError("سجّل دخولك أولًا لتعديل ملفك الشخصي.", 401);
    const body = objectInput(await request.json());

    if (body.action === "service-photo") {
      const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
      if (!/^[0-9a-f-]{36}$/i.test(serviceId)) throw new InputError("المهنة غير موجودة.", 404);
      if (!(await memberOwnsService(member.phone, serviceId))) throw new InputError("هذه المهنة ليست مسجّلة برقم هاتفك، فلا يمكنك تغيير صورتها.", 403);
      const photo = parsePhotoInput(body.photo);
      if (photo === undefined) throw new InputError("اختر صورة أولًا.");
      // صورة واحدة مشتركة: تُحفظ على الملف الشخصي وتُبث إلى كل مهن العضو بنفس الرقم.
      await saveMemberPhoto(member.id, member.phone, photo);
      const [service] = await db.select({ photoVersion: services.photoVersion }).from(services).where(eq(services.id, serviceId)).limit(1);
      return Response.json({ ...(await snapshot(member)), servicePhotoVersion: service?.photoVersion ?? 0, message: photo ? "تم حفظ صورتك — ستظهر على كارتك وبطاقة عملك." : "تم حذف الصورة." });
    }

    if (body.action === "update") {
      const name = cleanText(body.name ?? member.name, 120);
      if (name.length < 3) throw new InputError("اكتب اسمك الثلاثي.");
      const phone = cleanPhone(body.phone ?? member.phone);
      if (!validPhone(phone)) throw new InputError("رقم الهاتف غير صحيح.");
      const current = profileValues(await getMemberProfileRow(member.id));
      const values = sanitizeProfileValues(body, current);
      const photo = parsePhotoInput(body.photo);
      await db.update(members).set({ name, phone }).where(eq(members.id, member.id));
      await saveMemberProfileValues(member.id, values);
      if (photo !== undefined) await saveMemberPhoto(member.id, phone, photo);
      const [fresh] = await db.select().from(members).where(eq(members.id, member.id)).limit(1);
      return Response.json({ ...(await snapshot(fresh)), message: "تم حفظ ملفك الشخصي." });
    }

    throw new InputError("إجراء غير معروف.");
  } catch (error) { return apiError(error); }
});


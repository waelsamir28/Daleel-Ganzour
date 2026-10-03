import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, notifications } from "@/db/schema";
import { createAdminSession, createMemberSession, destroyAdminSession, destroyMemberSession, getViewer, hashPassword, reservedUsername, sameOrigin, usesSecureCookies, validCredentials, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { cleanPhone, cleanText, rateLimit, validPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ viewer: await getViewer() }); }
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (rateLimit(request, "account", 20)) return Response.json({ error: "محاولات كثيرة. حاول مرة أخرى بعد ١٥ دقيقة." }, { status: 429 });
  try {
    await ensureSeed();
    const body = objectInput(await request.json());
    const username = cleanText(body.username, 40).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const secure = usesSecureCookies(request);
    if (!username || !password || password.length > 200) throw new InputError("أدخل اسم المستخدم وكلمة المرور.");
    if (body.action === "register") {
      if (reservedUsername(username)) throw new InputError("اسم المستخدم ده محجوز. اختار اسمًا مختلفًا.");
      if (!/^[a-z0-9_.-]{3,40}$/.test(username)) throw new InputError("اسم المستخدم من ٣ إلى ٤٠ حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام النقطة والشرطة.");
      const name = cleanText(body.name, 120), phone = cleanPhone(body.phone);
      if (name.length < 3 || !validPhone(phone) || password.length < 6) throw new InputError("أدخل اسمك ورقم هاتف صحيح، وكلمة مرور لا تقل عن ٦ أحرف.");
      if (body.confirmPassword !== password) throw new InputError("كلمتا المرور غير متطابقتين.");
      const passwordHash = await hashPassword(password);
      const member = await db.transaction(async (tx) => {
        const [created] = await tx.insert(members).values({ name, username, phone, passwordHash }).onConflictDoNothing().returning({ id: members.id, name: members.name, username: members.username });
        if (!created) throw new InputError("اسم المستخدم مسجل بالفعل. اختار اسمًا آخر.", 409);
        await tx.insert(notifications).values({ type: "member", title: "عضو جديد في الموقع", message: `${name} انضم لمجتمع جنزور. التسجيل عضوية فقط وليس طلب مهنة.`, entityId: created.id });
        return created;
      });
      await createMemberSession(member.id, secure);
      return Response.json({ ok: true, role: "member", message: "تم إنشاء عضويتك. لم يتم إضافتك إلى دليل المهنيين." }, { status: 201 });
    }
    if (body.action !== "login") throw new InputError("إجراء غير صحيح.");
    if (validCredentials(username, password)) {
      await createAdminSession(secure);
      return Response.json({ ok: true, role: "admin" });
    }
    const [member] = await db.select().from(members).where(eq(members.username, username)).limit(1);
    if (!member?.active || !(await verifyPassword(password, member.passwordHash))) throw new InputError("اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.", 401);
    await createMemberSession(member.id, secure);
    return Response.json({ ok: true, role: "member" });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  try {
    const secure = usesSecureCookies(request);
    await destroyAdminSession(secure); await destroyMemberSession(secure);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

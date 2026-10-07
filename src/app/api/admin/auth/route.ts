import { databaseConfigured } from "@/db";
import { createAdminSession, destroyAdminSession, sameOrigin, usesSecureCookies, validCredentials } from "@/lib/auth";
import { rateLimit } from "@/lib/validation";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!databaseConfigured) return Response.json({ error: "تسجيل الدخول غير متاح دون اتصال قاعدة البيانات." }, { status: 503 });
  if (rateLimit(request, "login", 12)) return Response.json({ error: "محاولات كثيرة. حاول مجددًا بعد ١٥ دقيقة." }, { status: 429 });
  try {
    const body = await request.json();
    if (typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 100 || body.password.length > 200 || !validCredentials(body.username, body.password)) {
      return Response.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, { status: 401 });
    }
    await createAdminSession(usesSecureCookies(request));
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "تعذر تسجيل الدخول. حاول مرة أخرى." }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  await destroyAdminSession(usesSecureCookies(request));
  return Response.json({ ok: true });
}

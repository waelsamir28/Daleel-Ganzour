import { and, eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { answers, notifications, questions, services } from "@/db/schema";
import { getViewer, sameOrigin } from "@/lib/auth";
import { ensureSeed, listQuestions } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { ANSWER_MAX, QUESTION_MAX, QUESTION_MIN } from "@/lib/catalog";
import { cleanText, rateLimit, validId } from "@/lib/validation";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp-alert";

export const dynamic = "force-dynamic";

async function member() {
  const viewer = await getViewer();
  if (viewer.role === "guest" || !viewer.id) throw new InputError("سجّل دخولك كعضو أولًا.", 401);
  return { id: viewer.id, name: viewer.name || viewer.username || "عضو" };
}
async function payload(viewerId: string, status = 200) {
  return Response.json({ ok: true, questions: await listQuestions(viewerId) }, { status });
}

/** Public list (the page renders server-side; this is used after mutations). */
export async function GET() {
  try {
    const viewer = await getViewer();
    return Response.json({ questions: await listQuestions(viewer.id) });
  } catch (error) { return apiError(error); }
}

/** `ask` publishes a question immediately; `answer` nominates a provider from the directory (optionally with a note) or writes a text tip. */
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "الخدمة غير متاحة في وضع المعاينة." }, { status: 503 });
    const me = await member();
    const body = objectInput(await request.json());
    await ensureSeed();
    if (body.action === "ask") {
      if (rateLimit(request, "ask-question", 5)) throw new InputError("وصلت لعدد الأسئلة المسموح. حاول بعد ١٥ دقيقة.", 429);
      const text = cleanText(body.text, QUESTION_MAX), category = cleanText(body.category, 60);
      if (text.length < QUESTION_MIN) throw new InputError(`اكتب سؤالك بوضوح (${QUESTION_MIN} أحرف على الأقل).`);
      const [row] = await db.insert(questions).values({ memberId: me.id, memberName: me.name, text, category }).returning({ id: questions.id });
      await db.insert(notifications).values({ type: "question", title: `سؤال جديد من ${me.name}`, message: text.slice(0, 300), entityId: row.id });
      void sendAdminWhatsappAlert("❓ سؤال جديد في اسأل جنزور", `${me.name}: ${text.slice(0, 200)}`);
      return payload(me.id, 201);
    }
    if (body.action === "answer") {
      if (rateLimit(request, "ask-answer", 20)) throw new InputError("وصلت لعدد الإجابات المسموح. حاول بعد ١٥ دقيقة.", 429);
      const questionId = body.questionId; if (!validId(questionId)) throw new InputError("السؤال غير موجود.");
      const [question] = await db.select({ id: questions.id, status: questions.status }).from(questions).where(eq(questions.id, questionId)).limit(1);
      if (!question) throw new InputError("السؤال غير موجود.", 404);
      if (question.status !== "open") throw new InputError("السؤال مقفول ومش بيستقبل ترشيحات جديدة.");
      const text = cleanText(body.text, ANSWER_MAX);
      let serviceId: string | null = null;
      if (body.serviceId) {
        if (!validId(body.serviceId)) throw new InputError("المهني غير موجود.");
        const [service] = await db.select({ id: services.id, status: services.status }).from(services).where(eq(services.id, body.serviceId)).limit(1);
        if (!service || service.status !== "approved") throw new InputError("المهني غير منشور في الدليل.");
        serviceId = service.id;
        const [duplicate] = await db.select({ id: answers.id }).from(answers).where(and(eq(answers.questionId, questionId), eq(answers.memberId, me.id), eq(answers.serviceId, serviceId))).limit(1);
        if (duplicate) throw new InputError("رشّحت المهني ده قبل كده على نفس السؤال.");
      } else if (text.length < 3) throw new InputError("اختر مهنيًا من الدليل أو اكتب نصيحة قصيرة.");
      await db.insert(answers).values({ questionId, memberId: me.id, memberName: me.name, serviceId, text });
      return payload(me.id, 201);
    }
    throw new InputError("طلب غير صحيح.");
  } catch (error) { return apiError(error); }
}

/** Owner actions: mark the answer that helped («الإجابة اللي ساعدتني») or close the question; anyone can report content. */
export async function PATCH(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "الخدمة غير متاحة في وضع المعاينة." }, { status: 503 });
    const me = await member();
    const body = objectInput(await request.json());
    const questionId = body.questionId; if (!validId(questionId)) throw new InputError("السؤال غير موجود.");
    await ensureSeed();
    const [question] = await db.select({ id: questions.id, memberId: questions.memberId, text: questions.text }).from(questions).where(eq(questions.id, questionId)).limit(1);
    if (!question) throw new InputError("السؤال غير موجود.", 404);
    if (body.action === "report") {
      if (rateLimit(request, "ask-report", 10)) throw new InputError("حاول الإبلاغ مرة أخرى لاحقًا.", 429);
      const answerId = validId(body.answerId) ? body.answerId : null, reason = cleanText(body.reason, 200);
      await db.insert(notifications).values({ type: "report", title: `بلاغ من ${me.name} على ${answerId ? "إجابة" : "سؤال"} في اسأل جنزور`, message: `${reason || "بدون سبب"} — ${question.text.slice(0, 160)}`.slice(0, 300), entityId: answerId ?? question.id });
      return Response.json({ ok: true, message: "وصل بلاغك للإدارة، شكرًا." });
    }
    if (question.memberId !== me.id) throw new InputError("الإجراء ده لصاحب السؤال فقط.", 403);
    if (body.action === "best") {
      const answerId = body.answerId; if (!validId(answerId)) throw new InputError("الإجابة غير موجودة.");
      const [answer] = await db.select({ id: answers.id }).from(answers).where(and(eq(answers.id, answerId), eq(answers.questionId, questionId))).limit(1);
      if (!answer) throw new InputError("الإجابة غير موجودة.", 404);
      await db.update(questions).set({ bestAnswerId: body.clear === true ? null : answerId }).where(eq(questions.id, questionId));
    } else if (body.action === "close" || body.action === "reopen") {
      await db.update(questions).set({ status: body.action === "close" ? "closed" : "open" }).where(eq(questions.id, questionId));
    } else throw new InputError("طلب غير صحيح.");
    return payload(me.id);
  } catch (error) { return apiError(error); }
}

/** A member may delete their own question or answer. */
export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (!databaseConfigured) return Response.json({ error: "الخدمة غير متاحة في وضع المعاينة." }, { status: 503 });
    const me = await member();
    const body = objectInput(await request.json());
    await ensureSeed();
    if (validId(body.answerId)) {
      await db.update(questions).set({ bestAnswerId: null }).where(eq(questions.bestAnswerId, body.answerId));
      await db.delete(answers).where(and(eq(answers.id, body.answerId), eq(answers.memberId, me.id)));
    } else if (validId(body.questionId)) {
      await db.delete(questions).where(and(eq(questions.id, body.questionId), eq(questions.memberId, me.id)));
    } else throw new InputError("طلب غير صحيح.");
    return payload(me.id);
  } catch (error) { return apiError(error); }
}

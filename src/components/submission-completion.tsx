"use client";
import { useState, type FormEvent } from "react";

export default function SubmissionCompletion({ token }: { token: string }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/submission-completion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إرسال البيانات.");
      setDone(true); setMessage("وصلت البيانات، والطلب رجع لمراجعة الإدارة بدون نشر تلقائي.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الاتصال."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status">{message}</p>;
  return <form className="request-form" onSubmit={submit}><h2>استكمال البيانات</h2><p>اكتب توضيحًا للإدارة، وحدّث الخانات اللي محتاجة تصحيح فقط. التصنيف والعنوان العام تعدلهما الإدارة بعد المراجعة.</p>
    <label className="field">توضيح أو بيانات إضافية<textarea name="note" required minLength={3} maxLength={1000}/></label>
    <label className="field">اسم مقدم الخدمة الصحيح (اختياري)<input name="name" minLength={3} maxLength={160}/></label>
    <label className="field">رقم الهاتف الصحيح (اختياري)<input name="phone" type="tel" maxLength={24}/></label>
    <label className="field">العنوان بالتفصيل (اختياري)<input name="address" minLength={3} maxLength={240}/></label>
    <label className="field">وصف الخدمة الجديد (اختياري)<textarea name="description" minLength={10} maxLength={1000}/></label>
    <button className="button button-primary" disabled={busy}>{busy ? "جاري الإرسال..." : "إرسال الاستكمال للمراجعة"}</button>{message && <p role="alert">{message}</p>}
  </form>;
}

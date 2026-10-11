"use client";
import { useState, type FormEvent } from "react";

export default function AppointmentForm({ serviceId }: { serviceId: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, serviceId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إرسال الطلب.");
      setMessage(`${result.message} رقم الطلب: ${result.id}`); setSuccess(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الاتصال."); }
    finally { setBusy(false); }
  }
  return <section><h4>طلب موعد / قائمة انتظار</h4><p>ليس حجزًا مؤكدًا. بياناتك تصل لإدارة الموقع للتواصل والتنسيق.</p>{success ? <p role="status">{message}</p> : <form className="request-form" onSubmit={submit}>
    <label className="field">الاسم<input name="name" required minLength={2} maxLength={120}/></label>
    <label className="field">رقم التواصل<input name="phone" type="tel" required maxLength={24}/></label>
    <label className="field">الموعد المفضل<input name="preference" required minLength={3} maxLength={240} placeholder="مثال: الأحد بعد الساعة ٥ مساءً"/></label>
    <button className="button button-soft" disabled={busy}>{busy ? "جاري الإرسال..." : "إرسال طلب موعد"}</button>{message && <p role="alert">{message}</p>}
  </form>}</section>;
}

"use client";
import { useState, type FormEvent } from "react";
import { CirclePlus, Send, Sparkles } from "lucide-react";
import { getCompletionFieldSuggestions } from "@/lib/catalog";

export default function SubmissionCompletion({ token, categoryId = "", providerName = "", areaName = "" }: { token: string; categoryId?: string; providerName?: string; areaName?: string }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const [note, setNote] = useState("");
  const [name, setName] = useState(providerName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const suggestions = getCompletionFieldSuggestions(categoryId, undefined, name || providerName, areaName);
  const noteSuggestions = [
    "تم استكمال وتحديث جميع البيانات المطلوبة بدقة.",
    "تم إضافة العنوان التفصيلي ورقم التواصل الصحيح.",
    "تم توضيح التخصص والخدمات المقدمة لأهالي جنزور.",
  ];

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
  return <form className="request-form" onSubmit={submit}><h2>استكمال البيانات</h2><p>اكتب توضيحًا للإدارة، وحدّث الخانات اللي محتاجة تصحيح فقط، أو اضغط على الاقتراحات الجاهزة أسفل كل خانة.</p>
    <label className="field">توضيح أو بيانات إضافية
      <textarea name="note" value={note} onChange={(event) => setNote(event.target.value)} required minLength={3} maxLength={1000}/>
      <div className="field-suggestions">
        <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات سريعة للتوضيح:</span>
        {noteSuggestions.map((item) => <button key={item} type="button" className="suggestion-chip" onClick={() => setNote(item)}><CirclePlus size={12}/>{item}</button>)}
      </div>
    </label>
    <label className="field">اسم مقدم الخدمة الصحيح (اختياري)
      <input name="name" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={160}/>
      <div className="field-suggestions">
        <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات الاسم حسب المهنة:</span>
        {suggestions.names.map((item) => <button key={item} type="button" className="suggestion-chip" onClick={() => setName(item)}><CirclePlus size={12}/>{item}</button>)}
      </div>
    </label>
    <label className="field">رقم الهاتف الصحيح (اختياري)<input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" maxLength={24}/></label>
    <label className="field">العنوان بالتفصيل (اختياري)
      <input name="address" value={address} onChange={(event) => setAddress(event.target.value)} minLength={3} maxLength={240}/>
      <div className="field-suggestions">
        <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات العنوان في جنزور:</span>
        {suggestions.addresses.map((item) => <button key={item} type="button" className="suggestion-chip" onClick={() => setAddress(item)}><CirclePlus size={12}/>{item}</button>)}
      </div>
    </label>
    <label className="field">وصف الخدمة الجديد (اختياري)
      <textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1000}/>
      <div className="field-suggestions">
        <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات جاهزة لوصف المهنة:</span>
        {suggestions.descriptions.map((item) => <button key={item} type="button" className="suggestion-chip" onClick={() => setDescription(item)}><CirclePlus size={12}/>{item}</button>)}
      </div>
    </label>
    <button className="button button-primary" disabled={busy}><Send size={16}/>{busy ? "جاري الإرسال..." : "إرسال الاستكمال للمراجعة"}</button>{message && <p role="alert">{message}</p>}
  </form>;
}

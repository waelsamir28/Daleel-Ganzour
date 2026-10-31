"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui";
import { whatsappUrl } from "@/lib/catalog";
import { quoteWhatsappMessage, QUOTE_DETAILS_MAX, QUOTE_TARGETS } from "@/lib/quotes";

type Target = { id: string; name: string; phone: string; area: string };

/**
 * «اطلب عرض سعر من ٣ مهنيين»:
 * الزائر يكتب طلبه مرة واحدة (اسم + موبايل + تفاصيل)، والطلب يتبعت لـ٣ مهنيين
 * في نفس التخصص، وبيظهر له زر واتساب جاهز لكل واحد بضغطة.
 */
export default function QuoteRequestModal({
  categoryId,
  categoryName,
  siteName,
  areas,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  siteName: string;
  areas: string[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ targets: Target[]; message: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, name, phone, details, area }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string; targets?: Target[] };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "تعذّر إرسال الطلب.");
      setResult({ targets: data.targets ?? [], message: data.message ?? "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر إرسال الطلب — جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Modal floating title="طلبك جاهز 🎉" subtitle={`${result.targets.length} من مهنيي ${categoryName} مستنيين رسالتك`} onClose={onClose}>
        <div className="quote-done">
          <p className="quote-done-note"><CheckCircle2 size={16}/> {result.message}</p>
          <p className="quote-done-hint">اضغط «واتساب» جنب كل مهني — الرسالة جاهزة ومكتوب فيها تفاصيل طلبك ورقمك، مش محتاج تكتبها تاني.</p>
          <div className="quote-targets">
            {result.targets.map((target, index) => (
              <article key={target.id} className="quote-target">
                <span className="quote-target-rank">{index + 1}</span>
                <div>
                  <strong>{target.name}</strong>
                  {target.area && <small>{target.area}</small>}
                </div>
                <a className="quote-target-call" href={`tel:${target.phone}`} aria-label={`اتصل بـ ${target.name}`}><Phone size={15}/></a>
                <a
                  className="quote-target-wa"
                  href={whatsappUrl(target.phone, quoteWhatsappMessage({ name, phone, details, area }, target.name, categoryName, siteName))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={15}/> واتساب
                </a>
              </article>
            ))}
          </div>
          <button type="button" className="button button-soft" onClick={onClose}>تم</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal floating title="اطلب عرض سعر من ٣ مهنيين" subtitle={`اكتب طلبك مرة واحدة، والرسالة توصل لـ${QUOTE_TARGETS} من مهنيي ${categoryName}`} onClose={onClose}>
      <form className="quote-form" onSubmit={submit}>
        <label className="field">
          <span>اسمك</span>
          <input value={name} maxLength={120} required onChange={(event) => setName(event.target.value)} placeholder="مثال: محمود عبد الله"/>
        </label>
        <label className="field">
          <span>رقم الموبايل(الواتساب)</span>
          <input value={phone} dir="ltr" inputMode="tel" maxLength={20} required onChange={(event) => setPhone(event.target.value)} placeholder="01012345678"/>
          <small className="input-help">الرقم بيتشاف للمهنيين عشان يردوا عليك بس.</small>
        </label>
        <label className="field">
          <span>المنطقة (اختياري)</span>
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">مش محدد</option>
            {areas.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          <span>اللي محتاجه بالتفصيل</span>
          <textarea value={details} rows={4} maxLength={QUOTE_DETAILS_MAX} required onChange={(event) => setDetails(event.target.value)} placeholder="مثال: تشطيب شقة ١٢٠ متر — محتاج مقايسة لمحارة وسيراميك ودهانات"/>
          <small className="input-help">كل ما تكتب تفاصيل أكتر، السعر يطلع أدق.</small>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary quote-submit" disabled={busy || name.trim().length < 2 || phone.trim().length < 8 || details.trim().length < 10}>
          {busy ? <LoaderCircle size={16} className="spin"/> : <Send size={16}/>} {busy ? "بنجهّز الطلب…" : "ابعت الطلب لـ٣ مهنيين"}
        </button>
        <p className="quote-privacy"><Sparkles size={13}/> طلبك بيُحفظ عند إدارة الدليل للمتابعة، وبيتبعت للمهنيين اللي تختارهم أنت.</p>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, SearchX, Send } from "lucide-react";
import { Modal } from "@/components/ui";
import { MISSING_NEED_MAX } from "@/lib/missing-profession";

/**
 * «مهنتك مش موجودة؟» — الزائر يكتب اللي محتاجه، والطلب يوصل للإدارة،
 * ولما تتضاف المهنة بنبعتله واتساب. الرقم اختياري: من غير رقم الطلب يُسجَّل مجهولًا.
 */
export default function MissingProfessionModal({ categoryId = "", categoryName = "", onClose }: { categoryId?: string; categoryName?: string; onClose: () => void }) {
  const [need, setNeed] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need, name, phone, categoryId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "تعذّر إرسال الطلب.");
      setDone(data.message ?? "وصلنا طلبك — أول ما تتضاف المهنة هنبلّغك.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر إرسال الطلب — جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Modal floating title="وصلنا طلبك ✅" subtitle="شكرًا إنك بتساعدنا نكمّل الدليل" onClose={onClose}>
        <div className="missing-done">
          <p><CheckCircle2 size={18}/> {done}</p>
          <p className="missing-done-hint">لو سيبت رقمك، هنبعتلك واتساب أول ما المهنة تتضاف. ولو تعرف حد شغال في اللي طلبته — قوله ينضم للدليل مجانًا.</p>
          <button type="button" className="button button-soft" onClick={onClose}>تم</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal floating title="مهنة مش موجودة في الدليل؟" subtitle={categoryName ? `قولنا اللي ناقص في «${categoryName}» وهنضيفه` : "قولنا اللي بتدور عليه وهنجيبه"} onClose={onClose}>
      <form className="missing-form" onSubmit={submit}>
        <label className="field">
          <span>بتدور على إيه؟</span>
          <textarea value={need} rows={3} maxLength={MISSING_NEED_MAX} required onChange={(event) => setNeed(event.target.value)} placeholder="مثال: حد بيعمل صيانة تكييفات سيارات في جنزور"/>
          <small className="input-help">اكتبها بالعامية زي ما هتقولها لجارك — إحنا هنفهمها.</small>
        </label>
        <div className="missing-row">
          <label className="field">
            <span>اسمك (اختياري)</span>
            <input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="مثال: محمود"/>
          </label>
          <label className="field">
            <span>موبايلك (اختياري)</span>
            <input value={phone} dir="ltr" inputMode="tel" maxLength={20} onChange={(event) => setPhone(event.target.value)} placeholder="01012345678"/>
          </label>
        </div>
        <p className="missing-note"><SearchX size={13}/> لو سيبت الرقم فاضي، طلبك بيتسجل بدون أي بيانات شخصية.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary missing-submit" disabled={busy || need.trim().length < 6}>
          {busy ? <LoaderCircle size={16} className="spin"/> : <Send size={16}/>} {busy ? "بنبعت…" : "ابعت الطلب للإدارة"}
        </button>
      </form>
    </Modal>
  );
}

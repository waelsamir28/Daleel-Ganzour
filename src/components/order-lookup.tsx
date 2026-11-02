"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, PhoneCall, Search, TriangleAlert, XCircle } from "lucide-react";
import { lookupTimeLabel, normalizeLookupPhone, type OrderLookupResult } from "@/lib/order-lookup";

const STATUS_ICON = {
  pending: <Clock3 size={16}/>,
  approved: <CheckCircle2 size={16}/>,
  rejected: <XCircle size={16}/>,
  "needs-info": <TriangleAlert size={16}/>,
} as const;

/**
 * «طلبي وصل فين؟» — الزائر يكتب رقمه ويشوف حالة طلبه:
 * الاسم مختصر للخصوصية، ومفيش أي بيانات تواصل أو تفاصيل تانية.
 */
export default function OrderLookup({ officePhone }: { officePhone: string }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<OrderLookupResult[]>([]);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const clean = normalizeLookupPhone(phone);
    if (!clean) { setError("اكتب رقم موبايل مصري صحيح (١١ رقمًا يبدأ بـ 010 أو 011 أو 012 أو 015)."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/track/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });
      const data = (await response.json()) as { ok?: boolean; results?: OrderLookupResult[]; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "تعذر البحث دلوقتي — جرّب تاني.");
      setResults(data.results ?? []);
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر البحث دلوقتي.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="order-lookup" aria-labelledby="order-lookup-title">
      <header className="order-lookup-head">
        <span className="order-lookup-icon" aria-hidden="true"><Search size={20}/></span>
        <div>
          <h2 id="order-lookup-title">طلبي وصل فين؟</h2>
          <p>اكتب رقم الموبايل اللي بعتّ بيه الطلب، وهنقولك حالته على طول — من غير مكالمة.</p>
        </div>
      </header>

      <form className="order-lookup-form" onSubmit={(event) => void lookup(event)}>
        <label htmlFor="order-lookup-phone">رقم الموبايل</label>
        <div className="order-lookup-row">
          <input
            id="order-lookup-phone"
            className="studio-textbox"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? <LoaderCircle size={16} className="spin"/> : <Search size={16}/>} اعرف حالة الطلب
          </button>
        </div>
      </form>

      {error && <p className="order-lookup-error" role="alert">{error}</p>}

      {done && results.length === 0 && (
        <div className="order-lookup-empty">
          <strong>مفيش طلب بالرقم ده</strong>
          <p>لو لسه بعتّ طلبك، انتظر شوية أو اتصل بالمكتب على <a href={`tel:${officePhone}`} dir="ltr">{officePhone}</a> للتأكد من وصوله.</p>
        </div>
      )}

      {results.length > 0 && (
        <ul className="order-lookup-list">
          {results.map((row) => (
            <li key={row.id} className={`order-lookup-card is-${row.status}`}>
              <div className="order-lookup-card-head">
                <span className="order-lookup-status">{STATUS_ICON[row.status]}{row.statusLabel}</span>
                <strong className="order-lookup-name">{row.name}</strong>
              </div>
              <p className="order-lookup-hint">{row.hint}</p>
              <div className="order-lookup-meta">
                <span>اتقدّم: {lookupTimeLabel(row.submittedAt)}</span>
                <span>آخر تحديث: {lookupTimeLabel(row.updatedAt)}</span>
                {row.hasNote && <span className="order-lookup-note">فيه ملاحظة من الإدارة — اتصل بالمكتب</span>}
              </div>
              <div className="order-lookup-actions">
                {row.publicHref && <a className="button button-soft button-small" href={row.publicHref}>شوف صفحتك في الدليل</a>}
                {row.canComplete && <span className="order-lookup-complete">افتح رابط الاستكمال اللي وصلك وكمّل البيانات</span>}
                <a className="button button-ghost button-small" href={`tel:${officePhone}`}><PhoneCall size={14}/> اتصل بالمكتب</a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="order-lookup-privacy">
        الخصوصية: بنعرض الاسم مختصرًا وحالة الطلب بس، ومفيش أي بيانات تانية بتظهر. البحث محدود بعدد محاولات في الساعة.
      </p>
    </section>
  );
}

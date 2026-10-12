"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Lightbulb, LoaderCircle, MessageCircle, XCircle } from "lucide-react";
import { AVAILABILITY_HOURS, OFFICE_WHATSAPP } from "@/lib/catalog";

// Self-service renewal: the provider taps once and the window extends by AVAILABILITY_HOURS.
export default function AvailabilityRenew({ token, name, until, active }: { token: string; name: string; until: string | null; active: boolean }) {
  const [deadline, setDeadline] = useState(active ? until : null);
  const [now, setNow] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(""), [renewed, setRenewed] = useState(false);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 20000);
    return () => clearInterval(timer);
  }, []);
  const remaining = deadline && now ? Date.parse(deadline) - now : 0;
  const live = Boolean(deadline && remaining > 0);
  const remainingLabel = live ? `${Math.floor(remaining / 3600000)} ساعة و${Math.max(1, Math.round((remaining % 3600000) / 60000))} دقيقة` : "";
  async function renew() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/availability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok || !result.until) throw new Error(result.error ?? "تعذر التجديد. حاول مرة أخرى.");
      setDeadline(result.until); setRenewed(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر الاتصال. حاول مرة أخرى."); } finally { setBusy(false); }
  }
  return <div className="availability-card">
    <div className={`availability-status ${live ? "is-live" : ""}`}>
      {live ? <CheckCircle2 size={26}/> : <XCircle size={26}/>}
      <div><strong>{live ? `${name} متاح الآن` : `${name} غير متاح الآن`}</strong><span>{live ? `الإتاحة تنجلي بعد ${remainingLabel} تقريبًا` : "اضغط الزر لتأكيد إتاحتك على الدليل فورًا"}</span></div>
    </div>
    <button type="button" className="availability-renew" onClick={() => void renew()} disabled={busy}>
      {busy ? <LoaderCircle size={22} className="spin"/> : <Lightbulb size={22}/>}
      {live ? `تمديد الإتاحة ${AVAILABILITY_HOURS} ساعات إضافية` : `جدّد الإتاحة ${AVAILABILITY_HOURS} ساعات`}
    </button>
    {renewed && !error && <p className="availability-result is-ok"><CheckCircle2 size={16}/> تم التجديد.. كارتك ظاهر «متاح الآن» على الدليل من هذه اللحظة.</p>}
    {error && <p className="availability-result is-error" role="alert"><XCircle size={16}/> {error}</p>}
    <p className="availability-hint"><Clock3 size={15}/> كل ضغطة تجديد تسري للزوار فورًا، وتنجلي تلقائيًا بعد المدة.</p>
    <a className="availability-contact" href={OFFICE_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>في مشكلة؟ تواصل مع الإدارة</a>
  </div>;
}

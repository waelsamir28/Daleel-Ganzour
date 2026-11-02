"use client";

import { useState } from "react";
import { CalendarClock, LoaderCircle, Check } from "lucide-react";

/**
 * زر «بدء شهر جديد» — يظهر للأدمن فقط على صفحة الشهادة.
 * يحفظ أرقام التفاعل الحالية كبداية للشهر، فتُحسب شهادات التكريم القادمة على تفاعل الشهر نفسه.
 */
export default function HonorsAdminReset({ month }: { month: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function reset() {
    if (!window.confirm("هتحفظ أرقام التفاعل الحالية كبداية للشهر الجديد، والشهادات القادمة تقيس تفاعل الشهر نفسه. نكمل؟")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "honor-baselines" }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "تعذر بدء الشهر الجديد.");
      setDone(true);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر بدء الشهر الجديد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="honors-admin-reset">
      <button type="button" className="honors-btn is-admin" onClick={() => void reset()} disabled={busy || done}>
        {busy ? <LoaderCircle size={15} className="spin"/> : done ? <Check size={15}/> : <CalendarClock size={15}/>}
        {done ? "تم بدء الشهر" : `بدء شهر جديد (${month})`}
      </button>
      <small>للأدمن: يصفر عدّاد التكريم لتفاعل الشهر الجديد من غير ما يمسح الأرقام الحقيقية.</small>
      {error && <small className="honors-admin-error" role="alert">{error}</small>}
    </div>
  );
}

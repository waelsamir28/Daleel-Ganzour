"use client";

import { useState } from "react";
import { WEEK_DAYS, type WorkingHours } from "@/lib/catalog";

export default function WorkingHoursEditor({ initial }: { initial: WorkingHours }) {
  const [enabled, setEnabled] = useState(initial.length === 7);
  const [days, setDays] = useState<WorkingHours>(initial.length === 7 ? initial : WEEK_DAYS.map(() => ({ closed: false, opens: "09:00", closes: "17:00" })));
  return <fieldset className="working-hours-editor"><legend>مواعيد العمل الأسبوعية</legend>
    <label className="checkbox-field"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)}/>تحديد جدول أسبوعي</label>
    <input type="hidden" name="workingHours" value={JSON.stringify(enabled ? days : [])}/>
    {enabled && <><p className="input-help">المواعيد بتوقيت جنزور. الإغلاق قبل الفتح يعني أن العمل يمتد لليوم التالي.</p>{days.map((day, index) => <div className="working-day-row" key={index}>
      <strong>{WEEK_DAYS[index]}</strong>
      <label className="checkbox-field"><input type="checkbox" checked={day.closed} onChange={(event) => setDays(days.map((item, i) => i === index ? { ...item, closed: event.target.checked } : item))}/>إجازة</label>
      {!day.closed && <><label>الفتح<input type="time" aria-label={`فتح ${WEEK_DAYS[index]}`} value={day.opens} required onChange={(event) => setDays(days.map((item, i) => i === index ? { ...item, opens: event.target.value } : item))}/></label><label>الإغلاق<input type="time" aria-label={`إغلاق ${WEEK_DAYS[index]}`} value={day.closes} required onChange={(event) => setDays(days.map((item, i) => i === index ? { ...item, closes: event.target.value } : item))}/></label></>}
    </div>)}</>}
  </fieldset>;
}

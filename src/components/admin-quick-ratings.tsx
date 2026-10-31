"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Star } from "lucide-react";

type Row = { serviceId: string; name: string; count: number; average: number; lastAt: string | null };

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" });

/**
 * «رضا الزوار» في الإحصاءات: متوسط النجوم من التقييم السريع بعد الاتصال/الواتساب
 * (مجهول تمامًا)، مع أكثر المهن اللي الناس قيّمتها.
 */
export default function AdminQuickRatings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/ratings/quick", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { services?: Row[]; total?: number; average?: number };
      setRows(data.services ?? []);
      setTotal(data.total ?? 0);
      setAverage(data.average ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب يبدأ بعد أول رسم فقط.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><Star size={18}/> رضا الزوار ({total})</h3>
          <p>تقييم سريع بالنجوم بيظهر للزائر بعد ما يتصل أو يبعت واتساب لمقدم الخدمة — مجهول تمامًا (بدون اسم أو رقم).</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل التقييمات — جرّب التحديث تاني.</p>}
      {state !== "error" && total === 0 && (
        <p className="analytics-empty-hint">{state === "loading" ? "بنحمّل التقييمات…" : "مفيش تقييمات سريعة لحد الآن — بتظهر تلقائيًا بعد اتصالات الزوار."}</p>
      )}
      {total > 0 && (
        <>
          <p className="analytics-quick-average">
            <Star size={16} fill="currentColor"/> متوسط الرضا <b>{average.toFixed(1)}</b> من ٥ — من {total} تقييمًا
          </p>
          <div className="analytics-code-reports">
            {rows.map((row) => (
              <article key={row.serviceId} className="analytics-code-report-row">
                <span className="analytics-code-report-flag"><Star size={14}/></span>
                <div>
                  <strong>{row.name || "مهنة محذوفة"}</strong>
                  <small>{row.lastAt ? `آخر تقييم ${ARABIC_DATE.format(new Date(row.lastAt))}` : ""}</small>
                </div>
                <b dir="ltr">{row.average.toFixed(1)} ★</b>
                <em>{row.count}</em>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, Phone, RefreshCw, Users } from "lucide-react";

type QuoteRow = { id: string; categoryName: string | null; name: string; phone: string; details: string; area: string; targets: number; createdAt: string };

const DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" });

/**
 * «طلبات عروض الأسعار» في الإحصاءات: كل طلب كتبه زائر واتبعت لـ٣ مهنيين،
 * بتفاصيله ورقمه — لمتابعة اللي بيتحوّل لشغل فعلي.
 */
export default function AdminQuotes() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/quotes", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { total?: number; requests?: QuoteRow[] };
      setRows(data.requests ?? []);
      setTotal(data.total ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب بعد أول رسم فقط.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><Calculator size={18}/> طلبات عروض الأسعار ({total})</h3>
          <p>الزائر بيكتب طلبه مرة واحدة، والرسالة بتوصل لـ٣ مهنيين في نفس التخصص — هنا بتتابع كل طلب ورقمه.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل الطلبات — جرّب التحديث تاني.</p>}
      {state === "ready" && rows.length === 0 && <p className="analytics-empty-hint">مفيش طلبات عروض أسعار لحد الآن.</p>}
      {rows.length > 0 && (
        <div className="quote-admin-list">
          {rows.map((row) => (
            <article key={row.id} className="quote-admin-row">
              <div className="quote-admin-main">
                <strong>{row.name}</strong>
                <small>{row.categoryName ?? "تخصص محذوف"}{row.area ? ` • ${row.area}` : ""}</small>
                <p>{row.details}</p>
              </div>
              <div className="quote-admin-side">
                <a href={`tel:${row.phone}`} dir="ltr"><Phone size={13}/> {row.phone}</a>
                <span><Users size={13}/> {row.targets} مهنيين</span>
                <em>{DATE.format(new Date(row.createdAt))}</em>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

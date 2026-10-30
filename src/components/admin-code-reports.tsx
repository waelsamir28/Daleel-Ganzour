"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, RefreshCw, Siren } from "lucide-react";

type Report = { scope: string; code: string; label: string; count: number; lastAt: string | null };

const SCOPE_LABELS: Record<string, string> = {
  vodafone: "فودافون",
  orange: "أورنج",
  etisalat: "اتصالات",
  we: "وي",
  landline: "الخط الأرضي",
  banks: "البنوك وتطبيقات الدفع",
  gov: "الأرقام الحكومية والطوارئ",
};

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });

/**
 * إحصاءات زر «الكود ده اتغيّر؟» في صفحة الأكواد: أكتر الأكواد اللي بلّغ عنها الزوار،
 * لمراجعة البيانات وتحديثها. البلاغات مجهولة تمامًا (بدون اسم أو رقم).
 */
export default function AdminCodeReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/telecom/reports", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { reports?: Report[]; total?: number };
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // جلب أول مرة بعد الرسم فقط (الحالة تتغيّر داخل دالة غير متزامنة).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  function refresh() {
    setState("loading");
    void load();
  }

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><Siren size={18}/> بلاغات الأكواد اللي اتغيّرت ({total})</h3>
          <p>بلاغات مجهولة من صفحة الأكواد — راجع الكود وحدّثه في <b>src/lib/telecom.ts</b> أو <b>landline.ts</b> أو <b>gov-numbers.ts</b> أو <b>payments.ts</b>.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={refresh} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>
      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل البلاغات — جرّب التحديث تاني.</p>}
      {state !== "error" && reports.length === 0 && (
        <p className="analytics-empty-hint">{state === "loading" ? "بنحمّل البلاغات…" : "مفيش بلاغات لحد الآن — أي زائر يدوس «الكود ده اتغيّر؟» هيظهر هنا."}</p>
      )}
      {reports.length > 0 && (
        <div className="analytics-code-reports">
          {reports.map((report) => (
            <article key={`${report.scope}-${report.code}-${report.label}`} className="analytics-code-report-row">
              <span className="analytics-code-report-flag"><Flag size={14}/></span>
              <div>
                <strong>{report.label || "كود بدون وصف"}</strong>
                <small>{SCOPE_LABELS[report.scope] ?? report.scope}{report.lastAt ? ` • آخر بلاغ ${ARABIC_DATE.format(new Date(report.lastAt))}` : ""}</small>
              </div>
              <b dir="ltr">{report.code}</b>
              <em>{report.count}</em>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

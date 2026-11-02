"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Info, MessageCircle, PhoneCall, RefreshCw, TrendingUp } from "lucide-react";

type Provider = { serviceId: string; name: string; area: string; categoryName: string; views: number; contacts: number };
type Section = { categoryId: string; name: string; views: number; contacts: number };

const AR = new Intl.NumberFormat("ar-EG");
const fmt = (value: number) => AR.format(Number.isFinite(value) ? value : 0);

/**
 * «أرقام الاستخدام الحقيقية»: مشاهدات البطاقات ونقرات الاتصال/الواتساب محسوبة على الخادم
 * لكل مهني وقسم. الأرقام مكتوبة بالعربي وبشرح بسيط تحت كل رقم حتى تكون مفهومة للمسؤول.
 */
export default function AdminUsageInsights() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [totals, setTotals] = useState({ views: 0, contacts: 0 });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/insights", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { views?: number; contacts?: number; providers?: Provider[]; sections?: Section[] };
      setProviders(data.providers ?? []);
      setSections(data.sections ?? []);
      setTotals({ views: data.views ?? 0, contacts: data.contacts ?? 0 });
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب بعد أول رسم فقط.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  const conversion = totals.views ? Math.round((totals.contacts / totals.views) * 100) : 0;

  return (
    <section className="analytics-panel-card">
      <div className="usage-explain" role="note">
        <Info size={16}/>
        <p>
          كل مرة زائر يفتح بطاقة مهني = <b>مشاهدة</b>. كل مرة يضغط «اتصال» أو «واتساب» = <b>تواصل</b>.
          الأرقام مجمّعة على الخادم بدون أي اسم أو رقم للزائر، ومفيش أرقام من متصفحك أنت.
        </p>
      </div>

      <div className="analytics-panel-head">
        <div>
          <h3><TrendingUp size={18}/> أرقام الاستخدام</h3>
          <p>آخر قراءة من الخادم — اضغط تحديث لجلب أحدث رقم.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل الأرقام — جرّب التحديث تاني.</p>}
      {state === "ready" && (
        <>
          <div className="usage-stats">
            <div className="usage-stat is-views">
              <Eye size={18}/>
              <b>{fmt(totals.views)}</b>
              <span>مشاهدة بطاقة</span>
              <small>زائر فتح تفاصيل مهني</small>
            </div>
            <div className="usage-stat is-contacts">
              <PhoneCall size={18}/>
              <b>{fmt(totals.contacts)}</b>
              <span>ضغطة تواصل</span>
              <small>اتصال أو واتساب من البطاقة</small>
            </div>
            <div className="usage-stat is-rate">
              <MessageCircle size={18}/>
              <b>{fmt(conversion)}%</b>
              <span>نسبة التفاعل</span>
              <small>من كل مشاهدة بقى تواصل</small>
            </div>
          </div>

          {providers.length === 0 && sections.length === 0 && <p className="analytics-empty-hint">لسه مفيش استخدام مسجّل — الأرقام تظهر تلقائيًا مع أول زيارات حقيقية.</p>}

          {providers.length > 0 && (
            <div className="insights-list">
              <h4>الأكثر تواصلًا من الزوار</h4>
              <div className="insights-table-head"><span>#</span><span>المهني</span><span>تواصل</span><span>مشاهدة</span></div>
              {providers.map((row, index) => (
                <article key={row.serviceId} className="insights-row">
                  <span className="insights-rank">{fmt(index + 1)}</span>
                  <div><strong>{row.name}</strong><small>{[row.categoryName, row.area].filter(Boolean).join(" • ")}</small></div>
                  <b className="insights-num is-contact">{fmt(row.contacts)}</b>
                  <em className="insights-num is-view">{fmt(row.views)}</em>
                </article>
              ))}
            </div>
          )}
          {sections.length > 0 && (
            <div className="insights-list">
              <h4>الأقسام الأكثر استخدامًا</h4>
              <div className="insights-table-head"><span>#</span><span>القسم</span><span>تواصل</span><span>مشاهدة</span></div>
              {sections.map((row, index) => (
                <article key={row.categoryId} className="insights-row">
                  <span className="insights-rank">{fmt(index + 1)}</span>
                  <div><strong>{row.name}</strong></div>
                  <b className="insights-num is-contact">{fmt(row.contacts)}</b>
                  <em className="insights-num is-view">{fmt(row.views)}</em>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

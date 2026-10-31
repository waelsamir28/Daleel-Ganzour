"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, MessageCircle, PhoneCall, RefreshCw, TrendingUp } from "lucide-react";

type Provider = { serviceId: string; name: string; area: string; categoryName: string; views: number; contacts: number };
type Section = { categoryId: string; name: string; views: number; contacts: number };

/**
 * «أرقام الاستخدام الحقيقية»: مشاهدات البطاقات ونقرات الاتصال/الواتساب محسوبة على الخادم
 * لكل مهني وقسم — تساعد الإدارة تعرف مين محتاج متابعة ومين عليه طلب فعلي.
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
      <div className="analytics-panel-head">
        <div>
          <h3><TrendingUp size={18}/> أرقام الاستخدام الحقيقية</h3>
          <p>محسوبة على الخادم لكل مهني وقسم (بدون بيانات شخصية): فتح البطاقة = مشاهدة، وضغط الاتصال أو الواتساب = تواصل.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل الأرقام — جرّب التحديث تاني.</p>}
      {state === "ready" && (
        <>
          <div className="insights-totals">
            <div><Eye size={16}/><b>{totals.views}</b><small>مشاهدة بطاقة</small></div>
            <div><PhoneCall size={16}/><b>{totals.contacts}</b><small>ضغطة تواصل</small></div>
            <div><MessageCircle size={16}/><b>{conversion}%</b><small>نسبة التفاعل</small></div>
          </div>
          {providers.length === 0 && sections.length === 0 && <p className="analytics-empty-hint">لسه مفيش استخدام مسجّل — الأرقام بتظهر تلقائيًا مع أول زيارات حقيقية.</p>}
          {providers.length > 0 && (
            <div className="insights-list">
              <h4>الأكثر تواصلًا</h4>
              {providers.map((row, index) => (
                <article key={row.serviceId} className="insights-row">
                  <span className="insights-rank">{index + 1}</span>
                  <div><strong>{row.name}</strong><small>{[row.categoryName, row.area].filter(Boolean).join(" • ")}</small></div>
                  <b dir="ltr">{row.contacts} ☎</b>
                  <em dir="ltr">{row.views} 👁</em>
                </article>
              ))}
            </div>
          )}
          {sections.length > 0 && (
            <div className="insights-list">
              <h4>الأقسام النشطة</h4>
              {sections.map((row) => (
                <article key={row.categoryId} className="insights-row">
                  <span className="insights-rank">•</span>
                  <div><strong>{row.name}</strong></div>
                  <b dir="ltr">{row.contacts} ☎</b>
                  <em dir="ltr">{row.views} 👁</em>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

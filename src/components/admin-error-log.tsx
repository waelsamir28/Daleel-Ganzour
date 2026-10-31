"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";

type Entry = {
  fingerprint: string;
  kind: string;
  message: string;
  path: string;
  userAgent: string;
  count: number;
  lastAt: string | null;
  firstAt: string | null;
};

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });

/** اسم متصفح مختصر من الـ user agent (بدون أي بيانات شخصية). */
function shortBrowser(userAgent: string) {
  const ua = userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return /Mobile|Android/.test(ua) ? "Chrome موبايل" : "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return /iPhone|iPad/.test(ua) ? "Safari آيفون" : "Safari";
  return "متصفح غير معروف";
}

/**
 * قسم «أخطاء الموقع» في إحصاءات الإدارة: كل خطأ وصل من المتصفح أو من صفحة خطأ،
 * مجمّعًا بعدد التكرار وآخر ظهور — لمراجعة أعطال المستخدمين الحقيقيين.
 */
export default function AdminErrorLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/errors", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { errors?: Entry[]; total?: number };
      setEntries(data.errors ?? []);
      setTotal(data.total ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب يبدأ بعد أول رسم فقط (الحالة تتغيّر داخل دالة غير متزامنة).
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
          <h3><CircleAlert size={18}/> أخطاء الموقع ({total})</h3>
          <p>أخطاء وصلت من متصفحات الزوار والمهنيين — مجمّعة بنفس الرسالة. راجع الصفحة المتأثرة وأصلح السبب، وأي خطأ جديد يوصلك واتساب.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={refresh} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>
      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل سجل الأخطاء — جرّب التحديث تاني.</p>}
      {state !== "error" && entries.length === 0 && (
        <p className="analytics-empty-hint">
          {state === "loading" ? "بنحمّل سجل الأخطاء…" : "مفيش أخطاء مسجّلة — كل حاجة شغالة تمام."}
        </p>
      )}
      {entries.length > 0 && (
        <div className="analytics-code-reports">
          {entries.map((entry) => (
            <article key={`${entry.fingerprint}-${entry.path}`} className="analytics-code-report-row">
              <span className="analytics-code-report-flag"><CircleAlert size={14}/></span>
              <div>
                <strong>{entry.message || "خطأ بدون رسالة"}</strong>
                <small>
                  {entry.path || "/"} • {shortBrowser(entry.userAgent)}
                  {entry.kind === "server" ? " • صفحة خطأ" : ""}
                  {entry.lastAt ? ` • آخر ظهور ${ARABIC_DATE.format(new Date(entry.lastAt))}` : ""}
                </small>
              </div>
              <b dir="ltr">{entry.fingerprint}</b>
              <em>{entry.count}</em>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

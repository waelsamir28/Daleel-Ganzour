"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, ChevronLeft, CircleAlert, Clock3, LoaderCircle, RotateCcw, Search, RefreshCw, ShieldCheck, Smartphone, Undo2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { ageLabel, classifyError, errorStatus, type ErrorStatus } from "@/lib/error-triage";

type Entry = {
  fingerprint: string;
  kind: string;
  message: string;
  path: string;
  userAgent: string;
  count: number;
  lastAt: string | null;
  firstAt: string | null;
  resolvedAt: string | null;
  note: string | null;
  resolvedBy: string | null;
};

type Occurrence = { id: string; message: string; detail: string; path: string; userAgent: string; kind: string; createdAt: string };

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });
type Filter = "open" | "resolved" | "all";

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

const STATUS_LABEL: Record<ErrorStatus, string> = { open: "مفتوح", resolved: "تم إصلاحه", regressed: "عاد بعد الإصلاح" };

/**
 * «أخطاء الموقع» بعد الفلترة: كل خطأ بيتصنّف (نسخة قديمة / WebView / سكربت خارجي / شبكة / كود)،
 * وله زر «تم الإصلاح» يقفله من السجل مع ملاحظة، وزر «إعادة فتح» لو رجع.
 * زر «تفاصيل» يفتح آخر ظهورات الخطأ بالـ stack والجهاز والصفحة.
 */
export default function AdminErrorLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [detailFor, setDetailFor] = useState<Entry | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [detailBusy, setDetailBusy] = useState(false);

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

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return entries
      .map((entry) => ({ entry, status: errorStatus(entry), ...classifyError(entry.message) }))
      .filter((row) => filter === "all" || (filter === "open" ? row.status !== "resolved" : row.status === "resolved"))
      .filter((row) => !search || `${row.entry.message} ${row.entry.path} ${row.label} ${shortBrowser(row.entry.userAgent)}`.toLowerCase().includes(search));
  }, [entries, filter, query]);

  const counts = useMemo(() => {
    let open = 0, resolved = 0, regressed = 0;
    for (const entry of entries) {
      const status = errorStatus(entry);
      if (status === "resolved") resolved += 1;
      else if (status === "regressed") regressed += 1;
      else open += 1;
    }
    return { open, resolved, regressed };
  }, [entries]);

  async function mark(entry: Entry, action: "resolve" | "reopen") {
    setBusy(entry.fingerprint); setNote("");
    try {
      const response = await fetch("/api/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: entry.fingerprint, action, note: action === "resolve" ? note : "" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "تعذّر تنفيذ الإجراء.");
      setNote(data.message ?? "تم.");
      await load();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "تعذّر تنفيذ الإجراء.");
    } finally { setBusy(""); }
  }

  async function openDetail(entry: Entry) {
    setDetailFor(entry); setOccurrences([]); setDetailBusy(true);
    try {
      const response = await fetch(`/api/errors?fingerprint=${encodeURIComponent(entry.fingerprint)}`, { cache: "no-store" });
      const data = (await response.json()) as { occurrences?: Occurrence[] };
      setOccurrences(data.occurrences ?? []);
    } catch { setOccurrences([]); }
    finally { setDetailBusy(false); }
  }

  return (
    <section className="analytics-panel-card error-log-panel">
      <div className="error-log-toolbar">
        <div className="error-log-search">
          <Search size={16}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في رسالة الخطأ أو الصفحة…" aria-label="بحث في الأخطاء"/>
        </div>
        <div className="error-log-filters" role="group" aria-label="تصفية الأخطاء">
          {([["open", `مفتوحة (${counts.open + counts.regressed})`], ["resolved", `تم إصلاحها (${counts.resolved})`], ["all", `الكل (${entries.length})`]] as Array<[Filter, string]>).map(([id, label]) => (
            <button key={id} type="button" className={`error-log-filter ${filter === id ? "is-active" : ""}`} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>
          ))}
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {counts.regressed > 0 && (
        <p className="error-log-regressed" role="status">
          <RotateCcw size={15}/> {counts.regressed} خطأ رجع تاني بعد ما اتقفل — راجعه من جديد.
        </p>
      )}
      {note && <p className="admin-push-note" role="status">{note}</p>}
      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل سجل الأخطاء — جرّب التحديث تاني.</p>}
      {state !== "error" && rows.length === 0 && (
        <p className="analytics-empty-hint">
          {state === "loading" ? "بنحمّل سجل الأخطاء…" : filter === "open" ? "مفيش أخطاء مفتوحة — كل حاجة شغالة تمام." : filter === "resolved" ? "لسه مفيش أخطاء اتقفلت." : "مفيش أخطاء مسجّلة."}
        </p>
      )}

      {rows.length > 0 && (
        <div className="error-log-list">
          {rows.map(({ entry, status, label, hint }) => (
            <article key={`${entry.fingerprint}-${entry.path}`} className={`error-log-row is-${status}`}>
              <span className="error-log-flag" title={label}><CircleAlert size={15}/></span>
              <div className="error-log-main">
                <strong>{entry.message || "خطأ بدون رسالة"}</strong>
                <div className="error-log-meta">
                  <span className={`error-log-kind is-${status}`}>{STATUS_LABEL[status]}</span>
                  <span className="error-log-tag">{label}</span>
                  <span className="error-log-meta-item">{entry.path || "/"}</span>
                  <span className="error-log-meta-item">{shortBrowser(entry.userAgent)}</span>
                  <span className="error-log-meta-item"><Clock3 size={12}/> {ageLabel(entry.lastAt)}</span>
                  <span className="error-log-count">{entry.count} مرة</span>
                </div>
                <small className="error-log-hint">{hint}</small>
                {status === "resolved" && entry.resolvedAt && (
                  <small className="error-log-resolved">✓ اتقفل {ARABIC_DATE.format(new Date(entry.resolvedAt))}{entry.resolvedBy ? ` بواسطة ${entry.resolvedBy}` : ""}{entry.note ? ` — ${entry.note}` : ""}</small>
                )}
              </div>
              <div className="error-log-actions">
                <button type="button" className="button button-soft button-small" onClick={() => void openDetail(entry)}>
                  تفاصيل <ChevronLeft size={13}/>
                </button>
                {status === "resolved" ? (
                  <button type="button" className="button button-soft button-small" disabled={busy === entry.fingerprint} onClick={() => void mark(entry, "reopen")}>
                    {busy === entry.fingerprint ? <LoaderCircle size={14} className="code-report-spin"/> : <Undo2 size={14}/>} إعادة فتح
                  </button>
                ) : (
                  <button type="button" className="button button-success button-small" disabled={busy === entry.fingerprint} onClick={() => void mark(entry, "resolve")} title="يقفل الخطأ من قائمة المفتوح. لو رجع تاني هيظهر لوحده">
                    {busy === entry.fingerprint ? <LoaderCircle size={14} className="code-report-spin"/> : <CheckCheck size={14}/>} تم الإصلاح
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="error-log-total">إجمالي البلاغات المسجّلة: {total} · الأجهزة مجهولة تمامًا وبدون أي بيانات شخصية.</p>

      {detailFor && (
        <Modal floating wide className="error-detail-modal" title="تفاصيل الخطأ" subtitle={`${detailFor.message.slice(0, 120)} — ${classifyError(detailFor.message).label}`} onClose={() => setDetailFor(null)} autoFocus={false}>
          <div className="error-detail">
            <div className="error-detail-facts">
              <span><b>البصمة</b> <em dir="ltr">{detailFor.fingerprint}</em></span>
              <span><b>الصفحة</b> {detailFor.path || "/"}</span>
              <span><b>المتصفح</b> {shortBrowser(detailFor.userAgent)}</span>
              <span><b>أول ظهور</b> {detailFor.firstAt ? ARABIC_DATE.format(new Date(detailFor.firstAt)) : "—"}</span>
              <span><b>آخر ظهور</b> {detailFor.lastAt ? ARABIC_DATE.format(new Date(detailFor.lastAt)) : "—"}</span>
              <span><b>التكرار</b> {detailFor.count} مرة</span>
            </div>
            <p className="error-detail-hint"><ShieldCheck size={15}/> {classifyError(detailFor.message).hint}</p>
            {detailBusy && <p className="analytics-empty-hint"><LoaderCircle size={15} className="code-report-spin"/> بنجيب آخر الظهورات…</p>}
            {!detailBusy && occurrences.length === 0 && <p className="analytics-empty-hint">مفيش ظهورات تفصيلية محفوظة.</p>}
            {occurrences.length > 0 && (
              <ol className="error-detail-list">
                {occurrences.map((item) => (
                  <li key={item.id}>
                    <div className="error-detail-head">
                      <span>{ARABIC_DATE.format(new Date(item.createdAt))}</span>
                      <span className="error-detail-ua"><Smartphone size={12}/> {shortBrowser(item.userAgent)}</span>
                      <span dir="ltr">{item.path || "/"}</span>
                    </div>
                    <p className="error-detail-message">{item.message}</p>
                    {item.detail && <pre className="error-detail-stack" dir="ltr">{item.detail}</pre>}
                  </li>
                ))}
              </ol>
            )}
            <label className="error-detail-note">
              ملاحظة الإصلاح (تظهر على الخطأ بعد القفل)
              <input value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} placeholder="مثال: اتصلح في نشر ٢ نوفمبر — كان ملف نسخة قديمة"/>
            </label>
            <div className="error-detail-actions">
              <button type="button" className="button button-success" disabled={busy === detailFor.fingerprint} onClick={() => void mark(detailFor, "resolve")}>
                {busy === detailFor.fingerprint ? <LoaderCircle size={15} className="code-report-spin"/> : <CheckCheck size={15}/>} تم الإصلاح
              </button>
              <button type="button" className="button button-soft" onClick={() => setDetailFor(null)}>إغلاق</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

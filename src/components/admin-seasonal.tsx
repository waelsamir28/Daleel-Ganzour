"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, LoaderCircle, RefreshCw, Send, Users } from "lucide-react";

type Reminder = { id: string; label: string; title: string; body: string; url: string; emoji: string; lead: string };
type Upcoming = { id: string; label: string; emoji: string; months: number[] };

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/**
 * «التذكيرات الموسمية» في لوحة الإدارة:
 * النصوص مكتوبة وجاهزة لكل موسم، والإدارة تبعت التذكير المناسب لكل المشتركين بضغطة.
 * الإرسال = إشعار متصفح (Web Push) لكل الأجهزة اللي فعّلت «إشعارات الموقع» — مش رسالة واتساب.
 */
export default function AdminSeasonal() {
  const [due, setDue] = useState<Reminder[]>([]);
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [sending, setSending] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/seasonal", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { due?: Reminder[]; upcoming?: Upcoming[]; subscribers?: number };
      setDue(data.due ?? []);
      setUpcoming(data.upcoming ?? []);
      setSubscribers(data.subscribers ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب بعد أول رسم فقط.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  async function send(reminder: Reminder) {
    setSending(reminder.id); setNote("");
    try {
      const response = await fetch("/api/seasonal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: reminder.id }) });
      const data = (await response.json()) as { ok?: boolean; error?: string; sent?: number; failed?: number };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "تعذّر الإرسال.");
      setNote(`تم إرسال «${reminder.label}» كإشعار متصفح لـ${data.sent ?? 0} جهاز${data.failed ? ` • فشل ${data.failed}` : ""}.`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "تعذّر إرسال التذكير.");
    } finally {
      setSending("");
    }
  }

  return (
    <section className="analytics-panel-card seasonal-panel">
      <div className="seasonal-where">
        <span className="seasonal-where-icon"><Send size={18}/></span>
        <div>
          <strong>الرسالة دي بتروح فين بالظبط؟</strong>
          <p>
            زر «إرسال» بيبعت <b>إشعار متصفح (Web Push)</b> لكل زائر فعّل «إشعارات الموقع» من فوتر الصفحات.
            الإشعار بيظهر على شاشة الموبايل/الكمبيوتر زي إشعار أي تطبيق، والضغط عليه بيفتح رابط الموسم في الدليل.
            <b> مش رسالة واتساب</b>، ومش بيتحفظ عندنا كمحتوى في الموقع.
          </p>
          <span className="seasonal-where-meta"><Users size={14}/> الأجهزة المشتركة الآن: <b>{subscribers}</b>{subscribers === 0 ? " — لسه محدش فعّل الإشعارات على أجهزته." : ""}</span>
        </div>
      </div>

      <div className="seasonal-head-actions">
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل التذكيرات — جرّب التحديث تاني.</p>}
      {state === "ready" && (
        <>
          {due.length === 0 && <p className="analytics-empty-hint">مفيش موسم مستحق الشهر ده — المواسم القادمة تحت.</p>}
          {due.length > 0 && (
            <div className="seasonal-grid">
              {due.map((reminder) => (
                <article key={reminder.id} className="seasonal-card">
                  <span className="seasonal-emoji" aria-hidden="true">{reminder.emoji}</span>
                  <div className="seasonal-copy">
                    <strong>{reminder.label}</strong>
                    <span>{reminder.title}</span>
                    <small>{reminder.body}</small>
                  </div>
                  <button type="button" className="button button-primary button-small seasonal-send" disabled={Boolean(sending)} onClick={() => void send(reminder)}>
                    {sending === reminder.id ? <LoaderCircle size={14} className="code-report-spin"/> : <Send size={14}/>} إرسال
                  </button>
                </article>
              ))}
            </div>
          )}
          {note && <p className="admin-push-note" role="status">{note}</p>}
          {upcoming.length > 0 && (
            <div className="seasonal-upcoming">
              <h4><CalendarClock size={15}/> مواسم قادمة في شهور تانية</h4>
              <div className="seasonal-upcoming-grid">
                {upcoming.map((item) => (
                  <article key={item.id} className="seasonal-upcoming-card" title={item.label}>
                    <span aria-hidden="true">{item.emoji}</span>
                    <strong>{item.label}</strong>
                    <em>{item.months.map((month) => MONTHS[month - 1]).join(" · ")}</em>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

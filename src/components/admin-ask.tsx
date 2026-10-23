"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, CircleHelp, ExternalLink, Flag, Lock, LockOpen, MessageSquareText, Search, Trash2, UserRound, Users } from "lucide-react";
import { groupNominations, relativeTimeAr, type NotificationRecord, type QuestionRecord, type ServiceRecord } from "@/lib/catalog";

type Mutate = (method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, success?: string) => Promise<boolean>;
type Props = { questions: QuestionRecord[]; services: ServiceRecord[]; notifications: NotificationRecord[]; mutate: Mutate; onConfirmDelete: (kind: "question" | "answer", id: string, label: string) => void };

/** Moderation view for «اسأل جنزور»: every question with its nominations, reports highlighted, delete / close controls. */
export default function AdminAsk({ questions, services, notifications, mutate, onConfirmDelete }: Props) {
  const [query, setQuery] = useState("");
  const [onlyReported, setOnlyReported] = useState(false);
  const reported = useMemo(() => new Set(notifications.filter((item) => item.type === "report").map((item) => item.entityId)), [notifications]);
  const list = questions.filter((question) => {
    const term = query.trim();
    const matches = !term || question.text.includes(term) || question.memberName.includes(term) || question.answers.some((answer) => answer.text.includes(term) || answer.memberName.includes(term));
    const flagged = reported.has(question.id) || question.answers.some((answer) => reported.has(answer.id));
    return matches && (!onlyReported || flagged);
  });
  const serviceName = (id: string | null) => services.find((service) => service.id === id)?.name ?? "مهني محذوف";

  return <div className="admin-ask">
    <section className="admin-ads-hero">
      <div className="admin-ads-hero-text">
        <span className="admin-ads-hero-icon"><CircleHelp size={22}/></span>
        <div><h2>اسأل جنزور</h2><p>الأسئلة بتتنشر فورًا والأعضاء بيرشّحوا مهنيين من الدليل. البلاغات بتظهر هنا مميزة بالأحمر، وتقدر تحذف أي سؤال أو ترشيح أو تقفل السؤال.</p></div>
      </div>
      <div className="admin-ads-hero-actions">
        <Link className="button button-soft" href="/ask" target="_blank"><ExternalLink size={16}/> الصفحة العامة</Link>
      </div>
    </section>

    <div className="admin-ask-toolbar">
      <label className="ask-pick-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الأسئلة والأسماء…"/></label>
      <label className="admin-ad-check"><input type="checkbox" checked={onlyReported} onChange={(event) => setOnlyReported(event.target.checked)}/> <Flag size={13}/> المبلّغ عنها فقط ({reported.size})</label>
      <span className="admin-ask-stats"><MessageSquareText size={13}/> {questions.length} سؤال · <Users size={13}/> {questions.reduce((sum, question) => sum + question.answers.length, 0)} ترشيح</span>
    </div>

    {!list.length && <p className="admin-ad-requests-empty">مفيش أسئلة {onlyReported ? "مبلّغ عنها" : "لسه"}.</p>}
    <div className="admin-ask-list">
      {list.map((question) => {
        const flagged = reported.has(question.id), groups = groupNominations(question);
        return (
          <article key={question.id} className={`admin-ask-card ${flagged ? "is-reported" : ""} ${question.status !== "open" ? "is-closed" : ""}`}>
            <div className="admin-ask-head">
              <span className="ask-avatar"><UserRound size={15}/></span>
              <div className="admin-ask-main">
                <strong>{question.text}</strong>
                <small>{question.memberName} · {relativeTimeAr(question.createdAt)} · {question.answers.length} ترشيح{flagged && <em className="admin-ask-flag"><Flag size={11}/> بلاغ</em>}{question.status !== "open" && <em>مقفول</em>}</small>
              </div>
              <div className="admin-ad-actions">
                <button type="button" className="button button-soft button-small" onClick={() => void mutate("PATCH", { type: "question", id: question.id, action: question.status === "open" ? "close" : "reopen" }, "تم.")}>{question.status === "open" ? <><Lock size={14}/> قفل</> : <><LockOpen size={14}/> فتح</>}</button>
                <button type="button" className="icon-button admin-delete" aria-label="حذف السؤال" onClick={() => onConfirmDelete("question", question.id, `سؤال: ${question.text.slice(0, 60)}`)}><Trash2 size={15}/></button>
              </div>
            </div>
            {groups.length > 0 && (
              <ul className="admin-ask-answers">
                {groups.map((group) => group.answers.map((answer) => (
                  <li key={answer.id} className={`${reported.has(answer.id) ? "is-reported" : ""} ${answer.id === question.bestAnswerId ? "is-best" : ""}`}>
                    <span className="admin-ask-answer-main">
                      {answer.serviceId ? <b>{serviceName(answer.serviceId)}</b> : null}
                      {answer.text && <q>{answer.text}</q>}
                      <small>{answer.memberName} · {relativeTimeAr(answer.createdAt)}{answer.id === question.bestAnswerId && <em><CheckCircle2 size={11}/> الأفضل</em>}{reported.has(answer.id) && <em className="admin-ask-flag"><Flag size={11}/> بلاغ</em>}</small>
                    </span>
                    <button type="button" className="icon-button admin-delete" aria-label="حذف الترشيح" onClick={() => onConfirmDelete("answer", answer.id, `ترشيح ${answer.memberName}${answer.serviceId ? ` لـ${serviceName(answer.serviceId)}` : ""}`)}><Trash2 size={14}/></button>
                  </li>
                )))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  </div>;
}

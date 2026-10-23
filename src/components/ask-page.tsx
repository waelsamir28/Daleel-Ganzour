"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, ChevronDown, CircleHelp, Flag, Lock, LogIn, MessageCircle, MessageSquareText, Search, Send, Sparkles, Star, Trash2, UserRound, UserRoundPlus, Users, X } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import SelectField from "@/components/select-field";
import { CategoryIcon, Logo, Modal } from "@/components/ui";
import { ANSWER_MAX, defaultDesignSettings, getCategory, groupNominations, QUESTION_MAX, QUESTION_MIN, relativeTimeAr, type PublicDirectory, type QuestionRecord, type ServiceRecord, type Viewer } from "@/lib/catalog";
import { loginUrl, registerUrl } from "@/lib/membership-gate";

type Props = { data: PublicDirectory; viewer: Viewer; initialQuestions: QuestionRecord[]; focusId?: string };
type NominateTarget = { question: QuestionRecord; service: ServiceRecord | null; text: string };

/** «اسأل جنزور»: members ask, the community nominates providers straight from the directory. */
export default function AskPage({ data, viewer, initialQuestions, focusId = "" }: Props) {
  const design = { ...defaultDesignSettings, ...(data.designSettings ?? {}) };
  const settings = data.settings;
  const isMember = viewer.role !== "guest";
  const approved = useMemo(() => data.services.filter((service) => service.status === "approved"), [data.services]);
  const roots = data.categories.filter((category) => !category.parentId && category.active);
  const [questions, setQuestions] = useState(initialQuestions);
  const [form, setForm] = useState({ text: "", category: "" });
  const [open, setOpen] = useState<string | null>(focusId || null);
  const [nominate, setNominate] = useState<NominateTarget | null>(null);
  const [tipFor, setTipFor] = useState<QuestionRecord | null>(null);
  const [pickSearch, setPickSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "mine">("all");
  const focused = useRef(false);

  useEffect(() => {
    if (!focusId || focused.current) return;
    focused.current = true;
    document.getElementById(`q-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusId]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);

  async function call(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/ask", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر تنفيذ الطلب.");
      if (Array.isArray(result.questions)) setQuestions(result.questions);
      setToast({ text: result.message ?? success, error: false });
      return true;
    } catch (error) { setToast({ text: error instanceof Error ? error.message : "تعذر الاتصال.", error: true }); return false; }
    finally { setBusy(false); }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.text.trim().length < QUESTION_MIN) { setToast({ text: `اكتب سؤالك بوضوح (${QUESTION_MIN} أحرف على الأقل).`, error: true }); return; }
    if (await call("POST", { action: "ask", ...form }, "اتنشر سؤالك.. استنى ترشيحات أهل جنزور.")) { setForm({ text: "", category: "" }); setFilter("all"); }
  }
  async function submitNomination() {
    if (!nominate) return;
    if (await call("POST", { action: "answer", questionId: nominate.question.id, serviceId: nominate.service?.id ?? null, text: nominate.text }, "شكرًا لترشيحك.")) { setNominate(null); setPickSearch(""); setOpen(nominate.question.id); }
  }
  async function submitTip() {
    if (!tipFor) return;
    const text = (document.getElementById("ask-tip-text") as HTMLTextAreaElement | null)?.value ?? "";
    if (await call("POST", { action: "answer", questionId: tipFor.id, text }, "شكرًا لنصيحتك.")) { setTipFor(null); setOpen(tipFor.id); }
  }

  const list = questions.filter((question) => filter === "all" || (filter === "open" ? question.status === "open" : question.mine));
  const pickResults = useMemo(() => {
    const term = pickSearch.trim().toLowerCase();
    const scoped = nominate?.question.category ? approved.filter((service) => service.category === nominate.question.category || getCategory(service.category, data.categories).parentId === nominate.question.category) : approved;
    const pool = term ? approved.filter((service) => [service.name, service.area, service.description, getCategory(service.category, data.categories).name].join(" ").toLowerCase().includes(term)) : scoped;
    return pool.slice(0, 30);
  }, [pickSearch, approved, nominate, data.categories]);
  const serviceOf = (id: string | null) => (id ? data.services.find((service) => service.id === id) ?? null : null);

  return <div className="ask-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>

    <main className="container ask-main">
      <section className="ask-hero">
        <span className="adv-eyebrow"><CircleHelp size={14}/> اسأل جنزور</span>
        <h1>محتار تختار مين؟ اسأل أهل القرية</h1>
        <p>اكتب سؤالك («مين أحسن دكتور أطفال؟»، «محتاج سبّاك شاطر قريب من المدرسة»)، والأعضاء يرشّحوا لك مهنيين من الدليل بضغطة واحدة — وكل ترشيح بيوصّلك لصفحة المهني مباشرة.</p>
        <div className="adv-stats">
          <span><MessageSquareText size={16}/><b>{questions.length.toLocaleString("ar-EG")}</b> سؤال</span>
          <span><UserRoundPlus size={16}/><b>{questions.reduce((sum, question) => sum + question.answers.length, 0).toLocaleString("ar-EG")}</b> ترشيح</span>
          <span><Users size={16}/><b>+{data.memberCount.toLocaleString("ar-EG")}</b> عضو</span>
        </div>
      </section>

      {isMember ? (
        <form className="ask-form" onSubmit={submitQuestion}>
          <label className="ask-form-field">
            <span><Sparkles size={13}/> سؤالك</span>
            <textarea value={form.text} maxLength={QUESTION_MAX} rows={3} placeholder="مثال: مين أحسن معمل تحاليل بيعمل سحب من البيت؟" onChange={(event) => setForm({ ...form, text: event.target.value })} required/>
            <small>{form.text.length}/{QUESTION_MAX} — بيتنشر فورًا باسمك «{viewer.name}»</small>
          </label>
          <div className="ask-form-row">
            <label className="ask-form-field">
              <span>القسم (اختياري)</span>
              <SelectField value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} options={[{ value: "", label: "كل الأقسام" }, ...roots.map((category) => ({ value: category.id, label: category.name }))]} aria-label="القسم"/>
            </label>
            <button type="submit" className="button button-primary" disabled={busy}><Send size={16}/> انشر السؤال</button>
          </div>
        </form>
      ) : (
        <div className="ask-gate">
          <span className="ask-gate-icon"><Lock size={22}/></span>
          <div><strong>السؤال والترشيح للأعضاء</strong><p>سجّل عضويتك المجانية في ثواني عشان تسأل وترشّح لجيرانك.</p></div>
          <div className="ask-gate-actions">
            <Link href={registerUrl("/ask")} className="button button-primary button-small"><UserRoundPlus size={15}/> سجّل عضوية</Link>
            <Link href={loginUrl("/ask")} className="button button-soft button-small"><LogIn size={15}/> دخول</Link>
          </div>
        </div>
      )}

      <div className="ask-filters" role="tablist">
        {([["all", "كل الأسئلة"], ["open", "مفتوحة"], ...(isMember ? [["mine", "أسئلتي"]] : [])] as Array<[typeof filter, string]>).map(([id, label]) => <button type="button" key={id} role="tab" aria-selected={filter === id} className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>{label}</button>)}
      </div>

      {!list.length && <div className="events-empty"><span className="ad-placeholder-icon"><CircleHelp size={26}/></span><strong>{filter === "mine" ? "لسه ما سألتش حاجة" : "مفيش أسئلة لسه"}</strong><p>كن أول واحد يسأل — سؤالك ممكن يفيد نص القرية.</p></div>}

      <div className="ask-list">
        {list.map((question) => {
          const groups = groupNominations(question), expanded = open === question.id, category = question.category ? getCategory(question.category, data.categories) : null;
          return (
            <article key={question.id} id={`q-${question.id}`} className={`ask-card ${expanded ? "is-open" : ""} ${question.status !== "open" ? "is-closed" : ""}`}>
              <button type="button" className="ask-card-head" onClick={() => setOpen(expanded ? null : question.id)} aria-expanded={expanded}>
                <span className="ask-avatar"><UserRound size={16}/></span>
                <span className="ask-card-main">
                  <strong>{question.text}</strong>
                  <small>{question.memberName} · {relativeTimeAr(question.createdAt)}{category ? <> · <i><CategoryIcon category={category.id} icon={category.icon} size={12}/> {category.name}</i></> : null}{question.status !== "open" && <> · <em>مقفول</em></>}</small>
                </span>
                <span className="ask-card-count"><b>{question.answers.length.toLocaleString("ar-EG")}</b> ترشيح <ChevronDown size={14} className={expanded ? "is-open" : ""}/></span>
              </button>

              {expanded && (
                <div className="ask-card-body">
                  {groups.length ? (
                    <ul className="ask-answers">
                      {groups.map((group) => {
                        const service = serviceOf(group.serviceId), first = group.answers[0], notes = group.answers.filter((answer) => answer.text);
                        return (
                          <li key={group.serviceId ?? first.id} className={`ask-answer ${group.isBest ? "is-best" : ""} ${service ? "is-service" : ""}`}>
                            {group.isBest && <span className="ask-best-flag"><CheckCircle2 size={12}/> الإجابة اللي ساعدت</span>}
                            {service ? (
                              <Link href={`/?service=${service.id}`} className="ask-service">
                                <span className="ask-service-icon"><CategoryIcon category={service.category} icon={getCategory(service.category, data.categories).icon} size={20}/></span>
                                <span className="ask-service-main">
                                  <strong>{service.name}{service.verified && <BadgeCheck size={14} className="ask-verified"/>}</strong>
                                  <small>{getCategory(service.category, data.categories).name} · {service.area}{Number(service.rating) > 0 && <> · <Star size={11} fill="currentColor"/> {Number(service.rating).toFixed(1)}</>}</small>
                                </span>
                                <span className="ask-nominees"><b>{group.count.toLocaleString("ar-EG")}</b> {group.count === 1 ? "رشّحه" : "رشّحوه"}</span>
                              </Link>
                            ) : (
                              <p className="ask-tip">{first.text}</p>
                            )}
                            <div className="ask-answer-meta">
                              <span><Users size={12}/> {group.names.slice(0, 4).join("، ")}{group.names.length > 4 ? ` و${group.names.length - 4} آخرين` : ""}</span>
                              {service && notes.map((answer) => <q key={answer.id}>{answer.memberName}: {answer.text}</q>)}
                            </div>
                            <div className="ask-answer-actions">
                              {question.mine && question.status === "open" && <button type="button" className={`ask-mini ${group.isBest ? "is-active" : ""}`} onClick={() => void call("PATCH", { action: "best", questionId: question.id, answerId: first.id, clear: group.isBest }, group.isBest ? "تم إلغاء التحديد." : "تم تحديد الإجابة اللي ساعدتك.")}><CheckCircle2 size={13}/> {group.isBest ? "إلغاء التحديد" : "دي اللي ساعدتني"}</button>}
                              {isMember && group.answers.some((answer) => answer.mine) && <button type="button" className="ask-mini is-danger" onClick={() => { const mine = group.answers.find((answer) => answer.mine); if (mine) void call("DELETE", { answerId: mine.id }, "تم حذف ترشيحك."); }}><Trash2 size={13}/> احذف ترشيحي</button>}
                              {isMember && <button type="button" className="ask-mini" onClick={() => { const reason = window.prompt("سبب البلاغ (اختياري):") ?? ""; void call("PATCH", { action: "report", questionId: question.id, answerId: first.id, reason }, "وصل بلاغك."); }}><Flag size={13}/> بلاغ</button>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : <p className="ask-no-answers">لسه مفيش ترشيحات — كن أول من يرشّح!</p>}

                  <div className="ask-card-actions">
                    {isMember && question.status === "open" && <>
                      <button type="button" className="button button-primary button-small" onClick={() => { setNominate({ question, service: null, text: "" }); setPickSearch(""); }}><Search size={14}/> رشّح من الدليل</button>
                      <button type="button" className="button button-soft button-small" onClick={() => setTipFor(question)}><MessageSquareText size={14}/> اكتب نصيحة</button>
                    </>}
                    {!isMember && <Link href={registerUrl("/ask")} className="button button-primary button-small"><UserRoundPlus size={14}/> سجّل عشان ترشّح</Link>}
                    {question.mine && <button type="button" className="button button-soft button-small" onClick={() => void call("PATCH", { action: question.status === "open" ? "close" : "reopen", questionId: question.id }, question.status === "open" ? "تم قفل السؤال." : "تم فتح السؤال.")}>{question.status === "open" ? <><Lock size={14}/> اقفل السؤال</> : <><Sparkles size={14}/> افتح السؤال</>}</button>}
                    {question.mine && <button type="button" className="icon-button ask-delete" aria-label="حذف السؤال" onClick={() => { if (window.confirm("حذف السؤال وكل ترشيحاته؟")) void call("DELETE", { questionId: question.id }, "تم حذف السؤال."); }}><Trash2 size={15}/></button>}
                    {isMember && !question.mine && <button type="button" className="ask-mini" onClick={() => { const reason = window.prompt("سبب البلاغ (اختياري):") ?? ""; void call("PATCH", { action: "report", questionId: question.id, reason }, "وصل بلاغك."); }}><Flag size={13}/> بلاغ عن السؤال</button>}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>

    {nominate && (
      <Modal title="رشّح مهنيًا من الدليل" subtitle={nominate.question.text} onClose={() => setNominate(null)} floating>
        {!nominate.service ? (
          <div className="ask-pick">
            <label className="ask-pick-search"><Search size={16}/><input autoFocus value={pickSearch} onChange={(event) => setPickSearch(event.target.value)} placeholder="ابحث بالاسم أو التخصص أو المنطقة…"/>{pickSearch && <button type="button" onClick={() => setPickSearch("")} aria-label="مسح"><X size={14}/></button>}</label>
            <ul className="ask-pick-list">
              {pickResults.map((service) => (
                <li key={service.id}>
                  <button type="button" onClick={() => setNominate({ ...nominate, service })}>
                    <span className="ask-service-icon"><CategoryIcon category={service.category} icon={getCategory(service.category, data.categories).icon} size={20}/></span>
                    <span className="ask-service-main"><strong>{service.name}</strong><small>{getCategory(service.category, data.categories).name} · {service.area}</small></span>
                    <UserRoundPlus size={16}/>
                  </button>
                </li>
              ))}
              {!pickResults.length && <li className="ask-pick-empty">مفيش نتائج — جرّب كلمة تانية.</li>}
            </ul>
          </div>
        ) : (
          <div className="ask-pick-confirm">
            <div className="ask-service is-static">
              <span className="ask-service-icon"><CategoryIcon category={nominate.service.category} icon={getCategory(nominate.service.category, data.categories).icon} size={22}/></span>
              <span className="ask-service-main"><strong>{nominate.service.name}</strong><small>{getCategory(nominate.service.category, data.categories).name} · {nominate.service.area}</small></span>
              <button type="button" className="ask-mini" onClick={() => setNominate({ ...nominate, service: null })}>تغيير</button>
            </div>
            <label className="ask-form-field"><span>ليه بترشّحه؟ (اختياري)</span><textarea rows={2} maxLength={ANSWER_MAX} value={nominate.text} onChange={(event) => setNominate({ ...nominate, text: event.target.value })} placeholder="مثال: اتعاملت معاه مرتين وشغله نضيف وأسعاره كويسة"/></label>
            <button type="button" className="button button-primary" disabled={busy} onClick={() => void submitNomination()}><Send size={16}/> أرسل الترشيح</button>
          </div>
        )}
      </Modal>
    )}

    {tipFor && (
      <Modal title="اكتب نصيحة" subtitle={tipFor.text} onClose={() => setTipFor(null)} floating>
        <div className="ask-pick-confirm">
          <label className="ask-form-field"><span>نصيحتك</span><textarea id="ask-tip-text" rows={3} maxLength={ANSWER_MAX} placeholder="لو مش عارف مهني بعينه، اكتب نصيحة عامة تفيد السائل"/></label>
          <button type="button" className="button button-primary" disabled={busy} onClick={() => void submitTip()}><Send size={16}/> أرسل</button>
        </div>
      </Modal>
    )}

    {toast && <div className={`ask-toast ${toast.error ? "is-error" : ""}`} role="status">{toast.error ? <X size={15}/> : <CheckCircle2 size={15}/>} {toast.text}</div>}
    {settings.phone && <a className="ask-help" href={`https://wa.me/${settings.phone.replace(/\D/g, "").replace(/^0/, "20")}`} target="_blank" rel="noopener noreferrer" aria-label="تواصل مع الإدارة"><MessageCircle size={18}/></a>}
  </div>;
}

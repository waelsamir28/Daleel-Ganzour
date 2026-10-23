"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BellPlus, CalendarDays, CalendarPlus, ChevronDown, Clock3, MapPin, MessageCircle, Pin, Share2, Sparkles, X } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import { Logo } from "@/components/ui";
import { defaultDesignSettings, EVENT_KINDS, eventPhase, eventShareText, formatEventDate, getEventKind, googleCalendarUrl, type PublicDirectory, type VillageEventRecord, type Viewer } from "@/lib/catalog";

type Props = { data: PublicDirectory; viewer: Viewer; focusId?: string };

/** Public «مناسبات القرية» calendar: today / upcoming / past, with «ذكّرني» (phone calendar + Google) and WhatsApp share. */
export default function EventsPage({ data, viewer, focusId = "" }: Props) {
  const design = { ...defaultDesignSettings, ...(data.designSettings ?? {}) };
  const settings = data.settings;
  const events = useMemo(() => data.events ?? [], [data.events]);
  const [filter, setFilter] = useState("all");
  const [showPast, setShowPast] = useState(false);
  const [remindFor, setRemindFor] = useState<VillageEventRecord | null>(null);
  const focused = useRef(false);
  const now = useMemo(() => new Date(), []);

  const grouped = useMemo(() => {
    const visible = events.filter((event) => filter === "all" || event.kind === filter);
    const sorted = [...visible].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.startsAt.localeCompare(b.startsAt));
    return { today: sorted.filter((event) => eventPhase(event, now) === "today"), upcoming: sorted.filter((event) => eventPhase(event, now) === "upcoming"), past: sorted.filter((event) => eventPhase(event, now) === "past").reverse() };
  }, [events, filter, now]);
  const usedKinds = EVENT_KINDS.filter((kind) => events.some((event) => event.kind === kind.id));

  useEffect(() => {
    if (!focusId || focused.current) return;
    focused.current = true;
    const element = document.getElementById(`event-${focusId}`);
    if (element) { element.scrollIntoView({ behavior: "smooth", block: "center" }); element.classList.add("is-focused"); }
  }, [focusId]);

  const pageUrl = (event: VillageEventRecord) => `${typeof window !== "undefined" ? window.location.origin : ""}/events?event=${event.id}`;

  function Card({ event }: { event: VillageEventRecord }) {
    const kind = getEventKind(event.kind), phase = eventPhase(event, now);
    const share = `https://wa.me/?text=${encodeURIComponent(eventShareText(event, settings.siteName, pageUrl(event)))}`;
    return (
      <article id={`event-${event.id}`} className={`event-card is-${phase} ${event.pinned ? "is-pinned" : ""}`} style={{ "--event-color": kind.color } as React.CSSProperties}>
        <div className="event-card-date" aria-hidden="true">
          <b>{new Date(event.startsAt).toLocaleDateString("ar-EG", { day: "numeric", timeZone: "Africa/Cairo" })}</b>
          <span>{new Date(event.startsAt).toLocaleDateString("ar-EG", { month: "short", timeZone: "Africa/Cairo" })}</span>
        </div>
        <div className="event-card-body">
          <div className="event-card-top">
            <span className="event-kind"><i>{kind.icon}</i> {kind.name}</span>
            {phase === "today" && <span className="event-flag is-today"><Sparkles size={11}/> اليوم</span>}
            {event.pinned && phase !== "past" && <span className="event-flag is-pinned"><Pin size={11}/> مثبّت</span>}
          </div>
          <h3>{event.title}</h3>
          <p className="event-meta">
            <span><Clock3 size={13}/> {formatEventDate(event.startsAt)}{event.endsAt ? ` حتى ${new Date(event.endsAt).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" })}` : ""}</span>
            {event.location && <span><MapPin size={13}/> {event.location}</span>}
          </p>
          {event.description && <p className="event-desc">{event.description}</p>}
          <div className="event-actions">
            {phase !== "past" && <button type="button" className="button button-primary button-small" onClick={() => setRemindFor(event)}><BellPlus size={14}/> ذكّرني</button>}
            <a className="button button-whatsapp button-small" href={share} target="_blank" rel="noopener noreferrer"><Share2 size={14}/> مشاركة</a>
            {event.location && <a className="button button-soft button-small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.location} جنزور`)}`} target="_blank" rel="noopener noreferrer"><MapPin size={14}/> الموقع</a>}
          </div>
        </div>
      </article>
    );
  }

  return <div className="events-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>

    <main className="container events-main">
      <section className="events-hero">
        <span className="adv-eyebrow"><CalendarDays size={14}/> مناسبات القرية</span>
        <h1>إيه اللي حاصل في جنزور؟</h1>
        <p>أفراح، عزاءات، قوافل طبية، معارض، اجتماعات… كل مناسبات القرية في مكان واحد. اضغط «ذكّرني» وهتتضاف لتقويم موبايلك بتنبيه قبلها بيوم وبساعة.</p>
        <div className="adv-stats">
          <span><Sparkles size={16}/><b>{grouped.today.length.toLocaleString("ar-EG")}</b> النهارده</span>
          <span><CalendarDays size={16}/><b>{grouped.upcoming.length.toLocaleString("ar-EG")}</b> قادمة</span>
          {(viewer.role === "admin") && <Link href="/admin?tab=events" className="button button-soft button-small"><CalendarPlus size={14}/> إضافة مناسبة</Link>}
        </div>
      </section>

      {usedKinds.length > 1 && (
        <div className="events-filters" role="tablist" aria-label="نوع المناسبة">
          <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>الكل</button>
          {usedKinds.map((kind) => <button type="button" key={kind.id} role="tab" aria-selected={filter === kind.id} className={filter === kind.id ? "is-active" : ""} onClick={() => setFilter(kind.id)}><i>{kind.icon}</i> {kind.name}</button>)}
        </div>
      )}

      {!events.length && (
        <div className="events-empty">
          <span className="ad-placeholder-icon"><CalendarDays size={26}/></span>
          <strong>لسه مفيش مناسبات مضافة</strong>
          <p>عندك مناسبة عامة في القرية؟ ابعتها للإدارة على واتساب وهتتضاف هنا.</p>
          {settings.phone && <a className="button button-whatsapp button-small" href={`https://wa.me/${settings.phone.replace(/\D/g, "").replace(/^0/, "20")}?text=${encodeURIComponent(`مرحبًا، عندي مناسبة أحب تتضاف في «مناسبات القرية» بـ${settings.siteName}:`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> أرسل مناسبة</a>}
        </div>
      )}

      {grouped.today.length > 0 && <section className="events-group"><h2><Sparkles size={18}/> النهارده</h2><div className="events-list">{grouped.today.map((event) => <Card key={event.id} event={event}/>)}</div></section>}
      {grouped.upcoming.length > 0 && <section className="events-group"><h2><CalendarDays size={18}/> القادمة</h2><div className="events-list">{grouped.upcoming.map((event) => <Card key={event.id} event={event}/>)}</div></section>}
      {grouped.past.length > 0 && (
        <section className="events-group is-past">
          <button type="button" className="events-past-toggle" onClick={() => setShowPast((value) => !value)} aria-expanded={showPast}><ChevronDown size={16} className={showPast ? "is-open" : ""}/> مناسبات سابقة ({grouped.past.length.toLocaleString("ar-EG")})</button>
          {showPast && <div className="events-list">{grouped.past.map((event) => <Card key={event.id} event={event}/>)}</div>}
        </section>
      )}
    </main>

    {remindFor && (
      <div className="events-remind-backdrop" onClick={() => setRemindFor(null)}>
        <div className="events-remind" role="dialog" aria-modal="true" aria-label="ذكّرني" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="events-remind-close" onClick={() => setRemindFor(null)} aria-label="إغلاق"><X size={16}/></button>
          <span className="events-remind-icon"><BellPlus size={24}/></span>
          <h3>{remindFor.title}</h3>
          <p>{formatEventDate(remindFor.startsAt)}</p>
          <a className="button button-primary" href={`/api/events?ics=${remindFor.id}`} onClick={() => setTimeout(() => setRemindFor(null), 400)}><CalendarPlus size={16}/> أضِف لتقويم الموبايل (آيفون / أندرويد)</a>
          <a className="button button-soft" href={googleCalendarUrl(remindFor, settings.siteName)} target="_blank" rel="noopener noreferrer"><CalendarDays size={16}/> أضِف لتقويم Google</a>
          <small>هيوصلك تنبيه قبل المناسبة بيوم وقبلها بساعة.</small>
        </div>
      </div>
    )}
  </div>;
}

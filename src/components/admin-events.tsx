"use client";
import { type FormEvent, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Check, Clock3, LoaderCircle, MapPin, PartyPopper, Pencil, Pin, PinOff, Plus, RotateCcw, Save, Sparkles, Trash2, X } from "lucide-react";
import SelectField from "@/components/select-field";
import { CAIRO_TZ, EVENT_KINDS, eventPhase, formatEventDate, getEventKind, resolvedGreetings, type GreetingOccasion, type GreetingSettings, type VillageEventRecord } from "@/lib/catalog";

type Mutate = (method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, success?: string) => Promise<boolean>;
type Draft = { title: string; kind: string; startsAt: string; endsAt: string; location: string; description: string; pinned: boolean };
const emptyDraft: Draft = { title: "", kind: "other", startsAt: "", endsAt: "", location: "", description: "", pinned: false };
type Props = { events: VillageEventRecord[]; greetings: GreetingSettings; busy: string | null; mutate: Mutate; onConfirmDelete: (event: VillageEventRecord) => void };

/** ISO → value for <input type="datetime-local"> expressed in Cairo time (what the admin thinks in). */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
/** Cairo UTC offset (ms) at a given instant, derived from ICU so DST is handled. */
function cairoOffsetMs(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CAIRO_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - instant.getTime();
}
/** datetime-local (Cairo wall time) → ISO instant, independent of the admin's browser time zone. */
function fromLocalInput(value: string) {
  if (!value) return "";
  const wallAsUtc = new Date(`${value}:00Z`);
  if (Number.isNaN(wallAsUtc.getTime())) return "";
  const first = new Date(wallAsUtc.getTime() - cairoOffsetMs(wallAsUtc));
  return new Date(wallAsUtc.getTime() - cairoOffsetMs(first)).toISOString();
}

export default function AdminEvents({ events, greetings, busy, mutate, onConfirmDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<GreetingSettings>(greetings);
  const [year, setYear] = useState(new Date().getFullYear());
  const [customDraft, setCustomDraft] = useState({ name: "", icon: "🎊", message: "", start: "", end: "" });
  const [dirty, setDirty] = useState(false);
  const now = useMemo(() => new Date(), []);
  const sorted = useMemo(() => [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [events]);
  const upcoming = sorted.filter((event) => eventPhase(event, now) !== "past"), past = sorted.filter((event) => eventPhase(event, now) === "past").reverse();
  const occasions = useMemo(() => resolvedGreetings(settings, year), [settings, year]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TZ }).format(now);

  function startCreate() { setEditingId(null); setDraft({ ...emptyDraft, startsAt: "" }); setError(""); setOpen(true); }
  function startEdit(event: VillageEventRecord) { setEditingId(event.id); setDraft({ title: event.title, kind: event.kind, startsAt: toLocalInput(event.startsAt), endsAt: toLocalInput(event.endsAt), location: event.location, description: event.description, pinned: event.pinned }); setError(""); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (draft.title.trim().length < 3) { setError("اكتب عنوان المناسبة."); return; }
    if (!draft.startsAt) { setError("اختر تاريخ ووقت المناسبة."); return; }
    const values = { ...draft, startsAt: fromLocalInput(draft.startsAt), endsAt: fromLocalInput(draft.endsAt) };
    const ok = editingId ? await mutate("PATCH", { type: "event", id: editingId, action: "edit", values }, "تم تعديل المناسبة.") : await mutate("POST", { type: "event", values }, "تمت إضافة المناسبة.");
    if (ok) { setOpen(false); setEditingId(null); setDraft(emptyDraft); }
  }
  function updateOverride(id: string, patch: Partial<GreetingSettings["overrides"][string]>) {
    setSettings((current) => ({ ...current, overrides: { ...current.overrides, [id]: { ...(current.overrides[id] ?? {}), ...patch } } })); setDirty(true);
  }
  function resetOverride(id: string) { setSettings((current) => { const overrides = { ...current.overrides }; delete overrides[id]; return { ...current, overrides }; }); setDirty(true); }
  async function saveGreetings() { if (await mutate("PATCH", { type: "greetings", values: settings }, "تم حفظ التهاني الموسمية.")) setDirty(false); }
  function addCustom() {
    if (!customDraft.name.trim() || !customDraft.message.trim() || !customDraft.start) { setError("اكتب اسم المناسبة ونص التهنئة وتاريخ البداية."); return; }
    setSettings((current) => ({ ...current, custom: [...current.custom, { id: `custom-${Date.now().toString(36)}`, ...customDraft, end: customDraft.end || customDraft.start }] }));
    setCustomDraft({ name: "", icon: "🎊", message: "", start: "", end: "" }); setDirty(true); setError("");
  }
  const occasionRow = (item: GreetingOccasion) => {
    const override = settings.overrides[item.id] ?? {}, active = item.enabled && item.start <= today && item.end >= today, changed = Boolean(override.message || override.start || override.end || override.enabled === false);
    return (
      <article key={`${item.id}-${item.start}`} className={`admin-greeting ${item.enabled ? "" : "is-off"} ${active ? "is-active" : ""}`}>
        <div className="admin-greeting-head">
          <label className="admin-greeting-toggle"><input type="checkbox" checked={item.enabled} onChange={(event) => item.custom ? setSettings((current) => ({ ...current, custom: current.custom.filter((custom) => custom.id !== item.id) })) : updateOverride(item.id, { enabled: event.target.checked ? undefined : false })}/><i>{item.icon}</i><strong>{item.name}</strong></label>
          <span className="admin-greeting-dates">
            {active && <em className="admin-greeting-live"><Sparkles size={11}/> ظاهرة الآن</em>}
            <small>{item.source === "hijri" ? "هجري" : item.source === "computed" ? "محسوب" : item.source === "custom" ? "مخصص" : "ثابت"}</small>
          </span>
        </div>
        {item.custom ? (
          <p className="admin-greeting-custom-note">{item.message}<br/><small>{item.start} → {item.end}</small></p>
        ) : (
          <div className="admin-greeting-fields">
            <label className="admin-ad-field admin-ad-field-wide"><span>نص التهنئة في الشريط</span><input value={override.message ?? item.message} maxLength={260} onChange={(event) => updateOverride(item.id, { message: event.target.value === item.message ? undefined : event.target.value })}/></label>
            <label className="admin-ad-field"><span>من</span><input type="date" value={item.start} onChange={(event) => updateOverride(item.id, { start: event.target.value || undefined })}/></label>
            <label className="admin-ad-field"><span>إلى</span><input type="date" value={item.end} min={item.start} onChange={(event) => updateOverride(item.id, { end: event.target.value || undefined })}/></label>
            {changed && <button type="button" className="ask-mini admin-greeting-reset" onClick={() => resetOverride(item.id)}><RotateCcw size={12}/> رجوع للافتراضي</button>}
          </div>
        )}
      </article>
    );
  };

  return <div className="admin-events">
    <section className="admin-ads-hero">
      <div className="admin-ads-hero-text">
        <span className="admin-ads-hero-icon"><CalendarDays size={22}/></span>
        <div><h2>مناسبات القرية والتهاني الموسمية</h2><p>المناسبات تظهر في صفحة «مناسبات القرية» وأقربها يظهر في الشريط المتحرك. التهاني بتظهر تلقائيًا في الشريط وشارة الهيدر في موعدها (التواريخ الهجرية محسوبة بتقويم أم القرى).</p></div>
      </div>
      <div className="admin-ads-hero-actions">
        <button type="button" className="button button-primary" onClick={startCreate}><Plus size={16}/> مناسبة جديدة</button>
        <a className="button button-soft" href="/events" target="_blank" rel="noopener noreferrer"><CalendarDays size={16}/> الصفحة العامة</a>
      </div>
    </section>

    {open && (
      <form className="admin-ad-form" onSubmit={save}>
        <div className="admin-ad-form-head"><strong><CalendarPlus size={18}/> {editingId ? "تعديل المناسبة" : "مناسبة جديدة"}</strong><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={16}/></button></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="admin-ad-fields">
          <label className="admin-ad-field admin-ad-field-wide"><span>العنوان</span><input value={draft.title} maxLength={160} placeholder="مثال: قافلة طبية مجانية بمركز الشباب" onChange={(event) => setDraft({ ...draft, title: event.target.value })} required/></label>
          <label className="admin-ad-field"><span>النوع</span><SelectField value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })} options={EVENT_KINDS.map((kind) => ({ value: kind.id, label: `${kind.icon} ${kind.name}` }))} aria-label="نوع المناسبة"/></label>
          <label className="admin-ad-field"><span>المكان</span><input value={draft.location} maxLength={160} placeholder="مثال: مسجد النور / مركز الشباب" onChange={(event) => setDraft({ ...draft, location: event.target.value })}/></label>
          <label className="admin-ad-field"><span><Clock3 size={13}/> يبدأ</span><input type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} required/></label>
          <label className="admin-ad-field"><span><Clock3 size={13}/> ينتهي (اختياري)</span><input type="datetime-local" value={draft.endsAt} min={draft.startsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}/></label>
          <label className="admin-ad-field admin-ad-field-wide"><span>تفاصيل</span><textarea rows={3} value={draft.description} maxLength={1200} placeholder="برنامج اليوم، التخصصات، الشروط، أرقام التواصل…" onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label>
          <label className="admin-ad-check admin-ad-field-wide"><input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })}/> <Pin size={14}/> مثبّتة في أول القائمة</label>
        </div>
        <div className="admin-ad-form-actions">
          <button type="submit" className="button button-primary" disabled={busy === "saving"}>{busy === "saving" ? <LoaderCircle size={16} className="spin"/> : <Save size={16}/>} {editingId ? "حفظ التعديل" : "إضافة المناسبة"}</button>
          <button type="button" className="button button-soft" onClick={() => setOpen(false)}>إلغاء</button>
        </div>
      </form>
    )}

    <section className="admin-ads-list-section">
      <h3 className="admin-ads-section-title"><CalendarDays size={17}/> المناسبات القادمة <span>{upcoming.length}</span></h3>
      {upcoming.length ? <div className="admin-events-list">{upcoming.map((event) => <EventRow key={event.id} event={event} now={now} busy={busy} onEdit={startEdit} onPin={() => void mutate("PATCH", { type: "event", id: event.id, action: "pin", pinned: !event.pinned }, event.pinned ? "تم إلغاء التثبيت." : "تم التثبيت.")} onDelete={() => onConfirmDelete(event)}/>)}</div> : <p className="admin-ad-requests-empty">مفيش مناسبات قادمة. أضف أول مناسبة من الزر فوق.</p>}
      {past.length > 0 && <details className="admin-events-past"><summary>مناسبات سابقة ({past.length})</summary><div className="admin-events-list">{past.map((event) => <EventRow key={event.id} event={event} now={now} busy={busy} onEdit={startEdit} onPin={() => void mutate("PATCH", { type: "event", id: event.id, action: "pin", pinned: !event.pinned }, "تم.")} onDelete={() => onConfirmDelete(event)}/>)}</div></details>}
    </section>

    <section className="admin-ads-list-section admin-greetings">
      <div className="admin-greetings-head">
        <h3 className="admin-ads-section-title"><PartyPopper size={17}/> التهاني الموسمية</h3>
        <div className="admin-greetings-controls">
          <label className="admin-ad-check"><input type="checkbox" checked={settings.enabled} onChange={(event) => { setSettings({ ...settings, enabled: event.target.checked }); setDirty(true); }}/> تفعيل التهاني</label>
          <label className="admin-ad-check"><input type="checkbox" checked={settings.showHeaderBadge} onChange={(event) => { setSettings({ ...settings, showHeaderBadge: event.target.checked }); setDirty(true); }}/> شارة في الهيدر</label>
          <SelectField value={String(year)} onChange={(event) => setYear(Number(event.target.value))} options={[year - 1, year, year + 1].filter((value, index, list) => list.indexOf(value) === index).map((value) => ({ value: String(value), label: `سنة ${value}` }))} aria-label="السنة"/>
          <button type="button" className="button button-primary button-small" disabled={!dirty || busy === "saving"} onClick={() => void saveGreetings()}>{busy === "saving" ? <LoaderCircle size={14} className="spin"/> : <Check size={14}/>} حفظ التهاني</button>
        </div>
      </div>
      <p className="admin-ad-tips">كل مناسبة لها نص تهنئة وفترة ظهور. عدّل النص أو التواريخ لو اختلف الإعلان الرسمي عن الحساب الفلكي، أو أضف مناسبة خاصة بالقرية (مولد، احتفال، ذكرى).</p>
      <div className="admin-greetings-list">{occasions.map(occasionRow)}</div>
      <div className="admin-greeting-add">
        <strong><Plus size={14}/> مناسبة مخصصة</strong>
        {error && !open && <div className="form-error" role="alert">{error}</div>}
        <div className="admin-ad-fields">
          <label className="admin-ad-field"><span>الاسم</span><input value={customDraft.name} maxLength={80} placeholder="مثال: مولد سيدي…" onChange={(event) => setCustomDraft({ ...customDraft, name: event.target.value })}/></label>
          <label className="admin-ad-field"><span>رمز (إيموجي)</span><input value={customDraft.icon} maxLength={4} onChange={(event) => setCustomDraft({ ...customDraft, icon: event.target.value })}/></label>
          <label className="admin-ad-field admin-ad-field-wide"><span>نص التهنئة</span><input value={customDraft.message} maxLength={260} onChange={(event) => setCustomDraft({ ...customDraft, message: event.target.value })}/></label>
          <label className="admin-ad-field"><span>من</span><input type="date" value={customDraft.start} onChange={(event) => setCustomDraft({ ...customDraft, start: event.target.value })}/></label>
          <label className="admin-ad-field"><span>إلى</span><input type="date" value={customDraft.end} min={customDraft.start} onChange={(event) => setCustomDraft({ ...customDraft, end: event.target.value })}/></label>
        </div>
        <button type="button" className="button button-soft button-small" onClick={addCustom}><Plus size={14}/> أضف للقائمة (ثم احفظ التهاني)</button>
      </div>
    </section>
  </div>;
}

function EventRow({ event, now, busy, onEdit, onPin, onDelete }: { event: VillageEventRecord; now: Date; busy: string | null; onEdit: (event: VillageEventRecord) => void; onPin: () => void; onDelete: () => void }) {
  const kind = getEventKind(event.kind), phase = eventPhase(event, now);
  return (
    <article className={`admin-event-row is-${phase}`} style={{ "--event-color": kind.color } as React.CSSProperties}>
      <span className="admin-event-kind" aria-hidden="true">{kind.icon}</span>
      <div className="admin-ad-info">
        <h4>{event.title}{event.pinned && <span className="status-badge status-featured"><Pin size={11}/> مثبّتة</span>}{phase === "today" && <span className="status-badge status-approved">اليوم</span>}{phase === "past" && <span className="status-badge status-rejected">انتهت</span>}</h4>
        <p><span><Clock3 size={12}/> {formatEventDate(event.startsAt)}</span>{event.location && <span><MapPin size={12}/> {event.location}</span>}<span>{kind.name}</span></p>
      </div>
      <div className="admin-ad-actions">
        <button type="button" className="button button-soft button-small" onClick={() => onEdit(event)}><Pencil size={14}/> تعديل</button>
        <button type="button" className="button button-soft button-small" onClick={onPin} disabled={busy === event.id}>{event.pinned ? <><PinOff size={14}/> إلغاء التثبيت</> : <><Pin size={14}/> تثبيت</>}</button>
        <button type="button" className="icon-button admin-delete" onClick={onDelete} aria-label="حذف"><Trash2 size={15}/></button>
      </div>
    </article>
  );
}

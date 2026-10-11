"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, Check, ChevronLeft, Hammer, HeartHandshake, MapPin, Megaphone, Phone, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { whatsappUrl, type CommunityListingRecord, type CommunityListingType } from "@/lib/catalog";

type Listing = CommunityListingRecord;
const dismissalKey = "janzour-community-announcements-dismissed";
// The floating announcement rotates automatically every 10 seconds, fading out then in.
const ANNOUNCEMENT_ROTATE_MS = 10000;
const ANNOUNCEMENT_FADE_MS = 300;
const laborScopeNote = "العمالة اليومية مخصصة للهدم والتكسير وتشوين الرمل والأسمنت والأعمال المساعدة، وليست للنقاشة والسيراميك.";
const categories: Array<{ id: Listing["type"]; title: string; description: string; icon: typeof Hammer }> = [
  { id: "labor", title: "عمالة يومية", description: "هدم وتكسير وتشوين رمل وأسمنت وأعمال مساعدة.. تواصل مباشر مع العامل", icon: Hammer },
  { id: "property", title: "عقارات بدون وسطاء", description: "بيع وإيجار مباشر من أصحاب العقارات", icon: Building2 },
  { id: "job", title: "وظائف جنزور", description: "فرص عمل لأهل جنزور والمناطق القريبة", icon: BriefcaseBusiness },
];
const typeLabels: Record<Listing["type"], string> = { labor: "عمالة يومية", property: "عقار بدون وسيط", job: "وظيفة في جنزور" };

export default function CommunityMarket() {
  const [active, setActive] = useState<Listing["type"]>("labor");
  const [listings, setListings] = useState<Listing[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const value: unknown = JSON.parse(sessionStorage.getItem(dismissalKey) ?? "[]");
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
    } catch { return []; }
  });
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementLeaving, setAnnouncementLeaving] = useState(false);
  const adFadeTimer = useRef(0);
  const adRotateTimer = useRef(0);
  const [formType, setFormType] = useState<CommunityListingType | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintBusy, setComplaintBusy] = useState(false);
  const [complaint, setComplaint] = useState({ name: "", phone: "", message: "" });

  const refreshListings = useCallback(async () => {
    try {
      const response = await fetch("/api/community", { cache: "no-store" });
      if (!response.ok) return;
      const value = await response.json();
      if (Array.isArray(value.listings)) setListings(value.listings as Listing[]);
    } catch { /* Keep already loaded community posts during temporary network failures. */ }
  }, []);

  useEffect(() => {
    // Dismissals are session-only: close one floating ad to move to the next, then start fresh next visit.
    const initial = window.setTimeout(() => { void refreshListings(); }, 0);
    const timer = window.setInterval(() => { if (!document.hidden) void refreshListings(); }, 30000);
    const onFocus = () => void refreshListings();
    window.addEventListener("focus", onFocus);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refreshListings]);

  const visible = useMemo(() => listings.filter((item) => item.type === active), [listings, active]);
  const announcementQueue = useMemo(
    () => listings.filter((item) => item.type !== "labor" && !dismissed.includes(item.id)),
    [listings, dismissed],
  );
  const announcement = announcementQueue.length ? announcementQueue[announcementIndex % announcementQueue.length] : undefined;

  useEffect(() => () => { window.clearTimeout(adFadeTimer.current); window.clearTimeout(adRotateTimer.current); }, []);
  useEffect(() => {
    // The floating ad cycles through the approved property/job announcements: fade out, switch, fade in.
    if (announcementQueue.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setAnnouncementLeaving(true);
      window.clearTimeout(adRotateTimer.current);
      adRotateTimer.current = window.setTimeout(() => {
        setAnnouncementIndex((current) => current + 1);
        setAnnouncementLeaving(false);
      }, ANNOUNCEMENT_FADE_MS);
    }, ANNOUNCEMENT_ROTATE_MS);
    return () => { window.clearInterval(timer); window.clearTimeout(adRotateTimer.current); };
  }, [announcementQueue.length]);

  function openAdForm(type: "property" | "job" = active === "job" ? "job" : "property") {
    setNotice("");
    setFormType(type);
  }

  function closeAdForm() {
    setFormType(null);
    setNotice("");
  }

  function closeAnnouncement(id: string) {
    // The close button stays per announcement: fade the card out first, then dismiss it for this session.
    setAnnouncementLeaving(true);
    window.clearTimeout(adFadeTimer.current);
    adFadeTimer.current = window.setTimeout(() => {
      setDismissed((current) => {
        const next = [...new Set([...current, id])];
        try { sessionStorage.setItem(dismissalKey, JSON.stringify(next)); } catch { /* Closing still works for this render. */ }
        return next;
      });
      setAnnouncementLeaving(false);
    }, ANNOUNCEMENT_FADE_MS);
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formType) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setNotice("");
    setNoticeIsError(false);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: form.get("title"),
          profession: form.get("profession"),
          description: form.get("description"),
          phone: form.get("phone"),
          whatsapp: form.get("whatsapp"),
          area: form.get("area"),
          price: form.get("price"),
        }),
      });
      const result = await response.json();
      const message = result.message ?? result.error ?? "تعذر إرسال الطلب. حاول مرة أخرى.";
      setNotice(message);
      setNoticeIsError(!response.ok);
      if (response.ok) {
        formElement.reset();
        setFormType(null);
        void refreshListings();
      }
    } catch {
      setNotice("تعذر الاتصال بالإدارة. حاول مرة أخرى بعد قليل.");
      setNoticeIsError(true);
    } finally { setSubmitting(false); }
  }

  async function sendComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComplaintBusy(true);
    try {
      const response = await fetch("/api/community", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "complaint", ...complaint }),
      });
      const result = await response.json();
      setNotice(result.message ?? result.error ?? "تعذر إرسال الشكوى.");
      setNoticeIsError(!response.ok);
      if (response.ok) setComplaint({ name: "", phone: "", message: "" });
    } catch {
      setNotice("تعذر الاتصال بالإدارة. حاول مرة أخرى بعد قليل.");
      setNoticeIsError(true);
    } finally { setComplaintBusy(false); }
  }

  return <>
    <section className="community-market" aria-labelledby="community-market-title">
      <div className="section-heading directory-section-heading community-market-heading">
        <div>
          <span className="section-kicker">فرص وخدمات من أهل القرية</span>
          <h2 id="community-market-title"><HeartHandshake size={23}/>سوق جنزور المجتمعي</h2>
          <p>عمالة يومية، عقارات من أصحابها، وفرص عمل.. بمراجعة الإدارة قبل النشر.</p>
        </div>
        <span className="market-review-note"><ShieldCheck size={16}/>نشر بعد موافقة الإدارة</span>
      </div>

      <div className="market-category-grid" role="tablist" aria-label="أقسام سوق جنزور المجتمعي">
        {categories.map(({ id, title, description, icon: Icon }) => {
          const selected = active === id;
          const count = listings.filter((item) => item.type === id).length;
          return <button
            type="button"
            key={id}
            id={`market-tab-${id}`}
            role="tab"
            aria-selected={selected}
            aria-controls="market-listings-panel"
            className={`market-category-card market-category-${id}${selected ? " is-active" : ""}`}
            onClick={() => setActive(id)}
          >
            <span className="market-category-icon"><Icon size={27}/></span>
            <span className="market-category-copy"><strong>{title}</strong><small>{description}</small></span>
            <span className="market-category-count">{count}<small>{id === "labor" ? "عامل" : "إعلان"}</small></span>
            <ChevronLeft className="market-category-arrow" size={17}/>
          </button>;
        })}
      </div>

      <div className="market-action-row">
        <button type="button" className="market-submit" onClick={() => openAdForm()}>
          <Send size={17}/>أنشئ إعلانًا عن عقار أو وظيفة
        </button>
        {active === "labor" && <button type="button" className="market-worker-submit" onClick={() => { setNotice(""); setFormType("labor"); }}>
          <UserRound size={16}/>أضف بيانات عامل يومي
        </button>}
      </div>

      {formType && <form className="market-form" onSubmit={(event) => void submitListing(event)}>
        <div className="market-form-heading">
          <div><strong>{formType === "labor" ? "سجّل بياناتك في العمالة اليومية" : "إعلان جديد لسوق جنزور"}</strong><span>{formType === "labor" ? laborScopeNote : "سيصل للإدارة للمراجعة قبل ظهوره للناس."}</span></div>
          <button type="button" className="market-form-close" onClick={closeAdForm} aria-label="إغلاق نموذج الإعلان"><X size={18}/></button>
        </div>
        {formType !== "labor" && <div className="market-form-types" role="group" aria-label="نوع الإعلان">
          <button type="button" aria-pressed={formType === "property"} className={formType === "property" ? "is-active" : ""} onClick={() => setFormType("property")}><Building2 size={15}/>عقار</button>
          <button type="button" aria-pressed={formType === "job"} className={formType === "job" ? "is-active" : ""} onClick={() => setFormType("job")}><BriefcaseBusiness size={15}/>وظيفة</button>
        </div>}
        <div className="market-form-grid">
          <label>{formType === "labor" ? "اسم العامل" : "عنوان الإعلان"}<input name="title" required minLength={3} maxLength={160} placeholder={formType === "labor" ? "الاسم كما تحب أن يظهر" : formType === "property" ? "مثال: شقة للبيع في جنزور" : "مثال: مطلوب عامل أو موظف"}/></label>
          {formType === "labor" && <label>المهنة<input name="profession" required minLength={2} maxLength={120} placeholder="مثال: عامل هدم وتكسير، تشوين رمل وأسمنت، عامل مساعد"/></label>}
          <label className="market-form-wide">{formType === "labor" ? "تفاصيل إضافية (اختياري)" : "تفاصيل الإعلان"}<textarea name="description" required={formType !== "labor"} minLength={formType === "labor" ? undefined : 8} maxLength={2000} placeholder={formType === "labor" ? "الخبرة أو الخدمات المتاحة" : "اكتب التفاصيل المهمة بوضوح"}/></label>
          <label>رقم الهاتف<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx"/></label>
          <label>واتساب (اختياري)<input name="whatsapp" inputMode="tel" placeholder="لو مختلف عن رقم الهاتف"/></label>
          <label>المنطقة (اختياري)<input name="area" maxLength={100} placeholder="مثال: جنزور / السوق القديم"/></label>
          {formType !== "labor" && <label>{formType === "property" ? "السعر (اختياري)" : "الراتب أو الأجر (اختياري)"}<input name="price" maxLength={80} placeholder={formType === "property" ? "السعر أو قابل للتفاوض" : "يحدد بعد المقابلة"}/></label>}
        </div>
        <div className="market-form-footer"><span><ShieldCheck size={15}/>الإدارة تراجع الإعلان قبل نشره.</span><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "جارٍ الإرسال..." : "إرسال للمراجعة"}</button></div>
      </form>}

      {notice && <p className={`community-notice${noticeIsError ? " is-error" : ""}`} role={noticeIsError ? "alert" : "status"}>{notice}</p>}

      <div className="market-listings-panel" id="market-listings-panel" role="tabpanel" aria-labelledby={`market-tab-${active}`}>
        <div className="market-listings-heading">
          <div><span className="section-kicker">{typeLabels[active]}</span><h3>{active === "labor" ? "أهل الخبرة في جنزور" : active === "property" ? "عقارات معروضة من أصحابها" : "فرص عمل متاحة"}</h3></div>
          <span>{visible.length} {active === "labor" ? "عامل" : "إعلان"} منشور</span>
        </div>
        {active === "labor" && <p className="market-labor-scope"><Hammer size={14}/>{laborScopeNote} للنقاشة والسيراميك تصفح قسم الحرفيين في الدليل.</p>}
        {visible.length ? <div className="listing-grid">
          {visible.map((item) => active === "labor" ? <article className="worker-card" key={item.id}>
            <div className="worker-card-header"><span className="worker-avatar"><UserRound size={24}/></span><div><h4>{item.title}</h4><strong className="worker-profession">{item.profession || item.description || "عامل يومي"}</strong></div></div>
            {item.description && item.profession && <p className="worker-description">{item.description}</p>}
            <div className="worker-contact-details"><span><Phone size={14}/>رقم التواصل</span><a dir="ltr" href={`tel:${item.phone}`}>{item.phone}</a></div>
            {item.area && <div className="listing-location"><MapPin size={14}/>{item.area}</div>}
            <div className="listing-card-actions"><a className="listing-call" href={`tel:${item.phone}`}><Phone size={15}/>اتصل بالعامل</a><a className="listing-whatsapp" href={whatsappUrl(item.whatsapp || item.phone, `مرحبًا، بخصوص العمالة اليومية: ${item.title} - ${item.profession}`)} target="_blank" rel="noreferrer">واتساب</a></div>
          </article> : <article className={`listing-card listing-card-${item.type}`} key={item.id}>
            <div className="listing-card-top"><span>{item.area || "جنزور"}</span>{item.price && <strong>{item.price}</strong>}</div>
            <span className="listing-type-pill">{typeLabels[item.type]}</span>
            <h4>{item.title}</h4><p>{item.description}</p>
            <div className="listing-phone"><Phone size={14}/><a dir="ltr" href={`tel:${item.phone}`}>{item.phone}</a></div>
            <div className="listing-card-actions"><a className="listing-call" href={`tel:${item.phone}`}><Phone size={15}/>اتصال</a><a className="listing-whatsapp" href={whatsappUrl(item.whatsapp || item.phone, `مرحبًا، بخصوص: ${item.title}`)} target="_blank" rel="noreferrer">واتساب</a></div>
          </article>)}
        </div> : <div className="listing-empty"><HeartHandshake size={28}/><strong>{active === "labor" ? "لسه مفيش عمالة يومية منشورة" : "لا توجد إعلانات منشورة حاليًا"}</strong><span>{active === "labor" ? "أضف بياناتك، والإدارة هتراجعها قبل ظهورها." : "الإعلانات تظهر هنا فور موافقة الإدارة عليها."}</span></div>}
        {active === "labor" && <button type="button" className="market-worker-link" onClick={() => { setNotice(""); setFormType("labor"); }}><UserRound size={15}/>هل تعمل باليومية؟ أضف بياناتك هنا</button>}
      </div>

      <div className="trust-and-complaints">
        <div><ShieldCheck size={21}/><div><strong>ميثاق الأمانة المهنية</strong><p>النشر لا يعني ضمان المعاملة. اتفق بوضوح على السعر والتفاصيل قبل بدء أي تعامل.</p></div></div>
        <button type="button" aria-expanded={complaintOpen} onClick={() => setComplaintOpen((open) => !open)}>{complaintOpen ? "إغلاق الشكوى" : "شكوى أو ملاحظة للإدارة"}</button>
      </div>
      {complaintOpen && <form className="complaint-form" onSubmit={(event) => void sendComplaint(event)}>
        <h3>شكوى أو ملاحظة لمكتب الجمال</h3>
        <div className="market-form-row"><input required value={complaint.name} onChange={(event) => setComplaint({ ...complaint, name: event.target.value })} placeholder="الاسم"/><input required value={complaint.phone} onChange={(event) => setComplaint({ ...complaint, phone: event.target.value })} placeholder="رقم الهاتف"/></div>
        <textarea required value={complaint.message} onChange={(event) => setComplaint({ ...complaint, message: event.target.value })} placeholder="اكتب تفاصيل ملاحظتك"/>
        <button className="button button-soft" type="submit" disabled={complaintBusy}>{complaintBusy ? "جارٍ الإرسال..." : "إرسال الشكوى"}</button>
      </form>}
    </section>

    {announcement && <aside key={announcement.id} className={`community-floating-ad${announcementLeaving ? " is-leaving" : ""}`} aria-label="إعلان عقار أو وظيفة معتمد" aria-live="polite">
      <div className="community-floating-ad-top"><span><Megaphone size={16}/>إعلان معتمد من إدارة جنزور</span><button type="button" onClick={() => closeAnnouncement(announcement.id)} aria-label="إغلاق الإعلان الحالي"><X size={18}/></button></div>
      <span className={`community-floating-type is-${announcement.type}`}>{typeLabels[announcement.type]}</span>
      <h3>{announcement.title}</h3>
      <p>{announcement.description}</p>
      <div className="community-floating-meta">{announcement.area && <span><MapPin size={14}/>{announcement.area}</span>}{announcement.price && <strong>{announcement.price}</strong>}</div>
      <div className="community-floating-actions"><a href={`tel:${announcement.phone}`}><Phone size={15}/>اتصال</a><a href={whatsappUrl(announcement.whatsapp || announcement.phone, `مرحبًا، بخصوص: ${announcement.title}`)} target="_blank" rel="noreferrer">تواصل واتساب</a></div>
      {announcementQueue.length > 1 && <small className="community-floating-queue"><Check size={13}/>{announcementQueue.length} إعلانات معتمدة تتبدل تلقائيًا كل ١٠ ثوانٍ، ويمكنك إغلاق أي إعلان</small>}
    </aside>}
  </>;
}

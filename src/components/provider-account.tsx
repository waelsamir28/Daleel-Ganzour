"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { BellRing, RefreshCw, BadgeCheck, BadgePercent, CalendarClock, Camera, CheckCircle2, Clock3, ExternalLink, Lightbulb, LoaderCircle, Lock, MessageCircle, Pencil, Phone, QrCode, ShieldCheck, Star, Trash2, XCircle, Zap } from "lucide-react";
import { activeOffer, servicePhotoUrl, AVAILABILITY_HOURS, centerSubjectNames, daysSinceConfirmed, DATA_CONFIRM_MONTHS, getCategory, needsDataConfirmation, OFFER_MAX_DAYS, offerTimeLeft, recentlyExpiredOffer, type CenterSchedule, OFFICE_WHATSAPP, serviceStageIds, TEACHER_CENTER_ID, TEACHER_STAGES, TEACHERS_ROOT_ID, teacherSubjects, type CategoryRecord, type ServiceRecord, type TeacherStageId } from "@/lib/catalog";
import SelectField from "@/components/select-field";
import WorkingHoursEditor from "@/components/working-hours-editor";
import CenterScheduleEditor from "@/components/center-schedule-editor";
import CenterScheduleView from "@/components/center-schedule-view";
import { SpecialtyIcon, StickerIcon } from "@/components/ui";
import RatingStickerModal from "@/components/rating-sticker-modal";
import AvatarPicker from "@/components/avatar-picker";
import { rememberMyToken } from "@/lib/viewer-ownership";

type Props = { token: string; initial: ServiceRecord; categories: CategoryRecord[]; areas: string[] };
type Notice = { text: string; error: boolean } | null;

const statusLabel: Record<string, string> = { approved: "منشور على الدليل", pending: "قيد مراجعة الإدارة", "needs-info": "بانتظار استكمال بيانات", rejected: "مرفوض — تواصل مع الإدارة" };

/** صفحة «حسابي» لصاحب الخدمة: تعديل ذاتي عبر الرابط السري الذي أرسلته الإدارة على واتسابه. */
export default function ProviderAccount({ token, initial, categories, areas }: Props) {
  const [service, setService] = useState(initial);
  const [busy, setBusy] = useState<"" | "availability" | "quick" | "request" | "offer" | "confirm" | "photo">("");
  const [offerTitle, setOfferTitle] = useState(initial.offerTitle ?? "");
  const [offerDetails, setOfferDetails] = useState(initial.offerDetails ?? "");
  const [offerDays, setOfferDays] = useState(7);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 20000);
    return () => clearInterval(timer);
  }, []);
  // يتذكر هذا الجهاز أن صاحبه يملك المهنة → يستطيع تغيير صورته من دائرة الكارت في الدليل مباشرة.
  useEffect(() => { rememberMyToken(initial.id, token); }, [initial.id, token]);

  const category = getCategory(service.category, categories);
  const root = category.parentId ? getCategory(category.parentId, categories) : category;
  const roots = useMemo(() => categories.filter((item) => !item.parentId), [categories]);
  const live = service.availableNow && Boolean(service.availableUntil) && now > 0 && Date.parse(service.availableUntil!) > now;
  const remaining = live ? Date.parse(service.availableUntil!) - now : 0;
  const remainingLabel = live ? `${Math.floor(remaining / 3600000)} ساعة و${Math.max(1, Math.round((remaining % 3600000) / 60000))} دقيقة` : "";
  const pendingDraft = service.completionStatus === "submitted" ? service.completionDraft : null;

  // قسم البيانات السريعة
  const [description, setDescription] = useState(initial.description);
  const [hours, setHours] = useState(initial.hours);
  const [items, setItems] = useState(initial.serviceItems.join("، "));
  const [emergency, setEmergency] = useState(initial.emergency);
  const [stages, setStages] = useState<TeacherStageId[]>(serviceStageIds(initial));
  const isTeacher = root.id === TEACHERS_ROOT_ID;
  const isCenter = category.id === TEACHER_CENTER_ID;
  const [subjects, setSubjects] = useState<string[]>(centerSubjectNames(initial, categories));
  const subjectOptions = useMemo(() => teacherSubjects(categories), [categories]);
  const [schedule, setSchedule] = useState<CenterSchedule>(initial.schedule ?? []);
  const [schedulePreview, setSchedulePreview] = useState(false);
  // قسم البيانات الحساسة
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [phoneSecondary, setPhoneSecondary] = useState(initial.phoneSecondary);
  const [rootId, setRootId] = useState(root.id);
  const [specialtyId, setSpecialtyId] = useState(initial.category);
  const [area, setArea] = useState(initial.area);
  const [address, setAddress] = useState(initial.address);
  const specialties = useMemo(() => categories.filter((item) => item.parentId === rootId), [categories, rootId]);

  async function call(action: "availability" | "quick" | "request" | "offer" | "confirm" | "photo", payload: Record<string, unknown>) {
    if (busy) return;
    setBusy(action); setNotice(null);
    try {
      const response = await fetch("/api/my", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, action, ...payload }) });
      const result = await response.json();
      if (!response.ok || !result.service) throw new Error(result.error ?? "تعذر الحفظ. حاول مرة أخرى.");
      setService(result.service as ServiceRecord);
      setNotice({ text: result.message ?? "تم الحفظ.", error: false });
      if (navigator.vibrate) navigator.vibrate(12);
    } catch (caught) { setNotice({ text: caught instanceof Error ? caught.message : "تعذر الاتصال. حاول مرة أخرى.", error: true }); }
    finally { setBusy(""); }
  }

  function submitQuick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let workingHours: unknown = [];
    try { workingHours = JSON.parse(String(form.get("workingHours") || "[]")); } catch { workingHours = []; }
    const serviceItems = items.split(/[،,\n]/).map((item) => item.trim()).filter(Boolean);
    void call("quick", { description, hours, workingHours, serviceItems, emergency, ...(isTeacher ? { stages } : {}), ...(isCenter ? { subjects, schedule } : {}) });
  }

  function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void call("offer", { offer: { title: offerTitle, details: offerDetails, days: offerDays } });
  }
  const currentOffer = activeOffer(service, now || undefined);
  const expiredOffer = currentOffer ? null : recentlyExpiredOffer(service, now || undefined);
  const offerEndingSoon = currentOffer ? offerTimeLeft(currentOffer, now || undefined).days < 3 : false;
  /** «جدّد العرض» بضغطة واحدة: نفس العنوان والتفاصيل، بمدة جديدة. */
  function renewOffer(offer: { title: string; details: string }, days: number) { void call("offer", { offer: { title: offer.title, details: offer.details, days } }); }
  const stale = needsDataConfirmation(service, now || undefined);
  const sinceDays = daysSinceConfirmed(service, now || undefined);

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void call("request", { name, phone, phoneSecondary, category: specialtyId, area, address });
  }

  const publicUrl = category.parentId ? `/categories/${root.id}/${category.id}` : `/categories/${root.id}`;

  return <>
    <section className="availability-card my-hero">
      <div className="my-hero-head">
        <span className="my-hero-icon has-profession-art has-sticker"><SpecialtyIcon category={category} size={64} sticker/></span>
        <div>
          <span className="my-hero-kicker"><ShieldCheck size={14}/> حسابك الخاص على دليل جنزور</span>
          <h1>{service.name}</h1>
          <p>{category.name}{category.parentId ? ` • قسم ${root.name}` : ""} • {service.area}</p>
        </div>
      </div>
      <div className="my-chips">
        <span className={`my-chip ${service.status === "approved" ? "is-ok" : "is-wait"}`}>{service.status === "approved" ? <BadgeCheck size={14}/> : <Clock3 size={14}/>} {statusLabel[service.status] ?? service.status}</span>
        {service.verified && <span className="my-chip is-ok"><CheckCircle2 size={14}/> موثّق</span>}
        {service.featured && <span className="my-chip is-star"><Star size={14}/> مميّز</span>}
        {Number(service.reviews) > 0 && <span className="my-chip"><Star size={14}/> {service.rating} ({service.reviews} تقييم)</span>}
      </div>
      {service.status === "approved" && <a className="my-link" href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> شاهد بطاقتك كما يراها الزوار</a>}
      <p className="availability-hint"><Lock size={15}/> هذا الرابط سري وخاص بك: لا تشاركه مع أحد. لو تسرّب اطلب من الإدارة تجديده.</p>
    </section>

    {notice && <p className={`availability-result ${notice.error ? "is-error" : "is-ok"} my-notice`} role="status">{notice.error ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {notice.text}</p>}

    {stale && (
      <section className="availability-card my-confirm" role="alert">
        <CalendarClock size={30}/>
        <div>
          <strong>مرّ {sinceDays >= 365 ? `أكثر من سنة` : `${Math.floor(sinceDays / 30)} شهرًا`} على آخر تحديث لبياناتك</strong>
          <span>نطلب من كل مهني مراجعة بياناته كل {DATA_CONFIRM_MONTHS} أشهر حتى يظل الدليل دقيقًا. لو كل شيء صحيح اضغط الزر، أو عدّل ما تغيّر في الأقسام بالأسفل.</span>
        </div>
        <button type="button" className="availability-renew is-blue" onClick={() => void call("confirm", {})} disabled={busy !== ""}>{busy === "confirm" ? <LoaderCircle size={20} className="spin"/> : <CheckCircle2 size={20}/>} بياناتي صحيحة ✓</button>
      </section>
    )}

    {service.status === "approved" && (
      <section className="availability-card my-tools">
        <header className="my-section-head"><QrCode size={18}/><div><h2>ملصق التقييم للمحل</h2><span>ملصق A6 جاهز للطباعة: العميل يمسح الرمز فيفتح بطاقتك على نافذة التقييم مباشرة.</span></div></header>
        <button type="button" className="button button-primary" onClick={() => setStickerOpen(true)}><QrCode size={16}/> تجهيز ملصق «امسح لتقييمنا»</button>
      </section>
    )}

    <section className="availability-card my-photo">
      <header className="my-section-head"><Camera size={18}/><div><h2>الصورة الشخصية</h2><span>تظهر في دائرة على بطاقتك وفي صفحة التفاصيل. اختر صورة، قصّها، ثم تُحفظ فورًا.</span></div></header>
      <AvatarPicker value={undefined} currentUrl={servicePhotoUrl(service)} hint="صورتك أو لوجو المحل — حتى 3 ميجابايت، ونقصّها ونضغطها تلقائيًا قبل الرفع." onChange={(next) => { if (next !== undefined) void call("photo", { photo: next }); }}/>
      {busy === "photo" && <p className="my-inline-status"><LoaderCircle size={15} className="spin"/> جاري حفظ الصورة…</p>}
    </section>

    <form className="availability-card my-form my-offer" onSubmit={submitOffer}>
      <header className="my-section-head"><BadgePercent size={18}/><div><h2>عرض أو خصم مؤقت</h2><span>يظهر وسم «عرض» على بطاقتك ويدخل صف «عروض الأسبوع» في الصفحة الرئيسية، وينتهي تلقائيًا (حتى {OFFER_MAX_DAYS} يومًا).</span></div></header>
      {(expiredOffer || (currentOffer && offerEndingSoon)) && (() => {
        const target = (expiredOffer ?? currentOffer)!;
        return <div className={`my-offer-renew ${expiredOffer ? "is-expired" : ""}`} role="status">
          <div className="my-offer-renew-text">
            <BellRing size={18} aria-hidden="true"/>
            <div>
              <strong>{expiredOffer ? "انتهى عرضك «" + target.title + "»" : `عرضك «${target.title}» ينتهي قريبًا — ${offerTimeLeft(currentOffer!, now || undefined).label}`}</strong>
              <span>جدّده بضغطة واحدة بنفس العنوان والتفاصيل:</span>
            </div>
          </div>
          <div className="my-offer-renew-actions">
            {[7, 14, 30].map((days) => <button type="button" key={days} className="my-offer-renew-btn" disabled={busy !== ""} onClick={() => renewOffer(target, days)}><RefreshCw size={14}/> جدّد {days} يوم</button>)}
          </div>
        </div>;
      })()}
      {currentOffer && (
        <div className="my-offer-current">
          <BadgePercent size={18}/>
          <div><strong>{currentOffer.title}</strong>{currentOffer.details && <span>{currentOffer.details}</span>}<small className={offerTimeLeft(currentOffer, now || undefined).urgent ? "is-urgent" : ""}>{offerTimeLeft(currentOffer, now || undefined).label}</small></div>
          <button type="button" className="my-offer-remove" onClick={() => void call("offer", { offer: null })} disabled={busy !== ""} aria-label="إلغاء العرض"><Trash2 size={16}/> إلغاء</button>
        </div>
      )}
      <div className="my-two">
        <label className="my-field">عنوان العرض<input value={offerTitle} onChange={(event) => setOfferTitle(event.target.value)} maxLength={120} minLength={3} required placeholder="مثال: خصم ٢٠٪ على التركيب"/></label>
        <label className="my-field">المدة بالأيام<input type="number" min={1} max={OFFER_MAX_DAYS} value={offerDays} onChange={(event) => setOfferDays(Math.min(OFFER_MAX_DAYS, Math.max(1, Number(event.target.value) || 1)))}/></label>
      </div>
      <label className="my-field">تفاصيل مختصرة (اختياري)<input value={offerDetails} onChange={(event) => setOfferDetails(event.target.value)} maxLength={300} placeholder="شروط العرض أو ما يشمله"/></label>
      <button type="submit" className="availability-renew is-blue" disabled={busy !== "" || offerTitle.trim().length < 3}>{busy === "offer" ? <LoaderCircle size={20} className="spin"/> : <BadgePercent size={20}/>} {currentOffer ? "تحديث العرض" : "نشر العرض الآن"}</button>
    </form>

    <section className="availability-card">
      <div className={`availability-status ${live ? "is-live" : ""}`}>
        {live ? <CheckCircle2 size={26}/> : <XCircle size={26}/>}
        <div><strong>{live ? "أنت «متاح الآن» على الدليل" : "غير متاح الآن"}</strong><span>{live ? `تنتهي الإتاحة بعد ${remainingLabel} تقريبًا` : "فعّلها حين تكون جاهزًا لاستقبال الاتصالات فورًا"}</span></div>
      </div>
      <div className="my-actions">
        <button type="button" className="availability-renew" onClick={() => void call("availability", { state: "activate" })} disabled={busy !== ""}>
          {busy === "availability" ? <LoaderCircle size={22} className="spin"/> : <Lightbulb size={22}/>}
          {live ? `تمديد ${AVAILABILITY_HOURS} ساعات إضافية` : `متاح الآن لمدة ${AVAILABILITY_HOURS} ساعات`}
        </button>
        {live && <button type="button" className="my-stop" onClick={() => void call("availability", { state: "stop" })} disabled={busy !== ""}>إيقاف الآن</button>}
      </div>
    </section>

    <form className="availability-card my-form" onSubmit={submitQuick}>
      <header className="my-section-head"><Zap size={18}/><div><h2>بياناتي السريعة</h2><span>تُحفظ وتظهر للزوار فورًا بدون انتظار.</span></div></header>
      <label className="my-field"><span className="field-label-green">وصف الخدمة</span> <small className="field-optional">(اختياري)</small><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={1000} placeholder="اكتب ما تقدمه بوضوح: خبرتك، ما يميزك، نطاق عملك…"/></label>
      <label className="my-field">قائمة خدماتك التفصيلية<input value={items} onChange={(event) => setItems(event.target.value)} maxLength={1200} placeholder="افصل بينها بفاصلة: تركيب، صيانة، طوارئ…"/><small>حتى ٢٠ خدمة، تظهر كشارات على بطاقتك.</small></label>
      <label className="my-field">مواعيد العمل (نص مختصر)<input value={hours} onChange={(event) => setHours(event.target.value)} maxLength={120} placeholder="مثال: يوميًا من ٩ صباحًا حتى ١٠ مساءً عدا الجمعة"/></label>
      <WorkingHoursEditor initial={service.workingHours}/>
      {isCenter && <div className="my-field"><span>📚 المواد المتاحة في السنتر (تظهر على بطاقتك ويظهر السنتر في صفحة كل مادة)</span><div className="field-suggestions" aria-label="مواد السنتر">{subjectOptions.map((subject) => <button key={subject.id} type="button" className={`suggestion-chip ${subjects.includes(subject.name) ? "is-selected" : ""}`} onClick={() => setSubjects((curr) => curr.includes(subject.name) ? curr.filter((item) => item !== subject.name) : [...curr, subject.name])}>{subjects.includes(subject.name) ? "✓ " : "+ "}{subject.name}</button>)}</div></div>}
      {isCenter && <div className="my-field"><CenterScheduleEditor value={schedule} onChange={setSchedule} subjects={subjects.length ? subjects : subjectOptions.map((subject) => subject.name)}/>{schedule.length > 0 && <><button type="button" className="button button-soft" onClick={() => setSchedulePreview((open) => !open)}>{schedulePreview ? "إخفاء المعاينة" : "معاينة الجدول ومشاركته صورة"}</button>{schedulePreview && <CenterScheduleView name={service.name} schedule={schedule}/>}</>}</div>}
      {isTeacher && <div className="my-field stage-picker-field"><span>🎓 المراحل التي أدرّسها (تظهر على بطاقتك وتحدد أين يجدك الطلاب)</span><div className="stage-picker-options" aria-label="المراحل الدراسية">{TEACHER_STAGES.map((stage) => <label key={stage.id} className={`stage-picker-option ${stages.includes(stage.id) ? "is-selected" : ""}`} style={{ "--stage-color": stage.color } as CSSProperties}><input type="checkbox" checked={stages.includes(stage.id)} onChange={() => setStages((curr) => curr.includes(stage.id) ? curr.filter((id) => id !== stage.id) : [...curr, stage.id])}/><StickerIcon src={stage.sticker} size={38}/><span>{stage.name}</span></label>)}</div><small>لو لم تحدد مرحلة ستظهر في كل المراحل.</small></div>}
      <label className="my-check"><input type="checkbox" checked={emergency} onChange={(event) => setEmergency(event.target.checked)}/>أستقبل حالات الطوارئ خارج المواعيد</label>
      <button type="submit" className="availability-renew is-blue" disabled={busy !== ""}>{busy === "quick" ? <LoaderCircle size={20} className="spin"/> : <CheckCircle2 size={20}/>} حفظ ونشر فورًا</button>
    </form>

    <form className="availability-card my-form" onSubmit={submitRequest}>
      <header className="my-section-head"><Pencil size={18}/><div><h2>بيانات تحتاج موافقة الإدارة</h2><span>الاسم والهاتف والتخصص والعنوان تُراجع أولًا حمايةً لك من التلاعب، ثم تُنشر.</span></div></header>
      {pendingDraft && <p className="my-pending"><Clock3 size={15}/> لديك طلب تعديل قيد المراجعة منذ {pendingDraft.updatedAt ? new Date(pendingDraft.updatedAt).toLocaleDateString("ar-EG") : "قليل"}؛ إرسال طلب جديد يستبدله.</p>}
      {service.completionStatus === "rejected" && service.completionNote && <p className="my-pending is-rejected"><XCircle size={15}/> ردّت الإدارة طلبك السابق: {service.completionNote}</p>}
      <label className="my-field">اسم الخدمة أو صاحبها<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={160} required/></label>
      <div className="my-two">
        <label className="my-field"><span><Phone size={13}/> رقم الهاتف الأساسي</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" dir="ltr" required placeholder="01xxxxxxxxx"/></label>
        <label className="my-field">رقم إضافي (اختياري)<input value={phoneSecondary} onChange={(event) => setPhoneSecondary(event.target.value)} inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx"/></label>
      </div>
      <div className="my-two">
        <label className="my-field">القسم الرئيسي<SelectField value={rootId} onChange={(event) => { setRootId(event.target.value); setSpecialtyId(""); }}>{roots.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></label>
        <label className="my-field">التخصص<SelectField value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)} required><option value="" disabled>اختر التخصص</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></label>
      </div>
      <div className="my-two">
        <label className="my-field">المنطقة<SelectField value={area} onChange={(event) => setArea(event.target.value)} required>{!areas.includes(area) && <option value={area}>{area}</option>}{areas.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField></label>
        <label className="my-field">العنوان التفصيلي<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={240} placeholder="الشارع، بجوار…"/></label>
      </div>
      <button type="submit" className="availability-renew is-amber" disabled={busy !== "" || !specialtyId}>{busy === "request" ? <LoaderCircle size={20} className="spin"/> : <Pencil size={20}/>} إرسال التعديل للإدارة</button>
    </form>

    {stickerOpen && <RatingStickerModal name={service.name} category={category.name} serviceId={service.id} siteName="دليل جنزور" onClose={() => setStickerOpen(false)}/>}
    <a className="availability-contact" href={OFFICE_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> تحتاج مساعدة أو حذف بياناتك؟ تواصل مع الإدارة</a>
  </>;
}

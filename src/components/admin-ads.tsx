"use client";
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BadgeDollarSign, CalendarDays, Check, Clapperboard, Clock3, ImagePlus, Inbox, LayoutTemplate, LoaderCircle, MessageCircle, Palette, Pencil, Plus, Power, RotateCcw, Save, Sparkles, Trash2, Upload, UserRound, Wand2, X } from "lucide-react";
import SelectField from "@/components/select-field";
import AdTemplateArt from "@/components/ad-template-art";
import { AD_ACCENT_PRESETS, AD_CURRENCY, AD_IMAGE_MAX_BYTES, AD_MAX_COUNT, AD_MAX_SECONDS, AD_MIN_SECONDS, AD_MOTIONS, AD_REQUEST_KINDS, AD_TRANSITIONS, adImageUrl, adTemplates, autoTemplateService, defaultAdPricing, formatEgp, getCategory, isAdLive, whatsappUrl, type AdBannerRecord, type AdPricing, type AdRequestRecord, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { adAccentStyle } from "@/components/ad-rotator";
import { shrinkImageFile } from "@/lib/client-image";

type Mutate = (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, success?: string) => Promise<boolean>;
type Source = "upload" | "template";
type Draft = { source: Source; template: string; title: string; caption: string; serviceId: string; whatsapp: string; durationSeconds: string; startsAt: string; endsAt: string; active: boolean; image: string; imageName: string; transition: string; motion: string; accentColor: string; removeImage: boolean };
const emptyDraft: Draft = { source: "upload", template: "", title: "", caption: "", serviceId: "", whatsapp: "", durationSeconds: "6", startsAt: "", endsAt: "", active: true, image: "", imageName: "", transition: "random", motion: "kenburns", accentColor: "", removeImage: false };

function toDateInput(value: string | null) { return value ? value.slice(0, 10) : ""; }
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

type Props = {
  ads: AdBannerRecord[]; requests: AdRequestRecord[]; services: ServiceRecord[]; categories: CategoryRecord[]; busy: string | null; mutate: Mutate;
  siteName: string; logoUrl: string; pricing: AdPricing; onConfirmDelete: (ad: AdBannerRecord) => void; onConfirmDeleteRequest: (request: AdRequestRecord) => void;
};

/** Admin tab: upload or pick ready-made animated banners, order/schedule them, and manage the EGP price list. */
export default function AdminAds({ ads, requests, services, categories, busy, mutate, siteName, logoUrl, pricing, onConfirmDelete, onConfirmDeleteRequest }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const providerOptions = useMemo(() => [{ value: "", label: "بدون ربط بصفحة مهني" }, ...services.filter((service) => service.status === "approved").map((service) => ({ value: service.id, label: `${service.name} — ${categories.find((category) => category.id === service.category)?.name ?? service.category}` }))], [services, categories]);
  const editing = editingId ? ads.find((ad) => ad.id === editingId) ?? null : null;
  const live = ads.filter((ad) => isAdLive(ad)).length;
  const autoFor = (template: string) => { const service = autoTemplateService(template, services, categories); return { service, categoryName: service ? getCategory(service.category, categories).name : "" }; };
  const artProps = { siteName, logoUrl, pricing };
  const weekly = autoFor(draft.template).service;

  function startCreate(source: Source = "upload", template = "", prefill: Partial<Draft> = {}) {
    setEditingId(null); setError(""); setOpen(true);
    const meta = adTemplates.find((item) => item.id === template);
    setDraft({ ...emptyDraft, source, template, title: meta?.title ?? "", caption: meta?.caption ?? "", ...prefill });
    window.setTimeout(() => document.getElementById("admin-ad-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function startEdit(ad: AdBannerRecord) {
    setEditingId(ad.id); setError(""); setOpen(true);
    setDraft({ source: ad.template ? "template" : "upload", template: ad.template, title: ad.title, caption: ad.caption, serviceId: ad.serviceId ?? "", whatsapp: ad.whatsapp, durationSeconds: String(ad.durationSeconds), startsAt: toDateInput(ad.startsAt), endsAt: toDateInput(ad.endsAt), active: ad.active, image: "", imageName: "", transition: ad.transition || "random", motion: ad.motion || "kenburns", accentColor: ad.accentColor || "", removeImage: false });
    window.setTimeout(() => document.getElementById("admin-ad-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function pickTemplate(id: string) {
    const meta = adTemplates.find((item) => item.id === id);
    setDraft((current) => {
      const previous = adTemplates.find((item) => item.id === current.template);
      const keepTitle = current.title && current.title !== (previous?.title ?? "");
      const keepCaption = current.caption && current.caption !== (previous?.caption ?? "");
      return { ...current, source: "template", template: id, title: keepTitle ? current.title : meta?.title ?? "", caption: keepCaption ? current.caption : meta?.caption ?? "" };
    });
  }
  function pickProvider(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    setDraft((current) => ({ ...current, serviceId, title: current.title || service?.name || "", whatsapp: current.whatsapp || service?.phone || "" }));
  }
  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(gif|png|jpeg|webp)$/.test(file.type)) { setError("ارفع ملف GIF أو PNG أو JPG أو WebP فقط."); event.target.value = ""; return; }
    if (file.size > AD_IMAGE_MAX_BYTES) { setError(`حجم الملف ${(file.size / 1024 / 1024).toFixed(1)} ميجا. الحد الأقصى ٣ ميجا — صغّر الـ GIF (مثلًا بتقليل الأبعاد إلى 1200×400 أو عدد الإطارات).`); event.target.value = ""; return; }
    try {
      // الصور الثابتة تُصغَّر داخل المتصفح قبل الرفع (حتى 1600×800)؛ GIF يُرفع كما هو حفاظًا على الحركة.
      const image = file.type === "image/gif" ? await readFileAsDataUrl(file) : (await shrinkImageFile(file, { maxWidth: 1600, maxHeight: 800, quality: 0.86 })).dataUrl;
      setDraft((current) => ({ ...current, image, imageName: file.name, removeImage: false, ...(current.source === "template" ? {} : { template: "" })
 }));
    }
    catch { setError("تعذر قراءة الملف. جرّب ملفًا آخر."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const usingTemplate = draft.source === "template" && draft.template;
    if (draft.source === "template" && !draft.template) { setError("اختر قالبًا من القوالب الجاهزة."); return; }
    if (!usingTemplate && !editing?.hasImage && !draft.image) { setError("ارفع صورة الإعلان المتحركة أولًا أو اختر قالبًا جاهزًا."); return; }
    const values: Record<string, unknown> = { title: draft.title, caption: draft.caption, serviceId: draft.serviceId || null, whatsapp: draft.whatsapp, durationSeconds: Number(draft.durationSeconds || 6), startsAt: draft.startsAt ? `${draft.startsAt}T00:00:00` : null, endsAt: draft.endsAt ? `${draft.endsAt}T23:59:59` : null, active: draft.active, template: usingTemplate ? draft.template : "", transition: draft.transition, motion: draft.motion, accentColor: draft.accentColor, removeImage: usingTemplate && draft.removeImage, ...(draft.image ? { image: draft.image } : {}) };
    const ok = editing ? await mutate("PATCH", { type: "ad", id: editing.id, action: "edit", values }, "تم حفظ الإعلان.") : await mutate("POST", { type: "ad", values }, "تم نشر الإعلان في المساحة الإعلانية.");
    if (ok) { setOpen(false); setDraft(emptyDraft); setEditingId(null); }
  }

  const previewTemplate = draft.source === "template" ? draft.template : "";
  const existingImage = editing?.hasImage && !draft.removeImage ? adImageUrl(editing) : "";
  const previewImage = draft.image || existingImage;
  const pendingRequests = requests.filter((request) => request.status !== "handled");
  function convertRequest(request: AdRequestRecord) {
    const source: Source = request.kind === "template" ? "template" : "upload";
    const template = source === "template" ? request.template || "special-offer" : "";
    const matched = services.find((service) => service.phone === request.phone);
    startCreate(source, template, { title: request.business || request.name, caption: request.notes.slice(0, 240), whatsapp: request.phone, serviceId: matched?.id ?? "" });
  }

  return <div className="admin-ads">
    <section className="admin-ads-hero">
      <div className="admin-ads-hero-copy">
        <h2><Clapperboard size={22}/> المساحة الإعلانية المتحركة</h2>
        <p>تظهر فوق إطار «بحث / أضف مهنتك» في كل صفحات الدليل. ارفع GIF من جهازك أو اختر قالبًا متحركًا جاهزًا، واربط كل إعلان بصفحة المعلن ورقم واتسابه.</p>
        <div className="admin-ads-stats">
          <span><b>{ads.length}</b> / {AD_MAX_COUNT} إعلان</span>
          <span><b>{live}</b> يُعرض الآن</span>
          <span><b>{ads.filter((ad) => ad.template).length}</b> قالب جاهز</span>
        </div>
      </div>
      <div className="admin-ads-hero-actions">
        <button type="button" className="button button-primary" onClick={() => startCreate("upload")} disabled={ads.length >= AD_MAX_COUNT}><Upload size={17}/> رفع GIF من الجهاز</button>
        <button type="button" className="button button-soft" onClick={() => startCreate("template", "ad-space")} disabled={ads.length >= AD_MAX_COUNT}><LayoutTemplate size={17}/> قالب جاهز</button>
      </div>
    </section>
    {ads.length >= AD_MAX_COUNT && <div className="form-notice notice-amber"><span>وصلت للحد الأقصى ({AD_MAX_COUNT} إعلانات). احذف إعلانًا قديمًا لإضافة غيره.</span></div>}

    {open && (
      <form id="admin-ad-form" className="admin-ad-form" onSubmit={submit}>
        <div className="admin-ad-form-head">
          <strong>{editing ? <><Pencil size={16}/> تعديل إعلان: {editing.title}</> : <><Plus size={16}/> إعلان جديد</>}</strong>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={16}/></button>
        </div>

        <div className="admin-ad-source-tabs" role="tablist" aria-label="مصدر الإعلان">
          <button type="button" role="tab" aria-selected={draft.source === "upload"} className={draft.source === "upload" ? "is-active" : ""} onClick={() => setDraft({ ...draft, source: "upload" })}><Upload size={15}/> رفع صورة من الجهاز</button>
          <button type="button" role="tab" aria-selected={draft.source === "template"} className={draft.source === "template" ? "is-active" : ""} onClick={() => pickTemplate(draft.template || "ad-space")}><LayoutTemplate size={15}/> قالب متحرك جاهز</button>
        </div>

        <div className="admin-ad-form-grid">
          <div className="admin-ad-form-main">
            {draft.source === "template" && (
              <div className="admin-ad-templates" role="radiogroup" aria-label="القوالب الجاهزة">
                {adTemplates.map((template) => {
                  const auto = template.auto ? autoFor(template.id) : { service: null, categoryName: "" };
                  return (
                  <button type="button" key={template.id} role="radio" aria-checked={draft.template === template.id} className={`admin-ad-template ${draft.template === template.id ? "is-selected" : ""}`} onClick={() => pickTemplate(template.id)}>
                    <span className="admin-ad-template-art" style={adAccentStyle(draft.accentColor)}><AdTemplateArt template={template.id} {...artProps} {...auto} compact/></span>
                    <span className="admin-ad-template-name">{template.name}{template.auto && <em className="admin-ad-auto-chip">تلقائي</em>}</span>
                    <small>{template.description}</small>
                  </button>
                  );
                })}
              </div>
            )}
            {(
              <label className={`admin-ad-dropzone ${draft.source === "template" ? "is-optional" : ""}`}>
                <input ref={fileInput} type="file" accept="image/gif,image/png,image/jpeg,image/webp" onChange={(event) => void onFile(event)}/>
                <span className="admin-ad-dropzone-icon"><ImagePlus size={26}/></span>
                <strong>{draft.imageName ? draft.imageName : draft.source === "template" ? "صورة خلفية للقالب (اختياري) — اضغط للاختيار" : "اضغط لاختيار GIF / صورة من جهازك"}</strong>
                <small>{existingImage && !draft.image ? "توجد صورة محفوظة؛ اترك الحقل فارغًا للإبقاء عليها." : draft.source === "template" ? "صورة أو GIF تظهر خلف القالب بتدرّج بلون المعلن. حتى ٣ ميجا." : "GIF أو PNG أو JPG أو WebP — حتى ٣ ميجا. الأفضل 1200×400 بكسل (3:1)."}</small>
                {draft.source === "template" && (existingImage || draft.image) && <button type="button" className="button button-soft button-small admin-ad-remove-bg" onClick={(event) => { event.preventDefault(); setDraft({ ...draft, image: "", imageName: "", removeImage: true }); if (fileInput.current) fileInput.current.value = ""; }}><X size={13}/> إزالة الخلفية</button>}
              </label>
            )}

            <div className="admin-ad-fx">
              <label className="admin-ad-field">
                <span><Wand2 size={13}/> حركة الانتقال بين الإعلانات</span>
                <SelectField value={draft.transition} onChange={(event) => setDraft({ ...draft, transition: event.target.value })} options={AD_TRANSITIONS.map((item) => ({ value: item.id, label: item.name }))} aria-label="حركة الانتقال"/>
              </label>
              <label className="admin-ad-field">
                <span><Sparkles size={13}/> حركة الإعلان أثناء العرض</span>
                <SelectField value={draft.motion} onChange={(event) => setDraft({ ...draft, motion: event.target.value })} options={AD_MOTIONS.map((item) => ({ value: item.id, label: item.name }))} aria-label="حركة العرض"/>
              </label>
              <div className="admin-ad-field admin-ad-field-wide">
                <span><Palette size={13}/> لون المعلن (يلوّن القالب والخلفية)</span>
                <div className="admin-ad-colors">
                  <button type="button" className={`admin-ad-color is-none ${!draft.accentColor ? "is-selected" : ""}`} onClick={() => setDraft({ ...draft, accentColor: "" })} title="اللون الافتراضي للقالب"><RotateCcw size={13}/></button>
                  {AD_ACCENT_PRESETS.map((color) => <button type="button" key={color} className={`admin-ad-color ${draft.accentColor === color ? "is-selected" : ""}`} style={{ background: color }} onClick={() => setDraft({ ...draft, accentColor: color })} aria-label={`لون ${color}`}>{draft.accentColor === color && <Check size={13}/>}</button>)}
                  <label className="admin-ad-color-custom" title="لون مخصص"><input type="color" value={draft.accentColor || "#0b63c9"} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })}/><span>مخصص</span></label>
                </div>
              </div>
            </div>

            {draft.source === "template" && adTemplates.find((item) => item.id === draft.template)?.auto && (
              <div className="form-notice admin-ad-auto-note"><span>هذا القالب تلقائي: يعرض كل أسبوع أعلى مهني تقييمًا ({weekly ? `حاليًا: ${weekly.name}` : "لا يوجد مهني بتقييم بعد"}) ويربط الأزرار بصفحته وواتسابه. لا حاجة لاختيار مهني أو رقم.</span></div>
            )}
            <div className="admin-ad-fields">
              <label className="admin-ad-field admin-ad-field-wide">
                <span>المعلن مرتبط بصفحة في الدليل</span>
                <SelectField value={draft.serviceId} onChange={(event) => pickProvider(event.target.value)} options={providerOptions} aria-label="اختيار صفحة المهني"/>
              </label>
              <label className="admin-ad-field">
                <span>عنوان الإعلان (اسم المعلن)</span>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required minLength={2} maxLength={120} placeholder="مثال: عيادة د. سارة أحمد"/>
              </label>
              <label className="admin-ad-field">
                <span>واتساب المعلن (اختياري)</span>
                <input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })} dir="ltr" inputMode="tel" maxLength={16} placeholder="01xxxxxxxxx"/>
              </label>
              <label className="admin-ad-field admin-ad-field-wide">
                <span>سطر وصفي قصير (اختياري)</span>
                <input value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} maxLength={240} placeholder="مثال: خصم ٢٠٪ على الكشف طوال شهر رمضان"/>
              </label>
              <label className="admin-ad-field">
                <span><Clock3 size={13}/> مدة العرض بالثواني ({AD_MIN_SECONDS}–{AD_MAX_SECONDS})</span>
                <input type="number" min={AD_MIN_SECONDS} max={AD_MAX_SECONDS} value={draft.durationSeconds} onChange={(event) => setDraft({ ...draft, durationSeconds: event.target.value })}/>
              </label>
              <label className="admin-ad-field">
                <span><CalendarDays size={13}/> يبدأ من (اختياري)</span>
                <input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}/>
              </label>
              <label className="admin-ad-field">
                <span><CalendarDays size={13}/> ينتهي في (اختياري)</span>
                <input type="date" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}/>
              </label>
              <label className="admin-ad-switch">
                <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })}/>
                <span>الإعلان مفعّل ويظهر للزوار</span>
              </label>
            </div>
          </div>

          <aside className="admin-ad-form-side">
            <span className="admin-ad-side-title">معاينة حيّة</span>
            <div className="admin-ad-preview">
              {previewTemplate ? <div className={`admin-ad-preview-art ad-motion-${draft.motion}`} style={adAccentStyle(draft.accentColor)}><AdTemplateArt template={previewTemplate} title={draft.title} caption={draft.caption} {...artProps} {...autoFor(previewTemplate)} backgroundUrl={previewImage} animated/></div>
                : previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Local data-URL / database-served preview.
                  <img src={previewImage} alt="معاينة الإعلان"/>
                ) : <span className="admin-ad-preview-empty"><ImagePlus size={22}/> ارفع صورة أو اختر قالبًا لتظهر المعاينة هنا</span>}
            </div>
            <ul className="admin-ad-tips">
              <li>الإعلان يظهر بنفس مقاس إطار البحث في الرئيسية وكل الأقسام.</li>
              <li>القالب الجاهز يستخدم اسم الموقع وشعاره تلقائيًا، وعنوانك ووصفك يظهران عليه.</li>
              <li>اربط الإعلان بمهني ليظهر زر «صفحته في الدليل».</li>
            </ul>
          </aside>
        </div>

        {error && <div className="form-error admin-ad-error" role="alert">{error}</div>}
        <div className="admin-ad-form-actions">
          <button className="button button-primary" type="submit" disabled={busy === "saving" || busy === editing?.id}>{busy ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} {editing ? "حفظ التعديلات" : "نشر الإعلان"}</button>
          <button className="button button-soft" type="button" onClick={() => setOpen(false)}>إلغاء</button>
        </div>
      </form>
    )}

    <section className="admin-ad-requests">
      <h3 className="admin-ads-section-title"><Inbox size={17}/> طلبات الإعلانات من صفحة «أعلن معنا» <span>{pendingRequests.length}</span></h3>
      {requests.length ? <div className="admin-ad-requests-list">
        {requests.map((request) => (
          <article key={request.id} className={`admin-ad-request ${request.status === "handled" ? "is-handled" : ""}`}>
            <div className="admin-ad-request-info">
              <h4>{request.business || request.name}<span className={`status-badge ${request.status === "handled" ? "status-approved" : "status-pending"}`}>{request.status === "handled" ? "تمت المعالجة" : "جديد"}</span></h4>
              <p>
                <span><UserRound size={12}/> {request.name}</span>
                <span dir="ltr"><MessageCircle size={12}/> {request.phone}</span>
                {request.tierLabel && <span><BadgeDollarSign size={12}/> {request.tierLabel}</span>}
                <span><LayoutTemplate size={12}/> {AD_REQUEST_KINDS[request.kind] ?? request.kind}{request.template ? ` — ${adTemplates.find((item) => item.id === request.template)?.name ?? request.template}` : ""}</span>
                <span><CalendarDays size={12}/> {new Date(request.createdAt).toLocaleDateString("ar-EG")}</span>
              </p>
              {request.notes && <blockquote>{request.notes}</blockquote>}
            </div>
            <div className="admin-ad-actions">
              <button type="button" className="button button-primary button-small" onClick={() => convertRequest(request)} disabled={ads.length >= AD_MAX_COUNT}><Wand2 size={14}/> حوّله لإعلان</button>
              <a className="button button-whatsapp button-small" href={whatsappUrl(request.phone, `مرحبًا ${request.name}، وصلنا طلبك لإعلان «${request.business || ""}» في ${siteName}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> واتساب</a>
              {request.status === "handled"
                ? <button type="button" className="button button-soft button-small" onClick={() => void mutate("PATCH", { type: "ad-request", id: request.id, action: "reopen" }, "تمت إعادة فتح الطلب.")}><RotateCcw size={14}/> إعادة فتح</button>
                : <button type="button" className="button button-success button-small" onClick={() => void mutate("PATCH", { type: "ad-request", id: request.id, action: "handle" }, "تم تحديد الطلب كمعالَج.")}><Check size={14}/> تمت المعالجة</button>}
              <button type="button" className="icon-button admin-delete" onClick={() => onConfirmDeleteRequest(request)} aria-label="حذف الطلب"><Trash2 size={15}/></button>
            </div>
          </article>
        ))}
      </div> : <p className="admin-ad-requests-empty">لسه مفيش طلبات. كل طلب من صفحة «أعلن معنا» هيظهر هنا ومعاه إشعار في الجرس.</p>}
    </section>

    <section className="admin-ads-list-section">
      <h3 className="admin-ads-section-title"><Clapperboard size={17}/> الإعلانات الحالية <span>{ads.length}</span></h3>
      <div className="admin-ads-list">
        {ads.map((ad, position) => {
          const isLive = isAdLive(ad), linked = ad.serviceId ? services.find((service) => service.id === ad.serviceId) : null;
          return <article key={ad.id} className={`admin-ad-row ${isLive ? "" : "is-off"}`}>
            <span className="admin-ad-order">{position + 1}</span>
            <div className="admin-ad-thumb" style={adAccentStyle(ad.accentColor)}>
              {ad.template ? <AdTemplateArt template={ad.template} title={ad.title} caption={ad.caption} {...artProps} {...autoFor(ad.template)} backgroundUrl={ad.hasImage ? adImageUrl(ad) : ""} compact/>
                : ad.hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Database-served ad artwork.
                  <img src={adImageUrl(ad)} alt=""/>
                ) : <Clapperboard size={22}/>}
            </div>
            <div className="admin-ad-info">
              <h4>{ad.title}<span className={`status-badge ${isLive ? "status-approved" : "status-rejected"}`}>{isLive ? "يُعرض الآن" : ad.active ? "خارج الفترة / بلا صورة" : "موقوف"}</span>{ad.template && <span className="admin-ad-chip"><LayoutTemplate size={11}/> قالب جاهز</span>}</h4>
              <p>
                {ad.caption && <span>{ad.caption}</span>}
                {linked && <span><UserRound size={12}/> {linked.name}</span>}
                {ad.whatsapp && <span dir="ltr"><MessageCircle size={12}/> {ad.whatsapp}</span>}
                <span><Clock3 size={12}/> {ad.durationSeconds} ث</span>
                {(ad.startsAt || ad.endsAt) && <span><CalendarDays size={12}/> {ad.startsAt ? new Date(ad.startsAt).toLocaleDateString("ar-EG") : "—"} ← {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString("ar-EG") : "بلا نهاية"}</span>}
              </p>
            </div>
            <div className="admin-ad-actions">
              <button type="button" className="icon-button" disabled={position === 0 || busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "move", direction: "up" }, "تم تغيير الترتيب.")} aria-label="تقديم الإعلان"><ArrowUp size={15}/></button>
              <button type="button" className="icon-button" disabled={position === ads.length - 1 || busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "move", direction: "down" }, "تم تغيير الترتيب.")} aria-label="تأخير الإعلان"><ArrowDown size={15}/></button>
              <button type="button" className={`button button-small ${ad.active ? "button-danger-soft" : "button-success"}`} disabled={busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "toggle" }, ad.active ? "تم إيقاف الإعلان." : "تم تفعيل الإعلان.")}><Power size={14}/> {ad.active ? "إيقاف" : "تفعيل"}</button>
              <button type="button" className="button button-soft button-small" onClick={() => startEdit(ad)}><Pencil size={14}/> تعديل</button>
              <button type="button" className="icon-button admin-delete" onClick={() => onConfirmDelete(ad)} aria-label={`حذف إعلان ${ad.title}`}><Trash2 size={15}/></button>
            </div>
          </article>;
        })}
        {!ads.length && <div className="admin-empty-state"><Clapperboard size={34}/><h3>لسه مفيش إعلانات</h3><p>ارفع أول GIF أو اختر قالبًا جاهزًا. لحد ما تضيف إعلانًا، المساحة تعرض «مساحة إعلانية هنا» مع الأسعار وزر طلب إعلان عبر واتساب.</p></div>}
      </div>
    </section>

    <AdPricingEditor pricing={pricing} busy={busy} mutate={mutate}/>
  </div>;
}

/** Price list (Egyptian pounds) shown in the empty ad slot and sent in the WhatsApp request message. */
function AdPricingEditor({ pricing, busy, mutate }: { pricing: AdPricing; busy: string | null; mutate: Mutate }) {
  const [draft, setDraft] = useState<AdPricing>(pricing);
  const [savedFrom, setSavedFrom] = useState(pricing);
  if (savedFrom !== pricing) { setSavedFrom(pricing); setDraft(pricing); }
  function updateTier(index: number, patch: Partial<AdPricing["tiers"][number]>) {
    setDraft({ ...draft, tiers: draft.tiers.map((tier, position) => (position === index ? { ...tier, ...patch } : tier)) });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutate("PATCH", { type: "ad-pricing", values: draft }, "تم حفظ أسعار الإعلانات.");
  }
  return <form className="admin-ad-pricing" onSubmit={save}>
    <div className="admin-ad-pricing-head">
      <h3><BadgeDollarSign size={18}/> أسعار الإعلانات بالجنيه المصري</h3>
      <label className="admin-ad-switch"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}/><span>إظهار الأسعار للزوار</span></label>
    </div>
    <p className="admin-ad-pricing-help">تظهر هذه الباقات داخل المساحة الإعلانية الفارغة وفي رسالة «اطلب إعلانك» على واتساب. عدّل الأسماء والمدد والأسعار كما تريد.</p>
    <div className="admin-ad-pricing-tiers">
      {draft.tiers.map((tier, index) => (
        <div className="admin-ad-pricing-tier" key={index}>
          <label className="admin-ad-field"><span>اسم الباقة</span><input value={tier.label} maxLength={40} onChange={(event) => updateTier(index, { label: event.target.value })} placeholder="مثال: شهر"/></label>
          <label className="admin-ad-field"><span>المدة (يوم)</span><input type="number" min={1} max={3650} value={tier.days} onChange={(event) => updateTier(index, { days: Number(event.target.value) })}/></label>
          <label className="admin-ad-field"><span>السعر ({AD_CURRENCY})</span><input type="number" min={0} max={1000000} step={5} value={tier.price} onChange={(event) => updateTier(index, { price: Number(event.target.value) })}/></label>
          <span className="admin-ad-pricing-preview">{tier.label || "—"}: <b>{formatEgp(Number(tier.price) || 0)}</b></span>
          <button type="button" className="icon-button admin-delete" disabled={draft.tiers.length <= 1} onClick={() => setDraft({ ...draft, tiers: draft.tiers.filter((_, position) => position !== index) })} aria-label="حذف الباقة"><Trash2 size={14}/></button>
        </div>
      ))}
    </div>
    <div className="admin-ad-pricing-actions">
      <button type="button" className="button button-soft button-small" disabled={draft.tiers.length >= 6} onClick={() => setDraft({ ...draft, tiers: [...draft.tiers, { label: "", days: 30, price: 0 }] })}><Plus size={14}/> باقة جديدة</button>
      <button type="button" className="button button-soft button-small" onClick={() => setDraft(defaultAdPricing)}>استرجاع الأسعار الافتراضية</button>
    </div>
    <label className="admin-ad-field admin-ad-field-wide"><span>ملاحظة تظهر مع الأسعار (اختياري)</span><textarea value={draft.note} maxLength={300} rows={2} onChange={(event) => setDraft({ ...draft, note: event.target.value })}/></label>
    <div className="admin-ad-form-actions"><button className="button button-primary" type="submit" disabled={busy === "saving"}>{busy === "saving" ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} حفظ الأسعار</button></div>
  </form>;
}

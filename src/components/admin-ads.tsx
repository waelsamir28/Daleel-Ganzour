"use client";
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BadgeDollarSign, CalendarDays, Clapperboard, Clock3, ImagePlus, LayoutTemplate, LoaderCircle, MessageCircle, Pencil, Plus, Power, Save, Trash2, Upload, UserRound, X } from "lucide-react";
import SelectField from "@/components/select-field";
import AdTemplateArt from "@/components/ad-template-art";
import { AD_CURRENCY, AD_IMAGE_MAX_BYTES, AD_MAX_COUNT, AD_MAX_SECONDS, AD_MIN_SECONDS, adImageUrl, adTemplates, defaultAdPricing, formatEgp, isAdLive, type AdBannerRecord, type AdPricing, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";

type Mutate = (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, success?: string) => Promise<boolean>;
type Source = "upload" | "template";
type Draft = { source: Source; template: string; title: string; caption: string; serviceId: string; whatsapp: string; durationSeconds: string; startsAt: string; endsAt: string; active: boolean; image: string; imageName: string };
const emptyDraft: Draft = { source: "upload", template: "", title: "", caption: "", serviceId: "", whatsapp: "", durationSeconds: "6", startsAt: "", endsAt: "", active: true, image: "", imageName: "" };

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
  ads: AdBannerRecord[]; services: ServiceRecord[]; categories: CategoryRecord[]; busy: string | null; mutate: Mutate;
  siteName: string; logoUrl: string; pricing: AdPricing; onConfirmDelete: (ad: AdBannerRecord) => void;
};

/** Admin tab: upload or pick ready-made animated banners, order/schedule them, and manage the EGP price list. */
export default function AdminAds({ ads, services, categories, busy, mutate, siteName, logoUrl, pricing, onConfirmDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const providerOptions = useMemo(() => [{ value: "", label: "بدون ربط بصفحة مهني" }, ...services.filter((service) => service.status === "approved").map((service) => ({ value: service.id, label: `${service.name} — ${categories.find((category) => category.id === service.category)?.name ?? service.category}` }))], [services, categories]);
  const editing = editingId ? ads.find((ad) => ad.id === editingId) ?? null : null;
  const live = ads.filter((ad) => isAdLive(ad)).length;

  function startCreate(source: Source = "upload", template = "") {
    setEditingId(null); setError(""); setOpen(true);
    const meta = adTemplates.find((item) => item.id === template);
    setDraft({ ...emptyDraft, source, template, title: meta?.title ?? "", caption: meta?.caption ?? "" });
    window.setTimeout(() => document.getElementById("admin-ad-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function startEdit(ad: AdBannerRecord) {
    setEditingId(ad.id); setError(""); setOpen(true);
    setDraft({ source: ad.template ? "template" : "upload", template: ad.template, title: ad.title, caption: ad.caption, serviceId: ad.serviceId ?? "", whatsapp: ad.whatsapp, durationSeconds: String(ad.durationSeconds), startsAt: toDateInput(ad.startsAt), endsAt: toDateInput(ad.endsAt), active: ad.active, image: "", imageName: "" });
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
    try { const image = await readFileAsDataUrl(file); setDraft((current) => ({ ...current, source: "upload", template: "", image, imageName: file.name })); }
    catch { setError("تعذر قراءة الملف. جرّب ملفًا آخر."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const usingTemplate = draft.source === "template" && draft.template;
    if (draft.source === "template" && !draft.template) { setError("اختر قالبًا من القوالب الجاهزة."); return; }
    if (!usingTemplate && !editing?.hasImage && !draft.image) { setError("ارفع صورة الإعلان المتحركة أولًا أو اختر قالبًا جاهزًا."); return; }
    const values: Record<string, unknown> = { title: draft.title, caption: draft.caption, serviceId: draft.serviceId || null, whatsapp: draft.whatsapp, durationSeconds: Number(draft.durationSeconds || 6), startsAt: draft.startsAt ? `${draft.startsAt}T00:00:00` : null, endsAt: draft.endsAt ? `${draft.endsAt}T23:59:59` : null, active: draft.active, template: usingTemplate ? draft.template : "", ...(!usingTemplate && draft.image ? { image: draft.image } : {}) };
    const ok = editing ? await mutate("PATCH", { type: "ad", id: editing.id, action: "edit", values }, "تم حفظ الإعلان.") : await mutate("POST", { type: "ad", values }, "تم نشر الإعلان في المساحة الإعلانية.");
    if (ok) { setOpen(false); setDraft(emptyDraft); setEditingId(null); }
  }

  const previewTemplate = draft.source === "template" ? draft.template : "";
  const previewImage = draft.source === "upload" ? draft.image || (editing?.hasImage ? adImageUrl(editing) : "") : "";

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
            {draft.source === "upload" ? (
              <label className="admin-ad-dropzone">
                <input ref={fileInput} type="file" accept="image/gif,image/png,image/jpeg,image/webp" onChange={(event) => void onFile(event)}/>
                <span className="admin-ad-dropzone-icon"><ImagePlus size={26}/></span>
                <strong>{draft.imageName ? draft.imageName : "اضغط لاختيار GIF / صورة من جهازك"}</strong>
                <small>{editing?.hasImage && !draft.image ? "اترك الحقل فارغًا للإبقاء على الصورة الحالية." : "GIF أو PNG أو JPG أو WebP — حتى ٣ ميجا. الأفضل 1200×400 بكسل (3:1)."}</small>
              </label>
            ) : (
              <div className="admin-ad-templates" role="radiogroup" aria-label="القوالب الجاهزة">
                {adTemplates.map((template) => (
                  <button type="button" key={template.id} role="radio" aria-checked={draft.template === template.id} className={`admin-ad-template ${draft.template === template.id ? "is-selected" : ""}`} onClick={() => pickTemplate(template.id)}>
                    <span className="admin-ad-template-art"><AdTemplateArt template={template.id} siteName={siteName} logoUrl={logoUrl} pricing={pricing} compact/></span>
                    <span className="admin-ad-template-name">{template.name}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
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
              {previewTemplate ? <AdTemplateArt template={previewTemplate} title={draft.title} caption={draft.caption} siteName={siteName} logoUrl={logoUrl} pricing={pricing}/>
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

    <section className="admin-ads-list-section">
      <h3 className="admin-ads-section-title"><Clapperboard size={17}/> الإعلانات الحالية <span>{ads.length}</span></h3>
      <div className="admin-ads-list">
        {ads.map((ad, position) => {
          const isLive = isAdLive(ad), linked = ad.serviceId ? services.find((service) => service.id === ad.serviceId) : null;
          return <article key={ad.id} className={`admin-ad-row ${isLive ? "" : "is-off"}`}>
            <span className="admin-ad-order">{position + 1}</span>
            <div className="admin-ad-thumb">
              {ad.template ? <AdTemplateArt template={ad.template} title={ad.title} caption={ad.caption} siteName={siteName} logoUrl={logoUrl} pricing={pricing} compact/>
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

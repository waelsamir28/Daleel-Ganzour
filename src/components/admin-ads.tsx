"use client";
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Clapperboard, ImagePlus, LoaderCircle, MessageCircle, Pencil, Power, Trash2, UserRound, X } from "lucide-react";
import SelectField from "@/components/select-field";
import { AD_IMAGE_MAX_BYTES, AD_MAX_COUNT, AD_MAX_SECONDS, AD_MIN_SECONDS, adImageUrl, isAdLive, type AdBannerRecord, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";

type Mutate = (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, success?: string) => Promise<boolean>;

type Draft = { title: string; caption: string; serviceId: string; whatsapp: string; durationSeconds: string; startsAt: string; endsAt: string; active: boolean; image: string; imageName: string };
const emptyDraft: Draft = { title: "", caption: "", serviceId: "", whatsapp: "", durationSeconds: "6", startsAt: "", endsAt: "", active: true, image: "", imageName: "" };

function toDateInput(value: string | null) { return value ? value.slice(0, 10) : ""; }
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

/** Admin tab: upload, order, schedule and link the rotating ad banners shown on the directory pages. */
export default function AdminAds({ ads, services, categories, busy, mutate, onConfirmDelete }: { ads: AdBannerRecord[]; services: ServiceRecord[]; categories: CategoryRecord[]; busy: string | null; mutate: Mutate; onConfirmDelete: (ad: AdBannerRecord) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const providerOptions = useMemo(() => [{ value: "", label: "بدون ربط بصفحة مهني" }, ...services.filter((service) => service.status === "approved").map((service) => ({ value: service.id, label: `${service.name} — ${categories.find((category) => category.id === service.category)?.name ?? service.category}` }))], [services, categories]);
  const editing = editingId ? ads.find((ad) => ad.id === editingId) ?? null : null;

  function startCreate() { setEditingId(null); setDraft(emptyDraft); setError(""); setOpen(true); }
  function startEdit(ad: AdBannerRecord) {
    setEditingId(ad.id); setError(""); setOpen(true);
    setDraft({ title: ad.title, caption: ad.caption, serviceId: ad.serviceId ?? "", whatsapp: ad.whatsapp, durationSeconds: String(ad.durationSeconds), startsAt: toDateInput(ad.startsAt), endsAt: toDateInput(ad.endsAt), active: ad.active, image: "", imageName: "" });
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
    try { const image = await readFileAsDataUrl(file); setDraft((current) => ({ ...current, image, imageName: file.name })); }
    catch { setError("تعذر قراءة الملف. جرّب ملفًا آخر."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!editing && !draft.image) { setError("ارفع صورة الإعلان المتحركة أولًا."); return; }
    const values: Record<string, unknown> = { title: draft.title, caption: draft.caption, serviceId: draft.serviceId || null, whatsapp: draft.whatsapp, durationSeconds: Number(draft.durationSeconds || 6), startsAt: draft.startsAt ? `${draft.startsAt}T00:00:00` : null, endsAt: draft.endsAt ? `${draft.endsAt}T23:59:59` : null, active: draft.active, ...(draft.image ? { image: draft.image } : {}) };
    const ok = editing ? await mutate("PATCH", { type: "ad", id: editing.id, action: "edit", values }, "تم حفظ الإعلان.") : await mutate("POST", { type: "ad", values }, "تم نشر الإعلان في المساحة الإعلانية.");
    if (ok) { setOpen(false); setDraft(emptyDraft); setEditingId(null); }
  }

  return <div className="admin-ads">
    <div className="admin-ads-intro">
      <div>
        <h2><Clapperboard size={20}/> المساحة الإعلانية المتحركة</h2>
        <p>تظهر فوق إطار «بحث / أضف مهنتك» في كل صفحات الدليل. ارفع GIF (أو صورة) حتى ٣ ميجا، واربط كل إعلان بصفحة المعلن في الدليل ورقم واتسابه. الإعلانات تتبدّل تلقائيًا حسب المدة المحددة. المقاس المثالي 1200×400 (3:1).</p>
      </div>
      <button type="button" className="button button-primary" onClick={startCreate} disabled={ads.length >= AD_MAX_COUNT}><ImagePlus size={17}/> إعلان جديد</button>
    </div>
    {ads.length >= AD_MAX_COUNT && <div className="form-notice notice-amber"><span>وصلت للحد الأقصى ({AD_MAX_COUNT} إعلانات). احذف إعلانًا قديمًا لإضافة غيره.</span></div>}

    {open && (
      <form className="request-form management-form admin-ad-form" onSubmit={submit}>
        <div className="admin-ad-form-head"><strong>{editing ? `تعديل إعلان: ${editing.title}` : "إعلان جديد"}</strong><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={16}/></button></div>
        <label className="field">صورة الإعلان المتحركة (GIF) — رفع من الجهاز
          <input ref={fileInput} type="file" accept="image/gif,image/png,image/jpeg,image/webp" onChange={(event) => void onFile(event)}/>
          <small className="input-help">{draft.imageName ? `تم اختيار: ${draft.imageName}` : editing ? "اترك الحقل فارغًا للإبقاء على الصورة الحالية." : "الحد الأقصى ٣ ميجا. الأفضل 1200×400 بكسل."}</small>
        </label>
        {(draft.image || editing?.hasImage) && (
          <div className="admin-ad-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local data-URL / database-served preview. */}
            <img src={draft.image || (editing ? adImageUrl(editing) : "")} alt="معاينة الإعلان"/>
          </div>
        )}
        <label className="field">المعلن مرتبط بصفحة في الدليل
          <SelectField value={draft.serviceId} onChange={(event) => pickProvider(event.target.value)} options={providerOptions} aria-label="اختيار صفحة المهني"/>
        </label>
        <label className="field">عنوان الإعلان (اسم المعلن)<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required minLength={2} maxLength={120} placeholder="مثال: عيادة د. سارة أحمد"/></label>
        <label className="field">سطر وصفي قصير (اختياري)<input value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} maxLength={240} placeholder="مثال: خصم ٢٠٪ على الكشف طوال شهر رمضان"/></label>
        <label className="field">واتساب المعلن (اختياري)<input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })} dir="ltr" inputMode="tel" maxLength={16} placeholder="01xxxxxxxxx"/></label>
        <div className="form-row">
          <label className="field">مدة العرض بالثواني ({AD_MIN_SECONDS}–{AD_MAX_SECONDS})<input type="number" min={AD_MIN_SECONDS} max={AD_MAX_SECONDS} value={draft.durationSeconds} onChange={(event) => setDraft({ ...draft, durationSeconds: event.target.value })}/></label>
          <label className="field">يبدأ من (اختياري)<input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}/></label>
          <label className="field">ينتهي في (اختياري)<input type="date" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}/></label>
        </div>
        <label className="checkbox-field"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })}/> الإعلان مفعّل</label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-submit-center"><button className="button button-primary form-submit" type="submit" disabled={busy === "saving" || busy === editing?.id}>{busy ? <LoaderCircle size={17} className="spin"/> : <ImagePlus size={17}/>} {editing ? "حفظ التعديلات" : "نشر الإعلان"}</button></div>
      </form>
    )}

    <div className="admin-ads-list">
      {ads.map((ad, position) => {
        const live = isAdLive(ad), linked = ad.serviceId ? services.find((service) => service.id === ad.serviceId) : null;
        return <article key={ad.id} className={`admin-ad-row ${live ? "" : "is-off"}`}>
          <div className="admin-ad-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element -- Database-served ad artwork. */}
            {ad.hasImage ? <img src={adImageUrl(ad)} alt=""/> : <Clapperboard size={22}/>}
          </div>
          <div className="admin-ad-info">
            <h3>{ad.title}<span className={`status-badge ${live ? "status-approved" : "status-rejected"}`}>{live ? "يُعرض الآن" : ad.active ? "خارج الفترة / بلا صورة" : "موقوف"}</span></h3>
            <p>
              {ad.caption && <span>{ad.caption}</span>}
              {linked && <span><UserRound size={12}/> {linked.name}</span>}
              {ad.whatsapp && <span dir="ltr"><MessageCircle size={12}/> {ad.whatsapp}</span>}
              <span>⏱ {ad.durationSeconds} ث</span>
              {(ad.startsAt || ad.endsAt) && <span>📅 {ad.startsAt ? new Date(ad.startsAt).toLocaleDateString("ar-EG") : "—"} ← {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString("ar-EG") : "بلا نهاية"}</span>}
            </p>
          </div>
          <div className="member-row-actions admin-ad-actions">
            <button type="button" className="icon-button" disabled={position === 0 || busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "move", direction: "up" }, "تم تغيير الترتيب.")} aria-label="تقديم الإعلان"><ArrowUp size={15}/></button>
            <button type="button" className="icon-button" disabled={position === ads.length - 1 || busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "move", direction: "down" }, "تم تغيير الترتيب.")} aria-label="تأخير الإعلان"><ArrowDown size={15}/></button>
            <button type="button" className={`button button-small ${ad.active ? "button-danger-soft" : "button-success"}`} disabled={busy === ad.id} onClick={() => void mutate("PATCH", { type: "ad", id: ad.id, action: "toggle" }, ad.active ? "تم إيقاف الإعلان." : "تم تفعيل الإعلان.")}><Power size={14}/> {ad.active ? "إيقاف" : "تفعيل"}</button>
            <button type="button" className="button button-soft button-small" onClick={() => startEdit(ad)}><Pencil size={14}/> تعديل</button>
            <button type="button" className="icon-button admin-delete" onClick={() => onConfirmDelete(ad)} aria-label={`حذف إعلان ${ad.title}`}><Trash2 size={15}/></button>
          </div>
        </article>;
      })}
      {!ads.length && <div className="admin-empty-state"><Clapperboard size={34}/><h3>لسه مفيش إعلانات</h3><p>اضغط «إعلان جديد» وارفع أول GIF. لحد ما تضيف إعلانًا، المساحة تعرض «مساحة إعلانية هنا» مع زر طلب إعلان عبر واتساب.</p></div>}
    </div>
  </div>;
}

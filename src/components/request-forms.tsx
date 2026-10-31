"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Check, CheckCircle2, CirclePlus, Clock3, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { areas, TEACHER_CENTER_ID, TEACHER_STAGES, TEACHERS_ROOT_ID, teacherSubjects, CLINIC_APPOINTMENT_TAG, CLINIC_WALKIN_TAG, HOME_DELIVERY_TAG, initialCategories, OTHER_ADDRESS, shopSampleMenuItems, type AreaRecord, type CategoryRecord } from "@/lib/catalog";
import SelectField from "@/components/select-field";
import { StickerIcon } from "@/components/ui";
import AvatarPicker from "@/components/avatar-picker";
import WelcomeModal from "@/components/welcome-modal";
import { providerPending } from "@/lib/welcome-messages";

const CLINIC_SCHEDULE_CHIPS = [
  CLINIC_APPOINTMENT_TAG,
  CLINIC_WALKIN_TAG,
  "يومياً عدا الجمعة",
  "السبت والاثنين والأربعاء",
  "الأحد والثلاثاء والخميس",
];

type FormOptions = { catalog: CategoryRecord[]; areaOptions: AreaRecord[] };
/** رسالة عائمة للمهني أول ما يبعت الطلب: طمأنة + متابعة، وهي «لحين قبول الإدارة». */
function ServiceSubmittedWelcome({ trackingUrl }: { trackingUrl: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <WelcomeModal message={{ ...providerPending("", trackingUrl), title: "طلبك وصل.. وإحنا بنراجعه دلوقتي", body: "شكرًا إنك اخترت تنضم لدليل جنزور — طلب نشر مهنتك وصل للإدارة، والمراجعة بتاخد عادة أقل من يوم. مش محتاج تعمل أي حاجة." }} onClose={() => setOpen(false)}/>;
}

export function AddressFields({ areaOptions, initialArea = "", initialAddress = "", editableDetails = false }: { areaOptions: AreaRecord[]; initialArea?: string; initialAddress?: string; editableDetails?: boolean }) {
  const known = areaOptions.some((area) => area.name === initialArea);
  const [area, setArea] = useState(initialArea ? known ? initialArea : OTHER_ADDRESS : "");
  return <div className="address-fields"><label className="field">العنوان في جنزور <span className="required">*</span><SelectField name="area" value={area} onChange={(event) => setArea(event.target.value)} required><option value="" disabled>اختار العنوان</option>{areaOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value={OTHER_ADDRESS}>{OTHER_ADDRESS}</option></SelectField></label>{area === OTHER_ADDRESS ? <label className="field custom-address-field">اكتب العنوان الآخر <span className="required">*</span><input name="address" placeholder="مثال: جنزور / بجوار المدرسة" defaultValue={initialArea && !known ? initialAddress : ""} required minLength={3} maxLength={240}/></label> : editableDetails ? <label className="field">العنوان بالتفصيل<input name="address" key={area} defaultValue={initialAddress || area} placeholder="تفاصيل أو علامة مميزة" maxLength={240}/></label> : <input type="hidden" name="address" value={area}/>}</div>;
}
export function ServiceForm({ catalog = initialCategories, areaOptions = areas.map((name, sortOrder) => ({ id: name, name, sortOrder })), initialCategory = "", initialArea = "", onClose }: Partial<FormOptions> & { initialCategory?: string; initialArea?: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ id: string; message: string; trackingUrl: string } | null>(null);
  const selected = catalog.find((category) => category.id === initialCategory);
  const [root, setRoot] = useState(selected?.parentId ?? (selected && !selected.parentId ? selected.id : ""));
  const [specialty, setSpecialty] = useState(selected?.parentId ? selected.id : "");
  const [clinicTags, setClinicTags] = useState<string[]>([]);
  const [teacherStages, setTeacherStages] = useState<string[]>([]);
  const [centerSubjects, setCenterSubjects] = useState<string[]>([]);
  const [shopItems, setShopItems] = useState<string[]>([]);
  const [customShopItem, setCustomShopItem] = useState("");
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const knownArea = areaOptions.some((item) => item.name === initialArea);
  const [area, setArea] = useState(initialArea ? (knownArea ? initialArea : OTHER_ADDRESS) : "");
  function toggleClinicTag(tag: string) {
    setClinicTags((curr) => curr.includes(tag) ? curr.filter((item) => item !== tag) : [...curr, tag]);
  }
  function toggleShopItem(item: string) {
    setShopItems((curr) => curr.includes(item) ? curr.filter((x) => x !== item) : [...curr, item].slice(0, 12));
  }
  function addCustomShopItem() {
    const trimmed = customShopItem.trim();
    if (!trimmed) return;
    if (!shopItems.includes(trimmed)) {
      setShopItems((curr) => [...curr, trimmed].slice(0, 12));
    }
    setCustomShopItem("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const subSpecialties = root === "clinics" ? clinicTags : root === TEACHERS_ROOT_ID ? [...teacherStages, ...(specialty === TEACHER_CENTER_ID ? centerSubjects : [])] : [];
    const baseServiceItems = root === "shops" ? shopItems : [];
    const serviceItems = homeDelivery ? [...baseServiceItems, HOME_DELIVERY_TAG] : baseServiceItems;
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          emergency: form.get("emergency") === "on",
          subSpecialties,
          serviceItems,
          ...(photo ? { photo } : {}),
        }),
      });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "تعذر إرسال الطلب.");
      try {
        const stored: unknown = JSON.parse(localStorage.getItem("janzour-owned-services") ?? "[]");
        const next = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
        if (typeof result.id === "string" && !next.includes(result.id)) {
          localStorage.setItem("janzour-owned-services", JSON.stringify([...next, result.id]));
        }
      } catch { /* Ignore storage issues. */ }
      setSubmitted(result);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر الاتصال. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }
  if (submitted) return <><ServiceSubmittedWelcome trackingUrl={submitted.trackingUrl}/><div className="success-state"><span className="success-icon"><CheckCircle2 size={42}/></span><h3>طلبك وصل.. وأهلًا بيك!</h3><p>{submitted.message}</p><div className="reference-number"><Clock3 size={17}/> قيد مراجعة الإدارة <span dir="ltr">#{submitted.id}</span></div><a className="button button-soft" href={submitted.trackingUrl}>متابعة الطلب بالرابط الخاص</a><p>احتفظ بالرابط لمتابعة الحالة، ولا تشاركه علنًا.</p><button className="button button-primary" onClick={onClose}>تمام، شكرًا <Check size={18}/></button></div></>;
  return <form className="request-form compact-service-form" onSubmit={submit}>
    <div className="form-notice"><ShieldCheck size={20}/><span>ده طلب إضافة خدمة، مش تسجيل عضوية. الطلب بيوصل للإدارة الأول ومش بيتنشر إلا بعد الموافقة.</span></div>
    <div className="form-row compact-two-col">
      <label className="field">اسم مقدم الخدمة أو النشاط <span className="required">*</span><input name="name" placeholder="مثال: وائل سمير للنجارة" required minLength={3} maxLength={160}/></label>
      <label className="field">العنوان في جنزور <span className="required">*</span><SelectField name="area" value={area} onChange={(event) => setArea(event.target.value)} required><option value="" disabled>اختار العنوان</option>{areaOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value={OTHER_ADDRESS}>{OTHER_ADDRESS}</option></SelectField></label>
    </div>
    {area === OTHER_ADDRESS ? <label className="field custom-address-field">اكتب العنوان الآخر <span className="required">*</span><input name="address" placeholder="مثال: جنزور / بجوار المدرسة" defaultValue={initialArea && !knownArea ? initialArea : ""} required minLength={3} maxLength={240}/></label> : <input type="hidden" name="address" value={area}/>}
    <div className="form-row compact-two-col">
      <label className="field">التصنيف الرئيسي <span className="required">*</span><SelectField value={root} onChange={(event) => { setRoot(event.target.value); setSpecialty(""); }} required><option value="" disabled>اختار التصنيف</option>{catalog.filter((category) => !category.parentId && category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></label>
      <label className="field">المهنة أو التخصص <span className="required">*</span><SelectField name="category" value={specialty} onChange={(event) => setSpecialty(event.target.value)} required disabled={!root}><option value="" disabled>{root ? "اختار التخصص" : "اختار التصنيف الأول"}</option>{catalog.filter((category) => category.parentId === root && category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></label>
    </div>
    <div className="form-row compact-two-col">
      <label className="field">رقم الهاتف / واتساب <span className="required">*</span><input name="phone" type="tel" inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" required maxLength={16}/></label>
      <label className="field">رقم هاتف إضافي<input name="phoneSecondary" type="tel" inputMode="tel" dir="ltr" placeholder="اختياري" maxLength={16}/></label>
    </div>
    <label className="field field-description"><span className="field-label-green">وصف الخدمة</span> <small className="field-optional">(اختياري — لو سيبته فاضي هنكتب وصفًا مناسبًا لمهنتك)</small><textarea name="description" placeholder="عرّف أهل جنزور بالخدمة اللي بتقدمها وخبرتك..." maxLength={1000} rows={2}/></label>
    <AvatarPicker value={photo} onChange={setPhoto}/>
    {root === "clinics" && (
      <div className="field clinic-schedule-picker">
        <span>🩺 نظام الكشف وأيام التواجد في العيادة بجنزور (اختر ما يناسبك):</span>
        <div className="field-suggestions" aria-label="نظام الكشف وأيام التواجد">
          {CLINIC_SCHEDULE_CHIPS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`suggestion-chip ${clinicTags.includes(tag) ? "is-selected" : ""}`}
              onClick={() => toggleClinicTag(tag)}
            >
              {clinicTags.includes(tag) ? <Check size={12}/> : <CirclePlus size={12}/>}
              {tag}
            </button>
          ))}
        </div>
      </div>
    )}
    {root === TEACHERS_ROOT_ID && (
      <div className="field stage-picker-field">
        <span>🎓 المراحل التي تدرّسها (اختر مرحلة أو أكثر):</span>
        <div className="stage-picker-options" aria-label="المراحل الدراسية">
          {TEACHER_STAGES.map((stage) => (
            <label key={stage.id} className={`stage-picker-option ${teacherStages.includes(stage.name) ? "is-selected" : ""}`} style={{ "--stage-color": stage.color } as CSSProperties}>
              <input type="checkbox" checked={teacherStages.includes(stage.name)} onChange={() => setTeacherStages((curr) => curr.includes(stage.name) ? curr.filter((item) => item !== stage.name) : [...curr, stage.name])}/>
              <StickerIcon src={stage.sticker} size={38}/>
              <span>{stage.name}</span>
            </label>
          ))}
        </div>
      </div>
    )}
    {root === TEACHERS_ROOT_ID && specialty === TEACHER_CENTER_ID && (
      <div className="field center-subjects-picker">
        <span>📚 المواد المتاحة في السنتر (اضغط لاختيار أكثر من مادة):</span>
        <div className="field-suggestions" aria-label="مواد السنتر">
          {teacherSubjects(catalog).map((subject) => (
            <button key={subject.id} type="button" className={`suggestion-chip ${centerSubjects.includes(subject.name) ? "is-selected" : ""}`} onClick={() => setCenterSubjects((curr) => curr.includes(subject.name) ? curr.filter((item) => item !== subject.name) : [...curr, subject.name])}>
              {centerSubjects.includes(subject.name) ? <Check size={12}/> : <CirclePlus size={12}/>}
              {subject.name}
            </button>
          ))}
        </div>
      </div>
    )}
    {root === "shops" && (
      <div className="field shop-items-picker">
        <span>🛍️ قائمة الأصناف أو العروض المختصرة (تظهر للزوار مع زر اطلب عبر واتساب):</span>
        <div className="shop-custom-item-row">
          <input
            type="text"
            value={customShopItem}
            onChange={(event) => setCustomShopItem(event.target.value)}
            placeholder="مثال: كرتونة بيض طازج — بسعر اليوم (أو اسم الصنف والعر)"
            maxLength={95}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomShopItem();
              }
            }}
          />
          <button type="button" className="button button-soft button-small" onClick={addCustomShopItem}>
            <CirclePlus size={15}/> إضافة صنف
          </button>
        </div>
        <div className="field-suggestions" aria-label="أصناف مقترحة للمحل">
          {(shopSampleMenuItems[specialty] ?? shopSampleMenuItems.groceries ?? []).map((item) => (
            <button
              key={item}
              type="button"
              className={`suggestion-chip ${shopItems.includes(item) ? "is-selected" : ""}`}
              onClick={() => toggleShopItem(item)}
            >
              {shopItems.includes(item) ? <Check size={12}/> : <CirclePlus size={12}/>}
              {item}
            </button>
          ))}
        </div>
      </div>
    )}
    <div className="editor-checkboxes">
      <label className="checkbox-field"><input name="emergency" type="checkbox"/><span>متاح لخدمات الطوارئ والمساعدة العاجلة</span></label>
      {root === "shops" && (
        <label className="checkbox-field"><input type="checkbox" checked={homeDelivery} onChange={(e) => setHomeDelivery(e.target.checked)}/><span>🛵 يوفر المحل خدمة التوصيل للمنازل بجنزور</span></label>
      )}
    </div>
    {error && <div role="alert" className="form-error">{error}</div>}
    <div className="form-submit-center"><button type="submit" className="button button-primary form-submit" disabled={busy}>{busy ? <LoaderCircle size={19} className="spin"/> : <CirclePlus size={19}/>} {busy ? "جاري إرسال الطلب..." : "إرسال طلب إضافة مهنتك"}</button></div>
    <p className="form-footnote">الإضافة مجانية. بيانات التواصل تُنشر فقط بعد موافقة الإدارة.</p>
  </form>;
}
export function LocationPicker({ areaOptions, selected, onSelect }: { areaOptions: AreaRecord[]; selected: string; onSelect: (area: string, custom?: string) => void }) {
  const [query, setQuery] = useState(""), [other, setOther] = useState(false), [custom, setCustom] = useState("");
  return <div className="location-picker"><div className="form-notice"><MapPin size={20}/><span>الدليل مخصص لقرية جنزور. اختار الناحية أو الشارع المناسب.</span></div><input aria-label="ابحث عن عنوان" placeholder="ابحث عن عنوان في جنزور..." value={query} onChange={(event) => setQuery(event.target.value)}/><div className="location-options janzour-location-options"><button className={!selected ? "selected" : ""} onClick={() => onSelect("")}><MapPin size={16}/>كل عناوين جنزور</button>{areaOptions.filter((area) => area.name.includes(query)).map((area) => <button key={area.id} className={selected === area.name ? "selected" : ""} onClick={() => onSelect(area.name)}><MapPin size={16}/>{area.name}{selected === area.name && <Check size={15}/>}</button>)}<button className={other ? "selected" : ""} onClick={() => setOther(!other)}><MapPin size={16}/>{OTHER_ADDRESS}</button></div>{other && <form className="custom-location-form" onSubmit={(event) => { event.preventDefault(); onSelect(OTHER_ADDRESS, custom.trim()); }}><label className="field">اكتب العنوان الآخر<input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="الشارع أو أقرب علامة مميزة" minLength={3} required maxLength={240}/></label><button className="button button-primary" type="submit">ابحث في العنوان</button></form>}</div>;
}

"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, CirclePlus, LoaderCircle, Save, Sparkles } from "lucide-react";
import { getCategory, getCompletionFieldSuggestions, iconArabicLabels, iconNames, OTHER_ADDRESS, type AdminDirectory, type AreaRecord, type CategoryRecord, type MemberRecord, type ServiceRecord } from "@/lib/catalog";
import SelectField from "@/components/select-field";

export type EntityKind = "service" | "category" | "area" | "member";
export type EditorState = { kind: EntityKind; item?: ServiceRecord | CategoryRecord | AreaRecord | MemberRecord; parentId?: string };

function toggleLineItem(current: string, item: string): string {
  const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.includes(item)) return lines.filter((line) => line !== item).join("\n");
  return [...lines, item].slice(0, 20).join("\n");
}

function hasLineItem(current: string, item: string): boolean {
  return current.split("\n").map((line) => line.trim()).includes(item);
}

export default function ManagementEditor({ editing, data, onSave }: { editing: EditorState; data: AdminDirectory; onSave: (values: Record<string, unknown>) => Promise<boolean> }) {
  const record = (editing.item ?? {}) as Partial<ServiceRecord & CategoryRecord & AreaRecord & MemberRecord>;
  const draft = editing.kind === "service" && record.completionDraft ? record.completionDraft : null;
  const roots = data.categories.filter((category) => !category.parentId);
  const initialCat = draft?.category ?? record.category ?? "";
  const [root, setRoot] = useState(initialCat ? getCategory(initialCat, data.categories).parentId ?? "" : "");
  const [specialty, setSpecialty] = useState(initialCat), [color, setColor] = useState(record.color ?? "#0876e1");
  const initialAreaVal = draft?.area ?? record.area ?? "";
  const knownArea = data.areas.some((a) => a.name === initialAreaVal);
  const [area, setArea] = useState(initialAreaVal ? (knownArea ? initialAreaVal : OTHER_ADDRESS) : "");
  const [nameVal, setNameVal] = useState(draft?.name ?? record.name ?? "");
  const [addressVal, setAddressVal] = useState(draft?.address ?? record.address ?? initialAreaVal);
  const [phoneVal, setPhoneVal] = useState(draft?.phone ?? record.phone ?? "");
  const [phoneSecondaryVal, setPhoneSecondaryVal] = useState(draft?.phoneSecondary ?? record.phoneSecondary ?? "");
  const [descriptionVal, setDescriptionVal] = useState(draft?.description ?? record.description ?? "");
  const [subSpecVal, setSubSpecVal] = useState((draft?.subSpecialties ?? record.subSpecialties ?? []).join("\n"));
  const [serviceItemsVal, setServiceItemsVal] = useState((draft?.serviceItems ?? record.serviceItems ?? []).join("\n"));
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const suggestions = getCompletionFieldSuggestions(specialty || root, data.categories, nameVal, area);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget), values: Record<string, unknown> = Object.fromEntries(form);
    for (const key of ["verified", "featured", "emergency", "active", "demo"]) values[key] = form.get(key) === "on";
    try {
      if (editing.kind === "service") values.workingHours = record.workingHours ?? [];
      if (editing.kind === "service") values.serviceItems = String(form.get("serviceItems") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
      if (editing.kind === "service") values.subSpecialties = String(form.get("subSpecialties") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
      if (editing.kind === "service" && record.status === "needs-info") values.status = "needs-info";
      if (!(await onSave(values))) setError("لم يتم الحفظ. راجع رسالة الخطأ وصحّح البيانات.");
    }
    catch { setError("تعذر حفظ البيانات. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }
  return <form className="request-form management-form" onSubmit={submit}>
    {editing.kind === "service" && <>
      <label className="field">اسم مقدم الخدمة
        <input name="name" value={nameVal} onChange={(event) => setNameVal(event.target.value)} required minLength={3} maxLength={160}/>
        <div className="field-suggestions" aria-label="اقتراحات اسم مقدم الخدمة">
          <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات للاسم حسب المهنة:</span>
          {suggestions.names.map((item) => <button key={item} type="button" className={`suggestion-chip ${nameVal === item ? "is-selected" : ""}`} onClick={() => setNameVal(item)}><CirclePlus size={12}/>{item}</button>)}
        </div>
      </label>
      <div className="form-row">
        <label className="field">التصنيف الرئيسي<SelectField value={root} onChange={(event) => { setRoot(event.target.value); setSpecialty(""); }} required><option value="" disabled>اختار القسم</option>{roots.map((category) => <option key={category.id} value={category.id}>{category.name}{!category.active && " (مخفي)"}</option>)}</SelectField></label>
        <label className="field">المهنة أو التخصص<SelectField name="category" value={specialty} onChange={(event) => setSpecialty(event.target.value)} required disabled={!root}><option value="" disabled>اختار التخصص</option>{data.categories.filter((category) => category.parentId === root).map((category) => <option key={category.id} value={category.id}>{category.name}{!category.active && " (مخفي)"}</option>)}</SelectField></label>
      </div>
      <div className="address-fields">
        <label className="field">العنوان في جنزور <span className="required">*</span>
          <SelectField name="area" value={area} onChange={(event) => { setArea(event.target.value); if (!addressVal) setAddressVal(event.target.value); }} required>
            <option value="" disabled>اختار العنوان</option>
            {data.areas.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            <option value={OTHER_ADDRESS}>{OTHER_ADDRESS}</option>
          </SelectField>
        </label>
        <label className="field">العنوان بالتفصيل
          <input name="address" value={addressVal} onChange={(event) => setAddressVal(event.target.value)} placeholder="تفاصيل أو علامة مميزة" maxLength={240}/>
          <div className="field-suggestions" aria-label="اقتراحات العنوان التفصيلي">
            <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات العنوان والمعالم القريبة:</span>
            {suggestions.addresses.map((item) => <button key={item} type="button" className={`suggestion-chip ${addressVal === item ? "is-selected" : ""}`} onClick={() => setAddressVal(item)}><CirclePlus size={12}/>{item}</button>)}
          </div>
        </label>
      </div>
      <label className="field">رقم الهاتف<input name="phone" value={phoneVal} onChange={(event) => setPhoneVal(event.target.value)} required type="tel" dir="ltr" maxLength={16}/></label>
      <label className="field">رقم هاتف إضافي
        <input name="phoneSecondary" value={phoneSecondaryVal} onChange={(event) => setPhoneSecondaryVal(event.target.value)} type="tel" dir="ltr" maxLength={16}/>
        {phoneVal && <div className="field-suggestions"><span className="field-suggestions-label"><Sparkles size={12}/>اقتراح سريع:</span><button type="button" className={`suggestion-chip ${phoneSecondaryVal === phoneVal ? "is-selected" : ""}`} onClick={() => setPhoneSecondaryVal(phoneVal)}><CirclePlus size={12}/>نفس الرقم الأساسي للواتساب ({phoneVal})</button></div>}
      </label>
      <label className="field">وصف الخدمة
        <textarea name="description" value={descriptionVal} onChange={(event) => setDescriptionVal(event.target.value)} required minLength={10} maxLength={1000} rows={3}/>
        <div className="field-suggestions" aria-label="اقتراحات وصف الخدمة">
          <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات جاهزة لوصف المهنة:</span>
          {suggestions.descriptions.map((item) => <button key={item} type="button" className={`suggestion-chip ${descriptionVal === item ? "is-selected" : ""}`} onClick={() => setDescriptionVal(item)}><CirclePlus size={12}/>{item}</button>)}
        </div>
      </label>
      <label className="field">حالة النشر<SelectField name="status" defaultValue={record.status ?? "approved"}><option value="pending">قيد المراجعة</option><option value="approved">منشور</option><option value="rejected">مرفوض / موقوف</option></SelectField></label>
      <div className="editor-checkboxes"><label className="checkbox-field"><input type="checkbox" name="verified" defaultChecked={record.verified ?? true}/> موثقة</label><label className="checkbox-field"><input type="checkbox" name="featured" defaultChecked={record.featured}/> خدمة مميزة</label><label className="checkbox-field"><input type="checkbox" name="emergency" defaultChecked={draft?.emergency ?? record.emergency}/> متاح للطوارئ</label><label className="checkbox-field"><input type="checkbox" name="demo" defaultChecked={record.demo}/> بطاقة توضيحية</label></div>
    </>}
    {editing.kind === "service" && <>
      <label className="field">متاح الآن<SelectField name="availabilityAction" defaultValue="keep"><option value="keep">بدون تغيير</option><option value="activate">تفعيل أو تجديد لمدة ٤ ساعات</option><option value="stop">إيقاف الآن</option></SelectField><small className="input-help">تنتهي الحالة تلقائيًا. حفظ بيانات أخرى لا يجددها.</small>{record.availableUntil && <small>موعد الانتهاء: {new Date(record.availableUntil).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })} (بتوقيت جنزور)</small>}</label>
      <label className="field">سبب الرفض / البيانات المطلوب استكمالها<textarea name="reviewNote" maxLength={1000} placeholder="يظهر لصاحب رابط المتابعة الخاص فقط. اتركه فارغًا للحفاظ على السبب المسجل."/></label>
      <label className="field">التخصصات الفرعية
        <textarea name="subSpecialties" value={subSpecVal} onChange={(event) => setSubSpecVal(event.target.value)} rows={3} maxLength={2020}/>
        <small>تخصص في كل سطر، حتى ٢٠ تخصصًا. اضغط على أي اقتراح لإضافته أو إزالته:</small>
        <div className="field-suggestions" aria-label="اقتراحات التخصصات الفرعية">
          {suggestions.subSpecialties.map((item) => <button key={item} type="button" className={`suggestion-chip ${hasLineItem(subSpecVal, item) ? "is-selected" : ""}`} onClick={() => setSubSpecVal((curr) => toggleLineItem(curr, item))}>{hasLineItem(subSpecVal, item) ? <Check size={12}/> : <CirclePlus size={12}/>}{item}</button>)}
        </div>
      </label>
      <label className="field">ترتيب الأكثر احتياجًا<input name="neededRank" type="number" min={0} max={1000} defaultValue={record.neededRank ?? 0}/><small>٠ للاستبعاد؛ الرقم الأصغر يظهر أولًا.</small></label>
      <label className="field">الخدمات التفصيلية
        <textarea name="serviceItems" value={serviceItemsVal} onChange={(event) => setServiceItemsVal(event.target.value)} rows={5} maxLength={2020} placeholder={"صيانة\nتركيب\nكشف"}/>
        <small>خدمة واحدة في كل سطر، حتى ٢٠ خدمة. اضغط على أي اقتراح لإضافته أو إزالته:</small>
        <div className="field-suggestions" aria-label="اقتراحات الخدمات التفصيلية">
          {suggestions.serviceItems.map((item) => <button key={item} type="button" className={`suggestion-chip ${hasLineItem(serviceItemsVal, item) ? "is-selected" : ""}`} onClick={() => setServiceItemsVal((curr) => toggleLineItem(curr, item))}>{hasLineItem(serviceItemsVal, item) ? <Check size={12}/> : <CirclePlus size={12}/>}{item}</button>)}
        </div>
      </label>
    </>}
    {editing.kind === "category" && <><label className="field">اسم التصنيف أو التخصص<input name="name" defaultValue={record.name} required minLength={2} maxLength={100}/></label><label className="field">ينتمي إلى<SelectField name="parentId" defaultValue={record.parentId ?? editing.parentId ?? ""}><option value="">تصنيف رئيسي</option>{roots.filter((category) => category.id !== record.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></label>{!editing.item && <label className="field">رابط التصنيف (اختياري)<input name="slug" dir="ltr" placeholder="مثال: new-specialty" maxLength={60}/><small className="input-help">لو تركته فارغًا، الموقع هيختار رابطًا فريدًا تلقائيًا.</small></label>}<label className="field">وصف مختصر<textarea name="description" defaultValue={record.description} maxLength={240} rows={2}/></label><div className="form-row"><label className="field">لون التصنيف<div className="color-editor"><input type="color" name="color" value={color} onChange={(event) => setColor(event.target.value)}/><span dir="ltr">{color}</span></div></label><label className="field">الأيقونة<SelectField name="icon" defaultValue={record.icon ?? "Wrench"}>{iconNames.map((icon) => <option key={icon} value={icon}>{iconArabicLabels[icon] ?? icon}</option>)}</SelectField></label></div><label className="field">ترتيب الظهور<input name="sortOrder" type="number" defaultValue={record.sortOrder ?? 0} min={0} max={1000} required/></label><label className="checkbox-field"><input name="active" type="checkbox" defaultChecked={record.active ?? true}/> ظاهر في الموقع (إخفاء التصنيف يُخفي خدماته دون حذفها)</label></>}
    {editing.kind === "area" && <><label className="field">اسم العنوان<input name="name" defaultValue={record.name} placeholder="جنزور / اسم الشارع أو الناحية" required minLength={3} maxLength={80}/></label><label className="field">ترتيب الظهور<input name="sortOrder" type="number" defaultValue={record.sortOrder ?? 0} required min={0} max={1000}/></label><div className="form-notice"><span>تعديل اسم العنوان يحدّث العناوين المرتبطة بالمهن تلقائيًا. اختيار «عنوان آخر» موجود دائمًا.</span></div></>}
    {editing.kind === "member" && <><div className="form-notice"><span>يمكنك منح العضو صلاحية مشرف محدودة أو إعادته إلى عضوية عادية. إعدادات الموقع وإدارة الأعضاء تظل للأدمن فقط.</span></div><label className="field">اسم العضو<input name="name" defaultValue={record.name} required minLength={3} maxLength={120}/></label><label className="field">اسم المستخدم<input defaultValue={record.username} readOnly dir="ltr"/></label><label className="field">رقم الهاتف<input name="phone" defaultValue={record.phone} required type="tel" dir="ltr" maxLength={16}/></label><label className="field">صلاحية العضو<SelectField name="role" defaultValue={record.role ?? "member"}><option value="member">عضو</option><option value="moderator">مشرف بصلاحيات محدودة</option></SelectField><small className="input-help">المشرف يراجع الطلبات، ويُدير التصنيفات والإشعارات فقط.</small></label><label className="checkbox-field"><input name="active" type="checkbox" defaultChecked={record.active}/> عضوية نشطة (إيقافها يُنهي جلسات دخول العضو)</label></>}
    {error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Save size={18}/>} {busy ? "جاري الحفظ..." : "حفظ التعديلات"}</button>
  </form>;
}

export function ProviderCompletionModalForm({
  service,
  categories,
  areas,
  onSubmitted,
  onClose,
}: {
  service: ServiceRecord;
  categories: CategoryRecord[];
  areas: AreaRecord[];
  onSubmitted: (updated: Partial<ServiceRecord>) => void;
  onClose: () => void;
}) {
  const draft = service.completionDraft;
  const roots = categories.filter((category) => !category.parentId);
  const initialCat = draft?.category ?? service.category;
  const [root, setRoot] = useState(getCategory(initialCat, categories).parentId ?? "");
  const [specialty, setSpecialty] = useState(initialCat);
  const initialAreaVal = draft?.area ?? service.area;
  const knownArea = areas.some((a) => a.name === initialAreaVal);
  const [area, setArea] = useState(initialAreaVal ? (knownArea ? initialAreaVal : OTHER_ADDRESS) : "");
  const [nameVal, setNameVal] = useState(draft?.name ?? service.name);
  const [addressVal, setAddressVal] = useState(draft?.address ?? service.address ?? service.area);
  const [phoneVal, setPhoneVal] = useState(draft?.phone ?? service.phone);
  const [phoneSecondaryVal, setPhoneSecondaryVal] = useState(draft?.phoneSecondary ?? service.phoneSecondary ?? "");
  const [descriptionVal, setDescriptionVal] = useState(draft?.description ?? service.description);
  const [subSpecVal, setSubSpecVal] = useState((draft?.subSpecialties ?? service.subSpecialties ?? []).join("\n"));
  const [serviceItemsVal, setServiceItemsVal] = useState((draft?.serviceItems ?? service.serviceItems ?? []).join("\n"));
  const [emergencyVal, setEmergencyVal] = useState(draft?.emergency ?? service.emergency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const suggestions = getCompletionFieldSuggestions(specialty || root, categories, nameVal, area);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const subSpecialties = subSpecVal.split("\n").map((item) => item.trim()).filter(Boolean);
    const serviceItems = serviceItemsVal.split("\n").map((item) => item.trim()).filter(Boolean);
    try {
      const response = await fetch("/api/service-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-profile",
          serviceId: service.id,
          name: nameVal,
          category: specialty,
          area: area === OTHER_ADDRESS ? addressVal : area,
          address: addressVal,
          phone: phoneVal,
          phoneSecondary: phoneSecondaryVal,
          description: descriptionVal,
          subSpecialties,
          serviceItems,
          emergency: emergencyVal,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إرسال البيانات.");
      onSubmitted({
        completionStatus: "submitted",
        completionNote: "",
        completionDraft: result.completionDraft ?? {
          name: nameVal,
          category: specialty,
          area: area === OTHER_ADDRESS ? addressVal : area,
          address: addressVal,
          phone: phoneVal,
          phoneSecondary: phoneSecondaryVal,
          description: descriptionVal,
          subSpecialties,
          serviceItems,
          emergency: emergencyVal,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الاتصال. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="request-form management-form provider-completion-form" onSubmit={handleSubmit}>
      {service.completionStatus === "rejected" && (
        <div className="form-error completion-rejected-banner" role="alert">
          <AlertCircle size={18}/>
          <div>
            <strong>طلبت الإدارة تصحيح وإعادة استكمال البيانات:</strong>
            <p>{service.completionNote || "يرجى مراجعة البيانات المدخلة وتصحيح الخطأ ثم إعادة الإرسال."}</p>
          </div>
        </div>
      )}
      <div className="form-notice">
        <Sparkles size={19}/>
        <span>اضغط على أي من الاقتراحات الذكية أسفل كل خانة لإضافتها مباشرة وتوفير وقتك، ثم اضغط حفظ لإرسالها لمراجعة الإدارة.</span>
      </div>
      <label className="field">اسم مقدم الخدمة
        <input name="name" value={nameVal} onChange={(event) => setNameVal(event.target.value)} required minLength={3} maxLength={160}/>
        <div className="field-suggestions" aria-label="اقتراحات اسم مقدم الخدمة">
          <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات تخص المهني والمهنة:</span>
          {suggestions.names.map((item) => <button key={item} type="button" className={`suggestion-chip ${nameVal === item ? "is-selected" : ""}`} onClick={() => setNameVal(item)}><CirclePlus size={12}/>{item}</button>)}
        </div>
      </label>
      <div className="form-row">
        <label className="field">التصنيف الرئيسي
          <SelectField value={root} onChange={(event) => { setRoot(event.target.value); setSpecialty(""); }} required>
            <option value="" disabled>اختار القسم</option>
            {roots.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectField>
        </label>
        <label className="field">المهنة أو التخصص
          <SelectField name="category" value={specialty} onChange={(event) => setSpecialty(event.target.value)} required disabled={!root}>
            <option value="" disabled>اختار التخصص</option>
            {categories.filter((cat) => cat.parentId === root).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectField>
        </label>
      </div>
      <div className="address-fields">
        <label className="field">العنوان في جنزور <span className="required">*</span>
          <SelectField name="area" value={area} onChange={(event) => { setArea(event.target.value); if (!addressVal) setAddressVal(event.target.value); }} required>
            <option value="" disabled>اختار العنوان</option>
            {areas.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            <option value={OTHER_ADDRESS}>{OTHER_ADDRESS}</option>
          </SelectField>
        </label>
        <label className="field">العنوان بالتفصيل وأقرب معلم
          <input name="address" value={addressVal} onChange={(event) => setAddressVal(event.target.value)} placeholder="تفاصيل العنوان أو علامة مميزة بجنزور" required minLength={3} maxLength={240}/>
          <div className="field-suggestions" aria-label="اقتراحات العنوان بالتفصيل">
            <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات العنوان في جنزور:</span>
            {suggestions.addresses.map((item) => <button key={item} type="button" className={`suggestion-chip ${addressVal === item ? "is-selected" : ""}`} onClick={() => setAddressVal(item)}><CirclePlus size={12}/>{item}</button>)}
          </div>
        </label>
      </div>
      <div className="form-row">
        <label className="field">رقم الهاتف الأساسي
          <input name="phone" value={phoneVal} onChange={(event) => setPhoneVal(event.target.value)} required type="tel" dir="ltr" maxLength={16}/>
        </label>
        <label className="field">رقم هاتف إضافي / واتساب
          <input name="phoneSecondary" value={phoneSecondaryVal} onChange={(event) => setPhoneSecondaryVal(event.target.value)} type="tel" dir="ltr" placeholder="اختياري" maxLength={16}/>
          {phoneVal && (
            <div className="field-suggestions">
              <span className="field-suggestions-label"><Sparkles size={12}/>اقتراح رقم إضافي:</span>
              <button type="button" className={`suggestion-chip ${phoneSecondaryVal === phoneVal ? "is-selected" : ""}`} onClick={() => setPhoneSecondaryVal(phoneVal)}>
                <CirclePlus size={12}/>نفس الرقم الأساسي للواتساب ({phoneVal})
              </button>
            </div>
          )}
        </label>
      </div>
      <label className="field">وصف الخدمة وخبرة المهني
        <textarea name="description" value={descriptionVal} onChange={(event) => setDescriptionVal(event.target.value)} required minLength={10} maxLength={1000} rows={3}/>
        <div className="field-suggestions" aria-label="اقتراحات وصف الخدمة">
          <span className="field-suggestions-label"><Sparkles size={12}/>اقتراحات جاهزة لوصف المهنة:</span>
          {suggestions.descriptions.map((item) => <button key={item} type="button" className={`suggestion-chip ${descriptionVal === item ? "is-selected" : ""}`} onClick={() => setDescriptionVal(item)}><CirclePlus size={12}/>{item}</button>)}
        </div>
      </label>
      <label className="field">التخصصات الفرعية للمهنة
        <textarea name="subSpecialties" value={subSpecVal} onChange={(event) => setSubSpecVal(event.target.value)} rows={3} maxLength={2020} placeholder="تخصص فرعي في كل سطر"/>
        <small>اضغط على الاقتراحات التالية لإضافتها أو إزالتها مباشرة:</small>
        <div className="field-suggestions" aria-label="اقتراحات التخصصات الفرعية">
          {suggestions.subSpecialties.map((item) => <button key={item} type="button" className={`suggestion-chip ${hasLineItem(subSpecVal, item) ? "is-selected" : ""}`} onClick={() => setSubSpecVal((curr) => toggleLineItem(curr, item))}>{hasLineItem(subSpecVal, item) ? <Check size={12}/> : <CirclePlus size={12}/>}{item}</button>)}
        </div>
      </label>
      <label className="field">الخدمات التفصيلية المقدمة
        <textarea name="serviceItems" value={serviceItemsVal} onChange={(event) => setServiceItemsVal(event.target.value)} rows={4} maxLength={2020} placeholder="خدمة واحدة في كل سطر"/>
        <small>اضغط على الخدمات المقترحة لمهنتك لإضافتها أو إزالتها مباشرة:</small>
        <div className="field-suggestions" aria-label="اقتراحات الخدمات التفصيلية">
          {suggestions.serviceItems.map((item) => <button key={item} type="button" className={`suggestion-chip ${hasLineItem(serviceItemsVal, item) ? "is-selected" : ""}`} onClick={() => setServiceItemsVal((curr) => toggleLineItem(curr, item))}>{hasLineItem(serviceItemsVal, item) ? <Check size={12}/> : <CirclePlus size={12}/>}{item}</button>)}
        </div>
      </label>
      <label className="checkbox-field">
        <input type="checkbox" name="emergency" checked={emergencyVal} onChange={(event) => setEmergencyVal(event.target.checked)}/>
        <span>متاح للطوارئ والحالات العاجلة</span>
      </label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary form-submit" type="submit" disabled={busy}>
        {busy ? <LoaderCircle size={18} className="spin"/> : <Save size={18}/>}
        {busy ? "جاري إرسال الاستكمال..." : "حفظ وإرسال الاستكمال لمراجعة الإدارة"}
      </button>
    </form>
  );
}



"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle, MessageSquareQuote, Pencil, RotateCcw, Search } from "lucide-react";
import { getCategory, whatsappUrl, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui";

// الردود الجاهزة: رسايل واتساب معبأة ببيانات المميز الحقيقية (النشر، لينك تجديد
// الإتاحة، كارت الخدمة) — مع إمكانية تعديل نص أي رسالة قبل النسخ أو الإرسال.
export default function AdminReplies({ services, categories }: { services: ServiceRecord[]; categories: CategoryRecord[] }) {
  const approved = useMemo(() => services.filter((service) => service.status === "approved"), [services]);
  const [search, setSearch] = useState(""), [selectedId, setSelectedId] = useState(approved[0]?.id ?? ""), [copied, setCopied] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const filtered = approved.filter((service) => {
    const term = search.trim();
    return !term || `${service.name} ${service.phone} ${getCategory(service.category, categories).name} ${service.area}`.includes(term);
  });
  const selected = approved.find((service) => service.id === selectedId) ?? filtered[0];
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const templates = selected ? [
    {
      id: "published",
      title: "مبروك.. مهنتك اتنشرت",
      text: `مبروك يا ${selected.name} 🎉\nمهنتك بقت ظاهرة في دليل جنزور تحت تخصص «${getCategory(selected.category, categories).name}».\nكارتك: ${origin}/?service=${selected.id}\nالناس بتشوف بياناتك وتكلمك على طول. بالتوفيق!`,
    },
    {
      id: "renew",
      title: selected.availabilityToken ? "لينك تجديد الإتاحة" : "لينك تجديد الإتاحة (لسه متولدش)",
      text: selected.availabilityToken
        ? `أهلاً ${selected.name} 👋\nده لينك تجديد الإتاحة بتاعك في دليل جنزور:\n${origin}/availability/${selected.availabilityToken}\nأول ما تكون متاح، افتح اللينك واضغط الزر — كارتك هيظهر «متاح الآن» للناس ٤ ساعات.`
        : `اضغط «نسخ لينك التجديد» من قائمة إجراءات المهنة أولًا لتوليد اللينك، وبعدها ارجع هنا.`,
    },
    {
      id: "card",
      title: "بيانات الكارت للمشاركة",
      text: `دي بياناتي على دليل جنزور ✅\n${selected.name} — ${getCategory(selected.category, categories).name}\n📞 ${selected.phone}${selected.phoneSecondary ? `\n📞 ${selected.phoneSecondary}` : ""}${selected.address ? `\n📍 ${selected.address}` : ""}\n${origin}/?service=${selected.id}`,
    },
    {
      id: "renew-reminder",
      title: "تذكير بتجديد الإتاحة",
      text: selected.availabilityToken
        ? `أهلاً ${selected.name}، لو شغلانك متاحة دلوقتي ⏳\nجدّد إتاحتك على دليل جنزور من اللينك ده:\n${origin}/availability/${selected.availabilityToken}\nضغطة واحدة وكارتك يظهر «متاح الآن» للناس ٤ ساعات.`
        : `اضغط «نسخ لينك التجديد» من قائمة إجراءات المهنة أولًا لتوليد اللينك أولًا.`,
    },
  ] : [];

  function getKey(templateId: string) {
    return `${selected?.id ?? "default"}:${templateId}`;
  }
  function getText(templateId: string, fallback: string) {
    const key = getKey(templateId);
    return key in customTexts ? customTexts[key] : fallback;
  }
  function updateText(templateId: string, value: string) {
    setCustomTexts((current) => ({ ...current, [getKey(templateId)]: value }));
  }
  function toggleEdit(templateId: string, fallback: string) {
    if (editingId === templateId) { setEditingId(null); return; }
    const key = getKey(templateId);
    if (!(key in customTexts)) setCustomTexts((current) => ({ ...current, [key]: fallback }));
    setEditingId(templateId);
  }
  function resetTemplate(templateId: string) {
    const key = getKey(templateId);
    setCustomTexts((current) => { const next = { ...current }; delete next[key]; return next; });
    if (editingId === templateId) setEditingId(null);
  }

  async function copy(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1800); }
    catch { window.prompt("انسخ الرسالة يدويًا:", text); }
  }

  if (!approved.length) {
    return <div className="empty-state admin-empty"><span><MessageSquareQuote size={36}/></span><h3>لسه مفيش مهنات منشورة</h3><p>أول ما توافق على طلب مهنة، هتلاقي هنا رسايل جاهزة تتبعت لصاحبها على واتساب.</p></div>;
  }
  return <div className="admin-replies">
    <aside className="replies-picker">
      <div className="admin-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو التخصص..." aria-label="البحث عن مهنة لإرسال الردود لها"/></div>
      <div className="replies-provider-list">{filtered.map((service) => <button type="button" key={service.id} className={selected?.id === service.id ? "is-selected" : ""} onClick={() => { setSelectedId(service.id); setCopied(""); setEditingId(null); }}><span className="admin-category-icon" style={{ color: getCategory(service.category, categories).color, background: getCategory(service.category, categories).light }}><CategoryIcon icon={getCategory(service.category, categories).icon} size={20}/></span><div><strong>{service.name}</strong><small>{getCategory(service.category, categories).name}</small></div></button>)}</div>
      {!filtered.length && <p className="replies-empty">مفيش نتائج للبحث</p>}
    </aside>
    <div className="replies-templates">
      {templates.map((template) => {
        const currentText = getText(template.id, template.text);
        const isEditing = editingId === template.id;
        const isModified = getKey(template.id) in customTexts && customTexts[getKey(template.id)] !== template.text;
        return <article key={template.id} className={`reply-card ${isEditing ? "is-editing" : ""}`}>
          <div className="reply-card-head">
            <h3>{template.title}</h3>
            <button type="button" className={`icon-button reply-edit-icon ${isEditing ? "is-active" : ""}`} onClick={() => toggleEdit(template.id, template.text)} aria-label={isEditing ? `حفظ تعديل ${template.title}` : `تعديل رسالة ${template.title}`} title={isEditing ? "حفظ التعديل" : "تعديل الرسالة"}>{isEditing ? <Check size={16}/> : <Pencil size={16}/>}</button>
          </div>
          {isEditing ? (
            <textarea className="reply-editor" value={currentText} onChange={(event) => updateText(template.id, event.target.value)} rows={5} aria-label={`تعديل نص ${template.title}`}/>
          ) : (
            <pre>{currentText}</pre>
          )}
          <div className="reply-actions">
            <button type="button" className={`button button-soft button-small ${copied === template.id ? "is-copied" : ""}`} onClick={() => void copy(currentText, template.id)}>{copied === template.id ? <Check size={15}/> : <Copy size={15}/>}{copied === template.id ? "تم النسخ" : "نسخ"}</button>
            <button type="button" className={`button button-soft button-small ${isEditing ? "is-editing-btn" : ""}`} onClick={() => toggleEdit(template.id, template.text)}>{isEditing ? <Check size={15}/> : <Pencil size={15}/>}{isEditing ? "حفظ التعديل" : "تعديل الرسالة"}</button>
            {isModified && <button type="button" className="button button-soft button-small" onClick={() => resetTemplate(template.id)} title="استعادة النص الأصلي"><RotateCcw size={14}/>استعادة الأصلي</button>}
            {selected && <a className="button button-success button-small" href={whatsappUrl(selected.phone, currentText)} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/>واتساب {selected.name}</a>}
          </div>
        </article>;
      })}
    </div>
  </div>;
}

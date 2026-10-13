"use client";

import { useMemo, useState } from "react";
import { BellRing, Check, Copy, LoaderCircle, Megaphone, MessageCircle, MessageSquareQuote, Pencil, RotateCcw, Search, Share2, Sparkles } from "lucide-react";
import { getCategory, supportsHomeDelivery, whatsappUrl, type AdminDirectory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui";
import SelectField from "@/components/select-field";

type SocialPostKind = "general" | "category" | "delivery" | "emergency" | "newest";

// الردود الجاهزة + مولد منشورات فيسبوك وواتساب جاهزة من بيانات الدليل الحقيقية
export default function AdminReplies({
  services,
  categories,
  onNotified,
}: {
  services: ServiceRecord[];
  categories: CategoryRecord[];
  onNotified?: (next: AdminDirectory, message: string) => void;
}) {
  const approved = useMemo(() => services.filter((service) => service.status === "approved"), [services]);
  const roots = useMemo(() => categories.filter((cat) => !cat.parentId && cat.active), [categories]);
  const [postKind, setPostKind] = useState<SocialPostKind>("general");
  const [postRootId, setPostRootId] = useState<string>(roots[0]?.id ?? "clinics");
  const [postSpecialtyId, setPostSpecialtyId] = useState<string>("");
  const [customPostText, setCustomPostText] = useState<string | null>(null);
  const [postCopied, setPostCopied] = useState(false);

  const [search, setSearch] = useState(""), [selectedId, setSelectedId] = useState(approved[0]?.id ?? ""), [copied, setCopied] = useState("");
  const [sendingNotif, setSendingNotif] = useState(""), [sentNotif, setSentNotif] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const filtered = approved.filter((service) => {
    const term = search.trim();
    return !term || `${service.name} ${service.phone} ${getCategory(service.category, categories).name} ${service.area}`.includes(term);
  });
  const selected = approved.find((service) => service.id === selectedId) ?? filtered[0];
  const origin = typeof window === "undefined" ? "https://daleel-ganzour.vercel.app" : window.location.origin;

  const generatedSocialPost = useMemo(() => {
    const siteLink = origin || "https://daleel-ganzour.vercel.app";
    if (postKind === "general") {
      const rootNames = roots.map((r) => `✅ ${r.name}`).join("\n");
      return (
        `🌟 أهلاً بأهلنا في قرية جنزور 🌟\n` +
        `دلوقتي كل أرقام وعناوين المهنيين والأطباء والصيدليات والمحلات والمدرسين في جنزور متجمعة في مكان واحد في «دليل قرية جنزور» (+${approved.length} خدمة ومهنة موثقة) 👇\n\n` +
        `${rootNames}\n\n` +
        `✨ مميزات الدليل لأهل القرية:\n` +
        `• 🛵 فلتر خاص للخدمات التي توفر «التوصيل للمنازل» بجنزور\n` +
        `• 🎓 فلتر المراحل الدراسية في قسم المدرسين (تأسيس • ابتدائي • إعدادي • ثانوي • أزهري)\n` +
        `• 🚨 قسم خاص للصيدليات والعيادات المناوبة وأرقام الطوارئ\n` +
        `• ➕ إضافة مهنتك أو نشاطك التجاري مجاناً بالكامل\n\n` +
        `🔗 تصفح الدليل أو أضف مهنتك الآن من هنا:\n${siteLink}`
      );
    }

    if (postKind === "category") {
      const targetCat = postSpecialtyId
        ? getCategory(postSpecialtyId, categories)
        : getCategory(postRootId, categories);
      const list = approved.filter((service) => {
        if (postSpecialtyId) return service.category === postSpecialtyId;
        const cat = getCategory(service.category, categories);
        return cat.parentId === postRootId || service.category === postRootId;
      });
      const sample = list.slice(0, 14);
      const lines = sample.map((item, idx) => {
        const spec = getCategory(item.category, categories).name;
        const badges = [
          supportsHomeDelivery(item) ? "🛵 توصيل" : "",
          item.emergency ? "🚨 طوارئ" : "",
        ].filter(Boolean).join(" • ");
        return `${idx + 1}. ${item.name} (${spec}) — 📞 ${item.phone}${item.address ? ` — 📍 ${item.address}` : ""}${badges ? ` [${badges}]` : ""}`;
      });
      const categoryUrl = postSpecialtyId
        ? `${siteLink}/categories/${postRootId}/${postSpecialtyId}`
        : `${siteLink}/categories/${postRootId}`;
      return (
        `📌 دليل «${targetCat.name}» في قرية جنزور 📌\n` +
        `جمعنالكم أرقام وعناوين مقدمي الخدمة في ${targetCat.name} بجنزور للتواصل المباشر بضغطة واحدة:\n\n` +
        (lines.length > 0 ? lines.join("\n") : "• جاري إضافة مقدمي الخدمة في هذا التخصص...") +
        (list.length > sample.length ? `\n... و+${list.length - sample.length} آخرين على الموقع!` : "") +
        `\n\n🔗 لتصفح القائمة كاملة أو إضافة اسمك مجاناً في القسم:\n${categoryUrl}`
      );
    }

    if (postKind === "delivery") {
      const deliveryList = approved.filter((service) => supportsHomeDelivery(service));
      const sample = deliveryList.slice(0, 14);
      const lines = sample.map((item, idx) => {
        const spec = getCategory(item.category, categories).name;
        return `${idx + 1}. ${item.name} (${spec}) — 📞 ${item.phone}${item.address ? ` — 📍 ${item.address}` : ""}`;
      });
      return (
        `🛵 خدمات التوصيل للمنازل والزيارات المنزلية في جنزور 🛵\n` +
        `محتاج صيدلية أو سوبر ماركت أو معمل تحاليل أو خدمة توصلك لحد البيت في جنزور؟ دي قائمة بالخدمات اللي بتوفر توصيل أو خدمة منزلية:\n\n` +
        (lines.length > 0 ? lines.join("\n") : "• تصفح الموقع لعرض أحدث خدمات التوصيل بجنزور.") +
        `\n\n💡 تقدر كمان تفتح الموقع وتضغط على زر «🛵 يوجد توصيل للمنازل» لعرض كل الخدمات فوراً:\n${siteLink}`
      );
    }

    if (postKind === "emergency") {
      const emergencyList = approved.filter((service) => service.emergency || service.category === "pharmacies").slice(0, 12);
      const lines = emergencyList.map((item, idx) => {
        const spec = getCategory(item.category, categories).name;
        return `${idx + 1}. ${item.name} (${spec}) — 📞 ${item.phone}`;
      });
      return (
        `🚨 أرقام الطوارئ والخدمات العاجلة والصيدليات في جنزور 🚨\n` +
        `احتفظ بالمنشور ده عشان لو احتجت أي رقم طوارئ أو صيدلية أو فني طوارئ في جنزور في أي وقت:\n\n` +
        `🚑 أرقام الطوارئ العامة:\n` +
        `• الإسعاف: 123  |  المطافي: 180  |  النجدة: 122  |  طوارئ الكهرباء: 121\n\n` +
        `🏥 صيدليات وخدمات متاحة للطوارئ بجنزور:\n` +
        (lines.length > 0 ? lines.join("\n") : "• تصفح قسم الطوارئ والمناوبات على الموقع.") +
        `\n\n🔗 لعرض الصيدلية والعيادة المناوبة الآن لحظة بلحظة:\n${siteLink}`
      );
    }

    // newest
    const newestList = [...approved]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 10);
    const lines = newestList.map((item, idx) => {
      const spec = getCategory(item.category, categories).name;
      return `${idx + 1}. ${item.name} — ${spec} (📞 ${item.phone})`;
    });
    return (
      `✨ أحدث المهن والخدمات المضافة في دليل قرية جنزور ✨\n` +
      `نرحب بانضمام كوكبة جديدة من المهنيين ومقدمي الخدمات لأهلنا في جنزور:\n\n` +
      (lines.length > 0 ? lines.join("\n") : "") +
      `\n\n📢 لو عندك مهنة، عيادة، محل، أو بتدي دروس في جنزور.. ضيف بياناتك مجاناً في أقل من دقيقة من هنا:\n${siteLink}`
    );
  }, [postKind, postRootId, postSpecialtyId, approved, categories, roots, origin]);

  const activePostText = customPostText ?? generatedSocialPost;

  async function copySocialPost() {
    try {
      await navigator.clipboard.writeText(activePostText);
      setPostCopied(true);
      setTimeout(() => setPostCopied(false), 2000);
    } catch {
      window.prompt("انسخ المنشور يدويًا:", activePostText);
    }
  }

  const templates = selected ? [
    {
      id: "published",
      title: "مبروك.. مهنتك اتنشرت",
      text: `مبروك يا ${selected.name} 🎉\nمهنتك بقت ظاهرة في دليل جنزور تحت تخصص «${getCategory(selected.category, categories).name}».\nكارتك: ${origin}/?service=${selected.id}\nالناس بتشوف بياناتك وتكلمك على طول. بالتوفيق!`,
    },
    {
      id: "complete-data",
      title: "طلب استكمال البيانات",
      text: `أهلاً ${selected.name} 👋\nيرجى استكمال بيانات مهنتك «${selected.name}» على دليل جنزور لتظهر بشكل كامل وموثق لأهل القرية.\nافتح كارت مهنتك واضغط على زر «استكمال بيانات»:\n${origin}/?service=${selected.id}`,
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

  async function sendProviderNotification(templateId: string, title: string, text: string) {
    if (!selected || sendingNotif) return;
    setSendingNotif(templateId);
    try {
      const action = templateId === "complete-data" ? "request-completion" : "notify-provider";
      const response = await fetch("/api/admin", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          action,
          id: selected.id,
          title: `${title} — ${selected.name}`,
          message: text,
          completionNote: templateId === "complete-data" ? text : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إرسال الإشعار.");
      setSentNotif(templateId);
      setTimeout(() => setSentNotif(""), 2200);
      onNotified?.(result as AdminDirectory, `تم إرسال إشعار «${title}» إلى ${selected.name} داخل التطبيق.`);
    } catch {
      setSentNotif(templateId);
      setTimeout(() => setSentNotif(""), 2200);
    } finally {
      setSendingNotif("");
    }
  }

  if (!approved.length) {
    return <div className="empty-state admin-empty"><span><MessageSquareQuote size={36}/></span><h3>لسه مفيش مهنات منشورة</h3><p>أول ما توافق على طلب مهنة، هتلاقي هنا رسايل جاهزة تتبعت لصاحبها على واتساب أو كإشعار داخل التطبيق.</p></div>;
  }
  return (
    <div className="admin-replies-stack">
      <section className="social-post-generator-card" aria-label="مولد منشورات فيسبوك وواتساب جاهزة">
        <div className="social-post-head">
          <div className="social-post-title-wrap">
            <span className="social-post-icon"><Megaphone size={20}/></span>
            <div>
              <h3>📣 مولّد منشورات فيسبوك وواتساب جاهزة للنشر في جروبات جنزور</h3>
              <p>اختر نوع المنشور وسيتم تجميع أسماء وأرقام المهنيين الحقيقية من الدليل تلقائياً مع إمكانية تعديل النص قبل النسخ.</p>
            </div>
          </div>
          <span className="social-post-count-badge">
            <Sparkles size={14}/> +{approved.length} خدمة جاهزة للنشر
          </span>
        </div>

        <div className="social-post-type-tabs" role="tablist" aria-label="أنواع المنشورات الجاهزة">
          {[
            { id: "general" as const, label: "🌟 بوست تعريفي عام بالدليل" },
            { id: "category" as const, label: "📂 بوست دليل قسم أو تخصص كامل" },
            { id: "delivery" as const, label: "🛵 بوست خدمات التوصيل للمنازل" },
            { id: "emergency" as const, label: "🚨 بوست الطوارئ والصيدليات" },
            { id: "newest" as const, label: "✨ بوست أحدث المهن المضافة" },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              role="tab"
              aria-selected={postKind === tabItem.id}
              className={`social-post-tab ${postKind === tabItem.id ? "is-active" : ""}`}
              onClick={() => {
                setPostKind(tabItem.id);
                setCustomPostText(null);
              }}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {postKind === "category" && (
          <div className="social-post-filters">
            <label className="field">
              <span>اختر القسم الرئيسي</span>
              <SelectField
                value={postRootId}
                onChange={(e) => {
                  setPostRootId(e.target.value);
                  setPostSpecialtyId("");
                  setCustomPostText(null);
                }}
              >
                {roots.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </SelectField>
            </label>

            <label className="field">
              <span>أو حدد تخصصاً فرعياً داخل القسم (اختياري)</span>
              <SelectField
                value={postSpecialtyId}
                onChange={(e) => {
                  setPostSpecialtyId(e.target.value);
                  setCustomPostText(null);
                }}
              >
                <option value="">كل تخصصات القسم</option>
                {categories
                  .filter((cat) => cat.parentId === postRootId && cat.active)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </SelectField>
            </label>
          </div>
        )}

        <div className="social-post-editor-box">
          <textarea
            className="social-post-textarea"
            rows={9}
            value={activePostText}
            onChange={(e) => setCustomPostText(e.target.value)}
            aria-label="نص المنشور الجاهز للنشر"
          />
          <div className="social-post-actions">
            <button
              type="button"
              className={`button button-primary button-small ${postCopied ? "is-copied" : ""}`}
              onClick={() => void copySocialPost()}
            >
              {postCopied ? <Check size={16}/> : <Copy size={16}/>}
              <span>{postCopied ? "تم نسخ المنشور بنجاح!" : "نسخ المنشور لفيسبوك"}</span>
            </button>

            <a
              className="button button-success button-small"
              href={`https://wa.me/?text=${encodeURIComponent(activePostText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 size={15}/>
              <span>مشاركة في جروبات واتساب</span>
            </a>

            {customPostText !== null && (
              <button
                type="button"
                className="button button-soft button-small"
                onClick={() => setCustomPostText(null)}
              >
                <RotateCcw size={15}/>
                <span>استعادة النص التلقائي</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="admin-replies">
        <aside className="replies-picker">
      <div className="admin-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو التخصص..." aria-label="البحث عن مهنة لإرسال الردود لها"/></div>
      <div className="replies-provider-list">{filtered.map((service) => <button type="button" key={service.id} className={selected?.id === service.id ? "is-selected" : ""} onClick={() => { setSelectedId(service.id); setCopied(""); setSentNotif(""); setEditingId(null); }}><span className="admin-category-icon" style={{ color: getCategory(service.category, categories).color, background: getCategory(service.category, categories).light }}><CategoryIcon icon={getCategory(service.category, categories).icon} size={20}/></span><div><strong>{service.name}</strong><small>{getCategory(service.category, categories).name}</small></div></button>)}</div>
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
            <div className="reply-card-head-tools">
              <button
                type="button"
                className={`icon-button reply-notify-icon ${sentNotif === template.id ? "is-active" : ""}`}
                disabled={sendingNotif === template.id}
                onClick={() => void sendProviderNotification(template.id, template.title, currentText)}
                aria-label={`إرسال إشعار ${template.title}`}
                title="إرسال إشعار للمهني داخل التطبيق"
              >
                {sendingNotif === template.id ? <LoaderCircle size={16} className="spin"/> : sentNotif === template.id ? <Check size={16}/> : <BellRing size={16}/>}
              </button>
              <button type="button" className={`icon-button reply-edit-icon ${isEditing ? "is-active" : ""}`} onClick={() => toggleEdit(template.id, template.text)} aria-label={isEditing ? `حفظ تعديل ${template.title}` : `تعديل رسالة ${template.title}`} title={isEditing ? "حفظ التعديل" : "تعديل الرسالة"}>{isEditing ? <Check size={16}/> : <Pencil size={16}/>}</button>
            </div>
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
            {selected && (
              <button
                type="button"
                className={`button button-primary button-small reply-notify-btn ${sentNotif === template.id ? "is-sent" : ""}`}
                disabled={sendingNotif === template.id}
                onClick={() => void sendProviderNotification(template.id, template.title, currentText)}
              >
                {sendingNotif === template.id ? <LoaderCircle size={15} className="spin"/> : sentNotif === template.id ? <Check size={15}/> : <BellRing size={15}/>}
                {sendingNotif === template.id ? "جاري الإرسال.." : sentNotif === template.id ? "تم إرسال الإشعار" : "إرسال إشعار"}
              </button>
            )}
            {selected && <a className="button button-success button-small" href={whatsappUrl(selected.phone, currentText)} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/>واتساب {selected.name}</a>}
          </div>
        </article>;
      })}
    </div>
  </div>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { BellRing, Check, Copy, LoaderCircle, Megaphone, MessageCircle, MessageSquareQuote, RotateCcw, Search, Share2, Sparkles, UserCheck } from "lucide-react";
import { getCategory, isPharmacyCategory, supportsHomeDelivery, whatsappUrl, type AdminDirectory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui";
import SelectField from "@/components/select-field";

type SocialPostKind = "general" | "category" | "provider" | "delivery" | "emergency" | "newest";

export default function AdminReplies({
  services,
  categories,
  mode = "replies",
  onNotified,
}: {
  services: ServiceRecord[];
  categories: CategoryRecord[];
  mode?: "replies" | "posts";
  onNotified?: (next: AdminDirectory, message: string) => void;
}) {
  const approved = useMemo(() => services.filter((service) => service.status === "approved"), [services]);
  const roots = useMemo(() => categories.filter((cat) => !cat.parentId && cat.active), [categories]);
  const [postKind, setPostKind] = useState<SocialPostKind>("general");
  const [postRootId, setPostRootId] = useState<string>(roots[0]?.id ?? "clinics");
  const [postSpecialtyId, setPostSpecialtyId] = useState<string>("");
  const [postProviderId, setPostProviderId] = useState<string>(approved[0]?.id ?? "");
  const [customPostText, setCustomPostText] = useState<string | null>(null);
  const [postCopied, setPostCopied] = useState(false);

  const [search, setSearch] = useState(""), [selectedId, setSelectedId] = useState(approved[0]?.id ?? ""), [copied, setCopied] = useState("");
  const [sendingNotif, setSendingNotif] = useState(""), [sentNotif, setSentNotif] = useState("");

  const filtered = approved.filter((service) => {
    const term = search.trim();
    return !term || `${service.name} ${service.phone} ${getCategory(service.category, categories).name} ${service.area}`.includes(term);
  });
  const selected = approved.find((service) => service.id === selectedId) ?? filtered[0];
  const selectedPostProvider = approved.find((service) => service.id === postProviderId) ?? approved[0];
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

    if (postKind === "provider" && selectedPostProvider) {
      const spec = getCategory(selectedPostProvider.category, categories).name;
      const providerUrl = `${siteLink}/?service=${encodeURIComponent(selectedPostProvider.id)}`;
      return (
        `✨ بطاقة تعريفية من «دليل قرية جنزور» ✨\n\n` +
        `👤 الاسم: ${selectedPostProvider.name}\n` +
        `🏷️ التخصص: ${spec}\n` +
        `📍 العنوان: ${selectedPostProvider.address || selectedPostProvider.area || "قرية جنزور"}\n` +
        `📞 رقم التواصل: ${selectedPostProvider.phone}${selectedPostProvider.phoneSecondary ? ` / ${selectedPostProvider.phoneSecondary}` : ""}\n` +
        (selectedPostProvider.workingHours ? `🕒 مواعيد العمل: ${selectedPostProvider.workingHours}\n` : "") +
        (selectedPostProvider.description ? `\n📝 نبذة عن الخدمة:\n${selectedPostProvider.description}\n` : "") +
        `\n🔗 للتواصل المباشر وعرض الصفحة الكاملة على دليل جنزور:\n${providerUrl}`
      );
    }

    if (postKind === "delivery") {
      const deliveryList = approved.filter((service) => supportsHomeDelivery(service));
      const sample = deliveryList.slice(0, 14);
      const lines = sample.map((item, idx) => {
        const spec = getCategory(item.category, categories).name;
        return `${idx + 1}. 🛵 ${item.name} (${spec}) — 📞 ${item.phone}${item.address ? ` — ${item.address}` : ""}`;
      });
      return (
        `🛵 دليل خدمات ومطاعم ومحلات وصيدليات «التوصيل للمنازل» في قرية جنزور 🛵\n` +
        `اطلب كل احتياجات بيتك في جنزور بالتليفون أو واتساب لحد باب البيت:\n\n` +
        (lines.length > 0 ? lines.join("\n") : "• تصفح خدمات التوصيل للمنازل مباشرة على الموقع") +
        `\n\n🔗 لعرض كل خدمات التوصيل في جنزور بضغطة زر:\n${siteLink}`
      );
    }

    if (postKind === "emergency") {
      const emergencyList = approved.filter((service) => service.emergency || isPharmacyCategory(service.category, categories));
      const sample = emergencyList.slice(0, 14);
      const lines = sample.map((item, idx) => {
        const spec = getCategory(item.category, categories).name;
        return `${idx + 1}. 🚨 ${item.name} (${spec}) — 📞 ${item.phone}${item.address ? ` — ${item.address}` : ""}`;
      });
      return (
        `🚨 أرقام الطوارئ والصيدليات والخدمات المناوبة في قرية جنزور 🚨\n` +
        `احتفظ بالمنشور ده للضرورة — أرقام الخدمات المناوبة والطوارئ لأهل جنزور:\n\n` +
        (lines.length > 0 ? lines.join("\n") : "• تصفح قسم المناوبات وأرقام الطوارئ على الموقع") +
        `\n\n🔗 لمتابعة الصيدليات والعيادات المناوبة لحظة بلحظة:\n${siteLink}`
      );
    }

    const newestList = [...approved]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 10);
    const newestLines = newestList.map((item, idx) => {
      const spec = getCategory(item.category, categories).name;
      return `${idx + 1}. ✨ ${item.name} — ${spec} (📞 ${item.phone})`;
    });
    return (
      `🎉 نرحب بأحدث المنضمين إلى «دليل المهن والخدمات بقرية جنزور» 🎉\n\n` +
      newestLines.join("\n") +
      `\n\n➕ لو عندك مهنة أو محل أو عيادة أو بتدي دروس في جنزور، سجل بياناتك مجاناً في دقيقة واحدة:\n${siteLink}/add-service`
    );
  }, [postKind, postRootId, postSpecialtyId, selectedPostProvider, approved, roots, categories, origin]);

  const activePostText = customPostText ?? generatedSocialPost;

  async function copySocialPost() {
    try {
      await navigator.clipboard.writeText(activePostText);
      setPostCopied(true);
      setTimeout(() => setPostCopied(false), 2000);
    } catch {
      window.prompt("انسخ المنشور يدوياً:", activePostText);
    }
  }

  const serviceUrl = selected ? `${origin}/?service=${encodeURIComponent(selected.id)}#services` : origin;
  const selectedName = selected?.name ?? "اسم المهني";
  const selectedCategoryName = selected ? getCategory(selected.category, categories).name : "التخصص";
  const selectedArea = selected?.area ?? "المنطقة";
  const templates = [
    { id: "approved", title: "رسالة قبول ونشر المهنة", text: `أهلاً بحضرتك يا ${selectedName} في دليل قرية جنزور.\nتمت الموافقة على إضافة خدمتك في قسم (${selectedCategoryName} - ${selectedArea}) وظهرت الآن لكل أهل القرية على الموقع.\n\nرابط صفحتك المباشر للمشاركة على واتساب وفيسبوك:\n${serviceUrl}` },
    { id: "share", title: "رسالة مشاركة الصفحة", text: `دي صفحتك على دليل المهن والخدمات بقرية جنزور يا ${selectedName} (${selectedCategoryName}):\n${serviceUrl}\n\nتقدر تبعت الرابط لأي عميل أو تنشره في جروبات جنزور علشان الناس توصلك بسهولة.` },
    { id: "update", title: "رسالة تأكيد تحديث البيانات", text: `تم تحديث بيانات صفحة (${selectedName}) على دليل قرية جنزور بنجاح.\nتقدر تراجع التعديل من الرابط ده:\n${serviceUrl}` },
  ];

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
    return (
      <div className="empty-state admin-empty">
        <span><MessageSquareQuote size={36}/></span>
        <h3>لسه مفيش مهنات منشورة</h3>
        <p>أول ما توافق على طلب مهنة، هتلاقي هنا المنشورات والردود الجاهزة للنشر والمراسلة.</p>
      </div>
    );
  }

  if (mode === "posts") {
    return (
      <div className="admin-replies-stack admin-formatted-page">
        <section className="social-post-generator-card" aria-label="مولد منشورات فيسبوك وواتساب جاهزة">
          <div className="social-post-head">
            <div className="social-post-title-wrap">
              <span className="social-post-icon"><Megaphone size={22}/></span>
              <div>
                <h3>📣 مولّد منشورات فيسبوك وواتساب التلقائي</h3>
                <p>أنشئ منشورات ترويجية منسقة بأسماء وأرقام المهنيين الحقيقية في جنزور بضغطة زر واحدة.</p>
              </div>
            </div>
            <span className="social-post-count-badge">
              <Sparkles size={14}/> +{approved.length} خدمة منشورة
            </span>
          </div>

          <div className="admin-Visual-divider" role="separator">
            <span>١. اختر نوع المنشور المطلوب</span>
          </div>

          <div className="social-post-type-tabs" role="tablist" aria-label="أنواع المنشورات الجاهزة">
            {[
              { id: "general" as const, label: "🌟 بوست تعريفي عام بالدليل" },
              { id: "category" as const, label: "📂 بوست دليل قسم أو تخصص كامل" },
              { id: "provider" as const, label: "👤 بوست ترويجي لمهني محدد" },
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
            <>
              <div className="admin-Visual-divider" role="separator">
                <span>٢. تحديد القسم والتخصص الفرعي</span>
              </div>
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
            </>
          )}

          {postKind === "provider" && (
            <>
              <div className="admin-Visual-divider" role="separator">
                <span>٢. اختيار مقدم الخدمة للمنشور الفردي</span>
              </div>
              <div className="social-post-filters">
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>اختر المهني أو النشاط التجاري</span>
                  <SelectField
                    value={postProviderId}
                    onChange={(e) => {
                      setPostProviderId(e.target.value);
                      setCustomPostText(null);
                    }}
                  >
                    {approved.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — ({getCategory(srv.category, categories).name})
                      </option>
                    ))}
                  </SelectField>
                </label>
              </div>
            </>
          )}

          <div className="admin-Visual-divider" role="separator">
            <span>{postKind === "category" || postKind === "provider" ? "٣. معاينة المنشور والنسخ والمشاركة" : "٢. معاينة المنشور والنسخ والمشاركة"}</span>
          </div>

          <div className="social-post-editor-box">
            <textarea
              className="social-post-textarea"
              rows={10}
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
      </div>
    );
  }

  return (
    <div className="admin-replies-stack admin-formatted-page">
      <section className="replies-page-banner" aria-label="الردود الجاهزة ومراسلة المهنيين">
        <div className="social-post-head">
          <div className="social-post-title-wrap">
            <span className="social-post-icon"><MessageSquareQuote size={22}/></span>
            <div>
              <h3>💬 الردود الجاهزة ومراسلة مقدمي الخدمات</h3>
              <p>اختر المهني من القائمة ثم استخدم أيقونات النسخ أو الإشعار الفوري أو واتساب بضغطة واحدة.</p>
            </div>
          </div>
          {selected && (
            <span className="social-post-count-badge">
              <UserCheck size={14}/> المحدد حالياً: {selected.name}
            </span>
          )}
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span>١. اختيار المهني وقوالب المراسلة الفورية</span>
      </div>

      <div className="admin-replies">
        <aside className="replies-picker">
          <div className="replies-picker-head">
            <strong>قائمة المهنيين ({filtered.length})</strong>
          </div>
          <div className="admin-search">
            <Search size={18}/>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالاسم أو التخصص..."
              aria-label="البحث عن مهنة لإرسال الردود لها"
            />
          </div>
          <div className="replies-provider-list">
            {filtered.map((service) => (
              <button
                type="button"
                key={service.id}
                className={selected?.id === service.id ? "is-selected" : ""}
                onClick={() => {
                  setSelectedId(service.id);
                  setCopied("");
                  setSentNotif("");
                }}
              >
                <span
                  className="admin-category-icon"
                  style={{
                    color: getCategory(service.category, categories).color,
                    background: getCategory(service.category, categories).light,
                  }}
                >
                  <CategoryIcon icon={getCategory(service.category, categories).icon} size={20}/>
                </span>
                <div>
                  <strong>{service.name}</strong>
                  <small>{getCategory(service.category, categories).name}</small>
                </div>
              </button>
            ))}
          </div>
          {!filtered.length && <p className="replies-empty">مفيش نتائج للبحث</p>}
        </aside>

        <div className="replies-templates">
          {templates.map((template, idx) => {
            const currentText = template.text;
            return (
              <div key={template.id} className="reply-card-wrapper">
                {idx > 0 && (
                  <div className="admin-Visual-divider reply-item-divider" role="separator">
                    <span>✦ قالب رقم {idx + 1} ✦</span>
                  </div>
                )}
                <article className="reply-card">
                  <div className="reply-card-head">
                    <h3>{template.title}</h3>
                    <div className="reply-actions-icons" role="group" aria-label={`أدوات ${template.title}`}>
                      <button
                        type="button"
                        className={`reply-action-icon-btn is-copy ${copied === template.id ? "is-active" : ""}`}
                        onClick={() => void copy(currentText, template.id)}
                        aria-label={copied === template.id ? "تم نسخ الرسالة" : `نسخ ${template.title}`}
                        title={copied === template.id ? "تم النسخ!" : "نسخ الرسالة"}
                      >
                        {copied === template.id ? <Check size={17}/> : <Copy size={17}/>}
                      </button>

                      {selected && (
                        <button
                          type="button"
                          className={`reply-action-icon-btn is-notify ${sentNotif === template.id ? "is-active" : ""}`}
                          disabled={sendingNotif === template.id}
                          onClick={() => void sendProviderNotification(template.id, template.title, currentText)}
                          aria-label={`إرسال إشعار ${template.title}`}
                          title={sentNotif === template.id ? "تم إرسال الإشعار" : "إرسال إشعار داخل التطبيق"}
                        >
                          {sendingNotif === template.id ? (
                            <LoaderCircle size={17} className="spin"/>
                          ) : sentNotif === template.id ? (
                            <Check size={17}/>
                          ) : (
                            <BellRing size={17}/>
                          )}
                        </button>
                      )}

                      {selected && (
                        <a
                          className="reply-action-icon-btn is-whatsapp"
                          href={whatsappUrl(selected.phone, currentText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`إرسال ${template.title} عبر واتساب إلى ${selected.name}`}
                          title={`إرسال عبر واتساب إلى ${selected.name}`}
                        >
                          <MessageCircle size={17}/>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="reply-card-divider" aria-hidden="true" />

                  <pre>{currentText}</pre>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

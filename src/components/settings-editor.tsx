"use client";

import { useState, type FormEvent } from "react";
import { BellRing, Building2, Check, Globe, LoaderCircle, MessageCircle, Send, Settings2, Share2, Sliders } from "lucide-react";
import { defaultDesignSettings, OFFICE_PHONE, type DesignSettings, type SiteSettings } from "@/lib/catalog";
import { allWhatsappAlertKinds, sanitizeWhatsappAlertKinds, whatsappAlertKinds, type WhatsappAlertKind } from "@/lib/whatsapp-alert-kinds";

export default function SettingsEditor({
  settings,
  designSettings,
  onSave,
  onSaveDesign,
  alertKinds,
  alertStatus,
  onSaveAlertKinds,
}: {
  settings: SiteSettings;
  designSettings?: DesignSettings;
  onSave: (values: SiteSettings) => Promise<boolean>;
  onSaveDesign?: (values: DesignSettings) => Promise<boolean>;
  alertKinds?: string[];
  alertStatus?: { lastSentAt: string | null; lastResult: string; lastKind: string };
  onSaveAlertKinds?: (kinds: string[]) => Promise<boolean>;
}) {
  const [values, setValues] = useState<SiteSettings>(settings);
  const [designValues, setDesignValues] = useState<DesignSettings>(() => ({
    ...defaultDesignSettings,
    ...(designSettings ?? {}),
  }));
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testNotice, setTestNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [kinds, setKinds] = useState<WhatsappAlertKind[]>(() => (alertKinds ? sanitizeWhatsappAlertKinds(alertKinds) : [...allWhatsappAlertKinds]));
  const [kindsBusy, setKindsBusy] = useState(false);
  const savedKinds = alertKinds ? sanitizeWhatsappAlertKinds(alertKinds) : [...allWhatsappAlertKinds];
  const kindsDirty = savedKinds.join(",") !== kinds.join(",");
  function toggleKind(id: WhatsappAlertKind) { setKinds((current) => sanitizeWhatsappAlertKinds(current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])); }
  async function persistKinds() {
    if (!onSaveAlertKinds) return;
    setKindsBusy(true);
    try { await onSaveAlertKinds(kinds); } finally { setKindsBusy(false); }
  }

  function updateSetting<K extends keyof SiteSettings>(key: K, val: SiteSettings[K]) {
    setValues((curr) => ({ ...curr, [key]: val }));
  }

  function updateDesign<K extends keyof DesignSettings>(key: K, val: DesignSettings[K]) {
    setDesignValues((curr) => ({ ...curr, [key]: val }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(values);
      if (onSaveDesign) {
        await onSaveDesign(designValues);
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendTestAlert() {
    setTestBusy(true);
    setTestNotice(null);
    try {
      const saved = await onSave(values);
      if (!saved) {
        setTestNotice({ text: "احفظ رقم الواتساب ومفتاح CallMeBot أولاً.", error: true });
        return;
      }
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "whatsapp-test" }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; detail?: string };
      if (!response.ok) {
        setTestNotice({ text: result.error ?? "تعذّر إرسال رسالة الاختبار.", error: true });
        return;
      }
      setTestNotice({ text: "تم إرسال رسالة الاختبار إلى واتساب بنجاح! افتح واتساب على الرقم المحفوظ للتأكد.", error: false });
    } catch {
      setTestNotice({ text: "تعذّر الاتصال بالخادم لإرسال رسالة الاختبار.", error: true });
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <form className="settings-form settings-formatted-page" onSubmit={submit}>
      <div className="settings-page-banner">
        <span className="settings-banner-icon">
          <Settings2 size={24}/>
        </span>
        <h3>⚙️ مركز إعدادات الموقع والمحتوى العام</h3>
        <p>جميع إعدادات ونصوص وبيانات الموقع مقسّمة باحترافية مع خانة إدخال واضحة لكل بند.</p>
      </div>

      {/* القسم الأول */}
      <div className="admin-Visual-divider" role="separator">
        <span><Globe size={15}/> القسم ١: الهوية الأساسية وعناوين الواجهة الرئيسية</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>نصوص الهوية والبانر الرئيسي</h4>
          <p>عدّل اسم الموقع والعناوين الترحيبية التي تظهر لزوار دليل قرية جنزور في أعلى الصفحة الرئيسية</p>
        </div>

        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-siteName">١. اسم الموقع الرسمي</label>
            <small className="settings-item-hint">يظهر في الهيدر وعنوان المتصفح والبانر</small>
            <input
              id="setting-siteName"
              className="studio-textbox"
              value={values.siteName}
              onChange={(e) => updateSetting("siteName", e.target.value)}
              placeholder="دليل المهن والخدمات بقرية جنزور"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-heroEyebrow">٢. الشارة الترحيبية أعلى البانر</label>
            <small className="settings-item-hint">العبارة المختصرة فوق اسم الموقع</small>
            <input
              id="setting-heroEyebrow"
              className="studio-textbox"
              value={values.heroEyebrow}
              onChange={(e) => updateSetting("heroEyebrow", e.target.value)}
              placeholder="دليل أهل جنزور"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-heroSubtitle">٣. الوصف الرئيسي تحت عنوان الموقع</label>
            <small className="settings-item-hint">جملة تعريفية شاملة بخدمات الدليل</small>
            <input
              id="setting-heroSubtitle"
              className="studio-textbox"
              value={values.heroSubtitle}
              onChange={(e) => updateSetting("heroSubtitle", e.target.value)}
              placeholder="أهل الخبرة قريبين منك.. كل خدمات جنزور في مكان واحد"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-tagline">٤. شعار الثقة المختصر</label>
            <small className="settings-item-hint">الكلمات التحفيزية أسفل الوصف الرئيسي</small>
            <input
              id="setting-tagline"
              className="studio-textbox"
              value={values.tagline}
              onChange={(e) => updateSetting("tagline", e.target.value)}
              placeholder="بسهولة • بسرعة • بثقة"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-benefitsHeading">٥. عنوان قسم مميزات الدليل</label>
            <small className="settings-item-hint">عنوان قسم التعريف بفوائد الدليل</small>
            <input
              id="setting-benefitsHeading"
              className="studio-textbox"
              value={values.benefitsHeading}
              onChange={(e) => updateSetting("benefitsHeading", e.target.value)}
              placeholder="ليه تختار دليل قرية جنزور؟"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-benefitsText">٦. نص وصف مميزات الدليل</label>
            <small className="settings-item-hint">الوصف التوضيحي تحت عنوان المميزات</small>
            <input
              id="setting-benefitsText"
              className="studio-textbox"
              value={values.benefitsText}
              onChange={(e) => updateSetting("benefitsText", e.target.value)}
              placeholder="دليل يجمع أهل القرية.. ويوصّل كل خدمة لأصحابها"
              required
            />
          </div>
        </div>
      </section>

      {/* القسم الثاني */}
      <div className="admin-Visual-divider" role="separator">
        <span><Building2 size={15}/> القسم ٢: بيانات مكتب الدليل والتواصل والواتساب</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>أرقام وعنوان المكتب ورسائل التواصل</h4>
          <p>حدد رقم الهاتف والواتساب الرسمي للإدارة وعنوان المكتب ومواعيد العمل ورسالة الترحيب</p>
        </div>

        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-phone">١. رقم هاتف وواتساب الإدارة</label>
            <small className="settings-item-hint">الرقم الرسمي لاستقبال اتصالات ورسائل الأهالي</small>
            <input
              id="setting-phone"
              dir="ltr"
              className="studio-textbox"
              value={values.phone}
              onChange={(e) => updateSetting("phone", e.target.value)}
              placeholder="01222355769"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-officeAddress">٢. عنوان مكتب الدليل في جنزور</label>
            <small className="settings-item-hint">العنوان التفصيلي للمكتب داخل القرية</small>
            <input
              id="setting-officeAddress"
              className="studio-textbox"
              value={designValues.officeAddress}
              onChange={(e) => updateDesign("officeAddress", e.target.value)}
              placeholder="قرية جنزور — بجوار مكتبة الجمال"
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-officeHours">٣. مواعيد عمل المكتب واستقبال الطلبات</label>
            <small className="settings-item-hint">المواعيد اليومية للتواصل المباشر</small>
            <input
              id="setting-officeHours"
              className="studio-textbox"
              value={designValues.officeWorkingHours}
              onChange={(e) => updateDesign("officeWorkingHours", e.target.value)}
              placeholder="يومياً من ٩ صباحاً حتى ١١ مساءً"
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-waGreeting">٤. رسالة الترحيب التلقائية في واتساب</label>
            <small className="settings-item-hint">تُكتب تلقائياً عند ضغط الزائر على زر واتساب المهني</small>
            <input
              id="setting-waGreeting"
              className="studio-textbox"
              value={designValues.whatsappDefaultGreeting}
              onChange={(e) => updateDesign("whatsappDefaultGreeting", e.target.value)}
              placeholder="مرحبًا، وصلت إليك من دليل المهن والخدمات بقرية جنزور."
            />
          </div>

          <div className="settings-item-box is-full-span">
            <label className="settings-item-label" htmlFor="setting-contactText">٥. النص التعريفي لنافذة «اتصل بنا»</label>
            <small className="settings-item-hint">يظهر للزوار داخل نافذة التواصل مع الإدارة</small>
            <input
              id="setting-contactText"
              className="studio-textbox"
              value={values.contactText}
              onChange={(e) => updateSetting("contactText", e.target.value)}
              placeholder="للاستفسار أو إضافة مهنتك في دليل جنزور تواصل معنا مباشرة"
              required
            />
          </div>
        </div>
      </section>

      {/* القسم الثالث */}
      <div className="admin-Visual-divider" role="separator">
        <span><Share2 size={15}/> القسم ٣: إعدادات الفوتر وروابط السوشيال ميديا والشعار</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>تذييل الموقع (Footer) وروابط التواصل الاجتماعي</h4>
          <p>تحكم في وصف الفوتر ونص حقوق الملكية وروابط فيسبوك وجروب واتساب جنزور</p>
        </div>

        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-footerDesc">١. وصف الموقع المختصر في الفوتر</label>
            <small className="settings-item-hint">الجملة الظاهرة أسفل اسم الموقع في الفوتر</small>
            <input
              id="setting-footerDesc"
              className="studio-textbox"
              value={designValues.footerDescription}
              onChange={(e) => updateDesign("footerDescription", e.target.value)}
              placeholder="دليل المهن والخدمات.. من أهل القرية لأهلها"
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-copyright">٢. نص حقوق النشر أسفل الموقع</label>
            <small className="settings-item-hint">يظهر في نهاية جميع صفحات الدليل ولوحة الإدارة</small>
            <input
              id="setting-copyright"
              className="studio-textbox"
              value={values.copyright}
              onChange={(e) => updateSetting("copyright", e.target.value)}
              placeholder="جميع الحقوق محفوظة — دليل جنزور"
              required
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-fbUrl">٣. رابط صفحة أو جروب فيسبوك الرسمي</label>
            <small className="settings-item-hint">ضع الرابط الكامل ليظهر في الفوتر</small>
            <input
              id="setting-fbUrl"
              dir="ltr"
              className="studio-textbox"
              placeholder="https://facebook.com/..."
              value={designValues.footerFacebookUrl}
              onChange={(e) => updateDesign("footerFacebookUrl", e.target.value)}
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-waGroupUrl">٤. رابط جروب واتساب أهل جنزور</label>
            <small className="settings-item-hint">رابط الدعوة لجروب أو قناة واتساب القرية</small>
            <input
              id="setting-waGroupUrl"
              dir="ltr"
              className="studio-textbox"
              placeholder="https://chat.whatsapp.com/..."
              value={designValues.footerWhatsappGroupUrl}
              onChange={(e) => updateDesign("footerWhatsappGroupUrl", e.target.value)}
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-headerLogo">٥. رابط صورة لوجو الهيدر (اختياري)</label>
            <small className="settings-item-hint">اتركه فارغاً لاستخدام شعار دليل جنزور الافتراضي</small>
            <input
              id="setting-headerLogo"
              dir="ltr"
              className="studio-textbox"
              placeholder="/images/logo-daleel-transparent.png"
              value={designValues.headerLogoUrl}
              onChange={(e) => updateDesign("headerLogoUrl", e.target.value)}
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-announcementText">٦. نص الإعلان الترحيبي الثابت</label>
            <small className="settings-item-hint">يُستخدم عند ضبط شريط الأخبار على الوضع الثابت</small>
            <input
              id="setting-announcementText"
              className="studio-textbox"
              placeholder="أهلاً بكم في دليل جنزور..."
              value={designValues.announcementText}
              onChange={(e) => updateDesign("announcementText", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* القسم الرابع */}
      <div className="admin-Visual-divider" role="separator">
        <span><Sliders size={15}/> القسم ٤: التحكم في أقسام وخصائص الموقع التفاعلية</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>تفعيل وإيقاف خصائص وأقسام الموقع</h4>
          <p>يمكنك تفعيل أو إيقاف أي ميزة من القائمة أو كتابة حالة التفعيل مباشرة</p>
        </div>

        <div className="settings-items-grid">
          {(
            [
              {
                id: "showEmergency",
                title: "١. شريط وأرقام الطوارئ والمناوبات",
                hint: "إظهار أرقام الطوارئ العاجلة في الموقع",
                checked: values.showEmergency,
                onToggle: (next: boolean) => updateSetting("showEmergency", next),
              },
              {
                id: "allowPublicSubmissions",
                title: "٢. استقبال طلبات إضافة مهنة جديدة",
                hint: "السماح للزوار بإرسال طلبات إضافة مهنتهم",
                checked: designValues.allowPublicSubmissions,
                onToggle: (next: boolean) => updateDesign("allowPublicSubmissions", next),
              },
              {
                id: "floatingWhatsappEnabled",
                title: "٣. زر واتساب العائم السريع",
                hint: "إظهار زر تواصل واتساب عائم أسفل الشاشة",
                checked: designValues.floatingWhatsappEnabled,
                onToggle: (next: boolean) => updateDesign("floatingWhatsappEnabled", next),
              },
              {
                id: "showFooterWhatsapp",
                title: "٤. زر واتساب الإدارة داخل الفوتر",
                hint: "عرض بطاقة التواصل عبر واتساب في الفوتر",
                checked: designValues.showFooterWhatsapp,
                onToggle: (next: boolean) => updateDesign("showFooterWhatsapp", next),
              },
              {
                id: "showFooterStats",
                title: "٥. عداد إحصائيات المهن والأقسام في الفوتر",
                hint: "عرض عدد الخدمات والأقسام والمناطق للزوار",
                checked: designValues.showFooterStats,
                onToggle: (next: boolean) => updateDesign("showFooterStats", next),
              },
              {
                id: "showAdminQuickEdit",
                title: "٦. زر «تعديل سريع» للأدمن على الكروت",
                hint: "يتيح للأدمن فتح تعديل المهنة مباشرة من الكارت",
                checked: designValues.showAdminQuickEdit,
                onToggle: (next: boolean) => updateDesign("showAdminQuickEdit", next),
              },
              {
                id: "membershipRequired",
                title: "٧. بيانات المهنيين للأعضاء فقط",
                hint: "الزائر يتصفح فقط: أرقام المهنيين وصفحات الأقسام تظهر بعد تسجيل الدخول أو إنشاء عضوية",
                checked: designValues.membershipRequired,
                onToggle: (next: boolean) => updateDesign("membershipRequired", next),
              },
            ] as const
          ).map((item) => (
            <div key={item.id} className="settings-item-box">
              <label className="settings-item-label" htmlFor={`toggle-box-${item.id}`}>
                {item.title}
              </label>
              <small className="settings-item-hint">{item.hint}</small>
              <div className="settings-toggle-textbox-row">
                <input
                  id={`toggle-box-${item.id}`}
                  type="text"
                  readOnly
                  className={`studio-textbox is-status-textbox ${item.checked ? "is-on" : "is-off"}`}
                  value={item.checked ? "✅ مفعّل وظاهر بالموقع" : "⏸️ متوقف / مخفي حالياً"}
                  onClick={() => item.onToggle(!item.checked)}
                />
                <button
                  type="button"
                  className={`button button-small ${item.checked ? "button-primary" : "button-soft"}`}
                  onClick={() => item.onToggle(!item.checked)}
                >
                  {item.checked ? "إيقاف" : "تفعيل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* القسم الخامس */}
      <div className="admin-Visual-divider" role="separator">
        <span><BellRing size={15}/> القسم ٥: تنبيهات واتساب الفورية للإدارة (CallMeBot)</span>
      </div>

      <section className="whatsapp-alerts-card settings-centered-alerts" aria-label="إعدادات تنبيهات واتساب المجانية">
        <div className="whatsapp-alerts-head">
          <span className="whatsapp-alerts-icon">
            <MessageCircle size={22}/>
          </span>
          <div>
            <h3>تنبيهات واتساب المجانية للإدارة</h3>
            <p>استقبل رسالة واتساب فورية على هاتفك مع كل طلب مهنة، تقييم، اقتراح تعديل، منشور مجتمع، طلب إعلان، أو عضو جديد — واختر بالأسفل ما يصلك.</p>
          </div>
        </div>

        <ol className="whatsapp-alerts-steps">
          <li>
            احفظ رقم البوت <strong dir="ltr">+34 623 78 95 80</strong> في جهات اتصالك باسم <strong>CallMeBot</strong>
            <small className="settings-item-hint"> (الرقم يتغير أحيانًا — تأكد منه على <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer">callmebot.com</a>)</small>.
          </li>
          <li>
            أرسل له على واتساب الرسالة التالية بالضبط:{" "}
            <code dir="ltr">I allow callmebot to send me messages</code>
          </li>
          <li>سيصلك رد خلال ثوانٍ يحتوي على رقم الـ API Key الخاص بك — انسخه وضعه في الخانة بالأسفل ثم اضغط حفظ.</li>
        </ol>

        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-waAlertNumber">١. رقم واتساب الأدمن لاستقبال التنبيهات</label>
            <small className="settings-item-hint">الرقم الذي فعّلت عليه خدمة CallMeBot — إن تُرك فارغًا يُستخدم رقم مكتب الجمال {OFFICE_PHONE}</small>
            <input
              id="setting-waAlertNumber"
              dir="ltr"
              className="studio-textbox"
              placeholder={`${OFFICE_PHONE} (الافتراضي) أو 2${OFFICE_PHONE.slice(1)}`}
              value={values.whatsappAlertsNumber}
              onChange={(event) => updateSetting("whatsappAlertsNumber", event.target.value)}
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="setting-waAlertKey">٢. مفتاح CallMeBot API Key</label>
            <small className="settings-item-hint">الكود الرقمي الذي وصلك في رسالة التفعيل</small>
            <input
              id="setting-waAlertKey"
              dir="ltr"
              className="studio-textbox"
              placeholder="مثال: 1234567"
              value={values.whatsappAlertsApiKey}
              onChange={(event) => updateSetting("whatsappAlertsApiKey", event.target.value)}
            />
          </div>
        </div>

        <fieldset className="whatsapp-alert-kinds">
          <legend>٣. الأحداث التي تصلك على واتساب</legend>
          <div className="whatsapp-alert-kinds-grid">
            {whatsappAlertKinds.map((kind) => (
              <label key={kind.id} className={`checkbox-field whatsapp-alert-kind ${kinds.includes(kind.id) ? "is-on" : ""}`}>
                <input type="checkbox" checked={kinds.includes(kind.id)} onChange={() => toggleKind(kind.id)}/>
                <span><strong>{kind.label}</strong><small>{kind.hint}</small></span>
              </label>
            ))}
          </div>
          <div className="whatsapp-alert-kinds-actions">
            <button type="button" className="button button-ghost button-small" onClick={() => setKinds([...allWhatsappAlertKinds])} disabled={kinds.length === allWhatsappAlertKinds.length}>تحديد الكل</button>
            <button type="button" className="button button-ghost button-small" onClick={() => setKinds([])} disabled={kinds.length === 0}>إلغاء الكل</button>
            {onSaveAlertKinds && <button type="button" className="button button-soft button-small" onClick={() => void persistKinds()} disabled={kindsBusy || !kindsDirty}>{kindsBusy ? <LoaderCircle size={15} className="spin"/> : <Check size={15}/>}<span>حفظ الأحداث المختارة</span></button>}
            {kinds.length === 0 && <small className="settings-item-hint">لن تصلك أي رسالة واتساب (إشعارات اللوحة تبقى كما هي).</small>}
          </div>
          {alertStatus?.lastSentAt && (
            <p className={`whatsapp-alert-status ${alertStatus.lastResult === "ok" ? "is-ok" : "is-error"}`}>
              آخر محاولة إرسال: {new Date(alertStatus.lastSentAt).toLocaleString("ar-EG")} — {alertStatus.lastResult === "ok" ? "نجحت ✓" : alertStatus.lastResult}
            </p>
          )}
        </fieldset>

        <div className="whatsapp-alerts-actions">
          <button
            type="button"
            className="button button-soft button-small"
            disabled={testBusy || !values.whatsappAlertsApiKey.trim()}
            onClick={() => void sendTestAlert()}
          >
            {testBusy ? <LoaderCircle size={16} className="spin"/> : <Send size={16}/>}
            <span>إرسال رسالة اختبار إلى واتساب الآن</span>
          </button>
          {testNotice && (
            <span className={`whatsapp-test-notice ${testNotice.error ? "is-error" : "is-ok"}`} role="status">
              {testNotice.text}
            </span>
          )}
        </div>
      </section>

      <div className="settings-submit-bar">
        <button className="button button-primary settings-save-btn" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="spin"/> : <Check size={18}/>}
          <span>حفظ جميع إعدادات الموقع</span>
        </button>
      </div>
    </form>
  );
}

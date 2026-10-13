"use client";

import { useState, type FormEvent } from "react";
import { BellRing, Building2, Check, Globe, LoaderCircle, MessageCircle, PhoneCall, Send, Settings2, Share2, ShieldAlert, Sliders } from "lucide-react";
import { defaultDesignSettings, type DesignSettings, type SiteSettings } from "@/lib/catalog";

export default function SettingsEditor({
  settings,
  designSettings,
  onSave,
  onSaveDesign,
}: {
  settings: SiteSettings;
  designSettings?: DesignSettings;
  onSave: (values: SiteSettings) => Promise<boolean>;
  onSaveDesign?: (values: DesignSettings) => Promise<boolean>;
}) {
  const [values, setValues] = useState<SiteSettings>(settings);
  const [designValues, setDesignValues] = useState<DesignSettings>(() => ({
    ...defaultDesignSettings,
    ...(designSettings ?? {}),
  }));
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testNotice, setTestNotice] = useState<{ text: string; error: boolean } | null>(null);

  const identityFields: Array<[keyof SiteSettings, string]> = [
    ["siteName", "اسم الموقع الرسمي"],
    ["heroEyebrow", "العنوان الصغير أعلى البانر الترحيبي"],
    ["heroSubtitle", "الوصف الرئيسي تحت عنوان الموقع"],
    ["tagline", "شعار الثقة المختصر (تحت البانر)"],
    ["benefitsHeading", "عنوان قسم مميزات الدليل"],
    ["benefitsText", "وصف قسم مميزات الدليل"],
  ];

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
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setTestNotice({ text: result.error ?? "تعذّر إرسال رسالة الاختبار.", error: true });
        return;
      }
      setTestNotice({ text: "تم إرسال رسالة الاختبار إلى واتساب بنجاح!", error: false });
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
        <p>تحكم في نصوص الواجهة، بيانات مكتب الدليل بجنزور، روابط التواصل الاجتماعي، والخصائص التفاعلية للموقع.</p>
      </div>

      <div className="admin-Visual-divider" role="separator">
        <span><Globe size={15}/> ١. الهوية الأساسية ونصوص الصفحة الرئيسية</span>
      </div>

      <section className="settings-section-card">
        <div className="form-grid settings-centered-grid">
          {identityFields.map(([key, label]) => (
            <label key={key} className="field settings-centered-field">
              <span>{label}</span>
              <input
                value={String(values[key])}
                onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                required
              />
            </label>
          ))}
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><Building2 size={15}/> ٢. بيانات مكتب الدليل وأرقام التواصل والطوارئ</span>
      </div>

      <section className="settings-section-card">
        <div className="form-grid settings-centered-grid">
          <label className="field settings-centered-field">
            <span>رقم هاتف وواتساب إدارة الدليل</span>
            <input
              dir="ltr"
              value={values.phone}
              onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
              required
            />
          </label>

          <label className="field settings-centered-field">
            <span>عنوان المكتب في قرية جنزور</span>
            <input
              value={designValues.officeAddress}
              onChange={(event) => updateDesign("officeAddress", event.target.value)}
            />
          </label>

          <label className="field settings-centered-field">
            <span>مواعيد عمل المكتب واستقبال الطلبات</span>
            <input
              value={designValues.officeWorkingHours}
              onChange={(event) => updateDesign("officeWorkingHours", event.target.value)}
            />
          </label>

          <label className="field settings-centered-field">
            <span>رسالة الترحيب الافتراضية عند مراسلة واتساب</span>
            <input
              value={designValues.whatsappDefaultGreeting}
              onChange={(event) => updateDesign("whatsappDefaultGreeting", event.target.value)}
            />
          </label>

          <label className="field field-full settings-centered-field">
            <span>النص التعريفي لبطاقة التواصل والإضافة بالموقع</span>
            <input
              value={values.contactText}
              onChange={(event) => setValues((current) => ({ ...current, contactText: event.target.value }))}
              required
            />
          </label>
        </div>

        <div className="settings-toggles-grid">
          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={values.showEmergency}
              onChange={(event) => setValues((current) => ({ ...current, showEmergency: event.target.checked }))}
            />
            <ShieldAlert size={18}/>
            <span>إظهار شريط وأرقام الطوارئ والمناوبات للزوار</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.floatingWhatsappEnabled}
              onChange={(event) => updateDesign("floatingWhatsappEnabled", event.target.checked)}
            />
            <PhoneCall size={18}/>
            <span>إظهار زر واتساب العائم للتواصل السريع</span>
          </label>
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><Share2 size={15}/> ٣. الفوتر وروابط السوشيال ميديا وحقوق النشر</span>
      </div>

      <section className="settings-section-card">
        <div className="form-grid settings-centered-grid">
          <label className="field settings-centered-field">
            <span>وصف الموقع المختصر في الفوتر</span>
            <input
              value={designValues.footerDescription}
              onChange={(event) => updateDesign("footerDescription", event.target.value)}
            />
          </label>

          <label className="field settings-centered-field">
            <span>نص حقوق النشر أسفل الموقع</span>
            <input
              value={values.copyright}
              onChange={(event) => setValues((current) => ({ ...current, copyright: event.target.value }))}
              required
            />
          </label>

          <label className="field settings-centered-field">
            <span>رابط صفحة أو جروب فيسبوك الرسمي (اختياري)</span>
            <input
              dir="ltr"
              placeholder="https://facebook.com/..."
              value={designValues.footerFacebookUrl}
              onChange={(event) => updateDesign("footerFacebookUrl", event.target.value)}
            />
          </label>

          <label className="field settings-centered-field">
            <span>رابط جروب واتساب أهل جنزور (اختياري)</span>
            <input
              dir="ltr"
              placeholder="https://chat.whatsapp.com/..."
              value={designValues.footerWhatsappGroupUrl}
              onChange={(event) => updateDesign("footerWhatsappGroupUrl", event.target.value)}
            />
          </label>
        </div>

        <div className="settings-toggles-grid">
          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showFooterWhatsapp}
              onChange={(event) => updateDesign("showFooterWhatsapp", event.target.checked)}
            />
            <span>إظهار زر تواصل واتساب داخل الفوتر</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showFooterStats}
              onChange={(event) => updateDesign("showFooterStats", event.target.checked)}
            />
            <span>إظهار عداد المهن والأقسام الموثقة في الفوتر</span>
          </label>
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><Sliders size={15}/> ٤. التحكم في خصائص وأدوات الدليل التفاعلية</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-toggles-grid">
          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.allowPublicSubmissions}
              onChange={(event) => updateDesign("allowPublicSubmissions", event.target.checked)}
            />
            <span>السماح للزوار بإرسال طلبات إضافة مهنة جديدة</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showPrayerWeatherBar}
              onChange={(event) => updateDesign("showPrayerWeatherBar", event.target.checked)}
            />
            <span>إظهار مستطيل مواقيت الصلاة بجنزور</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showTransitGuide}
              onChange={(event) => updateDesign("showTransitGuide", event.target.checked)}
            />
            <span>إظهار دليل المواصلات ومواقف قرية جنزور</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showInstallAppBanner}
              onChange={(event) => updateDesign("showInstallAppBanner", event.target.checked)}
            />
            <span>إظهار بانر تثبيت التطبيق على الهاتف</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showAddProfessionBanner}
              onChange={(event) => updateDesign("showAddProfessionBanner", event.target.checked)}
            />
            <span>إظهار بانر «أضف مهنتك مجاناً» أسفل الصفحة</span>
          </label>

          <label className="checkbox-field settings-centered-checkbox">
            <input
              type="checkbox"
              checked={designValues.showAdminQuickEdit}
              onChange={(event) => updateDesign("showAdminQuickEdit", event.target.checked)}
            />
            <span>تفعيل زر «تعديل سريع» للأدمن على كروت المهنيين</span>
          </label>
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><BellRing size={15}/> ٥. تنبيهات واتساب الفورية للإدارة (CallMeBot)</span>
      </div>

      <section className="whatsapp-alerts-card settings-centered-alerts" aria-label="إعدادات تنبيهات واتساب المجانية">
        <div className="whatsapp-alerts-head">
          <span className="whatsapp-alerts-icon">
            <MessageCircle size={22}/>
          </span>
          <div>
            <h3>تنبيهات واتساب المجانية عند إضافة مهنة أو تقييم</h3>
            <p>استقبل رسالة واتساب فورية على هاتفك بمجرد إرسال طلب إضافة مهنة جديدة أو تقييم أو تسجيل عضو.</p>
          </div>
        </div>

        <ol className="whatsapp-alerts-steps">
          <li>
            احفظ الرقم <strong dir="ltr">+34 644 51 95 23</strong> في جهات اتصالك باسم <strong>CallMeBot</strong>.
          </li>
          <li>
            أرسل له على واتساب الرسالة التالية بالضبط:{" "}
            <code dir="ltr">I allow callmebot to send me messages</code>
          </li>
          <li>سيصلك رد خلال ثوانٍ يحتوي على رقم الـ API Key الخاص بك — انسخه وضعه في الخانة بالأسفل ثم اضغط حفظ.</li>
        </ol>

        <div className="form-grid settings-centered-grid">
          <label className="field settings-centered-field">
            <span>رقم واتساب الأدمن لاستقبال التنبيهات</span>
            <input
              dir="ltr"
              placeholder="01222355769 أو 201222355769"
              value={values.whatsappAlertsNumber}
              onChange={(event) => setValues((current) => ({ ...current, whatsappAlertsNumber: event.target.value }))}
            />
          </label>
          <label className="field settings-centered-field">
            <span>مفتاح CallMeBot API Key</span>
            <input
              dir="ltr"
              placeholder="مثال: 1234567"
              value={values.whatsappAlertsApiKey}
              onChange={(event) => setValues((current) => ({ ...current, whatsappAlertsApiKey: event.target.value }))}
            />
          </label>
        </div>

        <div className="whatsapp-alerts-actions">
          <button
            type="button"
            className="button button-soft button-small"
            disabled={testBusy || !values.whatsappAlertsNumber.trim() || !values.whatsappAlertsApiKey.trim()}
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

"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { SiteSettings } from "@/lib/catalog";

type SettingsEditorProps = {
  settings: SiteSettings;
  onSave: (values: Record<string, unknown>) => Promise<boolean>;
};

export default function SettingsEditor({ settings, onSave }: SettingsEditorProps) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const values = {
      ...settings,
      ...Object.fromEntries(form),
      showEmergency: form.get("showEmergency") === "on",
    };
    try { setSaved(await onSave(values)); } finally { setBusy(false); }
  }

  const textFields: Array<[keyof SiteSettings, string]> = [
    ["siteName", "اسم الموقع"], ["heroEyebrow", "العبارة أعلى العنوان"], ["heroSubtitle", "وصف الصفحة الرئيسية"],
    ["tagline", "شعار الموقع"], ["benefitsHeading", "عنوان مميزات الموقع"], ["benefitsText", "وصف مميزات الموقع"],
    ["contactText", "نص صفحة التواصل"], ["copyright", "نص حقوق الملكية"],
  ];

  return <form className="request-form settings-editor" onSubmit={submit}>
    <div className="settings-section-heading"><h3>هوية الموقع ومحتواه</h3><p>التغييرات تظهر على الصفحات والروابط فور تحديثها.</p></div>
    <div className="settings-text-grid">{textFields.map(([key, label]) => <label className={`field ${["siteName", "contactText", "copyright"].includes(key) ? "settings-wide-field" : ""}`} key={key}>{label}<input name={key} defaultValue={String(settings[key])} placeholder={key === "siteName" ? "دليل خدمات جنزور" : undefined} required maxLength={key === "contactText" ? 500 : 240}/></label>)}</div>
    <label className="field">رقم تواصل المكتب / واتساب<input name="phone" defaultValue={settings.phone} type="tel" dir="ltr" required maxLength={16}/></label>
    <label className="checkbox-field"><input name="showEmergency" type="checkbox" defaultChecked={settings.showEmergency}/> إظهار خدمات وشريط الطوارئ</label>

    <div className="settings-section-heading"><h3>تنبيهات واتساب للإدارة</h3><p>بيوصلك واتساب فوري مع كل طلب مهنة جديد وكل تقييم جديد. للتفعيل: أرسل كلمة «I activate follow» من رقم الواتساب المطلوب إلى ‎+34 644 51 48 13 على واتساب أو تيليجرام (خدمة CallMeBot المجانية)، هيبعتلك مفتاح API — اكتبه هنا مع الرقم. سيبهم فاضيين = التنبيهات مقفولة، وإشعارات لوحة التحكم شغالة دايمًا.</p></div>
    <div className="settings-text-grid">
      <label className="field">رقم واتساب استلام التنبيهات<input name="whatsappAlertsNumber" defaultValue={settings.whatsappAlertsNumber} type="tel" dir="ltr" placeholder="01xxxxxxxxx" maxLength={16}/></label>
      <label className="field">مفتاح CallMeBot API<input name="whatsappAlertsApiKey" defaultValue={settings.whatsappAlertsApiKey} dir="ltr" placeholder="123456" maxLength={40}/></label>
    </div>

    <button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Save size={18}/>} {busy ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
    {saved && <p className="form-success" role="status">تم حفظ إعدادات الموقع بنجاح.</p>}
  </form>;
}

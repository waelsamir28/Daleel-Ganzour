"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { SiteSettings } from "@/lib/catalog";

type SettingsEditorProps = {
  settings: SiteSettings;
  section?: "all" | "ads";
  onSave: (values: Record<string, unknown>) => Promise<boolean>;
};

export default function SettingsEditor({ settings, section = "all", onSave }: SettingsEditorProps) {
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
      marqueeEnabled: form.get("marqueeEnabled") === "on",
      showEmergency: section === "all" ? form.get("showEmergency") === "on" : settings.showEmergency,
    };
    try { setSaved(await onSave(values)); } finally { setBusy(false); }
  }

  const textFields: Array<[keyof SiteSettings, string]> = [
    ["siteName", "اسم الموقع"], ["heroEyebrow", "العبارة أعلى العنوان"], ["heroSubtitle", "وصف الصفحة الرئيسية"],
    ["tagline", "شعار الموقع"], ["benefitsHeading", "عنوان مميزات الموقع"], ["benefitsText", "وصف مميزات الموقع"],
    ["contactText", "نص صفحة التواصل"], ["copyright", "نص حقوق الملكية"],
  ];

  return <form className="request-form settings-editor" onSubmit={submit}>
    {section === "all" && <>
      <div className="settings-section-heading"><h3>هوية الموقع ومحتواه</h3><p>التغييرات تظهر على الصفحات والروابط فور تحديثها.</p></div>
      <div className="settings-text-grid">{textFields.map(([key, label]) => <label className={`field ${["siteName", "contactText", "copyright"].includes(key) ? "settings-wide-field" : ""}`} key={key}>{label}<input name={key} defaultValue={String(settings[key])} placeholder={key === "siteName" ? "دليل خدمات جنزور" : undefined} required maxLength={key === "contactText" ? 500 : 240}/></label>)}</div>
      <label className="field">رقم تواصل المكتب / واتساب<input name="phone" defaultValue={settings.phone} type="tel" dir="ltr" required maxLength={16}/></label>
      <label className="checkbox-field"><input name="showEmergency" type="checkbox" defaultChecked={settings.showEmergency}/> إظهار خدمات وشريط الطوارئ</label>
    </>}

    <div className="settings-section-heading"><h3>مساحة الإعلانات الرئيسية</h3><p>الإعلانات المعتمدة والمدفوعة تظهر هنا بالتتابع على الصفحة الرئيسية.</p></div>
    <label className="checkbox-field"><input name="marqueeEnabled" type="checkbox" defaultChecked={settings.marqueeEnabled}/> إظهار كاروسيل الإعلانات في الصفحة الرئيسية</label>
    <div className="settings-ad-grid">
      <label className="field">سعر الحجز بالجنيه<input name="adPrice" type="number" defaultValue={settings.adPrice} min={1} max={100000} required/></label>
      <label className="field">مدة الإعلان بالأيام<input name="adDays" type="number" defaultValue={settings.adDays} min={1} max={365} required/></label>
    </div>
    <button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Save size={18}/>} {busy ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
    {saved && <p className="form-success" role="status">تم حفظ إعدادات الإعلانات بنجاح.</p>}
  </form>;
}

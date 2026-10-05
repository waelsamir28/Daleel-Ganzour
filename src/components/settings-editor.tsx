"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import EmojiTextarea from "@/components/emoji-textarea";
import { marqueeBackgroundColors, marqueeMotionOptions, marqueeTextColors, type SiteSettings } from "@/lib/catalog";

type SettingsEditorProps = {
  settings: SiteSettings;
  section?: "all" | "ads";
  onSave: (values: Record<string, unknown>) => Promise<boolean>;
};

export default function SettingsEditor({ settings, section = "all", onSave }: SettingsEditorProps) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [marqueeMotion, setMarqueeMotion] = useState(settings.marqueeMotion);
  const [marqueeTextColor, setMarqueeTextColor] = useState(settings.marqueeTextColor);
  const [marqueeNameColor, setMarqueeNameColor] = useState(settings.marqueeNameColor);
  const [marqueeBackgroundColor, setMarqueeBackgroundColor] = useState(settings.marqueeBackgroundColor);

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

  function renderPalette<T extends string>(colors: ReadonlyArray<{ color: T; label: string }>, selected: string, onSelect: (color: T) => void, label: string) {
    return <div className="ticker-color-palette" role="group" aria-label={label}>
      {colors.map(({ color, label: colorLabel }) => <button key={color} type="button" className="ticker-color-swatch" style={{ "--swatch-color": color } as CSSProperties} aria-label={colorLabel} title={colorLabel} aria-pressed={selected === color} onClick={() => onSelect(color)}><span className="sr-only">{colorLabel}</span></button>)}
    </div>;
  }

  return <form className="request-form settings-editor" onSubmit={submit}>
    {section === "all" && <>
      <div className="settings-section-heading"><h3>هوية الموقع ومحتواه</h3><p>التغييرات تظهر على الصفحات والروابط فور تحديثها.</p></div>
      <div className="settings-text-grid">{textFields.map(([key, label]) => <label className={`field ${["siteName", "contactText", "copyright"].includes(key) ? "settings-wide-field" : ""}`} key={key}>{label}<input name={key} defaultValue={String(settings[key])} required maxLength={key === "contactText" ? 500 : 240}/></label>)}</div>
      <label className="field">رقم تواصل المكتب / واتساب<input name="phone" defaultValue={settings.phone} type="tel" dir="ltr" required maxLength={16}/></label>
      <label className="checkbox-field"><input name="showEmergency" type="checkbox" defaultChecked={settings.showEmergency}/> إظهار خدمات وشريط الطوارئ</label>
    </>}

    <div className="settings-section-heading"><h3>شريط المساحة الإعلانية</h3><p>أضف الرموز داخل نص الإعلان، واختر لونًا مستقلًا لاسم النشاط ونص الإعلان.</p></div>
    <label className="field">لون اسم النشاط{renderPalette(marqueeTextColors, marqueeNameColor, setMarqueeNameColor, "اختيار لون اسم النشاط")}<input type="hidden" name="marqueeNameColor" value={marqueeNameColor}/></label>
    <label className="field">لون نص الإعلان{renderPalette(marqueeTextColors, marqueeTextColor, setMarqueeTextColor, "اختيار لون نص الإعلان")}<input type="hidden" name="marqueeTextColor" value={marqueeTextColor}/></label>
    <label className="field">لون خلفية الشريط{renderPalette(marqueeBackgroundColors, marqueeBackgroundColor, setMarqueeBackgroundColor, "اختيار لون خلفية الشريط")}<input type="hidden" name="marqueeBackgroundColor" value={marqueeBackgroundColor}/></label>
    <div className="ad-settings-preview" style={{ "--preview-text": marqueeTextColor, "--preview-name": marqueeNameColor, "--ticker-background": marqueeBackgroundColor } as CSSProperties}>
      <span>مساحة إعلانية</span><p><strong>اسم النشاط</strong><span> | </span><span className="marquee-preview-copy">📢 إعلانك يصل لأهل جنزور 🎯</span></p>
    </div>
    <label className="checkbox-field"><input name="marqueeEnabled" type="checkbox" defaultChecked={settings.marqueeEnabled}/> إظهار شريط الإعلانات في الموقع</label>
    <div className="settings-ad-grid">
      <label className="field">سعر الحجز بالجنيه<input name="adPrice" type="number" defaultValue={settings.adPrice} min={1} max={100000} required/></label>
      <label className="field">مدة الإعلان بالأيام<input name="adDays" type="number" defaultValue={settings.adDays} min={1} max={365} required/></label>
      <label className="field">زمن دورة الحركة بالثواني<input name="marqueeSpeed" type="number" defaultValue={settings.marqueeSpeed} min={10} max={120} required/><small className="input-help">قيمة أكبر = حركة أبطأ</small></label>
    </div>
    <label className="field">نوع حركة الشريط<select name="marqueeMotion" value={marqueeMotion} onChange={(event) => setMarqueeMotion(event.target.value as SiteSettings["marqueeMotion"])}>{marqueeMotionOptions.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>
    <label className="field">نص الإعلان الاحتياطي <EmojiTextarea name="marqueeFallback" initialValue={settings.marqueeFallback} maxLength={500} required/></label>
    <button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Save size={18}/>} {busy ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
    {saved && <p className="form-success" role="status">تم حفظ إعدادات الشريط بنجاح.</p>}
  </form>;
}

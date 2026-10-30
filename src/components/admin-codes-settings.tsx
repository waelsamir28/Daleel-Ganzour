"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { LoaderCircle, RotateCcw, Save, Smartphone, Sparkles } from "lucide-react";
import {
  defaultTelecomSettings, sanitizeTelecomSettings, TELECOM_TILE_KEYS,
  type TelecomSettings, type TelecomTileKey,
} from "@/lib/telecom-settings";

/** وصف مختصر لكل قسم داخل صفحة الأكواد (يُستخدم كتلميح بجوار خانة الاسم). */
const TILE_HINTS: Record<TelecomTileKey, string> = {
  support: "قسم خدمة العملاء والدعم — يظهر في الشركات والخط الأرضي.",
  wallet: "قسم الرصيد والشحن والتحويل.",
  wifi: "قسم باقات الإنترنت والفايبر.",
  card: "قسم المحافظ الإلكترونية والدفع.",
  phone: "قسم خدمات الخط الأرضي (تحويل المكالمات وغيره).",
  sim: "قسم الشريحة والأكواد العامة.",
  siren: "قسم الطوارئ الفورية — يظهر في شاشة الأرقام الحكومية.",
  train: "قسم النقل والمواصلات الحكومية.",
};

export default function AdminCodesSettings({
  initial,
  onSave,
}: {
  initial?: TelecomSettings;
  onSave: (values: TelecomSettings) => Promise<boolean>;
}) {
  const [values, setValues] = useState<TelecomSettings>(() => sanitizeTelecomSettings(initial ?? defaultTelecomSettings));
  const [busy, setBusy] = useState(false);

  function update<K extends keyof TelecomSettings>(key: K, value: TelecomSettings[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function updateTile(key: TelecomTileKey, field: "label" | "color", value: string) {
    setValues((current) => ({ ...current, groupStyles: { ...current.groupStyles, [key]: { ...current.groupStyles[key], [field]: value } } }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try { await onSave(sanitizeTelecomSettings(values)); } finally { setBusy(false); }
  }

  return (
    <form className="settings-form settings-formatted-page" onSubmit={submit}>
      <div className="settings-page-banner">
        <span className="settings-banner-icon"><Smartphone size={24}/></span>
        <h3>📱 إعدادات صفحة الأكواد والأرقام</h3>
        <p>كل ما تعدّله هنا يظهر فورًا في صفحة «كل الأكواد»: النصوص العلوية، أسماء وألوان أقسام الأكواد، وخيارات العرض. الأرقام نفسها تُعدَّل من ملفات البيانات داخل الكود.</p>
      </div>

      <div className="admin-Visual-divider" role="separator">
        <span><Sparkles size={15}/> القسم ١: نصوص الجزء العلوي</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>عنوان الصفحة ووصفها</h4>
          <p>هذه النصوص تظهر في أعلى صفحة الأكواد بخط كبير ومتوسّط، وبعدها شبكة الكروت.</p>
        </div>
        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="codes-eyebrow">١. الشارة الصغيرة فوق العنوان</label>
            <small className="settings-item-hint">مثال: «أرقام وأكواد المحمول والأرضي والبنوك»</small>
            <input id="codes-eyebrow" className="studio-textbox" value={values.eyebrow} maxLength={70} onChange={(event) => update("eyebrow", event.target.value)}/>
          </div>
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="codes-title">٢. العنوان الكبير للصفحة</label>
            <small className="settings-item-hint">أول سطر يقرأه الزائر — اجعله قصيرًا وواضحًا</small>
            <input id="codes-title" className="studio-textbox" value={values.title} maxLength={120} onChange={(event) => update("title", event.target.value)}/>
          </div>
          <div className="settings-item-box is-full-span">
            <label className="settings-item-label" htmlFor="codes-subtitle">٣. الوصف تحت العنوان</label>
            <small className="settings-item-hint">جملة أو جملتين توضّح إيه اللي موجود في الصفحة وإنها تعمل بدون إنترنت</small>
            <textarea id="codes-subtitle" className="studio-textbox" rows={3} value={values.subtitle} maxLength={420} onChange={(event) => update("subtitle", event.target.value)}/>
          </div>
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="codes-homeHeading">٤. عنوان شبكة الكروت</label>
            <small className="settings-item-hint">العنوان اللي فوق كروت الشركات والأقسام</small>
            <input id="codes-homeHeading" className="studio-textbox" value={values.homeHeading} maxLength={60} onChange={(event) => update("homeHeading", event.target.value)}/>
          </div>
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="codes-homeNote">٥. وصف شبكة الكروت</label>
            <small className="settings-item-hint">سطر صغير تحت العنوان مباشرة</small>
            <input id="codes-homeNote" className="studio-textbox" value={values.homeNote} maxLength={180} onChange={(event) => update("homeNote", event.target.value)}/>
          </div>
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><Smartphone size={15}/> القسم ٢: أسماء وألوان أقسام الأكواد</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>مربّعات الأقسام (الدعم · الرصيد · الإنترنت · المحفظة…)</h4>
          <p>غيّر اسم القسم أو لونه، والتغيير يسري على كل الشركات والشاشات. المربّعات مرتبة صفّين بلون مختلف لكل قسم.</p>
        </div>

        <div className="codes-settings-preview" aria-hidden="true">
          {TELECOM_TILE_KEYS.slice(0, 4).map((key) => (
            <span key={key} className="codes-settings-preview-tile" style={{ background: `linear-gradient(150deg, ${values.groupStyles[key].color}, ${values.groupStyles[key].color}b3)` } as CSSProperties}>
              {values.groupStyles[key].label}
            </span>
          ))}
        </div>

        <div className="settings-items-grid">
          {TELECOM_TILE_KEYS.map((key, index) => (
            <div className="settings-item-box" key={key}>
              <label className="settings-item-label" htmlFor={`codes-tile-${key}`}>{`${index + 1}. ${values.groupStyles[key].label || key}`}</label>
              <small className="settings-item-hint">{TILE_HINTS[key]}</small>
              <input
                id={`codes-tile-${key}`}
                className="studio-textbox"
                value={values.groupStyles[key].label}
                maxLength={22}
                placeholder={defaultTelecomSettings.groupStyles[key].label}
                onChange={(event) => updateTile(key, "label", event.target.value)}
              />
              <div className="design-color-field codes-color-field">
                <input type="color" value={values.groupStyles[key].color} aria-label={`لون قسم ${values.groupStyles[key].label}`} onChange={(event) => updateTile(key, "color", event.target.value)}/>
                <input type="text" dir="ltr" value={values.groupStyles[key].color} maxLength={7} onChange={(event) => updateTile(key, "color", event.target.value)}/>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-Visual-divider" role="separator">
        <span><Smartphone size={15}/> القسم ٣: خيارات العرض</span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>عناصر تظهر أو تختفي في أعلى الصفحة</h4>
          <p>اختر ما يناسبك — الإخفاء لا يحذف أي بيانات.</p>
        </div>
        <div className="codes-settings-toggles">
          <label className="checkbox-field">
            <input type="checkbox" checked={values.showQr} onChange={(event) => update("showQr", event.target.checked)}/>
            إظهار رمز QR لفتح الصفحة على موبايل آخر
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={values.showHeroChips} onChange={(event) => update("showHeroChips", event.target.checked)}/>
            إظهار شرائح «تعمل بدون إنترنت / طلب الكود بضغطة / مشاركة واتساب»
          </label>
        </div>
      </section>

      <div className="codes-settings-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} حفظ إعدادات صفحة الأكواد
        </button>
        <button type="button" className="button button-soft" disabled={busy} onClick={() => setValues(defaultTelecomSettings)}>
          <RotateCcw size={16}/> استعادة الافتراضي
        </button>
        <a className="button button-soft" href="/telecom" target="_blank" rel="noopener noreferrer"><Smartphone size={16}/> معاينة الصفحة</a>
      </div>
    </form>
  );
}

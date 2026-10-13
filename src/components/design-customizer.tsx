"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Grid2X2,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  Palette,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Square,
  Type,
} from "lucide-react";
import {
  defaultDesignSettings,
  designThemePresets,
  type DesignSettings,
} from "@/lib/catalog";
import { applyDesignSettingsToDocument } from "@/components/design-applicator";
import { MainCategoryIcon } from "@/components/ui";
import SelectField from "@/components/select-field";

type SectionFilter = "all" | "colors" | "typography" | "cards" | "buttons" | "layout" | "header" | "auth";

const homeSectionsMeta: Record<string, { label: string; toggleKey: keyof DesignSettings }> = {
  hero: { label: "البانر الترحيبي والبحث الرئيسي", toggleKey: "showHero" },
  features: { label: "الكروت الثلاثة (المناوبات + أرقام تهمك + الخدمات السريعة)", toggleKey: "showFeatureCards" },
  featured: { label: "قسم مقدمو الخدمات المميزين", toggleKey: "showFeaturedSection" },
  categories: { label: "أقسام القرية والتخصصات", toggleKey: "showCategoriesSection" },
  professionBanner: { label: "بانر «أضف مهنتك» أسفل الصفحة", toggleKey: "showAddProfessionBanner" },
};

export default function DesignCustomizer({
  initialDesign,
  onSave,
}: {
  initialDesign?: DesignSettings;
  onSave: (values: DesignSettings) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<DesignSettings>(() => ({
    ...defaultDesignSettings,
    ...(initialDesign ?? {}),
  }));
  const [activeFilter, setActiveFilter] = useState<SectionFilter>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyDesignSettingsToDocument(draft);
  }, [draft]);

  function updateField<K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(presetKey: Exclude<DesignSettings["themePreset"], "custom">) {
    const preset = designThemePresets[presetKey];
    setDraft((current) => ({
      ...current,
      themePreset: presetKey,
      ...preset.colors,
    }));
  }

  function resetAll() {
    setDraft({ ...defaultDesignSettings });
  }

  function getOrderedSections(): string[] {
    const validKeys = Object.keys(homeSectionsMeta);
    const current = (draft.sectionOrder || defaultDesignSettings.sectionOrder)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => validKeys.includes(item));
    for (const key of validKeys) {
      if (!current.includes(key)) current.push(key);
    }
    return current;
  }

  function moveSection(index: number, direction: -1 | 1) {
    const list = getOrderedSections();
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const copy = [...list];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    updateField("sectionOrder", copy.join(","));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  const orderedSections = getOrderedSections();

  return (
    <form className="design-studio-form" onSubmit={handleSubmit}>
      {/* Top Bar: Presets + Reset + Save */}
      <div className="design-studio-top">
        <div className="design-studio-intro">
          <span className="design-studio-badge">
            <Palette size={16}/>
            استوديو تخصيص المظهر والهيكل
          </span>
          <h3>تحكم كامل في ألوان، عناوين، براويز، أيقونات، وهيكل التطبيق</h3>
          <p>أي تعديل تختاره يظهر فوراً في المعاينة الحية ويُطبّق على جميع صفحات الموقع بمجرد الضغط على «حفظ وتطبيق المظهر».</p>
        </div>
        <div className="design-studio-top-actions">
          <button type="button" className="button button-soft button-small" onClick={resetAll}>
            <RotateCcw size={15}/>
            استعادة الوضع الافتراضي
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? <LoaderCircle size={17} className="spin"/> : <Check size={17}/>}
            حفظ وتطبيق المظهر
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="design-live-preview-card">
        <div className="design-preview-head" style={{ background: draft.modalHeaderBg }}>
          <span className="design-preview-pill"><Eye size={14}/> معاينة حية فورية</span>
          <strong>هيدر الشاشات العائمة والبطاقات باللون والتنسيق المختار</strong>
        </div>
        <div className="design-preview-body" style={{ background: draft.pageBgColor }}>
          <div
            className={`design-preview-section-title is-style-${draft.sectionHeadingStyle}`}
            style={{
              textAlign: draft.headingAlign,
              justifyContent: draft.headingAlign === "center" ? "center" : draft.headingAlign === "left" ? "flex-end" : "flex-start",
              color: draft.primaryColor,
              borderColor: draft.borderColor,
            }}
          >
            <span>عنوان قسم تجريبي (معاينة المحاذاة والشكل)</span>
          </div>

          <div className="design-preview-grid">
            <div
              className={`design-preview-item-card is-pos-${draft.iconPosition} is-radius-${draft.cardRadius} is-shadow-${draft.cardShadow} is-border-${draft.borderWidth}`}
              style={{
                background: draft.cardBgColor,
                borderColor: draft.borderColor,
                textAlign: draft.cardTextAlign,
              }}
            >
              <span className={`design-preview-icon is-style-${draft.iconStyle} is-size-${draft.iconSize}`}>
                <MainCategoryIcon icon="featured" size={28}/>
              </span>
              <div className="design-preview-copy" style={{ textAlign: draft.cardTextAlign }}>
                <strong style={{ color: draft.primaryColor }}>بطاقة معاينة الكروت والبراويز</strong>
                <span>معاينة لون الخلفية والبوردر وموضع الأيقونة ومحاذاة النص</span>
              </div>
            </div>

            <div className="design-preview-buttons-box" style={{ justifyContent: draft.buttonAlign === "center" ? "center" : draft.buttonAlign === "right" ? "flex-start" : "stretch" }}>
              <span
                className={`design-preview-btn is-shape-${draft.buttonShape} is-effect-${draft.buttonEffect} ${draft.buttonAlign === "full" ? "is-full" : ""}`}
                style={{
                  "--preview-btn-color": draft.buttonColor,
                } as React.CSSProperties}
              >
                <PhoneCall size={15}/>
                معاينة شكل ولون الأزرار
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="design-section-tabs" role="tablist" aria-label="أقسام تخصيص المظهر">
        <button type="button" className={activeFilter === "all" ? "is-active" : ""} onClick={() => setActiveFilter("all")}><Sparkles size={15}/>كل الإعدادات</button>
        <button type="button" className={activeFilter === "colors" ? "is-active" : ""} onClick={() => setActiveFilter("colors")}><Palette size={15}/>1. الألوان والثيمات</button>
        <button type="button" className={activeFilter === "typography" ? "is-active" : ""} onClick={() => setActiveFilter("typography")}><Type size={15}/>2. العناوين والمحاذاة</button>
        <button type="button" className={activeFilter === "cards" ? "is-active" : ""} onClick={() => setActiveFilter("cards")}><Square size={15}/>3. البراويز والحدود</button>
        <button type="button" className={activeFilter === "buttons" ? "is-active" : ""} onClick={() => setActiveFilter("buttons")}><PhoneCall size={15}/>4. شكل الأزرار</button>
        <button type="button" className={activeFilter === "layout" ? "is-active" : ""} onClick={() => setActiveFilter("layout")}><Grid2X2 size={15}/>5. الأيقونات والهيكل</button>
        <button type="button" className={activeFilter === "header" ? "is-active" : ""} onClick={() => setActiveFilter("header")}><LayoutTemplate size={15}/>6. الهيدر والفوتر</button>
        <button type="button" className={activeFilter === "auth" ? "is-active" : ""} onClick={() => setActiveFilter("auth")}><LockKeyhole size={15}/>7. الدخول والعضوية</button>
      </div>

      {/* 1. Themes & Colors */}
      {(activeFilter === "all" || activeFilter === "colors") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <Palette size={20}/>
            <div>
              <h3>1. الألوان والثيمات الجاهزة</h3>
              <p>اختر ثيم جاهز بضغطة واحدة أو خصّص ألوان التطبيق والشاشات العائمة والأزرار يدوياً</p>
            </div>
          </div>

          <div className="design-presets-grid">
            {(Object.keys(designThemePresets) as Array<Exclude<DesignSettings["themePreset"], "custom">>).map((key) => {
              const preset = designThemePresets[key];
              const isSelected = draft.themePreset === key;
              return (
                <button
                  type="button"
                  key={key}
                  className={`design-preset-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => applyPreset(key)}
                >
                  <div className="design-preset-swatches">
                    <span style={{ background: preset.colors.primaryColor }}/>
                    <span style={{ background: preset.colors.modalHeaderBg }}/>
                    <span style={{ background: preset.colors.buttonColor }}/>
                    <span style={{ background: preset.colors.footerBgColor }}/>
                  </div>
                  <strong>{preset.label}</strong>
                  <small>{preset.description}</small>
                </button>
              );
            })}
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              اللون الأساسي والعناوين
              <div className="design-color-field">
                <input type="color" value={draft.primaryColor} onChange={(e) => { updateField("primaryColor", e.target.value); updateField("themePreset", "custom"); }}/>
                <input type="text" dir="ltr" value={draft.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)}/>
              </div>
            </label>
            <label className="field">
              لون خلفية الصفحات العام
              <div className="design-color-field">
                <input type="color" value={draft.pageBgColor} onChange={(e) => { updateField("pageBgColor", e.target.value); updateField("themePreset", "custom"); }}/>
                <input type="text" dir="ltr" value={draft.pageBgColor} onChange={(e) => updateField("pageBgColor", e.target.value)}/>
              </div>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              لون هيدر الشاشات العائمة (اللبني أو أي لون)
              <div className="design-color-field">
                <input type="color" value={draft.modalHeaderBg} onChange={(e) => { updateField("modalHeaderBg", e.target.value); updateField("themePreset", "custom"); }}/>
                <input type="text" dir="ltr" value={draft.modalHeaderBg} onChange={(e) => updateField("modalHeaderBg", e.target.value)}/>
              </div>
            </label>
            <label className="field">
              لون أزرار الاتصال والأزرار الرئيسية
              <div className="design-color-field">
                <input type="color" value={draft.buttonColor} onChange={(e) => { updateField("buttonColor", e.target.value); updateField("themePreset", "custom"); }}/>
                <input type="text" dir="ltr" value={draft.buttonColor} onChange={(e) => updateField("buttonColor", e.target.value)}/>
              </div>
            </label>
          </div>

          <label className="field">
            الوضع الافتراضي للموقع (النهاري / الليلي)
            <SelectField value={draft.themeMode} onChange={(e) => updateField("themeMode", e.target.value as DesignSettings["themeMode"])}>
              <option value="auto">تلقائي حسب جهاز الزائر أو اختياره</option>
              <option value="light">الوضع النهاري الفاتح افتراضياً</option>
              <option value="dark">الوضع الليلي الداكن افتراضياً</option>
            </SelectField>
          </label>
        </section>
      )}

      {/* 2. Typography & Alignment */}
      {(activeFilter === "all" || activeFilter === "typography") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <Type size={20}/>
            <div>
              <h3>2. تنسيق العناوين والنصوص والمحاذاة</h3>
              <p>تحكم في محاذاة الكلام (متوسطن / يمين / شمال) وحجم ونوع الخط وشكل عناوين الأقسام</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <div className="field">
              <span>محاذاة العناوين الرئيسية للأقسام</span>
              <div className="design-choice-pills">
                <button type="button" className={draft.headingAlign === "right" ? "is-active" : ""} onClick={() => updateField("headingAlign", "right")}><AlignRight size={15}/>يمين</button>
                <button type="button" className={draft.headingAlign === "center" ? "is-active" : ""} onClick={() => updateField("headingAlign", "center")}><AlignCenter size={15}/>توسيط</button>
                <button type="button" className={draft.headingAlign === "left" ? "is-active" : ""} onClick={() => updateField("headingAlign", "left")}><AlignLeft size={15}/>شمال</button>
              </div>
            </div>

            <div className="field">
              <span>محاذاة الكلام داخل الكروت والبراويز</span>
              <div className="design-choice-pills">
                <button type="button" className={draft.cardTextAlign === "right" ? "is-active" : ""} onClick={() => updateField("cardTextAlign", "right")}><AlignRight size={15}/>يمين</button>
                <button type="button" className={draft.cardTextAlign === "center" ? "is-active" : ""} onClick={() => updateField("cardTextAlign", "center")}><AlignCenter size={15}/>توسيط</button>
                <button type="button" className={draft.cardTextAlign === "left" ? "is-active" : ""} onClick={() => updateField("cardTextAlign", "left")}><AlignLeft size={15}/>شمال</button>
              </div>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <div className="field">
              <span>محاذاة الملحوظات والتنبيهات</span>
              <div className="design-choice-pills">
                <button type="button" className={draft.noticeAlign === "right" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "right")}><AlignRight size={15}/>يمين</button>
                <button type="button" className={draft.noticeAlign === "center" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "center")}><AlignCenter size={15}/>توسيط</button>
                <button type="button" className={draft.noticeAlign === "left" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "left")}><AlignLeft size={15}/>شمال</button>
              </div>
            </div>

            <label className="field">
              شكل عناوين الأقسام الرئيسية
              <SelectField value={draft.sectionHeadingStyle} onChange={(e) => updateField("sectionHeadingStyle", e.target.value as DesignSettings["sectionHeadingStyle"])}>
                <option value="pill">داخل كبسولة أنيقة (الافتراضي)</option>
                <option value="plain">سادة بدون خلفية</option>
                <option value="underline">بخط سفلي ملون</option>
                <option value="framed">داخل برواز كامل</option>
              </SelectField>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              حجم الخط العام للتطبيق
              <SelectField value={draft.fontScale} onChange={(e) => updateField("fontScale", e.target.value as DesignSettings["fontScale"])}>
                <option value="small">صغير مدمج (94%)</option>
                <option value="normal">متوسط متوازن (100% - الافتراضي)</option>
                <option value="large">كبير واضح (107%)</option>
                <option value="xlarge">كبير جداً لكبار السن (114%)</option>
              </SelectField>
            </label>

            <label className="field">
              سمك الخط والعناوين
              <SelectField value={draft.fontWeight} onChange={(e) => updateField("fontWeight", e.target.value as DesignSettings["fontWeight"])}>
                <option value="normal">عادي ناعم</option>
                <option value="bold">عريض واضح (الافتراضي)</option>
                <option value="extrabold">عريض جداً وبارز</option>
              </SelectField>
            </label>
          </div>

          <label className="field">
            نوع الخط العربي
            <SelectField value={draft.fontFamily} onChange={(e) => updateField("fontFamily", e.target.value as DesignSettings["fontFamily"])}>
              <option value="cairo">خط القاهرة (Cairo - الافتراضي)</option>
              <option value="tajawal">خط تجوّل (Tajawal)</option>
              <option value="almarai">خط المراعي (Almarai)</option>
              <option value="readex">خط ريدكس (Readex Pro)</option>
            </SelectField>
          </label>
        </section>
      )}

      {/* 3. Cards, Frames & Borders */}
      {(activeFilter === "all" || activeFilter === "cards") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <Square size={20}/>
            <div>
              <h3>3. البراويز والكروت والحدود (Borders & Frames)</h3>
              <p>تغيير ألوان وسمك بوردر البراويز واستدارة الحواف والظلال</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              لون بوردر البراويز والكروت
              <div className="design-color-field">
                <input type="color" value={draft.borderColor} onChange={(e) => updateField("borderColor", e.target.value)}/>
                <input type="text" dir="ltr" value={draft.borderColor} onChange={(e) => updateField("borderColor", e.target.value)}/>
              </div>
            </label>

            <label className="field">
              لون خلفية الكروت والبراويز
              <div className="design-color-field">
                <input type="color" value={draft.cardBgColor} onChange={(e) => updateField("cardBgColor", e.target.value)}/>
                <input type="text" dir="ltr" value={draft.cardBgColor} onChange={(e) => updateField("cardBgColor", e.target.value)}/>
              </div>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              سمك ونوع بوردر البراويز
              <SelectField value={draft.borderWidth} onChange={(e) => updateField("borderWidth", e.target.value as DesignSettings["borderWidth"])}>
                <option value="none">بدون حدود (0px)</option>
                <option value="thin">خط رفيع أنيق (1px - الافتراضي)</option>
                <option value="medium">خط واضح عريض (2px)</option>
                <option value="double">برواز مزدوج فاخر (Double Border)</option>
              </SelectField>
            </label>

            <label className="field">
              استدارة حواف البراويز والكروت
              <SelectField value={draft.cardRadius} onChange={(e) => updateField("cardRadius", e.target.value as DesignSettings["cardRadius"])}>
                <option value="sharp">حواف حادة مربعة (6px)</option>
                <option value="medium">متوسطة الاستدارة (12px)</option>
                <option value="rounded">دائرية ناعمة (18px - الافتراضي)</option>
                <option value="pill">شديدة الاستدارة (26px)</option>
              </SelectField>
            </label>
          </div>

          <label className="field">
            قوة ظل وبروز الكروت (Shadow)
            <SelectField value={draft.cardShadow} onChange={(e) => updateField("cardShadow", e.target.value as DesignSettings["cardShadow"])}>
              <option value="none">مسطح بدون ظل</option>
              <option value="soft">ظل هادئ ناعم (الافتراضي)</option>
              <option value="elevated-3d">ظل بارز ثلاثي الأبعاد (3D Card Elevation)</option>
            </SelectField>
          </label>
        </section>
      )}

      {/* 4. Buttons Style */}
      {(activeFilter === "all" || activeFilter === "buttons") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <PhoneCall size={20}/>
            <div>
              <h3>4. شكل وتصميم الأزرار</h3>
              <p>تحكم في استدارة الأزرار وتأثيرها اللوني وموضع أزرار الإرسال</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              شكل حواف الأزرار
              <SelectField value={draft.buttonShape} onChange={(e) => updateField("buttonShape", e.target.value as DesignSettings["buttonShape"])}>
                <option value="rounded">مستطيل بحواف ناعمة (الافتراضي)</option>
                <option value="pill">كبسولة دائرية بالكامل (Pill)</option>
                <option value="square">مستطيل كلاسيكي بحواف حادة</option>
              </SelectField>
            </label>

            <label className="field">
              تأثير الأزرار
              <SelectField value={draft.buttonEffect} onChange={(e) => updateField("buttonEffect", e.target.value as DesignSettings["buttonEffect"])}>
                <option value="gradient">تدرج لوني لامع (Gradient - الافتراضي)</option>
                <option value="solid">لون سادة موحد (Solid)</option>
                <option value="3d">بارز ثلاثي الأبعاد بحافة سفلية (3D)</option>
                <option value="outline">إطار واضح وخلفية خفيفة</option>
              </SelectField>
            </label>
          </div>

          <label className="field">
            موضع أزرار الإرسال داخل النماذج والشاشات العائمة
            <SelectField value={draft.buttonAlign} onChange={(e) => updateField("buttonAlign", e.target.value as DesignSettings["buttonAlign"])}>
              <option value="center">متوسطن في منتصف الشاشة (الافتراضي)</option>
              <option value="right">محاذاة لليمين</option>
              <option value="full">بعرض كامل الشاشة (ممتاز للموبايل)</option>
            </SelectField>
          </label>
        </section>
      )}

      {/* 5. Icons & Layout Structure */}
      {(activeFilter === "all" || activeFilter === "layout") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <Grid2X2 size={20}/>
            <div>
              <h3>5. شكل الأيقونات وهيكل وترتيب الصفحة الرئيسية</h3>
              <p>تحكم في شكل وحجم وموضع الأيقونات، عدد الكروت في الصف، وترتيب وإظهار أقسام الصفحة الرئيسية</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              ستايل وشكل الأيقونات
              <SelectField value={draft.iconStyle} onChange={(e) => updateField("iconStyle", e.target.value as DesignSettings["iconStyle"])}>
                <option value="3d">أيقونات 3D ملونة بارزة (الافتراضي)</option>
                <option value="flat">أيقونات مسطحة هادئة بدون إطار ثقيل (Flat)</option>
                <option value="glow">أيقونات دائرية متوهجة (Glow Circle)</option>
              </SelectField>
            </label>

            <label className="field">
              حجم الأيقونات داخل الكروت
              <SelectField value={draft.iconSize} onChange={(e) => updateField("iconSize", e.target.value as DesignSettings["iconSize"])}>
                <option value="small">صغير مدمج</option>
                <option value="medium">متوسط متوازن (الافتراضي)</option>
                <option value="large">كبير وواضح</option>
              </SelectField>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              موضع الأيقونة داخل كروت الأقسام
              <SelectField value={draft.iconPosition} onChange={(e) => updateField("iconPosition", e.target.value as DesignSettings["iconPosition"])}>
                <option value="top-center">فوق العنوان في المنتصف (الافتراضي)</option>
                <option value="left">على الشمال بجانب العنوان</option>
                <option value="right">على اليمين بجانب العنوان</option>
              </SelectField>
            </label>

            <label className="field">
              حالة قسم «مقدمو الخدمات المميزين» عند فتح الموقع
              <SelectField value={draft.featuredDefaultOpen ? "open" : "closed"} onChange={(e) => updateField("featuredDefaultOpen", e.target.value === "open")}>
                <option value="closed">مطوي ويفتح عند الضغط على الزر (الافتراضي)</option>
                <option value="open">مفتوح ومفرود تلقائياً عند فتح الصفحة</option>
              </SelectField>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              عدد كروت الأقسام في الصف على الموبايل
              <SelectField value={draft.mobileColumns} onChange={(e) => updateField("mobileColumns", e.target.value as DesignSettings["mobileColumns"])}>
                <option value="2">كارتين في الصف (٢ أعمدة - الافتراضي)</option>
                <option value="3">٣ كروت في الصف (٣ أعمدة مدمجة)</option>
              </SelectField>
            </label>

            <label className="field">
              عدد كروت الأقسام في الصف على الكمبيوتر
              <SelectField value={draft.desktopColumns} onChange={(e) => updateField("desktopColumns", e.target.value as DesignSettings["desktopColumns"])}>
                <option value="4">٤ كروت في الصف (الافتراضي)</option>
                <option value="3">٣ كروت عريضة في الصف</option>
              </SelectField>
            </label>
          </div>

          <div className="design-order-box">
            <h4>ترتيب وإظهار أقسام الصفحة الرئيسية</h4>
            <p>رتّب الأقسام بالسهم لأعلى أو لأسفل، أو أخفِ أي قسم لا تريده في الصفحة الرئيسية:</p>
            <div className="design-order-list">
              {orderedSections.map((sectionKey, idx) => {
                const meta = homeSectionsMeta[sectionKey];
                if (!meta) return null;
                const enabled = Boolean(draft[meta.toggleKey]);
                return (
                  <div key={sectionKey} className={`design-order-item ${enabled ? "" : "is-hidden"}`}>
                    <label className="design-order-check">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateField(meta.toggleKey, e.target.checked as never)}
                      />
                      <strong>{idx + 1}. {meta.label}</strong>
                    </label>
                    <div className="design-order-arrows">
                      <button type="button" className="icon-button" disabled={idx === 0} onClick={() => moveSection(idx, -1)} aria-label="تحريك لأعلى" title="تحريك لأعلى">
                        <ArrowUp size={15}/>
                      </button>
                      <button type="button" className="icon-button" disabled={idx === orderedSections.length - 1} onClick={() => moveSection(idx, 1)} aria-label="تحريك لأسفل" title="تحريك لأسفل">
                        <ArrowDown size={15}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Header, Footer & Splash */}
      {(activeFilter === "all" || activeFilter === "header") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <LayoutTemplate size={20}/>
            <div>
              <h3>6. تعديل الهيدر والفوتر وشاشة البداية</h3>
              <p>تخصيص ألوان وأزرار الهيدر العلوي والفوتر السفلي وشاشة الترحيب</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              لون خلفية الهيدر العلوي
              <div className="design-color-field">
                <input type="color" value={draft.headerBgColor} onChange={(e) => updateField("headerBgColor", e.target.value)}/>
                <input type="text" dir="ltr" value={draft.headerBgColor} onChange={(e) => updateField("headerBgColor", e.target.value)}/>
              </div>
            </label>

            <label className="field">
              لون خلفية الفوتر السفلي
              <div className="design-color-field">
                <input type="color" value={draft.footerBgColor} onChange={(e) => updateField("footerBgColor", e.target.value)}/>
                <input type="text" dir="ltr" value={draft.footerBgColor} onChange={(e) => updateField("footerBgColor", e.target.value)}/>
              </div>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              رابط صورة لوجو مخصص في الهيدر (اختياري)
              <input
                type="text"
                dir="ltr"
                value={draft.headerLogoUrl}
                onChange={(e) => updateField("headerLogoUrl", e.target.value)}
                placeholder="اتركه فارغاً للنص الافتراضي أو ضع رابط صورة"
              />
            </label>

            <label className="field">
              مدة ظهور شاشة البداية
              <SelectField value={draft.splashDuration} onChange={(e) => updateField("splashDuration", e.target.value as DesignSettings["splashDuration"])}>
                <option value="900">سريعة (0.9 ثانية - الافتراضي)</option>
                <option value="1500">متوسطة (1.5 ثانية)</option>
                <option value="2500">طويلة (2.5 ثانية)</option>
              </SelectField>
            </label>
          </div>

          <label className="field">
            رابط صورة شاشة البداية (Splash Screen)
            <input
              type="text"
              dir="ltr"
              value={draft.splashImageUrl}
              onChange={(e) => updateField("splashImageUrl", e.target.value)}
              placeholder="/images/logo-daleel-transparent.png"
            />
          </label>

          <div className="design-toggles-grid">
            <label className="checkbox-field"><input type="checkbox" checked={draft.headerSticky} onChange={(e) => updateField("headerSticky", e.target.checked)}/>تثبيت الهيدر أعلى الشاشة عند التمرير</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderBell} onChange={(e) => updateField("showHeaderBell", e.target.checked)}/>إظهار جرس الإشعارات في الهيدر</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderFavorites} onChange={(e) => updateField("showHeaderFavorites", e.target.checked)}/>إظهار زر المفضلة في الهيدر</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderDarkToggle} onChange={(e) => updateField("showHeaderDarkToggle", e.target.checked)}/>إظهار زر الوضع الليلي في الهيدر</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderLoginBtn} onChange={(e) => updateField("showHeaderLoginBtn", e.target.checked)}/>إظهار زر دخول الأعضاء في الهيدر</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.showFooterWhatsapp} onChange={(e) => updateField("showFooterWhatsapp", e.target.checked)}/>إظهار زر واتساب الإدارة في الفوتر</label>
            <label className="checkbox-field"><input type="checkbox" checked={draft.splashEnabled} onChange={(e) => updateField("splashEnabled", e.target.checked)}/>تفعيل شاشة البداية الترحيبية عند أول فتح</label>
          </div>
        </section>
      )}

      {/* 7. Login & Register Customizer */}
      {(activeFilter === "all" || activeFilter === "auth") && (
        <section className="design-group-card">
          <div className="design-group-head">
            <LockKeyhole size={20}/>
            <div>
              <h3>7. تعديل شكل وصورة ونصوص تسجيل الدخول والعضوية</h3>
              <p>تحكم في صورة البانر الترحيبي وعناوين وشكل خانات شاشة الدخول وإنشاء العضوية</p>
            </div>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              عنوان شاشة تسجيل الدخول
              <input value={draft.loginTitle} onChange={(e) => updateField("loginTitle", e.target.value)} maxLength={120}/>
            </label>
            <label className="field">
              وصف شاشة تسجيل الدخول
              <input value={draft.loginSubtitle} onChange={(e) => updateField("loginSubtitle", e.target.value)} maxLength={180}/>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              عنوان شاشة إنشاء العضوية
              <input value={draft.registerTitle} onChange={(e) => updateField("registerTitle", e.target.value)} maxLength={120}/>
            </label>
            <label className="field">
              وصف شاشة إنشاء العضوية
              <input value={draft.registerSubtitle} onChange={(e) => updateField("registerSubtitle", e.target.value)} maxLength={180}/>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              رابط صورة مخصصة لبانر الدخول والعضوية (اختياري)
              <input
                type="text"
                dir="ltr"
                value={draft.authBannerImage}
                onChange={(e) => updateField("authBannerImage", e.target.value)}
                placeholder="مثال: /images/hero-category-transparent.webp"
              />
            </label>

            <label className="field">
              ترتيب خانات تسجيل العضوية
              <SelectField value={draft.authFieldsLayout} onChange={(e) => updateField("authFieldsLayout", e.target.value as DesignSettings["authFieldsLayout"])}>
                <option value="two-col">خانتين جنب بعض (مدمج ومختصر - الافتراضي)</option>
                <option value="one-col">خانة واحدة في كل سطر تحت بعض</option>
              </SelectField>
            </label>
          </div>

          <div className="form-row compact-two-col">
            <label className="field">
              لون بوردر خانات الإدخال (Textboxes) في الدخول والعضوية
              <div className="design-color-field">
                <input type="color" value={draft.authInputBorderColor} onChange={(e) => updateField("authInputBorderColor", e.target.value)}/>
                <input type="text" dir="ltr" value={draft.authInputBorderColor} onChange={(e) => updateField("authInputBorderColor", e.target.value)}/>
              </div>
            </label>

            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label className="checkbox-field" style={{ minHeight: 44 }}>
                <input type="checkbox" checked={draft.authShowBanner} onChange={(e) => updateField("authShowBanner", e.target.checked)}/>
                إظهار البانر الترحيبي العلوي في شاشات الدخول والعضوية
              </label>
            </div>
          </div>
        </section>
      )}

      <div className="form-submit-center">
        <button type="submit" className="button button-primary form-submit" disabled={saving}>
          {saving ? <LoaderCircle size={18} className="spin"/> : <Check size={18}/>}
          حفظ وتطبيق المظهر والهيكل على الموقع
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Check,
  ChevronDown,
  Download,
  Eye,
  Grid2X2,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Monitor,
  Palette,
  PhoneCall,
  RotateCcw,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Type,
  Upload,
  UsersRound,
} from "lucide-react";
import {
  defaultDesignSettings,
  designThemePresets,
  parseAnnouncementItems,
  parseColorScaleOrThemeJson,
  sanitizeDesignSettings,
  type DesignSettings,
  parseProviderEdgeTools,
  providerEdgeToolIds,
  type ProviderEdgeToolId,
  type CategoryRecord,
  initialCategories,
  readableTextOn,
} from "@/lib/catalog";
import { applyDesignSettingsToDocument } from "@/components/design-applicator";
import EdgeToolsEditor from "@/components/edge-tools-editor";
import DetailPreview from "@/components/detail-preview";
import { MainCategoryIcon } from "@/components/ui";
import SelectField from "@/components/select-field";
import ImageUploadField from "@/components/image-upload-field";
import { SPLASH_PREVIEW_EVENT } from "@/components/splash-screen";

type SectionFilter = "all" | "general" | "top" | "categories" | "providers" | "footer" | "splash";
type SavedCustomPreset = { id: string; name: string; settings: DesignSettings };
const CUSTOM_PRESETS_KEY = "janzour-custom-design-presets";

const homeSectionsMeta: Record<string, { label: string; toggleKey: keyof DesignSettings }> = {
  hero: { label: "البانر الترحيبي والبحث الرئيسي", toggleKey: "showHero" },
  features: { label: "الكروت الثلاثة (المناوبات + أرقام تهمك + الخدمات السريعة)", toggleKey: "showFeatureCards" },
  featured: { label: "قسم مقدمو الخدمات المميزين", toggleKey: "showFeaturedSection" },
  categories: { label: "أقسام القرية والتخصصات", toggleKey: "showCategoriesSection" },
  professionBanner: { label: "بانر «أضف مهنتك» والطوارئ", toggleKey: "showAddProfessionBanner" },
};

const QUICK_SWATCHES = {
  primary: ["#0878c9", "#0d8a5f", "#1d4ed8", "#b45309", "#6d28d9", "#be123c", "#0f766e", "#1e293b"],
  pageBg: ["#f3f7fa", "#f2f8f5", "#f1f5f9", "#faf7f2", "#f6f4fb", "#ffffff", "#eef4fb", "#f8fafc"],
  modalHeader: ["#dcecfb", "#d6f2e6", "#dbeafe", "#fde6c4", "#e9d5ff", "#ffe4e6", "#ccfbf1", "#e2e8f0"],
  button: ["#0c72c7", "#0f8c62", "#1e40af", "#c2610c", "#7c3aed", "#e11d48", "#0d9488", "#153c66"],
  border: ["#dce6ef", "#cfe6dc", "#cbd5e1", "#eadbc8", "#ddd6fe", "#b8d4ee", "#94a3b8", "#e2e8f0"],
  cardBg: ["#ffffff", "#f9fcff", "#f4fbf7", "#fffdf9", "#f8f7ff", "#f1f7fd"],
  headerBg: ["#ffffff", "#f4f9ff", "#f0fdf4", "#fffbeb", "#0f243c", "#1e293b"],
  footerBg: ["#102437", "#0d2920", "#0f172a", "#271a0c", "#1e1035", "#18181b"],
  whatsapp: ["#1fa855", "#128c7e", "#0d8a5f", "#16a34a", "#059669", "#0c72c7"],
};

function SectionDivider({ step, label }: { step: string; label: string }) {
  return (
    <div className="design-section-divider" aria-hidden="true">
      <span className="design-divider-line"/>
      <span className="design-divider-badge">
        <b>{step}</b>
        <span>{label}</span>
      </span>
      <span className="design-divider-line"/>
    </div>
  );
}

function InnerDivider({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="design-inner-divider">
      <div className="design-inner-divider-head">
        <span className="design-inner-dot"/>
        <strong>{title}</strong>
        <span className="design-inner-rule"/>
      </div>
      {subtitle && <small>{subtitle}</small>}
    </div>
  );
}

function ColorPickerField({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (color: string) => void;
}) {
  return (
    <div className="field design-color-control">
      <span>{label}</span>
      <div className="design-color-field">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`كود ${label}`}
        />
      </div>
      <div className="design-color-swatches" role="group" aria-label={`ألوان سريعة لـ ${label}`}>
        {swatches.map((hex) => (
          <button
            type="button"
            key={hex}
            className={`design-swatch-dot ${value.toLowerCase() === hex.toLowerCase() ? "is-active" : ""}`}
            style={{ backgroundColor: hex }}
            onClick={() => onChange(hex)}
            title={hex}
            aria-label={`اختيار اللون ${hex}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function DesignCustomizer({
  initialDesign,
  onSave,
  categories = initialCategories,
}: {
  initialDesign?: DesignSettings;
  onSave: (values: DesignSettings) => Promise<boolean>;
  categories?: CategoryRecord[];
}) {
  const [draft, setDraft] = useState<DesignSettings>(() => ({
    ...defaultDesignSettings,
    ...(initialDesign ?? {}),
  }));
  const [activeFilter, setActiveFilter] = useState<SectionFilter>("all");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [openThemeFamilies, setOpenThemeFamilies] = useState<Record<string, boolean>>({});
  const themeFamilies = useMemo(() => {
    // الثيمات المتقاعدة (retired) تبقى صالحة لمن اختارها سابقًا لكنها لا تظهر في القوائم.
    const keys = (Object.keys(designThemePresets) as Array<Exclude<DesignSettings["themePreset"], "custom">>).filter((key) => !designThemePresets[key].retired || key === initialDesign?.themePreset);
    return [
      { id: "gradient", title: "ثيمات الجريديانت", subtitle: "5 ثيمات متدرجة أساسية", preview: "linear-gradient(135deg, #0b3d91, #1079ff 50%, #ffb703)", keys: keys.filter((key) => !key.startsWith("vista-") && !key.startsWith("win11-") && !key.startsWith("win10-")) },
      { id: "vista", title: "ثيمات Windows Vista Aero", subtitle: "5 ثيمات زجاج Aero الشفاف", preview: "linear-gradient(135deg, #062a55, #1b74d0 45%, #9fdcff)", keys: keys.filter((key) => key.startsWith("vista-")) },
      { id: "win10", title: "ثيمات Windows 10", subtitle: "واجهة ويندوز 10 الحقيقية: زوايا حادة وأزرار مسطحة وقائمة ابدأ", preview: "linear-gradient(135deg, #003e92, #0078d7 55%, #e6e6e6)", keys: keys.filter((key) => key.startsWith("win10-")) },
      { id: "win11", title: "ثيمات Windows 11 Fluent", subtitle: "أسطح Mica وزوايا ناعمة وخلفيات Bloom", preview: "linear-gradient(135deg, #0067c0, #4cc2ff 55%, #dbeafe)", keys: keys.filter((key) => key.startsWith("win11-")) },
    ];
  }, [initialDesign?.themePreset]);
  const [saving, setSaving] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedCustomPreset[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedCustomPreset[]) : [];
    } catch {
      return [];
    }
  });
  const [customPresetName, setCustomPresetName] = useState("");
  const [presetMessage, setPresetMessage] = useState("");
  const [paletteSnippet, setPaletteSnippet] = useState("");

  useEffect(() => {
    applyDesignSettingsToDocument(draft);
  }, [draft]);

  function updateField<K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  // Edge tools: the saved string keeps only visible tools in order; hidden ones keep their last
  // position in a local order list so re-showing them does not jump them to the end.
  const edgeToolsVisible = useMemo(() => parseProviderEdgeTools(draft.providerEdgeTools), [draft.providerEdgeTools]);
  const [edgeToolOrder, setEdgeToolOrder] = useState<ProviderEdgeToolId[]>(() => {
    const visible = parseProviderEdgeTools(draft.providerEdgeTools);
    return [...visible, ...providerEdgeToolIds.filter((id) => !visible.includes(id))];
  });
  function commitEdgeTools(order: ProviderEdgeToolId[], visible: ProviderEdgeToolId[]) {
    setEdgeToolOrder(order);
    updateField("providerEdgeTools", order.filter((id) => visible.includes(id)).join(","));
  }
  function applyPreset(presetKey: Exclude<DesignSettings["themePreset"], "custom">) {
    const preset = designThemePresets[presetKey];
    setDraft((current) => ({
      ...current,
      themePreset: presetKey,
      ...preset.colors,
      ...preset.darkColors,
      ...(presetKey === "ramadan"
        ? { seasonalRibbon: "ramadan" as const, heroPattern: "islamic" as const }
        : presetKey === "eid"
          ? { seasonalRibbon: "eid" as const, heroPattern: "stars" as const }
          : presetKey === "schools"
            ? { seasonalRibbon: "schools" as const, heroPattern: "grid" as const }
            : presetKey === "winter-emergency"
              ? { seasonalRibbon: "winter" as const, heroPattern: "waves" as const }
              : {}),
    }));
  }

  function saveCurrentAsCustomPreset() {
    const name = customPresetName.trim() || `تصميم مخصص (${savedPresets.length + 1})`;
    const entry: SavedCustomPreset = {
      id: `preset-${Date.now()}`,
      name,
      settings: { ...draft },
    };
    const next = [entry, ...savedPresets].slice(0, 12);
    setSavedPresets(next);
    setCustomPresetName("");
    setPresetMessage(`تم حفظ القالب «${name}» في قوالبك الخاصة.`);
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }

  function applySavedCustomPreset(entry: SavedCustomPreset) {
    const clean = sanitizeDesignSettings(entry.settings);
    setDraft(clean);
    setPresetMessage(`تم تطبيق القالب المحفوظ «${entry.name}».`);
  }

  function deleteSavedCustomPreset(id: string) {
    const next = savedPresets.filter((item) => item.id !== id);
    setSavedPresets(next);
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }

  function exportDesignJson() {
    try {
      const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "daleel-ganzour-theme.json";
      a.click();
      URL.revokeObjectURL(url);
      setPresetMessage("تم تصدير ملف إعدادات المظهر بنجاح.");
    } catch {
      setPresetMessage("تعذر تصدير الملف.");
    }
  }

  function importDesignJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = parseColorScaleOrThemeJson(String(reader.result ?? ""), draft);
        setDraft(result.settings);
        setPresetMessage(`✅ تم استيراد وتطبيق «${result.label}» بنجاح للوضعين النهاري والليلي.`);
      } catch {
        setPresetMessage("الملف غير صالح لاستيراد إعدادات المظهر أو درجات الألوان.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function applyPastedScaleOrJson() {
    try {
      const result = parseColorScaleOrThemeJson(paletteSnippet, draft);
      setDraft(result.settings);
      setPresetMessage(`✅ تم تطبيق «${result.label}» بنجاح على الوضع النهاري والوضع الليلي! اضغط «حفظ وتطبيق المظهر» لاعتماده.`);
    } catch (err) {
      setPresetMessage(err instanceof Error ? err.message : "تعذر قراءة كود الألوان أو JSON.");
    }
  }

  function resetAll() {
    setDraft({ ...defaultDesignSettings });
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
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
            <Palette size={15}/>
            استوديو تخصيص المظهر والهيكل
          </span>
          <h3>تحكم كامل في ألوان، عناوين، براويز، أيقونات، وهيكل التطبيق</h3>
          <p>مصمم خصيصاً لسهولة التحكم من الموبايل والكمبيوتر مع معاينة حية فورية وفواصل منظمة لكل قسم.</p>
        </div>
        <div className="design-studio-top-actions">
          <button type="button" className="button button-soft button-small" onClick={resetAll}>
            <RotateCcw size={15}/>
            استعادة الافتراضي
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? <LoaderCircle size={17} className="spin"/> : <Check size={17}/>}
            حفظ وتطبيق المظهر
          </button>
        </div>
      </div>

      {/* Live Preview Box with Mobile / Desktop Switcher */}
      <div className="design-live-preview-card">
        <div className="design-preview-toolbar">
          <span className="design-preview-pill"><Eye size={14}/> معاينة حية فورية</span>
          <div className="design-preview-device-toggle" role="group" aria-label="حجم شاشة المعاينة">
            <button
              type="button"
              className={previewDevice === "mobile" ? "is-active" : ""}
              onClick={() => setPreviewDevice("mobile")}
            >
              <Smartphone size={14}/>
              <span>موبايل</span>
            </button>
            <button
              type="button"
              className={previewDevice === "desktop" ? "is-active" : ""}
              onClick={() => setPreviewDevice("desktop")}
            >
              <Monitor size={14}/>
              <span>كمبيوتر</span>
            </button>
          </div>
        </div>

        <div className={`design-preview-viewport is-${previewDevice}`}>
          <div
            className={`design-preview-head is-pattern-${draft.heroPattern || "none"} is-opacity-${draft.patternOpacity || "subtle"}`}
            style={{ background: draft.modalHeaderBg }}
          >
            <strong>هيدر الشاشات والبانر باللون والنقشة المختارة</strong>
            <small>
              {draft.heroPattern !== "none" || draft.headerPattern !== "none"
                ? `نقشة البانر: ${draft.heroPattern} • نقشة الهيدر: ${draft.headerPattern}`
                : "العنوان والسطر الفرعي متوسطن بخلفية مخصصة"}
            </small>
          </div>
          {draft.announcementEnabled && (
            <div className="design-preview-announcement" style={{ background: draft.announcementBgColorLight, color: readableTextOn(draft.announcementBgColorLight) }} title="معاينة الوضع النهاري">
              <Sparkles size={12}/>
              <span>
                {draft.announcementTickerMode === "single"
                  ? draft.announcementText
                  : parseAnnouncementItems(draft).join("  •  ") || draft.announcementText}
              </span>
            </div>
          )}
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
              <span>معاينة شكل عنوان القسم</span>
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
                  <span>معاينة البوردر وموضع الأيقونة ومحاذاة النص</span>
                </div>
              </div>

              <div className="design-preview-buttons-box" style={{ justifyContent: draft.buttonAlign === "center" ? "center" : draft.buttonAlign === "right" ? "flex-start" : "stretch" }}>
                <span
                  className={`design-preview-btn is-shape-${draft.buttonShape} is-effect-${draft.buttonEffect} ${draft.buttonAlign === "full" ? "is-full" : ""}`}
                  style={{
                    "--preview-btn-color": draft.buttonColor,
                  } as React.CSSProperties}
                >
                  <PhoneCall size={14}/>
                  زر الاتصال
                </span>
                {draft.showProviderWhatsappBtn && (
                  <span
                    className={`design-preview-btn is-shape-${draft.buttonShape}`}
                    style={{ background: draft.whatsappButtonColor }}
                  >
                    <MessageCircle size={14}/>
                    واتساب
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Swipeable Section Filter Tabs on Mobile */}
      <div className="design-section-tabs" role="tablist" aria-label="أقسام تخصيص المظهر">
        <button type="button" className={activeFilter === "all" ? "is-active" : ""} onClick={() => setActiveFilter("all")}><Sparkles size={15}/>الكل (٦ أقسام)</button>
        <button type="button" className={activeFilter === "general" ? "is-active" : ""} onClick={() => setActiveFilter("general")}><Palette size={15}/>1. الستايل العام</button>
        <button type="button" className={activeFilter === "top" ? "is-active" : ""} onClick={() => setActiveFilter("top")}><LayoutTemplate size={15}/>2. أعلى الصفحة (الهيدر والبانر والشريط)</button>
        <button type="button" className={activeFilter === "categories" ? "is-active" : ""} onClick={() => setActiveFilter("categories")}><Grid2X2 size={15}/>3. أقسام القرية والتخصصات</button>
        <button type="button" className={activeFilter === "providers" ? "is-active" : ""} onClick={() => setActiveFilter("providers")}><UsersRound size={15}/>4. المميزون وكروت المهنيين</button>
        <button type="button" className={activeFilter === "footer" ? "is-active" : ""} onClick={() => setActiveFilter("footer")}><Square size={15}/>5. الفوتر</button>
        <button type="button" className={activeFilter === "splash" ? "is-active" : ""} onClick={() => setActiveFilter("splash")}><LockKeyhole size={15}/>6. شاشة البداية والدخول</button>
      </div>

      {/* 1. general */}
      {(activeFilter === "all" || activeFilter === "general") && (
        <>
          <SectionDivider step="١" label="الستايل العام للتطبيق" />
          <section className={`design-group-card ${collapsedGroups.general ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("general")} aria-expanded={!collapsedGroups.general}>
              <span className="design-group-icon"><Palette size={20}/></span>
              <div className="design-group-title">
                <h3>1. الستايل العام (ألوان، خطوط، براويز، أزرار، صوت)</h3>
                <p>كل ما يؤثر على شكل التطبيق كله في أي صفحة: الثيمات والألوان، الخطوط والمحاذاة، البراويز والفواصل، شكل الأزرار، وصوت النقرات</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.general ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.general && (
              <div className="design-group-content">
                <InnerDivider title="ثيمات الجريديانت المتكاملة (تعمل في الليل والنهار وتناسب البراويز الرئيسية)" subtitle="اختر أي ثيم جريديانت ليضبط ألوان الوضع الليلي والنهاري وبراويز العناوين تلقائياً بضغطة واحدة" />
                {themeFamilies.map((family) => {
                  const open = Boolean(openThemeFamilies[family.id]);
                  const selectedInFamily = family.keys.find((key) => key === draft.themePreset);
                  return (
                    <div className={`theme-family ${open ? "is-open" : ""}`} key={family.id}>
                      <button type="button" className="theme-family-toggle" onClick={() => setOpenThemeFamilies((current) => ({ ...current, [family.id]: !current[family.id] }))} aria-expanded={open} aria-controls={`theme-family-${family.id}`}>
                        <span className="theme-family-swatch" style={{ background: family.preview }} aria-hidden="true"/>
                        <span className="theme-family-text">
                          <strong>{family.title} <small>({family.keys.length})</small></strong>
                          <small>{selectedInFamily ? `المختار حاليًا: ${designThemePresets[selectedInFamily].label}` : family.subtitle}</small>
                        </span>
                        <ChevronDown size={18} className={`theme-family-chevron ${open ? "is-open" : ""}`}/>
                      </button>
                      {open && (
                        <div className="design-presets-grid" id={`theme-family-${family.id}`}>
                          {family.keys.map((key) => {
                            const preset = designThemePresets[key];
                            const isSelected = draft.themePreset === key;
                            return (
                              <button
                                type="button"
                                key={key}
                                className={`design-preset-card ${isSelected ? "is-selected" : ""}`}
                                onClick={() => applyPreset(key)}
                              >
                                <div className="design-preset-gradient-bar" style={{ background: preset.gradientPreview }} aria-hidden="true"/>
                                <div className="design-preset-top-row">
                                  <div className="design-preset-swatches">
                                    <span style={{ background: preset.colors.primaryColor }} title="اللون النهاري"/>
                                    <span style={{ background: preset.colors.buttonColor }} title="لون الأزرار"/>
                                    <span style={{ background: preset.darkColors.darkCardBgColor }} title="لون الكارت الليلي"/>
                                    <span style={{ background: preset.darkColors.darkPrimaryColor }} title="لون التمييز الليلي"/>
                                  </div>
                                  {preset.badge && <span className="design-preset-season-badge">{preset.badge}</span>}
                                </div>
                                <strong>{preset.label}</strong>
                                <small>{preset.description}</small>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <label className="field">
                  شريط التهنئة والمواسم الاحتفالي الجاهز أعلى الموقع
                  <SelectField value={draft.seasonalRibbon} onChange={(e) => updateField("seasonalRibbon", e.target.value as DesignSettings["seasonalRibbon"])}>
                    <option value="none">بدون شريط موسمي (الافتراضي)</option>
                    <option value="ramadan">🌙 شريط شهر رمضان المبارك (رمضان كريم على أهالي جنزور)</option>
                    <option value="eid">🎉 شريط تهنئة العيد السعيد (عيدكم مبارك يا أهل جنزور)</option>
                    <option value="schools">🎒 شريط موسم العودة للمدارس والدروس</option>
                    <option value="winter">🌧️ شريط موسم الشتاء وأرقام الطوارئ السريعة</option>
                  </SelectField>
                </label>

                <InnerDivider title="حفظ قوالب مظهر خاصة بك وتصدير / استيراد الإعدادات" subtitle="احفظ تصميمك الحالي باسم مخصص للرجوع إليه في أي وقت أو صدّره كملف" />
                <div className="design-custom-presets-box">
                  <div className="design-custom-preset-save-row">
                    <input
                      type="text"
                      value={customPresetName}
                      onChange={(e) => setCustomPresetName(e.target.value)}
                      placeholder="اسم القالب الخاص بك (مثال: تصميم رمضان ٢٠٢٧)"
                      maxLength={60}
                    />
                    <button type="button" className="button button-primary button-small" onClick={saveCurrentAsCustomPreset}>
                      <BookmarkPlus size={15}/> حفظ كقالب خاص
                    </button>
                    <button type="button" className="button button-soft button-small" onClick={exportDesignJson}>
                      <Download size={15}/> تصدير JSON
                    </button>
                    <label className="button button-soft button-small design-import-label">
                      <Upload size={15}/> استيراد JSON
                      <input type="file" accept=".json,application/json,text/plain" onChange={importDesignJson} hidden />
                    </label>
                  </div>

                  <div className="design-scale-paste-box">
                    <label className="field">
                      <span>لصق كود تدرج ألوان (50–950 مثل Royal Blue / UI Colors) أو كود JSON كامل:</span>
                      <textarea
                        rows={4}
                        dir="ltr"
                        value={paletteSnippet}
                        onChange={(e) => setPaletteSnippet(e.target.value)}
                        placeholder={`'royal-blue': {\n  '50': '#edf7ff', '100': '#d7edff', '200': '#b8e0ff',\n  '400': '#50b4ff', '600': '#1079ff', '700': '#095de2',\n  '800': '#0f4ebe', '900': '#134595', '950': '#112b5a'\n}`}
                      />
                    </label>
                    <div className="design-scale-paste-actions">
                      <button type="button" className="button button-primary button-small" onClick={applyPastedScaleOrJson}>
                        <Sparkles size={15}/> تطبيق الكود على الوضع النهاري والليلي فوراً
                      </button>
                      <a href="/themes/royal-blue-theme.json" download className="button button-soft button-small">
                        <Download size={14}/> تحميل ملف Royal Blue JSON
                      </a>
                      <a href="/themes/emerald-village-theme.json" download className="button button-soft button-small">
                        <Download size={14}/> تحميل ملف الزمرد JSON
                      </a>
                      <a href="/themes/royal-gold-theme.json" download className="button button-soft button-small">
                        <Download size={14}/> تحميل ملف الذهب الملكي JSON
                      </a>
                    </div>
                  </div>

                  {presetMessage && <small className="design-preset-msg" role="status">{presetMessage}</small>}
                  {savedPresets.length > 0 && (
                    <div className="design-saved-presets-list">
                      {savedPresets.map((item) => (
                        <div key={item.id} className="design-saved-preset-chip">
                          <button type="button" className="design-saved-preset-apply" onClick={() => applySavedCustomPreset(item)}>
                            <span className="design-saved-dot" style={{ background: item.settings.primaryColor }} />
                            <strong>{item.name}</strong>
                          </button>
                          <button
                            type="button"
                            className="design-saved-preset-del"
                            onClick={() => deleteSavedCustomPreset(item.id)}
                            aria-label={`حذف القالب ${item.name}`}
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <InnerDivider title="تخصيص الألوان الأساسية والخلفية (الوضع النهاري ☀️)" subtitle="اضغط على أي دائرة ملونة للاختيار السريع من الموبايل" />
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="اللون الأساسي والعناوين (درجة 700)"
                    value={draft.primaryColor}
                    swatches={["#095de2", ...QUICK_SWATCHES.primary]}
                    onChange={(hex) => { updateField("primaryColor", hex); updateField("themePreset", "custom"); }}
                  />
                  <ColorPickerField
                    label="لون خلفية الصفحات العام (درجة 50)"
                    value={draft.pageBgColor}
                    swatches={["#edf7ff", ...QUICK_SWATCHES.pageBg]}
                    onChange={(hex) => { updateField("pageBgColor", hex); updateField("themePreset", "custom"); }}
                  />
                </div>

                <InnerDivider title="ألوان الشاشات العائمة والأزرار (الوضع النهاري ☀️)" />
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون هيدر الشاشات العائمة (درجة 100)"
                    value={draft.modalHeaderBg}
                    swatches={["#d7edff", ...QUICK_SWATCHES.modalHeader]}
                    onChange={(hex) => { updateField("modalHeaderBg", hex); updateField("themePreset", "custom"); }}
                  />
                  <ColorPickerField
                    label="لون أزرار الاتصال والأزرار الرئيسية (درجة 600)"
                    value={draft.buttonColor}
                    swatches={["#1079ff", ...QUICK_SWATCHES.button]}
                    onChange={(hex) => { updateField("buttonColor", hex); updateField("themePreset", "custom"); }}
                  />
                </div>

                <InnerDivider title="تخصيص ألوان الوضع الليلي (Dark Mode 🌙) والأنيميشن اللامع" subtitle="تُضبط تلقائياً من درجات 400 و800 و900 و950 عند لصق تدرج ألوان" />
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون خلفية الوضع الليلي (درجة 950)"
                    value={draft.darkPageBgColor}
                    swatches={["#112b5a", "#0b192c", "#0f172a", "#071f18", "#1a1207", "#18181b"]}
                    onChange={(hex) => updateField("darkPageBgColor", hex)}
                  />
                  <ColorPickerField
                    label="لون الكروت في الوضع الليلي (درجة 900)"
                    value={draft.darkCardBgColor}
                    swatches={["#134595", "#112845", "#1e293b", "#0d2e24", "#271c09", "#27272a"]}
                    onChange={(hex) => updateField("darkCardBgColor", hex)}
                  />
                </div>
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون البراويز في الوضع الليلي (درجة 800)"
                    value={draft.darkBorderColor}
                    swatches={["#0f4ebe", "#1e4976", "#334155", "#115e59", "#b45309", "#3f3f46"]}
                    onChange={(hex) => updateField("darkBorderColor", hex)}
                  />
                  <ColorPickerField
                    label="لون التمييز والأيقونات ليلاً (درجة 400)"
                    value={draft.darkPrimaryColor}
                    swatches={["#50b4ff", "#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"]}
                    onChange={(hex) => updateField("darkPrimaryColor", hex)}
                  />
                </div>

                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون أزرار الواتساب"
                    value={draft.whatsappButtonColor}
                    swatches={QUICK_SWATCHES.whatsapp}
                    onChange={(hex) => updateField("whatsappButtonColor", hex)}
                  />
                  <label className="field">
                    الوضع الافتراضي للموقع (النهاري / الليلي)
                    <SelectField value={draft.themeMode} onChange={(e) => updateField("themeMode", e.target.value as DesignSettings["themeMode"])}>
                      <option value="auto">تلقائي — يتبع إعداد جهاز الزائر (ليلي/نهاري) — الافتراضي</option>
                      <option value="light">الوضع النهاري الفاتح لكل الزوار</option>
                      <option value="dark">الوضع الليلي الداكن لكل الزوار</option>
                    </SelectField>
                    <small className="input-help">في كل الأحوال لو بدّل الزائر الوضع بنفسه من زر الشمس/القمر يُحفظ اختياره على جهازه.</small>
                  </label>
                </div>
                <label className="field">
                  استدارة زوايا ثيمات Windows 10 (تظهر عند اختيار أي ثيم Win10)
                  <SelectField value={draft.win10Radius} onChange={(e) => updateField("win10Radius", e.target.value as DesignSettings["win10Radius"])}>
                    <option value="0">حادة تمامًا 0 بكسل (ويندوز 10 الأصلي)</option>
                    <option value="2">خفيفة 2 بكسل (الافتراضي)</option>
                    <option value="6">ناعمة 6 بكسل</option>
                    <option value="12">مستديرة 12 بكسل</option>
                  </SelectField>
                </label>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={draft.shimmerEffectEnabled !== false}
                    onChange={(e) => updateField("shimmerEffectEnabled", e.target.checked)}
                  />
                  <span>✨ تفعيل أنيميشن اللمعة المتحركة (Shimmer Glow) على الأزرار الذهبية وبرواز الرعاة</span>
                </label>

                <InnerDivider title="محاذاة العناوين والكروت والملحوظات" subtitle="اختر هل الكلام يكون على اليمين أو متوسطن في المنتصف أو على الشمال" />
                <div className="form-row design-two-col">
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

                <div className="form-row design-two-col">
                  <div className="field">
                    <span>محاذاة الملحوظات والتنبيهات</span>
                    <div className="design-choice-pills">
                      <button type="button" className={draft.noticeAlign === "right" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "right")}><AlignRight size={15}/>يمين</button>
                      <button type="button" className={draft.noticeAlign === "center" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "center")}><AlignCenter size={15}/>توسيط</button>
                      <button type="button" className={draft.noticeAlign === "left" ? "is-active" : ""} onClick={() => updateField("noticeAlign", "left")}><AlignLeft size={15}/>شمال</button>
                    </div>
                  </div>

                  <label className="field">
                    شكل برواز العناوين الرئيسية للأقسام (١٢ شكلاً متنوعاً)
                    <SelectField value={draft.sectionHeadingStyle} onChange={(e) => updateField("sectionHeadingStyle", e.target.value as DesignSettings["sectionHeadingStyle"])}>
                      <option value="clean">🤍 بطاقة بيضاء أنيقة متناسقة مع التطبيق (الافتراضي)</option>
                      <option value="sky-gradient">✨ برواز جريديانت مضيء فخم</option>
                      <option value="royal-ribbon">👑 برواز التاج الملكي المتدرج</option>
                      <option value="neon-border">⚡ برواز نيون متوهج بالثيم</option>
                      <option value="double-frame">🏛️ برواز مزدوج كلاسيكي راقٍ</option>
                      <option value="glass-card">💎 برواز زجاجي عائم (Glassmorphism)</option>
                      <option value="gold-crest">🌟 برواز ذهبي ملكي بحدود ذهبية</option>
                      <option value="3d-banner">🧊 برواز بارز ثلاثي الأبعاد (3D Banner)</option>
                      <option value="pill-badge">💊 برواز كبسولة جريديانت دائرية</option>
                      <option value="boxed">📦 صندوق بإطار ملون واضح</option>
                      <option value="underline">📏 خط سفلي متدرج تحت العنوان</option>
                      <option value="right-bar">▐ شريط جانبي سميك على اليمين</option>
                    </SelectField>
                  </label>
                </div>

                <InnerDivider title="نوع وحجم وسمك الخط العربي" />
                <div className="form-row design-two-col">
                  <label className="field">
                    حجم الخط العام للتطبيق
                    <SelectField value={draft.fontScale} onChange={(e) => updateField("fontScale", e.target.value as DesignSettings["fontScale"])}>
                      <option value="small">صغير مدمج (94%)</option>
                      <option value="normal">متوسط متوازن (100% - الافتراضي)</option>
                      <option value="large">كبير واضح (108%)</option>
                      <option value="xlarge">كبير جداً لكبار السن (116%)</option>
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

                <InnerDivider title="ألوان البراويز وخلفية الكروت" />
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون بوردر البراويز والكروت"
                    value={draft.borderColor}
                    swatches={QUICK_SWATCHES.border}
                    onChange={(hex) => updateField("borderColor", hex)}
                  />
                  <ColorPickerField
                    label="لون خلفية الكروت والبراويز"
                    value={draft.cardBgColor}
                    swatches={QUICK_SWATCHES.cardBg}
                    onChange={(hex) => updateField("cardBgColor", hex)}
                  />
                </div>

                <InnerDivider title="سمك البوردر واستدارة الحواف والظل" />
                <div className="form-row design-two-col">
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

                <div className="form-row design-two-col">
                  <label className="field">
                    قوة ظل وبروز الكروت (Shadow)
                    <SelectField value={draft.cardShadow} onChange={(e) => updateField("cardShadow", e.target.value as DesignSettings["cardShadow"])}>
                      <option value="none">مسطح بدون ظل</option>
                      <option value="soft">ظل هادئ ناعم (الافتراضي)</option>
                      <option value="elevated-3d">ظل بارز ثلاثي الأبعاد (3D Card Elevation)</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    تأثير أنيميشن وحركة الكارت عند اللمس (١٠ أشكال أنيميشن)
                    <SelectField value={draft.cardHoverEffect} onChange={(e) => updateField("cardHoverEffect", e.target.value as DesignSettings["cardHoverEffect"])}>
                      <option value="lift">ارتفاع ناعم للأعلى (Lift - الافتراضي)</option>
                      <option value="glow">توهج مضيء حول البرواز (Glow)</option>
                      <option value="scale">تكبير خفيف وواضح (Scale Zoom)</option>
                      <option value="tilt">إمالة عصرية مع بروز للإطار (Tilt)</option>
                      <option value="float-3d">طفو ثلاثي الأبعاد فاخر (Float 3D)</option>
                      <option value="border-pulse">نبض متوهج للإطار (Border Pulse)</option>
                      <option value="neon-sweep">مسحة نيون ضوئية (Neon Sweep)</option>
                      <option value="spring-pop">قفزة مرنة حيوية (Spring Pop)</option>
                      <option value="shine-glint">بريق زجاجي لامع (Shine Glint)</option>
                      <option value="none">ثابت بدون حركة</option>
                    </SelectField>
                  </label>
                </div>

                <InnerDivider title="الفواصل والمسافات بين أقسام الموقع" />
                <div className="form-row design-two-col">
                  <label className="field">
                    شكل الفواصل البصرية بين أقسام الصفحة
                    <SelectField value={draft.sectionDividerStyle} onChange={(e) => updateField("sectionDividerStyle", e.target.value as DesignSettings["sectionDividerStyle"])}>
                      <option value="none">بدون خط فاصل (الافتراضي)</option>
                      <option value="line">خط فاصل أنيق بين كل قسم</option>
                      <option value="gradient">فاصل ملون متدرج في المنتصف</option>
                      <option value="dots">فاصل منقط زخرفي</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    المسافات الرأسية بين الأقسام والكروت
                    <SelectField value={draft.sectionSpacing} onChange={(e) => updateField("sectionSpacing", e.target.value as DesignSettings["sectionSpacing"])}>
                      <option value="compact">مدمجة ومختصرة للموبايل</option>
                      <option value="normal">متوسطة متوازنة (الافتراضي)</option>
                      <option value="relaxed">واسعة ومريحة للعين</option>
                    </SelectField>
                  </label>
                </div>

                <div className="form-row design-two-col">
                  <label className="field">
                    سرعة ونمط أنيميشن الكروت والنوافذ (٦ سرعات وأنماط)
                    <SelectField value={draft.cardAnimationSpeed} onChange={(e) => updateField("cardAnimationSpeed", e.target.value as DesignSettings["cardAnimationSpeed"])}>
                      <option value="ultra-slow">هادئة جداً (٠.٥٥ ثانية)</option>
                      <option value="slow">بطيئة وانسيابية (٠.٣٨ ثانية)</option>
                      <option value="normal">متوازنة وسريعة (٠.٢٤ ثانية - الافتراضي)</option>
                      <option value="fast">سريعة وخاطفة (٠.١٤ ثانية)</option>
                      <option value="bouncy">مرنة ارتدادية حيوية (Spring Bounce)</option>
                      <option value="instant">فورية بدون حركات انتقالية</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    عداد الخدمات داخل كروت الأقسام
                    <SelectField value={draft.showCategoryCounts ? "show" : "hide"} onChange={(e) => updateField("showCategoryCounts", e.target.value === "show")}>
                      <option value="show">إظهار عدد الخدمات والتخصصات (الافتراضي)</option>
                      <option value="hide">إخفاء العداد لمظهر أبسط</option>
                    </SelectField>
                  </label>
                </div>

                <InnerDivider title="أشكال واستدارة وتأثيرات الأزرار المتنوعة" />
                <div className="form-row design-two-col">
                  <label className="field">
                    شكل حواف وتصميم الأزرار (٧ أشكال)
                    <SelectField value={draft.buttonShape} onChange={(e) => updateField("buttonShape", e.target.value as DesignSettings["buttonShape"])}>
                      <option value="rounded">مستطيل بحواف دائرية ناعمة (الافتراضي)</option>
                      <option value="pill">كبسولة بيضاوية بالكامل (Pill)</option>
                      <option value="soft-square">مربع ناعم متناسق (Soft Square)</option>
                      <option value="cut-corner">حواف مشطوفة هندسية عصرية (Cut Corner)</option>
                      <option value="leaf">ورقة شجر انسيابية (Leaf Shape)</option>
                      <option value="capsule-3d">كبسولة مقعرة ثلاثية الأبعاد (Capsule 3D)</option>
                      <option value="sharp">مستطيل كلاسيكي بحواف حادة</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    تأثير وأنيميشن الأزرار (٨ تأثيرات)
                    <SelectField value={draft.buttonEffect} onChange={(e) => updateField("buttonEffect", e.target.value as DesignSettings["buttonEffect"])}>
                      <option value="glow">توهج مضيء عند اللمس (Glow - الافتراضي)</option>
                      <option value="gradient-flow">انسياب جريديانت متدرج فخم (Gradient Flow)</option>
                      <option value="3d-press">بارز ثلاثي الأبعاد بحافة سفلية (3D Press)</option>
                      <option value="neon-border">إطار نيون مضيء بالثيم (Neon Border)</option>
                      <option value="ripple-shine">موجة لمعة ضوئية متحركة (Ripple Shine)</option>
                      <option value="lift">ارتفاع ناعم للأعلى عند اللمس (Lift)</option>
                      <option value="pulse">نبض حيوي ناعم (Pulse)</option>
                      <option value="flat">مسطح بسيط وهادئ (Flat)</option>
                    </SelectField>
                  </label>
                </div>

                <InnerDivider title="موضع أزرار الإرسال في الشاشات العائمة" />
                <label className="field">
                  موضع أزرار الإرسال داخل النماذج والشاشات العائمة
                  <SelectField value={draft.buttonAlign} onChange={(e) => updateField("buttonAlign", e.target.value as DesignSettings["buttonAlign"])}>
                    <option value="center">متوسطن في منتصف الشاشة (الافتراضي)</option>
                    <option value="right">محاذاة لليمين</option>
                    <option value="full">بعرض كامل الشاشة (ممتاز للموبايل)</option>
                  </SelectField>
                </label>

                <InnerDivider title="صوت النقرات والاهتزاز" subtitle="نقرة ناعمة + اهتزاز خفيف عند الضغط على أي زر أو كارت في التطبيق (الاهتزاز على أندرويد فقط). يظهر للزوار زر مكبر صوت في الهيدر لكتم الصوت وتشغيله." />
                <div className="form-row design-two-col">
                  <label className="field">
                    عند الضغط على أي زر
                    <SelectField value={draft.tapFeedback} onChange={(e) => updateField("tapFeedback", e.target.value as DesignSettings["tapFeedback"])}>
                      <option value="both">اهتزاز خفيف + صوت نقرة ناعمة (الافتراضي)</option>
                      <option value="haptic">اهتزاز خفيف فقط</option>
                      <option value="sound">صوت نقرة فقط</option>
                      <option value="off">بدون</option>
                    </SelectField>
                  </label>
                  <label className="field">
                    وضع توفير البطارية
                    <SelectField value={draft.powerSaveMode} onChange={(e) => updateField("powerSaveMode", e.target.value as DesignSettings["powerSaveMode"])}>
                      <option value="auto">تلقائي — عند انخفاض البطارية أو طلب تقليل الحركة (الافتراضي)</option>
                      <option value="on">مفعّل دائمًا (بدون ضبابية ولا اهتزاز)</option>
                      <option value="off">معطّل دائمًا</option>
                    </SelectField>
                  </label>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* 2. top */}
      {(activeFilter === "all" || activeFilter === "top") && (
        <>
          <SectionDivider step="٢" label="أعلى الصفحة قبل أقسام القرية" />
          <section className={`design-group-card ${collapsedGroups.top ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("top")} aria-expanded={!collapsedGroups.top}>
              <span className="design-group-icon"><LayoutTemplate size={20}/></span>
              <div className="design-group-title">
                <h3>2. أعلى الصفحة: الهيدر، البانر الترحيبي، البحث و«أضف مهنتك»، الشريط المتحرك</h3>
                <p>كل العناصر التي تظهر قبل «تصفح أقسام القرية» بترتيب ظهورها من أعلى لأسفل</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.top ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.top && (
              <div className="design-group-content">
                <InnerDivider title="لون خلفية الهيدر وشعاره" />
                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون خلفية الهيدر العلوي"
                    value={draft.headerBgColor}
                    swatches={QUICK_SWATCHES.headerBg}
                    onChange={(hex) => updateField("headerBgColor", hex)}
                  />
                </div>

                <div className="form-row design-two-col">
                  <ImageUploadField imageKey="header-logo" label="لوجو الهيدر (اختياري — رفع من الجهاز)" value={draft.headerLogoUrl} onChange={(url) => updateField("headerLogoUrl", url)} fallbackSrc="/images/logo-daleel-transparent.png"/>

                </div>

                <InnerDivider title="إظهار وإخفاء عناصر الهيدر" />
                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.headerSticky} onChange={(e) => updateField("headerSticky", e.target.checked)}/>تثبيت الهيدر أعلى الشاشة عند التمرير</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderBell} onChange={(e) => updateField("showHeaderBell", e.target.checked)}/>إظهار «إشعاراتي» في قائمة الهيدر للأعضاء (إشعارات شخصية لكل عضو؛ لا تظهر للزوار)</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderFavorites} onChange={(e) => updateField("showHeaderFavorites", e.target.checked)}/>إظهار زر المفضلة في الهيدر</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderDarkToggle} onChange={(e) => updateField("showHeaderDarkToggle", e.target.checked)}/>إظهار زر الوضع الليلي في الهيدر</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showHeaderLoginBtn} onChange={(e) => updateField("showHeaderLoginBtn", e.target.checked)}/>إظهار زر دخول الأعضاء في الهيدر</label>
                </div>

                <InnerDivider title="تصميم البانر الترحيبي ومربع البحث" />
                <ImageUploadField imageKey="hero-banner" label="صورة البانر الترحيبي أعلى الرئيسية (اختياري — رفع من الجهاز)" value={draft.heroBannerImage} onChange={(url) => updateField("heroBannerImage", url)} fallbackSrc="/images/home-banner-sky.png" wide/>
                <div className="form-row design-two-col">
                  <label className="field">
                    ارتفاع البانر الترحيبي
                    <SelectField value={draft.heroBannerHeight} onChange={(e) => updateField("heroBannerHeight", e.target.value as DesignSettings["heroBannerHeight"])}>
                      <option value="auto">النسبة الطبيعية للصورة (الافتراضي)</option>
                      <option value="small">صغير (150 بكسل ≈ 4 سم)</option>
                      <option value="medium">متوسط (220 بكسل ≈ 6 سم)</option>
                      <option value="large">كبير (320 بكسل ≈ 8.5 سم)</option>
                    </SelectField>
                  </label>
                  <label className="field">
                    طريقة ملء الصورة للإطار (عند الارتفاع الثابت)
                    <SelectField value={draft.heroBannerFit} onChange={(e) => updateField("heroBannerFit", e.target.value as DesignSettings["heroBannerFit"])}>
                      <option value="cover">قصّ الصورة لتملأ الإطار بالكامل (الافتراضي)</option>
                      <option value="contain">إظهار الصورة كاملة داخل الإطار</option>
                    </SelectField>
                  </label>
                </div>
                <label className="field">
                  درجة تعتيم طبقة فوق صورة البانر: <b>{draft.heroBannerOverlay}%</b>
                  <input type="range" min={0} max={80} step={10} value={draft.heroBannerOverlay} onChange={(e) => updateField("heroBannerOverlay", Number(e.target.value))} aria-label="درجة تعتيم البانر الترحيبي"/>
                  <small className="input-help">0 = الصورة كما هي. ارفع التعتيم لو هتعرض نصًا فوق الصورة أو كانت الصورة فاتحة جدًا.</small>
                </label>
                <label className="checkbox-field"><input type="checkbox" checked={draft.heroBannerText} onChange={(e) => updateField("heroBannerText", e.target.checked)}/>إظهار اسم الدليل والسطر الترحيبي بالأبيض فوق صورة البانر</label>
                <div className="form-row design-two-col">
                  <label className="field">
                    شكل البانر الترحيبي أعلى الرئيسية
                    <SelectField value={draft.heroStyle} onChange={(e) => updateField("heroStyle", e.target.value as DesignSettings["heroStyle"])}>
                      <option value="sky-banner">بانر سماء جنزور المصور (الافتراضي)</option>
                      <option value="gradient-card">خلفية متدرجة حديثة بدون صورة</option>
                      <option value="compact-minimal">بانر مدمج ومختصر للموبايل</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    شكل مربع البحث الرئيسي
                    <SelectField value={draft.searchBoxStyle} onChange={(e) => updateField("searchBoxStyle", e.target.value as DesignSettings["searchBoxStyle"])}>
                      <option value="rounded">زوايا ناعمة كلاسيكية (الافتراضي)</option>
                      <option value="pill">كبسولة دائرية بالكامل (Pill Search)</option>
                      <option value="floating-glass">زجاجي عائم بظل بارز</option>
                    </SelectField>
                  </label>
                </div>

                <div className="form-row design-two-col">
                  <label className="field">
                    طريقة ظهور البحث داخل صفحات الأقسام والتخصصات
                    <SelectField value={draft.categorySearchDefaultOpen ? "open" : "closed"} onChange={(e) => updateField("categorySearchDefaultOpen", e.target.value === "open")}>
                      <option value="closed">زر وأيقونة بحث في منتصف الشاشة يتحول لمربع بحث (الافتراضي)</option>
                      <option value="open">مربع البحث مفتوح تلقائياً عند دخول القسم</option>
                    </SelectField>
                  </label>

                </div>

                <InnerDivider title="زر البحث المتمركز" />
                <label className="field">
                  تصميم زر البحث المتمركز في الصفحة الرئيسية والأقسام
                  <SelectField value={draft.searchTriggerStyle} onChange={(e) => updateField("searchTriggerStyle", e.target.value as DesignSettings["searchTriggerStyle"])}>
                    <option value="pill-gradient">كبسولة زرقاء متدرجة بارزة (الافتراضي)</option>
                    <option value="glass-outline">إطار زجاجي مضيء وعصري</option>
                    <option value="gold-accent">كبسولة ملكية بإطار ذهبي</option>
                  </SelectField>
                </label>

                <InnerDivider title="نقشات وزخارف خلفية الهيدر والبانر الرئيسي (Subtle Patterns)" subtitle="أضف نقشة هندسية أو إسلامية أو نجوم خلف الهيدر والبانر الترحيبي" />
                <div className="form-row design-two-col">
                  <label className="field">
                    نقشة خلفية الهيدر العلوي (Header Pattern)
                    <SelectField value={draft.headerPattern} onChange={(e) => updateField("headerPattern", e.target.value as DesignSettings["headerPattern"])}>
                      <option value="none">بدون نقشة — خلفية سادة (الافتراضي)</option>
                      <option value="dots">نقاط هندسية ناعمة (Dots)</option>
                      <option value="grid">شبكة خطوط عصرية خفيفة (Grid)</option>
                      <option value="islamic">زخرفة عربية وإسلامية راقية (Islamic)</option>
                      <option value="waves">تموجات انسيابية هادئة (Waves)</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    نقشة خلفية البانر الترحيبي وهيدر النوافذ (Hero Pattern)
                    <SelectField value={draft.heroPattern} onChange={(e) => updateField("heroPattern", e.target.value as DesignSettings["heroPattern"])}>
                      <option value="none">بدون نقشة إضافية (الافتراضي)</option>
                      <option value="dots">نقاط هندسية ناعمة (Dots)</option>
                      <option value="grid">شبكة خطوط عصرية (Grid)</option>
                      <option value="islamic">زخرفة عربية وإسلامية (رمضان والأعياد)</option>
                      <option value="waves">تموجات انسيابية (Waves)</option>
                      <option value="stars">نجوم وهلال متلألئة (Stars)</option>
                    </SelectField>
                  </label>
                </div>

                <label className="field">
                  درجة وضوح وشفافية النقشة الخلفية
                  <SelectField value={draft.patternOpacity} onChange={(e) => updateField("patternOpacity", e.target.value as DesignSettings["patternOpacity"])}>
                    <option value="subtle">هادئة وخفيفة جداً (الافتراضي)</option>
                    <option value="medium">متوسطة وواضحة</option>
                    <option value="clear">بارزة وظاهرة بوضوح</option>
                  </SelectField>
                </label>

                <InnerDivider title="الشريط الإخباري المتحرك (أسفل البانر الترحيبي)" subtitle="أضف خبراً واحداً أو عدة أخبار وتنبيهات متتالية لأهل القرية مع تحكم في الحركة والسرعة" />
                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.announcementEnabled} onChange={(e) => updateField("announcementEnabled", e.target.checked)}/>تفعيل وإظهار الشريط الإخباري المتحرك أسفل البانر الترحيبي</label>
                </div>
                {draft.announcementEnabled && (
                  <>
                    <div className="form-row design-two-col">
                      <label className="field">
                        طريقة وحركة عرض الأخبار في الشريط العلوي
                        <SelectField value={draft.announcementTickerMode} onChange={(e) => updateField("announcementTickerMode", e.target.value as DesignSettings["announcementTickerMode"])}>
                          <option value="marquee">شريط إخباري متحرك مستمر من اليمين لليسار (الافتراضي)</option>
                          <option value="marquee-reverse">شريط إخباري متحرك عكسي من اليسار لليمين</option>
                          <option value="rotate">تبديل متقلب تلقائي ناعم بين الأخبار</option>
                          <option value="vertical-slide">انزلاق رأسي للأعلى بين الأخبار</option>
                          <option value="pulse-glow">نبض وتوهج ضوئي متغير للأخبار</option>
                          <option value="bounce">حركة ارتدادية حيوية عند تبديل الخبر</option>
                          <option value="single">خبر أو إعلان واحد ثابت بدون حركة</option>
                        </SelectField>
                      </label>

                      <label className="field">
                        سرعة حركة أو تبديل الشريط المتحرك (٩ سرعات متدرجة)
                        <SelectField value={draft.announcementSpeed} onChange={(e) => updateField("announcementSpeed", e.target.value as DesignSettings["announcementSpeed"])}>
                          <option value="ultra-slow">هادئة جداً جداً (٥٨ ثانية)</option>
                          <option value="very-slow">بطيئة جداً ومريحة (٤٥ ثانية)</option>
                          <option value="slow">هادئة ومريحة للقراءة (٣٤ ثانية)</option>
                          <option value="normal">متوسطة متوازنة (٢٤ ثانية - الافتراضي)</option>
                          <option value="medium-fast">متوسطة نشطة (١٨ ثانية)</option>
                          <option value="fast">سريعة ونشطة (١٤ ثانية)</option>
                          <option value="very-fast">سريعة جداً (١٠ ثوانٍ)</option>
                          <option value="turbo">تربو خاطفة (٧.٥ ثانية)</option>
                          <option value="flash">فلاش فائقة السرعة (٥.٥ ثانية)</option>
                        </SelectField>
                      </label>
                    </div>

                    <div className="form-row design-two-col">
                      <label className="field">
                        تصميم إطار الشريط العلوي
                        <SelectField value={draft.announcementStyle} onChange={(e) => updateField("announcementStyle", e.target.value as DesignSettings["announcementStyle"])}>
                          <option value="static">شريط كامل بعرض الصفحة (الافتراضي)</option>
                          <option value="badge">كبسولة أنيقة بحواف دائرية</option>
                          <option value="soft">شريط ناعم بإطار خفيف</option>
                        </SelectField>
                      </label>

                      <ColorPickerField
                        label="لون خلفية الشريط العلوي (الوضع الليلي)"
                        value={draft.announcementBgColor}
                        swatches={QUICK_SWATCHES.button}
                        onChange={(hex) => updateField("announcementBgColor", hex)}
                      />
                      <ColorPickerField
                        label="لون خلفية الشريط في الوضع النهاري (ثابت لكل الثيمات — لون النص يتحدد تلقائيًا أبيض أو داكن حسب اللون)"
                        value={draft.announcementBgColorLight}
                        swatches={["#0b4a93", "#0f3d5e", "#065f46", "#5b21b6", "#9f1239", "#ffd766", "#bfe3ff", "#e8f5e9"]}
                        onChange={(hex) => updateField("announcementBgColorLight", hex)}
                      />
                    </div>

                    {draft.announcementTickerMode === "single" ? (
                      <label className="field">
                        نص الإعلان أو الترحيب العلوي الثابت
                        <input
                          value={draft.announcementText}
                          onChange={(e) => updateField("announcementText", e.target.value)}
                          maxLength={240}
                          placeholder="اكتب نص الترحيب أو الإعلان..."
                        />
                      </label>
                    ) : (
                      <div className="field">
                        <span>قائمة الأخبار والتنبيهات المتعددة (اكتب كل خبر في سطر مستقل)</span>
                        <textarea
                          rows={4}
                          value={draft.announcementItems}
                          onChange={(e) => updateField("announcementItems", e.target.value)}
                          maxLength={1200}
                          placeholder={"أهلاً بكم في دليل جنزور — كل خدمات القرية في مكان واحد\nأضف مهنتك مجاناً وتواصل مع الأهالي مباشرة\nالصيدليات المناوبة وأرقام الطوارئ متاحة على مدار الساعة"}
                        />
                        <div className="suggestion-chips-wrap" style={{ marginTop: 6 }}>
                          <span className="suggestion-chips-label">إضافة خبر جاهز بضغطة واحدة:</span>
                          <div className="suggestion-chips-list">
                            {[
                              "🌙 صيدليات المناوبة الليلية وأرقام الطوارئ متاحة الآن بقسم المناوبات",
                              "🎓 تصفح قسم المدرسين واعثر على مدرس المادة اللي محتاجها بسهولة",
                              "🛵 استخدم فلتر «يوجد توصيل للمنازل» للوصول السريع للصيدليات والمحلات والمعامل",
                              "📢 أضف مهنتك أو نشاطك التجاري في دليل جنزور مجاناً وتواصل مع الأهالي مباشرة",
                            ].map((sample) => (
                              <button
                                key={sample}
                                type="button"
                                className="suggestion-chip"
                                onClick={() => {
                                  const existing = (draft.announcementItems || "").trim();
                                  if (existing.includes(sample)) return;
                                  updateField("announcementItems", existing ? `${existing}\n${sample}` : sample);
                                }}
                              >
                                + {sample.slice(0, 42)}...
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* 3. categories */}
      {(activeFilter === "all" || activeFilter === "categories") && (
        <>
          <SectionDivider step="٣" label="أقسام القرية والتخصصات" />
          <section className={`design-group-card ${collapsedGroups.categories ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("categories")} aria-expanded={!collapsedGroups.categories}>
              <span className="design-group-icon"><Grid2X2 size={20}/></span>
              <div className="design-group-title">
                <h3>3. أقسام القرية والتخصصات وهيكل الصفحة الرئيسية</h3>
                <p>شكل وحجم الأيقونات، عدد الكروت في الصف، أيقونات التخصصات، وترتيب أقسام الصفحة الرئيسية</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.categories ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.categories && (
              <div className="design-group-content">
                <InnerDivider title="ستايل وحجم وموضع الأيقونات" />
                <div className="form-row design-two-col">
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

                <div className="form-row design-two-col">
                  <label className="field">
                    موضع الأيقونة داخل كروت الأقسام
                    <SelectField value={draft.iconPosition} onChange={(e) => updateField("iconPosition", e.target.value as DesignSettings["iconPosition"])}>
                      <option value="top-center">فوق العنوان في المنتصف (الافتراضي)</option>
                      <option value="left">على الشمال بجانب العنوان</option>
                      <option value="right">على اليمين بجانب العنوان</option>
                    </SelectField>
                  </label>

                </div>

                <InnerDivider title="عدد الكروت في الصف على الموبايل والكمبيوتر" />
                <div className="form-row design-two-col">
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

                <InnerDivider title="ترتيب وإظهار أقسام الصفحة الرئيسية" subtitle="حرك أي قسم لأعلى أو لأسفل أو أخفِه بضغطة واحدة" />
                <div className="design-order-box">
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

                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showAdminQuickEdit} onChange={(e) => updateField("showAdminQuickEdit", e.target.checked)}/>إظهار زر «تعديل سريع كأدمن» على كروت الصفحة الرئيسية</label>
                </div>

                <InnerDivider title="أيقونات التخصصات والنجوم الأسبوعية" subtitle="اختر شكل أيقونات التخصصات فقط؛ أيقونات الأقسام الرئيسية لا تتأثر" />
                <div className="form-row design-two-col">
                  <label className="field">
                    شكل أيقونات التخصصات
                    <SelectField value={draft.specialtyIconStyle} onChange={(e) => updateField("specialtyIconStyle", e.target.value as DesignSettings["specialtyIconStyle"])}>
                      <option value="3d">مجسمة 3D (الملصقات والرسم المجسم) — الافتراضي</option>
                      <option value="flat">فلات كلاسيكية (الأيقونات المسطحة القديمة)</option>
                    </SelectField>
                    <small className="input-help">يسري على بلاطات التخصصات وبطاقات مقدمي الخدمة وصفحة التفاصيل. الأقسام الرئيسية تبقى كما هي.</small>
                  </label>
                </div>
                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.specialtyArt3d} onChange={(e) => updateField("specialtyArt3d", e.target.checked)}/>أيقونات مجسّمة بأسلوب «مرسوم باليد» لكل التخصصات في كل الأقسام (41 مهنة مرسومة يدويًا، والباقي يتولّد تلقائيًا بنفس الأسلوب بلون قسمه — وأي تخصص جديد يحصل على أيقونته فورًا)</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.specialtyStickerIcons} onChange={(e) => updateField("specialtyStickerIcons", e.target.checked)}/>أيقونات «الملصقات 3D» (ستايل صورة المرجع: مربع باستيل + رسمة كرتونية لامعة) — متوفرة لكل الأقسام الـ14 والتخصصات الـ73، وتظهر بدل الرسم اليدوي؛ وأي أيقونة ترفعها من شاشة تعديل التصنيف</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showWeeklyStars} onChange={(e) => updateField("showWeeklyStars", e.target.checked)}/>شارة «نجم الأسبوع ⭐» تلقائيًا لأفضل 3 مقدمي خدمة حسب تقييمات الأعضاء خلال آخر 7 أيام (متوسط 4 نجوم فأكثر)</label>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* 4. providers */}
      {(activeFilter === "all" || activeFilter === "providers") && (
        <>
          <SectionDivider step="٤" label="المميزون وكروت المهنيين" />
          <section className={`design-group-card ${collapsedGroups.providers ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("providers")} aria-expanded={!collapsedGroups.providers}>
              <span className="design-group-icon"><UsersRound size={20}/></span>
              <div className="design-group-title">
                <h3>4. قسم المميزين وكروت المهنيين وصفحة مقدم الخدمة</h3>
                <p>حالة قسم المميزين عند الفتح، الأدوات الدائرية على الكارت، تخطيط الكارت، وصفحة تفاصيل المهني</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.providers ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.providers && (
              <div className="design-group-content">
                <InnerDivider title="قسم «مقدمو الخدمات المميزين»" />
                  <label className="field">
                    حالة قسم «مقدمو الخدمات المميزين» عند فتح الموقع
                    <SelectField value={draft.featuredDefaultOpen ? "open" : "closed"} onChange={(e) => updateField("featuredDefaultOpen", e.target.value === "open")}>
                      <option value="closed">مطوي ويفتح عند الضغط على الزر (الافتراضي)</option>
                      <option value="open">مفتوح ومفرود تلقائياً عند فتح الصفحة</option>
                    </SelectField>
                  </label>

                <InnerDivider title="الأدوات الدائرية على كارت مقدم الخدمة" subtitle="دوائر شفافة تظهر عند المرور على الكارت: اتصال وواتساب مباشرة، مشاركة، والمفضلة. رتّبها أو أخفِها أو غيّر مكانها، ويظهر تلميح عربي بجانب كل دائرة." />
                <EdgeToolsEditor order={edgeToolOrder} visible={edgeToolsVisible} onChange={commitEdgeTools} />
                <div className="form-row design-two-col">
                  <label className="field">
                    مكان الدوائر على الكارت
                    <SelectField value={draft.providerEdgeToolsPosition} onChange={(e) => updateField("providerEdgeToolsPosition", e.target.value as DesignSettings["providerEdgeToolsPosition"])}>
                      <option value="left">على الحافة اليسرى (الافتراضي)</option>
                      <option value="right">على الحافة اليمنى</option>
                      <option value="bottom">صف أفقي أسفل الكارت</option>
                    </SelectField>
                  </label>
                </div>

                <InnerDivider title="تخصيص كروت المهنيين وصفحة مقدم الخدمة والبحث المتمركز" />
                <div className="form-row design-two-col">
                  <label className="field">
                    تخطيط كارت مقدم الخدمة (Provider Card)
                    <SelectField value={draft.providerCardLayout} onChange={(e) => updateField("providerCardLayout", e.target.value as DesignSettings["providerCardLayout"])}>
                      <option value="classic">كلاسيكي متوازن (الافتراضي)</option>
                      <option value="compact">مدمج ومختصر لشاشات الموبايل</option>
                      <option value="centered">متوسطن بالكامل (الأيقونة والاسم والنجوم في المنتصف)</option>
                    </SelectField>
                  </label>

                  <label className="field">
                    ستايل إطار كارت مقدم الخدمة من الخارج
                    <SelectField value={draft.outerCardStyle} onChange={(e) => updateField("outerCardStyle", e.target.value as DesignSettings["outerCardStyle"])}>
                      <option value="modern">كارت حديث بإطار واضح (الافتراضي)</option>
                      <option value="bordered">برواز ملون مزدوج وبارز</option>
                      <option value="soft-gradient">خلفية متدرجة ناعمة</option>
                    </SelectField>
                  </label>
                </div>

                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون المستطيل المميز لاسم المهني والنجوم (داخل صفحته)"
                    value={draft.detailNameBoxColor}
                    swatches={QUICK_SWATCHES.button}
                    onChange={(hex) => updateField("detailNameBoxColor", hex)}
                  />

                  <label className="field">
                    حالة أوسمة المهني تحت برواز الاسم (داخل صفحته)
                    <SelectField value={draft.badgesDefaultOpen ? "open" : "closed"} onChange={(e) => updateField("badgesDefaultOpen", e.target.value === "open")}>
                      <option value="closed">مطوية وتفتح بالسهم الصغير تحت الاسم (الافتراضي)</option>
                      <option value="open">مفرودة تلقائياً عند فتح صفحة المهني</option>
                    </SelectField>
                  </label>
                </div>


                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showProviderBadges} onChange={(e) => updateField("showProviderBadges", e.target.checked)}/>إظهار شارات التوثيق والتميز داخل صفحة المهني</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showProviderWhatsappBtn} onChange={(e) => updateField("showProviderWhatsappBtn", e.target.checked)}/>إظهار زر واتساب المباشر داخل صفحة المهني</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showProviderShareBtn} onChange={(e) => updateField("showProviderShareBtn", e.target.checked)}/>إظهار أيقونة المشاركة بجانب اسم المهني</label>
                </div>

                <InnerDivider title="شريط الاتصال السريع داخل الكارت" />
                  <label className="field">
                    ستايل شريط أزرار الاتصال السريع داخل كارت المهني
                    <SelectField value={draft.providerCallStripStyle} onChange={(e) => updateField("providerCallStripStyle", e.target.value as DesignSettings["providerCallStripStyle"])}>
                      <option value="sky">سماوي كلاسيكي هادئ (الافتراضي)</option>
                      <option value="emerald">أخضر زمردي بارز</option>
                      <option value="solid-blue">أزرق ملكي عالي التباين</option>
                    </SelectField>
                  </label>

                <InnerDivider title="معاينة حية لصفحة مقدم الخدمة" subtitle="نسخة ثابتة من نافذة التفاصيل (الهيرو الأبيض، صندوق الاسم، الشارات، البلاطات بأيقونة علوية، وأزرار الاتصال والواتساب) تتبع الثيم والألوان المختارة فورًا." />
                <DetailPreview />
              </div>
            )}
          </section>
        </>
      )}

      {/* 5. footer */}
      {(activeFilter === "all" || activeFilter === "footer") && (
        <>
          <SectionDivider step="٥" label="الفوتر أسفل الصفحة" />
          <section className={`design-group-card ${collapsedGroups.footer ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("footer")} aria-expanded={!collapsedGroups.footer}>
              <span className="design-group-icon"><Square size={20}/></span>
              <div className="design-group-title">
                <h3>5. الفوتر: اللون والنصوص والروابط والعناصر الظاهرة</h3>
                <p>كل ما يخص الجزء السفلي من الصفحة</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.footer ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.footer && (
              <div className="design-group-content">
                <InnerDivider title="لون خلفية الفوتر" />
                  <ColorPickerField
                    label="لون خلفية الفوتر السفلي"
                    value={draft.footerBgColor}
                    swatches={QUICK_SWATCHES.footerBg}
                    onChange={(hex) => updateField("footerBgColor", hex)}
                  />

                <InnerDivider title="تخصيص الفوتر وروابط القرية وإحصائيات الزوار" subtitle="عدّل نص وصف الفوتر وأضف رابط صفحة فيسبوك أو جروب واتساب القرية" />
                <label className="field">
                  نص الوصف أسفل اسم الموقع في الفوتر
                  <input
                    type="text"
                    value={draft.footerDescription}
                    onChange={(e) => updateField("footerDescription", e.target.value)}
                    placeholder="دليل المهن والخدمات.. من أهل القرية لأهلها"
                    maxLength={240}
                  />
                </label>

                <div className="form-row design-two-col">
                  <label className="field">
                    رابط صفحة أو جروب فيسبوك الرسمي للدليل (اختياري)
                    <input
                      type="url"
                      dir="ltr"
                      value={draft.footerFacebookUrl}
                      onChange={(e) => updateField("footerFacebookUrl", e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </label>

                  <label className="field">
                    رابط جروب أو قناة واتساب أهل جنزور (اختياري)
                    <input
                      type="url"
                      dir="ltr"
                      value={draft.footerWhatsappGroupUrl}
                      onChange={(e) => updateField("footerWhatsappGroupUrl", e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </label>
                </div>

                <InnerDivider title="إظهار وإخفاء عناصر الفوتر والزر العائم" />
                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showFooterWhatsapp} onChange={(e) => updateField("showFooterWhatsapp", e.target.checked)}/>إظهار زر واتساب الإدارة في الفوتر</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.showFooterStats} onChange={(e) => updateField("showFooterStats", e.target.checked)}/>إظهار عداد إحصائيات الدليل للزوار في الفوتر</label>
                  <label className="checkbox-field"><input type="checkbox" checked={draft.floatingWhatsappEnabled} onChange={(e) => updateField("floatingWhatsappEnabled", e.target.checked)}/>إظهار زر واتساب عائم سريع على الموبايل</label>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* 6. splash */}
      {(activeFilter === "all" || activeFilter === "splash") && (
        <>
          <SectionDivider step="٦" label="شاشة البداية والدخول والعضوية" />
          <section className={`design-group-card ${collapsedGroups.splash ? "is-collapsed" : ""}`}>
            <button type="button" className="design-group-head" onClick={() => toggleGroup("splash")} aria-expanded={!collapsedGroups.splash}>
              <span className="design-group-icon"><LockKeyhole size={20}/></span>
              <div className="design-group-title">
                <h3>6. شاشة البداية (Splash) وشاشات تسجيل الدخول والعضوية</h3>
                <p>الشاشة التي تظهر عند فتح التطبيق، ثم صفحتا الدخول والتسجيل</p>
              </div>
              <ChevronDown size={18} className={`design-group-chevron ${collapsedGroups.splash ? "is-collapsed" : ""}`}/>
            </button>

            {!collapsedGroups.splash && (
              <div className="design-group-content">
                <InnerDivider title="شاشة البداية (Splash Screen)" />
                <div className="design-toggles-grid">
                  <label className="checkbox-field"><input type="checkbox" checked={draft.splashEnabled} onChange={(e) => updateField("splashEnabled", e.target.checked)}/>تفعيل شاشة البداية الترحيبية</label>
                </div>
                <div className="form-row design-two-col">
                  <label className="field">
                    مدة ظهور شاشة البداية (Splash Screen)
                    <SelectField value={draft.splashDuration} onChange={(e) => updateField("splashDuration", e.target.value as DesignSettings["splashDuration"])}>
                      <option value="900">سريعة (0.9 ثانية - الافتراضي)</option>
                      <option value="1500">متوسطة (1.5 ثانية)</option>
                      <option value="2500">طويلة (2.5 ثانية)</option>
                    </SelectField>
                  </label>
                  <ImageUploadField imageKey="splash" label="صورة شاشة البداية (رفع من الجهاز)" value={draft.splashImageUrl === defaultDesignSettings.splashImageUrl ? "" : draft.splashImageUrl} onChange={(url) => updateField("splashImageUrl", url || defaultDesignSettings.splashImageUrl)} fallbackSrc={defaultDesignSettings.splashImageUrl}/>
                </div>
                <div className="form-row design-two-col">
                  <label className="field">
                    لمن تظهر شاشة البداية؟
                    <SelectField value={draft.splashAudience} onChange={(e) => updateField("splashAudience", e.target.value as DesignSettings["splashAudience"])}>
                      <option value="installed">التطبيق المثبّت على الهاتف فقط — مع كل فتح (الافتراضي)</option>
                      <option value="all">كل الزوار — مرة واحدة في الجلسة (المتصفح والتطبيق)</option>
                    </SelectField>
                    <small className="input-help">زوار المتصفح العاديون لا يرونها في الوضع الافتراضي؛ استخدم زر المعاينة لتراها الآن.</small>
                  </label>
                  <div className="field">
                    معاينة فورية
                    <button type="button" className="button button-soft" onClick={() => { localStorage.setItem("janzour-splash-audience", draft.splashEnabled ? draft.splashAudience : "off"); document.documentElement.setAttribute("data-design-splash-stickers", draft.splashStickers ? "true" : "false"); document.documentElement.setAttribute("data-design-splash-image", draft.splashImageUrl || "/images/logo-daleel-transparent.png"); document.documentElement.setAttribute("data-design-splash-duration", draft.splashDuration); window.dispatchEvent(new CustomEvent(SPLASH_PREVIEW_EVENT)); }}>
                      <Sparkles size={16}/> معاينة شاشة البداية
                    </button>
                    <small className="input-help">تعرض الشاشة بالإعدادات الحالية (قبل الحفظ) لمدة ثانية ونصف على الأقل.</small>
                  </div>
                </div>
                <label className="checkbox-field"><input type="checkbox" checked={draft.splashStickers} onChange={(e) => updateField("splashStickers", e.target.checked)}/>ملصقات الأقسام 3D تتجمع حول الشعار في شاشة البداية</label>

                <InnerDivider title="عناوين ونصوص شاشة تسجيل الدخول والعضوية" />
                <div className="form-row design-two-col">
                  <label className="field">
                    عنوان شاشة تسجيل الدخول
                    <input value={draft.loginTitle} onChange={(e) => updateField("loginTitle", e.target.value)} maxLength={120}/>
                  </label>
                  <label className="field">
                    وصف شاشة تسجيل الدخول
                    <input value={draft.loginSubtitle} onChange={(e) => updateField("loginSubtitle", e.target.value)} maxLength={180}/>
                  </label>
                </div>

                <div className="form-row design-two-col">
                  <label className="field">
                    عنوان شاشة إنشاء العضوية
                    <input value={draft.registerTitle} onChange={(e) => updateField("registerTitle", e.target.value)} maxLength={120}/>
                  </label>
                  <label className="field">
                    وصف شاشة إنشاء العضوية
                    <input value={draft.registerSubtitle} onChange={(e) => updateField("registerSubtitle", e.target.value)} maxLength={180}/>
                  </label>
                </div>

                <InnerDivider title="صورة البانر وترتيب ولون الخانات" />
                <div className="form-row design-two-col">
                  <ImageUploadField imageKey="auth-banner" label="بانر الدخول والعضوية (اختياري — رفع من الجهاز)" value={draft.authBannerImage} onChange={(url) => updateField("authBannerImage", url)} wide/>

                  <label className="field">
                    ترتيب خانات تسجيل العضوية
                    <SelectField value={draft.authFieldsLayout} onChange={(e) => updateField("authFieldsLayout", e.target.value as DesignSettings["authFieldsLayout"])}>
                      <option value="two-col">خانتين جنب بعض (مدمج ومختصر - الافتراضي)</option>
                      <option value="one-col">خانة واحدة في كل سطر تحت بعض</option>
                    </SelectField>
                  </label>
                </div>

                <div className="form-row design-two-col">
                  <ColorPickerField
                    label="لون بوردر خانات الإدخال (Textboxes)"
                    value={draft.authInputBorderColor}
                    swatches={QUICK_SWATCHES.border}
                    onChange={(hex) => updateField("authInputBorderColor", hex)}
                  />

                  <div className="field" style={{ justifyContent: "flex-end" }}>
                    <label className="checkbox-field" style={{ minHeight: 44 }}>
                      <input type="checkbox" checked={draft.authShowBanner} onChange={(e) => updateField("authShowBanner", e.target.checked)}/>
                      إظهار البانر الترحيبي العلوي في شاشات الدخول والعضوية
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}


      {/* Sticky / Floating Bottom Save Bar for Mobile & Desktop */}
      <div className="design-mobile-sticky-bar">
        <button type="button" className="button button-soft button-small" onClick={resetAll}>
          <RotateCcw size={15}/>
          <span>افتراضي</span>
        </button>
        <button type="submit" className="button button-primary design-sticky-save-btn" disabled={saving}>
          {saving ? <LoaderCircle size={17} className="spin"/> : <Check size={17}/>}
          <span>حفظ وتطبيق المظهر على الموقع</span>
        </button>
      </div>
    </form>
  );
}

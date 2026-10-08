"use client";

import { useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { adBackgroundOptions, adIconOptions, adMotionOptions, getAdMotion, getContrastTextColor, isAdImageUrl, type AdMotion } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui";
import AdSlide from "@/components/ad-slide";

type AdDesignEditorProps = {
  businessName: string;
  text: string;
  defaultIndex: number;
  initialBackgroundColor: string;
  initialIcon: string;
  initialTextSize: number;
  initialHighlightWord: string;
  initialMotion: string;
  initialImageUrl: string;
};

export default function AdDesignEditor({ businessName, text, defaultIndex, initialBackgroundColor, initialIcon, initialTextSize, initialHighlightWord, initialMotion, initialImageUrl }: AdDesignEditorProps) {
  const paletteIndex = Math.abs(defaultIndex) % adBackgroundOptions.length;
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor || adBackgroundOptions[paletteIndex].color);
  const [icon, setIcon] = useState(initialIcon || adIconOptions[paletteIndex % adIconOptions.length].icon);
  const [textSize, setTextSize] = useState(Math.min(30, Math.max(14, initialTextSize || 17)));
  const [highlightWord, setHighlightWord] = useState(initialHighlightWord);
  const [motion, setMotion] = useState<AdMotion>(getAdMotion(initialMotion));
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [previewPaused, setPreviewPaused] = useState(false);
  const validImage = isAdImageUrl(imageUrl.trim());
  const previewText = text || "اكتب نص الإعلان ليظهر هنا في المعاينة.";
  const previewStyle = {
    "--ad-background": backgroundColor,
    "--ad-foreground": getContrastTextColor(backgroundColor),
    "--ad-copy-size": `${textSize}px`,
  } as CSSProperties;

  return <section className="ad-design-editor" aria-labelledby="ad-design-heading">
    <div className="ad-design-editor-heading">
      <div><h3 id="ad-design-heading">تصميم الإعلان</h3><p>إعلان ثابت أو متحرك بنفس مساحة الكاروسيل، مع صورة أو أيقونة مناسبة.</p></div>
      <span className="ad-design-live-label">معاينة مباشرة</span>
    </div>
    <div className="ad-design-editor-layout">
      <div className="ad-design-controls">
        <label className="field">نوع الإعلان وحركته
          <select name="motion" value={motion} onChange={(event) => setMotion(event.target.value as AdMotion)}>
            {adMotionOptions.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
          <small className="input-help">الاسم والنص يظهران بالتتابع ثم يخرجان، وزر التواصل يظل ثابتًا.</small>
        </label>
        <fieldset className="ad-design-fieldset">
          <legend>لون خلفية الإعلان</legend>
          <div className="ad-background-choices" role="group" aria-label="ألوان الخلفية المقترحة">
            {adBackgroundOptions.map(({ color: optionColor, label }) => <button key={optionColor} type="button" className={`ad-background-swatch ${backgroundColor === optionColor ? "is-selected" : ""}`} style={{ backgroundColor: optionColor }} aria-label={label} title={label} aria-pressed={backgroundColor === optionColor} onClick={() => setBackgroundColor(optionColor)}/>) }
          </div>
          <label className="ad-custom-color"><span>أو اختار لونًا مخصصًا</span><input type="color" value={backgroundColor} aria-label="لون خلفية مخصص" onChange={(event) => setBackgroundColor(event.target.value)}/><output dir="ltr">{backgroundColor}</output></label>
          <input type="hidden" name="backgroundColor" value={backgroundColor}/>
        </fieldset>
        <fieldset className="ad-design-fieldset">
          <legend>أيقونة كبيرة مجسمة</legend>
          <div className="ad-icon-choices" role="group" aria-label="اختيار أيقونة الإعلان">
            {adIconOptions.map((option) => <button key={option.icon} type="button" className={`ad-icon-choice ${icon === option.icon ? "is-selected" : ""}`} aria-label={option.label} aria-pressed={icon === option.icon} onClick={() => setIcon(option.icon)}><CategoryIcon icon={option.icon} size={22}/><span>{option.label}</span></button>)}
          </div>
          <input type="hidden" name="icon" value={icon}/>
        </fieldset>
        <label className="field">صورة الإعلان (اختياري)
          <input name="imageUrl" dir="ltr" inputMode="url" value={imageUrl} maxLength={1000} placeholder="https://example.com/product.png" onChange={(event) => setImageUrl(event.target.value)} aria-invalid={!validImage} aria-describedby="ad-image-help"/>
          <small className="input-help" id="ad-image-help">{validImage ? "رابط https لصورة منتج أو صورة مجسمة بخلفية شفافة، أو مسار صورة داخل الموقع. بدون صورة تظهر الأيقونة المختارة." : "استخدم رابطًا يبدأ بـ https:// أو مسارًا داخل الموقع مثل /images/product.png."}</small>
        </label>
        <label className="field ad-font-size-field">حجم نص الإعلان
          <span className="ad-font-size-control"><input name="textSize" type="range" min={14} max={30} step={1} value={textSize} onChange={(event) => setTextSize(Number(event.target.value))} aria-label="حجم نص الإعلان"/><output>{textSize}px</output></span>
          <small className="input-help">حرّك المؤشر لتصغير النص أو تكبيره.</small>
        </label>
        <label className="field ad-highlight-field">الكلمة التي تريد تكبيرها
          <input name="highlightWord" value={highlightWord} onChange={(event) => setHighlightWord(event.target.value)} maxLength={60} placeholder="اكتب كلمة موجودة في نص الإعلان" aria-describedby="ad-highlight-help"/>
          <small className="input-help" id="ad-highlight-help">اكتب الكلمة كما هي في نص الإعلان؛ ستظهر أكبر وبخط أوضح.</small>
        </label>
      </div>
      <div className="ad-design-preview-wrap">
        <AdSlide key={motion} ad={{ businessName: businessName || "اسم النشاط", text: previewText, phone: "", highlightWord, motion, imageUrl: validImage ? imageUrl.trim() : "" }} icon={icon} style={previewStyle} label="معاينة تصميم الإعلان" paused={previewPaused} preview/>
        {motion !== "static" && <button type="button" className="ad-preview-toggle" onClick={() => setPreviewPaused((value) => !value)} aria-pressed={previewPaused}>{previewPaused ? <Play size={14}/> : <Pause size={14}/>} {previewPaused ? "تشغيل المعاينة" : "إيقاف المعاينة"}</button>}
        <p className="ad-design-preview-note">نفس الحركة تظهر في الموقع، حتى لو عندك إعلان واحد. إعدادات تقليل الحركة في الجهاز تُحترم تلقائيًا.</p>
      </div>
    </div>
  </section>;
}

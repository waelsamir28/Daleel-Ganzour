"use client";

import { useState, type CSSProperties } from "react";
import { adBackgroundOptions, adIconOptions, getContrastTextColor } from "@/lib/catalog";
import { CategoryIcon, HighlightedAdText } from "@/components/ui";

type AdDesignEditorProps = {
  businessName: string;
  text: string;
  defaultIndex: number;
  initialBackgroundColor: string;
  initialIcon: string;
  initialTextSize: number;
  initialHighlightWord: string;
};

export default function AdDesignEditor({ businessName, text, defaultIndex, initialBackgroundColor, initialIcon, initialTextSize, initialHighlightWord }: AdDesignEditorProps) {
  const paletteIndex = Math.abs(defaultIndex) % adBackgroundOptions.length;
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor || adBackgroundOptions[paletteIndex].color);
  const [icon, setIcon] = useState(initialIcon || adIconOptions[paletteIndex % adIconOptions.length].icon);
  const [textSize, setTextSize] = useState(Math.min(30, Math.max(14, initialTextSize || 17)));
  const [highlightWord, setHighlightWord] = useState(initialHighlightWord);
  const previewText = text || "اكتب نص الإعلان ليظهر هنا في المعاينة.";
  const previewStyle = {
    "--ad-background": backgroundColor,
    "--ad-foreground": getContrastTextColor(backgroundColor),
    "--ad-copy-size": `${textSize}px`,
  } as CSSProperties;

  return <section className="ad-design-editor" aria-labelledby="ad-design-heading">
    <div className="ad-design-editor-heading">
      <div><h3 id="ad-design-heading">تصميم الإعلان</h3><p>اختار خلفية وأيقونة، وشوف شكل الإعلان قبل الحفظ.</p></div>
      <span className="ad-design-live-label">معاينة مباشرة</span>
    </div>
    <div className="ad-design-editor-layout">
      <div className="ad-design-controls">
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
        <article className="ad-slide ad-design-preview-card" style={previewStyle} aria-label="معاينة تصميم الإعلان">
          <div className="ad-slide-copy">
            <span className="ad-slide-approved">إعلان معتمد</span>
            <h3>{businessName || "اسم النشاط"}</h3>
            <p><HighlightedAdText text={previewText} word={highlightWord}/></p>
            <span className="ad-slide-contact">تواصل عبر واتساب</span>
          </div>
          <div className="ad-slide-art" aria-hidden="true"><span><CategoryIcon icon={icon} size={58}/></span><small>نشاط من جنزور</small></div>
        </article>
        <p className="ad-design-preview-note">الخلفية والأيقونة وحجم النص يظهرون لكل إعلان بشكل مستقل.</p>
      </div>
    </div>
  </section>;
}

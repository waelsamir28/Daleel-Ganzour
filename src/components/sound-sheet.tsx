"use client";

import { Check, Volume2, VolumeX, X } from "lucide-react";

/**
 * شاشة الصوت العائمة:
 * بتربط من داخل قائمة الهيدر، وبها اختيارين واضحين — تفعيل الصوت / كتم الصوت.
 * بمجرد ما الزائر يختار، الشاشة بتقفل لوحدها وبيرجع للصفحة.
 */
export default function SoundSheet({ open, muted, onPick, onClose }: { open: boolean; muted: boolean; onPick: (muted: boolean) => void; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="sound-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-sheet-title"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="sound-sheet">
        <div className="sound-sheet-head">
          <span className="sound-sheet-badge" aria-hidden="true"><Volume2 size={18}/></span>
          <strong id="sound-sheet-title">صوت التطبيق</strong>
          <button type="button" className="sound-sheet-close" onClick={onClose} aria-label="إغلاق شاشة الصوت"><X size={17}/></button>
        </div>
        <p className="sound-sheet-hint">اختار الصوت يكون شغال مع ضغطات الأزرار، ولا يكون مكتوم خالص.</p>
        <div className="sound-sheet-options" role="group" aria-label="اختيار حالة الصوت">
          <button
            type="button"
            className={`sound-option ${muted ? "" : "is-active"}`}
            aria-pressed={!muted}
            onClick={() => { onPick(false); onClose(); }}
          >
            <span className="sound-option-icon"><Volume2 size={26}/></span>
            <span className="sound-option-label">تفعيل الصوت</span>
            <span className="sound-option-mark">{muted ? "" : <><Check size={13}/> شغال</>}</span>
          </button>
          <button
            type="button"
            className={`sound-option is-mute ${muted ? "is-active" : ""}`}
            aria-pressed={muted}
            onClick={() => { onPick(true); onClose(); }}
          >
            <span className="sound-option-icon"><VolumeX size={26}/></span>
            <span className="sound-option-label">كتم الصوت</span>
            <span className="sound-option-mark">{muted ? <><Check size={13}/> مكتوم</> : ""}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Sparkles, X } from "lucide-react";
import type { WelcomeMessage } from "@/lib/welcome-messages";

/**
 * الشاشة العائمة للرسائل الترحيبية:
 * تظهر فوق الصفحة ككارت أنيق (معاينة + خلفية معتمة)، وتقفل بزرار أو بالضغط برّه،
 * وبتحترم قارئ الشاشة (role=dialog + تركيز أولي + Escape).
 */
export default function WelcomeModal({ message, onClose }: { message: WelcomeMessage; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- الإغلاق ثابت طوال عمر الرسالة.
  }, []);

  function close() {
    setClosing(true);
    window.setTimeout(onClose, 160);
  }

  return (
    <div className={`welcome-overlay ${closing ? "is-closing" : ""}`} onClick={close}>
      <div
        ref={panelRef}
        className={`welcome-card is-${message.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-body"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="welcome-close" onClick={close} aria-label="إغلاق الرسالة"><X size={16}/></button>

        <span className="welcome-emoji" aria-hidden="true">{message.emoji}</span>
        <span className="welcome-eyebrow"><Sparkles size={13}/> دليل جنزور</span>
        <h2 id="welcome-title">{message.title}</h2>
        <p id="welcome-body">{message.body}</p>

        {message.bullets.length > 0 && (
          <ul className="welcome-bullets">
            {message.bullets.map((line) => <li key={line}><Check size={14}/> {line}</li>)}
          </ul>
        )}

        <div className="welcome-actions">
          {message.primary && <a className="welcome-primary" href={message.primary.href}>{message.primary.label} <ArrowLeft size={15}/></a>}
          {message.secondary && <a className="welcome-secondary" href={message.secondary.href}>{message.secondary.label}</a>}
          <button type="button" className="welcome-dismiss" onClick={close}>تم</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export type AdminSheetItem = { id: string; label: string; icon: ReactNode; tone?: "default" | "success" | "danger" | "amber"; onSelect: () => void };

// Bottom-sheet action list used only on phones/tablets in the admin panel (CSS: admin-mobile.css).
// Desktop keeps the inline buttons, so this component is never shown there.
export default function AdminActionSheet({ title, subtitle, items, onClose }: { title: string; subtitle?: string; items: AdminSheetItem[]; onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    // Escape closes; Tab stays inside the sheet (focus is cycled between its buttons).
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onCloseRef.current(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const inside = panel.current.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (!inside || document.activeElement === last)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus?.();
    };
  }, []);
  return <div className="admin-sheet-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}>
      <div className="admin-sheet-heading">
        <div><span>إجراءات</span><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="icon-button admin-sheet-close" onClick={onClose} aria-label="إغلاق القائمة"><X size={20}/></button>
      </div>
      <div className="admin-sheet-actions">
        {items.map((item) => <button key={item.id} type="button" className={`admin-sheet-action ${item.tone && item.tone !== "default" ? `is-${item.tone}` : ""}`} onClick={() => { onClose(); item.onSelect(); }}><span className="admin-sheet-action-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
      </div>
    </div>
  </div>;
}

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

export default function SearchDropdown({ name, value, options, onChange, icon, disabled = false }: {
  name: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    (root.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]')
      ?? root.current?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => (root.current?.querySelector<HTMLButtonElement>(`[role="option"][aria-selected="true"]`)
        ?? root.current?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus());
      return;
    }
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return <div className={`search-select-wrap${open ? " is-open" : ""}`} ref={root} onKeyDown={moveFocus}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <span className="search-select-icon" aria-hidden="true">{icon}</span>
    <button type="button" ref={trigger} className="search-select-trigger" role="combobox" aria-label={name}
      aria-haspopup="listbox" aria-controls={id} aria-expanded={open} disabled={disabled}
      onClick={() => setOpen((previous) => !previous)}>{selected?.label ?? options[0]?.label}</button>
    <ChevronDown className="search-select-chevron" size={15} aria-hidden="true"/>
    {open && <div className="search-select-menu" id={id} role="listbox" aria-label={name}>
      {options.map((option) => <button type="button" role="option" tabIndex={-1} aria-selected={option.value === value} key={option.value}
        onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}>{option.label}</button>)}
    </div>}
  </div>;
}

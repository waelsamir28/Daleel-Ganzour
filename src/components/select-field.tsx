"use client";

import { Children, isValidElement, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// One dropdown for the whole app. It replaces the native <select> (whose list cannot be animated or styled)
// and keeps form behaviour: the hidden input carries `name` and `required`, so FormData and native validation still work.

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectChangeEvent = { target: { value: string; name: string } };

type Phase = "closed" | "open" | "closing";
type Placement = { top?: number; bottom?: number; left: number; width: number; maxHeight: number; up: boolean };

const CLOSE_MS = 160;

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("");
}

// Accepts native-style <option> children, so existing markup can switch from <select> without rewriting the options.
function optionsFromChildren(children: ReactNode): SelectOption[] {
  const items: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child) || child.type !== "option") return;
    const label = textOf(child.props.children);
    items.push({
      value: child.props.value !== undefined ? String(child.props.value) : label,
      label,
      disabled: Boolean(child.props.disabled),
    });
  });
  return items;
}

// The list is portalled to <body> with fixed positioning, so modals and scroll containers never clip it.
function placeMenu(rect: DOMRect): Placement {
  const gap = 8;
  const edge = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(Math.max(rect.width, 200), vw - edge * 2);
  const left = Math.min(Math.max(rect.right - width, edge), vw - width - edge); // RTL: align to the trigger's start edge
  const below = vh - rect.bottom - gap - edge;
  const above = rect.top - gap - edge;
  const up = below < 220 && above > below;
  const maxHeight = Math.max(120, Math.min(320, up ? above : below));
  return up
    ? { bottom: vh - rect.top + gap, left, width, maxHeight, up }
    : { top: rect.bottom + gap, left, width, maxHeight, up };
}

function optionNodes(menuNode: HTMLDivElement | null) {
  return Array.from(menuNode?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? []);
}

export default function SelectField({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  options,
  children,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  icon,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: SelectChangeEvent) => void;
  options?: SelectOption[];
  children?: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  "aria-label"?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [internal, setInternal] = useState(defaultValue);
  const [phase, setPhase] = useState<Phase>("closed");
  const [place, setPlace] = useState<Placement | null>(null);
  const [parentLabel, setParentLabel] = useState("");

  // Native <select> takes its accessible name from a wrapping <label>; a button with role "combobox" does not.
  // So when no aria-label is given, reuse the wrapping label's own text.
  useEffect(() => {
    if (ariaLabel || !root.current) return;
    const label = root.current.closest("label");
    if (!label) return;
    const text = Array.from(label.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) setParentLabel(text);
  }, [ariaLabel]);

  const items = options ?? optionsFromChildren(children);
  const current = value ?? internal;
  const selected = items.find((item) => item.value === current);
  // Mirrors native behaviour: when the value matches no option, the first option is shown.
  const active = selected ? current : (items[0]?.value ?? "");
  const shownLabel = selected?.label ?? items[0]?.label ?? placeholder;
  const isOpen = phase === "open";
  const isShown = phase !== "closed";

  // Anchor to the whole field box (not the inner text button), so the list lines up with the visible border.
  const openMenu = useCallback(() => {
    if (disabled || !root.current) return;
    setPlace(placeMenu(root.current.getBoundingClientRect()));
    setPhase("open");
  }, [disabled]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setPhase((previous) => (previous === "open" ? "closing" : previous));
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  // Keep the list mounted for the exit animation, then unmount it.
  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("closed"), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Move focus to the selected option when the list opens, so the keyboard works immediately.
  useEffect(() => {
    if (!isOpen) return;
    const first = menu.current?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?? menu.current?.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])');
    first?.focus({ preventScroll: true });
    first?.scrollIntoView({ block: "nearest" });
  }, [isOpen]);

  // Re-anchor on scroll and resize, close when the trigger leaves the screen, and close on outside pointer press.
  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => {
      const node = root.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        closeMenu();
        return;
      }
      setPlace(placeMenu(rect));
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (root.current?.contains(target) || menu.current?.contains(target)) return;
      closeMenu();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [isOpen, closeMenu]);

  function commit(next: string) {
    if (next !== active) {
      if (value === undefined) setInternal(next);
      onChange?.({ target: { value: next, name: name ?? "" } });
    }
    closeMenu(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const key = event.key;
    if (!isOpen) {
      if ((key === "ArrowDown" || key === "ArrowUp") && event.target === trigger.current) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (key === "Escape") {
      // Close only the list: stop the key from also closing a surrounding modal.
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (key === "Tab") {
      // Return focus to the trigger; the browser's own Tab then moves on to the next field.
      closeMenu(true);
      return;
    }
    const inMenu = menu.current?.contains(event.target as Node) ?? false;
    const nodes = optionNodes(menu.current);
    if (!nodes.length) return;
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    if (key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End") {
      event.preventDefault();
      const next = key === "Home" ? 0
        : key === "End" ? nodes.length - 1
          : (index + (key === "ArrowUp" ? -1 : 1) + nodes.length) % nodes.length;
      nodes[next]?.focus({ preventScroll: true });
      nodes[next]?.scrollIntoView({ block: "nearest" });
      return;
    }
    if ((key === "Enter" || key === " ") && inMenu) {
      event.preventDefault();
      (event.target as HTMLElement).click();
      return;
    }
    if (inMenu && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Type-ahead: typing letters jumps to the next option that starts with them.
      const now = Date.now();
      const text = (now - typed.current.at > 700 ? "" : typed.current.text) + key.toLowerCase();
      typed.current = { text, at: now };
      const start = index + 1;
      const ordered = [...nodes.slice(start), ...nodes.slice(0, start)];
      ordered.find((node) => (node.textContent ?? "").trim().toLowerCase().startsWith(text))?.focus({ preventScroll: true });
    }
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && (root.current?.contains(next) || menu.current?.contains(next))) return;
    if (isOpen) closeMenu();
  }

  const menuNode = isShown && place
    ? createPortal(
      <div
        ref={menu}
        id={listId}
        role="listbox"
        aria-label={ariaLabel ?? (parentLabel || undefined)}
        tabIndex={-1}
        className={`ui-select-menu${place.up ? " is-up" : ""}${phase === "closing" ? " is-leaving" : ""}`}
        style={{ top: place.top, bottom: place.bottom, left: place.left, width: place.width, maxHeight: place.maxHeight }}
      >
        {items.map((item, index) => {
          const chosen = item.value === active;
          return (
            <div
              key={`${index}-${item.value}`}
              role="option"
              data-value={item.value}
              tabIndex={-1}
              aria-selected={chosen}
              aria-disabled={item.disabled || undefined}
              className={`ui-select-option${chosen ? " is-selected" : ""}${item.disabled ? " is-disabled" : ""}`}
              style={{ "--i": index } as CSSProperties}
              onClick={() => { if (!item.disabled) commit(item.value); }}
            >
              <span>{item.label}</span>
              <Check size={15} strokeWidth={2.6} className="ui-select-check" aria-hidden="true" />
            </div>
          );
        })}
        {!items.length && <div className="ui-select-empty">لا توجد خيارات</div>}
      </div>,
      document.body,
    )
    : null;

  return (
    <div
      ref={root}
      className={`ui-select${className ? ` ${className}` : ""}${isShown ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {icon && <span className="ui-select-icon" aria-hidden="true">{icon}</span>}
      <input
        className="ui-select-shim"
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={active}
        onChange={() => undefined}
        onFocus={() => trigger.current?.focus()}
        required={required}
        disabled={disabled}
      />
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        className="ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isShown ? listId : undefined}
        aria-label={ariaLabel ?? (parentLabel || undefined)}
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu(true) : openMenu())}
      >
        <span className="ui-select-value">{shownLabel}</span>
      </button>
      <ChevronDown className="ui-select-chevron" size={16} strokeWidth={2.4} aria-hidden="true" />
      {menuNode}
    </div>
  );
}

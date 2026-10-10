"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, Anvil, Armchair, Baby, Bone, BookOpen, BrickWall, Calculator, Cctv, Cog, Droplets, Ellipsis, Eye, FlaskConical, Globe, GraduationCap, Grid2X2, Hammer, HandHeart, Heart, HeartPulse, Languages, Paintbrush, PanelsTopLeft, Pill, Scale, Shirt, ShoppingBasket, Smartphone, Smile, Snowflake, Sparkles, Stethoscope, Store, Sun, Truck, Tv, UsersRound, Utensils, Wrench, X, Zap, type LucideIcon } from "lucide-react";
import { defaultSettings, getCategory, type CategoryRecord } from "@/lib/catalog";

// Exactly the icons the catalogue offers (see iconNames), so no unreachable component is bundled.
const categoryIcons: Record<string, LucideIcon> = { Wrench, Stethoscope, Store, GraduationCap, HandHeart, Grid2X2, Hammer, Droplets, Zap, Anvil, Paintbrush, BrickWall, PanelsTopLeft, Snowflake, Cog, Armchair, Baby, Smile, HeartPulse, Bone, Sparkles, Eye, Activity, ShoppingBasket, Pill, Shirt, BookOpen, Tv, Utensils, Smartphone, Languages, Calculator, FlaskConical, Globe, Heart, UsersRound, Scale, Truck, Cctv, Sun, Ellipsis };
export function CategoryIcon({ category = "", icon, size = 32, className = "" }: { category?: string; icon?: string; size?: number; className?: string }) {
  const Icon = categoryIcons[icon ?? getCategory(category).icon] ?? Wrench;
  return <Icon size={size} strokeWidth={2.3} className={className} aria-hidden="true"/>;
}
const dimensionalCategoryIcons: Record<string, string> = { Wrench: "crafts", Stethoscope: "clinics", FlaskConical: "labs", Store: "shops", GraduationCap: "teachers", HandHeart: "charities", Grid2X2: "other" };
export function MainCategoryIcon({ icon }: { icon: string }) {
  return <svg className="main-category-art" viewBox="0 0 128 128" aria-hidden="true"><use href={`/images/category-3d.svg#${dimensionalCategoryIcons[icon] ?? "other"}`}/></svg>;
}
export function Logo({ compact = false, footer = false, name = defaultSettings.siteName }: { compact?: boolean; footer?: boolean; name?: string; description?: string }) {
  return <Link href="/" className={`brand brand-logo-only ${footer ? "brand-light" : ""} ${compact ? "brand-compact" : ""}`} aria-label={`${name} - الرئيسية`}>
    <Image className="brand-symbol" src="/images/logo-daleel-transparent.png" alt="" width={800} height={800} sizes="58px"/>
  </Link>;
}
export function ServiceArt({ category, item }: { category: string; item?: CategoryRecord }) {
  const info = item ?? getCategory(category);
  if (category === "ac") return <div className={"service-art ac-art"}><svg viewBox="0 0 110 100" aria-hidden="true"><ellipse cx="57" cy="85" rx="37" ry="6" fill="#109be7" opacity=".12"/><path d="m15 26 76-5 7 7v42L22 74l-7-7Z" fill="#b4e4ff"/><rect x="16" y="23" width="76" height="43" rx="7" fill="white" stroke="#51b6f3" strokeWidth="2"/><rect x="23" y="29" width="61" height="6" rx="3" fill="#e7f6ff"/><path d="M23 46h61M23 52h61M23 58h61" stroke="#90d5fb" strokeWidth="2"/><circle cx="25" cy="38" r="2" fill="#12bafa"/><path d="M33 73c-7 8 5 11-3 19m20-19c-8 8 5 11-3 19m20-19c-7 8 5 11-3 19" fill="none" stroke="#21b6fa" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "solar") return <div className={"service-art solar-art"}><svg viewBox="0 0 110 100" aria-hidden="true"><circle cx="76" cy="28" r="17" fill="#ffc619"/><path d="M76 5v-4m0 54v-5m-27-22h-5m59 0h-5M56 9l-4-4m45 45-4-4m0-36 4-5" stroke="#ffb600" strokeWidth="3" strokeLinecap="round"/><ellipse cx="54" cy="91" rx="40" ry="5" fill="#1299ea" opacity=".14"/><path d="m26 44 59 2-15 38-60-2Z" fill="#087ccf" stroke="white" strokeWidth="3"/><path d="m46 44-14 39m36-38L54 83M19 57l59 2M15 69l58 2" stroke="#91e7ff" strokeWidth="2"/><path d="m39 85-2 9m18-9 2 9M31 94h33" stroke="#1b88cf" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "mechanics") return <div className={"service-art mechanic-art"}><Cog size={78} strokeWidth={2.8} className="art-cog"/><Wrench size={64} strokeWidth={2} className="art-wrench"/></div>;
  return <div className={"service-art"} style={{ background: `radial-gradient(circle, ${info.light} 48%, transparent 72%)` }}><span className="service-art-disc" style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}d0)` }}><CategoryIcon icon={info.icon} size={48}/></span></div>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId(); const panel = useRef<HTMLDivElement>(null); const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? []);
    (panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ?? elements()[0])?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Tab") { const focusable = elements(), first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handler); previousFocus?.focus(); };
  }, []);
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal-panel ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}><div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><X size={21}/></button></div><div className="modal-body">{children}</div></div></div>;
}

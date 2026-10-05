"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Activity, Anvil, Armchair, Baby, BadgeCheck, Bell, BookOpen, Bone, BrickWall, Calculator, Cctv, Coffee, Cog, Crown, Droplets, Ellipsis, Eye, Flame, FlaskConical, Flower2, Gem, Gift, Globe, GraduationCap, Grid2X2, Hammer, HandHeart, Heart, HeartPulse, Laugh, Languages, MoonStar, Paintbrush, PartyPopper, PanelsTopLeft, Pill, Rocket, Scale, Shirt, ShoppingBasket, Smartphone, Smile, SmilePlus, Snowflake, Stethoscope, Store, Sun, ThumbsUp, Truck, Tv, UsersRound, Utensils, Wrench, X, Zap, Sparkles, type LucideIcon } from "lucide-react";
import { defaultSettings, getCategory, type CategoryRecord } from "@/lib/catalog";

const categoryIcons: Record<string, LucideIcon> = { Activity, Anvil, Armchair, Baby, BadgeCheck, Bell, BookOpen, Bone, BrickWall, Calculator, Cctv, Coffee, Cog, Crown, Droplets, Ellipsis, Eye, Flame, FlaskConical, Flower2, Gem, Gift, Globe, GraduationCap, Grid2X2, Hammer, HandHeart, Heart, HeartPulse, Laugh, Languages, MoonStar, Paintbrush, PartyPopper, PanelsTopLeft, Pill, Rocket, Scale, Shirt, ShoppingBasket, Smartphone, Smile, SmilePlus, Snowflake, Stethoscope, Store, Sun, ThumbsUp, Truck, Tv, UsersRound, Utensils, Wrench, Zap, Sparkles };
export function CategoryIcon({ category = "", icon, size = 32, className = "" }: { category?: string; icon?: string; size?: number; className?: string }) {
  const Icon = categoryIcons[icon ?? getCategory(category).icon] ?? Wrench;
  return <Icon size={size} strokeWidth={2.3} className={className} aria-hidden="true"/>;
}
export function Logo({ compact = false, footer = false, name = defaultSettings.siteName }: { compact?: boolean; footer?: boolean; name?: string }) {
  const [title, village] = name.split("بقرية");
  return <a href="/" className={`brand ${footer ? "brand-light" : ""}`} aria-label={`${name} - الرئيسية`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icon.svg" width="48" height="60" alt="" className="brand-symbol"/>
    <span className="brand-copy"><strong>{compact ? "دليل جنزور" : title.trim()}</strong><span>{village ? `بقرية ${village.trim()}` : "كل ما تحتاجه.. في مكان واحد"}{footer && " • مكتب الجمال"}</span></span>
  </a>;
}
export function AdvertisingIcon({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return <svg className={`advertising-3d-icon ${className}`} viewBox="0 0 110 100" aria-hidden="true"><defs><linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe065"/><stop offset=".45" stopColor="#ff9542"/><stop offset="1" stopColor="#fa4d36"/></linearGradient><linearGradient id={`${id}-mouth`}><stop stopColor="#ff6c4b"/><stop offset="1" stopColor="#c62d3c"/></linearGradient><linearGradient id={`${id}-handle`}><stop stopColor="#5fcdff"/><stop offset="1" stopColor="#0671de"/></linearGradient></defs><ellipse cx="53" cy="90" rx="35" ry="5" fill="#000" opacity=".13"/><path d="m40 51 10 4-4 31q-2 6-8 3l-5-4Z" fill={`url(#${id}-handle)`}/><path d="m24 49 41-23 15 43-49-2Z" fill={`url(#${id}-body)`} stroke="#ffa148" strokeWidth="1.5"/><ellipse cx="24" cy="58" rx="10" ry="14" fill="#fd9540" transform="rotate(-17 24 58)"/><ellipse cx="25" cy="57" rx="6" ry="10" fill="#ffcf61" transform="rotate(-17 25 57)"/><ellipse cx="70" cy="47" rx="16" ry="29" fill={`url(#${id}-mouth)`} transform="rotate(-19 70 47)" stroke="#ffbc62" strokeWidth="4"/><ellipse cx="69" cy="46" rx="8" ry="20" fill="#791e45" transform="rotate(-19 69 46)"/><path d="m53 30 5 3m-28 20 23-9" stroke="#ffe496" strokeWidth="3" strokeLinecap="round"/><path d="m88 18 7-8m-1 31 11-2m-15 24 9 6" fill="none" stroke="#ffdc65" strokeWidth="5" strokeLinecap="round"/><circle cx="36" cy="77" r="2" fill="#c8f5ff"/></svg>;
}
export function MapIllustration() {
  return <svg viewBox="0 0 240 135" className="map-art" aria-hidden="true"><ellipse cx="121" cy="112" rx="86" ry="11" fill="#7ebbed" opacity=".18"/><path d="m28 83 29-53 47 17 45-23 64 43-29 53-47-17-46 23Z" fill="#d7eaf4"/><path d="m25 78 29-53 47 17 45-23 64 43-29 53-47-17-46 23Z" fill="white"/><path d="m35 76 22-42 38 14-10 60Z" fill="#84dfa6"/><path d="m102 49 42-21-9 61-43 21Z" fill="#a2e6b8"/><path d="m150 30 50 35-23 40-35-13Z" fill="#70d998"/><path d="m47 53 37 19 26-5 21 12 42-29M66 37l-3 27 19 34M112 46l-5 46 25 6m29-58-9 43 26 12" fill="none" stroke="white" strokeWidth="6"/><path d="m107 73 31 22" stroke="#ffc967" strokeWidth="5"/><ellipse cx="131" cy="87" rx="13" ry="5" fill="#327c56" opacity=".2"/><path d="M131 7c-17 0-29 12-29 27 0 23 29 52 29 52s29-29 29-52c0-15-12-27-29-27Z" fill="#ff574d" stroke="#ff8b7c" strokeWidth="3"/><path d="M131 9c-15 0-26 10-26 25 0 21 26 48 26 48V9Z" fill="#ff7565"/><circle cx="131" cy="34" r="12" fill="white"/><circle cx="131" cy="34" r="8" fill="#e9f4ff"/><path d="M113 25c2-6 5-9 10-11" fill="none" stroke="#ffc0ab" strokeWidth="4" strokeLinecap="round"/></svg>;
}
export function ServiceArt({ category, small = false, item }: { category: string; small?: boolean; item?: CategoryRecord }) {
  const info = item ?? getCategory(category);
  if (category === "ac") return <div className={`service-art ac-art ${small ? "art-small" : ""}`}><svg viewBox="0 0 110 100" aria-hidden="true"><ellipse cx="57" cy="85" rx="37" ry="6" fill="#109be7" opacity=".12"/><path d="m15 26 76-5 7 7v42L22 74l-7-7Z" fill="#b4e4ff"/><rect x="16" y="23" width="76" height="43" rx="7" fill="white" stroke="#51b6f3" strokeWidth="2"/><rect x="23" y="29" width="61" height="6" rx="3" fill="#e7f6ff"/><path d="M23 46h61M23 52h61M23 58h61" stroke="#90d5fb" strokeWidth="2"/><circle cx="25" cy="38" r="2" fill="#12bafa"/><path d="M33 73c-7 8 5 11-3 19m20-19c-8 8 5 11-3 19m20-19c-7 8 5 11-3 19" fill="none" stroke="#21b6fa" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "solar") return <div className={`service-art solar-art ${small ? "art-small" : ""}`}><svg viewBox="0 0 110 100" aria-hidden="true"><circle cx="76" cy="28" r="17" fill="#ffc619"/><path d="M76 5v-4m0 54v-5m-27-22h-5m59 0h-5M56 9l-4-4m45 45-4-4m0-36 4-5" stroke="#ffb600" strokeWidth="3" strokeLinecap="round"/><ellipse cx="54" cy="91" rx="40" ry="5" fill="#1299ea" opacity=".14"/><path d="m26 44 59 2-15 38-60-2Z" fill="#087ccf" stroke="white" strokeWidth="3"/><path d="m46 44-14 39m36-38L54 83M19 57l59 2M15 69l58 2" stroke="#91e7ff" strokeWidth="2"/><path d="m39 85-2 9m18-9 2 9M31 94h33" stroke="#1b88cf" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "mechanics") return <div className={`service-art mechanic-art ${small ? "art-small" : ""}`}><Cog size={78} strokeWidth={2.8} className="art-cog"/><Wrench size={64} strokeWidth={2} className="art-wrench"/></div>;
  return <div className={`service-art ${small ? "art-small" : ""}`} style={{ background: `radial-gradient(circle, ${info.light} 48%, transparent 72%)` }}><span className="service-art-disc" style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}d0)` }}><CategoryIcon icon={info.icon} size={48}/></span></div>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId(); const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? []);
    (panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ?? elements()[0])?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") { const focusable = elements(), first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handler); previousFocus?.focus(); };
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal-panel ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}><div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><X size={21}/></button></div><div className="modal-body">{children}</div></div></div>;
}

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Accessibility, Activity, AirVent, Ambulance, Antenna, Anvil, Apple, Armchair, Atom, Axe, Baby, Backpack, Bandage, Banknote, Bath, BatteryCharging, Bed, Beef, BellRing, Bike, Bird, Blinds, Bone, Book, BookMarked, BookOpen, Bot, Boxes, Brain, BrickWall, Briefcase, BriefcaseMedical, Brush, Bug, Building2, Bus, Cake, Calculator, Camera, Candy, Car, CarFront, Carrot, Cctv, ChartBar, ChefHat, CircuitBoard, Citrus, Clapperboard, ClipboardList, Code, Coffee, Cog, Coins, Compass, Construction, Cookie, CookingPot, Cpu, CreditCard, Croissant, Cross, Crown, Cuboid, CupSoda, Disc3, Dna, Dog, DoorOpen, Drill, Droplets, Drumstick, Dumbbell, Ear, Egg, Ellipsis, Eye, Factory, Fan, Feather, Fence, FileText, Fish, Flame, Flashlight, FlaskConical, Flower, Footprints, Forklift, Fuel, Gamepad2, Gauge, Gavel, Gem, Gift, GlassWater, Glasses, Globe, GraduationCap, Grid2X2, Guitar, Hammer, Hand, HandCoins, HandHeart, HardDrive, HardHat, Headphones, Heart, HeartHandshake, HeartPulse, Hospital, Hotel, House, IceCreamCone, Key, Keyboard, Lamp, Landmark, Languages, Laptop, Leaf, Library, Lightbulb, Lock, Mail, Map, MapPin, Medal, Megaphone, Mic, Microscope, Microwave, Milk, Monitor, Moon, MoonStar, Music, Navigation, Newspaper, NotebookPen, Nut, PackageOpen, PaintBucket, PaintRoller, Paintbrush, Palette, PanelsTopLeft, PartyPopper, PawPrint, PenTool, Pencil, PersonStanding, Phone, Pickaxe, PiggyBank, Pill, Pizza, Plane, Plug, Presentation, Printer, Puzzle, Rabbit, Radio, Receipt, Recycle, Refrigerator, Ribbon, Route, Router, Ruler, Salad, Sandwich, Satellite, Scale, School, Scissors, ScrollText, Send, Server, Settings, Shield, ShieldCheck, Shirt, ShoppingBasket, Shovel, ShowerHead, Sigma, Signature, Siren, Smartphone, Smile, Snowflake, Sofa, Sparkles, Speaker, SprayCan, Sprout, Stamp, Star, Stethoscope, Store, Sun, Syringe, TabletSmartphone, Tablets, Telescope, Tent, TestTube, Theater, Thermometer, Ticket, Toilet, Tractor, TrafficCone, Trash2, TreePine, Trees, Trophy, Truck, Tv, Type, Umbrella, UserRound, Users, UsersRound, Utensils, UtensilsCrossed, Video, Volleyball, Wallet, WandSparkles, Warehouse, WashingMachine, Watch, Waves, Wheat, Wifi, Wrench, X, Zap, type LucideIcon } from "lucide-react";
import { categoryArt, categoryArtOptions, defaultSettings, getCategory, type CategoryRecord, hasProfessionArt } from "@/lib/catalog";

// Exactly the icons the catalogue offers (see iconNames), so no unreachable component is bundled.
const categoryIcons: Record<string, LucideIcon> = { Wrench, Stethoscope, Store, GraduationCap, HandHeart, Grid2X2, Hammer, Droplets, Zap, Anvil, Paintbrush, BrickWall, PanelsTopLeft, Snowflake, Cog, Armchair, Baby, Smile, HeartPulse, Bone, Sparkles, Eye, Activity, ShoppingBasket, Pill, Shirt, BookOpen, Tv, Utensils, Smartphone, Languages, Calculator, FlaskConical, Globe, Heart, UsersRound, Scale, Truck, Cctv, Sun, Ellipsis, Printer, Megaphone, Palette, Camera, Disc3, Scissors, WandSparkles, PartyPopper, Sofa, PackageOpen, Car, SprayCan, WashingMachine, Gavel, ScrollText, Drill, Pickaxe, Shovel, Axe, PaintRoller, PaintBucket, Ruler, HardHat, Construction, Fence, Lightbulb, Plug, BatteryCharging, Fan, AirVent, Thermometer, ShowerHead, Bath, Toilet, Flame, Key, DoorOpen, Blinds, Bed, Lamp, Refrigerator, Microwave, Nut, CircuitBoard, Cuboid, Boxes, Waves, CarFront, Fuel, Gauge, Bus, Bike, Tractor, Forklift, Plane, TrafficCone, Route, Navigation, ChefHat, CookingPot, Beef, Drumstick, Fish, Croissant, Cake, Coffee, CupSoda, Apple, Carrot, Wheat, Egg, Milk, IceCreamCone, Pizza, Sandwich, Candy, Cookie, Salad, Citrus, GlassWater, UtensilsCrossed, Brush, Ribbon, Crown, Gem, Watch, Glasses, Footprints, Hand, Flower, Gift, Puzzle, Gamepad2, Laptop, Monitor, Cpu, Wifi, Satellite, Router, Keyboard, Headphones, Speaker, Radio, Code, Bot, Antenna, TabletSmartphone, Phone, HardDrive, Book, Library, NotebookPen, Backpack, School, Pencil, PenTool, Music, Guitar, Mic, Atom, Sigma, Telescope, Compass, BookMarked, MoonStar, Presentation, Feather, Type, Syringe, Tablets, Brain, Ear, Microscope, TestTube, Dna, Ambulance, Hospital, Cross, Accessibility, Dumbbell, Trophy, Medal, Volleyball, Bandage, BriefcaseMedical, HeartHandshake, PawPrint, Dog, Briefcase, FileText, Banknote, CreditCard, Coins, PiggyBank, Receipt, Wallet, HandCoins, Landmark, Building2, Hotel, House, Warehouse, Factory, Stamp, Signature, ClipboardList, Mail, Send, Ticket, ChartBar, Leaf, Sprout, TreePine, Trees, Bird, Bug, Tent, Umbrella, Rabbit, Shield, ShieldCheck, Siren, BellRing, Lock, Flashlight, Recycle, Trash2, Clapperboard, Video, Newspaper, Theater, Star, MapPin, Map, Moon, Users, UserRound, PersonStanding, Settings, Server };
export function CategoryIcon({ category = "", icon, size = 32, className = "" }: { category?: string; icon?: string; size?: number; className?: string }) {
  const Icon = categoryIcons[icon ?? getCategory(category).icon] ?? Wrench;
  return <Icon size={size} strokeWidth={2.3} className={className} aria-hidden="true"/>;
}
/** رسم ثلاثي الأبعاد مرسوم باليد لمهنة من أهم 12 مهنة؛ يرجع للأيقونة المسطحة إن لم يتوفر رسم أو كانت الخاصية مغلقة. */
export function SpecialtyIcon({ category, size = 35, art3d = false, className = "" }: { category: { id: string; icon: string }; size?: number; art3d?: boolean; className?: string }) {
  if (art3d && hasProfessionArt(category.id)) {
    return <svg className={`profession-art ${className}`} viewBox="0 0 128 128" style={{ width: size, height: size }} aria-hidden="true"><use href={`/images/profession-art.svg#${category.id}`}/></svg>;
  }
  return <CategoryIcon icon={category.icon} size={size} className={className}/>;
}
export function MainCategoryIcon({ icon, art = "", size }: { icon: string; art?: string; size?: number }) {
  // Feature tiles (duty/utilities/quick/featured) pass their symbol id directly through `icon`.
  const symbol = categoryArtOptions.some((option) => option.id === icon) && !art ? icon : categoryArt({ icon, art });
  return <svg className="main-category-art" viewBox="0 0 128 128" style={size ? { width: size, height: size } : undefined} aria-hidden="true"><use href={`/images/category-3d.svg#${symbol}`}/></svg>;
}
export function Logo({ compact = false, footer = false, name = defaultSettings.siteName, logoUrl = "" }: { compact?: boolean; footer?: boolean; name?: string; description?: string; logoUrl?: string }) {
  const shortTitle = name.includes("جنزور") ? "دليل قرية جنزور" : name;
  return (
    <Link href="/" className={`brand ${footer ? "brand-light" : ""} ${compact ? "brand-compact" : ""}`} aria-label={`${name} - الرئيسية`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Brand logo image */}
      <img src={logoUrl || "/images/logo-daleel-transparent.png"} alt="" className="brand-symbol"/>
      {!compact && (
        <span className="brand-copy">
          <strong>{shortTitle}</strong>
          <span>المهن والخدمات في مكان واحد</span>
        </span>
      )}
    </Link>
  );
}
export function ServiceArt({ category, item }: { category: string; item?: CategoryRecord }) {
  const info = item ?? getCategory(category);
  if (category === "ac") return <div className={"service-art ac-art"}><svg viewBox="0 0 110 100" aria-hidden="true"><ellipse cx="57" cy="85" rx="37" ry="6" fill="#109be7" opacity=".12"/><path d="m15 26 76-5 7 7v42L22 74l-7-7Z" fill="#b4e4ff"/><rect x="16" y="23" width="76" height="43" rx="7" fill="white" stroke="#51b6f3" strokeWidth="2"/><rect x="23" y="29" width="61" height="6" rx="3" fill="#e7f6ff"/><path d="M23 46h61M23 52h61M23 58h61" stroke="#90d5fb" strokeWidth="2"/><circle cx="25" cy="38" r="2" fill="#12bafa"/><path d="M33 73c-7 8 5 11-3 19m20-19c-8 8 5 11-3 19m20-19c-7 8 5 11-3 19" fill="none" stroke="#21b6fa" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "solar") return <div className={"service-art solar-art"}><svg viewBox="0 0 110 100" aria-hidden="true"><circle cx="76" cy="28" r="17" fill="#ffc619"/><path d="M76 5v-4m0 54v-5m-27-22h-5m59 0h-5M56 9l-4-4m45 45-4-4m0-36 4-5" stroke="#ffb600" strokeWidth="3" strokeLinecap="round"/><ellipse cx="54" cy="91" rx="40" ry="5" fill="#1299ea" opacity=".14"/><path d="m26 44 59 2-15 38-60-2Z" fill="#087ccf" stroke="white" strokeWidth="3"/><path d="m46 44-14 39m36-38L54 83M19 57l59 2M15 69l58 2" stroke="#91e7ff" strokeWidth="2"/><path d="m39 85-2 9m18-9 2 9M31 94h33" stroke="#1b88cf" strokeWidth="3" strokeLinecap="round"/></svg></div>;
  if (category === "mechanics") return <div className={"service-art mechanic-art"}><Cog size={78} strokeWidth={2.8} className="art-cog"/><Wrench size={64} strokeWidth={2} className="art-wrench"/></div>;
  return <div className={"service-art"} style={{ background: `radial-gradient(circle, ${info.light} 48%, transparent 72%)` }}><span className="service-art-disc" style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}d0)` }}><CategoryIcon icon={info.icon} size={48}/></span></div>;
}
export function Modal({ title, subtitle, children, onClose, wide = false, floating = false, className = "" }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; floating?: boolean; className?: string }) {
  const titleId = useId(); const panel = useRef<HTMLDivElement>(null); const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel.current) {
      panel.current.scrollTop = 0;
      const bodyEl = panel.current.querySelector<HTMLElement>(".modal-body");
      if (bodyEl) bodyEl.scrollTop = 0;
    }
    const elements = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? []);
    const isDetailView = Boolean(panel.current?.querySelector(".service-details"));
    const targetFocus = isDetailView
      ? elements()[0]
      : (panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea") ?? elements()[0]);
    targetFocus?.focus({ preventScroll: true });
    const handler = (event: KeyboardEvent) => {
      const panels = document.querySelectorAll(".modal-panel");
      if (panels[panels.length - 1] !== panel.current) return;
      if (event.key === "Escape") { event.stopImmediatePropagation(); onCloseRef.current(); }
      if (event.key === "Tab") { const focusable = elements(), first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handler); previousFocus?.focus(); };
  }, []);
  return <div className={`modal-overlay ${floating ? "modal-overlay-floating" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal-panel ${wide ? "modal-wide" : ""} ${floating ? "modal-floating" : ""} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}><div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><X size={21}/></button></div><div className="modal-body">{children}</div></div></div>;
}

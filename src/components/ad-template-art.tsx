"use client";
import type { CSSProperties } from "react";
import { Award, BadgeCheck, CirclePlus, Gift, MapPin, Megaphone, MessageCircle, PartyPopper, Search, Sparkles, Star, Store, Wrench } from "lucide-react";
import { getAdTemplate, type AdPricing, type ServiceRecord, cheapestAdTier, formatEgp } from "@/lib/catalog";

type Props = {
  template: string;
  /** Ad title/caption typed by the admin; empty strings fall back to the template defaults. */
  title?: string;
  caption?: string;
  siteName: string;
  logoUrl?: string;
  pricing?: AdPricing | null;
  /** Compact mode for admin gallery thumbnails. */
  compact?: boolean;
  /** Provider chosen by the automatic templates (مهني الأسبوع، محل الشهر…). */
  service?: ServiceRecord | null;
  categoryName?: string;
  /** Optional uploaded artwork used as the template background (tinted with the accent colour). */
  backgroundUrl?: string;
  /** Enables the staggered text entrance animations (off for static thumbnails). */
  animated?: boolean;
};

/** Heading that optionally animates word by word (module-level so re-renders never restart the animation). */
function Heading({ text, animate }: { text: string; animate: boolean }) {
  return animate ? <strong><AnimatedWords text={text}/></strong> : <strong>{text}</strong>;
}
/** Splits a heading into words that slide in one after another. */
function AnimatedWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return <span className={`ad-words ${className}`} aria-label={text}>{words.map((word, index) => <span key={`${word}-${index}`} className="ad-word" style={{ "--i": index } as CSSProperties} aria-hidden="true">{word}</span>)}</span>;
}

/**
 * Built-in animated banners (pure CSS, zero upload). They adapt to the current site name/logo,
 * and each ad's own title/caption override the defaults.
 */
export default function AdTemplateArt({ template, title = "", caption = "", siteName, logoUrl = "", pricing = null, compact = false, service = null, categoryName = "", backgroundUrl = "", animated = false }: Props) {
  const meta = getAdTemplate(template);
  if (!meta) return null;
  const heading = title.trim() || meta.title || siteName;
  const line = caption.trim() || meta.caption;
  const cheapest = pricing?.enabled ? cheapestAdTier(pricing) : null;
  const logo = logoUrl || "/app-icon.png?v=6";
  const autoKind = meta.auto ? "ad-art-auto" : "";
  const cls = `ad-art ad-art-${template} ${autoKind} ${compact ? "is-compact" : ""} ${animated ? "is-animated" : ""} ${backgroundUrl ? "has-bg" : ""}`;
  const bgStyle = backgroundUrl ? ({ "--ad-bg": `url("${backgroundUrl}")` } as CSSProperties) : undefined;
  const animateText = animated && !compact;

  if (meta.auto) {
    const stars = Math.round(Number(service?.rating ?? 0));
    const AutoIcon = template === "shop-of-month" ? Store : template === "new-in-directory" ? Sparkles : template === "most-reviewed" ? BadgeCheck : Star;
    return (
      <div className={cls} dir="rtl" style={bgStyle}>
        <span className="ad-art-orb ad-art-orb-a"/><span className="ad-art-orb ad-art-orb-b"/>
        <span className="ad-art-badge ad-art-badge-gold"><Award size={13}/> {meta.title}</span>
        <span className="ad-art-icon-tile ad-art-pulse ad-art-tile-gold"><AutoIcon size={30}/></span>
        <div className="ad-art-copy">
          <Heading text={service ? service.name : meta.title} animate={animateText}/>
          <p>{service ? [categoryName, service.area].filter(Boolean).join(" · ") : "يتم اختياره تلقائيًا من بيانات الدليل"}</p>
          <span className="ad-art-stars" aria-label={service ? `التقييم ${service.rating} من 5` : undefined}>
            {[1, 2, 3, 4, 5].map((index) => <Star key={index} size={13} className={index <= stars ? "is-on" : ""}/>)}
            {service && <b>{service.rating}</b>}
            {service && service.reviews > 0 && <small>({service.reviews.toLocaleString("ar-EG")} تقييم)</small>}
          </span>
          <small>{caption.trim() || meta.caption}</small>
        </div>
        {service && <span className="ad-art-cta"><MapPin size={14}/> شوف صفحته</span>}
      </div>
    );
  }

  if (template === "ad-space") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-orb ad-art-orb-a"/><span className="ad-art-orb ad-art-orb-b"/>
      <span className="ad-art-badge"><Megaphone size={14}/> للإيجار</span>
      <div className="ad-art-copy">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
        {cheapest && <em>ابتداءً من {formatEgp(cheapest.price)} / {cheapest.label}</em>}
      </div>
      <span className="ad-art-cta ad-art-pulse"><Sparkles size={15}/> اطلب الآن</span>
    </div>
  );

  if (template === "app-promo") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-float ad-art-float-1"><Wrench size={18}/></span>
      <span className="ad-art-float ad-art-float-2"><Store size={18}/></span>
      <span className="ad-art-float ad-art-float-3"><Search size={18}/></span>
      <span className="ad-art-logo-ring">
        {/* eslint-disable-next-line @next/next/no-img-element -- Site logo chosen by the admin. */}
        <img src={logo} alt="" />
      </span>
      <div className="ad-art-copy">
        <Heading text={title.trim() || siteName} animate={animateText}/>
        <p>{line}</p>
        <span className="ad-art-chips"><i><BadgeCheck size={12}/> مهنيون موثّقون</i><i><MessageCircle size={12}/> واتساب مباشر</i><i><Star size={12}/> تقييمات حقيقية</i></span>
      </div>
    </div>
  );

  if (template === "add-profession") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-stripes"/>
      <span className="ad-art-icon-tile ad-art-bounce"><CirclePlus size={30}/></span>
      <div className="ad-art-copy">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-shine">سجّل الآن</span>
    </div>
  );

  if (template === "special-offer") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-ribbon">عرض</span>
      <span className="ad-art-icon-tile ad-art-swing"><Gift size={30}/></span>
      <div className="ad-art-copy">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
      </div>
      <span className="ad-art-sparkle s1"/><span className="ad-art-sparkle s2"/><span className="ad-art-sparkle s3"/>
    </div>
  );

  if (template === "grand-opening") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-confetti c1"/><span className="ad-art-confetti c2"/><span className="ad-art-confetti c3"/><span className="ad-art-confetti c4"/><span className="ad-art-confetti c5"/>
      <span className="ad-art-icon-tile ad-art-pop"><PartyPopper size={30}/></span>
      <div className="ad-art-copy">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-pulse">زورونا</span>
    </div>
  );

  if (template === "design-office") return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-grid"/>
      <span className="ad-art-icon-tile ad-art-rotate"><Sparkles size={30}/></span>
      <div className="ad-art-copy">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-shine"><MessageCircle size={15}/> واتساب</span>
    </div>
  );

  // greeting
  return (
    <div className={cls} dir="rtl" style={bgStyle}>
      <span className="ad-art-moon"/>
      <span className="ad-art-star st1"/><span className="ad-art-star st2"/><span className="ad-art-star st3"/><span className="ad-art-star st4"/>
      <div className="ad-art-copy ad-art-copy-center">
        <Heading text={heading} animate={animateText}/>
        <p>{line}</p>
        <small>{siteName}</small>
      </div>
    </div>
  );
}

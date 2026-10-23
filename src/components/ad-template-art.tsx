"use client";
import { BadgeCheck, CirclePlus, Gift, Megaphone, MessageCircle, PartyPopper, Search, Sparkles, Star, Store, Wrench } from "lucide-react";
import { getAdTemplate, type AdPricing, cheapestAdTier, formatEgp } from "@/lib/catalog";

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
};

/**
 * Built-in animated banners (pure CSS, zero upload). They adapt to the current site name/logo,
 * and each ad's own title/caption override the defaults.
 */
export default function AdTemplateArt({ template, title = "", caption = "", siteName, logoUrl = "", pricing = null, compact = false }: Props) {
  const meta = getAdTemplate(template);
  if (!meta) return null;
  const heading = title.trim() || meta.title || siteName;
  const line = caption.trim() || meta.caption;
  const cheapest = pricing?.enabled ? cheapestAdTier(pricing) : null;
  const logo = logoUrl || "/app-icon.png";
  const cls = `ad-art ad-art-${template} ${compact ? "is-compact" : ""}`;

  if (template === "ad-space") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-orb ad-art-orb-a"/><span className="ad-art-orb ad-art-orb-b"/>
      <span className="ad-art-badge"><Megaphone size={14}/> للإيجار</span>
      <div className="ad-art-copy">
        <strong>{heading}</strong>
        <p>{line}</p>
        {cheapest && <em>ابتداءً من {formatEgp(cheapest.price)} / {cheapest.label}</em>}
      </div>
      <span className="ad-art-cta ad-art-pulse"><Sparkles size={15}/> اطلب الآن</span>
    </div>
  );

  if (template === "app-promo") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-float ad-art-float-1"><Wrench size={18}/></span>
      <span className="ad-art-float ad-art-float-2"><Store size={18}/></span>
      <span className="ad-art-float ad-art-float-3"><Search size={18}/></span>
      <span className="ad-art-logo-ring">
        {/* eslint-disable-next-line @next/next/no-img-element -- Site logo chosen by the admin. */}
        <img src={logo} alt="" />
      </span>
      <div className="ad-art-copy">
        <strong>{title.trim() || siteName}</strong>
        <p>{line}</p>
        <span className="ad-art-chips"><i><BadgeCheck size={12}/> مهنيون موثّقون</i><i><MessageCircle size={12}/> واتساب مباشر</i><i><Star size={12}/> تقييمات حقيقية</i></span>
      </div>
    </div>
  );

  if (template === "add-profession") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-stripes"/>
      <span className="ad-art-icon-tile ad-art-bounce"><CirclePlus size={30}/></span>
      <div className="ad-art-copy">
        <strong>{heading}</strong>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-shine">سجّل الآن</span>
    </div>
  );

  if (template === "special-offer") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-ribbon">عرض</span>
      <span className="ad-art-icon-tile ad-art-swing"><Gift size={30}/></span>
      <div className="ad-art-copy">
        <strong>{heading}</strong>
        <p>{line}</p>
      </div>
      <span className="ad-art-sparkle s1"/><span className="ad-art-sparkle s2"/><span className="ad-art-sparkle s3"/>
    </div>
  );

  if (template === "grand-opening") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-confetti c1"/><span className="ad-art-confetti c2"/><span className="ad-art-confetti c3"/><span className="ad-art-confetti c4"/><span className="ad-art-confetti c5"/>
      <span className="ad-art-icon-tile ad-art-pop"><PartyPopper size={30}/></span>
      <div className="ad-art-copy">
        <strong>{heading}</strong>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-pulse">زورونا</span>
    </div>
  );

  if (template === "design-office") return (
    <div className={cls} dir="rtl">
      <span className="ad-art-grid"/>
      <span className="ad-art-icon-tile ad-art-rotate"><Sparkles size={30}/></span>
      <div className="ad-art-copy">
        <strong>{heading}</strong>
        <p>{line}</p>
      </div>
      <span className="ad-art-cta ad-art-shine"><MessageCircle size={15}/> واتساب</span>
    </div>
  );

  // greeting
  return (
    <div className={cls} dir="rtl">
      <span className="ad-art-moon"/>
      <span className="ad-art-star st1"/><span className="ad-art-star st2"/><span className="ad-art-star st3"/><span className="ad-art-star st4"/>
      <div className="ad-art-copy ad-art-copy-center">
        <strong>{heading}</strong>
        <p>{line}</p>
        <small>{siteName}</small>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { adImageUrl, adPricingSummary, cheapestAdTier, formatEgp, isAdLive, whatsappUrl, type AdBannerRecord, type AdPricing, type ServiceRecord } from "@/lib/catalog";
import AdTemplateArt from "@/components/ad-template-art";

type AdRotatorProps = {
  ads: AdBannerRecord[];
  services: ServiceRecord[];
  /** Admin WhatsApp number used by «اطلب إعلانك». */
  adminPhone: string;
  siteName: string;
  logoUrl?: string;
  pricing?: AdPricing | null;
  onOpenService: (service: ServiceRecord) => void;
};

const REQUEST_AD_MESSAGE = (siteName: string, pricing: AdPricing | null) => `مرحبًا، أنا عضو في ${siteName} وأرغب في حجز إعلان متحرك في المساحة الإعلانية بالتطبيق.${pricing?.enabled && pricing.tiers.length ? ` الأسعار المعلنة: ${adPricingSummary(pricing)}.` : ""} من فضلكم أرسلوا لي التفاصيل وطريقة الدفع.`;

/**
 * Rotating promotional slot shown above the directory on every browsing page.
 * Each ad can jump to its advertiser's page inside the directory and/or to their WhatsApp.
 */
export default function AdRotator({ ads, services, adminPhone, siteName, logoUrl = "", pricing = null, onOpenService }: AdRotatorProps) {
  const live = useMemo(() => ads.filter((ad) => isAdLive(ad)), [ads]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const current = live.length ? live[index % live.length] : null;

  useEffect(() => {
    if (live.length < 2 || paused) return;
    const seconds = Math.max(3, current?.durationSeconds ?? 6);
    const timer = setTimeout(() => setIndex((value) => (value + 1) % live.length), seconds * 1000);
    return () => clearTimeout(timer);
  }, [live.length, paused, current, index]);

  const requestHref = adminPhone ? whatsappUrl(adminPhone, REQUEST_AD_MESSAGE(siteName, pricing)) : "";
  const cheapest = pricing?.enabled ? cheapestAdTier(pricing) : null;
  const priceHint = cheapest ? `من ${formatEgp(cheapest.price)} / ${cheapest.label}` : "";
  const linkedService = current?.serviceId ? services.find((service) => service.id === current.serviceId) ?? null : null;

  function openProvider() {
    if (!current?.serviceId) return;
    if (linkedService) { onOpenService(linkedService); return; }
    window.location.assign(`/?service=${encodeURIComponent(current.serviceId)}`);
  }
  function step(direction: 1 | -1) {
    if (live.length < 2) return;
    setIndex((value) => (value + direction + live.length) % live.length);
  }

  if (!current) {
    return (
      <section className="ad-rotator ad-rotator-empty" aria-label="مساحة إعلانية">
        <span className="ad-rotator-badge"><Megaphone size={12}/> مساحة إعلانية</span>
        <div className="ad-rotator-placeholder">
          <span className="ad-placeholder-icon"><Sparkles size={26}/></span>
          <strong>مساحة إعلانية هنا</strong>
          <p>إعلانك المتحرك يظهر لكل أهل جنزور في كل صفحات الدليل.</p>
          {pricing?.enabled && pricing.tiers.length > 0 && <span className="ad-rotator-prices">{pricing.tiers.map((tier) => <i key={`${tier.label}-${tier.days}`}>{tier.label} <b>{formatEgp(tier.price)}</b></i>)}</span>}
          {pricing?.enabled && pricing.note && <small className="ad-rotator-note">{pricing.note}</small>}
          {requestHref && <a href={requestHref} target="_blank" rel="noopener noreferrer" className="button button-whatsapp button-small"><MessageCircle size={15}/> اطلب إعلانك عبر واتساب</a>}
        </div>
      </section>
    );
  }

  return (
    <section
      className="ad-rotator"
      aria-roledescription="carousel"
      aria-label="إعلانات الأعضاء"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; setPaused(true); }}
      onTouchEnd={(event) => {
        const start = touchStartX.current, end = event.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null; setPaused(false);
        if (start === null || end === null) return;
        const delta = end - start;
        if (Math.abs(delta) > 40) step(delta < 0 ? -1 : 1);
      }}
    >
      {!current.template && <span className="ad-rotator-badge"><Megaphone size={12}/> إعلان</span>}
      <div className="ad-rotator-stage" key={current.id}>
        {current.template ? (
          <AdTemplateArt template={current.template} title={current.title} caption={current.caption} siteName={siteName} logoUrl={logoUrl} pricing={pricing}/>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Admin-uploaded animated GIF served from the database.
          <img src={adImageUrl(current)} alt={current.caption || current.title} className="ad-rotator-image" draggable={false}/>
        )}
        {live.length > 1 && (
          <>
            <button type="button" className="ad-rotator-arrow is-prev" onClick={() => step(-1)} aria-label="الإعلان السابق"><ChevronRight size={18}/></button>
            <button type="button" className="ad-rotator-arrow is-next" onClick={() => step(1)} aria-label="الإعلان التالي"><ChevronLeft size={18}/></button>
          </>
        )}
      </div>
      <div className="ad-rotator-footer">
        <div className="ad-rotator-copy">
          <strong>{current.title}</strong>
          {current.caption && <small>{current.caption}</small>}
        </div>
        <div className="ad-rotator-actions">
          {current.serviceId && <button type="button" className="button button-primary button-small" onClick={openProvider}><UserRound size={14}/> صفحته في الدليل</button>}
          {current.whatsapp && <a href={whatsappUrl(current.whatsapp, `مرحبًا ${current.title}، شاهدت إعلانك في ${siteName}.`)} target="_blank" rel="noopener noreferrer" className="button button-whatsapp button-small"><MessageCircle size={14}/> واتساب</a>}
        </div>
      </div>
      <div className="ad-rotator-bottom">
        {live.length > 1 && (
          <div className="ad-rotator-dots" role="tablist" aria-label="اختيار الإعلان">
            {live.map((ad, position) => <button key={ad.id} type="button" role="tab" aria-selected={position === index % live.length} aria-label={`الإعلان ${position + 1}: ${ad.title}`} className={position === index % live.length ? "is-active" : ""} onClick={() => setIndex(position)}/>)}
          </div>
        )}
        {requestHref && <a href={requestHref} target="_blank" rel="noopener noreferrer" className="ad-rotator-request"><Sparkles size={12}/> اطلب إعلانك الخاص{priceHint ? ` — ${priceHint}` : ""}</a>}
      </div>
    </section>
  );
}

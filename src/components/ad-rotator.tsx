"use client";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Megaphone, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { adImageUrl, adPricingSummary, autoTemplateService, cheapestAdTier, formatEgp, getAdTemplate, getCategory, isAdLive, nextAdTransition, shadeHex, whatsappUrl, type AdBannerRecord, type AdPricing, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import AdTemplateArt from "@/components/ad-template-art";

type AdRotatorProps = {
  ads: AdBannerRecord[];
  services: ServiceRecord[];
  categories?: CategoryRecord[];
  /** Admin WhatsApp number used by «اطلب إعلانك». */
  adminPhone: string;
  siteName: string;
  logoUrl?: string;
  pricing?: AdPricing | null;
  onOpenService: (service: ServiceRecord) => void;
};

const REQUEST_AD_MESSAGE = (siteName: string, pricing: AdPricing | null) => `مرحبًا، أنا عضو في ${siteName} وأرغب في حجز إعلان متحرك في المساحة الإعلانية بالتطبيق.${pricing?.enabled && pricing.tiers.length ? ` الأسعار المعلنة: ${adPricingSummary(pricing)}.` : ""} من فضلكم أرسلوا لي التفاصيل وطريقة الدفع.`;

/** CSS custom properties that let every template adopt the advertiser's brand colour. */
export function adAccentStyle(accentColor: string): CSSProperties | undefined {
  if (!accentColor) return undefined;
  return { "--ad-accent": accentColor, "--ad-accent-2": shadeHex(accentColor, 0.35), "--ad-accent-dark": shadeHex(accentColor, -0.35) } as CSSProperties;
}

/**
 * Image-only rotating ad rectangle. Slides change with a per-ad transition effect, the visible ad keeps a gentle motion,
 * and tapping the artwork smoothly unfolds the details panel (title, caption, provider page + WhatsApp buttons).
 */
export default function AdRotator({ ads, services, categories = [], adminPhone, siteName, logoUrl = "", pricing = null, onOpenService }: AdRotatorProps) {
  const live = useMemo(() => ads.filter((ad) => isAdLive(ad)), [ads]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // First paint must match the server: start with the fixed effect (or a fade), randomise only on later changes.
  const [effect, setEffect] = useState<string>(() => (live[0]?.transition && live[0].transition !== "random" ? live[0].transition : "fade"));
  const [slideKey, setSlideKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = live.length ? live[index % live.length] : null;

  function goTo(position: number) {
    if (!live.length) return;
    const next = ((position % live.length) + live.length) % live.length;
    setEffect((previous) => nextAdTransition(live[next]?.transition ?? "random", previous));
    setSlideKey((value) => value + 1);
    setIndex(next);
  }

  useEffect(() => {
    if (live.length < 2 || paused || expanded) return;
    const seconds = Math.max(3, current?.durationSeconds ?? 6);
    const timer = setTimeout(() => goTo(index + 1), seconds * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo is stable per render; only timing inputs matter.
  }, [live.length, paused, expanded, current, index]);

  const requestHref = adminPhone ? whatsappUrl(adminPhone, REQUEST_AD_MESSAGE(siteName, pricing)) : "";
  const cheapest = pricing?.enabled ? cheapestAdTier(pricing) : null;
  const priceHint = cheapest ? `من ${formatEgp(cheapest.price)} / ${cheapest.label}` : "";
  const templateMeta = current?.template ? getAdTemplate(current.template) : null;
  const isAuto = Boolean(templateMeta?.auto);
  // Automatic templates («مهني الأسبوع», «محل الشهر»…) point at a provider chosen by the directory itself.
  const currentTemplate = current?.template ?? "";
  const autoService = useMemo(() => (currentTemplate && isAuto ? autoTemplateService(currentTemplate, services, categories) : null), [currentTemplate, isAuto, services, categories]);
  const linkedService = isAuto ? autoService : current?.serviceId ? services.find((service) => service.id === current.serviceId) ?? null : null;
  const targetServiceId = isAuto ? autoService?.id ?? null : current?.serviceId ?? null;
  const targetWhatsapp = isAuto ? autoService?.phone ?? "" : current?.whatsapp ?? "";
  const displayTitle = isAuto && autoService ? autoService.name : current?.title ?? "";
  const displayCaption = isAuto ? (autoService ? `${templateMeta?.title} · ${getCategory(autoService.category, categories).name}` : current?.caption ?? "") : current?.caption ?? "";

  function openProvider() {
    if (!targetServiceId) return;
    if (linkedService) { onOpenService(linkedService); return; }
    window.location.assign(`/?service=${encodeURIComponent(targetServiceId)}`);
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
          <span className="ad-rotator-placeholder-actions">
            {requestHref && <a href={requestHref} target="_blank" rel="noopener noreferrer" className="button button-whatsapp button-small"><MessageCircle size={15}/> اطلب إعلانك عبر واتساب</a>}
            <Link href="/advertise" className="button button-soft button-small"><Sparkles size={15}/> التفاصيل والأسعار</Link>
          </span>
        </div>
      </section>
    );
  }

  const hasDetails = Boolean(displayTitle || displayCaption || targetServiceId || targetWhatsapp);
  const motion = current.motion || "kenburns";

  return (
    <section
      className={`ad-rotator ad-rotator-v2 ${expanded ? "is-expanded" : ""}`}
      aria-roledescription="carousel"
      aria-label="إعلانات الأعضاء"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`ad-rotator-stage ad-fx-${effect} ad-motion-${motion}`}
        key={slideKey}
        style={adAccentStyle(current.accentColor)}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : -1}
        aria-expanded={hasDetails ? expanded : undefined}
        aria-label={hasDetails ? `${displayTitle || "إعلان"} — اضغط لعرض التفاصيل` : displayTitle}
        onClick={() => hasDetails && setExpanded((value) => !value)}
        onKeyDown={(event) => { if (hasDetails && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setExpanded((value) => !value); } }}
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; setPaused(true); }}
        onTouchEnd={(event) => {
          const start = touchStartX.current, end = event.changedTouches[0]?.clientX ?? null;
          touchStartX.current = null; setPaused(false);
          if (start === null || end === null) return;
          const delta = end - start;
          if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? -1 : 1));
        }}
      >
        <div className="ad-rotator-slide">
          {current.template ? (
            <AdTemplateArt template={current.template} title={current.title} caption={current.caption} siteName={siteName} logoUrl={logoUrl} pricing={pricing} service={autoService} categoryName={autoService ? getCategory(autoService.category, categories).name : ""} backgroundUrl={current.hasImage ? adImageUrl(current) : ""} animated/>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- Admin-uploaded animated GIF served from the database.
            <img src={adImageUrl(current)} alt={current.caption || current.title} className="ad-rotator-image" loading="lazy" decoding="async" draggable={false}/>
          )}
        </div>
        <span className="ad-rotator-shine" aria-hidden="true"/>
        {!current.template && <span className="ad-rotator-badge"><Megaphone size={12}/> إعلان</span>}
        {live.length > 1 && (
          <div className="ad-rotator-dots" role="tablist" aria-label="اختيار الإعلان" onClick={(event) => event.stopPropagation()}>
            {live.map((ad, position) => <button key={ad.id} type="button" role="tab" aria-selected={position === index % live.length} aria-label={`الإعلان ${position + 1}: ${ad.title}`} className={position === index % live.length ? "is-active" : ""} onClick={() => goTo(position)}/>)}
          </div>
        )}
        {hasDetails && <span className={`ad-rotator-hint ${expanded ? "is-open" : ""}`} aria-hidden="true"><ChevronDown size={14}/> {expanded ? "إخفاء" : "التفاصيل"}</span>}
        {live.length > 1 && !paused && !expanded && <span className="ad-rotator-progress" key={`p-${slideKey}`} style={{ animationDuration: `${Math.max(3, current.durationSeconds)}s` }} aria-hidden="true"/>}
      </div>

      <div className="ad-rotator-panel" aria-hidden={!expanded}>
        <div className="ad-rotator-panel-inner">
          <div className="ad-rotator-footer">
            <div className="ad-rotator-copy">
              <strong className="ad-rotator-title-anim">{displayTitle}</strong>
              {displayCaption && <small>{displayCaption}</small>}
            </div>
            <div className="ad-rotator-actions">
              {targetServiceId && <button type="button" className="button button-primary button-small" onClick={openProvider}><UserRound size={14}/> صفحته في الدليل</button>}
              {targetWhatsapp && <a href={whatsappUrl(targetWhatsapp, `مرحبًا ${displayTitle}، شاهدت ${isAuto ? `ترشيحك كـ${templateMeta?.title}` : "إعلانك"} في ${siteName}.`)} target="_blank" rel="noopener noreferrer" className="button button-whatsapp button-small"><MessageCircle size={14}/> واتساب</a>}
            </div>
          </div>
          <div className="ad-rotator-bottom">
            <Link href="/advertise" className="ad-rotator-request"><Sparkles size={12}/> اطلب إعلانك الخاص{priceHint ? ` — ${priceHint}` : ""}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

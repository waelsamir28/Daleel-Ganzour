"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { AdvertisingIcon, CategoryIcon, HighlightedAdText } from "@/components/ui";
import { adBackgroundOptions, adIconOptions, getContrastTextColor, whatsappUrl, type AdRecord, type SiteSettings } from "@/lib/catalog";

export default function AdCarousel({ ads, settings, onBook }: { ads: AdRecord[]; settings: SiteSettings; onBook: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeIndex = ads.length ? slideIndex % ads.length : 0;
  const activeAd = ads[activeIndex];
  const resolvedAdBackgrounds = ads.reduce<string[]>((backgrounds, ad, index) => {
    const customColor = typeof ad.backgroundColor === "string" && /^#[0-9a-f]{6}$/i.test(ad.backgroundColor) ? ad.backgroundColor : "";
    const preferredColor = adBackgroundOptions[index % adBackgroundOptions.length].color;
    const previousColor = backgrounds[index - 1];
    const fallbackColor = previousColor === preferredColor
      ? adBackgroundOptions.find(({ color }) => color !== previousColor)?.color ?? preferredColor
      : preferredColor;
    backgrounds.push(customColor || fallbackColor);
    return backgrounds;
  }, []);
  const adBackground = resolvedAdBackgrounds[activeIndex] ?? adBackgroundOptions[activeIndex % adBackgroundOptions.length].color;
  const adIcon = activeAd?.icon || adIconOptions[activeIndex % adIconOptions.length].icon;
  const adTextSize = Math.min(30, Math.max(14, activeAd?.textSize ?? 17));
  const adStyle = {
    "--ad-background": adBackground,
    "--ad-foreground": getContrastTextColor(adBackground),
    "--ad-copy-size": `${adTextSize}px`,
  } as CSSProperties;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (ads.length < 2 || paused || reducedMotion || !pageVisible) return;
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % ads.length), 6500);
    return () => window.clearInterval(timer);
  }, [ads.length, pageVisible, paused, reducedMotion]);

  function moveSlide(direction: -1 | 1) {
    if (!ads.length) return;
    setSlideIndex((index) => (index + direction + ads.length) % ads.length);
  }

  return (
    <section
      className="ad-carousel"
      aria-label="إعلانات الأنشطة في جنزور"
      aria-roledescription="عارض إعلانات"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="ad-carousel-header">
        <div className="ad-carousel-title">
          <span className="ad-carousel-mark" aria-hidden="true"><AdvertisingIcon /></span>
          <div>
            <span className="ad-carousel-eyebrow">من أهل القرية.. لأهل القرية</span>
            <h2>إعلانات جنزور</h2>
          </div>
        </div>
        {ads.length > 1 && (
          <div className="ad-carousel-controls" aria-label="التنقل بين الإعلانات">
            <button type="button" onClick={() => moveSlide(-1)} aria-label="الإعلان السابق"><ChevronRight /></button>
            <span dir="ltr">{String(activeIndex + 1).padStart(2, "0")} / {String(ads.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => moveSlide(1)} aria-label="الإعلان التالي"><ChevronLeft /></button>
          </div>
        )}
      </div>

      {activeAd ? (
        <article className="ad-slide" key={activeAd.id} aria-roledescription="إعلان" aria-label={`الإعلان ${activeIndex + 1} من ${ads.length}`} style={adStyle}>
          <div className="ad-slide-copy">
            <span className="ad-slide-approved"><BadgeCheck /> إعلان معتمد</span>
            <h3>{activeAd.businessName}</h3>
            <p><HighlightedAdText text={activeAd.text} word={activeAd.highlightWord ?? ""}/></p>
            <a className="ad-slide-contact" href={whatsappUrl(activeAd.phone)} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> تواصل عبر واتساب <span dir="ltr">{activeAd.phone}</span>
            </a>
          </div>
          <div className="ad-slide-art" aria-hidden="true"><span><CategoryIcon icon={adIcon} size={58}/></span><small>نشاط من جنزور</small></div>
        </article>
      ) : (
        <div className="ad-slide ad-slide-empty">
          <div className="ad-slide-copy">
            <span className="ad-slide-approved"><Sparkles /> مساحة متاحة</span>
            <h3>خلّي جنزور تعرفك</h3>
            <p>اعرض نشاطك وخدماتك قدّام أهل القرية في مساحة مخصصة لإعلانات المجتمع.</p>
          </div>
          <div className="ad-slide-art" aria-hidden="true"><span><AdvertisingIcon /></span><small>مساحة نشاطك هنا</small></div>
        </div>
      )}

      <div className="ad-carousel-footer">
        <span className="ad-carousel-price">{settings.adPrice} جنيه <span>/ {settings.adDays} أيام</span></span>
        {ads.length > 1 && (
          <div className="ad-carousel-dots" aria-label="اختيار إعلان">
            {ads.map((ad, index) => (
              <button key={ad.id} type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => setSlideIndex(index)} aria-label={`عرض إعلان ${ad.businessName}`} aria-pressed={index === activeIndex} />
            ))}
          </div>
        )}
        <button type="button" className="ad-carousel-book" onClick={onBook}>احجز إعلانك <ChevronLeft /></button>
      </div>
    </section>
  );
}


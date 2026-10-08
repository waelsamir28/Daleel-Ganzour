"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Pause, Phone, Play, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/ui";
import { HERO_AD_DURATION_MS, getContrastTextColor, isAdImageUrl, isAdVideoUrl, whatsappUrl, type AdRecord } from "@/lib/catalog";

let trackedPath = "";
const impressions = new Map<string, string>();
function sendEvent(adId: string, eventType: "impression" | "click", action = "") {
  const path = location.pathname + location.search;
  if (path !== trackedPath) { impressions.clear(); trackedPath = path; }
  if (eventType === "impression" && impressions.has(adId)) return;
  const eventId = crypto.randomUUID();
  if (eventType === "impression") impressions.set(adId, eventId);
  const body = JSON.stringify({ adId, eventId, eventType, action });
  async function send() {
    try {
      const response = await fetch("/api/advertisements/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
      if (eventType === "impression" && !response.ok && impressions.get(adId) === eventId) impressions.delete(adId);
    } catch {
      try {
        const response = await fetch("/api/advertisements/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
        if (eventType === "impression" && !response.ok && impressions.get(adId) === eventId) impressions.delete(adId);
      }
      catch { if (eventType === "impression" && impressions.get(adId) === eventId) impressions.delete(adId); }
    }
  }
  void send();
}
function useAdVisibility(adId: string, track = true) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let intersecting = false, timer: ReturnType<typeof setTimeout> | undefined;
    function update() {
      clearTimeout(timer);
      const active = intersecting && document.visibilityState === "visible";
      setVisible(active);
      if (active && track) timer = setTimeout(() => sendEvent(adId, "impression"), 1000);
    }
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting && entry.intersectionRatio >= .5; update(); }, { threshold: [.5] });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); clearTimeout(timer); document.removeEventListener("visibilitychange", update); };
  }, [adId, track]);
  return { ref, visible };
}
function AdMedia({ ad, onPlaying }: { ad: AdRecord; onPlaying?: (value: boolean) => void }) {
  const [failed, setFailed] = useState(false);
  if (ad.adType === "video" && ad.videoUrl && isAdVideoUrl(ad.videoUrl) && !failed) return <video className="campaign-video" src={ad.videoUrl} poster={isAdImageUrl(ad.imageUrl) ? ad.imageUrl || undefined : undefined} controls playsInline preload="none" onPlay={() => onPlaying?.(true)} onPause={() => onPlaying?.(false)} onEnded={() => onPlaying?.(false)} onError={() => { setFailed(true); onPlaying?.(false); }} aria-label={`فيديو إعلان ${ad.businessName}`}/>;
  if (ad.imageUrl && isAdImageUrl(ad.imageUrl) && !failed) return <Image src={ad.imageUrl} alt={ad.businessName} fill unoptimized sizes="(max-width: 600px) 90vw, 40vw" onError={() => setFailed(true)}/>;
  return <span className="campaign-art-icon" aria-hidden="true"><CategoryIcon icon={ad.icon || "Store"} size={88}/></span>;
}
function AdActions({ ad, detailsFirst = false, preview = false }: { ad: AdRecord; detailsFirst?: boolean; preview?: boolean }) {
  const details = ad.destinationUrl && isAdImageUrl(ad.destinationUrl);
  return <div className="campaign-actions" inert={preview}>
    {detailsFirst && details && <a className="campaign-cta" href={ad.destinationUrl} onClick={() => sendEvent(ad.id, "click", "details")}>عرض التفاصيل <ChevronLeft size={16}/></a>}
    <a className={`campaign-cta ${detailsFirst && details ? "campaign-cta-quiet" : "campaign-call"}`} href={`tel:${ad.phone}`} onClick={() => sendEvent(ad.id, "click", "call")}><Phone size={16}/>اتصل الآن</a>
    <a className="campaign-secondary" href={whatsappUrl(ad.whatsappPhone || ad.phone)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${ad.businessName}`} onClick={() => sendEvent(ad.id, "click", "whatsapp")}><MessageCircle size={18}/></a>
    {!detailsFirst && details && <a className="campaign-details" href={ad.destinationUrl} onClick={() => sendEvent(ad.id, "click", "details")}>عرض التفاصيل <ChevronLeft size={14}/></a>}
  </div>;
}
function creativeStyle(ad: AdRecord, delay = 0): CSSProperties {
  const color = /^#[0-9a-f]{6}$/i.test(ad.backgroundColor) ? ad.backgroundColor : "#ccecff";
  return { "--campaign-bg": color, "--campaign-fg": getContrastTextColor(color), "--entry-delay": `${delay}ms` } as CSSProperties;
}
export function CampaignCard({ ad, index = 0, preview = false }: { ad: AdRecord; index?: number; preview?: boolean }) {
  const { ref, visible } = useAdVisibility(ad.id, !preview);
  return <article ref={ref} className={`campaign-card ${visible || preview ? "campaign-visible" : ""}`} style={creativeStyle(ad, Math.min(index, 6) * 90)} data-ad-id={ad.id}>
    <span className="campaign-sponsored"><Sparkles size={13}/>إعلان مميز · Sponsored</span>
    <div className="campaign-card-media"><AdMedia key={`${ad.adType}:${ad.imageUrl}:${ad.videoUrl}`} ad={ad}/></div>
    <h3>{ad.businessName}</h3><p>{ad.text}</p>{ad.offerText && <strong className="campaign-offer">{ad.offerText}</strong>}
    <AdActions ad={ad} detailsFirst preview={preview}/>
  </article>;
}
export function FeaturedAdvertisers({ ads }: { ads: AdRecord[] }) {
  if (!ads.length) return null;
  return <section className="featured-advertisers" aria-labelledby="featured-advertisers-title"><div className="section-heading"><div><h2 id="featured-advertisers-title">معلنين مميزين</h2><p>أنشطة وخدمات اختارت تكون أقرب ليك</p></div><span className="campaign-section-label">Sponsored</span></div><div className="featured-advertiser-grid">{ads.map((ad, i) => <CampaignCard key={ad.id} ad={ad} index={i}/>)}</div></section>;
}
function HeroCreative({ ad, paused, preview = false, onPlaying }: { ad: AdRecord; paused: boolean; preview?: boolean; onPlaying?: (value: boolean) => void }) {
  const { ref } = useAdVisibility(ad.id, !preview);
  return <article ref={ref} className={`hero-campaign ${paused ? "campaign-paused" : ""}`} style={creativeStyle(ad)} data-ad-id={ad.id}>
    <div className="hero-campaign-media"><AdMedia key={`${ad.adType}:${ad.imageUrl}:${ad.videoUrl}`} ad={ad} onPlaying={onPlaying}/></div>
    <div className="hero-campaign-copy"><span className="campaign-sponsored"><Sparkles size={14}/>إعلان مدفوع مميز</span><h2>{ad.businessName}</h2><p>{ad.text}</p>{ad.offerText && <strong className="campaign-offer">{ad.offerText}</strong>}<AdActions ad={ad} preview={preview}/></div>
  </article>;
}
export function CampaignPreview({ ad }: { ad: AdRecord }) { return <div className="campaign-preview">{ad.placement === "hero" ? <HeroCreative ad={ad} paused preview/> : <CampaignCard ad={ad} preview/>}</div>; }
export function HeroAdvertisements({ ads, onBook }: { ads: AdRecord[]; onBook: () => void }) {
  const [index, setIndex] = useState(0), [manualPause, setManualPause] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false), [playing, setPlaying] = useState(false), [reduced, setReduced] = useState(false);
  const { ref, visible } = useAdVisibility("hero-slot", false);
  const activeIndex = ads.length ? index % ads.length : 0;
  const paused = manualPause || hovered || focused || playing || reduced || !visible;
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { if (paused || ads.length < 2) return; const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), HERO_AD_DURATION_MS); return () => clearInterval(timer); }, [paused, ads.length, activeIndex]);
  if (!ads.length) return <section className="hero-ad-empty"><span><Sparkles size={28}/></span><div><small>مساحتك المميزة في جنزور</small><h2>خلّي إعلانك أول حاجة تتشاف</h2><p>بانر رئيسي، كارت داخل قسمك، أو ظهور بين المعلنين المميزين.</p></div><button type="button" onClick={onBook}>احجز إعلانك <ChevronLeft size={18}/></button></section>;
  return <section ref={ref} className="hero-advertisements" aria-label="البانر الإعلاني الرئيسي" onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="hero-ad-stage"><HeroCreative key={ads[activeIndex].id} ad={ads[activeIndex]} paused={paused} onPlaying={setPlaying}/></div>
    <div className="hero-ad-controls"><button type="button" onClick={() => setManualPause((v) => !v)} aria-label={manualPause ? "تشغيل الإعلانات" : "إيقاف الإعلانات"} aria-pressed={manualPause}>{manualPause ? <Play size={16}/> : <Pause size={16}/>}</button>{ads.length > 1 && <><button type="button" onClick={() => { setPlaying(false); setIndex((i) => (i - 1 + ads.length) % ads.length); }} aria-label="الإعلان السابق"><ChevronRight size={18}/></button><div className="hero-ad-dots">{ads.map((ad, i) => <button key={ad.id} type="button" aria-label={`عرض إعلان ${ad.businessName}`} aria-pressed={i === activeIndex} className={i === activeIndex ? "is-active" : ""} onClick={() => { setPlaying(false); setIndex(i); }}/>)}</div><button type="button" onClick={() => { setPlaying(false); setIndex((i) => (i + 1) % ads.length); }} aria-label="الإعلان التالي"><ChevronLeft size={18}/></button><span dir="ltr">{activeIndex + 1} / {ads.length}</span></>}<button type="button" className="hero-ad-book" onClick={onBook}>احجز إعلانك</button></div>
  </section>;
}

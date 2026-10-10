"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { ChevronLeft, MessageCircle, Phone, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/ui";
import { getContrastTextColor, isAdImageUrl, isAdVideoUrl, whatsappUrl, type AdRecord } from "@/lib/catalog";

// Administration-only ad preview. Public advertising surfaces were removed, so this file renders a
// static, non-interactive creative (inert actions, no impression/click tracking) inside the editor.
function AdMedia({ ad, onPlaying }: { ad: AdRecord; onPlaying?: (value: boolean) => void }) {
  const [failed, setFailed] = useState(false);
  if (ad.adType === "video" && ad.videoUrl && isAdVideoUrl(ad.videoUrl) && !failed) return <video className="campaign-video" src={ad.videoUrl} poster={isAdImageUrl(ad.imageUrl) ? ad.imageUrl || undefined : undefined} controls playsInline preload="none" onPlay={() => onPlaying?.(true)} onPause={() => onPlaying?.(false)} onEnded={() => onPlaying?.(false)} onError={() => { setFailed(true); onPlaying?.(false); }} aria-label={`فيديو إعلان ${ad.businessName}`}/>;
  if (ad.imageUrl && isAdImageUrl(ad.imageUrl) && !failed) return <Image src={ad.imageUrl} alt={ad.businessName} fill unoptimized sizes="(max-width: 600px) 90vw, 40vw" onError={() => setFailed(true)}/>;
  return <span className="campaign-art-icon" aria-hidden="true"><CategoryIcon icon={ad.icon || "Store"} size={88}/></span>;
}
function AdActions({ ad, detailsFirst = false }: { ad: AdRecord; detailsFirst?: boolean }) {
  const details = ad.destinationUrl && isAdImageUrl(ad.destinationUrl);
  return <div className="campaign-actions" inert>
    {detailsFirst && details && <a className="campaign-cta" href={ad.destinationUrl}>عرض التفاصيل <ChevronLeft size={16}/></a>}
    <a className={`campaign-cta ${detailsFirst && details ? "campaign-cta-quiet" : "campaign-call"}`} href={`tel:${ad.phone}`}><Phone size={16}/>اتصل الآن</a>
    <a className="campaign-secondary" href={whatsappUrl(ad.whatsappPhone || ad.phone)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${ad.businessName}`}><MessageCircle size={18}/></a>
    {!detailsFirst && details && <a className="campaign-details" href={ad.destinationUrl}>عرض التفاصيل <ChevronLeft size={14}/></a>}
  </div>;
}
function creativeStyle(ad: AdRecord): CSSProperties {
  const color = /^#[0-9a-f]{6}$/i.test(ad.backgroundColor) ? ad.backgroundColor : "#ccecff";
  return { "--campaign-bg": color, "--campaign-fg": getContrastTextColor(color) } as CSSProperties;
}
function CampaignCard({ ad }: { ad: AdRecord }) {
  return <article className="campaign-card campaign-visible" style={creativeStyle(ad)} data-ad-id={ad.id}>
    <span className="campaign-sponsored"><Sparkles size={13}/>إعلان مميز · Sponsored</span>
    <div className="campaign-card-media"><AdMedia key={`${ad.adType}:${ad.imageUrl}:${ad.videoUrl}`} ad={ad}/></div>
    <h3>{ad.businessName}</h3><p>{ad.text}</p>{ad.offerText && <strong className="campaign-offer">{ad.offerText}</strong>}
    <AdActions ad={ad} detailsFirst/>
  </article>;
}
function HeroCreative({ ad, onPlaying }: { ad: AdRecord; onPlaying?: (value: boolean) => void }) {
  return <article className="hero-campaign campaign-paused" style={creativeStyle(ad)} data-ad-id={ad.id}>
    <div className="hero-campaign-media"><AdMedia key={`${ad.adType}:${ad.imageUrl}:${ad.videoUrl}`} ad={ad} onPlaying={onPlaying}/></div>
    <div className="hero-campaign-copy"><span className="campaign-sponsored"><Sparkles size={14}/>إعلان مدفوع مميز</span><h2>{ad.businessName}</h2><p>{ad.text}</p>{ad.offerText && <strong className="campaign-offer">{ad.offerText}</strong>}<AdActions ad={ad}/></div>
  </article>;
}
export function CampaignPreview({ ad }: { ad: AdRecord }) { return <div className="campaign-preview">{ad.placement === "hero" ? <HeroCreative ad={ad}/> : <CampaignCard ad={ad}/>}</div>; }

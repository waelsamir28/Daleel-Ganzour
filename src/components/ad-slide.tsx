"use client";

import { useState, type CSSProperties } from "react";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { CategoryIcon, HighlightedAdText } from "@/components/ui";
import { AD_SLIDE_DURATION_MS, getAdMotion, isAdImageUrl, whatsappUrl, type AdRecord } from "@/lib/catalog";

type AdSlideProps = {
  ad: Pick<AdRecord, "businessName" | "text" | "phone" | "highlightWord"> & Partial<Pick<AdRecord, "motion" | "imageUrl">>;
  icon: string;
  style: CSSProperties;
  label: string;
  paused?: boolean;
  preview?: boolean;
  onCycle?: () => void;
};

function AdArtwork({ imageUrl, icon }: { imageUrl: string; icon: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="ad-art-object">
    {imageUrl && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)}/>
    ) : <CategoryIcon icon={icon} size={58}/>}
  </span>;
}

export default function AdSlide({ ad, icon, style, label, paused = false, preview = false, onCycle }: AdSlideProps) {
  const motion = getAdMotion(ad.motion);
  const imageUrl = ad.imageUrl && isAdImageUrl(ad.imageUrl) ? ad.imageUrl : "";
  return <article
    className={`ad-slide ad-motion-${motion}${preview ? " ad-design-preview-card" : ""}`}
    data-motion-paused={paused}
    style={{ ...style, "--ad-motion-duration": `${AD_SLIDE_DURATION_MS}ms` } as CSSProperties}
    aria-roledescription={preview ? undefined : "إعلان"}
    aria-label={label}
  >
    <div className="ad-slide-copy">
      <span className="ad-slide-approved"><BadgeCheck /> إعلان معتمد</span>
      <h3 onAnimationIteration={onCycle}>{ad.businessName}</h3>
      <p><HighlightedAdText text={ad.text} word={ad.highlightWord}/></p>
      {preview ? <span className="ad-slide-contact"><MessageCircle /> تواصل عبر واتساب</span> : (
        <a className="ad-slide-contact" href={whatsappUrl(ad.phone)} target="_blank" rel="noopener noreferrer">
          <MessageCircle /> تواصل عبر واتساب <span dir="ltr">{ad.phone}</span>
        </a>
      )}
    </div>
    <div className="ad-slide-art" aria-hidden="true">
      <AdArtwork key={imageUrl} imageUrl={imageUrl} icon={icon}/>
      <small>نشاط من جنزور</small>
    </div>
  </article>;
}

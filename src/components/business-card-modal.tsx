"use client";

import { useState, type CSSProperties } from "react";
import { Award, Check, Clipboard, MapPin, MessageCircle, Phone, Printer, QrCode, Share2, ShieldCheck, Star, X } from "lucide-react";
import { getServiceTrustBadges, whatsappUrl, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon, Modal } from "@/components/ui";

function DeterministicQrSvg({ value }: { value: string }) {
  // Deterministic 21x21 QR-style matrix with standard finder patterns so it renders cleanly even offline.
  const size = 21;
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Hash value into remaining modules
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 ||
        c === 6;
      if (inFinder) continue;
      const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
      const charCode = value.charCodeAt((r * size + c) % Math.max(1, value.length)) || 7;
      cells[r][c] = ((seed + charCode) & 3) === 0 || ((seed ^ charCode) & 5) === 1;
    }
  }

  return (
    <svg viewBox={`0 0 ${size + 2} ${size + 2}`} className="business-card-qr-svg" role="img" aria-label="رمز الاستجابة السريع QR">
      <rect width={size + 2} height={size + 2} rx="1.5" fill="#ffffff" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width={1} height={1} fill="#0c2238" rx="0.15" /> : null,
        ),
      )}
    </svg>
  );
}

export default function BusinessCardModal({
  service,
  category,
  siteName,
  now,
  onClose,
}: {
  service: ServiceRecord;
  category: CategoryRecord;
  siteName: string;
  now: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qrImgFailed, setQrImgFailed] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  const directUrl = `${origin}/?service=${encodeURIComponent(service.id)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(directUrl)}`;
  const badges = getServiceTrustBadges(service, now);
  const score = Number.parseFloat(service.rating) || 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  }

  async function shareCard() {
    const shareText = `🪪 كارت مهني من ${siteName}\n━━━━━━━━━━━━━━\n👤 ${service.name}\n🏷️ التخصص: ${category.name}\n📍 العنوان: ${service.address || service.area}\n📞 الهاتف: ${service.phone}${service.phoneSecondary ? ` - ${service.phoneSecondary}` : ""}\n🔗 رابط الكارت المباشر:\n${directUrl}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${service.name} — ${category.name}`, text: shareText, url: directUrl });
        return;
      } catch {
        // Fallback to WhatsApp share
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  function printCard() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <Modal
      floating
      title="بطاقة العمل الرقمية ورمز QR"
      subtitle={`${service.name} • ${category.name}`}
      onClose={onClose}
    >
      <div className="business-card-modal-wrap">
        <article
          className="provider-business-card"
          style={{ "--cat": category.color, "--cat-light": category.light } as CSSProperties}
        >
          <div className="provider-business-card-ribbon">
            <div className="provider-business-card-brand">
              <strong>{siteName}</strong>
              <span>بطاقة مهني معتمدة بقرية جنزور</span>
            </div>
            <span className="provider-business-card-cat-pill">
              <CategoryIcon icon={category.icon} size={15} />
              <span>{category.name}</span>
            </span>
          </div>

          <div className="provider-business-card-body">
            <div className="provider-business-card-info">
              <div className="provider-business-card-title-row">
                <h3>{service.name}</h3>
                {service.verified && (
                  <span className="provider-business-card-verified">
                    <ShieldCheck size={14} /> موثّق
                  </span>
                )}
              </div>

              <div className="provider-business-card-rating">
                <span className="stars">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <Star key={step} size={13} fill={step <= Math.round(score || 5) ? "currentColor" : "none"} />
                  ))}
                </span>
                <strong>{score > 0 ? score.toFixed(1) : "جديد"}</strong>
                {service.reviews > 0 && <small>({service.reviews} تقييم)</small>}
              </div>

              {service.description && (
                <p className="provider-business-card-desc">{service.description}</p>
              )}

              <div className="provider-business-card-contacts">
                <div className="provider-business-card-contact-item">
                  <MapPin size={15} />
                  <span>{service.address || service.area}</span>
                </div>
                <div className="provider-business-card-contact-item is-phone">
                  <Phone size={15} />
                  <strong dir="ltr">{service.phone}</strong>
                  {service.phoneSecondary && <span dir="ltr">/ {service.phoneSecondary}</span>}
                </div>
              </div>

              {badges.length > 0 && (
                <div className="provider-business-card-badges">
                  {badges.map((badge) => (
                    <span key={badge.id} className={`trust-badge is-${badge.tone}`}>
                      <Award size={11} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="provider-business-card-qr-box">
              <div className="provider-business-card-qr-frame">
                {!qrImgFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element -- External QR image with automatic SVG fallback
                  <img
                    src={qrApiUrl}
                    alt={`رمز QR لـ ${service.name}`}
                    width={140}
                    height={140}
                    onError={() => setQrImgFailed(true)}
                  />
                ) : (
                  <DeterministicQrSvg value={directUrl} />
                )}
              </div>
              <span className="provider-business-card-qr-caption">
                <QrCode size={13} /> امسح الرمز لفتح الكارت
              </span>
            </div>
          </div>
        </article>

        <div className="business-card-actions">
          <button type="button" className="button button-primary button-small" onClick={() => void shareCard()}>
            <Share2 size={16} /> مشاركة الكارت
          </button>
          <a
            href={whatsappUrl(service.phone, `مرحباً ${service.name}، وصلت إلى بطاقتك الرقمية في دليل جنزور.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-whatsapp button-small"
          >
            <MessageCircle size={16} /> واتساب المهني
          </a>
          <button type="button" className="button button-soft button-small" onClick={() => void copyLink()}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            <span>{copied ? "تم نسخ الرابط" : "نسخ رابط الكارت"}</span>
          </button>
          <button type="button" className="button button-soft button-small" onClick={printCard}>
            <Printer size={16} /> طباعة الكارت
          </button>
          <button type="button" className="button button-soft button-small" onClick={onClose}>
            <X size={16} /> إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}

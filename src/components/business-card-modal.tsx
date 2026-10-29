"use client";

import { useState, type CSSProperties } from "react";
import { Award, Check, Clipboard, MapPin, MessageCircle, Phone, Printer, QrCode, Share2, ShieldCheck, Star, UserPlus, X } from "lucide-react";
import { getServiceTrustBadges, servicePhotoUrl, whatsappUrl, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { saveVCard, serviceVCard } from "@/lib/vcard";
import { CategoryIcon, Modal } from "@/components/ui";
import QrSvg from "@/components/qr-svg";

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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  const directUrl = `${origin}/?service=${encodeURIComponent(service.id)}`;
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

  const [savedContact, setSavedContact] = useState(false);
  async function saveContact() {
    await saveVCard(serviceVCard(service, category, siteName, origin), service.name);
    setSavedContact(true); window.setTimeout(() => setSavedContact(false), 1800);
  }

  function printCard() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <Modal
      floating
      className="modal-quiet-scroll"
      title="بطاقة العمل الرقمية ورمز QR"
      subtitle={`${service.name} • ${category.name}`}
      onClose={onClose}
    >
      <div className="business-card-modal-wrap circle-host">
        <article
          className="provider-business-card provider-business-card-v2"
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
                <span className={`provider-business-card-avatar ${servicePhotoUrl(service) ? "has-photo" : ""}`} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {servicePhotoUrl(service) ? <img src={servicePhotoUrl(service)} alt="" /> : <CategoryIcon icon={category.icon} size={22} />}
                </span>
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
                <QrSvg value={directUrl} size={140} className="business-card-qr-svg" label={`رمز QR لـ ${service.name}`}/>
              </div>
              <span className="provider-business-card-qr-caption">
                <QrCode size={13} /> امسح الرمز لفتح الكارت
              </span>
            </div>
          </div>
        </article>

        <div className="business-card-actions circle-tools is-row" role="group" aria-label="إجراءات بطاقة العمل">
          <button type="button" className="circle-tool is-share" data-tip="مشاركة الكارت" aria-label="مشاركة الكارت" onClick={() => void shareCard()}>
            <Share2 size={16} />
          </button>
          <a
            href={whatsappUrl(service.phone, `مرحباً ${service.name}، وصلت إلى بطاقتك الرقمية في دليل جنزور.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="circle-tool is-whatsapp"
            data-tip="واتساب المهني"
            aria-label="واتساب المهني"
          >
            <MessageCircle size={16} />
          </a>
          <button type="button" className={`circle-tool is-copy ${copied ? "is-active" : ""}`} data-tip={copied ? "تم نسخ الرابط ✓" : "نسخ رابط الكارت"} aria-label={copied ? "تم نسخ الرابط" : "نسخ رابط الكارت"} onClick={() => void copyLink()}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
          </button>
          <button type="button" className={`circle-tool is-contact ${savedContact ? "is-active" : ""}`} data-tip={savedContact ? "تم تجهيز جهة الاتصال ✓" : "احفظ في جهات الاتصال"} aria-label="احفظ الرقم في جهات الاتصال" onClick={() => void saveContact()}>
            {savedContact ? <Check size={16} /> : <UserPlus size={16} />}
          </button>
          <button type="button" className="circle-tool is-print" data-tip="طباعة الكارت" aria-label="طباعة الكارت" onClick={printCard}>
            <Printer size={16} />
          </button>
          <button type="button" className="circle-tool is-close" data-tip="إغلاق" aria-label="إغلاق" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

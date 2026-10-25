"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Check, Copy, Heart, MapPin, MessageCircle, Pencil, PhoneCall, Share2, ShieldCheck, Star, MessageSquareWarning } from "lucide-react";
import { isNewService, serviceWhatsappMessage, whatsappUrl, type CategoryRecord, type ProviderEdgeToolId, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon, SpecialtyIcon } from "@/components/ui";
import { trackDirectoryEvent } from "@/lib/analytics-tracker";

// Category colours reach the card icon through CSS custom properties.
export function categoryTheme(item: CategoryRecord) {
  return { "--cat": item.color, "--cat-light": item.light } as CSSProperties;
}

// Five gold stars summarise the stored rating; reviews stay as a plain count.
export function ProviderRating({ value, reviews }: { value: string; reviews?: number }) {
  const score = Number.parseFloat(value);
  const filled = Number.isFinite(score) ? Math.min(5, Math.max(0, Math.round(score))) : 0;
  return <span className="provider-rating"><span className="rating-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map((step) => <Star key={step} size={14} className={step <= filled ? "is-on" : ""} fill={step <= filled ? "currentColor" : "none"}/>)}</span>{Number.isFinite(score) && score > 0 ? <strong>{score.toFixed(1)}</strong> : <strong>جديد</strong>}{reviews !== undefined && reviews > 0 && <span>({reviews} تقييم)</span>}</span>;
}

type ProviderCardProps = {
  /** عرض أيقونة التخصص المجسّمة (3D) بدل المسطحة. */
  art3d?: boolean;
  service: ServiceRecord;
  category: CategoryRecord;
  favorite: boolean;
  now: number;
  showAdminQuickEdit?: boolean;
  edgeTools: ProviderEdgeToolId[];
  onOpen: (service: ServiceRecord) => void;
  onOpenCompletion?: (service: ServiceRecord) => void;
  /** Design-studio preview: tools always visible, card does not open anything. */
  preview?: boolean;
  onShare: (service: ServiceRecord) => void;
  onSuggest?: (service: ServiceRecord) => void;
  onToggleFavorite: (id: string) => void;
};
// Restored classic provider card with Share & Favorite icons on the left and two action buttons («اتصال» & «واتساب») that both open the provider detail page.
export default function ProviderCard({ service, category, favorite, now, showAdminQuickEdit, edgeTools, preview, art3d = false, onOpen, onShare, onSuggest, onToggleFavorite }: ProviderCardProps) {
  const [copied, setCopied] = useState(false);
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(service.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("انسخ الرقم:", service.phone);
    }
  }
  return (
    <article
      className={`provider-card ${preview ? "is-preview" : ""}`}
      data-service-id={service.id}
      role="button"
      tabIndex={0}
      aria-label={`عرض تفاصيل ${service.name}`}
      style={categoryTheme(category)}
      onClick={() => onOpen(service)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(service);
        }
      }}
    >
      {isNewService(service, now) && <span className="new-flag">جديد</span>}
      <div className="provider-card-main">
        <span className={`provider-card-icon ${art3d ? "has-profession-art" : ""}`} aria-hidden="true">
          {art3d ? <SpecialtyIcon category={category} size={40} art3d/> : <CategoryIcon icon={category.icon} size={26}/>}
        </span>
        <div className="provider-card-copy">
          <h3 className="provider-name">{service.name}</h3>
          <span className="provider-specialty">{category.name}</span>
          <ProviderRating value={service.rating} reviews={service.reviews}/>
          {(service.address || service.area) && (
            <span className="provider-address">
              <MapPin size={13}/>
              {service.address || service.area}
            </span>
          )}
          {service.weeklyStar && (
            <span className="provider-weekly-star" title="من أكثر مقدمي الخدمة تقييمًا هذا الأسبوع">
              <Star size={12}/> نجم الأسبوع
            </span>
          )}
          {service.verified && (
            <span className="provider-verified">
              <ShieldCheck size={13}/> تم التحقق بالمعاينة
            </span>
          )}
        </div>
      </div>
      {/* Edge tools: flat icons in translucent circles on the card edge, revealed on hover/focus
          (always faintly visible on touch screens). Order/visibility/position come from استوديو المظهر.
          اتصال/واتساب act directly; مشاركة/المفضلة act in place. */}
      {edgeTools.length > 0 && (
        <div className="provider-edge-tools" role="group" aria-label="أدوات سريعة">
          {edgeTools.map((tool) => {
            if (tool === "call") {
              return (
                <a
                  key={tool}
                  href={`tel:${service.phone}`}
                  className="edge-tool edge-tool-call"
                  data-tip="اتصال"
                  onClick={(event) => { event.stopPropagation(); if (preview) { event.preventDefault(); return; } trackDirectoryEvent({ kind: "call", label: service.name, serviceId: service.id, categoryId: service.category }); }}
                  aria-label={`اتصال بـ ${service.name}`}
                >
                  <PhoneCall size={15}/>
                </a>
              );
            }
            if (tool === "whatsapp") {
              return (
                <a
                  key={tool}
                  href={whatsappUrl(service.phone, serviceWhatsappMessage(service, category.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="edge-tool edge-tool-whatsapp"
                  data-tip="واتساب"
                  onClick={(event) => { event.stopPropagation(); if (preview) { event.preventDefault(); return; } trackDirectoryEvent({ kind: "whatsapp", label: service.name, serviceId: service.id, categoryId: service.category }); }}
                  aria-label={`واتساب ${service.name}`}
                >
                  <MessageCircle size={15}/>
                </a>
              );
            }
            if (tool === "copy") {
              return (
                <button
                  key={tool}
                  type="button"
                  className={`edge-tool edge-tool-copy ${copied ? "is-copied" : ""}`}
                  data-tip={copied ? "تم النسخ ✓" : "نسخ الرقم"}
                  onClick={(event) => { event.stopPropagation(); void copyPhone(); }}
                  aria-label={copied ? "تم نسخ الرقم" : `نسخ رقم ${service.name}`}
                  aria-live="polite"
                >
                  {copied ? <Check size={14}/> : <Copy size={14}/>}
                </button>
              );
            }
            if (tool === "suggest") {
              if (!onSuggest) return null;
              return (
                <button
                  key={tool}
                  type="button"
                  className="edge-tool edge-tool-suggest"
                  data-tip="اقترح تعديل"
                  onClick={(event) => { event.stopPropagation(); onSuggest(service); }}
                  aria-label={`اقترح تعديلًا على بيانات ${service.name}`}
                >
                  <MessageSquareWarning size={14}/>
                </button>
              );
            }
            if (tool === "share") {
              return (
                <button
                  key={tool}
                  type="button"
                  className="edge-tool edge-tool-share provider-share-button"
                  data-tip="مشاركة"
                  onClick={(event) => { event.stopPropagation(); onShare(service); }}
                  aria-label={`مشاركة ${service.name}`}
                >
                  <Share2 size={14}/>
                </button>
              );
            }
            return (
              <button
                key={tool}
                type="button"
                className={`edge-tool edge-tool-favorite favorite-button ${favorite ? "is-favorite" : ""}`}
                data-tip={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                onClick={(event) => { event.stopPropagation(); onToggleFavorite(service.id); }}
                aria-pressed={favorite}
                aria-label={favorite ? `إزالة ${service.name} من المفضلة` : `أضف ${service.name} للمفضلة`}
              >
                <Heart size={14} fill={favorite ? "currentColor" : "none"}/>
              </button>
            );
          })}
          {showAdminQuickEdit && (
            <Link
              href={`/admin?tab=directory&editService=${encodeURIComponent(service.id)}`}
              className="edge-tool edge-tool-admin provider-admin-edit-btn"
              data-tip="تعديل سريع"
              onClick={(event) => event.stopPropagation()}
              aria-label={`تعديل سريع لـ ${service.name} كأدمن`}
            >
              <Pencil size={13}/>
            </Link>
          )}
        </div>
      )}
      <div className="provider-action-dock" role="group" aria-label="طرق التواصل — تفتح صفحة مقدم الخدمة">
        <button
          type="button"
          className="provider-dock-btn provider-open-detail-call is-call"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(service);
          }}
          aria-label={`اتصال بـ ${service.name} — عرض صفحة مقدم الخدمة`}
        >
          <span className="provider-dock-icon"><PhoneCall size={16}/></span>
          <span className="provider-dock-copy">
            <strong>اتصال</strong>
            <small>عرض الرقم والتفاصيل</small>
          </span>
        </button>
        <span className="provider-dock-divider" aria-hidden="true"/>
        <button
          type="button"
          className="provider-dock-btn provider-open-detail-wa is-whatsapp"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(service);
          }}
          aria-label={`واتساب ${service.name} — عرض صفحة مقدم الخدمة`}
        >
          <span className="provider-dock-icon"><MessageCircle size={16}/></span>
          <span className="provider-dock-copy">
            <strong>واتساب</strong>
            <small>راسله من صفحته</small>
          </span>
        </button>
      </div>
    </article>
  );
}

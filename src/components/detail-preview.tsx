"use client";

import { useState } from "react";
import { Award, ChevronDown, ChevronLeft, ChevronUp, Heart, MapPin, MessageCircle, Phone, PhoneCall, Share2, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { getCategory, initialCategories } from "@/lib/catalog";
import { CategoryIcon, ServiceArt } from "@/components/ui";
import { categoryTheme, ProviderRating } from "@/components/provider-card";

// Static replica of the provider detail overlay (same class names → same CSS, same themes) for
// the design studio. Nothing here is interactive beyond the badge toggle and favourite heart.
export default function DetailPreview() {
  const [badgesOpen, setBadgesOpen] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const category = getCategory("electricity", initialCategories);
  const name = "أسطى محمد — كهربائي منازل";
  return (
    <div className="detail-preview-frame" aria-label="معاينة حية لصفحة مقدم الخدمة">
      <div className="modal-panel modal-floating detail-preview-panel">
        <div className="modal-heading">
          <div><h2>تفاصيل مقدم الخدمة</h2><p>{category.name} · جنزور</p></div>
          <span className="icon-button modal-close" aria-hidden="true"><X size={21}/></span>
        </div>
        <div className="modal-body">
          <header className="detail-v2-hero" style={categoryTheme(category)}>
            <span className="detail-v2-hero-glow" aria-hidden="true"/>
            <div className="detail-v2-hero-row">
              <span className="detail-v2-avatar" aria-hidden="true"><ServiceArt category={category.id} item={category}/></span>
              <div className="detail-v2-identity">
                <h3>{name}</h3>
                <span className="detail-v2-specialty"><CategoryIcon icon={category.icon} size={13}/>{category.name}</span>
                <div className="detail-v2-stars"><ProviderRating value="4.8" reviews={12}/></div>
              </div>
              <div className="detail-v2-side-actions" role="group" aria-label="المشاركة والمفضلة">
                <button type="button" className="detail-v2-icon-btn is-share" aria-label="مشاركة (معاينة)"><Share2 size={17}/></button>
                <button type="button" className={`detail-v2-icon-btn is-favorite ${favorite ? "is-active" : ""}`} aria-pressed={favorite} aria-label="المفضلة (معاينة)" onClick={() => setFavorite((value) => !value)}><Heart size={17} fill={favorite ? "currentColor" : "none"}/></button>
              </div>
            </div>
            <button type="button" className={`detail-v2-badges-toggle ${badgesOpen ? "is-open" : ""}`} aria-expanded={badgesOpen} onClick={() => setBadgesOpen((open) => !open)}>
              <Award size={14}/>
              <span>{badgesOpen ? "إخفاء الأوسمة" : "عرض الأوسمة والشارات"}</span>
              {badgesOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
            </button>
          </header>
          {badgesOpen && (
            <div className="details-badges detail-v2-badges">
              <span className="detail-verified"><ShieldCheck size={14}/>تم التحقق بالمعاينة</span>
              <span className="detail-open"><span/>متاح الآن</span>
              <span className="detail-new"><Sparkles size={14}/>جديد</span>
              <span className="detail-trust-badge is-amber"><Award size={14}/>موصى به من الأهالي</span>
            </div>
          )}
          <div className="detail-v2-facts" role="list">
            <div className="detail-v2-fact" role="listitem">
              <span className="detail-v2-fact-icon is-spec"><CategoryIcon icon={category.icon} size={17}/></span>
              <div><small>التخصص</small><strong>{category.name}</strong></div>
            </div>
            <div className="detail-v2-fact" role="listitem">
              <span className="detail-v2-fact-icon is-place"><MapPin size={17}/></span>
              <div><small>العنوان</small><strong>شارع المحطة بجوار الصيدلية</strong></div>
            </div>
            <div className="detail-v2-fact" role="listitem">
              <span className="detail-v2-fact-icon is-phone"><Phone size={17}/></span>
              <div><small>الهاتف</small><strong dir="ltr">0100 000 0000</strong></div>
            </div>
          </div>
          <div className="detail-popup-icons-bar detail-v2-triggers" role="group" aria-label="نوافذ التقييم">
            <span className="detail-popup-trigger-btn is-rating">
              <span className="detail-popup-trigger-icon"><Star size={19} fill="currentColor"/></span>
              <div className="detail-popup-trigger-copy"><strong>التقييمات وآراء الأهالي (12)</strong><small>اضغط لعرض التقييمات أو إضافة تقييمك</small></div>
              <ChevronLeft size={16}/>
            </span>
          </div>
          <div className="detail-actions detail-v2-actions">
            <span className="detail-v2-cta is-call">
              <span className="detail-v2-cta-icon"><PhoneCall size={20}/></span>
              <span className="detail-v2-cta-copy"><strong>اتصل الآن</strong><small dir="ltr">0100 000 0000</small></span>
            </span>
            <span className="detail-v2-cta is-whatsapp">
              <span className="detail-v2-cta-icon"><MessageCircle size={20}/></span>
              <span className="detail-v2-cta-copy"><strong>واتساب</strong><small>راسله مباشرة الآن</small></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  FlaskConical,
  Gift,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  X,
} from "lucide-react";
import { defaultDesignSettings, whatsappUrl, type DesignSettings } from "@/lib/catalog";

export default function SponsorshipModal({
  open,
  autoTriggered,
  designSettings,
  fallbackPhone,
  onClose,
}: {
  open: boolean;
  autoTriggered: boolean;
  designSettings?: DesignSettings;
  fallbackPhone: string;
  onClose: () => void;
}) {
  const ds = designSettings ?? defaultDesignSettings;
  const totalSeconds = Math.max(0, ds.sponsorModalDelaySeconds ?? 10);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => (autoTriggered ? totalSeconds : 0));

  useEffect(() => {
    if (!open) return;
    const initial = autoTriggered ? totalSeconds : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset countdown timer each time modal opens.
    setRemainingSeconds(initial);
    if (initial <= 0) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, autoTriggered, totalSeconds]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && remainingSeconds <= 0) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, remainingSeconds, onClose]);

  if (!open) return null;

  const canClose = remainingSeconds <= 0;
  const contactPhone = (ds.sponsorModalPhone || fallbackPhone || "01222355769").trim();
  const title = ds.sponsorModalTitle || defaultDesignSettings.sponsorModalTitle;
  const subtitle = ds.sponsorModalSubtitle || defaultDesignSettings.sponsorModalSubtitle;
  const offerBanner = ds.sponsorModalOfferBanner || defaultDesignSettings.sponsorModalOfferBanner;

  const trialWhatsappMsg =
    "مرحبًا إدارة دليل قرية جنزور، أرغب في تفعيل العرض المجاني لمدة ١٠ أيام في (باقة الرعاية والتميز) لعيادتي / معملي / محلي.";
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)) : 100;

  return (
    <div
      className="sponsor-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sponsor-modal-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget && canClose) {
          onClose();
        }
      }}
    >
      <div className="sponsor-modal-card">
        {/* Top Countdown / Close Bar */}
        <div className="sponsor-modal-topbar">
          <div className="sponsor-modal-badge-pill">
            <Crown size={18} />
            <span>مبادرة دعم وتمييز الأنشطة الطبية والتجارية بجنزور</span>
          </div>

          {canClose ? (
            <button
              type="button"
              className="sponsor-modal-close-btn"
              onClick={onClose}
              aria-label="إغلاق نافذة باقات الرعاية والتميز"
            >
              <X size={18} />
              <span>إغلاق والدخول للدليل</span>
            </button>
          ) : (
            <div className="sponsor-modal-timer-pill" aria-live="polite">
              <Clock size={16} className="sponsor-timer-spin" />
              <span>يظهر زر الإغلاق بعد {remainingSeconds} ثوانٍ</span>
            </div>
          )}
        </div>

        {!canClose && (
          <div className="sponsor-modal-progress-track" aria-hidden="true">
            <div className="sponsor-modal-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <div className="sponsor-modal-scroll-body">
          {/* Hero Header */}
          <header className="sponsor-hero-box">
            <div className="sponsor-hero-crown-ring">
              <Crown size={36} />
            </div>
            <h2 id="sponsor-modal-heading" className="sponsor-hero-title">
              {title}
            </h2>
            <p className="sponsor-hero-subtitle">
              <HeartHandshake size={20} className="sponsor-inline-icon" />
              <span>{subtitle}</span>
            </p>
          </header>

          {/* 10 Days Free Trial Highlight Banner */}
          <section className="sponsor-free-trial-banner" aria-label="عرض ١٠ أيام مجاناً">
            <div className="sponsor-trial-ribbon">
              <Gift size={24} />
              <span>مفاجأة وعرض خاص لأهل جنزور</span>
            </div>
            <h3 className="sponsor-trial-headline">
              🔥 ١٠ أيام تجربة مجانية كاملة للعيادات والمعامل والمحلات!
            </h3>
            <p className="sponsor-trial-text">{offerBanner}</p>
            <div className="sponsor-target-chips">
              <span className="sponsor-target-chip">
                <Stethoscope size={18} /> العيادات والأطباء والصيدليات
              </span>
              <span className="sponsor-target-chip">
                <FlaskConical size={18} /> معامل التحاليل ومراكز الأشعة
              </span>
              <span className="sponsor-target-chip">
                <Store size={18} /> المحلات والسوبر ماركت والمطاعم
              </span>
            </div>
          </section>

          {/* Features Grid */}
          <section className="sponsor-benefits-section">
            <h3 className="sponsor-section-heading">
              <Sparkles size={22} />
              <span>ماذا ستحصل عليه عند تفعيل «باقة الرعاية والتميز»؟</span>
            </h3>

            <div className="sponsor-benefits-grid">
              <article className="sponsor-benefit-card is-gold">
                <div className="sponsor-benefit-icon">
                  <Crown size={26} />
                </div>
                <div className="sponsor-benefit-body">
                  <h4>١. البرواز الذهبي المتوهج + شارة «راعي معتمد 👑»</h4>
                  <p>
                    يظهر كارت عيادتك أو معملك أو محلك بإطار ذهبي متوهج فاخر مع تاج «راعي معتمد بدليل جنزور» وتثبيت دائم في أول الصفوف قبل الجميع.
                  </p>
                </div>
              </article>

              <article className="sponsor-benefit-card is-fire">
                <div className="sponsor-benefit-icon">
                  <Flame size={26} />
                </div>
                <div className="sponsor-benefit-body">
                  <h4>٢. الظهور في قسم «عروض اليوم في جنزور 🔥» بالرئيسية</h4>
                  <p>
                    مساحة بارزة في قلب الصفحة الرئيسية لعرض خصوماتك وعروضك اليومية أو باقات التحاليل والكشف مع زر طلب وحجز فوري على الواتساب.
                  </p>
                </div>
              </article>

              <article className="sponsor-benefit-card is-sky">
                <div className="sponsor-benefit-icon">
                  <Megaphone size={26} />
                </div>
                <div className="sponsor-benefit-body">
                  <h4>٣. إعلان متحرك باسمك في «الشريط الإخباري العلوي»</h4>
                  <p>
                    خبر ترحيبي وإعلاني باسم عيادتك أو معملك أو محلك يتحرك في الشريط الإخباري أعلى الموقع ليراه كل أهالي القرية فور دخولهم الدليل.
                  </p>
                </div>
              </article>

              <article className="sponsor-benefit-card is-emerald">
                <div className="sponsor-benefit-icon">
                  <Star size={26} />
                </div>
                <div className="sponsor-benefit-body">
                  <h4>٤. حجز أونلاين للعيادات + منيو تفاعلي بالأسعار للمحلات والمعامل</h4>
                  <p>
                    نافذة حجز ومواعيد ذكية للعيادات، ومنيو أسعار تفاعلي يحسب الطلبات ويرسلها جاهزة لواتساب المحل أو المعمل مع كارت QR مطبوع.
                  </p>
                </div>
              </article>
            </div>
          </section>

          {/* Reach & Impact Strip (#2) */}
          <section className="sponsor-impact-strip" aria-label="أثر وظهور باقة الرعاية في جنزور">
            <div className="sponsor-impact-item">
              <strong>١٠٠٪</strong>
              <span>ظهور في أول الصفوف وأولوية نتائج البحث</span>
            </div>
            <div className="sponsor-impact-item">
              <strong>٢٤ / ٧</strong>
              <span>إعلان متحرك وعرض يومي مستمر طوال الأسبوع</span>
            </div>
            <div className="sponsor-impact-item">
              <strong>١٠ أيام</strong>
              <span>تجربة مجانية كاملة بدون أي التزام مسبق</span>
            </div>
          </section>

          {/* Sponsor Testimonials (#4) */}
          <section className="sponsor-testimonials-box" aria-label="تجارب الرعاة المشتركين">
            <h4 className="sponsor-testimonials-title">
              <Star size={18} />
              <span>لماذا يفضل أطباء ومعامل ومحلات جنزور الانضمام لرعاة الدليل؟</span>
            </h4>
            <div className="sponsor-testimonials-grid">
              <div className="sponsor-testimonial-pill">
                <p>«الحجز عبر واتساب وعرض اليوم سهّل على أهالي القرية معرفة مواعيد العيادة والتواصل المباشر معنا يومياً.»</p>
                <small>— عيادات تخصصية بجنزور</small>
              </div>
              <div className="sponsor-testimonial-pill">
                <p>«الشريط الإخباري المتحرك وعروض التحاليل اليومية زوّدت طلبات سحب العينات المنزلية بشكل ملحوظ.»</p>
                <small>— معامل تحاليل ومراكز طبية</small>
              </div>
            </div>
          </section>

          {/* Reassurance Note */}
          <div className="sponsor-reassurance-note">
            <CheckCircle2 size={20} />
            <span>
              <strong>تنويه هام:</strong> التسجيل الأساسي في دليل قرية جنزور مجاني تماماً لوجه الله لكل المهن والحرفيين والمدرسين، وهذه الباقة اختيارية لدعم استمرار وتطوير الموقع مقابل خدمات دعائية وتقنية متقدمة.
            </span>
          </div>

          {/* Stylish Phone & WhatsApp Contact Card */}
          <section className="sponsor-contact-showcase" aria-label="أرقام التواصل والاشتراك">
            <div className="sponsor-contact-header">
              <h4>📞 تواصل معنا الآن وفَعّل الـ ١٠ أيام المجانية فوراً</h4>
              <p>يسعدنا تواصلك المباشر عبر الهاتف أو الواتساب لتفعيل باقة التميز لعيادتك أو معملك أو محلك في دقائق:</p>
            </div>

            <div className="sponsor-phone-number-box" dir="ltr">
              <span className="sponsor-phone-badge">واتساب واتصال مباشر</span>
              <strong className="sponsor-phone-digits">{contactPhone}</strong>
            </div>

            <div className="sponsor-contact-actions">
              <a
                className="sponsor-action-btn is-whatsapp"
                href={whatsappUrl(contactPhone, trialWhatsappMsg)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={22} />
                <span>اشترك وفعّل ١٠ أيام مجاناً عبر واتساب</span>
              </a>

              <a className="sponsor-action-btn is-call" href={`tel:${contactPhone}`}>
                <Phone size={21} />
                <span>اتصال هاتفي مباشر الآن</span>
              </a>
            </div>
          </section>
        </div>

        {/* Footer Close Button (Appears after 10s when auto-triggered) */}
        <footer className="sponsor-modal-footer">
          {canClose ? (
            <button type="button" className="sponsor-footer-close-btn" onClick={onClose}>
              <X size={20} />
              <span>إغلاق النافذة وتصفح دليل قرية جنزور</span>
            </button>
          ) : (
            <div className="sponsor-footer-waiting">
              <Clock size={18} />
              <span>يرجى الانتظار {remainingSeconds} ثوانٍ لظهور زر الإغلاق والدخول للدليل...</span>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

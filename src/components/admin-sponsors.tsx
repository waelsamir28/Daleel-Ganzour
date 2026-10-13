"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Crown,
  Eye,
  Flame,
  Gift,
  LoaderCircle,
  Megaphone,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  defaultDesignSettings,
  getCategory,
  parseSponsoredProviders,
  whatsappUrl,
  type CategoryRecord,
  type DesignSettings,
  type ServiceRecord,
  type SponsoredProviderConfig,
} from "@/lib/catalog";
import SponsorshipModal from "@/components/sponsorship-modal";

export default function AdminSponsors({
  services,
  categories,
  designSettings,
  fallbackPhone,
  onSaveDesign,
}: {
  services: ServiceRecord[];
  categories: CategoryRecord[];
  designSettings?: DesignSettings;
  fallbackPhone: string;
  onSaveDesign: (values: DesignSettings) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<DesignSettings>(() => ({
    ...defaultDesignSettings,
    ...(designSettings ?? {}),
  }));
  const [sponsors, setSponsors] = useState<SponsoredProviderConfig[]>(() =>
    parseSponsoredProviders(designSettings?.sponsoredProvidersJson ?? defaultDesignSettings.sponsoredProvidersJson),
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const approvedServices = useMemo(
    () => services.filter((s) => s.status === "approved"),
    [services],
  );

  function updateField<K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) {
    setDraft((curr) => ({ ...curr, [key]: value }));
  }

  function updateSponsor(index: number, patch: Partial<SponsoredProviderConfig>) {
    setSponsors((curr) =>
      curr.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  }

  function removeSponsor(index: number) {
    setSponsors((curr) => curr.filter((_, idx) => idx !== index));
  }

  function addSponsorFromService() {
    const found = approvedServices.find((item) => item.id === selectedServiceId);
    if (!found) {
      const today = new Date().toISOString().slice(0, 10);
      setSponsors((curr) => [
        {
          serviceId: `sponsor-${Date.now()}`,
          providerName: "اسم العيادة أو المعمل أو المحل",
          categoryName: "العيادات والمعامل والمحلات",
          phone: draft.sponsorModalPhone || fallbackPhone,
          active: true,
          planType: "trial-10-days",
          badgeLabel: "راعي معتمد 👑",
          dailyOfferTitle: "خصم خاص لأهالي قرية جنزور بمناسبة الانضمام لباقة التميز",
          dailyOfferDiscount: "خصم ٢٠٪ 🔥",
          tickerAdText: "👑 أهلاً بكم لدى راعي الدليل المعتمد — خدمات متميزة وعروض خاصة لأهالي جنزور",
          trialStartDate: today,
        },
        ...curr,
      ]);
      return;
    }

    const cat = getCategory(found.category, categories);
    const today = new Date().toISOString().slice(0, 10);
    setSponsors((curr) => [
      {
        serviceId: found.id,
        providerName: found.name,
        categoryName: cat.name,
        phone: found.phone || found.phoneSecondary || fallbackPhone,
        active: true,
        planType: "trial-10-days",
        badgeLabel: "راعي معتمد 👑",
        dailyOfferTitle: `عرض خاص من ${found.name} (${cat.name}) لأهالي قرية جنزور — تواصل الآن عبر واتساب`,
        dailyOfferDiscount: "عرض اليوم 🔥",
        tickerAdText: `👑 ${found.name} (${cat.name} - ${found.area}): راعي معتمد بدليل قرية جنزور — تواصل ومواعيد وطلبات مباشرة`,
        trialStartDate: today,
      },
      ...curr.filter((item) => item.serviceId !== found.id),
    ]);
    setSelectedServiceId("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const nextDesign: DesignSettings = {
        ...draft,
        sponsoredProvidersJson: JSON.stringify(sponsors),
      };
      setDraft(nextDesign);
      await onSaveDesign(nextDesign);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="settings-form settings-formatted-page" onSubmit={handleSave}>
      {/* Banner */}
      <div className="settings-page-banner sponsor-admin-banner">
        <span className="settings-banner-icon sponsor-admin-icon">
          <Crown size={26} />
        </span>
        <h3>👑 إدارة باقات الرعاية والتميز (العيادات • المعامل • المحلات)</h3>
        <p>
          تحكم كامل في الشاشة العائمة لباقات الرعاية التي تظهر بعد اللوجو لمدة ١٠ ثوانٍ، وتفعيل المميزات الذهبية (رقم ٧: عروض اليوم • رقم ٨: البرواز الذهبي وشارة راعي معتمد • رقم ٩: إعلان الشريط المتحرك).
        </p>
        <div style={{ marginTop: 10, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button-amber"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={18} />
            <span>معاينة شاشة «باقات الرعاية والتميز» العائمة الآن</span>
          </button>
        </div>
      </div>

      {/* Section 1: Floating Modal Settings */}
      <div className="admin-Visual-divider" role="separator">
        <span>
          <Sparkles size={15} /> القسم ١: إعدادات الشاشة العائمة «باقات الرعاية والتميز» (بعد اللوجو مباشرة)
        </span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>التحكم في ظهور ونصوص شاشة باقات الرعاية والتميز</h4>
          <p>تظهر تلقائياً بتأثير Fade-In بعد شاشة اللوجو وتظل لمدة ١٠ ثوانٍ قبل ظهور زر الإغلاق</p>
        </div>

        <div className="settings-items-grid">
          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="sponsor-auto-open">
              ١. الظهور التلقائي بعد اللوجو عند فتح الموقع
            </label>
            <small className="settings-item-hint">تفتح الشاشة العائمة تلقائياً بعد اللوجو مباشرة</small>
            <div className="settings-toggle-textbox-row">
              <input
                id="sponsor-auto-open"
                type="text"
                readOnly
                className={`studio-textbox is-status-textbox ${draft.sponsorModalEnabled ? "is-on" : "is-off"}`}
                value={draft.sponsorModalEnabled ? "✅ مفعّل — تظهر بعد اللوجو مباشرة" : "⏸️ متوقف — تفتح من زر الرئيسية فقط"}
                onClick={() => updateField("sponsorModalEnabled", !draft.sponsorModalEnabled)}
              />
              <button
                type="button"
                className={`button button-small ${draft.sponsorModalEnabled ? "button-primary" : "button-soft"}`}
                onClick={() => updateField("sponsorModalEnabled", !draft.sponsorModalEnabled)}
              >
                {draft.sponsorModalEnabled ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="sponsor-delay-seconds">
              ٢. مدة بقاء الشاشة قبل ظهور زر الإغلاق (بالثواني)
            </label>
            <small className="settings-item-hint">الافتراضي ١٠ ثوانٍ كما طلبت لجذب انتباه الزوار</small>
            <input
              id="sponsor-delay-seconds"
              type="number"
              min={0}
              max={60}
              className="studio-textbox"
              value={draft.sponsorModalDelaySeconds}
              onChange={(e) => updateField("sponsorModalDelaySeconds", Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="sponsor-modal-phone">
              ٣. رقم الهاتف والواتساب للاشتراك وتفعيل الـ ١٠ أيام
            </label>
            <small className="settings-item-hint">يظهر بتصميم فخم داخل الشاشة العائمة</small>
            <input
              id="sponsor-modal-phone"
              dir="ltr"
              className="studio-textbox"
              value={draft.sponsorModalPhone}
              onChange={(e) => updateField("sponsorModalPhone", e.target.value)}
              placeholder="01222355769"
            />
          </div>

          <div className="settings-item-box">
            <label className="settings-item-label" htmlFor="sponsor-daily-offers-toggle">
              ٤. قسم «عروض اليوم في جنزور 🔥» بالصفحة الرئيسية (ميزة #7)
            </label>
            <small className="settings-item-hint">عرض خصومات وعروض العيادات والمعامل والمحلات المشتركة</small>
            <div className="settings-toggle-textbox-row">
              <input
                id="sponsor-daily-offers-toggle"
                type="text"
                readOnly
                className={`studio-textbox is-status-textbox ${draft.showDailyOffersSection ? "is-on" : "is-off"}`}
                value={draft.showDailyOffersSection ? "✅ مفعّل وظاهر في الصفحة الرئيسية" : "⏸️ مخفي حالياً"}
                onClick={() => updateField("showDailyOffersSection", !draft.showDailyOffersSection)}
              />
              <button
                type="button"
                className={`button button-small ${draft.showDailyOffersSection ? "button-primary" : "button-soft"}`}
                onClick={() => updateField("showDailyOffersSection", !draft.showDailyOffersSection)}
              >
                {draft.showDailyOffersSection ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </div>

          <div className="settings-item-box is-full-span">
            <label className="settings-item-label" htmlFor="sponsor-modal-title">
              ٥. العنوان الرئيسي للشاشة العائمة
            </label>
            <input
              id="sponsor-modal-title"
              className="studio-textbox"
              value={draft.sponsorModalTitle}
              onChange={(e) => updateField("sponsorModalTitle", e.target.value)}
            />
          </div>

          <div className="settings-item-box is-full-span">
            <label className="settings-item-label" htmlFor="sponsor-modal-subtitle">
              ٦. رسالة الترحيب وتوضيح أن الدليل مجاني لوجه الله
            </label>
            <textarea
              id="sponsor-modal-subtitle"
              rows={2}
              className="studio-textbox"
              value={draft.sponsorModalSubtitle}
              onChange={(e) => updateField("sponsorModalSubtitle", e.target.value)}
            />
          </div>

          <div className="settings-item-box is-full-span">
            <label className="settings-item-label" htmlFor="sponsor-modal-offer">
              ٧. نص بنر «عرض ١٠ أيام مجاناً للعيادات والمعامل والمحلات»
            </label>
            <textarea
              id="sponsor-modal-offer"
              rows={2}
              className="studio-textbox"
              value={draft.sponsorModalOfferBanner}
              onChange={(e) => updateField("sponsorModalOfferBanner", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Section 2: Managing Sponsored Providers (#7, #8, #9) */}
      <div className="admin-Visual-divider" role="separator">
        <span>
          <Crown size={15} /> القسم ٢: تفعيل الرعاة والمشتركين (رقم ٧: عروض اليوم • رقم ٨: البرواز الذهبي • رقم ٩: الشريط المتحرك)
        </span>
      </div>

      <section className="settings-section-card">
        <div className="settings-section-head">
          <h4>إضافة وتفعيل باقة التميز لأي عيادة أو معمل أو محل</h4>
          <p>اختر مقدم الخدمة من الدليل أو أضف راعياً جديداً لتفعيل البرواز الذهبي وعرض اليوم وإعلان الشريط المتحرك فوراً</p>
        </div>

        <div className="sponsor-add-bar">
          <select
            className="studio-textbox"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            aria-label="اختر عيادة أو معمل أو محل من الدليل"
          >
            <option value="">— اختر عيادة أو معمل أو محل من الدليل أو اضغط إضافة مباشرة —</option>
            {approvedServices.map((srv) => {
              const cat = getCategory(srv.category, categories);
              return (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({cat.name} — {srv.area})
                </option>
              );
            })}
          </select>

          <button type="button" className="button button-primary" onClick={addSponsorFromService}>
            <Plus size={18} />
            <span>إضافة وتفعيل باقة التميز</span>
          </button>
        </div>

        <div className="sponsor-cards-admin-list">
          {sponsors.map((item, idx) => {
            const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
            const directLink = `${origin}/?service=${encodeURIComponent(item.serviceId)}#services`;
            const notifyWaMsg = `أهلاً بحضرتك في (${item.providerName}) 🌟\nتم تفعيل (${item.planType === "trial-10-days" ? "هدية التجربة المجانية لمدة ١٠ أيام" : "باقة الرعاية والتميز الذهبية 👑"}) لصفحتكم على دليل قرية جنزور:\n✅ البرواز الذهبي وشارة (${item.badgeLabel}) والظهور في أول الصفوف\n✅ عرضكم في قسم (عروض اليوم في جنزور 🔥)\n✅ إعلانكم في الشريط الإخباري المتحرك أعلى الموقع\n\nيمكنكم مشاهدة صفحتكم المميزة من الرابط:\n${directLink}`;

            return (
              <article
                key={`${item.serviceId}-${idx}`}
                className={`sponsor-admin-item-card ${item.active ? "is-active" : "is-inactive"}`}
              >
                <div className="sponsor-admin-item-head">
                  <div className="sponsor-admin-item-title">
                    <span className="sponsor-crown-pill">
                      <Crown size={15} /> {item.badgeLabel || "راعي معتمد 👑"}
                    </span>
                    <h5>{item.providerName || "راعي معتمد"}</h5>
                    <small>{item.categoryName}</small>
                  </div>

                  <div className="sponsor-admin-item-actions">
                    <button
                      type="button"
                      className={`button button-small ${item.active ? "button-success" : "button-soft"}`}
                      onClick={() => updateSponsor(idx, { active: !item.active })}
                    >
                      {item.active ? "✅ مفعل بالموقع" : "⏸️ متوقف"}
                    </button>

                    <a
                      className="button button-soft button-small"
                      href={whatsappUrl(item.phone || fallbackPhone, notifyWaMsg)}
                      target="_blank"
                      rel="noreferrer"
                      title="إرسال رسالة تفعيل الباقة عبر واتساب"
                    >
                      <MessageCircle size={15} />
                      <span>إبلاغ المشترك واتساب</span>
                    </a>

                    <button
                      type="button"
                      className="button button-danger-soft button-small"
                      onClick={() => removeSponsor(idx)}
                      aria-label="حذف من قائمة الرعاة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="settings-items-grid" style={{ marginTop: 12 }}>
                  <div className="settings-item-box">
                    <label className="settings-item-label">اسم العيادة / المعمل / المحل</label>
                    <input
                      className="studio-textbox"
                      value={item.providerName}
                      onChange={(e) => updateSponsor(idx, { providerName: e.target.value })}
                    />
                  </div>

                  <div className="settings-item-box">
                    <label className="settings-item-label">التخصص / القسم</label>
                    <input
                      className="studio-textbox"
                      value={item.categoryName}
                      onChange={(e) => updateSponsor(idx, { categoryName: e.target.value })}
                    />
                  </div>

                  <div className="settings-item-box">
                    <label className="settings-item-label">رقم هاتف وواتساب المشترك</label>
                    <input
                      dir="ltr"
                      className="studio-textbox"
                      value={item.phone}
                      onChange={(e) => updateSponsor(idx, { phone: e.target.value })}
                    />
                  </div>

                  <div className="settings-item-box">
                    <label className="settings-item-label">
                      <Gift size={14} /> نوع الباقة وتاريخ البدء
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className="studio-textbox"
                        value={item.planType}
                        onChange={(e) =>
                          updateSponsor(idx, {
                            planType: e.target.value === "monthly-vip" ? "monthly-vip" : "trial-10-days",
                          })
                        }
                      >
                        <option value="trial-10-days">🎁 تجربة مجانية ١٠ أيام</option>
                        <option value="monthly-vip">👑 اشتراك باقة التميز VIP</option>
                      </select>
                      <input
                        type="date"
                        className="studio-textbox"
                        style={{ maxWidth: 155 }}
                        value={item.trialStartDate}
                        onChange={(e) => updateSponsor(idx, { trialStartDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="settings-item-box">
                    <label className="settings-item-label">
                      <Crown size={14} /> شارة التميز على الكارت (ميزة #8)
                    </label>
                    <input
                      className="studio-textbox"
                      value={item.badgeLabel}
                      onChange={(e) => updateSponsor(idx, { badgeLabel: e.target.value })}
                      placeholder="راعي معتمد 👑"
                    />
                  </div>

                  <div className="settings-item-box">
                    <label className="settings-item-label">
                      <Flame size={14} /> شارة الخصم في «عروض اليوم» (ميزة #7)
                    </label>
                    <input
                      className="studio-textbox"
                      value={item.dailyOfferDiscount}
                      onChange={(e) => updateSponsor(idx, { dailyOfferDiscount: e.target.value })}
                      placeholder="خصم ٢٠٪ 🔥 أو حجز فوري 🩺"
                    />
                  </div>

                  <div className="settings-item-box is-full-span">
                    <label className="settings-item-label">
                      <Flame size={14} /> نص العرض الظاهر في قسم «عروض اليوم في جنزور 🔥» بالصفحة الرئيسية (ميزة #7)
                    </label>
                    <input
                      className="studio-textbox"
                      value={item.dailyOfferTitle}
                      onChange={(e) => updateSponsor(idx, { dailyOfferTitle: e.target.value })}
                      placeholder="اكتب تفاصيل العرض أو الخصم ليظهر في الصفحة الرئيسية..."
                    />
                  </div>

                  <div className="settings-item-box is-full-span">
                    <label className="settings-item-label">
                      <Megaphone size={14} /> نص الإعلان المتحرك في «الشريط الإخباري العلوي» (ميزة #9)
                    </label>
                    <input
                      className="studio-textbox"
                      value={item.tickerAdText}
                      onChange={(e) => updateSponsor(idx, { tickerAdText: e.target.value })}
                      placeholder="👑 اسم العيادة أو المعمل أو المحل — نص الإعلان المتحرك في أعلى الصفحة الرئيسية..."
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="settings-submit-bar">
        <button className="button button-primary settings-save-btn" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="spin" /> : <Check size={18} />}
          <span>حفظ جميع إعدادات باقات الرعاية والتميز</span>
        </button>
      </div>

      <SponsorshipModal
        open={previewOpen}
        autoTriggered={false}
        designSettings={{ ...draft, sponsoredProvidersJson: JSON.stringify(sponsors) }}
        fallbackPhone={fallbackPhone}
        onClose={() => setPreviewOpen(false)}
      />
    </form>
  );
}

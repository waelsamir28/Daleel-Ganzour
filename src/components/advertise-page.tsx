"use client";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarCheck, CheckCircle2, Clapperboard, Eye, LayoutTemplate, Megaphone, MessageCircle, MousePointerClick, Send, Smartphone, Sparkles, Upload, Users, Wallet } from "lucide-react";
import AdRotator from "@/components/ad-rotator";
import AdTemplateArt from "@/components/ad-template-art";
import DesignApplicator from "@/components/design-applicator";
import SelectField from "@/components/select-field";
import { Logo } from "@/components/ui";
import { adTemplates, advertiseRequestMessage, defaultAdPricing, defaultDesignSettings, formatEgp, getCategory, pickProviderOfWeek, whatsappUrl, type AdBannerRecord, type PublicDirectory, type Viewer } from "@/lib/catalog";

type Kind = "template" | "gif" | "design";
const kindLabels: Record<Kind, string> = { template: "قالب متحرك جاهز من التطبيق", gif: "عندي GIF جاهز", design: "محتاج تصميم إعلان" };

/** Public «أعلن معنا» landing page: live demo of the slot, benefits, EGP packages, templates, and a WhatsApp request form. */
export default function AdvertisePage({ data, viewer }: { data: PublicDirectory; viewer: Viewer }) {
  const design = { ...defaultDesignSettings, ...(data.designSettings ?? {}) };
  const pricing = data.adPricing ?? defaultAdPricing;
  const settings = data.settings;
  const approved = data.services.filter((service) => service.status === "approved");
  const roots = data.categories.filter((category) => !category.parentId && category.active);
  const weekly = useMemo(() => pickProviderOfWeek(data.services), [data.services]);
  const demoAds = useMemo<AdBannerRecord[]>(() => ["ad-space", "app-promo", "special-offer", "grand-opening"].map((template, index) => ({
    id: `demo-${template}`, title: template === "special-offer" ? "عيادة أو محل — اسم المعلن" : template === "grand-opening" ? "افتتاح جديد في جنزور" : "", caption: "", serviceId: null, whatsapp: "",
    active: true, startsAt: null, endsAt: null, sortOrder: index, durationSeconds: 5, imageMime: "", imageVersion: 1, hasImage: false, template, createdAt: "2026-01-01T00:00:00.000Z",
  })), []);

  const [form, setForm] = useState({ name: viewer.name ?? "", business: "", phone: viewer.phone ?? "", tier: pricing.tiers[0] ? `${pricing.tiers[0].label}|${pricing.tiers[0].days}` : "", kind: "template" as Kind, template: "special-offer", notes: "" });
  const [error, setError] = useState("");
  const tierOptions = [...pricing.tiers.map((tier) => ({ value: `${tier.label}|${tier.days}`, label: `${tier.label} (${tier.days} يوم) — ${formatEgp(tier.price)}` })), { value: "", label: "مش متأكد — محتاج استشارة" }];
  const selectedTier = pricing.tiers.find((tier) => `${tier.label}|${tier.days}` === form.tier) ?? null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (form.name.trim().length < 2) { setError("اكتب اسمك."); return; }
    if (!/^01[0-9]{9}$/.test(form.phone.replace(/\D/g, ""))) { setError("اكتب رقم موبايل مصري صحيح (11 رقمًا يبدأ بـ 01)."); return; }
    if (!settings.phone) { setError("رقم واتساب الإدارة غير مضبوط بعد."); return; }
    const message = advertiseRequestMessage({ siteName: settings.siteName, name: form.name, business: form.business, phone: form.phone, tier: selectedTier, kind: kindLabels[form.kind], template: form.kind === "template" ? form.template : "", notes: form.notes });
    window.open(whatsappUrl(settings.phone, message), "_blank", "noopener,noreferrer");
  }

  const quickHref = settings.phone ? whatsappUrl(settings.phone, `مرحبًا، أرغب في معرفة تفاصيل الإعلان المتحرك في ${settings.siteName}.`) : "";

  return <div className="adv-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>

    <main className="container adv-main">
      <section className="adv-hero">
        <span className="adv-eyebrow"><Megaphone size={14}/> أعلن معنا</span>
        <h1>إعلانك المتحرك قدّام كل أهل جنزور</h1>
        <p>مساحة إعلانية متحركة تظهر في الصفحة الرئيسية وكل الأقسام والتخصصات في {settings.siteName}. كل إعلان له زرار يفتح صفحتك في الدليل وزرار واتساب مباشر.</p>
        <div className="adv-stats">
          <span><Users size={16}/><b>+{data.memberCount.toLocaleString("ar-EG")}</b> عضو</span>
          <span><BadgeCheck size={16}/><b>+{approved.length.toLocaleString("ar-EG")}</b> مهنة وخدمة</span>
          <span><LayoutTemplate size={16}/><b>{roots.length.toLocaleString("ar-EG")}</b> قسم رئيسي</span>
        </div>
        <div className="adv-hero-actions">
          <a href="#adv-request" className="button button-primary"><Send size={17}/> اطلب إعلانك الآن</a>
          {quickHref && <a href={quickHref} target="_blank" rel="noopener noreferrer" className="button button-whatsapp"><MessageCircle size={17}/> واتساب الإدارة</a>}
        </div>
      </section>

      <section className="adv-section">
        <h2><Eye size={18}/> إعلانك هيظهر كده</h2>
        <p className="adv-section-sub">معاينة حيّة لنفس المساحة اللي بتظهر فوق زر البحث في كل صفحة. مرّر بإصبعك أو استنى التبديل التلقائي.</p>
        <div className="adv-demo"><AdRotator ads={demoAds} services={data.services} categories={data.categories} adminPhone={settings.phone} siteName={settings.siteName} logoUrl={design.headerLogoUrl} pricing={pricing} onOpenService={(service) => window.location.assign(`/?service=${service.id}`)}/></div>
      </section>

      <section className="adv-section">
        <h2><Sparkles size={18}/> ليه تعلن في الدليل؟</h2>
        <div className="adv-benefits">
          <article><span><Smartphone size={20}/></span><strong>في كل الصفحات</strong><p>الرئيسية وكل الأقسام والتخصصات — مش صفحة واحدة.</p></article>
          <article><span><MousePointerClick size={20}/></span><strong>زرار واتساب مباشر</strong><p>العميل يكلّمك بضغطة واحدة من غير ما يدوّر على رقمك.</p></article>
          <article><span><Users size={20}/></span><strong>جمهور من جنزور</strong><p>كل اللي بيشوف إعلانك من القرية — مفيش مشاهدات ضايعة.</p></article>
          <article><span><Clapperboard size={20}/></span><strong>قوالب متحركة جاهزة</strong><p>مش محتاج مصمم: اختار قالب واكتب اسمك وعرضك وخلاص.</p></article>
        </div>
      </section>

      <section className="adv-section" id="adv-prices">
        <h2><Wallet size={18}/> الباقات والأسعار بالجنيه المصري</h2>
        {pricing.enabled && pricing.tiers.length ? (
          <div className="adv-tiers">
            {pricing.tiers.map((tier, index) => (
              <article key={`${tier.label}-${tier.days}`} className={`adv-tier ${index === 1 ? "is-popular" : ""}`}>
                {index === 1 && <span className="adv-tier-flag">الأكثر طلبًا</span>}
                <strong>{tier.label}</strong>
                <b>{formatEgp(tier.price)}</b>
                <small>{tier.days.toLocaleString("ar-EG")} يوم عرض متواصل</small>
                <ul><li><CheckCircle2 size={14}/> يظهر في كل الصفحات</li><li><CheckCircle2 size={14}/> زر صفحتك في الدليل</li><li><CheckCircle2 size={14}/> زر واتساب مباشر</li></ul>
                <button type="button" className="button button-primary button-small" onClick={() => { setForm({ ...form, tier: `${tier.label}|${tier.days}` }); document.getElementById("adv-request")?.scrollIntoView({ behavior: "smooth" }); }}>اختار الباقة</button>
              </article>
            ))}
          </div>
        ) : <p className="adv-section-sub">الأسعار حسب المدة والمساحة — كلّمنا على واتساب وهنبعتلك العرض المناسب.</p>}
        {pricing.enabled && pricing.note && <p className="adv-note">{pricing.note}</p>}
      </section>

      <section className="adv-section">
        <h2><LayoutTemplate size={18}/> قوالب جاهزة تختار منها</h2>
        <p className="adv-section-sub">كل قالب متحرك ويتكتب عليه اسمك ووصفك. أو ابعتلنا GIF بتاعك (حتى ٣ ميجا، الأفضل 1200×400).</p>
        <div className="adv-templates">
          {adTemplates.filter((template) => !template.auto).map((template) => (
            <button type="button" key={template.id} className={`adv-template ${form.kind === "template" && form.template === template.id ? "is-selected" : ""}`} onClick={() => setForm({ ...form, kind: "template", template: template.id })}>
              <span className="adv-template-art"><AdTemplateArt template={template.id} siteName={settings.siteName} logoUrl={design.headerLogoUrl} pricing={pricing} compact/></span>
              <span>{template.name}</span>
            </button>
          ))}
        </div>
        {weekly && <p className="adv-weekly"><BadgeCheck size={14}/> مهني الأسبوع الحالي في الدليل: <b>{weekly.name}</b> ({getCategory(weekly.category, data.categories).name}) — يتم اختياره تلقائيًا من أعلى التقييمات، بدون مقابل.</p>}
      </section>

      <section className="adv-section">
        <h2><CalendarCheck size={18}/> إزاي تحجز؟</h2>
        <ol className="adv-steps">
          <li><b>١</b><div><strong>املأ الطلب أو كلّمنا واتساب</strong><p>اختار الباقة ونوع الإعلان وابعت.</p></div></li>
          <li><b>٢</b><div><strong>نجهّز الإعلان</strong><p>قالب جاهز في نفس اليوم، أو نستلم الـ GIF بتاعك، أو نصمّمه لك.</p></div></li>
          <li><b>٣</b><div><strong>ينزل في المساحة</strong><p>بعد تأكيد الدفع يظهر إعلانك فورًا لكل أهل جنزور.</p></div></li>
        </ol>
      </section>

      <section className="adv-section adv-request" id="adv-request">
        <h2><Send size={18}/> اطلب إعلانك</h2>
        <p className="adv-section-sub">الطلب بيتبعت لإدارة الدليل على واتساب برسالة جاهزة فيها كل التفاصيل.</p>
        <form className="adv-form" onSubmit={submit}>
          <label className="admin-ad-field"><span>اسمك</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={80} placeholder="الاسم بالكامل"/></label>
          <label className="admin-ad-field"><span>النشاط / اسم المحل أو العيادة</span><input value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} maxLength={120} placeholder="مثال: صيدلية النور"/></label>
          <label className="admin-ad-field"><span>رقم الموبايل (واتساب)</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} dir="ltr" inputMode="tel" maxLength={14} placeholder="01xxxxxxxxx" required/></label>
          <label className="admin-ad-field"><span>الباقة</span><SelectField value={form.tier} onChange={(event) => setForm({ ...form, tier: event.target.value })} options={tierOptions} aria-label="اختيار الباقة"/></label>
          <div className="admin-ad-field admin-ad-field-wide"><span>نوع الإعلان</span>
            <div className="adv-kinds" role="radiogroup">
              {(Object.keys(kindLabels) as Kind[]).map((kind) => <button type="button" key={kind} role="radio" aria-checked={form.kind === kind} className={form.kind === kind ? "is-active" : ""} onClick={() => setForm({ ...form, kind })}>{kind === "template" ? <LayoutTemplate size={15}/> : kind === "gif" ? <Upload size={15}/> : <Sparkles size={15}/>} {kindLabels[kind]}</button>)}
            </div>
          </div>
          {form.kind === "template" && <label className="admin-ad-field admin-ad-field-wide"><span>القالب</span><SelectField value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })} options={adTemplates.filter((template) => !template.auto).map((template) => ({ value: template.id, label: template.name }))} aria-label="اختيار القالب"/></label>}
          <label className="admin-ad-field admin-ad-field-wide"><span>ملاحظات (العرض، المدة المفضلة، أي تفاصيل)</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength={400} rows={3} placeholder="مثال: خصم ٢٠٪ على الكشف طوال رمضان"/></label>
          {error && <div className="form-error admin-ad-field-wide" role="alert">{error}</div>}
          <div className="adv-form-actions admin-ad-field-wide">
            <button type="submit" className="button button-whatsapp"><MessageCircle size={17}/> إرسال الطلب عبر واتساب</button>
            {selectedTier && <span className="adv-form-total">الإجمالي التقريبي: <b>{formatEgp(selectedTier.price)}</b> / {selectedTier.label}</span>}
          </div>
        </form>
      </section>

      <section className="adv-section">
        <h2>أسئلة شائعة</h2>
        <div className="adv-faq">
          <details><summary>هل لازم أكون عضوًا في الدليل؟</summary><p>الأفضل، عشان نربط الإعلان بصفحتك ويظهر زر «صفحته في الدليل». التسجيل مجاني من زر «أضف مهنتك».</p></details>
          <details><summary>إيه المقاس المناسب للـ GIF؟</summary><p>1200×400 بكسل (نسبة 3:1) وحجم حتى ٣ ميجا. لو مش متاح، اختار قالبًا جاهزًا ونكتب عليه بياناتك.</p></details>
          <details><summary>الإعلان يظهر فين بالظبط؟</summary><p>فوق إطار «بحث / أضف مهنتك» في الرئيسية وكل الأقسام والتخصصات — بيشوفه كل زائر.</p></details>
          <details><summary>هل أقدر أوقف الإعلان أو أغيّره؟</summary><p>أيوه، كلّم الإدارة على واتساب وبيتم التعديل أو الإيقاف فورًا.</p></details>
        </div>
      </section>
    </main>
  </div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Cake, Check, Copy, Globe, GraduationCap, Mail, MapPin, MessageCircle, Phone, QrCode, Share2, Star, UserPlus, UserRound, X } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import QrSvg from "@/components/qr-svg";
import { Logo } from "@/components/ui";
import { defaultDesignSettings, profileUrl, whatsappUrl, type DesignSettings, type PublicProfile, type SiteSettings } from "@/lib/catalog";
import { buildVCard, saveVCard } from "@/lib/vcard";
import { ownsService, useOwnership } from "@/lib/viewer-ownership";

/**
 * صفحة الملف الشخصي العامة: صورة كبيرة في منتصف الأعلى (تفتح بالحجم الكامل داخل دائرة عائمة)،
 * البيانات الشخصية الاختيارية، المهن المنشورة بنفس الرقم، رمز QR للملف، وفي الأسفل اسم التطبيق مع اللوجو الشفاف.
 */
type Props = { profile: PublicProfile; settings: SiteSettings; design: DesignSettings | null; origin: string };

const birthdayLabel = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
};

export default function ProfileView({ profile, settings, design, origin }: Props) {
  const theme = { ...defaultDesignSettings, ...(design ?? {}) };
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const ownership = useOwnership();
  const mine = (ownership.viewer && profile.kind === "member" && ownership.viewer.memberId === profile.id) || profile.services.some((item) => ownsService(ownership, { id: item.id, phone: profile.phone, phoneSecondary: "" }));
  const url = `${origin}${profileUrl(profile.id)}`;
  const primary = profile.services[0];
  const headline = profile.profile.jobTitle || primary?.categoryName || "عضو في دليل جنزور";
  const since = new Date(profile.memberSince).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(false); };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("profile-lightbox-open");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("profile-lightbox-open"); };
  }, [lightbox]);

  async function share() {
    const text = `👤 ${profile.name}\n${headline}\n${url}`;
    try {
      if (typeof navigator.share === "function") { await navigator.share({ title: profile.name, text, url }); return; }
      await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    } catch { /* ألغى المستخدم */ }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { window.prompt("انسخ الرابط:", url); }
  }
  async function saveContact() {
    const phones = [profile.phone, profile.profile.whatsapp].filter(Boolean);
    await saveVCard(buildVCard({
      name: profile.name, phones, org: settings.siteName, title: headline, address: profile.profile.address || primary?.address || "",
      url, email: profile.profile.email, photoUrl: profile.photoUrl ? `${origin}${profile.photoUrl}` : "", note: profile.profile.bio ? profile.profile.bio.slice(0, 160) : `من ${settings.siteName}`,
    }), profile.name);
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  }

  const facts = [
    profile.profile.jobTitle ? { icon: GraduationCap, label: "المؤهل / الوظيفة", value: profile.profile.jobTitle } : null,
    (profile.profile.address || primary?.address) ? { icon: MapPin, label: "العنوان", value: profile.profile.address || primary!.address } : null,
    profile.profile.email ? { icon: Mail, label: "البريد الإلكتروني", value: profile.profile.email, href: `mailto:${profile.profile.email}`, ltr: true } : null,
    birthdayLabel(profile.profile.birthDate) ? { icon: Cake, label: "تاريخ الميلاد", value: birthdayLabel(profile.profile.birthDate) } : null,
    profile.profile.facebook ? { icon: Globe, label: "فيسبوك", value: "صفحتي على فيسبوك", href: profile.profile.facebook, external: true } : null,
    profile.profile.whatsapp ? { icon: MessageCircle, label: "واتساب بديل", value: profile.profile.whatsapp, href: whatsappUrl(profile.profile.whatsapp, `السلام عليكم ${profile.name}، وصلت لك من ${settings.siteName}`), external: true, ltr: true } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string; external?: boolean; ltr?: boolean }[];

  return <div className="events-page profile-page">
    <DesignApplicator design={theme}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={theme.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>
    <main className="container profile-main">
      <section className="profile-hero-card">
        <div className="profile-hero-glow" aria-hidden="true"/>
        <button type="button" className={`profile-big-photo ${profile.photoUrl ? "has-photo" : ""}`} onClick={() => profile.photoUrl && setLightbox(true)} aria-label={profile.photoUrl ? "عرض الصورة بالحجم الكامل" : "لا توجد صورة شخصية"} disabled={!profile.photoUrl}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.photoUrl ? <img src={profile.photoUrl} alt={`صورة ${profile.name}`} /> : <UserRound size={88} strokeWidth={1.4}/>}
        </button>
        <h1 className="profile-name">{profile.name}</h1>
        <p className="profile-headline">{headline}</p>
        <div className="profile-badges">
          {profile.kind === "member" && <span className="profile-badge"><BadgeCheck size={14}/> عضو في الدليل منذ {since}</span>}
          {primary?.verified && <span className="profile-badge is-verified"><BadgeCheck size={14}/> تم التحقق بالمعاينة</span>}
        </div>
        <div className="circle-tools is-row profile-tools" role="group" aria-label="أدوات الملف الشخصي">
          {profile.phone && <a className="circle-tool is-call" href={`tel:${profile.phone}`} data-tip="اتصال" aria-label={`اتصال بـ ${profile.name}`}><Phone size={16}/></a>}
          {profile.phone && <a className="circle-tool is-whatsapp" href={whatsappUrl(profile.phone, `السلام عليكم ${profile.name}، وصلت لك من ${settings.siteName}`)} target="_blank" rel="noopener noreferrer" data-tip="واتساب" aria-label={`واتساب ${profile.name}`}><MessageCircle size={16}/></a>}
          {profile.phone && <button type="button" className={`circle-tool is-contact ${saved ? "is-active" : ""}`} data-tip={saved ? "تم تجهيز جهة الاتصال ✓" : "احفظ في جهات الاتصال"} onClick={() => void saveContact()} aria-label="احفظ في جهات الاتصال">{saved ? <Check size={16}/> : <UserPlus size={16}/>}</button>}
          <button type="button" className="circle-tool is-share" data-tip="مشاركة الملف" onClick={() => void share()} aria-label="مشاركة الملف الشخصي"><Share2 size={16}/></button>
          <button type="button" className={`circle-tool is-copy ${copied ? "is-active" : ""}`} data-tip={copied ? "تم النسخ ✓" : "نسخ الرابط"} onClick={() => void copyLink()} aria-label="نسخ رابط الملف">{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
        </div>
        {mine && <Link href="/account" className="profile-edit-link">✏️ هذا ملفك — عدّل بياناتك من «حسابي»</Link>}
      </section>

      {profile.profile.bio && <section className="profile-section profile-bio"><h2>نبذة</h2><p>{profile.profile.bio}</p></section>}

      {facts.length > 0 && <section className="profile-section">
        <h2>البيانات</h2>
        <div className="profile-facts">
          {facts.map((fact) => {
            const Icon = fact.icon;
            const body = <><span className="profile-fact-icon"><Icon size={17}/></span><span className="profile-fact-copy"><small>{fact.label}</small><strong dir={fact.ltr ? "ltr" : undefined}>{fact.value}</strong></span></>;
            return fact.href
              ? <a key={fact.label} className="profile-fact is-link" href={fact.href} target={fact.external ? "_blank" : undefined} rel={fact.external ? "noopener noreferrer" : undefined}>{body}</a>
              : <div key={fact.label} className="profile-fact">{body}</div>;
          })}
        </div>
      </section>}

      {profile.services.length > 0 && <section className="profile-section">
        <h2>{profile.services.length === 1 ? "مهنته في الدليل" : "مهنه في الدليل"}</h2>
        <div className="profile-services">
          {profile.services.map((item) => <Link key={item.id} href={`/?service=${encodeURIComponent(item.id)}`} className="profile-service">
            <span className="profile-service-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {item.photoUrl ? <img src={item.photoUrl} alt=""/> : <UserRound size={22}/>}
            </span>
            <span className="profile-service-copy">
              <strong>{item.name}</strong>
              <small>{item.categoryName}{item.address ? ` — ${item.address}` : ""}</small>
              {item.reviews > 0 && <span className="profile-service-rating"><Star size={12} fill="currentColor"/> {item.rating} ({item.reviews})</span>}
            </span>
            <ArrowLeft size={16} className="profile-service-arrow"/>
          </Link>)}
        </div>
      </section>}

      <section className="profile-section profile-qr-section">
        <div className="profile-qr-box"><QrSvg value={url} size={120} label="رمز QR للملف الشخصي"/></div>
        <div className="profile-qr-copy"><h2><QrCode size={18}/> رمز الملف الشخصي</h2><p>امسح الرمز لفتح هذا الملف مباشرة على أي هاتف، أو شاركه مع جيرانك.</p></div>
      </section>

      <footer className="profile-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={theme.headerLogoUrl || "/images/logo-daleel-transparent.png"} alt="" className="profile-brand-logo"/>
        <strong>{settings.siteName}</strong>
        <small>{settings.tagline}</small>
      </footer>
    </main>

    {lightbox && profile.photoUrl && <div className="profile-lightbox" role="dialog" aria-modal="true" aria-label="الصورة الشخصية بالحجم الكامل" onClick={() => setLightbox(false)}>
      <button type="button" className="profile-lightbox-close" aria-label="إغلاق" onClick={() => setLightbox(false)}><X size={22}/></button>
      <div className="profile-lightbox-circle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.photoUrl} alt={`صورة ${profile.name}`}/>
      </div>
      <span className="profile-lightbox-caption">{profile.name} — اضغط في أي مكان للإغلاق</span>
    </div>}
  </div>;
}

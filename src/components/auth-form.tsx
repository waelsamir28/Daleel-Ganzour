"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useIsDark } from "@/lib/use-is-dark";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CirclePlus, Eye, EyeOff, Info, LoaderCircle, LockKeyhole, LogOut, Phone, ShieldCheck, Sparkles, UserRound, UsersRound } from "lucide-react";
import { Logo } from "@/components/ui";
import DesignApplicator from "@/components/design-applicator";
import { defaultDesignSettings, parseAnnouncementItems, resolveAuthBanner, type DesignSettings, type SiteSettings } from "@/lib/catalog";
import { TickerText } from "@/components/ticker-text";

export function LogoutButton({ className = "button button-soft" }: { className?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function logout() { setBusy(true); setError(""); try { const response = await fetch("/api/auth", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/"); } catch { setBusy(false); setError("تعذر الخروج، حاول مرة أخرى."); } }
  return <div><button className={className} onClick={logout} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <LogOut size={17}/>}تسجيل الخروج</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
export default function AuthForm({ mode, settings, designSettings, next = "/", membersOnly = false }: { mode: "login" | "register"; settings: SiteSettings; designSettings?: DesignSettings; next?: string; membersOnly?: boolean }) {
  const registering = mode === "register";
  const switchHref = `${registering ? "/login" : "/register"}?next=${encodeURIComponent(next)}`;
  const design = { ...defaultDesignSettings, ...(designSettings ?? {}) };
  const isDark = useIsDark();
  const bannerSrc = resolveAuthBanner(design, registering ? "register" : "login", isDark);
  const parsedAnnouncements = parseAnnouncementItems(design);
  const announcementList = parsedAnnouncements.some((item) => item.includes("مهنتك") || item.includes("نشاطك"))
    ? parsedAnnouncements
    : [...parsedAnnouncements, "📣 لكل أعضاء الدليل: التطبيق لسه في بدايته — أضف مهنتك أو محلك أو عيادتك الآن مجاناً وكن أول من يظهر لأهل القرية"];
  // Registration fields are always stacked vertically (one field per row) for a clean, mobile-friendly form.
  const rowLayoutClass = "form-row form-row-stacked";
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), action: mode }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "تعذر تنفيذ الطلب.");
      // Members go back to the page they were trying to open (the hash survives redirects, e.g. /#add-service).
      const destination = result.role === "admin" || result.role === "moderator" ? "/admin" : `${next}${next.includes("#") ? "" : window.location.hash}`;
      window.location.assign(destination);
    } catch (err) { setBusy(false); setError(err instanceof Error ? err.message : "تعذر الاتصال. حاول مرة أخرى."); }
  }
  return <div className="admin-login-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><div className="auth-header-links"><Link href="/#about-app" className="header-info-btn" aria-label="عن التطبيق" title="شرح التطبيق"><Info size={18}/></Link><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></div></header>
    {design.announcementEnabled && announcementList.length > 0 && (
      <div className="container" style={{ marginTop: "0.75rem" }}>
        <div
          className={`site-announcement-ticker-card is-${design.announcementStyle} is-mode-marquee`}
          style={{ "--ticker-bg": design.announcementBgColor } as CSSProperties}
        >
          <span className="ticker-badge-icon"><Sparkles size={15}/></span>
          <div className={`site-announcement-marquee is-speed-${design.announcementSpeed || "normal"}`} aria-label="شريط الأخبار والتنبيهات">
            <div className="site-announcement-marquee-track">
              {[...announcementList, ...announcementList].map((item, idx) => (
                <TickerText key={`${idx}-${item}`} text={item} className="site-announcement-marquee-item">
                  <i aria-hidden="true">•</i>
                </TickerText>
              ))}
            </div>
          </div>
          <Link href={registering ? "#membership-form" : "/register?next=%2F%23add-service"} className="ticker-add-cta"><CirclePlus size={14}/><span>أضف مهنتك</span></Link>
        </div>
      </div>
    )}
    <main className={`login-layout ${registering ? "registration-layout" : ""} ${!design.authShowBanner ? "no-auth-banner" : ""}`}>
      {design.authShowBanner && (
        <div className="login-art has-banner-image">
          {/* بانر الدخول والعضوية: صورة الأدمن المرفوعة، وإلا البانر الافتراضي المصمم للتطبيق */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Custom admin-configured auth banner image */}
          <img src={bannerSrc} alt="" className="login-custom-banner-img" width={1200} height={500} fetchPriority="high"/>
          <div className="login-art-caption"><CheckCircle2 size={17}/> العضوية شيء.. وإضافة المهنة شيء تاني</div>
        </div>
      )}
      <div className="login-form-panel">
        <div className="login-panel-header">
          <span className="login-lock">{registering ? <UsersRound size={26}/> : <LockKeyhole size={26}/>}</span>
          <span className="login-eyebrow">{registering ? "مكانك موجود وسط أهل الدليل" : "أهلًا بيك من جديد"}</span>
          <h1>{registering ? design.registerTitle : design.loginTitle}</h1>
          <p>{registering ? design.registerSubtitle : design.loginSubtitle}</p>
        </div>
        <form id="membership-form" className="request-form compact-auth-form" onSubmit={submit}>
          {membersOnly && (
            <div className="form-notice members-only-notice" role="status">
              <LockKeyhole size={19}/>
              <span><strong>أرقام المهنيين وبيانات الأقسام للأعضاء فقط.</strong> {registering ? "أنشئ عضويتك المجانية في ثوانٍ وبعدها تظهر لك كل الأقسام وأرقام التواصل وتقدر تضيف مهنتك." : "سجّل دخولك للمتابعة، أو أنشئ عضوية مجانية جديدة."}</span>
            </div>
          )}
          {registering && (
            <>
              <div className="form-notice"><ShieldCheck size={19}/><span>بيانات عضويتك لا تُضاف للمهنيين ولا تظهر في دليل الخدمات.</span></div>
              <div className="auth-section-label"><span>١</span>بياناتك الشخصية</div>
              <div className={rowLayoutClass}>
                <label className="field">الاسم بالكامل
                  <div className="login-input"><UserRound size={17}/><input name="name" autoComplete="name" placeholder="مثال: وائل سمير" required minLength={3} maxLength={120}/></div>
                </label>
                <label className="field">رقم الهاتف
                  <div className="login-input"><Phone size={17}/><input name="phone" type="tel" autoComplete="tel" dir="ltr" placeholder="01xxxxxxxxx" required maxLength={16}/></div>
                </label>
              </div>
            </>
          )}
          {registering && <div className="auth-section-label"><span>٢</span>بيانات الدخول</div>}
          <label className="field">اسم المستخدم (عربي أو إنجليزي)
            <div className="login-input"><UserRound size={17}/><input name="username" autoComplete="username" placeholder={registering ? "مثال: أحمد محمد" : "اسم المستخدم"} required minLength={registering ? 2 : 1} maxLength={40}/></div>
            {registering && <small className="input-help">اكتب اسمك بالعربي أو الإنجليزي عادي بدون شرطات أو نقاط أو أرقام إجبارية.</small>}
          </label>
          <div className={registering ? rowLayoutClass : ""}>
            <label className="field">كلمة المرور
              <div className="login-input"><LockKeyhole size={17}/><input name="password" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} dir="ltr" placeholder={registering ? "٦ أحرف على الأقل" : "كلمة المرور"} required minLength={registering ? 6 : 1} maxLength={200}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
            </label>
            {registering && (
              <label className="field">تأكيد كلمة المرور
                <div className="login-input"><LockKeyhole size={17}/><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" dir="ltr" placeholder="تأكيد كلمة المرور" required minLength={6} maxLength={200}/></div>
              </label>
            )}
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-submit-center">
            <button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <ArrowLeft size={18}/>} {busy ? "جاري تنفيذ الطلب..." : registering ? "إنشاء العضوية" : "تسجيل الدخول"}</button>
          </div>
        </form>
        <p className="auth-switch">{registering ? "عندك حساب بالفعل؟" : "لسه مش عضو؟"} <Link href={switchHref}>{registering ? "تسجيل الدخول" : "أنشئ عضويتك"}</Link></p>
        <div className="login-security"><ShieldCheck size={16}/><span>كلمة مرورك مشفّرة، وبيانات العضوية لا تظهر للزوار. لوحة التحكم متاحة فقط للحساب الإداري.</span></div>
      </div>
    </main>
    <footer className="login-footer">{settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</footer>
  </div>;
}


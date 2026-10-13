"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, LogOut, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Logo } from "@/components/ui";
import type { SiteSettings } from "@/lib/catalog";

export function LogoutButton({ className = "button button-soft" }: { className?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function logout() { setBusy(true); setError(""); try { const response = await fetch("/api/auth", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/"); } catch { setBusy(false); setError("تعذر الخروج، حاول مرة أخرى."); } }
  return <div><button className={className} onClick={logout} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <LogOut size={17}/>}تسجيل الخروج</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
export default function AuthForm({ mode, settings }: { mode: "login" | "register"; settings: SiteSettings }) {
  const registering = mode === "register";
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), action: mode }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "تعذر تنفيذ الطلب.");
      window.location.assign(result.role === "admin" || result.role === "moderator" ? "/admin" : "/account");
    } catch (err) { setBusy(false); setError(err instanceof Error ? err.message : "تعذر الاتصال. حاول مرة أخرى."); }
  }
  return <div className="admin-login-page">
    <header className="admin-public-header container"><Logo name={settings.siteName}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>
    <main className={`login-layout ${registering ? "registration-layout" : ""}`}>
      <div className="login-art">
        <div className="login-art-caption"><CheckCircle2 size={17}/> العضوية شيء.. وإضافة المهنة شيء تاني</div>
      </div>
      <div className="login-form-panel">
        <div className="login-panel-header">
          <span className="login-lock">{registering ? <UsersRound size={26}/> : <LockKeyhole size={26}/>}</span>
          <span className="login-eyebrow">{registering ? "مكانك موجود وسط أهل الدليل" : "أهلًا بيك من جديد"}</span>
          <h1>{registering ? "إنشاء عضوية جديدة" : "تسجيل الدخول"}</h1>
          <p>{registering ? "التسجيل يضيفك كعضو فقط، مش كمقدم خدمة" : "ادخل بحسابك وكمل تصفح دليل جنزور"}</p>
        </div>
        <form className="request-form compact-auth-form" onSubmit={submit}>
          {registering && (
            <>
              <div className="form-notice"><ShieldCheck size={19}/><span>بيانات عضويتك لا تُضاف للمهنيين ولا تظهر في دليل الخدمات.</span></div>
              <div className="form-row compact-two-col">
                <label className="field">الاسم بالكامل
                  <div className="login-input"><UserRound size={17}/><input name="name" autoComplete="name" placeholder="مثال: وائل سمير" required minLength={3} maxLength={120}/></div>
                </label>
                <label className="field">رقم الهاتف
                  <div className="login-input"><Phone size={17}/><input name="phone" type="tel" autoComplete="tel" dir="ltr" placeholder="01xxxxxxxxx" required maxLength={16}/></div>
                </label>
              </div>
            </>
          )}
          <label className="field">اسم المستخدم (عربي أو إنجليزي)
            <div className="login-input"><UserRound size={17}/><input name="username" autoComplete="username" placeholder={registering ? "مثال: أحمد محمد" : "اسم المستخدم"} required minLength={registering ? 2 : 1} maxLength={40}/></div>
            {registering && <small className="input-help">اكتب اسمك بالعربي أو الإنجليزي عادي بدون شرطات أو نقاط أو أرقام إجبارية.</small>}
          </label>
          <div className={registering ? "form-row compact-two-col" : ""}>
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
        <p className="auth-switch">{registering ? "عندك حساب بالفعل؟" : "لسه مش عضو؟"} <Link href={registering ? "/login" : "/register"}>{registering ? "تسجيل الدخول" : "أنشئ عضويتك"}</Link></p>
        <div className="login-security"><ShieldCheck size={16}/><span>كلمة مرورك مشفّرة، وبيانات العضوية لا تظهر للزوار. لوحة التحكم متاحة فقط للحساب الإداري.</span></div>
      </div>
    </main>
    <footer className="login-footer">{settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</footer>
  </div>;
}


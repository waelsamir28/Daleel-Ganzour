"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Check, Copy, MoreVertical, Share2, Smartphone, SquarePlus, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __janzourInstallPrompt?: InstallPromptEvent | null;
  }
}

export const APP_URL = "https://daleel-ganzour.vercel.app/";
const SEEN_KEY = "janzour-install-modal-seen-at";
const SHOW_AGAIN_AFTER_MS = 1000 * 60 * 60 * 24 * 3; // يظهر مرة كل ٣ أيام إن لم يُثبَّت التطبيق
const OPEN_DELAY_MS = 1600;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function openInstallAppModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("janzour:open-install-modal"));
}

export default function InstallAppModal() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // التقاط حدث التثبيت (يُلتقط مبكراً في layout ويُخزَّن على window) + تسجيل الـ Service Worker.
  useEffect(() => {
    // Defer the initial environment snapshot to the next frame so it does not set state synchronously inside the effect.
    const bootstrap = window.requestAnimationFrame(() => {
      setPlatform(detectPlatform());
      setInstalled(isStandalone());
      if (window.__janzourInstallPrompt) setPrompt(window.__janzourInstallPrompt);
    });

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      window.__janzourInstallPrompt = event as InstallPromptEvent;
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      window.__janzourInstallPrompt = null;
      setPrompt(null);
      try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
    };
    const onOpenRequest = () => { setShowGuide(false); setOpen(true); };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("janzour:open-install-modal", onOpenRequest);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    // الفتح التلقائي عند الدخول (بعد شاشة البداية) إذا لم يكن التطبيق مثبتاً ولم يُعرض مؤخراً.
    let timer: number | undefined;
    const root = document.documentElement;
    const disabledByAdmin = root.getAttribute("data-design-install-banner") === "false";
    if (!isStandalone() && !disabledByAdmin && window.location.pathname === "/") {
      let lastSeen = 0;
      try { lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0); } catch { /* ignore */ }
      if (Date.now() - lastSeen > SHOW_AGAIN_AFTER_MS) {
        timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("janzour:open-install-modal", onOpenRequest);
      window.cancelAnimationFrame(bootstrap);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [open, close]);

  async function install() {
    if (prompt) {
      setBusy(true);
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          window.__janzourInstallPrompt = null;
          setPrompt(null);
          window.setTimeout(close, 900);
        }
      } catch {
        setShowGuide(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    setShowGuide(true);
  }

  async function share() {
    const data = { title: "دليل المهن والخدمات بقرية جنزور", text: "ثبّت تطبيق دليل جنزور على موبايلك ووصّل لأي مهني أو خدمة في القرية بضغطة واحدة 👇", url: APP_URL };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch { /* المستخدم أغلق نافذة المشاركة */ }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  if (!open) return null;

  const installLabel = installed ? "التطبيق مثبّت بالفعل ✓" : prompt ? "تثبيت التطبيق الآن" : platform === "ios" ? "طريقة التثبيت على الآيفون" : "تثبيت التطبيق";

  return (
    <div className="install-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-modal-title" dir="rtl">
        <button type="button" className="install-modal-close" onClick={close} aria-label="إغلاق"><X size={18}/></button>

        <div className="install-modal-head">
          <span className="install-modal-logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- Static app icon */}
            <img src="/app-icon.png?v=6" alt="" width={64} height={64}/>
          </span>
          <h2 id="install-modal-title">ثبّت تطبيق دليل جنزور</h2>
          <p>كل مهنيي وخدمات ومحلات القرية في جيبك.. بدون متجر تطبيقات وبدون مساحة تُذكر، ويعمل على كل الموبايلات.</p>
        </div>

        <div className="install-modal-qr-wrap">
          <div className="install-modal-qr">
            {/* eslint-disable-next-line @next/next/no-img-element -- Offline-safe static QR image */}
            <img src="/images/app-qr.svg" alt="باركود تطبيق دليل جنزور" width={168} height={168}/>
          </div>
          <div className="install-modal-qr-copy">
            <strong><Smartphone size={15}/> امسح الباركود بكاميرا الموبايل</strong>
            <span>أو شارك الرابط مع أهلك وأصحابك</span>
            <button type="button" className="install-modal-link" onClick={() => void copyLink()} aria-live="polite">
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              <span dir="ltr">{copied ? "تم نسخ الرابط" : "daleel-ganzour.vercel.app"}</span>
            </button>
          </div>
        </div>

        <div className="install-modal-actions">
          <button type="button" className={`install-modal-install ${installed ? "is-done" : ""}`} onClick={() => void install()} disabled={busy || installed}>
            <ArrowDownToLine size={19}/>
            <span>{busy ? "جاري فتح نافذة التثبيت.." : installLabel}</span>
          </button>
          <button type="button" className="install-modal-share" onClick={() => void share()}>
            <Share2 size={17}/>
            <span>مشاركة</span>
          </button>
        </div>

        {showGuide && !installed && (
          <div className="install-modal-guide" role="status">
            {platform === "ios" ? (
              <>
                <strong>التثبيت على الآيفون (Safari):</strong>
                <ol>
                  <li>اضغط زر <b>المشاركة</b> <Share2 size={14}/> أسفل المتصفح.</li>
                  <li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b> <SquarePlus size={14}/>.</li>
                  <li>اضغط <b>إضافة</b> وستجد أيقونة دليل جنزور على شاشتك.</li>
                </ol>
              </>
            ) : (
              <>
                <strong>التثبيت على أندرويد (Chrome):</strong>
                <ol>
                  <li>اضغط قائمة المتصفح <MoreVertical size={14}/> أعلى اليمين.</li>
                  <li>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</li>
                  <li>اضغط <b>تثبيت</b> وسيظهر التطبيق بين تطبيقات موبايلك.</li>
                </ol>
              </>
            )}
          </div>
        )}

        <ul className="install-modal-perks">
          <li>⚡ يفتح فوراً من الشاشة الرئيسية</li>
          <li>📶 يعمل حتى مع ضعف الإنترنت</li>
          <li>📱 متوافق مع أندرويد وآيفون وكل المقاسات</li>
        </ul>

        <button type="button" className="install-modal-skip" onClick={close}>متابعة التصفح الآن</button>
      </section>
    </div>
  );
}

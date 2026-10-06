"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, Share2, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const subscribeToNothing = () => () => {};

function subscribeToStandalone(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    displayMode.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function isStandaloneSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIosSnapshot() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const isIos = useSyncExternalStore(subscribeToNothing, isIosSnapshot, () => false);
  const isInstalled = useSyncExternalStore(subscribeToStandalone, isStandaloneSnapshot, () => false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  async function installApp() {
    if (isIos) {
      setShowIosInstructions((visible) => !visible);
      return;
    }
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (isInstalled || isDismissed || (!isIos && !installPrompt)) return null;

  return (
    <aside className="pwa-install-card" aria-label="تثبيت تطبيق دليل جنزور" dir="rtl">
      <div className="pwa-install-mark" aria-hidden="true"><ArrowDownToLine size={20} /></div>
      <div className="pwa-install-copy">
        <strong>دليل جنزور على موبايلك</strong>
        <span>ثبّت التطبيق للوصول السريع للدليل</span>
      </div>
      <button className="pwa-install-button" onClick={installApp}>
        {isIos ? "طريقة التثبيت" : "تثبيت التطبيق"}
      </button>
      <button className="pwa-install-dismiss" aria-label="إخفاء رسالة تثبيت التطبيق" onClick={() => setIsDismissed(true)}>
        <X size={17} />
      </button>
      {isIos && showIosInstructions && (
        <p className="pwa-install-instructions" role="status">
          اضغط <Share2 size={16} aria-label="مشاركة" /> مشاركة في Safari، ثم اختر «إضافة إلى الشاشة الرئيسية».
        </p>
      )}
    </aside>
  );
}



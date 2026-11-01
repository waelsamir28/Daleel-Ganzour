"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { stickerIconUrl } from "@/lib/catalog";

/** المدة الافتراضية: 12 ثانية كي تكتمل حركة التجمع ثم حركة الدوران حول الشعار. */
const VISIBLE_MS = 12000;
const FADE_MS = 520;
/** الحدث الذي يطلقه استوديو التصميم لمعاينة شاشة البداية فورًا (من أي صفحة). */
export const SPLASH_PREVIEW_EVENT = "janzour-splash-preview";
/** ملصقات تمثّل أشهر أقسام الدليل؛ تتجمع حول الشعار من أطراف الشاشة ثم تدور في مدار حوله. */
const SPLASH_STICKERS = ["electricity", "dentistry", "pharmacies", "groceries", "teachers", "plumbing", "barbers", "charities"] as const;
const DEFAULT_LOGO = "/images/logo-app.webp";

/** أرقام مختصرة لشاشة القفل: 1200 → «1.2 ألف». */
function shortCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} ألف`;
  return new Intl.NumberFormat("ar-EG").format(value);
}

type DirectoryStatus = { professions: number; providers: number; visits: number; contacts: number };

function readConfig() {
  const root = document.documentElement;
  return {
    enabled: root.getAttribute("data-design-splash-enabled") !== "false",
    image: root.getAttribute("data-design-splash-image") || DEFAULT_LOGO,
    duration: Number(root.getAttribute("data-design-splash-duration") || VISIBLE_MS) || VISIBLE_MS,
    stickers: root.getAttribute("data-design-splash-stickers") !== "false",
    orbit: root.getAttribute("data-design-splash-orbit") !== "false",
  };
}

export default function SplashScreen({ tagline = "دليل المهن والخدمات.. من أهل القرية لأهلها" }: { tagline?: string }) {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  const [preview, setPreview] = useState(() => {
    if (typeof window === "undefined") return 0;
    // معاينة عبر الرابط: /?splash=1 تعرض الشاشة دائمًا (مفيدة لتجربتها من المتصفح أو لمشاركتها مع المسؤول).
    return /(?:\?|&)splash=1(?:&|$)/.test(window.location.search) ? 1 : 0;
  });
  const [skipped, setSkipped] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    if (/(?:\?|&)splash=1(?:&|$)/.test(window.location.search)) return false;
    return document.documentElement.classList.contains("skip-splash") || window.location.pathname !== "/";
  });
  const [splashImage, setSplashImage] = useState(DEFAULT_LOGO);
  const [withStickers, setWithStickers] = useState(true);
  const [withOrbit, setWithOrbit] = useState(true);
  /** حالة الدليل الحقيقية (عدد المهن والمقدمين والزيارات) — تُقرأ بعد ظهور الشاشة فلا تؤخر شيئًا. */
  const [status, setStatus] = useState<DirectoryStatus | null>(null);

  // الضغط في أي مكان على الشاشة (أو زر Esc) يتخطى شاشة البداية فورًا — مهم لأن المدة الافتراضية 12 ثانية.
  const skip = useCallback(() => setSkipped(true), []);
  useEffect(() => {
    if (hidden) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSkipped(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  // المعاينة من استوديو التصميم: تُظهر الشاشة من جديد على أي صفحة حتى لو سبق عرضها.
  useEffect(() => {
    const onPreview = () => { setLeaving(false); setSkipped(false); setHidden(false); setPreview((n) => n + 1); };
    window.addEventListener(SPLASH_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(SPLASH_PREVIEW_EVENT, onPreview);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previewing = preview > 0;
    // السكربت الحاجب في <head> يقرر مسبقًا (الصفحة الداخلية، سبق العرض، للتطبيق المثبّت فقط) ويضع skip-splash.
    if (!previewing && (pathname !== "/" || root.classList.contains("skip-splash") || root.getAttribute("data-design-splash-enabled") === "false")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Immediately hide splash on non-home pages or when disabled by admin.
      setHidden(true);
      root.setAttribute("data-splash-done", "true");
      window.dispatchEvent(new CustomEvent("janzour-splash-finished"));
      return;
    }
    const config = readConfig();
    setSplashImage(config.image);
    setWithStickers(config.stickers);
    setWithOrbit(config.orbit);
    try { sessionStorage.setItem("janzour-splash-shown", "1"); } catch { /* Ignore storage issues. */ }
    const duration = skipped ? 0 : previewing ? Math.max(config.duration, 1500) : config.duration;
    const fade = window.setTimeout(() => setLeaving(true), duration);
    const remove = window.setTimeout(() => {
      setHidden(true);
      if (!previewing) root.classList.add("skip-splash");
      root.setAttribute("data-splash-done", "true");
      window.dispatchEvent(new CustomEvent("janzour-splash-finished"));
    }, duration + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, [pathname, preview, skipped]);

  // قراءة أرقام الدليل: الطلب لا يعطّل الشاشة إطلاقًا؛ لو فشل تختفي الحالة بهدوء.
  useEffect(() => {
    if (hidden) return;
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DirectoryStatus | null) => { if (data && Number.isFinite(data.professions)) setStatus(data); })
      .catch(() => { /* أرقام الشاشة اختيارية */ });
    return () => controller.abort();
  }, [hidden]);

  if (hidden || (pathname !== "/" && preview === 0)) return null;
  return <div
    key={preview}
    className={`splash-screen ${leaving ? "is-leaving" : ""} ${withStickers ? "has-stickers" : ""} ${withOrbit ? "has-orbit" : ""}`}
    onPointerDown={skip}
    role="presentation"
    title="اضغط لتخطي شاشة البداية"
  >
    <div className="splash-stage">
      <span className="splash-halo" aria-hidden="true"/>
      <div className="splash-orbit" aria-hidden="true">
        {withStickers && SPLASH_STICKERS.map((id, index) => (
          <span key={id} className="splash-sticker" style={{ "--i": index } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ملصقات صغيرة ثابتة؛ لا تحتاج تحسين next/image */}
            <img className="splash-sticker-art" src={stickerIconUrl(id)} alt="" width={64} height={64} decoding="async" draggable={false}/>
          </span>
        ))}
      </div>
      {splashImage === DEFAULT_LOGO ? (
        <Image className="splash-icon" src={DEFAULT_LOGO} alt="" width={320} height={320} priority sizes="(max-width: 420px) 46vw, 214px"/>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element -- Custom admin-configured splash image URL */
        <img className="splash-icon" src={splashImage} alt="" width={320} height={320}/>
      )}
    </div>
    <span className="splash-tagline">{tagline}</span>
    {status && (
      <div className="splash-status" role="status" aria-label="حالة الدليل الآن">
        <span className="splash-status-title">حالة الدليل الآن</span>
        <div className="splash-status-row">
          <span className="splash-status-pill"><b>{shortCount(status.professions)}</b><small>مهنة وخدمة</small></span>
          <span className="splash-status-pill"><b>{shortCount(status.providers)}</b><small>مقدّم خدمة</small></span>
          <span className="splash-status-pill"><b>{shortCount(status.visits)}</b><small>زيارة للدليل</small></span>
        </div>
      </div>
    )}
    <span className="splash-dots"><i/><i/><i/></span>
  </div>;
}

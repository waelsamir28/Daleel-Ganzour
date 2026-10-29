"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { stickerIconUrl } from "@/lib/catalog";

const VISIBLE_MS = 1000;
const FADE_MS = 480;
/** الحدث الذي يطلقه استوديو التصميم لمعاينة شاشة البداية فورًا (من أي صفحة). */
export const SPLASH_PREVIEW_EVENT = "janzour-splash-preview";
/** ملصقات تمثّل أشهر أقسام الدليل؛ تتجمع حول الشعار من أطراف الشاشة. */
const SPLASH_STICKERS = ["electricity", "dentistry", "pharmacies", "groceries", "teachers", "plumbing", "barbers", "charities"] as const;
const DEFAULT_LOGO = "/images/logo-app.webp";

function readConfig() {
  const root = document.documentElement;
  return {
    enabled: root.getAttribute("data-design-splash-enabled") !== "false",
    image: root.getAttribute("data-design-splash-image") || DEFAULT_LOGO,
    duration: Number(root.getAttribute("data-design-splash-duration") || VISIBLE_MS) || VISIBLE_MS,
    stickers: root.getAttribute("data-design-splash-stickers") !== "false",
  };
}

export default function SplashScreen({ tagline = "دليل المهن والخدمات.. من أهل القرية لأهلها" }: { tagline?: string }) {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  const [preview, setPreview] = useState(0);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("skip-splash") || window.location.pathname !== "/";
  });
  const [splashImage, setSplashImage] = useState(DEFAULT_LOGO);
  const [withStickers, setWithStickers] = useState(true);

  // المعاينة من استوديو التصميم: تُظهر الشاشة من جديد على أي صفحة حتى لو سبق عرضها.
  useEffect(() => {
    const onPreview = () => { setLeaving(false); setHidden(false); setPreview((n) => n + 1); };
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
    try { sessionStorage.setItem("janzour-splash-shown", "1"); } catch { /* Ignore storage issues. */ }
    const duration = previewing ? Math.max(config.duration, 1500) : config.duration;
    const fade = window.setTimeout(() => setLeaving(true), duration);
    const remove = window.setTimeout(() => {
      setHidden(true);
      if (!previewing) root.classList.add("skip-splash");
      root.setAttribute("data-splash-done", "true");
      window.dispatchEvent(new CustomEvent("janzour-splash-finished"));
    }, duration + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, [pathname, preview]);

  if (hidden || (pathname !== "/" && preview === 0)) return null;
  return <div key={preview} className={`splash-screen ${leaving ? "is-leaving" : ""} ${withStickers ? "has-stickers" : ""}`} aria-hidden="true">
    <div className="splash-stage">
      {withStickers && SPLASH_STICKERS.map((id, index) => (
        /* eslint-disable-next-line @next/next/no-img-element -- ملصقات صغيرة ثابتة؛ لا تحتاج تحسين next/image */
        <img key={id} className="splash-sticker" style={{ "--i": index } as React.CSSProperties} src={stickerIconUrl(id)} alt="" width={64} height={64} decoding="async" draggable={false}/>
      ))}
      {splashImage === DEFAULT_LOGO ? (
        <Image className="splash-icon" src={DEFAULT_LOGO} alt="" width={250} height={250} priority sizes="(max-width: 420px) 54vw, 250px"/>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element -- Custom admin-configured splash image URL */
        <img className="splash-icon" src={splashImage} alt="" width={250} height={250}/>
      )}
    </div>
    <span className="splash-tagline">{tagline}</span>
    <span className="splash-dots"><i/><i/><i/></span>
  </div>;
}

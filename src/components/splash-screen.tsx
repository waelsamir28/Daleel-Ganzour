"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const VISIBLE_MS = 1000;
const FADE_MS = 480;

export default function SplashScreen({ tagline = "دليل المهن والخدمات.. من أهل القرية لأهلها" }: { tagline?: string }) {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("skip-splash") || window.location.pathname !== "/";
  });

  const [splashImage, setSplashImage] = useState("/images/logo-daleel-transparent.png");

  useEffect(() => {
    const root = document.documentElement;
    if (pathname !== "/" || root.classList.contains("skip-splash") || root.getAttribute("data-design-splash-enabled") === "false") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Immediately hide splash on non-home pages or when disabled by admin.
      setHidden(true);
      root.setAttribute("data-splash-done", "true");
      window.dispatchEvent(new CustomEvent("janzour-splash-finished"));
      return;
    }
    const customImg = root.getAttribute("data-design-splash-image");
    if (customImg) setSplashImage(customImg);
    const customDuration = Number(root.getAttribute("data-design-splash-duration") || VISIBLE_MS) || VISIBLE_MS;
    try { sessionStorage.setItem("janzour-splash-shown", "1"); } catch { /* Ignore storage issues. */ }
    const fade = window.setTimeout(() => setLeaving(true), customDuration);
    const remove = window.setTimeout(() => {
      setHidden(true);
      root.classList.add("skip-splash");
      root.setAttribute("data-splash-done", "true");
      window.dispatchEvent(new CustomEvent("janzour-splash-finished"));
    }, customDuration + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, [pathname]);

  if (hidden || pathname !== "/") return null;
  return <div className={`splash-screen ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
    {splashImage === "/images/logo-daleel-transparent.png" ? (
      <Image className="splash-icon" src="/images/logo-daleel-transparent.png" alt="" width={250} height={250} priority sizes="(max-width: 420px) 54vw, 250px"/>
    ) : (
      /* eslint-disable-next-line @next/next/no-img-element -- Custom admin-configured splash image URL */
      <img className="splash-icon" src={splashImage} alt="" width={250} height={250}/>
    )}
    <strong className="splash-title">دليل جنزور</strong>
    <span className="splash-tagline">{tagline}</span>
    <span className="splash-dots"><i/><i/><i/></span>
  </div>;
}


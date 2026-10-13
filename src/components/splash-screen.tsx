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

  useEffect(() => {
    if (pathname !== "/" || document.documentElement.classList.contains("skip-splash")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Immediately hide splash on non-home pages or subsequent navigations.
      setHidden(true);
      return;
    }
    try { sessionStorage.setItem("janzour-splash-shown", "1"); } catch { /* Ignore storage issues. */ }
    const fade = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    const remove = window.setTimeout(() => {
      setHidden(true);
      document.documentElement.classList.add("skip-splash");
    }, VISIBLE_MS + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, [pathname]);

  if (hidden || pathname !== "/") return null;
  return <div className={`splash-screen ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
    <Image className="splash-icon" src="/images/logo-daleel-transparent.png" alt="" width={250} height={250} priority sizes="(max-width: 420px) 54vw, 250px"/>
    <strong className="splash-title">دليل جنزور</strong>
    <span className="splash-tagline">{tagline}</span>
    <span className="splash-dots"><i/><i/><i/></span>
  </div>;
}


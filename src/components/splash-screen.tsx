"use client";

import { useEffect, useState } from "react";

// The splash lives in the root layout, which Next.js mounts only on a full page load — never on a
// client-side navigation — so it appears when the site is opened and stays out of the way afterwards.
// It covers the screen for about a second, fades out, then removes itself from the DOM.
const VISIBLE_MS = 1000;
const FADE_MS = 480;

export default function SplashScreen({ tagline = "دليل المهن والخدمات.. من أهل القرية لأهلها" }: { tagline?: string }) {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    const remove = window.setTimeout(() => setHidden(true), VISIBLE_MS + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, []);

  if (hidden) return null;
  return <div className={`splash-screen ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
    <span className="splash-icon">📍</span>
    <strong className="splash-title">دليل جنزور</strong>
    <span className="splash-tagline">{tagline}</span>
    <span className="splash-dots"><i/><i/><i/></span>
  </div>;
}

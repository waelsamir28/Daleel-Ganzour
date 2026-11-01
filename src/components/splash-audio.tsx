"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isSoundMuted, SOUND_MUTE_EVENT } from "@/lib/feedback";
import { SPLASH_PREVIEW_EVENT } from "@/components/splash-screen";

/** مفتاح منع تكرار الصوت في نفس الجلسة (يفتح التطبيق عشر مرات فيشتغل مرة). */
const PLAYED_KEY = "janzour-splash-audio-played";

/**
 * صوت شاشة البداية: مقطع قصير (نحو ١٠ ثوانٍ) يرفعه المسؤول من الاستوديو.
 * - يحاول التشغيل التلقائي فورًا؛ لو منعه المتصفح يشتغل مع أول لمسة/ضغطة مفتاح.
 * - يحترم زر «كتم الصوت» في الموقع (janzour-sound-muted).
 * - يشتغل مرة واحدة في الجلسة، وعلى الصفحة الرئيسية فقط حيث تظهر شاشة البداية.
 * - لا يرسم أي عنصر واجهة، ولا يعطّل شيئًا لو الملف غير موجود.
 */
export default function SplashAudio() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const src = root.getAttribute("data-design-splash-audio") || "";
    const enabled = root.getAttribute("data-design-splash-audio-enabled") === "true";
    if (!src || !enabled || pathname !== "/") return;

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = src;
    audio.volume = 0.85;
    audio.preload = "auto";

    let cancelled = false;
    const cleanupGesture: (() => void)[] = [];

    const tryPlay = async () => {
      if (cancelled || startedRef.current || isSoundMuted()) return;
      try {
        await audio.play();
        startedRef.current = true;
        try { sessionStorage.setItem(PLAYED_KEY, "1"); } catch { /* ignore */ }
        cleanupGesture.forEach((off) => off());
      } catch { /* التشغيل التلقائي ممنوع — ننتظر أول تفاعل */ }
    };

    const armGesture = () => {
      if (cleanupGesture.length) return;
      for (const eventName of ["pointerdown", "keydown", "touchstart"] as const) {
        const handler = () => { void tryPlay(); };
        window.addEventListener(eventName, handler, { once: true, passive: true });
        cleanupGesture.push(() => window.removeEventListener(eventName, handler));
      }
    };

    let alreadyPlayed = false;
    try { alreadyPlayed = sessionStorage.getItem(PLAYED_KEY) === "1"; } catch { /* ignore */ }

    if (!alreadyPlayed) {
      void tryPlay();
      // لو المتصفح رفض التشغيل التلقائي: أول تفاعل من الزائر في أي مكان يشغّل الصوت.
      armGesture();
    }

    // الكتم أثناء التشغيل يوقف الصوت فورًا؛ ورفع الكتم يسمح بمحاولة جديدة عند التفاعل.
    const onMute = () => {
      if (isSoundMuted()) audio.pause();
      else if (!startedRef.current) armGesture();
    };
    window.addEventListener(SOUND_MUTE_EVENT, onMute);

    // معاينة شاشة البداية من الاستوديو: يعيد الصوت من البداية.
    const onPreview = () => {
      startedRef.current = false;
      audio.currentTime = 0;
      void tryPlay();
      armGesture();
    };
    window.addEventListener(SPLASH_PREVIEW_EVENT, onPreview);

    return () => {
      cancelled = true;
      cleanupGesture.forEach((off) => off());
      window.removeEventListener(SOUND_MUTE_EVENT, onMute);
      window.removeEventListener(SPLASH_PREVIEW_EVENT, onPreview);
      audio.pause();
    };
  }, [pathname]);

  return null;
}

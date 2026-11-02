"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isSoundMuted, SOUND_MUTE_EVENT } from "@/lib/feedback";
import { SPLASH_AUDIO_BLOCKED_EVENT, SPLASH_AUDIO_STOP_EVENT, SPLASH_FINISHED_EVENT, SPLASH_PREVIEW_EVENT } from "@/components/splash-screen";

/** مفتاح منع تكرار الصوت في نفس الجلسة (يفتح التطبيق عشر مرات فيشتغل مرة). */
const PLAYED_KEY = "janzour-splash-audio-played";
/** بيتعلّم أول ما الزائر يلمس الموقع، فالمتصفح يسمح بالتشغيل التلقائي في الزيارات الجاية. */
const UNLOCKED_KEY = "janzour-audio-unlocked";
/**
 * محاولات تشغيل متتابعة بدون أي لمسة من الزائر:
 * إعدادات التصميم (وفيها رابط المقطع) بتوصل من السيرفر بعد أول رسم للصفحة،
 * فبنحاول فورًا وأكتر من مرة كمان، وبنعيد المحاولة لما الملف يبقى جاهز ولما شاشة البداية تخلص.
 */
const RETRY_DELAYS = [0, 300, 900, 2000, 4000, 7000];
const GESTURES = ["pointerdown", "touchstart", "keydown", "click"] as const;

/** عنصر صوت واحد لكل التطبيق: التنقل بين الصفحات مابيقطعش المقطع. */
let sharedAudio: HTMLAudioElement | null = null;
let sharedStarted = false;

/**
 * صوت شاشة البداية: مقطع قصير (نحو ١٠ ثوانٍ) يرفعه المسؤول من الاستوديو.
 * - يشتغل تلقائيًا لحظة فتح التطبيق (أول الصفحة الرئيسية) من غير أي ضغطة،
 *   ولو التصميم لسه ماوصلش بيحاول تاني لحد ما يوصل، وكمان لما شاشة البداية تخلص.
 * - لو المتصفح رفض التشغيل التلقائي: يشتغل مع أول لمسة في أي مكان (ومابيطلبش منك تدوّر على زر).
 * - بيحترم زر «كتم الصوت» في الموقع (janzour-sound-muted).
 * - يشتغل مرة واحدة في الجلسة، وعلى الصفحة الرئيسية فقط حيث تبدأ شاشة البداية.
 * - لا يرسم أي عنصر واجهة، ولا يعطّل شيئًا لو الملف غير موجود.
 */
export default function SplashAudio() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const onHome = pathname === "/";
    let disposed = false;
    let forced = false;
    let gestureOff: (() => void) | null = null;
    const timers: number[] = [];

    function readConfig() {
      return {
        src: root.getAttribute("data-design-splash-audio") || "",
        enabled: root.getAttribute("data-design-splash-audio-enabled") === "true",
      };
    }

    function playedThisSession() {
      try { return sessionStorage.getItem(PLAYED_KEY) === "1"; } catch { return false; }
    }

    function markPlayed() {
      try { sessionStorage.setItem(PLAYED_KEY, "1"); } catch { /* ignore */ }
    }

    function markUnlocked() {
      try { localStorage.setItem(UNLOCKED_KEY, "1"); } catch { /* ignore */ }
    }

    function clearTimers() {
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
    }

    function ensureAudio(src: string) {
      if (!sharedAudio) {
        sharedAudio = new Audio();
        sharedAudio.preload = "auto";
        sharedAudio.volume = 0.85;
        sharedAudio.setAttribute("playsinline", "true");
        // أول ما المتصفح يبقى قادر يشغّل الملف، بنحاول من غير ما نستنى حاجة.
        sharedAudio.addEventListener("canplay", () => { void tryPlay(); });
        sharedAudio.addEventListener("loadeddata", () => { void tryPlay(); });
      }
      if (sharedAudio.getAttribute("src") !== src) sharedAudio.src = src;
      return sharedAudio;
    }

    function disarmGesture() {
      gestureOff?.();
      gestureOff = null;
    }

    async function tryPlay(): Promise<boolean> {
      if (disposed || sharedStarted) return false;
      if (!onHome && !forced) return false;
      const { src, enabled } = readConfig();
      if (!src || !enabled || isSoundMuted()) return false;
      const audio = ensureAudio(src);
      try { audio.currentTime = 0; } catch { /* الملف لسه بيحمّل */ }
      try {
        await audio.play();
      } catch {
        // المتصفح رفض التشغيل التلقائي: شاشة البداية بتعرض تنبيه صغير، وأول لمسة بتشغّل الصوت.
        window.dispatchEvent(new CustomEvent(SPLASH_AUDIO_BLOCKED_EVENT));
        return false;
      }
      if (disposed) { audio.pause(); return false; }
      sharedStarted = true;
      markPlayed();
      disarmGesture();
      return true;
    }

    /** أول لمسة/ضغطة مفتاح في أي مكان: تشغّل الصوت فورًا وتفتح الباب للتشغيل التلقائي بعد كده. */
    function armGesture() {
      if (gestureOff || sharedStarted) return;
      const handler = () => { disarmGesture(); void tryPlay(); };
      for (const name of GESTURES) window.addEventListener(name, handler, { once: true, passive: true });
      gestureOff = () => { for (const name of GESTURES) window.removeEventListener(name, handler); };
    }

    function scheduleAttempts() {
      clearTimers();
      for (const delay of RETRY_DELAYS) timers.push(window.setTimeout(() => { void tryPlay(); }, delay));
    }

    const listener = () => { markUnlocked(); };
    for (const name of GESTURES) window.addEventListener(name, listener, { once: true, passive: true });

    if (onHome && !sharedStarted && !playedThisSession()) {
      scheduleAttempts();
      armGesture();
    }

    // إعدادات التصميم بتتغيّر بعد التحميل (أو من الاستوديو مباشرة): أول ما رابط المقطع يظهر بنشغّله.
    const observer = new MutationObserver(() => {
      if (disposed || sharedStarted || playedThisSession()) return;
      const { src, enabled } = readConfig();
      if (!src || !enabled) return;
      void tryPlay();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-design-splash-audio", "data-design-splash-audio-enabled"] });

    // «بعد ما شاشة البداية تخلص ويفتح التطبيق»: محاولة أخيرة برضه.
    const onSplashFinished = () => { if (onHome) void tryPlay(); };
    const onVisible = () => { if (document.visibilityState !== "hidden") void tryPlay(); };
    window.addEventListener(SPLASH_FINISHED_EVENT, onSplashFinished);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);

    // الكتم أثناء التشغيل يوقف الصوت فورًا؛ ورفع الكتم يسمح بمحاولة جديدة عند أول لمسة.
    const onMute = () => {
      if (isSoundMuted()) { sharedAudio?.pause(); sharedStarted = false; armGesture(); }
      else if (!sharedStarted) armGesture();
    };
    window.addEventListener(SOUND_MUTE_EVENT, onMute);

    // معاينة شاشة البداية من الاستوديو (من أي صفحة): يعيد الصوت من البداية.
    const onPreview = () => {
      forced = true;
      sharedStarted = false;
      if (sharedAudio) {
        sharedAudio.pause();
        try { sharedAudio.currentTime = 0; } catch { /* ignore */ }
      }
      void tryPlay();
      armGesture();
    };
    window.addEventListener(SPLASH_PREVIEW_EVENT, onPreview);

    // زر السماعة على شاشة البداية: يوقف المقطع فورًا، وتشغيله تاني يرجّعه من الأول.
    const onStop = (event: Event) => {
      const muted = (event as CustomEvent<{ muted?: boolean }>).detail?.muted !== false;
      if (muted) {
        sharedAudio?.pause();
        sharedStarted = false;
        disarmGesture();
      } else {
        if (sharedAudio) { try { sharedAudio.currentTime = 0; } catch { /* ignore */ } }
        void tryPlay();
      }
    };
    window.addEventListener(SPLASH_AUDIO_STOP_EVENT, onStop);

    return () => {
      disposed = true;
      clearTimers();
      disarmGesture();
      observer.disconnect();
      for (const name of GESTURES) window.removeEventListener(name, listener);
      window.removeEventListener(SPLASH_FINISHED_EVENT, onSplashFinished);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener(SOUND_MUTE_EVENT, onMute);
      window.removeEventListener(SPLASH_PREVIEW_EVENT, onPreview);
      window.removeEventListener(SPLASH_AUDIO_STOP_EVENT, onStop);
      // المقطع ما بيتقطعش لما الزائر يتنقل بين الصفحات، بس بيتوقف لو الصوت نفسه اتقفل.
      if (isSoundMuted()) sharedAudio?.pause();
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isSoundMuted, SOUND_MUTE_EVENT } from "@/lib/feedback";
import { claimSessionPlay, hasPlayedThisSession, SPLASH_AUDIO_SESSION_KEY } from "@/lib/splash-audio";
import { SPLASH_AUDIO_BLOCKED_EVENT, SPLASH_AUDIO_STOP_EVENT, SPLASH_FINISHED_EVENT, SPLASH_PREVIEW_EVENT } from "@/components/splash-screen";

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
/** اتشغل (أو جاري التشغيل) في تحميل الصفحة الحالي — يمنع أي محاولة تانية. */
let sharedStarted = false;
/** حجز تشغيل واحد للجلسة كلها، مشترك بين كل عمليات تحميل الصفحة وفك وتركيب المكوّن. */
let sessionClaimed = false;

function sessionStore(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

/**
 * صوت شاشة البداية: مقطع قصير (نحو ١٠ ثوانٍ) يرفعه المسؤول من الاستوديو.
 * - **يشتغل مرة واحدة فقط في الجلسة**: أول ما المقطع يبدأ (أو أول محاولة تشغيل) الجلسة
 *   بتتعلّم، ومهما اتنقل الزائر بين الصفحات أو رجّع الرئيسية أو عمل تحديث للصفحة
 *   مابيشتغلش تاني — لحد ما يقفل التاب ويفتح جلسة جديدة.
 * - يشتغل تلقائيًا لحظة فتح التطبيق من غير أي ضغطة، ولو التصميم لسه ماوصلش بيحاول تاني
 *   في نفس الصفحة، وكمان لما شاشة البداية تخلص.
 * - لو المتصفح رفض التشغيل التلقائي: يشتغل مع أول لمسة في أي مكان (في نفس الصفحة بس).
 * - بيحترم زر «كتم الصوت» في الموقع، وزر السماعة على شاشة البداية بيوقف/يكمّل نفس التشغيل.
 * - لا يرسم أي عنصر واجهة، ولا يعطّل شيئًا لو الملف غير موجود.
 */
export default function SplashAudio() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const onHome = pathname === "/";
    let disposed = false;
    let forced = false;
    let pausedByUser = false;
    let claimedHere = false;
    let gestureOff: (() => void) | null = null;
    const timers: number[] = [];

    function readConfig() {
      return {
        src: root.getAttribute("data-design-splash-audio") || "",
        enabled: root.getAttribute("data-design-splash-audio-enabled") === "true",
      };
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

    /** حجز التشغيل الوحيد في الجلسة. المحاولات المتتابعة في نفس الصفحة مسموحة، وبعدها لأ. */
    function claimSession(): boolean {
      if (claimedHere) return true;
      if (!claimSessionPlay(sessionStore(), sessionClaimed)) return false;
      sessionClaimed = true;
      claimedHere = true;
      return true;
    }

    async function tryPlay(): Promise<boolean> {
      if (disposed || sharedStarted) return false;
      if (!onHome && !forced) return false;
      const { src, enabled } = readConfig();
      if (!src || !enabled || isSoundMuted()) return false;
      // المعاينة من الاستوديو مش داخلة في حساب «مرة واحدة في الجلسة».
      if (!forced && !claimSession()) { clearTimers(); disarmGesture(); return false; }
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
      pausedByUser = false;
      clearTimers();
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

    // الجلسة اللي شافت تشغيل خلاص مابنحاولش فيها تاني — لا محاولات ولا انتظار للمسة.
    const fresh = forced || (onHome && !hasPlayedThisSession(sessionStore()));

    if (onHome && fresh) {
      scheduleAttempts();
      armGesture();
    }

    // إعدادات التصميم بتتغيّر بعد التحميل (أو من الاستوديو مباشرة): أول ما رابط المقطع يظهر بنشغّله.
    const observer = new MutationObserver(() => {
      if (disposed || sharedStarted || (!forced && !fresh)) return;
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

    // الكتم أثناء التشغيل يوقف الصوت، ورفع الكتم بيكمّل من نفس اللحظة (مش من الأول).
    const onMute = () => {
      if (isSoundMuted()) {
        sharedAudio?.pause();
        if (sharedStarted) pausedByUser = true;
        armGesture();
      } else if (!sharedStarted) {
        armGesture();
      } else if (pausedByUser && !forced) {
        pausedByUser = false;
        void sharedAudio?.play().catch(() => undefined);
      }
    };
    window.addEventListener(SOUND_MUTE_EVENT, onMute);

    // معاينة شاشة البداية من الاستوديو (من أي صفحة): يعيد الصوت من البداية.
    const onPreview = () => {
      forced = true;
      sharedStarted = false;
      pausedByUser = false;
      if (sharedAudio) {
        sharedAudio.pause();
        try { sharedAudio.currentTime = 0; } catch { /* ignore */ }
      }
      void tryPlay();
      armGesture();
    };
    window.addEventListener(SPLASH_PREVIEW_EVENT, onPreview);

    // زر السماعة على شاشة البداية: يوقف المقطع، وزر التشغيل بيكمّل من حيث وقف.
    const onStop = (event: Event) => {
      const muted = (event as CustomEvent<{ muted?: boolean }>).detail?.muted !== false;
      if (muted) {
        sharedAudio?.pause();
        if (sharedStarted) pausedByUser = true;
        disarmGesture();
      } else {
        pausedByUser = false;
        if (sharedStarted && sharedAudio) void sharedAudio.play().catch(() => undefined);
        else { sharedStarted = false; void tryPlay(); }
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

export { SPLASH_AUDIO_SESSION_KEY };

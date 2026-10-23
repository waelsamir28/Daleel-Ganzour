// Tap feedback for the whole app: a short vibration (Android browsers only — iOS Safari has no
// vibration API) and a soft synthesised "tick" rendered with WebAudio, so no audio file is loaded.
// The mode comes from the design settings (data-design-tap-feedback = off | haptic | sound | both)
// and every visitor can mute the sound from the header speaker icon (kept in localStorage).

export type FeedbackMode = "off" | "haptic" | "sound" | "both";

export const SOUND_MUTE_KEY = "janzour-sound-muted";
export const SOUND_MUTE_EVENT = "janzour:sound-mute";

let audioContext: AudioContext | undefined;
let lastTick = 0;

function readMode(): FeedbackMode {
  if (typeof document === "undefined") return "off";
  const value = document.documentElement.getAttribute("data-design-tap-feedback");
  return value === "off" || value === "haptic" || value === "sound" || value === "both" ? value : "both";
}

export function isSoundMuted(): boolean {
  try { return typeof localStorage !== "undefined" && localStorage.getItem(SOUND_MUTE_KEY) === "1"; } catch { return false; }
}

export function setSoundMuted(muted: boolean) {
  try { localStorage.setItem(SOUND_MUTE_KEY, muted ? "1" : "0"); } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new CustomEvent(SOUND_MUTE_EVENT, { detail: { muted } })); } catch { /* ignore */ }
  if (!muted) tick("open");
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    // feedback is optional
  }
}

export type TickKind = "tap" | "open" | "close";

// Soft, short click: a sine blip decaying within ~70 ms. Volume is deliberately low.
function tick(kind: TickKind) {
  try {
    const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioContext ??= new Ctor();
    const ctx = audioContext;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.07 : 0.09, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "tap" ? 0.06 : 0.075));
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const base = kind === "open" ? 880 : kind === "close" ? 660 : 760;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.6, now + 0.07);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.09);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {
    // feedback is optional
  }
}

export function tapFeedback(kind: TickKind = "tap") {
  const mode = readMode();
  if (mode === "off") return;
  const now = Date.now();
  if (now - lastTick < 60) return; // one tick per gesture even if several handlers fire
  lastTick = now;
  if (mode === "haptic" || mode === "both") vibrate(kind === "open" ? 12 : kind === "close" ? 8 : 6);
  if ((mode === "sound" || mode === "both") && !isSoundMuted()) tick(kind);
}

// Backwards-compatible helper for the header menu.
export function menuFeedback(opening: boolean) { tapFeedback(opening ? "open" : "close"); }

// Elements that count as "a button" for the global listener.
const TAP_SELECTOR = "button, a[href], [role=\"button\"], input[type=\"checkbox\"], input[type=\"radio\"], summary, .category-tile, .provider-card";

export function isTapTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const hit = target.closest(TAP_SELECTOR);
  if (!hit) return false;
  if (hit.hasAttribute("data-no-feedback")) return false;
  if (hit instanceof HTMLButtonElement && hit.disabled) return false;
  return true;
}

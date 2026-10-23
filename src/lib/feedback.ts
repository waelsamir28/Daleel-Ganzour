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

export type TickKind = "tap" | "open" | "close" | "success" | "error";

function getContext(): AudioContext | undefined {
  const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  audioContext ??= new Ctor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function blip(ctx: AudioContext, at: number, frequency: number, duration: number, peak: number, type: OscillatorType = "sine", slideTo = frequency * 0.6) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.exponentialRampToValueAtTime(slideTo, at + duration);
  osc.connect(gain);
  osc.start(at);
  osc.stop(at + duration + 0.02);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

// Soft, short tones, deliberately quiet:
//  tap/open/close → one sine blip (~70 ms)
//  success        → two ascending notes (like a gentle "ding-ding")
//  error          → one low, slightly buzzy note
function tick(kind: TickKind) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (kind === "success") {
      blip(ctx, now, 660, 0.11, 0.08, "sine", 660);
      blip(ctx, now + 0.1, 990, 0.16, 0.09, "sine", 990);
      return;
    }
    if (kind === "error") {
      blip(ctx, now, 220, 0.18, 0.08, "triangle", 160);
      return;
    }
    const base = kind === "open" ? 880 : kind === "close" ? 660 : 760;
    blip(ctx, now, base, kind === "tap" ? 0.06 : 0.075, kind === "tap" ? 0.07 : 0.09);
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
  if (mode === "haptic" || mode === "both") vibrate(kind === "success" ? [10, 40, 18] : kind === "error" ? [30, 50, 30] : kind === "open" ? 12 : kind === "close" ? 8 : 6);
  if ((mode === "sound" || mode === "both") && !isSoundMuted()) tick(kind);
}

// Outcome tones: saved/sent successfully vs. a form or request error.
let lastOutcome = 0;
function outcome(kind: "success" | "error") {
  const now = Date.now();
  if (now - lastOutcome < 500) return; // a failed request + its inline error notice = one buzz
  lastOutcome = now;
  lastTick = 0;
  tapFeedback(kind);
}
export function successFeedback() { outcome("success"); }
export function errorFeedback() { outcome("error"); }

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

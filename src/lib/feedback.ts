// Light tactile/audio feedback for the header menu: a short vibration (Android browsers only —
// iOS Safari has no vibration API) and a soft synthesised "tick" rendered with WebAudio so no
// audio file needs loading. Mode comes from the design settings (data-design-menu-feedback).

type FeedbackMode = "off" | "haptic" | "sound" | "both";

let audioContext: AudioContext | undefined;

function readMode(): FeedbackMode {
  if (typeof document === "undefined") return "off";
  const value = document.documentElement.getAttribute("data-design-menu-feedback");
  return value === "off" || value === "haptic" || value === "sound" || value === "both" ? value : "both";
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    // ignore — feedback is optional
  }
}

// Soft, short click: a sine blip that decays within ~70 ms, plus a tiny noise-free high partial
// so it reads as a "tick" instead of a beep. Volume is kept low on purpose.
function tick(opening: boolean) {
  try {
    const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioContext ??= new Ctor();
    const ctx = audioContext;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const base = opening ? 880 : 660;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.6, now + 0.07);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.09);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {
    // ignore — feedback is optional
  }
}

export function menuFeedback(opening: boolean) {
  const mode = readMode();
  if (mode === "off") return;
  if (mode === "haptic" || mode === "both") vibrate(opening ? 12 : 8);
  if (mode === "sound" || mode === "both") tick(opening);
}

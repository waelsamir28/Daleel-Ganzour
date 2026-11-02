"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundMuted, setSoundMuted } from "@/lib/feedback";

/**
 * صوت الترحيب بالمهني: يشتغل مرة واحدة لكل مهني أول ما يفتح صفحة «حسابي».
 * يحترم كتم الصوت العام، وفيه زر صغير لإيقافه أو تشغيله تاني.
 */
export default function WelcomeAudio({ token }: { token: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState("");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => (typeof window === "undefined" ? false : isSoundMuted()));

  useEffect(() => {
    let alive = true;
    const key = `janzour-welcome-audio-${token.slice(0, 10)}`;
    let played = false;
    try { played = localStorage.getItem(key) === "1"; } catch { /* ignore */ }
    if (played) return;
    fetch("/api/site-audio")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { welcome?: string } | null) => {
        if (!alive || !data?.welcome || isSoundMuted()) return;
        setReady(data.welcome);
        const element = new Audio(data.welcome);
        element.volume = 0.8;
        audio.current = element;
        element.onended = () => { setPlaying(false); try { localStorage.setItem(key, "1"); } catch { /* ignore */ } };
        void element.play().then(() => { setPlaying(true); try { localStorage.setItem(key, "1"); } catch { /* ignore */ } }).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => { alive = false; audio.current?.pause(); };
  }, [token]);

  if (!ready) return null;

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (playing) { element.pause(); setPlaying(false); return; }
    void element.play().then(() => setPlaying(true)).catch(() => undefined);
  }

  return (
    <div className="welcome-audio-bar" role="status">
      <Volume2 size={16}/>
      <span>رسالة ترحيب صوتية من إدارة الدليل</span>
      <button type="button" className="welcome-audio-btn" onClick={toggle}>{playing ? "إيقاف" : "تشغيل"}</button>
      <button
        type="button"
        className="welcome-audio-btn is-mute"
        onClick={() => { const next = !muted; setMuted(next); setSoundMuted(next); if (next) { audio.current?.pause(); setPlaying(false); } }}
        aria-label={muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
      >
        {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
      </button>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Music4, Play, Trash2 } from "lucide-react";
import { DESIGN_AUDIO_MAX_BYTES, SPLASH_AUDIO_MAX_SECONDS } from "@/lib/catalog";
import { readFileAsDataUrl } from "@/lib/client-image";

const ACCEPTED = /^audio\/(mpeg|mp3|mp4|x-m4a|aac|wav|x-wav|wave|ogg|webm)$/;
function kb(bytes: number) { return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`; }

/** يقرأ مدة الملف الصوتي بالسنتيجرام قبل رفعه (لو المتصفح لم يستطع القراءة نكمل بدون تحقق). */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => { const seconds = Number.isFinite(audio.duration) ? audio.duration : 0; URL.revokeObjectURL(url); resolve(seconds); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    audio.src = url;
  });
}

type Props = { value: string; onChange: (url: string) => void; audioKey?: "splash" | "welcome"; label?: string };

/**
 * رفع صوت شاشة البداية من الاستوديو: MP3/M4A/WAV/OGG حتى ٢ ميجابايت و~٢٠ ثانية،
 * مع تعليمات الحجم مكتوبة للمسؤول، ومعاينة تشغيل وزر حذف.
 */
export default function AudioUploadField({ value, onChange, audioKey = "splash", label = "صوت شاشة البداية (رفع من الجهاز)" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!ACCEPTED.test(file.type)) { setError("اختر ملف صوت MP3 أو M4A أو WAV أو OGG."); return; }
    if (file.size > DESIGN_AUDIO_MAX_BYTES) {
      setError(`الملف ${kb(file.size)} — الحد الأقصى ٢ ميجابايت. اضغط المقطع (MP3 بجودة 96–128 كيلوبت) ثم ارفعه.`);
      return;
    }
    setBusy(true);
    try {
      const seconds = await readDuration(file);
      if (seconds > SPLASH_AUDIO_MAX_SECONDS) throw new Error(`المقطع ${Math.round(seconds)} ثانية — الأقصى ${SPLASH_AUDIO_MAX_SECONDS} ثانية. اختر مقطعًا أقصر.`);
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-audio", key: audioKey, audio: dataUrl }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "تعذّر رفع المقطع الصوتي.");
      setDuration(seconds);
      onChange(String(payload.url));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذّر رفع المقطع الصوتي."); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try {
      await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-audio", key: audioKey, audio: "__remove__" }) });
      setDuration(0);
      onChange("");
    } finally { setBusy(false); }
  }

  return (
    <div className="audio-upload-field">
      <span className="image-upload-label"><Music4 size={15}/> {label}</span>
      <div className="audio-upload-body">
        {value ? (
          <>
            <audio controls preload="metadata" src={value} className="audio-upload-player"/>
            <div className="audio-upload-actions">
              <span className="audio-upload-meta">{duration ? `${Math.round(duration)} ثانية` : "تم الرفع"} · MP3 يشتغل على كل الأجهزة</span>
              <button type="button" className="button button-soft" onClick={() => input.current?.click()} disabled={busy}><Play size={15}/> تغيير المقطع</button>
              <button type="button" className="button button-soft is-danger" onClick={() => void remove()} disabled={busy}><Trash2 size={15}/> حذف</button>
            </div>
          </>
        ) : (
          <button type="button" className="audio-upload-drop" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <LoaderCircle size={20} className="spin"/> : <Music4 size={22}/>}
            <strong>{busy ? "جاري الرفع…" : "ارفع مقطع صوت من جهازك"}</strong>
            <small>MP3 أو M4A أو WAV أو OGG · حتى ٢ ميجابايت · مدة تصلح لشاشة البداية (حوالي ١٠ ثوانٍ، والأقصى ٢٠)</small>
          </button>
        )}
        <input ref={input} type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,audio/webm" hidden onChange={(event) => void onFile(event)}/>
        {error && <p className="my-inline-status is-error">{error}</p>}
      </div>
    </div>
  );
}

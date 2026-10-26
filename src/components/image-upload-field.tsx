"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { DESIGN_IMAGE_GUIDE, DESIGN_IMAGE_MAX_BYTES, designImageSizeText, pxToCm, type DesignImageKey } from "@/lib/catalog";

type Props = {
  imageKey: DesignImageKey;
  /** الرابط الحالي المخزَّن في إعدادات المظهر (فارغ = الافتراضي). */
  value: string;
  onChange: (url: string) => void;
  /** معاينة الافتراضي عندما تكون القيمة فارغة. */
  fallbackSrc?: string;
  label?: string;
  /** شكل المعاينة: مربع صغير للوجو أو شريط عريض للبانرات. */
  wide?: boolean;
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}
function measure(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/** زر «رفع صورة من الجهاز» لصور المظهر (لوجو/سبلاش/بانرات) — بدل كتابة لينك. المقاس يُكتب بالسنتيمتر وبجانبه البكسل. */
export default function ImageUploadField({ imageKey, value, onChange, fallbackSrc = "", label, wide = false }: Props) {
  const guide = DESIGN_IMAGE_GUIDE[imageKey];
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const preview = value || fallbackSrc;

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > DESIGN_IMAGE_MAX_BYTES) { setError("حجم الصورة أكبر من 2 ميجابايت — صغّرها وحاول مرة أخرى."); return; }
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      const dims = await measure(dataUrl);
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-image", key: imageKey, image: dataUrl }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "تعذّر رفع الصورة.");
      setMeasured(dims.width ? dims : null);
      onChange(String(payload.url));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذّر رفع الصورة."); }
    finally { setBusy(false); }
  }

  async function remove() {
    setError(""); setBusy(true);
    try {
      await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-image", key: imageKey, image: "__remove__" }) });
      setMeasured(null);
      onChange("");
    } finally { setBusy(false); }
  }

  const isUploaded = value.startsWith("/api/design-image/");
  return (
    <div className={`image-upload-field ${wide ? "is-wide" : ""}`}>
      {(label ?? guide.label) && <span className="image-upload-label">{label ?? guide.label}</span>}
      <div className="image-upload-row">
        <div className="image-upload-preview" aria-hidden={!preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt=""/> : <ImagePlus size={22}/>}
        </div>
        <div className="image-upload-actions">
          <button type="button" className="button button-primary button-small" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <LoaderCircle size={15} className="spin"/> : <ImagePlus size={15}/>}
            <span>{value ? "استبدال الصورة" : "رفع صورة من الجهاز"}</span>
          </button>
          {value && (
            <button type="button" className="button button-soft button-small" disabled={busy} onClick={() => void (isUploaded ? remove() : Promise.resolve(onChange("")))}>
              <Trash2 size={15}/><span>الرجوع للافتراضي</span>
            </button>
          )}
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => void onFile(event)}/>
        </div>
      </div>
      <small className="image-upload-hint">
        المقاس المقترح: <b>{designImageSizeText(imageKey)}</b> — {guide.hint}. حتى 2 ميجابايت (PNG / JPG / WebP / GIF).
        {measured && <> · مقاس الصورة المرفوعة: <b>{pxToCm(measured.width)} × {pxToCm(measured.height)} سم</b> (≈ {measured.width} × {measured.height} بكسل)</>}
      </small>
      {error && <small className="image-upload-error">{error}</small>}
    </div>
  );
}

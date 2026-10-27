"use client";

import { Eraser, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { DESIGN_IMAGE_GUIDE, DESIGN_IMAGE_MAX_BYTES, designImageSizeText, pxToCm, type DesignImageKey } from "@/lib/catalog";
import { shrinkImageFile } from "@/lib/client-image";

type Props = {
  imageKey: DesignImageKey;
  /** الرابط الحالي المخزَّن في إعدادات المظهر (فارغ = الافتراضي). */
  value: string;
  onChange: (url: string) => void;
  /** معاينة الافتراضي عندما تكون القيمة فارغة. */
  fallbackSrc?: string;
  /** يظهر زر «إزالة الخلفية» (شعارات تُعرض فوق خلفية ملوّنة). */
  transparentTool?: boolean;
  label?: string;
  /** شكل المعاينة: مربع صغير للوجو أو شريط عريض للبانرات. */
  wide?: boolean;
};

/** زر «رفع صورة من الجهاز» لصور المظهر (لوجو/سبلاش/بانرات) — بدل كتابة لينك. المقاس يُكتب بالسنتيمتر وبجانبه البكسل. */
export default function ImageUploadField({ imageKey, value, onChange, fallbackSrc = "", label, wide = false, transparentTool = false }: Props) {
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
    setBusy(true);
    try {
      // تصغير داخل المتصفح أولًا: صور الهاتف الكبيرة تصبح بضع مئات من الكيلوبايت قبل الرفع.
      const shrunk = await shrinkImageFile(file, { maxWidth: Math.min(guide.width, 1600), maxHeight: Math.min(guide.height, 900), quality: 86, preferAlpha: imageKey === "header-logo" || imageKey === "splash" });
      if (shrunk.bytes > DESIGN_IMAGE_MAX_BYTES) throw new Error("الصورة ما زالت أكبر من 2 ميجابايت بعد التصغير — جرّب صورة أبسط أو PNG/JPG بدل GIF.");
      const dataUrl = shrunk.dataUrl;
      const dims = { width: shrunk.width, height: shrunk.height };
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-image", key: imageKey, image: dataUrl }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "تعذّر رفع الصورة.");
      setMeasured(dims.width ? dims : null);
      onChange(String(payload.url));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذّر رفع الصورة."); }
    finally { setBusy(false); }
  }

  /** يطلب من الخادم جعل الخلفية الصلبة للصورة المرفوعة شفافة (شعار/شاشة البداية). */
  async function removeBackground() {
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "design-image", key: imageKey, image: "__remove_bg__" }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.url) throw new Error(payload?.error || "تعذّر إزالة الخلفية.");
      onChange(String(payload.url));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذّر إزالة الخلفية."); }
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
          {transparentTool && isUploaded && (
            <button type="button" className="button button-soft button-small" disabled={busy} title="إزالة الخلفية البيضاء/الصلبة حول الشعار لتصبح شفافة" onClick={() => void removeBackground()}>
              <Eraser size={15}/><span>إزالة الخلفية</span>
            </button>
          )}
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => void onFile(event)}/>
        </div>
      </div>
      <small className="image-upload-hint">
        المقاس المقترح: <b>{designImageSizeText(imageKey)}</b> — {guide.hint}. حتى 2 ميجابايت (PNG / JPG / WebP / GIF).{transparentTool && <> الخلفية البيضاء أو الصلبة حول الشعار تُزال تلقائيًا عند الرفع لتظهر شفافة.</>}
        {measured && <> · مقاس الصورة المرفوعة: <b>{pxToCm(measured.width)} × {pxToCm(measured.height)} سم</b> (≈ {measured.width} × {measured.height} بكسل)</>}
      </small>
      {error && <small className="image-upload-error">{error}</small>}
    </div>
  );
}

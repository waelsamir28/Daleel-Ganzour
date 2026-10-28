"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Camera, Check, ImageUp, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { SERVICE_PHOTO_MAX_FILE } from "@/lib/catalog";

/**
 * اختيار الصورة الشخصية للمهني مع قصّها داخل دائرة قبل الرفع:
 * - الملف حتى 3 ميجابايت، ثم يُقص ويُصغَّر إلى 320×320 ويُضغط (WebP/JPEG) ليصبح بضع عشرات من الكيلوبايت.
 * - القيمة: undefined = بلا تغيير، null = حذف الصورة الحالية، نص = صورة جديدة (data URL).
 */
type Props = {
  value: string | null | undefined;
  currentUrl?: string;
  onChange: (next: string | null | undefined) => void;
  size?: number;
  hint?: string;
};

const BOX = 280;
const OUTPUT = 320;

type Source = { draw: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { draw: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch { /* fallback */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("تعذّر قراءة الصورة."));
      el.src = url;
    });
    return { draw: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

export default function AvatarPicker({ value, currentUrl = "", onChange, size = 76, hint }: Props) {
  const [source, setSource] = useState<Source | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);

  const preview = value === null ? "" : value ?? currentUrl;

  function baseScale(src: Source) { return Math.max(BOX / src.width, BOX / src.height); }
  function clampOffset(next: { x: number; y: number }, src: Source, z: number) {
    const scale = baseScale(src) * z;
    const w = src.width * scale, h = src.height * scale;
    const minX = BOX - w, minY = BOX - h;
    return { x: Math.min(0, Math.max(minX, next.x)), y: Math.min(0, Math.max(minY, next.y)) };
  }

  // رسم المعاينة داخل الصندوق
  useEffect(() => {
    if (!source || !canvas.current) return;
    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;
    const scale = baseScale(source) * zoom;
    ctx.clearRect(0, 0, BOX, BOX);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, BOX, BOX);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.draw, offset.x, offset.y, source.width * scale, source.height * scale);
  }, [source, zoom, offset]);

  // منع Escape من إغلاق النافذة الأم أثناء القص
  useEffect(() => {
    if (!source) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); cancel(); } };
    document.addEventListener("keydown", onKey, true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey, true); document.body.style.overflow = previous; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!/^image\//.test(file.type)) { setError("اختر ملف صورة (JPG أو PNG أو WebP)."); return; }
    if (file.size > SERVICE_PHOTO_MAX_FILE) { setError("حجم الصورة أكبر من 3 ميجابايت. اختر صورة أصغر."); return; }
    try {
      const decoded = await decode(file);
      source?.release();
      setSource(decoded);
      setZoom(1);
      const scale = baseScale(decoded);
      setOffset({ x: (BOX - decoded.width * scale) / 2, y: (BOX - decoded.height * scale) / 2 });
    } catch { setError("تعذّر فتح الصورة. جرّب صورة أخرى."); }
    if (fileInput.current) fileInput.current.value = "";
  }

  function changeZoom(nextZoom: number, focus = { x: BOX / 2, y: BOX / 2 }) {
    if (!source) return;
    const z = Math.min(4, Math.max(1, nextZoom));
    const prevScale = baseScale(source) * zoom, nextScale = baseScale(source) * z;
    // نثبّت النقطة محل التركيز (مركز الدائرة أو بين الإصبعين) أثناء التكبير
    const next = { x: focus.x - ((focus.x - offset.x) / prevScale) * nextScale, y: focus.y - ((focus.y - offset.y) / prevScale) * nextScale };
    setZoom(z);
    setOffset(clampOffset(next, source, z));
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) dragStart.current = { x: event.clientX, y: event.clientY, offset };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      dragStart.current = null;
    }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!source || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width / BOX;
      const focus = { x: ((a.x + b.x) / 2 - rect.left) / ratio, y: ((a.y + b.y) / 2 - rect.top) / ratio };
      changeZoom(pinch.current.zoom * (distance / Math.max(1, pinch.current.distance)), focus);
      return;
    }
    if (dragStart.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width / BOX;
      const next = { x: dragStart.current.offset.x + (event.clientX - dragStart.current.x) / ratio, y: dragStart.current.offset.y + (event.clientY - dragStart.current.y) / ratio };
      setOffset(clampOffset(next, source, zoom));
    }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()];
      dragStart.current = { x: remaining.x, y: remaining.y, offset };
    } else dragStart.current = null;
  }

  function confirm() {
    if (!source) return;
    const out = document.createElement("canvas");
    out.width = OUTPUT; out.height = OUTPUT;
    const ctx = out.getContext("2d");
    if (!ctx) { setError("المتصفح لا يدعم معالجة الصور."); return; }
    const scale = baseScale(source) * zoom;
    const sx = -offset.x / scale, sy = -offset.y / scale, sw = BOX / scale, sh = BOX / scale;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(source.draw, sx, sy, sw, sh, 0, 0, OUTPUT, OUTPUT);
    let dataUrl = out.toDataURL("image/webp", 0.82);
    if (!dataUrl.startsWith("data:image/webp")) dataUrl = out.toDataURL("image/jpeg", 0.82);
    onChange(dataUrl);
    source.release();
    setSource(null);
  }
  function cancel() { source?.release(); setSource(null); }

  const kb = value ? Math.round(((value.length - value.indexOf(",") - 1) * 3) / 4 / 1024) : 0;

  return <div className="avatar-picker">
    <div className="avatar-picker-row">
      <button type="button" className={`avatar-picker-circle ${preview ? "has-photo" : ""}`} style={{ width: size, height: size }} onClick={() => fileInput.current?.click()} aria-label={preview ? "تغيير الصورة الشخصية" : "إضافة صورة شخصية"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="" /> : <Camera size={Math.round(size * 0.38)} />}
        <span className="avatar-picker-badge"><ImageUp size={13} /></span>
      </button>
      <div className="avatar-picker-copy">
        <strong>الصورة الشخصية <small>(اختياري)</small></strong>
        <span>{hint ?? "صورتك أو لوجو المحل — تظهر في دائرة على بطاقتك. حتى 3 ميجابايت، ونقصّها ونضغطها تلقائيًا."}</span>
        <div className="avatar-picker-actions">
          <button type="button" className="button button-soft button-small" onClick={() => fileInput.current?.click()}><ImageUp size={14} />{preview ? "تغيير الصورة" : "اختيار صورة"}</button>
          {preview && <button type="button" className="button button-danger-soft button-small" onClick={() => onChange(currentUrl ? null : undefined)}><Trash2 size={14} />حذف</button>}
          {kb > 0 && <small className="avatar-picker-size">{kb} ك.ب بعد الضغط</small>}
        </div>
        {error && <small className="avatar-picker-error" role="alert">{error}</small>}
      </div>
    </div>
    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void pick(event.target.files?.[0])} />

    {source && <div className="avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="قص الصورة الشخصية">
      <div className="avatar-crop-panel">
        <header><strong>قصّ الصورة</strong><span>حرّك الصورة بإصبعك وكبّرها حتى يظهر الجزء المطلوب داخل الدائرة.</span></header>
        <div className="avatar-crop-stage">
          <canvas ref={canvas} width={BOX} height={BOX} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={(event) => { event.preventDefault(); changeZoom(zoom * (event.deltaY < 0 ? 1.08 : 0.92)); }} />
          <span className="avatar-crop-mask" aria-hidden="true" />
        </div>
        <div className="avatar-crop-zoom">
          <button type="button" className="icon-button" onClick={() => changeZoom(zoom - 0.2)} aria-label="تصغير"><ZoomOut size={16} /></button>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} aria-label="التكبير" />
          <button type="button" className="icon-button" onClick={() => changeZoom(zoom + 0.2)} aria-label="تكبير"><ZoomIn size={16} /></button>
        </div>
        <div className="avatar-crop-actions">
          <button type="button" className="button button-soft" onClick={cancel}><X size={16} />إلغاء</button>
          <button type="button" className="button button-primary" onClick={confirm}><Check size={16} />اعتماد الصورة</button>
        </div>
      </div>
    </div>}
  </div>;
}

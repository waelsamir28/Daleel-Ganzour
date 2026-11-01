"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { shrinkImageFile } from "@/lib/client-image";
import { SERVICE_GALLERY_MAX, SERVICE_GALLERY_MAX_FILE, SERVICE_GALLERY_TARGET_BYTES, serviceGalleryUrls, type ServiceRecord } from "@/lib/catalog";

/** صيغ مقبولة في معرض الأعمال (بدون GIF حتى تبقى الصورة بالكيلوبايت بعد الضغط). */
const ACCEPTED = /^image\/(jpeg|png|webp)$/;

function kb(bytes: number) { return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`; }

function dataUrlBytes(dataUrl: string) {
  const body = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((body.length * 3) / 4);
}

/**
 * يصغّر صورة العمل ويضغطها حتى تهبط تحت الحد المستهدف (يبدأ بجودة 78 ثم ينزل تدريجيًا).
 * النتيجة عادةً بين 60 و200 كيلوبايت من صورة هاتف 3 ميجابايت.
 */
async function compressWorkPhoto(file: File) {
  const attempts = [{ size: 1400, quality: 78 }, { size: 1200, quality: 70 }, { size: 1000, quality: 62 }, { size: 900, quality: 55 }, { size: 760, quality: 48 }];
  let best: { dataUrl: string; bytes: number } | null = null;
  for (const attempt of attempts) {
    const next = await shrinkImageFile(file, { maxWidth: attempt.size, maxHeight: attempt.size, quality: attempt.quality });
    if (!best || next.bytes < best.bytes) best = { dataUrl: next.dataUrl, bytes: next.bytes };
    if (best.bytes <= SERVICE_GALLERY_TARGET_BYTES) break;
  }
  if (!best) throw new Error("تعذّر تجهيز الصورة. جرّب صورة أخرى.");
  return best;
}

type Props = {
  service: Pick<ServiceRecord, "id" | "gallerySlots" | "galleryVersion">;
  /** يرسل الصورة للخادم: data URL للرفع أو null للحذف، ويرجّع true عند النجاح. */
  onUpload: (slot: number, photo: string | null) => Promise<boolean>;
};

/**
 * معرض صور الأعمال في صفحة «حسابي»: ٤ خانات، تعليمات الحجم مكتوبة بوضوح للعميل،
 * والصور تُصغَّر وتُضغط داخل المتصفح قبل الرفع فتبقى بالكيلوبايت.
 */
export default function ProviderGallery({ service, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [slot, setSlot] = useState(1);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const urls = serviceGalleryUrls(service);
  const used = new Set(urls.map((url) => Number(url.split("/").pop()?.split("?")[0])));

  function pick(target: number) {
    setSlot(target); setError(""); setNote("");
    inputRef.current?.click();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(""); setNote("");
    if (!ACCEPTED.test(file.type)) return setError("اختر صورة JPG أو PNG أو WebP (بدون GIF).");
    if (file.size > SERVICE_GALLERY_MAX_FILE) return setError(`الصورة ${kb(file.size)} — الحد الأقصى ${kb(SERVICE_GALLERY_MAX_FILE)} لكل صورة. صغّرها أو اختر صورة أخرى.`);
    setBusy(slot);
    try {
      const shrunk = await compressWorkPhoto(file);
      if (dataUrlBytes(shrunk.dataUrl) > SERVICE_GALLERY_TARGET_BYTES * 1.4) throw new Error("تعذّر ضغط الصورة بدرجة كافية. جرّب صورة أخرى.");
      const ok = await onUpload(slot, shrunk.dataUrl);
      if (ok) setNote(`تم حفظ الصورة (${kb(dataUrlBytes(shrunk.dataUrl))} بعد الضغط).`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر تجهيز الصورة. جرّب صورة أخرى.");
    } finally { setBusy(0); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(target: number) {
    setError(""); setNote("");
    setBusy(target);
    try { if (await onUpload(target, null)) setNote("تم حذف الصورة من المعرض."); }
    finally { setBusy(0); }
  }

  return (
    <div className="provider-gallery">
      <div className="gallery-rules" role="note">
        <UploadCloud size={20} aria-hidden="true"/>
        <div>
          <strong>صور شغلك بتظهر للعميل قبل ما يتصل — حتى {SERVICE_GALLERY_MAX} صور</strong>
          <ul>
            <li>كل صورة <b>{kb(SERVICE_GALLERY_MAX_FILE)} (٣ ميجابايت)</b> كحد أقصى قبل الرفع.</li>
            <li>إحنا بنصغّرها ونضغطها تلقائيًا فتبقى <b>بالكيلوبايت</b> — مش محتاج تصغّرها بنفسك.</li>
            <li>صور واضحة في النور وبزاوية واحدة لكل شغلانة = ثقة أكتر واتصالات أكتر.</li>
          </ul>
        </div>
      </div>

      <div className="gallery-grid">
        {Array.from({ length: SERVICE_GALLERY_MAX }, (_, index) => index + 1).map((target) => {
          const url = urls.find((item) => Number(item.split("/").pop()?.split("?")[0]) === target);
          return (
            <div key={target} className={`gallery-slot ${url ? "has-photo" : ""}`}>
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element -- صورة من مسار API محلي ولا تحتاج تحسين next/image */
                <img src={url} alt={`صورة من أعمال المهني رقم ${target}`} width={320} height={320} loading="lazy" decoding="async"/>
              ) : (
                <span className="gallery-slot-empty" aria-hidden="true"><Camera size={22}/></span>
              )}
              <span className="gallery-slot-no">{target}</span>
              {busy === target ? (
                <span className="gallery-slot-busy"><LoaderCircle size={20} className="spin"/> جاري الضغط والرفع…</span>
              ) : (
                <span className="gallery-slot-actions">
                  <button type="button" onClick={() => pick(target)} disabled={busy !== 0} aria-label={url ? `تغيير الصورة ${target}` : `إضافة الصورة ${target}`}>
                    <ImagePlus size={15}/> {url ? "تغيير" : "أضف صورة"}
                  </button>
                  {url && <button type="button" className="is-danger" onClick={() => void remove(target)} disabled={busy !== 0} aria-label={`حذف الصورة ${target}`}><Trash2 size={15}/></button>}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <p className="gallery-count">مستخدم {used.size} من {SERVICE_GALLERY_MAX} صور.</p>
      {error && <p className="my-inline-status is-error">{error}</p>}
      {note && <p className="my-inline-status">{note}</p>}
    </div>
  );
}

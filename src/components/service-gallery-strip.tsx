"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { Modal } from "@/components/ui";
import { serviceGalleryUrls, type ServiceRecord } from "@/lib/catalog";

/**
 * شريط صور أعمال المهني داخل بطاقة التفاصيل: صور مصغّرة أفقية،
 * والضغط على أي صورة يفتحها كبيرة للعميل قبل ما يتصل.
 */
export default function ServiceGalleryStrip({ service, name }: { service: Pick<ServiceRecord, "id" | "gallerySlots" | "galleryVersion">; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const urls = serviceGalleryUrls(service);
  if (!urls.length) return null;
  return (
    <section className="detail-gallery" aria-label="صور من أعمال مقدم الخدمة">
      <header className="detail-gallery-head">
        <Images size={16} aria-hidden="true"/>
        <span>صور من شغله</span>
        <small>{urls.length} صورة</small>
      </header>
      <div className="detail-gallery-strip">
        {urls.map((url, index) => (
          <button key={url} type="button" className="detail-gallery-thumb" onClick={() => setOpen(index)} aria-label={`عرض الصورة ${index + 1} كبيرة`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- صور من مسار API محلي ولا تحتاج تحسين next/image */}
            <img src={url} alt={`عمل رقم ${index + 1} — ${name}`} width={280} height={280} loading="lazy" decoding="async"/>
          </button>
        ))}
      </div>
      {open !== null && urls[open] && (
        <Modal title={`صورة ${open + 1} من ${urls.length}`} subtitle={name} onClose={() => setOpen(null)}>
          <div className="detail-gallery-viewer">
            {/* eslint-disable-next-line @next/next/no-img-element -- صورة كبيرة من مسار API محلي */}
            <img src={urls[open]} alt={`عمل رقم ${open + 1} — ${name}`} decoding="async"/>
            <div className="detail-gallery-nav">
              <button type="button" className="button button-soft" onClick={() => setOpen((index) => (index === null ? null : (index + urls.length - 1) % urls.length))}>السابقة</button>
              <span>{open + 1} / {urls.length}</span>
              <button type="button" className="button button-soft" onClick={() => setOpen((index) => (index === null ? null : (index + 1) % urls.length))}>التالية</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

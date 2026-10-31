"use client";

import { useMemo, useState } from "react";
import { MessageCircle, QrCode, UserRoundPlus } from "lucide-react";
import RatingStickerModal from "@/components/rating-sticker-modal";
import { whatsappUrl } from "@/lib/catalog";
import { providerWelcomeMessage } from "@/lib/provider-onboarding";
import type { AdminDirectory } from "@/lib/catalog";

/**
 * ترحيب المهنيين الجدد: آخر المهن المنشورة، وكل واحدة جنبها زر واحد يبعت
 * رسالة ترحيب واتساب فيها رابط الصفحة، وزر تاني يفتح ملصق QR جاهز للطباعة.
 */
export default function AdminOnboarding({ data }: { data: AdminDirectory }) {
  const [stickerFor, setStickerFor] = useState<{ id: string; name: string; category: string } | null>(null);

  const recent = useMemo(() => {
    const categoryName = new Map(data.categories.map((category) => [category.id, category.name]));
    return data.services
      .filter((service) => service.status === "approved")
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 8)
      .map((service) => ({ id: service.id, name: service.name, phone: service.phone, category: categoryName.get(service.category) ?? "خدمة", createdAt: service.createdAt }));
  }, [data.services, data.categories]);

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><UserRoundPlus size={18}/> ترحيب بالمهنيين الجدد</h3>
          <p>كل مهنة جديدة: ابعتلها رسالة ترحيب واتساب فيها رابط صفحتها، وجهّز لها ملصق QR مجاني لمحلها.</p>
        </div>
      </div>

      {recent.length === 0 && <p className="analytics-empty-hint">لسه مفيش مهن منشورة.</p>}
      <div className="onboarding-list">
        {recent.map((service) => (
          <article key={service.id} className="onboarding-row">
            <div>
              <strong>{service.name}</strong>
              <small>{service.category}</small>
            </div>
            <a
              className="button button-soft button-small"
              href={whatsappUrl(service.phone, providerWelcomeMessage({ name: service.name, categoryName: service.category, siteName: data.settings.siteName, serviceId: service.id }))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={14}/> رسالة ترحيب
            </a>
            <button type="button" className="button button-soft button-small" onClick={() => setStickerFor({ id: service.id, name: service.name, category: service.category })}>
              <QrCode size={14}/> ملصق QR
            </button>
          </article>
        ))}
      </div>

      {stickerFor && (
        <RatingStickerModal name={stickerFor.name} category={stickerFor.category} serviceId={stickerFor.id} siteName={data.settings.siteName} onClose={() => setStickerFor(null)}/>
      )}
    </section>
  );
}

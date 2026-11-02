"use client";

import { useMemo, useState } from "react";
import { BellRing, Check, LoaderCircle, MessageCircle, QrCode, UserRoundPlus } from "lucide-react";
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
  const [sendingId, setSendingId] = useState("");
  const [sentIds, setSentIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  /** إشعار داخلي في التطبيق (يظهر في «إشعاراتي» عند المهني صاحب البطاقة). */
  async function sendWelcomeNotification(service: { id: string; name: string; category: string }) {
    setSendingId(service.id); setError("");
    try {
      const message = `أهلاً بيك في دليل جنزور 🌿 مهنتك «${service.category}» بقت منشورة، وأي حد يدور عليها هيوصل لك. تقدر تحدّث بياناتك أو تضيف صور شغلك من صفحة «حسابي» في أي وقت.`;
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, type: "service", action: "notify-provider", title: `أهلاً بيك يا ${service.name} 👋`, message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "تعذّر إرسال الإشعار.");
      setSentIds((list) => [...list, service.id]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر إرسال الإشعار.");
    } finally { setSendingId(""); }
  }

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

      <p className="onboarding-note">«رسالة ترحيب» = واتساب على رقم المهني. «إشعار بالترحيب» = إشعار داخلي في التطبيق يظهر له في «إشعاراتي» مع رقم إشعار.</p>
      {error && <p className="form-error">{error}</p>}
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
            <button
              type="button"
              className={`button button-small ${sentIds.includes(service.id) ? "button-success" : "button-soft"}`}
              onClick={() => void sendWelcomeNotification(service)}
              disabled={sendingId === service.id || sentIds.includes(service.id)}
              title="إشعار داخلي يظهر للمهني في «إشعاراتي» داخل التطبيق"
            >
              {sendingId === service.id ? <LoaderCircle size={14} className="spin"/> : sentIds.includes(service.id) ? <Check size={14}/> : <BellRing size={14}/>}
              {sentIds.includes(service.id) ? "تم إرسال الترحيب" : "إشعار بالترحيب"}
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

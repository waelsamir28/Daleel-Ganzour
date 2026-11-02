"use client";

import { Sparkles, PhoneCall, MapPin, ArrowLeft } from "lucide-react";
import { getCategory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { arrivalDayLabel, NEW_ARRIVALS_DAYS } from "@/lib/new-arrivals";
import { SpecialtyIcon } from "@/components/ui";
import { categoryTheme } from "@/components/provider-card";

/**
 * شريط «وصل حديثًا»: آخر المهن اللي انضافت للدليل في آخر ٧ أيام.
 * بيحرّك الدليل قدام الزائر وبيشجّع المهنيين التانيين يسجلوا بدري.
 */
export default function NewArrivals({
  services,
  categories,
  now,
  onOpen,
}: {
  services: ServiceRecord[];
  categories: CategoryRecord[];
  now: number;
  onOpen: (service: ServiceRecord) => void;
}) {
  if (!services.length) return null;
  return (
    <section className="container new-arrivals" aria-labelledby="new-arrivals-title">
      <div className="new-arrivals-head">
        <h2 id="new-arrivals-title"><Sparkles size={20} className="new-arrivals-icon"/>وصل حديثًا</h2>
        <p>آخر المهن والخدمات اللي انضمت للدليل في آخر {NEW_ARRIVALS_DAYS} أيام</p>
      </div>
      <div className="new-arrivals-strip" role="list">
        {services.map((service) => {
          const category = getCategory(service.category, categories);
          return (
            <div key={service.id} role="listitem" className="new-arrival-card" style={categoryTheme(category)}>
              <button type="button" className="new-arrival-main" onClick={() => onOpen(service)} aria-label={`عرض تفاصيل ${service.name}`}>
                <span className="new-arrival-icon" aria-hidden="true"><SpecialtyIcon category={category} size={38} art3d sticker/></span>
                <span className="new-arrival-copy">
                  <strong className="new-arrival-name">{service.name}</strong>
                  <span className="new-arrival-cat">{category.name}</span>
                  <span className="new-arrival-meta">
                    {service.address || service.area ? <><MapPin size={11}/>{service.address || service.area}</> : null}
                    <em className="new-arrival-date">{arrivalDayLabel(service.createdAt, now)}</em>
                  </span>
                </span>
              </button>
              <div className="new-arrival-actions">
                <a className="new-arrival-call" href={`tel:${service.phone}`} aria-label={`اتصال بـ ${service.name}`}><PhoneCall size={14}/>اتصال</a>
                <button type="button" className="new-arrival-open" onClick={() => onOpen(service)} aria-label={`فتح صفحة ${service.name}`}>التفاصيل<ArrowLeft size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

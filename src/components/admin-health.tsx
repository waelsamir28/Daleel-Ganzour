"use client";

import { useMemo } from "react";
import { AlertTriangle, ClipboardCheck, HeartPulse, MapPinOff, TimerOff } from "lucide-react";
import { directoryHealth, healthVerdict, STALE_AFTER_DAYS } from "@/lib/directory-health";
import type { AdminDirectory, ServiceRecord } from "@/lib/catalog";

/**
 * «صحة الدليل»: تقرير سريع بنسبة مئوية + ٣ قوائم (أرقام قديمة، بطاقات ناقصة،
 * تخصصات مفاضية) وكل عنصر جنبه زر يوديك تعدّله على طول.
 */
export default function AdminHealth({ data, onEditService, onAddServiceInCategory }: { data: AdminDirectory; onEditService: (service: ServiceRecord) => void; onAddServiceInCategory: (categoryId: string) => void }) {
  const report = useMemo(() => {
    const approved = data.services.filter((service) => service.status === "approved");
    return directoryHealth({
      services: approved.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        address: service.address ?? "",
        serviceItems: service.serviceItems ?? [],
        subSpecialties: service.subSpecialties ?? [],
        confirmedAt: service.confirmedAt,
        createdAt: service.createdAt,
      })),
      categories: data.categories.map((category) => ({ id: category.id, name: category.name, parentId: category.parentId, active: category.active })),
    });
  }, [data.services, data.categories]);

  const verdict = healthVerdict(report.score);
  const serviceById = useMemo(() => new Map(data.services.map((service) => [service.id, service])), [data.services]);

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><HeartPulse size={18}/> صحة الدليل ({report.score}%)</h3>
          <p>{verdict.label} — كل رقم قديم أو بطاقة ناقصة بتقلل ثقة الزوار. الأرقام دي بتتحدث لوحدها مع كل تأكيد بيانات من المهنيين.</p>
        </div>
        <span className={`health-score is-${verdict.tone}`}>{report.score}<small>/100</small></span>
      </div>

      <div className="health-totals">
        <div><TimerOff size={15}/><b>{report.stale.length}</b><small>رقم قديم (أكتر من {STALE_AFTER_DAYS} يوم)</small></div>
        <div><ClipboardCheck size={15}/><b>{report.incomplete.length}</b><small>بطاقة ناقصة بيانات</small></div>
        <div><MapPinOff size={15}/><b>{report.emptySpecialties.length}</b><small>تخصص مفيهوش حد</small></div>
      </div>

      {report.stale.length > 0 && (
        <div className="health-list">
          <h4><AlertTriangle size={14}/> محتاج تأكيد بيانات</h4>
          {report.stale.slice(0, 8).map((item) => {
            const service = serviceById.get(item.id);
            return (
              <article key={item.id} className="health-row">
                <div><strong>{item.name}</strong><small>آخر تأكيد قبل {item.days} يوم</small></div>
                {service && <button type="button" className="button button-soft button-small" onClick={() => onEditService(service)}>تعديل</button>}
              </article>
            );
          })}
          {report.stale.length > 8 && <p className="health-more">و{report.stale.length - 8} غيرهم…</p>}
        </div>
      )}

      {report.incomplete.length > 0 && (
        <div className="health-list">
          <h4><ClipboardCheck size={14}/> بطاقات ناقصة</h4>
          {report.incomplete.slice(0, 8).map((item) => {
            const service = serviceById.get(item.id);
            return (
              <article key={item.id} className="health-row">
                <div><strong>{item.name}</strong><small>ناقص: {item.missing.join(" • ")}</small></div>
                {service && <button type="button" className="button button-soft button-small" onClick={() => onEditService(service)}>استكمال</button>}
              </article>
            );
          })}
          {report.incomplete.length > 8 && <p className="health-more">و{report.incomplete.length - 8} غيرهم…</p>}
        </div>
      )}

      {report.emptySpecialties.length > 0 && (
        <div className="health-list">
          <h4><MapPinOff size={14}/> تخصصات بدون مهنيين</h4>
          {report.emptySpecialties.slice(0, 8).map((item) => (
            <article key={item.id} className="health-row">
              <div><strong>{item.name}</strong><small>محتاج أول مهني في التخصص ده</small></div>
              <button type="button" className="button button-soft button-small" onClick={() => onAddServiceInCategory(item.id)}>أضف مهنة</button>
            </article>
          ))}
          {report.emptySpecialties.length > 8 && <p className="health-more">و{report.emptySpecialties.length - 8} غيرهم…</p>}
        </div>
      )}

      {report.stale.length === 0 && report.incomplete.length === 0 && report.emptySpecialties.length === 0 && (
        <p className="analytics-empty-hint">الدليل كله محدّث ومكتمل — تحفة 👌</p>
      )}
    </section>
  );
}

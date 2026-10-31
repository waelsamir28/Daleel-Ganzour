"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Award, BarChart3, Eye, Grid2X2, MapPin, MessageCircle, Pencil, PhoneCall, Plus, Search, Share2, Siren, Star, Trash2, TrendingUp } from "lucide-react";
import { getCategory, type AdminDirectory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui";
import AdminCodeReports from "@/components/admin-code-reports";
import AdminErrorLog from "@/components/admin-error-log";
import AdminPush from "@/components/admin-push";
import AdminQuickRatings from "@/components/admin-quick-ratings";
import AdminUsageInsights from "@/components/admin-usage-insights";
import SectionStickerModal from "@/components/section-sticker-modal";
import { sectionAccent } from "@/lib/catalog";
import { QrCode } from "lucide-react";
import { clearAnalyticsEvents, readAnalyticsEvents, type AnalyticsEventRecord } from "@/lib/analytics-tracker";

export default function AdminAnalytics({
  data,
  onAddServiceInCategory,
  onEditService,
}: {
  data: AdminDirectory;
  onAddServiceInCategory: (categoryId: string) => void;
  onEditService: (service: ServiceRecord) => void;
}) {
  const [events, setEvents] = useState<AnalyticsEventRecord[]>(() => readAnalyticsEvents());
  const [stickersOpen, setStickersOpen] = useState(false);

  const approvedServices = useMemo(
    () => data.services.filter((service) => service.status === "approved"),
    [data.services],
  );

  const roots = useMemo(
    () => data.categories.filter((category) => !category.parentId && category.active),
    [data.categories],
  );

  const specialties = useMemo(
    () => data.categories.filter((category) => Boolean(category.parentId) && category.active),
    [data.categories],
  );

  const categoryBreakdown = useMemo(() => {
    const total = Math.max(1, approvedServices.length);
    return roots
      .map((root) => {
        const count = approvedServices.filter(
          (service) => getCategory(service.category, data.categories).parentId === root.id,
        ).length;
        return {
          root,
          count,
          percent: Math.round((count / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [roots, approvedServices, data.categories]);

  const underservedSpecialties = useMemo(() => {
    return specialties
      .map((spec) => {
        const count = approvedServices.filter((service) => service.category === spec.id).length;
        const parent = getCategory(spec.parentId ?? "", data.categories);
        return { spec, parent, count };
      })
      .filter((entry) => entry.count <= 1)
      .sort((a, b) => a.count - b.count);
  }, [specialties, approvedServices, data.categories]);

  const areaBreakdown = useMemo(() => {
    const total = Math.max(1, approvedServices.length);
    return data.areas
      .map((area) => {
        const count = approvedServices.filter((service) => service.area === area.name).length;
        return { area, count, percent: Math.round((count / total) * 100) };
      })
      .sort((a, b) => b.count - a.count);
  }, [data.areas, approvedServices]);

  const topProviders = useMemo(() => {
    return [...approvedServices]
      .sort((a, b) => {
        const scoreDiff = (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.reviews || 0) - (a.reviews || 0);
      })
      .slice(0, 6);
  }, [approvedServices]);

  const topSearches = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of events) {
      if (ev.kind === "search") {
        const key = ev.label.trim();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const interactionSummary = useMemo(() => {
    let calls = 0;
    let whatsapp = 0;
    let views = 0;
    let shares = 0;
    for (const ev of events) {
      if (ev.kind === "call") calls += 1;
      else if (ev.kind === "whatsapp") whatsapp += 1;
      else if (ev.kind === "view") views += 1;
      else if (ev.kind === "share") shares += 1;
    }
    return { calls, whatsapp, views, shares, total: events.length };
  }, [events]);

  const avgRating = useMemo(() => {
    const rated = approvedServices.filter((s) => (Number.parseFloat(s.rating) || 0) > 0);
    if (!rated.length) return "4.8";
    const sum = rated.reduce((acc, s) => acc + (Number.parseFloat(s.rating) || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [approvedServices]);

  function handleClearLog() {
    clearAnalyticsEvents();
    setEvents([]);
  }

  return (
    <div className="admin-analytics-studio">
      {/* Top KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card is-blue">
          <span className="analytics-kpi-icon"><TrendingUp size={22} /></span>
          <div>
            <small>إجمالي الخدمات المنشورة</small>
            <strong>{approvedServices.length}</strong>
            <span>في {roots.length} أقسام رئيسية و {specialties.length} تخصص</span>
          </div>
        </div>
        <div className="analytics-kpi-card is-emerald">
          <span className="analytics-kpi-icon"><Award size={22} /></span>
          <div>
            <small>المميزون والطوارئ</small>
            <strong>{approvedServices.filter((s) => s.featured).length} مميز • {approvedServices.filter((s) => s.emergency).length} طوارئ</strong>
            <span>موثّق بالمعاينة: {approvedServices.filter((s) => s.verified).length}</span>
          </div>
        </div>
        <div className="analytics-kpi-card is-amber">
          <span className="analytics-kpi-icon"><Star size={22} /></span>
          <div>
            <small>متوسط تقييمات الأهالي</small>
            <strong>{avgRating} / 5.0</strong>
            <span>إجمالي التقييمات: {data.ratings.length} تقييم</span>
          </div>
        </div>
        <div className="analytics-kpi-card is-purple">
          <span className="analytics-kpi-icon"><AlertTriangle size={22} /></span>
          <div>
            <small>تخصصات تحتاج لدعم</small>
            <strong>{underservedSpecialties.filter((s) => s.count === 0).length} بدون مهنيين</strong>
            <span>و {underservedSpecialties.filter((s) => s.count === 1).length} بها مهني واحد فقط</span>
          </div>
        </div>
      </div>

      {/* Visitor Search & Click Interactions */}
      <div className="analytics-grid-two">
        <section className="analytics-panel-card">
          <div className="analytics-panel-head">
            <div>
              <h3><Search size={18} /> أكثر كلمات البحث والتفاعلات المسجلة</h3>
              <p>سجل عمليات البحث والضغط على الاتصال أو الواتساب من المتصفح</p>
            </div>
            {events.length > 0 && (
              <button type="button" className="button button-soft button-small" onClick={handleClearLog}>
                <Trash2 size={14} /> مسح السجل
              </button>
            )}
          </div>

          <div className="analytics-interaction-pills">
            <span><Eye size={14} /> فتح كروت: <strong>{interactionSummary.views}</strong></span>
            <span><PhoneCall size={14} /> ضغطات اتصال: <strong>{interactionSummary.calls}</strong></span>
            <span><MessageCircle size={14} /> ضغطات واتساب: <strong>{interactionSummary.whatsapp}</strong></span>
            <span><Share2 size={14} /> مشاركات: <strong>{interactionSummary.shares}</strong></span>
          </div>

          {topSearches.length > 0 ? (
            <div className="analytics-search-tags">
              {topSearches.map((item) => (
                <div key={item.term} className="analytics-search-tag">
                  <strong>«{item.term}»</strong>
                  <span>{item.count} مرة</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty-hint">
              ستظهر هنا أكثر الكلمات التي يبحث عنها الزوار على هذا الجهاز بمجرد إجراء عمليات بحث في الصفحة الرئيسية.
            </p>
          )}
        </section>

        {/* Category Distribution */}
        <section className="analytics-panel-card">
          <div className="analytics-panel-head">
            <div>
              <h3><BarChart3 size={18} /> توزيع المهنيين على أقسام القرية</h3>
              <p>نسبة تغطية كل قسم رئيسي في الدليل المنشور</p>
            </div>
          </div>
          <div className="analytics-bars-list">
            {categoryBreakdown.map(({ root, count, percent }) => (
              <div key={root.id} className="analytics-bar-row">
                <div className="analytics-bar-label">
                  <span className="analytics-cat-dot" style={{ background: root.color }} />
                  <strong>{root.name}</strong>
                  <small>{count} خدمة ({percent}%)</small>
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${Math.max(6, percent)}%`, background: root.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AdminCodeReports/>
      <section className="analytics-panel-card">
        <div className="analytics-panel-head">
          <div>
            <h3><QrCode size={18}/> ملصقات QR للأقسام</h3>
            <p>ملصق A6 لكل قسم بلونه واسمه: «كل … في مكان واحد — امسح». اطبعه وعلّقه في الصيدلية أو المحل.</p>
          </div>
          <button type="button" className="button button-soft button-small" onClick={() => setStickersOpen(true)}><QrCode size={15}/> افتح الملصقات</button>
        </div>
      </section>
      {stickersOpen && (
        <SectionStickerModal
          siteName={data.settings.siteName}
          sections={roots.map((category) => ({ id: category.id, name: category.name, accent: sectionAccent(category.id), count: approvedServices.filter((service) => service.category === category.id || data.categories.some((child) => child.parentId === category.id && child.id === service.category)).length }))}
          onClose={() => setStickersOpen(false)}
        />
      )}
      <AdminUsageInsights/>
      <AdminQuickRatings/>
      <AdminPush sections={roots.map((category) => ({ id: category.id, name: category.name }))}/>
      <AdminErrorLog/>

      {/* Underserved Specialties needing recruitment */}
      <section className="analytics-panel-card">
        <div className="analytics-panel-head">
          <div>
            <h3><Grid2X2 size={18} /> تخصصات تحتاج لإضافة مهنيين في جنزور ({underservedSpecialties.length})</h3>
            <p>التخصصات الفارغة أو التي تحتوي على مقدم خدمة واحد فقط — اضغط لإضافة مهني مباشرة</p>
          </div>
        </div>
        <div className="analytics-underserved-grid">
          {underservedSpecialties.slice(0, 12).map(({ spec, parent, count }) => (
            <div key={spec.id} className={`analytics-underserved-item ${count === 0 ? "is-zero" : "is-low"}`}>
              <div className="analytics-underserved-copy">
                <span className="analytics-underserved-icon" style={{ color: parent.color, background: parent.light }}>
                  <CategoryIcon icon={spec.icon} size={18} />
                </span>
                <div>
                  <strong>{spec.name}</strong>
                  <small>{parent.name} • {count === 0 ? "لا يوجد مهنيون بعد" : "مهني واحد فقط"}</small>
                </div>
              </div>
              <button
                type="button"
                className="button button-soft button-small"
                onClick={() => onAddServiceInCategory(spec.id)}
              >
                <Plus size={14} /> أضف مهني
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Areas & Top Rated Providers */}
      <div className="analytics-grid-two">
        <section className="analytics-panel-card">
          <div className="analytics-panel-head">
            <div>
              <h3><MapPin size={18} /> توزيع الخدمات حسب نواحي وشوارع جنزور</h3>
              <p>عدد مقدمي الخدمة المسجلين في كل منطقة</p>
            </div>
          </div>
          <div className="analytics-bars-list">
            {areaBreakdown.map(({ area, count, percent }) => (
              <div key={area.id} className="analytics-bar-row">
                <div className="analytics-bar-label">
                  <strong>{area.name}</strong>
                  <small>{count} خدمة ({percent}%)</small>
                </div>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: `${Math.max(5, percent)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-panel-card">
          <div className="analytics-panel-head">
            <div>
              <h3><Star size={18} /> الأعلى تقييماً في الدليل</h3>
              <p>المهنيون الأعلى تقييماً وموثوقية مع زر تعديل سريع</p>
            </div>
          </div>
          <div className="analytics-top-providers">
            {topProviders.map((service) => {
              const cat: CategoryRecord = getCategory(service.category, data.categories);
              return (
                <div key={service.id} className="analytics-top-provider-row">
                  <div>
                    <strong>{service.name}</strong>
                    <small>{cat.name} • ⭐ {service.rating} ({service.reviews} تقييم){service.emergency ? " • طوارئ" : ""}</small>
                  </div>
                  <button
                    type="button"
                    className="button button-soft button-small"
                    onClick={() => onEditService(service)}
                  >
                    <Pencil size={13} /> تعديل
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

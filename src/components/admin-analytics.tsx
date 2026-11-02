"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Award, BarChart3, BellRing, CalendarClock, CircleAlert, ClipboardCheck, Eye, Grid2X2, HeartPulse, MapPin, MessageCircle, Pencil, PhoneCall, Plus, QrCode, Search, Share2, Star, Trash2, TrendingUp, UserRoundPlus } from "lucide-react";
import { getCategory, type AdminDirectory, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";
import { CategoryIcon, Modal } from "@/components/ui";
import AdminCodeReports from "@/components/admin-code-reports";
import AdminErrorLog from "@/components/admin-error-log";
import AdminPush from "@/components/admin-push";
import AdminQuickRatings from "@/components/admin-quick-ratings";
import AdminUsageInsights from "@/components/admin-usage-insights";
import AdminSeasonal from "@/components/admin-seasonal";
import AdminHealth from "@/components/admin-health";
import AdminOnboarding from "@/components/admin-onboarding";
import AdminMissing from "@/components/admin-missing";
import SectionStickerModal from "@/components/section-sticker-modal";
import { sectionAccent } from "@/lib/catalog";
import { clearAnalyticsEvents, readAnalyticsEvents, type AnalyticsEventRecord } from "@/lib/analytics-tracker";
import { errorStatus } from "@/lib/error-triage";

/**
 * «إحصائيات التفاعل والبحث» — صفحة أزرار لا صفحة أقسام متراكمة:
 * كل جزء (البحث، الأقسام، المناطق، الأعلى تقييمًا، الأخطاء، الإشعارات، Use…)
 * له زر واحد، والضغط عليه يفتح شاشة عائمة منسّقة فيها المحتوى كامل بزر إغلاق.
 */
type SectionId =
  | "summary" | "search" | "categories" | "areas" | "top" | "underserved"
  | "stickers" | "usage" | "errors" | "seasonal" | "welcome" | "push"
  | "health" | "missing" | "quickRatings" | "codes";

type Tile = {
  id: SectionId;
  title: string;
  hint: string;
  icon: typeof BarChart3;
  accent: string;
  badge?: string | number;
  actionLabel: string;
};

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
  const [open, setOpen] = useState<SectionId | null>(null);
  const [stickersOpen, setStickersOpen] = useState(false);
  /** عدد الأخطاء غير المفتوحة/المفتوحة — يظهر كرقم على زر «أخطاء الموقع». */
  const [errorCounts, setErrorCounts] = useState<{ open: number; resolved: number } | null>(null);

  // قراءة سريعة لسجل الأخطاء: الرقم على الزر يوضح المفتوح والمقفول بدون فتح الشاشة.
  useEffect(() => {
    let alive = true;
    fetch("/api/errors", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { errors?: Array<{ lastAt?: string | null; resolvedAt?: string | null }> } | null) => {
        if (!alive || !data?.errors) return;
        let open = 0, resolved = 0;
        for (const row of data.errors) {
          if (errorStatus(row) === "resolved") resolved += 1;
          else open += 1;
        }
        setErrorCounts({ open, resolved });
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const approvedServices = useMemo(() => data.services.filter((service) => service.status === "approved"), [data.services]);
  const roots = useMemo(() => data.categories.filter((category) => !category.parentId && category.active), [data.categories]);
  const specialties = useMemo(() => data.categories.filter((category) => Boolean(category.parentId) && category.active), [data.categories]);

  const categoryBreakdown = useMemo(() => {
    const total = Math.max(1, approvedServices.length);
    return roots.map((root) => {
      const count = approvedServices.filter((service) => getCategory(service.category, data.categories).parentId === root.id).length;
      return { root, count, percent: Math.round((count / total) * 100) };
    }).sort((a, b) => b.count - a.count);
  }, [roots, approvedServices, data.categories]);

  const underservedSpecialties = useMemo(() => specialties
    .map((spec) => {
      const count = approvedServices.filter((service) => service.category === spec.id).length;
      const parent = getCategory(spec.parentId ?? "", data.categories);
      return { spec, parent, count };
    })
    .filter((entry) => entry.count <= 1)
    .sort((a, b) => a.count - b.count), [specialties, approvedServices, data.categories]);

  const areaBreakdown = useMemo(() => {
    const total = Math.max(1, approvedServices.length);
    return data.areas.map((area) => {
      const count = approvedServices.filter((service) => service.area === area.name).length;
      return { area, count, percent: Math.round((count / total) * 100) };
    }).sort((a, b) => b.count - a.count);
  }, [data.areas, approvedServices]);

  const topProviders = useMemo(() => [...approvedServices].sort((a, b) => {
    const scoreDiff = (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.reviews || 0) - (a.reviews || 0);
  }).slice(0, 10), [approvedServices]);

  const topSearches = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of events) {
      if (ev.kind === "search") {
        const key = ev.label.trim();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([term, count]) => ({ term, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [events]);

  const interactionSummary = useMemo(() => {
    let calls = 0, whatsapp = 0, views = 0, shares = 0;
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
    if (!rated.length) return "—";
    const sum = rated.reduce((acc, s) => acc + (Number.parseFloat(s.rating) || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [approvedServices]);

  const emptySpecialties = underservedSpecialties.filter((s) => s.count === 0).length;
  const oneSpecialty = underservedSpecialties.filter((s) => s.count === 1).length;
  const totalRatings = data.ratings.length;

  const tiles: Tile[] = [
    { id: "summary", title: "الملخص العام", hint: "عدد الخدمات والأقسام والتقييمات والطوارئ", icon: TrendingUp, accent: "#0877e6", badge: approvedServices.length, actionLabel: "عرض الأرقام" },
    { id: "search", title: "البحث والتفاعل", hint: "أكثر الكلمات بحثًا وضغطات الاتصال والواتساب", icon: Search, accent: "#0ea5a5", badge: interactionSummary.total, actionLabel: "عرض السجل" },
    { id: "categories", title: "توزيع الأقسام", hint: "نسبة المهنيين في كل قسم رئيسي", icon: BarChart3, accent: "#7c3aed", badge: roots.length, actionLabel: "عرض التوزيع" },
    { id: "areas", title: "توزيع المناطق", hint: "عدد مقدمي الخدمة في كل ناحية", icon: MapPin, accent: "#c2410c", badge: data.areas.length, actionLabel: "عرض المناطق" },
    { id: "top", title: "الأعلى تقييمًا", hint: "المهنيون الأعلى نجومًا مع تعديل سريع", icon: Star, accent: "#d97706", badge: topProviders.length, actionLabel: "عرض القائمة" },
    { id: "underserved", title: "تخصصات ناقصة", hint: "تخصصات بدون مهني أو بمهني واحد فقط", icon: Grid2X2, accent: "#be123c", badge: underservedSpecialties.length, actionLabel: "عرض التخصصات" },
    { id: "usage", title: "أرقام الاستخدام الحقيقية", hint: "مشاهدات البطاقات ونقرات التواصل على الخادم", icon: TrendingUp, accent: "#0f766e", actionLabel: "عرض الأرقام" },
    { id: "seasonal", title: "تذكيرات موسمية", hint: "نصوص جاهزة لكل موسم تُرسل بضغطة", icon: CalendarClock, accent: "#0369a1", actionLabel: "عرض المواسم" },
    { id: "push", title: "إشعار الزوار", hint: "إرسال إشعار لأجهزة الزوار المشتركة", icon: BellRing, accent: "#7e22ce", actionLabel: "فتح الإشعار" },
    { id: "welcome", title: "ترحيب بالمهنيين الجدد", hint: "رسالة واتساب + ملصق + إشعار ترحيب", icon: UserRoundPlus, accent: "#15803d", actionLabel: "عرض الجدد" },
    { id: "stickers", title: "ملصقات QR للأقسام", hint: "ملصق A6 ملون لكل قسم للطباعة", icon: QrCode, accent: "#0b5f9e", actionLabel: "فتح الملصقات" },
    { id: "errors", title: "أخطاء الموقع", hint: errorCounts ? `${errorCounts.open} مفتوح · ${errorCounts.resolved} تم إصلاحه` : "أعطال وصلت من متصفحات الزوار", icon: CircleAlert, accent: "#b91c1c", badge: errorCounts?.open, actionLabel: "عرض الأخطاء" },
    { id: "health", title: "صحة الدليل", hint: "بيانات قديمة أو ناقصة تحتاج متابعة", icon: HeartPulse, accent: "#9d174d", actionLabel: "عرض الحالة" },
    { id: "missing", title: "مهن ناقصة", hint: "طلبات الزوار لمهن غير موجودة في الدليل", icon: ClipboardCheck, accent: "#0369a1", actionLabel: "عرض الطلبات" },
    { id: "quickRatings", title: "تقييمات سريعة", hint: "نجوم مجهولة بعد الاتصال", icon: Award, accent: "#a16207", actionLabel: "عرض التقييمات" },
    { id: "codes", title: "تقارير الأكواد", hint: "أرقام بلّغ عنها الزوار كخطأ", icon: AlertTriangle, accent: "#b45309", actionLabel: "عرض البلاغات" },
  ];

  const opened = tiles.find((tile) => tile.id === open) ?? null;

  function renderContent(id: SectionId): ReactNode {
    switch (id) {
      case "summary":
        return <div className="analytics-kpi-grid analytics-kpi-grid-inline">
          <div className="analytics-kpi-card is-blue"><span className="analytics-kpi-icon"><TrendingUp size={22}/></span><div><small>الخدمات المنشورة</small><strong>{approvedServices.length}</strong><span>في {roots.length} قسم و{specialties.length} تخصص</span></div></div>
          <div className="analytics-kpi-card is-emerald"><span className="analytics-kpi-icon"><Award size={22}/></span><div><small>مميزون وطوارئ</small><strong>{approvedServices.filter((s) => s.featured).length} مميز • {approvedServices.filter((s) => s.emergency).length} طوارئ</strong><span>موثّق بالمعاينة: {approvedServices.filter((s) => s.verified).length}</span></div></div>
          <div className="analytics-kpi-card is-amber"><span className="analytics-kpi-icon"><Star size={22}/></span><div><small>متوسط التقييم</small><strong>{avgRating} / 5.0</strong><span>إجمالي {totalRatings} تقييم عضو</span></div></div>
          <div className="analytics-kpi-card is-purple"><span className="analytics-kpi-icon"><AlertTriangle size={22}/></span><div><small>تخصصات تحتاج دعم</small><strong>{emptySpecialties} بدون مهنيين</strong><span>و{oneSpecialty} بمهني واحد فقط</span></div></div>
        </div>;
      case "search":
        return <div className="analytics-section-body">
          <div className="analytics-interaction-pills is-centered">
            <span><Eye size={14}/> فتح كروت: <strong>{interactionSummary.views}</strong></span>
            <span><PhoneCall size={14}/> اتصال: <strong>{interactionSummary.calls}</strong></span>
            <span><MessageCircle size={14}/> واتساب: <strong>{interactionSummary.whatsapp}</strong></span>
            <span><Share2 size={14}/> مشاركة: <strong>{interactionSummary.shares}</strong></span>
          </div>
          {topSearches.length > 0 ? (
            <div className="analytics-search-tags is-centered">
              {topSearches.map((item) => <div key={item.term} className="analytics-search-tag"><strong>«{item.term}»</strong><span>{item.count} مرة</span></div>)}
            </div>
          ) : (
            <p className="analytics-empty-hint">مفيش كلمات بحث مسجّلة على هذا الجهاز لسه — أول ما يبحث زائر هنا، الكلمة تظهر تلقائيًا.</p>
          )}
          {events.length > 0 && <div className="analytics-section-foot"><button type="button" className="button button-danger-soft button-small" onClick={() => { clearAnalyticsEvents(); setEvents([]); }}><Trash2 size={14}/> مسح سجل هذا الجهاز</button></div>}
        </div>;
      case "categories":
        return <div className="analytics-bars-list is-centered">
          {categoryBreakdown.map(({ root, count, percent }) => <div key={root.id} className="analytics-bar-row">
            <div className="analytics-bar-label"><span className="analytics-cat-dot" style={{ background: root.color }}/><strong>{root.name}</strong><small>{count} خدمة ({percent}%)</small></div>
            <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${Math.max(6, percent)}%`, background: root.color }}/></div>
          </div>)}
        </div>;
      case "areas":
        return <div className="analytics-bars-list is-centered">
          {areaBreakdown.map(({ area, count, percent }) => <div key={area.id} className="analytics-bar-row">
            <div className="analytics-bar-label"><strong>{area.name}</strong><small>{count} خدمة ({percent}%)</small></div>
            <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${Math.max(5, percent)}%` }}/></div>
          </div>)}
        </div>;
      case "top":
        return <div className="analytics-top-providers">
          {topProviders.map((service) => {
            const cat: CategoryRecord = getCategory(service.category, data.categories);
            return <div key={service.id} className="analytics-top-provider-row">
              <div><strong>{service.name}</strong><small>{cat.name} • ⭐ {service.rating} ({service.reviews} تقييم){service.emergency ? " • طوارئ" : ""}</small></div>
              <button type="button" className="button button-soft button-small" onClick={() => { setOpen(null); onEditService(service); }}><Pencil size={13}/> تعديل</button>
            </div>;
          })}
        </div>;
      case "underserved":
        return <div className="analytics-underserved-grid">
          {underservedSpecialties.map(({ spec, parent, count }) => <div key={spec.id} className={`analytics-underserved-item ${count === 0 ? "is-zero" : "is-low"}`}>
            <div className="analytics-underserved-copy">
              <span className="analytics-underserved-icon" style={{ color: parent.color, background: parent.light }}><CategoryIcon icon={spec.icon} size={18}/></span>
              <div><strong>{spec.name}</strong><small>{parent.name} • {count === 0 ? "لا يوجد مهنيون بعد" : "مهني واحد فقط"}</small></div>
            </div>
            <button type="button" className="button button-soft button-small" onClick={() => { setOpen(null); onAddServiceInCategory(spec.id); }}><Plus size={14}/> أضف مهني</button>
          </div>)}
        </div>;
      case "usage": return <AdminUsageInsights/>;
      case "errors": return <AdminErrorLog/>;
      case "seasonal": return <AdminSeasonal/>;
      case "welcome": return <AdminOnboarding data={data}/>;
      case "push": return <AdminPush sections={roots.map((category) => ({ id: category.id, name: category.name }))}/>;
      case "health": return <AdminHealth data={data} onEditService={onEditService} onAddServiceInCategory={onAddServiceInCategory}/>;
      case "missing": return <AdminMissing siteName={data.settings.siteName}/>;
      case "quickRatings": return <AdminQuickRatings/>;
      case "codes": return <AdminCodeReports/>;
      default: return null;
    }
  }

  return (
    <div className="admin-analytics-studio">
      <header className="analytics-hub-head">
        <div>
          <h3><BarChart3 size={20}/> كل قسم له زر خاص</h3>
          <p>اضغط على أي زر لتفتح شاشته العائمة المنسّقة، وتقفلها بزر ✕ أو بمفتاح Esc. مفيش أقسام متراكبة على الصفحة.</p>
        </div>
        <span className="analytics-hub-count">{tiles.length} أقسام</span>
      </header>

      <div className="analytics-tiles">
        {tiles.map((tile) => (
          <article key={tile.id} className="analytics-tile" style={{ "--tile": tile.accent } as React.CSSProperties}>
            <span className="analytics-tile-icon"><tile.icon size={20}/></span>
            <div className="analytics-tile-copy">
              <strong>{tile.title}</strong>
              <small>{tile.hint}</small>
            </div>
            {tile.badge !== undefined && tile.badge !== 0 ? <span className="analytics-tile-badge">{tile.badge}</span> : null}
            <button
              type="button"
              className="analytics-tile-btn"
              onClick={() => { if (tile.id === "stickers") setStickersOpen(true); else setOpen(tile.id); }}
            >
              {tile.actionLabel}
            </button>
          </article>
        ))}
      </div>

      {opened && (
        <Modal
          floating wide
          className="analytics-section-modal"
          title={opened.title}
          subtitle={opened.hint}
          onClose={() => setOpen(null)}
          autoFocus={false}
        >
          {renderContent(opened.id)}
        </Modal>
      )}

      {stickersOpen && (
        <SectionStickerModal
          siteName={data.settings.siteName}
          sections={roots.map((category) => ({
            id: category.id,
            name: category.name,
            accent: sectionAccent(category.id),
            count: approvedServices.filter((service) => service.category === category.id || data.categories.some((child) => child.parentId === category.id && child.id === service.category)).length,
          }))}
          onClose={() => setStickersOpen(false)}
        />
      )}
    </div>
  );
}

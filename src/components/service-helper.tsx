"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Building2, Car, ChevronLeft, GraduationCap, HeartPulse, Home, Pill, Search, Smartphone, Sparkles, Wrench, X, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui";
import { getSpecialtyKeywords, matchesServiceIntentQuery, normalizeSearch, suggestServiceIntentCategories, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";

type ServiceIssue = { label: string; categoryIds: string[]; keywords?: string[]; icon?: LucideIcon };
type ServiceGroup = { id: string; label: string; icon: LucideIcon; issues: ServiceIssue[] };

const SERVICE_GROUPS: ServiceGroup[] = [
  { id: "home", label: "البيت", icon: Home, issues: [
    { label: "كهرباء", categoryIds: ["electricity", "appliances"], keywords: ["كهرباء", "كهربائي", "جهاز كهربائي"], icon: Zap },
    { label: "سباكة ومياه", categoryIds: ["plumbing"], keywords: ["سباك", "سباكة", "مياه", "تسريب"], icon: Wrench },
    { label: "تكييف وتبريد", categoryIds: ["ac"], keywords: ["تكييف", "تبريد"], icon: Wrench },
    { label: "أثاث ونجارة", categoryIds: ["carpentry", "upholstery"], keywords: ["نجار", "نجارة", "تنجيد", "أثاث"], icon: Home },
    { label: "تشطيب ودهانات", categoryIds: ["masonry", "painting", "tiles", "aluminum", "glass"], keywords: ["بناء", "محارة", "دهان", "نقاشة", "سيراميك", "زجاج"], icon: Building2 },
    { label: "تنظيف", categoryIds: ["apartment-cleaning", "carpet-cleaning"], keywords: ["تنظيف", "نظافة", "سجاد"], icon: Home },
  ] },
  { id: "car", label: "السيارة والمشاوير", icon: Car, issues: [
    { label: "صيانة سيارة", categoryIds: ["mechanics"], keywords: ["ميكانيكا", "ميكانيكي", "سيارات"], icon: Wrench },
    { label: "نقل وتوصيل", categoryIds: ["rides", "moving", "freight"], keywords: ["مشوار", "نقل", "توصيل"], icon: Car },
  ] },
  { id: "health", label: "الصحة", icon: HeartPulse, issues: [
    { label: "طبيب أو عيادة", categoryIds: ["family", "pediatrics", "dentistry", "gynecology", "orthopedics", "dermatology", "ophthalmology", "ent", "physiotherapy"], keywords: ["طبيب", "دكتور", "عيادة"], icon: HeartPulse },
    { label: "صيدلية أو مستلزمات", categoryIds: ["community-pharmacies", "night-pharmacies", "medical-supplies"], keywords: ["صيدلية", "دواء", "مستلزمات طبية"], icon: Pill },
    { label: "تحاليل طبية", categoryIds: ["medical-labs"], keywords: ["معمل", "تحاليل", "أشعة"], icon: Search },
  ] },
  { id: "education", label: "التعليم", icon: GraduationCap, issues: [
    { label: "لغة عربية", categoryIds: ["arabic"], keywords: ["عربي", "لغة عربية"], icon: GraduationCap },
    { label: "لغة إنجليزية", categoryIds: ["english"], keywords: ["إنجليزي", "لغة إنجليزية"], icon: GraduationCap },
    { label: "رياضيات", categoryIds: ["math"], keywords: ["رياضيات", "حساب"], icon: GraduationCap },
    { label: "علوم ومواد أخرى", categoryIds: ["science", "social-studies"], keywords: ["علوم", "كيمياء", "فيزياء", "دراسات"], icon: GraduationCap },
  ] },
  { id: "devices", label: "الموبايل والكمبيوتر", icon: Smartphone, issues: [
    { label: "موبايل أو كمبيوتر", categoryIds: ["mobile-shops"], keywords: ["موبايل", "كمبيوتر", "لابتوب", "تليفون"], icon: Smartphone },
    { label: "كاميرات وأجهزة", categoryIds: ["cameras", "appliances"], keywords: ["كاميرات", "أجهزة كهربائية"], icon: Building2 },
  ] },
  { id: "other", label: "خدمات أخرى", icon: Building2, issues: [] },
];
const POPULAR_ISSUES: ServiceIssue[] = [
  { label: "سباك", categoryIds: ["plumbing"], keywords: ["سباك", "سباكة", "مياه", "تسريب"], icon: Wrench },
  { label: "كهربائي", categoryIds: ["electricity"], keywords: ["كهرباء", "كهربائي"], icon: Zap },
  { label: "طبيب", categoryIds: ["family", "pediatrics", "clinics"], keywords: ["طبيب", "دكتور", "عيادة"], icon: HeartPulse },
  { label: "صيدلية", categoryIds: ["community-pharmacies", "night-pharmacies"], keywords: ["صيدلية", "دواء"], icon: Pill },
];

export default function ServiceHelper({ categories, services, onOpenService }: { categories: CategoryRecord[]; services: ServiceRecord[]; onOpenService: (service: ServiceRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [issue, setIssue] = useState<ServiceIssue | null>(null);
  const group = SERVICE_GROUPS.find((item) => item.id === groupId);
  const intentCategories = useMemo(() => suggestServiceIntentCategories(query, categories), [categories, query]);

  const results = useMemo(() => {
    const activeCategories = categories.filter((item) => item.active && item.parentId && services.some((service) => service.category === item.id));
    const normalizedQuery = normalizeSearch(query.trim());
    if (normalizedQuery.length > 1) {
      return services.filter((service) => {
        const category = categories.find((item) => item.id === service.category);
        return matchesServiceIntentQuery(service, category?.name ?? "", query);
      }).slice(0, 8);
    }

    let selectedIssues: ServiceIssue[] = [];
    if (issue) selectedIssues = [issue];
    else if (group?.id !== "other" && group) selectedIssues = group.issues;

    const selectedIds = new Set(selectedIssues.flatMap((item) => item.categoryIds));
    const selectedKeywords = selectedIssues.flatMap((item) => item.keywords ?? []).map(normalizeSearch);
    const matchedIds = new Set(activeCategories.filter((category) => {
      const indexedText = normalizeSearch(`${category.name} ${category.description} ${getSpecialtyKeywords(category.id)}`);
      return selectedIds.has(category.id) || selectedKeywords.some((word) => word && indexedText.includes(word));
    }).map((category) => category.id));

    if (group?.id === "other" && !issue) {
      const categorizedIds = new Set(SERVICE_GROUPS.filter((item) => item.id !== "other").flatMap((item) => item.issues.flatMap((entry) => entry.categoryIds)));
      for (const category of activeCategories) if (!categorizedIds.has(category.id)) matchedIds.add(category.id);
    }
    return services.filter((service) => matchedIds.has(service.category)).slice(0, 8);
  }, [categories, group, issue, query, services]);
  const hasQueryIntent = intentCategories.length > 0 || results.length > 0;

  function clearSelection() {
    setQuery("");
    setGroupId("");
    setIssue(null);
  }
  function close() {
    setOpen(false);
    clearSelection();
  }
  function selectIssue(nextIssue: ServiceIssue, nextGroupId = "") {
    setQuery("");
    setIssue(nextIssue);
    if (nextGroupId) setGroupId(nextGroupId);
  }
  function selectGroup(nextGroup: ServiceGroup) {
    setQuery("");
    setIssue(null);
    setGroupId(nextGroup.id);
  }
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return <>
    <section className="service-helper-entry" aria-labelledby="service-helper-title">
      <div className="service-helper-entry-icon"><Sparkles size={24}/></div>
      <div className="service-helper-entry-copy">
        <h2 id="service-helper-title">محتاج خدمة ومش عارف التخصص؟</h2>
        <p>اكتب وصفك، والنتائج هتظهر لما تظهر كلمة دالّة زي «حنفية» أو «دعاية».</p>
      </div>
      <button type="button" className="service-helper-start" onClick={() => { clearSelection(); setOpen(true); }}><span>ابحث عن خدمة</span><Search size={17}/></button>
    </section>
    {open && <Modal title="محتاج خدمة؟" subtitle="اكتب جملة كاملة أو كلمة دالّة — من غير تسجيل" onClose={close} wide>
      <div className="service-helper-wizard">
        <form className="service-helper-search" role="search" onSubmit={handleSearch}>
          <Search size={19}/>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setGroupId(""); setIssue(null); }} placeholder="مثال: تسريب مياه، مدرس رياضيات، صيانة سيارة" aria-label="ابحث عن الخدمة أو المشكلة" autoComplete="off"/>
          {query && <button type="button" className="service-helper-clear-search" onClick={() => setQuery("")} aria-label="مسح البحث"><X size={17}/></button>}
        </form>

        {!query.trim() && !group && <>
          <div className="service-helper-section-label">خدمات شائعة</div>
          <div className="service-helper-popular">{POPULAR_ISSUES.map((item) => {
            const Icon = item.icon ?? Wrench;
            return <button type="button" className="service-helper-popular-chip" key={item.label} onClick={() => selectIssue(item)}><Icon size={15}/>{item.label}</button>;
          })}</div>
          <div className="service-helper-section-label service-helper-categories-label">أو اختار نوع الخدمة</div>
          <div className="service-helper-groups">{SERVICE_GROUPS.map((item) => {
            const Icon = item.icon;
            return <button type="button" key={item.id} className="service-helper-group" onClick={() => selectGroup(item)}><span><Icon size={20}/></span><strong>{item.label}</strong><ChevronLeft size={16}/></button>;
          })}</div>
        </>}

        {group && group.issues.length > 0 && !query.trim() && <div className="service-helper-refinements" aria-label={`تخصصات ${group.label}`}>
          <div className="service-helper-refinement-heading"><strong>تصفية اختيارية</strong><button type="button" onClick={clearSelection}>تغيير القسم</button></div>
          <button type="button" className={`service-helper-refinement-chip ${issue ? "" : "is-selected"}`} onClick={() => setIssue(null)}>كل {group.label}</button>
          {group.issues.map((item) => <button type="button" key={item.label} className={`service-helper-refinement-chip ${issue?.label === item.label ? "is-selected" : ""}`} onClick={() => selectIssue(item, group.id)}>{item.label}</button>)}
        </div>}
        {group?.id === "other" && !query.trim() && <div className="service-helper-other-hint"><p>اكتب اسم الخدمة في مربع البحث، أو تصفح الخدمات المتاحة في الدليل.</p><button type="button" onClick={() => setGroupId("")}>رجوع للخدمات الشائعة</button></div>}
        {(query.trim() || group || issue) && <>
          <div className="service-helper-results-heading"><strong>{query.trim() ? `نتائج البحث عن «${query.trim()}»` : issue ? `نتائج «${issue.label}»` : `مقدمو الخدمة في ${group?.label ?? "هذا التخصص"}`}</strong><div className="service-helper-result-meta"><span>{results.length} نتيجة</span>{!query.trim() && (group || issue) && <button type="button" onClick={clearSelection} aria-label="مسح الاختيار">تغيير الاختيار</button>}</div></div>
          {query.trim() && intentCategories.length > 0 && <section className="service-helper-matched-categories" aria-label="التصنيفات المرتبطة بالبحث">
            <div className="service-helper-section-label">التصنيفات المرتبطة بكلامك</div>
            <div className="service-helper-matched-category-list">{intentCategories.map((category) => {
              const count = services.filter((service) => service.category === category.id).length;
              const href = category.parentId ? `/categories/${category.parentId}/${category.id}` : `/categories/${category.id}`;
              return <Link className="service-helper-matched-category" href={href} key={category.id}>
                <span><strong>{category.name}</strong><small>{count ? `${count} مقدم خدمة` : "استعرض التخصص"}</small></span><ChevronLeft size={17}/>
              </Link>;
            })}</div>
          </section>}
          {results.length ? <div className="service-helper-results">{results.map((service) => {
            const category = categories.find((item) => item.id === service.category);
            return <article className="service-helper-result" key={service.id}><div className="service-helper-result-copy"><strong>{service.name}</strong><span>{category?.name ?? "مقدم خدمة"}{service.area ? ` • ${service.area}` : ""}</span></div><button type="button" onClick={() => { setOpen(false); onOpenService(service); }}>عرض التفاصيل<ChevronLeft size={15}/></button></article>;
          })}</div> : query.trim() && intentCategories.length > 0 ? <div className="service-helper-no-results"><span><Search size={22}/></span><strong>ظهر التخصص المناسب، لكن لا يوجد مقدم خدمة مسجّل فيه بعد.</strong><p>افتح التصنيف أعلاه لمتابعة تفاصيله.</p></div> : <div className="service-helper-no-results"><span><Search size={22}/></span><strong>{query.trim() && !hasQueryIntent ? "اكتب كلمة دالّة على الخدمة" : "لا توجد نتائج مطابقة الآن"}</strong><p>{query.trim() && !hasQueryIntent ? "الكلمات العامة وحدها لا تعرض تخصصات. جرّب: حنفية، دعاية، كروت." : "جرّب كلمة مختلفة أو اختر تخصصًا قريبًا من القائمة."}</p><button type="button" className="button button-soft" onClick={clearSelection}>مسح الاختيار<X size={15}/></button></div>}
        </>}
        {!query.trim() && !group && !issue && <p className="service-helper-instant-note">اكتب وصفًا؛ تظهر النتائج عند ظهور كلمة دالّة مثل «حنفية» أو «دعاية».</p>}
        <div className="service-helper-footer"><span>النتائج من بيانات دليل جنزور المنشورة</span><button type="button" onClick={close} aria-label="إغلاق المساعد"><X size={16}/> إغلاق</button></div>
      </div>
    </Modal>}
  </>;
}

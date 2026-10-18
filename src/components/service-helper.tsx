"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Car, ChevronLeft, GraduationCap, HeartPulse, Home, Search, Smartphone, Sparkles, Wrench, X } from "lucide-react";
import { Modal } from "@/components/ui";
import { getSpecialtyKeywords, normalizeSearch, type CategoryRecord, type ServiceRecord } from "@/lib/catalog";

type ServiceIssue = { label: string; categoryIds: string[]; keywords?: string[] };
type ServiceGroup = { id: string; label: string; icon: typeof Home; issues: ServiceIssue[] };

const SERVICE_GROUPS: ServiceGroup[] = [
  { id: "home", label: "مشكلة في البيت", icon: Home, issues: [
    { label: "عطل كهرباء أو جهاز", categoryIds: ["electricity", "appliances"], keywords: ["كهرباء", "كهربائي", "جهاز كهربائي"] },
    { label: "تسريب أو انسداد مياه", categoryIds: ["plumbing"], keywords: ["سباك", "سباكة", "مياه", "تسريب"] },
    { label: "التكييف أو التبريد", categoryIds: ["ac"], keywords: ["تكييف", "تبريد"] },
    { label: "أثاث أو نجارة", categoryIds: ["carpentry", "upholstery"], keywords: ["نجار", "نجارة", "تنجيد", "أثاث"] },
    { label: "تشطيب أو دهانات", categoryIds: ["masonry", "painting", "tiles", "aluminum", "glass"], keywords: ["بناء", "محارة", "دهان", "نقاشة", "سيراميك", "زجاج"] },
    { label: "تنظيف المنزل أو السجاد", categoryIds: ["apartment-cleaning", "carpet-cleaning"], keywords: ["تنظيف", "نظافة", "سجاد"] },
    { label: "مشكلة أخرى في المنزل", categoryIds: ["locksmith", "metalwork", "other"], keywords: ["قفال", "حداد", "خدمات منزلية"] },
  ] },
  { id: "car", label: "مشكلة في السيارة أو مشوار", icon: Car, issues: [
    { label: "صيانة أو عطل في السيارة", categoryIds: ["mechanics"], keywords: ["ميكانيكا", "ميكانيكي", "سيارات"] },
    { label: "محتاج نقل أو توصيل", categoryIds: ["rides", "moving", "freight"], keywords: ["مشوار", "نقل", "توصيل"] },
  ] },
  { id: "health", label: "صحة أو علاج", icon: HeartPulse, issues: [
    { label: "أحتاج طبيبًا أو عيادة", categoryIds: ["family", "pediatrics", "dentistry", "gynecology", "orthopedics", "dermatology", "ophthalmology", "ent", "physiotherapy"], keywords: ["طبيب", "دكتور", "عيادة"] },
    { label: "دواء أو مستلزمات طبية", categoryIds: ["community-pharmacies", "night-pharmacies", "medical-supplies"], keywords: ["صيدلية", "دواء", "مستلزمات طبية"] },
    { label: "تحاليل طبية", categoryIds: ["medical-labs"], keywords: ["معمل", "تحاليل", "أشعة"] },
  ] },
  { id: "education", label: "دراسة أو تعليم", icon: GraduationCap, issues: [
    { label: "مدرس لغة عربية", categoryIds: ["arabic"], keywords: ["عربي", "لغة عربية"] },
    { label: "مدرس لغة إنجليزية", categoryIds: ["english"], keywords: ["إنجليزي", "لغة إنجليزية"] },
    { label: "مدرس رياضيات", categoryIds: ["math"], keywords: ["رياضيات", "حساب"] },
    { label: "مدرس علوم أو مواد أخرى", categoryIds: ["science", "social-studies"], keywords: ["علوم", "كيمياء", "فيزياء", "دراسات"] },
  ] },
  { id: "devices", label: "موبايل أو كمبيوتر", icon: Smartphone, issues: [
    { label: "موبايل أو كمبيوتر", categoryIds: ["mobile-shops"], keywords: ["موبايل", "كمبيوتر", "لابتوب", "تليفون"] },
    { label: "كاميرات أو أجهزة منزلية", categoryIds: ["cameras", "appliances"], keywords: ["كاميرات", "أجهزة كهربائية"] },
  ] },
  { id: "other", label: "خدمة أخرى", icon: Building2, issues: [] },
];

export default function ServiceHelper({ categories, services, onOpenService }: { categories: CategoryRecord[]; services: ServiceRecord[]; onOpenService: (service: ServiceRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [groupId, setGroupId] = useState("");
  const [issue, setIssue] = useState<ServiceIssue | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const group = SERVICE_GROUPS.find((item) => item.id === groupId);

  const results = useMemo(() => {
    const query = normalizeSearch(customQuery.trim());
    const activeCategories = categories.filter((item) => item.active && item.parentId && services.some((service) => service.category === item.id));
    const matchedIds = new Set<string>();
    if (issue) {
      for (const category of activeCategories) {
        const indexedText = normalizeSearch(`${category.name} ${category.description} ${getSpecialtyKeywords(category.id)}`);
        if (issue.categoryIds.includes(category.id) || (issue.keywords ?? []).some((word) => indexedText.includes(normalizeSearch(word)))) matchedIds.add(category.id);
      }
    } else if (query.length > 1) {
      for (const category of activeCategories) {
        const indexedText = normalizeSearch(`${category.name} ${category.description} ${getSpecialtyKeywords(category.id)}`);
        if (indexedText.includes(query) || query.split(/\s+/).filter((word) => word.length > 1).some((word) => indexedText.includes(word))) matchedIds.add(category.id);
      }
    }
    return services.filter((service) => matchedIds.has(service.category)).slice(0, 8);
  }, [categories, customQuery, issue, services]);

  function reset() {
    setStep(1);
    setGroupId("");
    setIssue(null);
    setCustomQuery("");
  }
  function close() {
    setOpen(false);
    reset();
  }
  function chooseGroup(nextGroup: ServiceGroup) {
    setGroupId(nextGroup.id);
    setIssue(null);
    setCustomQuery("");
    if (nextGroup.id === "other") setStep(3);
    else setStep(2);
  }
  function chooseIssue(nextIssue: ServiceIssue) {
    setIssue(nextIssue);
    setCustomQuery("");
    setStep(3);
  }

  return <>
    <section className="service-helper-entry" aria-labelledby="service-helper-title">
      <div className="service-helper-entry-icon"><Sparkles size={24}/></div>
      <div className="service-helper-entry-copy">
        <h2 id="service-helper-title">محتاج خدمة ومش عارف التخصص؟</h2>
        <p>اختار المشكلة، ونوصّلك لمقدمي الخدمة المناسبين في جنزور.</p>
      </div>
      <button type="button" className="service-helper-start" onClick={() => { reset(); setOpen(true); }}>
        <span>ساعدني ألاقي الخدمة</span><ArrowLeft size={18}/>
      </button>
    </section>
    {open && <Modal title="محتاج خدمة؟" subtitle={step === 1 ? "اختار نوع الحاجة" : step === 2 ? "اختار المشكلة الأقرب للي محتاجه" : "دي الخدمات اللي ممكن تساعدك"} onClose={close} wide>
      <div className="service-helper-wizard">
        <div className="service-helper-progress" aria-label={`الخطوة ${step} من 3`}><span className={step >= 1 ? "is-current" : ""}/><span className={step >= 2 ? "is-current" : ""}/><span className={step >= 3 ? "is-current" : ""}/><small>الخطوة {step} من 3</small></div>
        {step === 1 && <div className="service-helper-choices">{SERVICE_GROUPS.map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} className="service-helper-choice" onClick={() => chooseGroup(item)}><span><Icon size={23}/></span><strong>{item.label}</strong><ChevronLeft size={17}/></button>;
        })}</div>}
        {step === 2 && <><button type="button" className="service-helper-back" onClick={() => setStep(1)}><ArrowRight size={16}/> رجوع لاختيار نوع الحاجة</button><div className="service-helper-choices">{(group?.issues ?? []).map((item) => <button type="button" key={item.label} className="service-helper-choice" onClick={() => chooseIssue(item)}><span><Wrench size={21}/></span><strong>{item.label}</strong><ChevronLeft size={17}/></button>)}</div></>}
        {step === 3 && <><button type="button" className="service-helper-back" onClick={() => { setStep(group?.id === "other" ? 1 : 2); setIssue(null); }}><ArrowRight size={16}/> تعديل الاختيار</button>
          {group?.id === "other" && <form className="service-helper-custom-search" onSubmit={(event) => { event.preventDefault(); }}><label htmlFor="service-helper-query">اكتب الخدمة أو المشكلة بكلمات بسيطة</label><div><input id="service-helper-query" value={customQuery} onChange={(event) => setCustomQuery(event.target.value)} placeholder="مثال: إصلاح موبايل أو محامي" autoComplete="off"/><Search size={18}/></div></form>}
          {results.length ? <><p className="service-helper-result-count">وجدنا {results.length} مقدم خدمة مناسب{results.length === 1 ? "" : "ين"} في الدليل:</p><div className="service-helper-results">{results.map((service) => {
            const category = categories.find((item) => item.id === service.category);
            return <article className="service-helper-result" key={service.id}><div className="service-helper-result-copy"><strong>{service.name}</strong><span>{category?.name ?? "مقدم خدمة"}{service.area ? ` • ${service.area}` : ""}</span></div><button type="button" onClick={() => { setOpen(false); reset(); onOpenService(service); }}>عرض التفاصيل<ChevronLeft size={15}/></button></article>;
          })}</div></> : <div className="service-helper-no-results"><span><Search size={22}/></span><strong>{group?.id === "other" && customQuery.trim().length < 2 ? "اكتب وصفًا قصيرًا للخدمة" : "لم نجد مقدم خدمة مطابقًا لهذا الاختيار حاليًا"}</strong><p>{group?.id === "other" && customQuery.trim().length < 2 ? "سنبحث في أسماء التخصصات ووصف الخدمات." : "يمكنك تصفح كل التخصصات أو الرجوع وتجربة اختيار آخر."}</p><button type="button" className="button button-soft" onClick={() => { close(); window.setTimeout(() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }}>تصفح كل التخصصات<ArrowLeft size={15}/></button></div>}
        </>}
        <div className="service-helper-footer"><span>النتائج من بيانات دليل جنزور المنشورة</span><button type="button" onClick={close} aria-label="إغلاق المساعد"><X size={16}/> إغلاق</button></div>
      </div>
    </Modal>}
  </>;
}

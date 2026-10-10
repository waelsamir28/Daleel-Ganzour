"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, CirclePlus, Crown, Grid2X2, Heart, LogOut, MapPin, MapPinned, Menu, MessageCircle, Phone, PhoneCall, Search, SearchX, Share2, ShieldCheck, Siren, Sparkles, Star, UserPlus, UserRound, UsersRound, X } from "lucide-react";
import { getCategory, isNewService, normalizeSearch, OTHER_ADDRESS, whatsappUrl, type CategoryRecord, type PublicDirectory, type ServiceRecord, type Viewer } from "@/lib/catalog";
import { CategoryIcon, MainCategoryIcon, Modal, ServiceArt } from "@/components/ui";
import SelectField from "@/components/select-field";
import { LocationPicker, ServiceForm } from "@/components/request-forms";
import AdminBell from "@/components/admin-bell";
import { withViewTransition } from "@/lib/motion";

type ModalName = "service" | "location" | "contact" | "emergency" | null;
const egyptEmergencyContacts = [
  { name: "الإسعاف", number: "123", detail: "للحالات الطبية الطارئة ونقل المرضى" },
  { name: "الشرطة", number: "122", detail: "للطوارئ والبلاغات الأمنية" },
  { name: "الحماية المدنية والمطافئ", number: "180", detail: "للحريق والإنقاذ والحوادث" },
  { name: "خط وزارة الصحة", number: "105", detail: "للاستفسارات الصحية وخدمات وزارة الصحة" },
  { name: "الرعاية الحرجة", number: "137", detail: "للتنسيق بشأن أسِرّة الرعاية المركزة والحضّانات" },
];
// Category colours reach the card icon through CSS custom properties.
function categoryTheme(item: CategoryRecord) {
  return { "--cat": item.color, "--cat-light": item.light } as CSSProperties;
}

export default function Directory({ initialData, viewer, rootId, specialtyId, initialFavorites = false }: { initialData: PublicDirectory; viewer: Viewer; rootId?: string; specialtyId?: string; initialFavorites?: boolean }) {
  const [data, setData] = useState(initialData), [modal, setModal] = useState<ModalName>(null), [detail, setDetail] = useState<ServiceRecord | null>(null);
  const [menuOpen, setMenuOpen] = useState(false), [favorites, setFavorites] = useState<string[]>([]);
  const [queryDraft, setQueryDraft] = useState(""), [query, setQuery] = useState(""), [rootFilter, setRootFilter] = useState(rootId ?? "");
  const [area, setArea] = useState(""), [customAddress, setCustomAddress] = useState(""), [emergency, setEmergency] = useState(false);
  const [view, setView] = useState<"all" | "favorites">(initialFavorites ? "favorites" : "all"), [showAll, setShowAll] = useState(Boolean(specialtyId));
  const [logoutError, setLogoutError] = useState("");
  const closeModal = useCallback(() => setModal(null), []);
  const closeDetail = useCallback(() => {
    if (!detail) return;
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === detail.id);
    withViewTransition(() => {
      source?.style.setProperty("view-transition-name", "provider-detail");
      setDetail(null);
    }, () => source?.style.removeProperty("view-transition-name"));
  }, [detail]);
  function openDetail(service: ServiceRecord) {
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === service.id);
    source?.style.setProperty("view-transition-name", "provider-detail");
    withViewTransition(() => {
      source?.style.removeProperty("view-transition-name");
      setDetail(service);
    });
  }
  const { settings, categories, services } = data;
  const roots = categories.filter((category) => !category.parentId);
  const root = rootId ? getCategory(rootId, categories) : null, specialty = specialtyId ? getCategory(specialtyId, categories) : null;
  const scoped = Boolean(rootId), isHome = !scoped;
  const whatsapp = whatsappUrl(settings.phone);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-only favorites after server rendering.
    try { const stored: unknown = JSON.parse(localStorage.getItem("elgamal-favorites") ?? "[]"); if (Array.isArray(stored)) setFavorites(stored.filter((id): id is string => typeof id === "string")); } catch { /* Use session-only favorites if storage is unavailable. */ }
    let disposed = false;
    const refresh = async () => { if (document.hidden) return; try { const response = await fetch("/api/services", { cache: "no-store" }); if (response.ok && !disposed) setData(await response.json()); } catch { /* Preserve the directory on temporary network failures. */ } };
    const timer = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  async function shareService(service: ServiceRecord) {
    const url = window.location.origin + window.location.pathname;
    const text = `${service.name} - ${getCategory(service.category, categories).name}${service.area ? ` - ${service.area}` : ""}\nالهاتف: ${service.phone}\nمن دليل جنزور: ${url}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: service.name, text, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  function toggleFavorite(id: string) { setFavorites((current) => { const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]; try { localStorage.setItem("elgamal-favorites", JSON.stringify(next)); } catch { /* Favorites still work during this visit. */ } return next; }); }
  function scrollToProviders() { setTimeout(() => document.getElementById("providers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function showFavorites() { if (scoped) { window.location.assign("/?favorites=1"); return; } setView("favorites"); setRootFilter(""); setArea(""); setCustomAddress(""); setEmergency(false); setQuery(""); setQueryDraft(""); setShowAll(true); setMenuOpen(false); scrollToProviders(); }
  function search(event: FormEvent) { event.preventDefault(); setQuery(queryDraft.trim()); setView("all"); setShowAll(true); scrollToProviders(); }
  function selectLocation(value: string, custom = "") { setArea(value); setCustomAddress(custom); setShowAll(true); setView("all"); setModal(null); scrollToProviders(); }
  function showEmergency() { setModal("emergency"); setMenuOpen(false); }
  function clearFilters() { setRootFilter(rootId ?? ""); setArea(""); setCustomAddress(""); setQuery(""); setQueryDraft(""); setEmergency(false); setView("all"); setShowAll(Boolean(specialtyId)); }
  async function logout() { setLogoutError(""); try { const response = await fetch("/api/auth", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/"); } catch { setLogoutError("تعذر تسجيل الخروج. حاول مرة أخرى."); } }
  const filteredServices = useMemo(() => services.filter((service) => {
    const item = getCategory(service.category, categories);
    return (!specialtyId || service.category === specialtyId) && (!rootFilter || item.parentId === rootFilter) && (!query || normalizeSearch(`${service.name} ${service.description} ${item.name} ${service.address} ${service.phone} ${service.phoneSecondary}`).includes(normalizeSearch(query))) && (!area || service.area === area) && (area !== OTHER_ADDRESS || !customAddress || normalizeSearch(service.address).includes(normalizeSearch(customAddress))) && (!emergency || service.emergency) && (view !== "favorites" || favorites.includes(service.id));
  }), [services, categories, specialtyId, rootFilter, query, area, customAddress, emergency, view, favorites]);
  const isFiltering = Boolean(query || area || emergency || view === "favorites" || (!rootId && rootFilter));
  const featured = filteredServices.filter((service) => service.featured);
  const visibleServices = isFiltering || showAll || specialtyId ? filteredServices : (featured.length ? featured : filteredServices).slice(0, 4);
  const providerTitle = view === "favorites" ? "خدماتك المفضلة" : emergency ? "خدمات الطوارئ" : specialty ? `${rootId === "clinics" ? "أطباء" : "مقدمو خدمات"} ${specialty.name}` : isFiltering ? "نتائج البحث" : showAll ? "كل مقدمي الخدمات" : root ? `خدمات ${root.name} في جنزور` : "مقدمو الخدمات المميزين";
  const displayedCategories = root ? categories.filter((category) => category.parentId === root.id) : roots;
  const title = specialty ? `${specialty.name} بقرية جنزور` : root ? `${root.name} بقرية جنزور` : settings.siteName;
  function categoryCount(category: CategoryRecord) { return category.parentId ? services.filter((service) => service.category === category.id).length : categories.filter((item) => item.parentId === category.id).length; }

  return <>
    <header className="site-header"><div className="container header-inner"><nav className={`main-nav ${menuOpen ? "nav-open" : ""}`} aria-label="القائمة الرئيسية"><Link href="/" className={isHome && !isFiltering ? "active" : ""} onClick={() => setMenuOpen(false)}>الرئيسية</Link><a href={isHome ? "#categories" : "/#categories"} className={scoped ? "active" : ""} onClick={() => setMenuOpen(false)}>التصنيفات</a><button className={view === "favorites" ? "active" : ""} onClick={showFavorites}>المفضلة <Heart size={15}/>{favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}</button><button onClick={() => { setModal("contact"); setMenuOpen(false); }}>اتصل بنا</button>{viewer.role === "guest" && <a className="mobile-register-link" href="/register">إنشاء عضوية</a>}</nav><div className="header-actions">{viewer.role === "admin" ? <><AdminBell/><a href="/admin" className="admin-link"><ShieldCheck size={19}/><span>لوحة التحكم</span></a></> : viewer.role === "moderator" ? <a href="/admin" className="admin-link"><ShieldCheck size={19}/><span>لوحة المشرف</span></a> : viewer.role === "member" ? <a href="/account" className="member-account-link"><UserRound size={19}/><span>{viewer.name?.split(" ")[0]}</span></a> : <div className="auth-links"><a href="/login"><UserRound size={18}/><span>تسجيل الدخول</span></a><a href="/register" className="register-link" aria-label="عضوية جديدة"><UserPlus size={18}/><span>عضوية جديدة</span></a></div>}{viewer.role !== "guest" && <button className="icon-button logout-button" onClick={logout} aria-label="تسجيل الخروج"><LogOut size={17}/></button>}{scoped && <button className="button button-primary add-service-header" onClick={() => setModal("service")}><CirclePlus size={18}/><span>أضف مهنتك</span></button>}<button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button></div></div></header>
    {data.previewMode && <div className="preview-mode-notice" role="status">وضع المعاينة: البيانات المعروضة توضيحية، ولن تُحفَظ الإضافات دون قاعدة بيانات.</div>}
    {logoutError && <div role="alert" className="form-error container">{logoutError}</div>}
    <section className={`hero ${scoped ? "category-page-hero" : "hero-with-banner"}`} aria-labelledby="hero-title"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/><svg className="hero-skyline" viewBox="0 0 1440 210" preserveAspectRatio="none" aria-hidden="true"><path d="M0 210V105h43V81h32v50h29V64h32V22h8V0h6v22h10v42h29v83h27v-39h24V77h22v31h20v102h31V97h33v28h17V65h50v145h42v-65h22v-20h29v20h28v65h33V79h26V36h8V15h5v21h9v43h31v131h32v-86h22V98h38v26h24v86h31V73h49v35h29v102h45V94h31V62h40v148h29v-62h50v62h50V99h34V80h21v19h32v111h41V64h29V26h9V5h5v21h12v38h30v146h42V91h47v119h31V70h26V40h23v30h22v140h37v-63h52v63h34v-98h26V79h31v33h20v98Z"/></svg>{!scoped && <div className="hero-banner-wrap"><Image src="/images/home-banner-sky.png" alt="دليل المهن والخدمات بقرية جنزور، كل أرقام المهنيين والخدمات والمشاريع في مكان واحد" width={2048} height={768} sizes="(max-width: 700px) 100vw, (max-width: 1378px) 90vw, 1240px" priority/></div>}<div className="container hero-inner"><div className="hero-visual">{scoped && <Image src="/images/hero-category-transparent.webp" alt="دليل خدمات جنزور" width={1055} height={2048} sizes="205px" priority className="hero-image hero-category-image" unoptimized/>}<span className="hero-floating-tag"><CheckCircle2 size={16}/> من أهل القرية.. لأهل القرية</span></div><div className="hero-copy">{scoped ? <nav className="hero-breadcrumb" aria-label="مسار الصفحة"><Link href="/">الرئيسية</Link><ChevronLeft size={13}/>{specialty ? <><a href={`/categories/${rootId}`}>{root?.name}</a><ChevronLeft size={13}/><span>{specialty.name}</span></> : <span>{root?.name}</span>}</nav> : <div className="hero-eyebrow"><Sparkles size={15}/>{settings.heroEyebrow}</div>}<h1 id="hero-title">{title}</h1><p className="hero-subtitle">{specialty ? "الأسماء والعناوين وأرقام التواصل.. اختار الأنسب ليك" : root ? root.description : settings.heroSubtitle}</p><p className="hero-tagline">{settings.tagline}</p><form className="hero-search" onSubmit={search} role="search"><div className="search-input-wrap"><Search size={22}/><input type="search" aria-label="ابحث عن مهنة أو مقدم خدمة" value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="ابحث عن مهنة، طبيب أو مقدم خدمة..."/></div><SelectField aria-label="اختر التصنيف" value={rootFilter} onChange={(event) => setRootFilter(event.target.value)} disabled={scoped} icon={<Grid2X2 size={17}/>} options={[{ value: "", label: "كل التصنيفات" }, ...roots.map(({ id, name }) => ({ value: id, label: name }))]}/><SelectField className="area-select" aria-label="اختر العنوان" value={area} onChange={(event) => { setArea(event.target.value); setCustomAddress(""); }} icon={<MapPin size={18}/>} options={[{ value: "", label: "كل عناوين جنزور" }, ...data.areas.map(({ name }) => ({ value: name, label: name })), { value: OTHER_ADDRESS, label: OTHER_ADDRESS }]}/><button className="search-button" type="submit">ابحث الآن <Search size={17}/></button>{area === OTHER_ADDRESS && <label className="hero-custom-address">العنوان الآخر<input value={customAddress} onChange={(event) => setCustomAddress(event.target.value)} placeholder="اكتب الشارع أو العلامة المميزة" required minLength={3} maxLength={240}/></label>}</form><div className="hero-trust"><button type="button" className="button button-success search-add-service" onClick={() => setModal("service")}><CirclePlus size={19}/><span>أضف مهنتك</span></button><span><ShieldCheck size={19}/> مراجعة قبل النشر</span><span><PhoneCall size={18}/> تواصل مباشر</span><span><MapPin size={19}/> خدمات في جنزور</span><span><UsersRound size={19}/>{data.memberCount} عضو في الموقع</span></div></div></div></section>
    <div className="container directory-layout"><aside className="directory-sidebar" aria-label="الخدمات السريعة" hidden><div className="quick-links-card"><h2>الخدمات السريعة <Sparkles size={17}/></h2>{settings.showEmergency && <button onClick={showEmergency}><span className="quick-icon quick-red"><Siren size={25}/></span>خدمات الطوارئ<ChevronLeft size={15}/></button>}<button onClick={() => setModal("location")}><span className="quick-icon quick-blue"><MapPinned size={24}/></span>ابحث حسب العنوان<ChevronLeft size={15}/></button><button className="add-service-quick-link" onClick={() => setModal("service")}><span className="quick-icon quick-green"><CirclePlus size={25}/></span>أضف مهنتك مجانًا<ChevronLeft size={15}/></button><button onClick={showFavorites}><span className="quick-icon quick-pink"><Heart size={25} fill="currentColor"/></span>المفضلة<ChevronLeft size={15}/></button></div><div className="community-card"><span><UsersRound size={28}/></span><strong>{data.memberCount}</strong><h2>عضو في مجتمع جنزور</h2><p>العضوية غير إضافة المهنة.. انضم وخليك واحد من أهل الدليل.</p><a href={viewer.role === "guest" ? "/register" : viewer.role === "admin" ? "/admin?tab=members" : viewer.role === "moderator" ? "/admin" : "/account"} className="button button-soft">{viewer.role === "guest" ? "انضم للموقع" : viewer.role === "admin" ? "إدارة الأعضاء" : viewer.role === "moderator" ? "لوحة المشرف" : "حساب عضويتك"}<ArrowLeft size={15}/></a></div><div className="verified-card"><ShieldCheck size={47}/><div><strong>النشر بعد المراجعة</strong><span><CheckCircle2 size={14}/> الإدارة بتراجع كل طلب</span></div></div></aside>
    <main className="directory-main">{!specialty && <section id="categories" className="categories-section"><div className="section-heading directory-section-heading"><div><h2><Grid2X2 size={23}/>{root ? `تخصصات ${root.name}` : "تصفح أقسام القرية"}</h2><p>{root ? "اضغط على التخصص.. هتلاقي الأسماء والعناوين والأرقام" : "اختار القسم، وبعده التخصص.. وسيب الباقي علينا"}</p></div><span className="section-count">{displayedCategories.length} {root ? "تخصص" : "أقسام رئيسية"}</span></div><div className={`category-grid ${root ? "specialties-grid" : "main-category-grid"}`}>{displayedCategories.map((category) => <Link key={category.id} href={category.parentId ? `/categories/${category.parentId}/${category.id}` : `/categories/${category.id}`} aria-label={category.name} className="category-tile" style={{ "--category-color": category.color, "--category-light": category.light } as CSSProperties}><span className="category-icon">{category.parentId ? <CategoryIcon icon={category.icon} size={35}/> : <MainCategoryIcon icon={category.icon}/>}</span><strong>{category.name}</strong><span className="category-meta">{categoryCount(category)} {category.parentId ? "مقدم خدمة" : "تخصص"}<ChevronLeft size={12}/></span></Link>)}</div>{!displayedCategories.length && <div className="empty-state"><h3>التخصصات قيد التجهيز</h3><p>الإدارة هتضيف تخصصات القسم قريبًا.</p></div>}</section>}

      <section id="providers" className={`providers-section ${specialty ? "specialty-providers" : ""}`}><div className="section-heading directory-section-heading"><div><h2>{view === "favorites" ? <Heart size={22} className="pink-icon"/> : emergency ? <Siren size={24} className="red-icon"/> : specialty ? <UsersRound size={23}/> : <Crown size={23} className="crown-icon"/>}{providerTitle}</h2><p>{isFiltering || specialty ? `${filteredServices.length} مقدم خدمة متاح في الدليل` : "أهل خبرة وصنعة.. من قرية جنزور"}</p></div>{!isFiltering && !specialty && <button className="view-all" onClick={() => setShowAll(!showAll)}>{showAll ? "عرض المميزين" : "عرض الكل"}<ChevronLeft size={17}/></button>}</div>{isFiltering && <div className="filter-tags">{view === "favorites" && <span><Heart size={13}/>المفضلة</span>}{query && <span>{query}<button onClick={() => { setQuery(""); setQueryDraft(""); }} aria-label="إزالة كلمة البحث"><X size={12}/></button></span>}{!scoped && rootFilter && <span>{getCategory(rootFilter, categories).name}</span>}{area && <span><MapPin size={12}/>{area === OTHER_ADDRESS ? customAddress || OTHER_ADDRESS : area}<button onClick={() => { setArea(""); setCustomAddress(""); }} aria-label="إزالة العنوان"><X size={12}/></button></span>}{emergency && <span className="emergency-filter">خدمات الطوارئ</span>}<button className="clear-filters" onClick={clearFilters}>مسح الفلاتر</button></div>}{visibleServices.length ? <div className="provider-grid">{visibleServices.map((service) => <ProviderCard key={service.id} service={service} category={getCategory(service.category, categories)} favorite={favorites.includes(service.id)} onOpen={openDetail} onShare={(item) => void shareService(item)} onToggleFavorite={toggleFavorite}/>)}</div> : <div className="empty-state"><span><SearchX size={36}/></span><h3>{view === "favorites" ? "مفضلتك لسه فاضية" : "لسه مفيش خدمات مطابقة"}</h3><p>{view === "favorites" ? "اضغط على القلب بجانب أي خدمة عشان ترجع لها بسهولة." : "كن أول مقدم خدمة هنا.. أضف بياناتك والإدارة هتراجعها قبل النشر."}</p><button className="button button-soft" onClick={view === "favorites" ? clearFilters : () => setModal("service")}>{view === "favorites" ? "تصفح الخدمات" : "أضف مهنتك مجانًا"}<ArrowLeft size={16}/></button></div>}{visibleServices.some((service) => service.demo) && <p className="demo-note"><span/> بعض البطاقات نماذج توضيحية، وليست بيانات مقدمي خدمة حقيقيين. المهن الجديدة تُنشر بعد الموافقة.</p>}</section>
      <section id="quick-services" className="quick-services-section" aria-labelledby="quick-services-title"><div className="section-heading directory-section-heading"><div><h2 id="quick-services-title"><Sparkles size={23}/>الخدمات السريعة</h2><p>اختار الخدمة اللي محتاجها في جنزور</p></div></div><div className="quick-links-card quick-services-grid">{settings.showEmergency && <button type="button" onClick={showEmergency}><span className="quick-icon quick-red"><Siren size={25}/></span>خدمات الطوارئ<ChevronLeft size={15}/></button>}<button type="button" onClick={() => setModal("location")}><span className="quick-icon quick-blue"><MapPinned size={24}/></span>ابحث حسب العنوان<ChevronLeft size={15}/></button><button type="button" onClick={showFavorites}><span className="quick-icon quick-pink"><Heart size={25} fill="currentColor"/></span>المفضلة<ChevronLeft size={15}/></button></div></section>{settings.showEmergency && <section className="emergency-strip" aria-labelledby="emergency-strip-title"><span className="emergency-strip-icon"><Siren size={24}/></span><div className="emergency-strip-copy"><h2 id="emergency-strip-title">الخدمات والطوارئ</h2><p>لأن بعض المواقف.. ما تستحملش انتظار</p></div><button type="button" className="emergency-strip-button" onClick={showEmergency}>عرض الأرقام</button></section>}
    </main></div>
    <footer className="site-footer"><div className="container footer-main"><div className="footer-brand-group">{(viewer.role === "admin" || viewer.role === "moderator") && <Link href="/admin" className="footer-admin-link"><ShieldCheck size={14}/><span>{viewer.role === "moderator" ? "لوحة المشرف" : "لوحة التحكم"}</span></Link>}<div className="footer-brand-lockup"><Image src="/images/logo-daleel-transparent.png" alt="" width={64} height={64} sizes="64px"/><div className="footer-brand-copy"><strong>جنزور في مكان واحد</strong><span>دليل المهن والخدمات.. من أهل القرية لأهلها</span></div></div></div><nav aria-label="روابط تذييل الصفحة"><Link href="/"><Search size={15}/> الرئيسية</Link><Link href="/#categories"><Grid2X2 size={15}/> التصنيفات</Link><button onClick={showFavorites}><Heart size={15}/> المفضلة</button><button onClick={() => setModal("contact")}><MessageCircle size={15}/> اتصل بنا</button></nav><p className="footer-copyright">{settings.copyright}</p><a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="التواصل مع الإدارة عبر واتساب" className="footer-whatsapp"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.52 0 .19 5.34.19 11.9c0 2.1.55 4.14 1.59 5.95L.08 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.45-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.03-1.37l-.36-.22-3.74.98.99-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg></span><div><small>التواصل مع الإدارة</small><strong dir="ltr">{settings.phone}</strong></div></a></div></footer><a className="floating-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="تواصل مع مكتب الجمال على واتساب"><MessageCircle size={27}/><span>تواصل معنا</span></a>
    {modal === "emergency" && <Modal title="أرقام الطوارئ في مصر" subtitle="اتصل بالجهة المختصة مباشرة من هاتفك" onClose={closeModal}><div className="emergency-contact-list">{egyptEmergencyContacts.map((contact) => <a className="emergency-contact-link" key={contact.number} href={`tel:${contact.number}`}><span className="emergency-contact-icon"><PhoneCall size={20}/></span><span className="emergency-contact-copy"><strong>{contact.name}</strong><small>{contact.detail}</small></span><b dir="ltr">{contact.number}</b></a>)}<p className="emergency-contact-note">للحالات الطبية المهددة للحياة اتصل بالإسعاف على 123. أرقام الخدمات قد تختلف حسب المنطقة.</p></div></Modal>}
    {modal === "service" && <Modal title="أضف مهنتك لدليل جنزور" subtitle="طلب إضافة خدمة.. بعد مراجعة الإدارة" onClose={closeModal} wide><ServiceForm catalog={categories} areaOptions={data.areas} initialCategory={specialtyId || rootFilter} initialArea={area} onClose={closeModal}/></Modal>}
    {modal === "location" && <Modal title="اختار عنوانك في جنزور" subtitle="الخدمة في ناحيتك.. في خطوات بسيطة" onClose={closeModal}><LocationPicker areaOptions={data.areas} selected={area} onSelect={selectLocation}/></Modal>}
    {modal === "contact" && <Modal title="خلّينا على تواصل" subtitle="مكتب الجمال للدعاية والإعلان" onClose={closeModal}><div className="contact-content"><span className="contact-illustration"><MessageCircle size={46}/></span><h3>إحنا هنا عشان نساعدك</h3><p>{settings.contactText}</p><a className="contact-number" href={`tel:${settings.phone}`} dir="ltr">{settings.phone}</a><a className="button button-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={20}/>تواصل على واتساب</a><a className="button button-soft" href={`tel:${settings.phone}`}><Phone size={18}/>اتصل بمكتب الجمال</a></div></Modal>}
    {detail && <Modal title={getCategory(detail.category, categories).parentId === "clinics" ? "بيانات الطبيب والعيادة" : "تفاصيل مقدم الخدمة"} subtitle={`${getCategory(detail.category, categories).name} • ${detail.address || detail.area}`} onClose={closeDetail}><div className="service-details">
      <div className="detail-hero" style={categoryTheme(getCategory(detail.category, categories))}>
        <ServiceArt category={detail.category} item={getCategory(detail.category, categories)}/>
        <div className="detail-hero-copy"><h3>{detail.name}</h3><span className="detail-hero-category"><CategoryIcon icon={getCategory(detail.category, categories).icon} size={14}/>{getCategory(detail.category, categories).name}</span><ProviderRating value={detail.rating} reviews={detail.reviews}/></div>
      </div>
      <div className="details-badges">{detail.verified && <span className="detail-verified"><ShieldCheck size={14}/>موثقة</span>}{detail.emergency && <span className="detail-emergency"><Siren size={14}/>متاح للطوارئ</span>}{detail.featured && <span className="detail-featured"><Crown size={14}/>خدمة مميزة</span>}{isNewService(detail) && <span className="detail-new"><Sparkles size={14}/>جديد</span>}</div>
      {detail.demo && <div className="form-notice notice-amber"><span>هذه بطاقة تجريبية لتوضيح شكل الدليل، وليست بيانات مقدم خدمة حقيقي.</span></div>}
      <dl className="detail-data">
        <div><dt>التخصص</dt><dd>{getCategory(detail.category, categories).name}</dd></div>
        <div><dt>العنوان</dt><dd><MapPin size={14}/>{detail.address || detail.area}</dd></div>
        <div><dt>الهاتف</dt><dd dir="ltr">{detail.phone}</dd></div>
        {detail.phoneSecondary && <div><dt>هاتف إضافي</dt><dd dir="ltr">{detail.phoneSecondary}</dd></div>}
      </dl>
      <div className="detail-actions"><a className="button button-primary" href={`tel:${detail.phone}`}><Phone size={18}/>اتصل الآن</a>{detail.phoneSecondary && <a className="button button-soft" href={`tel:${detail.phoneSecondary}`}><Phone size={18}/><span dir="ltr">{detail.phoneSecondary}</span></a>}<a className="button button-whatsapp" href={whatsappUrl(detail.phone, "مرحبًا، وصلت إليك من دليل المهن والخدمات بقرية جنزور.")} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/>واتساب</a></div>
      <div className="detail-about"><h4>نبذة عن الخدمة</h4><p>{detail.description}</p></div>
      <div className="detail-utility-row"><button type="button" className="detail-share" onClick={() => void shareService(detail)} aria-label={`مشاركة ${detail.name}`} title="مشاركة"><Share2 size={18}/></button><button type="button" className="detail-favorite" onClick={() => toggleFavorite(detail.id)} aria-pressed={favorites.includes(detail.id)}><Heart size={17} fill={favorites.includes(detail.id) ? "currentColor" : "none"}/>{favorites.includes(detail.id) ? "محفوظ في المفضلة" : "احفظ مقدم الخدمة في المفضلة"}</button></div>
    </div></Modal>}
  </>;
}

// Five gold stars summarise the stored rating; reviews stay as a plain count.
function ProviderRating({ value, reviews }: { value: string; reviews?: number }) {
  const score = Number.parseFloat(value);
  const filled = Number.isFinite(score) ? Math.min(5, Math.max(0, Math.round(score))) : 0;
  return <span className="provider-rating"><span className="rating-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map((step) => <Star key={step} size={14} className={step <= filled ? "is-on" : ""} fill={step <= filled ? "currentColor" : "none"}/>)}</span>{Number.isFinite(score) && score > 0 ? <strong>{score.toFixed(1)}</strong> : <strong>جديد</strong>}{reviews !== undefined && reviews > 0 && <span>({reviews} تقييم)</span>}</span>;
}

type ProviderCardProps = {
  service: ServiceRecord;
  category: CategoryRecord;
  favorite: boolean;
  onOpen: (service: ServiceRecord) => void;
  onShare: (service: ServiceRecord) => void;
  onToggleFavorite: (id: string) => void;
};
// Card layout: 54px category icon, red name, blue specialty, five gold stars, blue address,
// favourite above share on the left, and a light-blue call strip with the number and an "اتصال" button.
// Tapping anywhere on the card — including that button — opens the details overlay; calling happens there only.
function ProviderCard({ service, category, favorite, onOpen, onShare, onToggleFavorite }: ProviderCardProps) {
  return <article className="provider-card" data-service-id={service.id} role="button" tabIndex={0} aria-label={`عرض تفاصيل ${service.name}`} style={categoryTheme(category)} onClick={() => onOpen(service)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(service); } }}>
    <div className="provider-card-main">
      <span className="provider-card-icon" aria-hidden="true"><CategoryIcon icon={category.icon} size={26}/></span>
      <div className="provider-card-copy">
        <h3 className="provider-name">{service.name}</h3>
        <span className="provider-specialty">{category.name}</span>
        <ProviderRating value={service.rating} reviews={service.reviews}/>
        <span className="provider-address"><MapPin size={13}/>{service.address || service.area}</span>
      </div>
      <div className="provider-card-side">
        <button type="button" className={`favorite-button ${favorite ? "is-favorite" : ""}`} onClick={(event) => { event.stopPropagation(); onToggleFavorite(service.id); }} aria-label={favorite ? `إزالة ${service.name} من المفضلة` : `أضف ${service.name} للمفضلة`} aria-pressed={favorite}><Heart size={16} fill={favorite ? "currentColor" : "none"}/></button>
        <button type="button" className="provider-share-button" onClick={(event) => { event.stopPropagation(); onShare(service); }} aria-label={`مشاركة ${service.name}`} title="مشاركة"><Share2 size={15}/></button>
      </div>
    </div>
    <div className="provider-call-strip">
      <span className="provider-call-number"><Phone size={15}/><span dir="ltr">{service.phone}</span></span>
      <span className="provider-call-button"><PhoneCall size={15}/>اتصال</span>
    </div>
    {isNewService(service) && <span className="new-flag">جديد</span>}
  </article>;
}

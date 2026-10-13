"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import { ALargeSmall, ArrowLeft, Award, BellRing, Bus, CalendarCheck, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsDown, ChevronsUp, CirclePlus, Clipboard, ClipboardCheck, ClipboardList, Clock, Crown, Flame, FlaskConical, Gift, GraduationCap, Grid2X2, Heart, LogOut, MapPin, MapPinned, Medal, Menu, MessageCircle, Moon, Pencil, Phone, PhoneCall, Pill, Plus, QrCode, Search, SearchX, Share2, ShieldCheck, ShoppingBag, Siren, Sparkles, Star, Stethoscope, Store, Sun, Trash2, Truck, UserPlus, UserRound, UsersRound, X } from "lucide-react";
import { buildShopWhatsappOrderMessage, defaultDesignSettings, ganzourTransitRoutes, getCategory, getClinicBookingLabel, getClinicBookingMode, getClinicScheduleSummary, getDutyShiftInfo, getOnDutyServices, getServiceTrustBadges, getShopCatalogItems, getSpecialtyKeywords, getSponsorOfferCategoryGroup, getTeacherStagesForService, isAvailableNow, isNewService, isServiceOwner, matchesClinicFilter, matchesServiceQuery, matchesTeacherStage, normalizeSearch, OTHER_ADDRESS, parseAnnouncementItems, parseSponsoredProviders, publicUtilityNumbers, serviceWhatsappMessage, suggestSpecialties, supportsHomeDelivery, TEACHER_STAGES, whatsappUrl, type CategoryRecord, type ClinicBookingFilter, type DailyOfferFilterGroup, type DutyFilter, type FollowFeedItem, type FollowState, type PublicDirectory, type PublicUtilityContact, type ServiceRecord, type SponsoredProviderConfig, type TeacherStageId, type Viewer } from "@/lib/catalog";
import { CategoryIcon, MainCategoryIcon, Modal, ServiceArt } from "@/components/ui";
import DesignApplicator from "@/components/design-applicator";
import BusinessCardModal from "@/components/business-card-modal";
import SponsorshipModal from "@/components/sponsorship-modal";
import SelectField from "@/components/select-field";
import { LocationPicker, ServiceForm } from "@/components/request-forms";
import { ProviderCompletionModalForm } from "@/components/management-editor";
import { trackDirectoryEvent } from "@/lib/analytics-tracker";
import { withViewTransition } from "@/lib/motion";

type ModalName = "service" | "location" | "contact" | "emergency" | "duty" | "utilities" | "quick" | null;
// Category colours reach the card icon through CSS custom properties.
function categoryTheme(item: CategoryRecord) {
  return { "--cat": item.color, "--cat-light": item.light } as CSSProperties;
}

export default function Directory({ initialData, viewer, rootId, specialtyId, initialFavorites = false }: { initialData: PublicDirectory; viewer: Viewer; rootId?: string; specialtyId?: string; initialFavorites?: boolean }) {
  const [data, setData] = useState(initialData), [modal, setModal] = useState<ModalName>(null), [detail, setDetail] = useState<ServiceRecord | null>(null);
  const [updatePhone, setUpdatePhone] = useState(""), [updateNote, setUpdateNote] = useState(""), [updateMessage, setUpdateMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false), [favorites, setFavorites] = useState<string[]>([]);
  const [queryDraft, setQueryDraft] = useState(""), [query, setQuery] = useState(""), [rootFilter, setRootFilter] = useState(rootId ?? "");
  const [area, setArea] = useState(""), [customAddress, setCustomAddress] = useState(""), [emergency, setEmergency] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false), [teacherStage, setTeacherStage] = useState<TeacherStageId>("all"), [now, setNow] = useState(0);
  const [openTeacherStage, setOpenTeacherStage] = useState<TeacherStageId | null>(null);
  const [teacherSpecialtyFilter, setTeacherSpecialtyFilter] = useState<string>(specialtyId ?? "");
  const [clinicFilter, setClinicFilter] = useState<ClinicBookingFilter>("all");
  const [selectedShopItems, setSelectedShopItems] = useState<string[]>([]);
  const [shopOrderNote, setShopOrderNote] = useState("");
  const [shopOrderDelivery, setShopOrderDelivery] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [dutyFilter, setDutyFilter] = useState<DutyFilter>("all"), [copiedUtilityId, setCopiedUtilityId] = useState("");
  const [completionService, setCompletionService] = useState<ServiceRecord | null>(null);
  const [editingUtility, setEditingUtility] = useState<Partial<PublicUtilityContact> | null>(null);
  const [utilityBusy, setUtilityBusy] = useState(false), [utilityMessage, setUtilityMessage] = useState("");
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    return () => { clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);
  const liveDetail = detail ? data.services.find((service) => service.id === detail.id) ?? detail : null;
  const design = useMemo(() => ({ ...defaultDesignSettings, ...(data.designSettings ?? {}) }), [data.designSettings]);
  const [view, setView] = useState<"all" | "favorites">(initialFavorites ? "favorites" : "all");
  const [featuredOpen, setFeaturedOpen] = useState(() => Boolean(initialData.designSettings?.featuredDefaultOpen));
  const [ownedServiceIds, setOwnedServiceIds] = useState<string[]>([]);
  const [logoutError, setLogoutError] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false), [suggestActive, setSuggestActive] = useState(-1);
  const [detailQr, setDetailQr] = useState(false), [detailUpdate, setDetailUpdate] = useState(false);
  const [detailRatingOpen, setDetailRatingOpen] = useState(false);
  const [detailClinicOpen, setDetailClinicOpen] = useState(false);
  const [detailBadgesOpen, setDetailBadgesOpen] = useState(() => Boolean(initialData.designSettings?.badgesDefaultOpen));
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [sponsorModalAuto, setSponsorModalAuto] = useState(false);
  const [dailyOfferFilter, setDailyOfferFilter] = useState<DailyOfferFilterGroup>("all");
  const [dailyOffersOpen, setDailyOffersOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(0), [ratingComment, setRatingComment] = useState(""), [ratingMessage, setRatingMessage] = useState(""), [ratingBusy, setRatingBusy] = useState(false);
  const [followIds, setFollowIds] = useState<string[]>([]), [feedItems, setFeedItems] = useState<FollowFeedItem[]>([]), [feedOpen, setFeedOpen] = useState(false), [followBusy, setFollowBusy] = useState(false), [followError, setFollowError] = useState("");
  const [feedSeen, setFeedSeen] = useState(() => { try { return Number(localStorage.getItem("janzour-feed-seen")) || 0; } catch { return 0; } });
  const [bigText, setBigText] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read the persisted font size from the pre-paint script.
    setBigText(document.documentElement.classList.contains("big-text"));
  }, []);
  const closeModal = useCallback(() => setModal(null), []);
  const closeDetail = useCallback(() => {
    if (!detail) return;
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === detail.id);
    withViewTransition(() => {
      source?.style.setProperty("view-transition-name", "provider-detail");
      setDetail(null);
      setDetailRatingOpen(false);
      setDetailClinicOpen(false);
    }, () => source?.style.removeProperty("view-transition-name"));
  }, [detail]);
  function openDetail(service: ServiceRecord) {
    trackDirectoryEvent({ kind: "view", label: service.name, serviceId: service.id, categoryId: service.category });
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === service.id);
    source?.style.setProperty("view-transition-name", "provider-detail");
    withViewTransition(() => {
      source?.style.removeProperty("view-transition-name");
      setDetail(service);
      setDetailQr(false); setDetailUpdate(false); setDetailRatingOpen(false); setDetailClinicOpen(false);
      setDetailBadgesOpen(Boolean(design.badgesDefaultOpen));
      setRatingStars(0); setRatingComment(""); setRatingMessage("");
      setSelectedShopItems([]); setShopOrderNote(""); setShopOrderDelivery(supportsHomeDelivery(service));
    });
  }
  const { settings, categories, services } = data;
  const roots = categories.filter((category) => !category.parentId);
  const root = rootId ? getCategory(rootId, categories) : null, specialty = specialtyId ? getCategory(specialtyId, categories) : null;
  const scoped = Boolean(rootId), isHome = !scoped;
  const whatsapp = whatsappUrl(settings.phone);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const serviceParam = params.get("service");
      if (serviceParam) {
        const match = initialData.services.find((item) => item.id === serviceParam);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Open deep-linked service card from QR/shared link on mount.
        if (match) setDetail(match);
      }
      const stageParam = params.get("stage");
      if (stageParam && TEACHER_STAGES.some((stage) => stage.id === stageParam)) {
        setTeacherStage(stageParam as TeacherStageId);
      }
    } catch { /* Ignore URL parsing errors */ }
  }, [initialData.services]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-only favorites and owned services after server rendering.
    try { const stored: unknown = JSON.parse(localStorage.getItem("elgamal-favorites") ?? "[]"); if (Array.isArray(stored)) setFavorites(stored.filter((id): id is string => typeof id === "string")); } catch { /* Use session-only favorites if storage is unavailable. */ }
    try { const storedOwned: unknown = JSON.parse(localStorage.getItem("janzour-owned-services") ?? "[]"); if (Array.isArray(storedOwned)) setOwnedServiceIds(storedOwned.filter((id): id is string => typeof id === "string")); } catch { /* Ignore storage issues. */ }
    let disposed = false;
    const refresh = async () => { if (document.hidden) return; try { const response = await fetch("/api/services", { cache: "no-store" }); if (response.ok && !disposed) setData(await response.json()); } catch { /* Preserve the directory on temporary network failures. */ } };
    const timer = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  useEffect(() => {
    if (viewer.role === "guest" || data.previewMode) return;
    let disposed = false;
    (async () => {
      try { const response = await fetch("/api/follows", { cache: "no-store" }); if (response.ok && !disposed) { const state: FollowState = await response.json(); setFollowIds(state.followed); setFeedItems(state.feed); } } catch { /* Following stays unavailable until the connection returns. */ }
    })();
    return () => { disposed = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Load the member's follows once on mount.
  }, []);
  const feedServices = feedItems.flatMap((item) => { const service = services.find((entry) => entry.id === item.id); return service ? [{ service, createdAt: item.createdAt }] : []; });
  const completionAlerts = useMemo(
    () => services.filter((service) => service.completionStatus === "requested" || service.completionStatus === "rejected"),
    [services],
  );
  const providerAlerts = useMemo(
    () => (data.providerNotifications ?? []).map((notif) => ({
      notif,
      service: services.find((entry) => entry.id === notif.entityId),
    })),
    [data.providerNotifications, services],
  );
  const feedUnread =
    completionAlerts.length +
    providerAlerts.filter(({ notif }) => Date.parse(notif.createdAt) > feedSeen).length +
    feedServices.filter((item) => Date.parse(item.createdAt) > feedSeen).length;
  const isFollowed = Boolean(specialtyId && followIds.includes(specialtyId));
  function openFeed() { setFeedOpen(true); const stamp = Date.now(); setFeedSeen(stamp); try { localStorage.setItem("janzour-feed-seen", String(stamp)); } catch { /* The badge resets for this visit only. */ } }
  async function toggleFollow() {
    if (!specialtyId || followBusy) return;
    setFollowBusy(true);
    try {
      const response = await fetch("/api/follows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ categoryId: specialtyId }) });
      const result = await response.json();
      if (!response.ok) { setFollowError(result.error ?? "تعذر تنفيذ الطلب."); return; }
      setFollowIds((current) => result.following ? [...current, specialtyId] : current.filter((id) => id !== specialtyId));
      setFollowError("");
      if (result.following) openFeed();
    } catch { setFollowError("تعذر الاتصال. حاول مرة أخرى."); } finally { setFollowBusy(false); }
  }
  async function shareService(service: ServiceRecord) {
    trackDirectoryEvent({ kind: "share", label: service.name, serviceId: service.id, categoryId: service.category });
    const url = `${window.location.origin}/?service=${encodeURIComponent(service.id)}`;
    const text = `${service.name} - ${getCategory(service.category, categories).name}${service.area ? ` - ${service.area}` : ""}\nالهاتف: ${service.phone}\nمن دليل جنزور: ${url}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: service.name, text, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  function toggleFavorite(id: string) { setFavorites((current) => { const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]; try { localStorage.setItem("elgamal-favorites", JSON.stringify(next)); } catch { /* Favorites still work during this visit. */ } return next; }); }
  function scrollToProviders() { setTimeout(() => document.getElementById("providers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function showFavorites() { if (scoped) { window.location.assign("/?favorites=1"); return; } setView("favorites"); setRootFilter(""); setArea(""); setCustomAddress(""); setEmergency(false); setQuery(""); setQueryDraft(""); setMenuOpen(false); scrollToProviders(); }
  function search(event: FormEvent) {
    event.preventDefault();
    const trimmed = queryDraft.trim();
    if (trimmed) trackDirectoryEvent({ kind: "search", label: trimmed });
    setQuery(trimmed);
    setView("all");
    setFeaturedOpen(true);
    setSearchModalOpen(false);
    scrollToProviders();
  }
  function selectLocation(value: string, custom = "") { setArea(value); setCustomAddress(custom); setView("all"); setModal(null); scrollToProviders(); }
  function showEmergency() { setModal("emergency"); setMenuOpen(false); }
  function clearFilters() { setRootFilter(rootId ?? ""); setArea(""); setCustomAddress(""); setQuery(""); setQueryDraft(""); setEmergency(false); setDeliveryOnly(false); setTeacherStage("all"); setOpenTeacherStage(null); setTeacherSpecialtyFilter(specialtyId ?? ""); setClinicFilter("all"); setView("all"); }
  function toggleBigText() {
    const on = document.documentElement.classList.toggle("big-text");
    setBigText(on);
    try { localStorage.setItem("janzour-bigtext", on ? "1" : "0"); } catch { /* The toggle still works for this visit. */ }
  }
  function toggleTheme() {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("janzour-theme", dark ? "dark" : "light"); } catch { /* The toggle still works for this visit. */ }
  }
  async function submitRating() {
    if (!detail || !ratingStars || ratingBusy) return;
    setRatingBusy(true); setRatingMessage("");
    try {
      const response = await fetch("/api/ratings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serviceId: detail.id, stars: ratingStars, comment: ratingComment }) });
      const result = await response.json();
      setRatingMessage(response.ok ? result.message ?? "تم إرسال تقييمك." : result.error ?? "تعذر إرسال التقييم.");
      if (response.ok) setRatingComment("");
    } catch { setRatingMessage("تعذر الاتصال. حاول مرة أخرى."); } finally { setRatingBusy(false); }
  }
  async function logout() { setLogoutError(""); try { const response = await fetch("/api/auth", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/"); } catch { setLogoutError("تعذر تسجيل الخروج. حاول مرة أخرى."); } }
  async function requestServiceUpdate() { if (!detail) return; setUpdateMessage(""); const response = await fetch("/api/service-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serviceId: detail.id, phone: updatePhone, note: updateNote }) }); const result = await response.json(); setUpdateMessage(result.message ?? "تعذر إرسال الطلب."); if (response.ok) { setUpdatePhone(""); setUpdateNote(""); } }
  const activeSponsors = useMemo(
    () => parseSponsoredProviders(design.sponsoredProvidersJson).filter((item) => item.active),
    [design.sponsoredProvidersJson],
  );
  const activeSponsorMap = useMemo(
    () => new Map(activeSponsors.map((item) => [item.serviceId, item])),
    [activeSponsors],
  );
  const dailyOffers = useMemo(
    () => activeSponsors.filter((item) => item.dailyOfferTitle.trim().length > 0),
    [activeSponsors],
  );
  const isTeachersContext = Boolean(rootId === "teachers" || rootFilter === "teachers" || (specialty && specialty.parentId === "teachers"));
  const isShopsContext = Boolean(rootId === "shops" || rootFilter === "shops" || (specialty && specialty.parentId === "shops"));
  const isClinicsContext = Boolean(rootId === "clinics" || rootFilter === "clinics" || (specialty && specialty.parentId === "clinics"));
  const activeDeliveryOnly = isShopsContext && deliveryOnly;
  const activeClinicFilter: ClinicBookingFilter = isClinicsContext ? clinicFilter : "all";
  const activeSpecialtyId = isTeachersContext ? teacherSpecialtyFilter : (specialtyId ?? "");
  const teacherSpecialties = useMemo(
    () => categories.filter((category) => category.parentId === "teachers" && category.active),
    [categories],
  );
  const filteredServices = useMemo(() => services
    .filter((service) => {
      const item = getCategory(service.category, categories);
      return (!activeDeliveryOnly || supportsHomeDelivery(service))
        && (!isClinicsContext || activeClinicFilter === "all" || matchesClinicFilter(service, activeClinicFilter, now || undefined))
        && (!isTeachersContext || teacherStage === "all" || matchesTeacherStage(service, teacherStage))
        && (!activeSpecialtyId || service.category === activeSpecialtyId)
        && (!rootFilter || item.parentId === rootFilter)
        && (!query || matchesServiceQuery(service, item.name, query))
        && (!area || service.area === area)
        && (area !== OTHER_ADDRESS || !customAddress || normalizeSearch(service.address).includes(normalizeSearch(customAddress)))
        && (!emergency || service.emergency)
        && (view !== "favorites" || favorites.includes(service.id));
    })
    .sort((a, b) => {
      const aSponsor = activeSponsorMap.has(a.id) ? 1 : 0;
      const bSponsor = activeSponsorMap.has(b.id) ? 1 : 0;
      if (bSponsor !== aSponsor) return bSponsor - aSponsor;
      return 0;
    }), [services, categories, activeSpecialtyId, rootFilter, query, area, customAddress, emergency, view, favorites, activeDeliveryOnly, isClinicsContext, activeClinicFilter, now, isTeachersContext, teacherStage, activeSponsorMap]);
  const isFiltering = Boolean(activeDeliveryOnly || (isClinicsContext && activeClinicFilter !== "all") || (isTeachersContext && (teacherStage !== "all" || Boolean(teacherSpecialtyFilter))) || query || area || emergency || view === "favorites" || (!rootId && rootFilter));
  const isFeaturedCollapsible = !isFiltering && !specialty;
  const showProvidersList = !isFeaturedCollapsible || featuredOpen;
  const featured = filteredServices.filter((service) => service.featured || activeSponsorMap.has(service.id));
  const visibleServices = isFiltering || activeSpecialtyId ? filteredServices : (featured.length ? featured : filteredServices);
  const activeSpecialtyCategory = activeSpecialtyId ? getCategory(activeSpecialtyId, categories) : specialty;
  const providerTitle = view === "favorites" ? "خدماتك المفضلة" : emergency ? "خدمات الطوارئ" : activeDeliveryOnly && !specialty ? "محلات توفر التوصيل للمنازل بجنزور" : activeSpecialtyCategory ? `${rootId === "clinics" ? "أطباء" : "مقدمو خدمات"} ${activeSpecialtyCategory.name}` : isFiltering ? "نتائج البحث" : root ? `خدمات ${root.name} المميزة في جنزور` : "مقدمو الخدمات المميزين";
  const displayedCategories = root ? categories.filter((category) => category.parentId === root.id) : isTeachersContext ? teacherSpecialties : roots;
  const title = specialty ? `${specialty.name} بقرية جنزور` : root ? `${root.name} بقرية جنزور` : settings.siteName;
  function categoryCount(category: CategoryRecord) {
    if (category.parentId) {
      return services.filter((service) => service.category === category.id && (!isTeachersContext || teacherStage === "all" || matchesTeacherStage(service, teacherStage)) && (!isClinicsContext || activeClinicFilter === "all" || matchesClinicFilter(service, activeClinicFilter, now || undefined))).length;
    }
    return categories.filter((item) => item.parentId === category.id).length;
  }
  function teacherStageCount(stageId: TeacherStageId, specId = "") {
    return services.filter((service) => {
      const cat = getCategory(service.category, categories);
      if (cat.parentId !== "teachers") return false;
      if (specId && service.category !== specId) return false;
      return stageId === "all" || matchesTeacherStage(service, stageId);
    }).length;
  }

  const suggestions = query && filteredServices.length === 0 && view !== "favorites" ? suggestSpecialties(query, categories, services, rootId) : [];
  // Live autocomplete: matching specialties open their page, matching services jump straight to the results.
  const searchSuggestions = useMemo(() => {
    const term = normalizeSearch(queryDraft.trim());
    if (term.length < 2) return [];
    const specialties = categories.flatMap((category) => category.active && category.parentId && (!rootId || category.parentId === rootId) && normalizeSearch(`${category.name} ${getSpecialtyKeywords(category.id)}`).includes(term) ? [{ kind: "specialty" as const, id: category.id, label: category.name, hint: `تخصص • ${getCategory(category.parentId, categories).name}`, href: `/categories/${category.parentId}/${category.id}` }] : []);
    const services_ = services.filter((service) => matchesServiceQuery(service, getCategory(service.category, categories).name, queryDraft)).slice(0, 4)
      .map((service) => ({ kind: "service" as const, id: service.id, label: service.name, hint: getCategory(service.category, categories).name, href: "" }));
    return [...specialties, ...services_].slice(0, 6);
  }, [queryDraft, categories, services, rootId]);
  function chooseSearchSuggestion(item: (typeof searchSuggestions)[number]) {
    setSuggestOpen(false); setSuggestActive(-1);
    setSearchModalOpen(false);
    if (item.kind === "specialty") { window.location.assign(item.href); return; }
    setQueryDraft(item.label); setQuery(item.label); setView("all"); setFeaturedOpen(true); scrollToProviders();
  }
  function searchKeyDown(event: React.KeyboardEvent) {
    if (!searchSuggestions.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setSuggestOpen(true); setSuggestActive((current) => event.key === "ArrowDown" ? (current + 1) % searchSuggestions.length : (current - 1 + searchSuggestions.length) % searchSuggestions.length); }
    else if (event.key === "Escape") setSuggestOpen(false);
    else if (event.key === "Enter" && suggestOpen && suggestActive >= 0) { event.preventDefault(); chooseSearchSuggestion(searchSuggestions[suggestActive]); }
  }
  const contactArea = area === OTHER_ADDRESS ? customAddress : area;
  const neededServices = services.filter((service) => service.neededRank > 0).sort((a, b) => a.neededRank - b.neededRank || a.name.localeCompare(b.name, "ar")).slice(0, 8);
  const dutyShift = useMemo(() => getDutyShiftInfo(now > 0 ? new Date(now) : undefined), [now]);
  const dutyServices = useMemo(() => getOnDutyServices(services, categories, dutyFilter, now), [services, categories, dutyFilter, now]);
  const utilityNumbers = data.utilityNumbers && data.utilityNumbers.length > 0 ? data.utilityNumbers : publicUtilityNumbers;
  const isAdmin = viewer.role === "admin";
  async function copyUtilityNumber(id: string, number: string) {
    try { await navigator.clipboard.writeText(number); setCopiedUtilityId(id); window.setTimeout(() => setCopiedUtilityId(""), 1600); } catch { /* Clipboard permissions may be unavailable. */ }
  }
  async function persistUtilityNumbers(nextList: PublicUtilityContact[], successText: string) {
    setUtilityBusy(true); setUtilityMessage("");
    setData((prev) => ({ ...prev, utilityNumbers: nextList }));
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "utility-numbers", utilityNumbers: nextList }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "تعذر حفظ الأرقام.");
      }
      setUtilityMessage(successText);
      setEditingUtility(null);
    } catch (err) {
      setUtilityMessage(err instanceof Error ? err.message : "تم التحديث في الجلسة الحالية.");
      setEditingUtility(null);
    } finally {
      setUtilityBusy(false);
    }
  }
  function handleUtilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || !editingUtility) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const number = String(form.get("number") ?? "").trim();
    const category = String(form.get("category") ?? "").trim() || "مرافق وخدمات";
    const detailText = String(form.get("detail") ?? "").trim();
    const tone = (String(form.get("tone") ?? "blue") as PublicUtilityContact["tone"]);
    if (!name || !number) return;
    const isExisting = Boolean(editingUtility.id && utilityNumbers.some((item) => item.id === editingUtility.id));
    const entry: PublicUtilityContact = {
      id: editingUtility.id || `utility-${Date.now()}`,
      name,
      number,
      category,
      detail: detailText,
      tone,
    };
    const nextList = isExisting
      ? utilityNumbers.map((item) => (item.id === entry.id ? entry : item))
      : [...utilityNumbers, entry];
    void persistUtilityNumbers(nextList, isExisting ? "تم تعديل الرقم بنجاح." : "تمت إضافة الرقم بنجاح.");
  }
  function handleUtilityDelete(id: string) {
    if (!isAdmin) return;
    const nextList = utilityNumbers.filter((item) => item.id !== id);
    void persistUtilityNumbers(nextList, "تم حذف الرقم بنجاح.");
  }
  function handleProviderCompletionSubmitted(serviceId: string, updated: Partial<ServiceRecord>) {
    setData((prev) => ({
      ...prev,
      services: prev.services.map((item) => (item.id === serviceId ? { ...item, ...updated } : item)),
    }));
  }

  const sectionOrderList = (design.sectionOrder || defaultDesignSettings.sectionOrder)
    .split(",")
    .map((item) => item.trim());
  const sectionOrderIndex = (key: string, fallback: number) => {
    const idx = sectionOrderList.indexOf(key);
    return idx >= 0 ? idx + 1 : fallback;
  };
  const announcementList = useMemo(() => {
    const base = parseAnnouncementItems(design);
    const sponsorAds = activeSponsors
      .map((item) => item.tickerAdText.trim())
      .filter((text) => text.length > 0);
    return [...sponsorAds, ...base];
  }, [design, activeSponsors]);
  useEffect(() => {
    if (scoped || !design.sponsorModalEnabled) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("service")) return;
      if (sessionStorage.getItem("janzour-sponsor-modal-shown") === "1") return;
    } catch {
      /* Ignore storage/search issues */
    }
    let opened = false;
    const triggerModal = () => {
      if (opened) return;
      opened = true;
      try {
        sessionStorage.setItem("janzour-sponsor-modal-shown", "1");
      } catch {
        /* Ignore storage issues */
      }
      setSponsorModalAuto(true);
      setSponsorModalOpen(true);
    };
    const root = document.documentElement;
    if (root.getAttribute("data-splash-done") === "true" || root.classList.contains("skip-splash") || !design.splashEnabled) {
      const immediateTimer = window.setTimeout(triggerModal, 180);
      return () => window.clearTimeout(immediateTimer);
    }
    const onSplashDone = () => {
      window.setTimeout(triggerModal, 120);
    };
    window.addEventListener("janzour-splash-finished", onSplashDone);
    const fallbackTimer = window.setTimeout(triggerModal, 2200);
    return () => {
      window.removeEventListener("janzour-splash-finished", onSplashDone);
      window.clearTimeout(fallbackTimer);
    };
  }, [scoped, design.sponsorModalEnabled, design.splashEnabled]);
  const isRotatingTickerMode =
    design.announcementTickerMode === "rotate" ||
    design.announcementTickerMode === "vertical-slide" ||
    design.announcementTickerMode === "pulse-glow" ||
    design.announcementTickerMode === "bounce";
  useEffect(() => {
    if (!design.announcementEnabled || !isRotatingTickerMode || announcementList.length <= 1) return;
    const speedMap: Record<string, number> = {
      "very-slow": 9500,
      slow: 7000,
      normal: 4800,
      fast: 3000,
      turbo: 1900,
    };
    const ms = speedMap[design.announcementSpeed] ?? 4800;
    const timer = window.setInterval(() => {
      setTickerIndex((curr) => (curr + 1) % announcementList.length);
    }, ms);
    return () => window.clearInterval(timer);
  }, [design.announcementEnabled, isRotatingTickerMode, design.announcementSpeed, announcementList.length]);

  return <>
    <DesignApplicator design={design}/>
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="site-header-brand" aria-label="الرئيسية — دليل جنزور">
          {/* eslint-disable-next-line @next/next/no-img-element -- Brand header icon */}
          <img
            src={design.headerLogoUrl || "/images/logo-daleel-transparent.png"}
            alt=""
            className="site-header-brand-img"
          />
          <div className="site-header-brand-copy">
            <strong>دليل جنزور</strong>
            <span>المهن والخدمات</span>
          </div>
        </Link>
        <div className="header-actions">
          {viewer.role === "admin" ? (
            <Link href="/admin" className="header-auth-btn is-admin">
              <ShieldCheck size={16}/>
              <span>لوحة التحكم</span>
            </Link>
          ) : viewer.role === "moderator" ? (
            <Link href="/admin" className="header-auth-btn is-admin">
              <ShieldCheck size={16}/>
              <span>لوحة المشرف</span>
            </Link>
          ) : viewer.role === "member" ? (
            <Link href="/account" className="header-auth-btn is-member">
              <UserRound size={16}/>
              <span>حسابي ({viewer.name?.split(" ")[0]})</span>
            </Link>
          ) : design.showHeaderLoginBtn ? (
            <div className="header-auth-buttons-group">
              <Link href="/login" className="header-auth-btn is-login">
                <UserRound size={15}/>
                <span>تسجيل الدخول</span>
              </Link>
              <Link href="/register" className="header-auth-btn is-register">
                <UserPlus size={15}/>
                <span>إنشاء عضوية</span>
              </Link>
            </div>
          ) : null}
          {design.showHeaderDarkToggle && (
            <button type="button" className="theme-toggle" aria-label="تبديل الوضع الليلي والنهاري" title="وضع الليل والنهار" onClick={toggleTheme}>
              <span className="theme-toggle-track">
                <Moon className="icon-moon" size={15}/>
                <Sun className="icon-sun" size={15}/>
                <span className="theme-toggle-thumb" aria-hidden="true"/>
              </span>
            </button>
          )}
          <button
            type="button"
            className={`header-menu-toggle-btn mobile-menu-button ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19}/> : <Menu size={19}/>}
            <span className="header-menu-toggle-label">القائمة</span>
            {!menuOpen && feedUnread > 0 && <span className="header-menu-unread-dot" aria-hidden="true"/>}
          </button>
        </div>
        {menuOpen && (
          <div className="header-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true"/>
        )}
        <nav className={`main-nav header-dropdown-menu ${menuOpen ? "nav-open" : ""}`} aria-label="القائمة الرئيسية وأدوات الموقع">
          <div className="header-menu-section-title">التنقل السريع</div>
          <Link href="/" className={isHome && !isFiltering ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Search size={17}/>
            <span>الرئيسية</span>
          </Link>
          <a href={isHome ? "#categories" : "/#categories"} className={scoped ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Grid2X2 size={17}/>
            <span>أقسام وتصنيفات الدليل</span>
          </a>
          <button type="button" onClick={() => { setMenuOpen(false); setModal("service"); }}>
            <CirclePlus size={17}/>
            <span>أضف مهنتك للدليل</span>
          </button>
          <button
            type="button"
            className="menu-sponsor-item"
            onClick={() => {
              setMenuOpen(false);
              setSponsorModalAuto(false);
              setSponsorModalOpen(true);
            }}
          >
            <Crown size={17}/>
            <span>باقات الرعاية والتميز (١٠ أيام مجاناً)</span>
          </button>
          {design.showHeaderFavorites && (
            <button type="button" className={view === "favorites" ? "active" : ""} onClick={showFavorites}>
              <Heart size={17}/>
              <span>المفضلة</span>
              {favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}
            </button>
          )}
          <button type="button" onClick={() => { setMenuOpen(false); setModal("utilities"); }}>
            <PhoneCall size={17}/>
            <span>أرقام تهمك والطوارئ</span>
          </button>
          <button type="button" onClick={() => { setModal("contact"); setMenuOpen(false); }}>
            <MessageCircle size={17}/>
            <span>اتصل بنا</span>
          </button>
          <div className="header-menu-divider" role="separator"/>
          <div className="header-menu-section-title">الأدوات</div>
          {design.showHeaderBell && (
            <button type="button" onClick={() => { setMenuOpen(false); openFeed(); }}>
              <BellRing size={17}/>
              <span>إشعارات الأعضاء والمهنيين</span>
              {feedUnread > 0 && <span className="nav-count is-alert">{feedUnread > 99 ? "99+" : feedUnread}</span>}
            </button>
          )}
          <button type="button" aria-pressed={bigText} onClick={() => { toggleBigText(); }}>
            <ALargeSmall size={18}/>
            <span>حجم الخط الكبير</span>
            <span className={`nav-count ${bigText ? "is-on" : ""}`}>{bigText ? "مفعّل" : "عادي"}</span>
          </button>
          <div className="header-menu-member-badge" role="status">
            <UsersRound size={17}/>
            <span>عدد أعضاء الموقع</span>
            <span className="nav-count">{data.memberCount} عضو</span>
          </div>
          {viewer.role !== "guest" && (
            <button type="button" className="menu-logout-item" onClick={() => { setMenuOpen(false); void logout(); }}>
              <LogOut size={17}/>
              <span>تسجيل الخروج</span>
            </button>
          )}
        </nav>
      </div>
    </header>
    {data.previewMode && <div className="preview-mode-notice" role="status">وضع المعاينة: البيانات المعروضة توضيحية، ولن تُحفَظ الإضافات دون قاعدة بيانات.</div>}
    {logoutError && <div role="alert" className="form-error container">{logoutError}</div>}
    {(scoped || design.showHero) && <section className={`hero ${scoped ? "category-page-hero" : "hero-with-banner"}`} aria-labelledby="hero-title"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/><svg className="hero-skyline" viewBox="0 0 1440 210" preserveAspectRatio="none" aria-hidden="true"><path d="M0 210V105h43V81h32v50h29V64h32V22h8V0h6v22h10v42h29v83h27v-39h24V77h22v31h20v102h31V97h33v28h17V65h50v145h42v-65h22v-20h29v20h28v65h33V79h26V36h8V15h5v21h9v43h31v131h32v-86h22V98h38v26h24v86h31V73h49v35h29v102h45V94h31V62h40v148h29v-62h50v62h50V99h34V80h21v19h32v111h41V64h29V26h9V5h5v21h12v38h30v146h42V91h47v119h31V70h26V40h23v30h22v140h37v-63h52v63h34v-98h26V79h31v33h20v98Z"/></svg>{!scoped && <div className="hero-banner-wrap"><Image src="/images/home-banner-sky.png" alt="دليل المهن والخدمات بقرية جنزور، كل أرقام المهنيين والخدمات والمشاريع في مكان واحد" width={2048} height={768} sizes="(max-width: 700px) 100vw, (max-width: 1378px) 90vw, 1240px" priority/></div>}<div className="container hero-inner"><div className="hero-visual"><span className="hero-floating-tag"><CheckCircle2 size={16}/> من أهل القرية.. لأهل القرية</span></div><div className="hero-copy">{scoped ? <nav className="hero-breadcrumb" aria-label="مسار الصفحة"><Link href="/">الرئيسية</Link><ChevronLeft size={13}/>{specialty ? <><Link href={`/categories/${rootId}`}>{root?.name}</Link><ChevronLeft size={13}/><span>{specialty.name}</span></> : <span>{root?.name}</span>}</nav> : <div className="hero-eyebrow"><Sparkles size={15}/>{settings.heroEyebrow}</div>}<h1 id="hero-title">{title}</h1>{!scoped && <><p className="hero-subtitle">{settings.heroSubtitle}</p><p className="hero-tagline">{settings.tagline}</p></>}
    {!scoped && design.announcementEnabled && announcementList.length > 0 && (
      <div
        className={`site-announcement-ticker-card is-${design.announcementStyle} is-mode-${design.announcementTickerMode || "marquee"}`}
        style={{ "--ticker-bg": design.announcementBgColor } as CSSProperties}
      >
        <span className="ticker-badge-icon"><Sparkles size={15}/></span>
        {design.announcementTickerMode === "marquee" || design.announcementTickerMode === "marquee-reverse" ? (
          <div className={`site-announcement-marquee is-speed-${design.announcementSpeed || "normal"} ${design.announcementTickerMode === "marquee-reverse" ? "is-reverse" : ""}`} aria-label="شريط الأخبار والتنبيهات">
            <div className="site-announcement-marquee-track">
              {[...announcementList, ...announcementList].map((item, idx) => (
                <span key={`${idx}-${item}`} className="site-announcement-marquee-item">
                  {item}
                  <i aria-hidden="true">•</i>
                </span>
              ))}
            </div>
          </div>
        ) : isRotatingTickerMode && announcementList.length > 1 ? (
          <div className={`site-announcement-rotator is-anim-${design.announcementTickerMode}`}>
            <button
              type="button"
              className="announcement-nav-btn"
              onClick={() => setTickerIndex((curr) => (curr - 1 + announcementList.length) % announcementList.length)}
              aria-label="الخبر السابق"
            >
              <ChevronRight size={14}/>
            </button>
            <span className={`announcement-rotate-text is-anim-${design.announcementTickerMode}`} key={tickerIndex % announcementList.length}>
              {announcementList[tickerIndex % announcementList.length]}
            </span>
            <span className="announcement-rotate-counter">
              {(tickerIndex % announcementList.length) + 1}/{announcementList.length}
            </span>
            <button
              type="button"
              className="announcement-nav-btn"
              onClick={() => setTickerIndex((curr) => (curr + 1) % announcementList.length)}
              aria-label="الخبر التالي"
            >
              <ChevronLeft size={14}/>
            </button>
          </div>
        ) : (
          <span className="announcement-single-text">{design.announcementText || announcementList[0]}</span>
        )}
      </div>
    )}
    {!scoped && (
      <div className="hero-sponsor-fullwidth-wrap">
        <button
          type="button"
          className="button hero-sponsor-packages-btn is-ticker-width"
          onClick={() => {
            setSponsorModalAuto(false);
            setSponsorModalOpen(true);
          }}
        >
          <Crown size={20}/>
          <span>باقات الرعاية والتميز (١٠ أيام مجاناً)</span>
        </button>
      </div>
    )}
    </div></div></section>}
    <div className="container directory-layout"><aside className="directory-sidebar" aria-label="الخدمات السريعة" hidden><div className="quick-links-card"><h2>الخدمات السريعة <Sparkles size={17}/></h2>{settings.showEmergency && <button onClick={showEmergency}><span className="quick-icon quick-red"><Siren size={25}/></span>خدمات الطوارئ<ChevronLeft size={15}/></button>}<button onClick={() => setModal("location")}><span className="quick-icon quick-blue"><MapPinned size={24}/></span>ابحث حسب العنوان<ChevronLeft size={15}/></button><button className="add-service-quick-link" onClick={() => setModal("service")}><span className="quick-icon quick-green"><CirclePlus size={25}/></span>أضف مهنتك مجانًا<ChevronLeft size={15}/></button><button onClick={showFavorites}><span className="quick-icon quick-pink"><Heart size={25} fill="currentColor"/></span>المفضلة<ChevronLeft size={15}/></button></div><div className="community-card"><span><UsersRound size={28}/></span><strong>{data.memberCount}</strong><h2>عضو في مجتمع جنزور</h2><p>العضوية غير إضافة المهنة.. انضم وخليك واحد من أهل الدليل.</p><Link href={viewer.role === "guest" ? "/register" : viewer.role === "admin" ? "/admin?tab=members" : viewer.role === "moderator" ? "/admin" : "/account"} className="button button-soft">{viewer.role === "guest" ? "انضم للموقع" : viewer.role === "admin" ? "إدارة الأعضاء" : viewer.role === "moderator" ? "لوحة المشرف" : "حساب عضويتك"}<ArrowLeft size={15}/></Link></div><div className="verified-card"><ShieldCheck size={47}/><div><strong>النشر بعد المراجعة</strong><span><CheckCircle2 size={14}/> الإدارة بتراجع كل طلب</span></div></div></aside>
    <main className="directory-main directory-ordered-main">
      {!scoped && design.showSponsorsRibbon !== false && activeSponsors.length > 0 && (
        <section
          className="certified-sponsors-ribbon-card"
          aria-label="رعاة الدليل المعتمدون بقرية جنزور"
          style={{ order: -1 }}
        >
          <div className="sponsors-ribbon-top-legend">
            <Crown size={16}/>
            <strong>رعاة الدليل المعتمدون 👑</strong>
          </div>

          <div className="sponsors-ribbon-centered-join-wrap">
            <button
              type="button"
              className="sponsors-ribbon-join-link"
              onClick={() => {
                setSponsorModalAuto(false);
                setSponsorModalOpen(true);
              }}
            >
              <Gift size={15}/>
              <span>انضم ( ١٠ أيام مجاناً )</span>
            </button>
          </div>

          <div className="sponsors-ribbon-track" role="list">
            {activeSponsors.map((sp, idx) => {
              const matchedService = services.find((srv) => srv.id === sp.serviceId);
              const group = getSponsorOfferCategoryGroup(sp, services, categories);
              const IconComp = group === "clinics" ? Stethoscope : group === "labs" ? FlaskConical : Store;

              return (
                <button
                  key={`ribbon-${sp.serviceId}-${idx}`}
                  type="button"
                  role="listitem"
                  className={`sponsor-ribbon-pill is-group-${group}`}
                  onClick={() => {
                    if (matchedService) {
                      openDetail(matchedService);
                    } else {
                      setSponsorModalAuto(false);
                      setSponsorModalOpen(true);
                    }
                  }}
                >
                  <span className="sponsor-ribbon-pill-icon">
                    <IconComp size={18}/>
                  </span>
                  <div className="sponsor-ribbon-pill-copy">
                    <strong>{sp.providerName}</strong>
                    <small>{sp.categoryName}</small>
                  </div>
                  {sp.dailyOfferDiscount && (
                    <span className="sponsor-ribbon-pill-tag">{sp.dailyOfferDiscount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
      {!scoped && design.showDailyOffersSection && dailyOffers.length > 0 && (
        <section
          id="daily-offers"
          className={`daily-offers-section ${dailyOffersOpen ? "is-open" : "is-folded"}`}
          aria-labelledby="daily-offers-heading"
          style={{ order: 0 }}
        >
          <div className="daily-offers-centered-head">
            <h2 id="daily-offers-heading" className="daily-offers-line1">
              <Flame size={22}/>
              <span>عروض اليوم في جنزور</span>
            </h2>
            <div className="daily-offers-line2">( للعيادات والمعامل والمحلات )</div>
            <p className="daily-offers-line3">
              خصومات وعروض حصرية وخدمات فورية لأهالي قرية جنزور من رعاة الدليل المعتمدين
            </p>
            <button
              type="button"
              className="button button-amber daily-offers-join-centered-btn"
              onClick={() => {
                setSponsorModalAuto(false);
                setSponsorModalOpen(true);
              }}
            >
              <Gift size={17}/>
              <span>أضف عرضك (١٠ أيام مجاناً)</span>
            </button>
            <button
              type="button"
              className={`daily-offers-double-arrow-btn ${dailyOffersOpen ? "is-open" : ""}`}
              aria-expanded={dailyOffersOpen}
              aria-label={dailyOffersOpen ? "طي عروض اليوم" : "فرد وعرض عروض اليوم"}
              onClick={() => setDailyOffersOpen((open) => !open)}
            >
              {dailyOffersOpen ? <ChevronsUp size={22}/> : <ChevronsDown size={22}/>}
            </button>
          </div>

          {dailyOffersOpen && (
            <div className="daily-offers-collapsible-body">
              <div className="daily-offers-filter-grid" role="tablist" aria-label="فلترة عروض اليوم حسب القسم">
                {(
                  [
                    { id: "clinics" as DailyOfferFilterGroup, label: "🩺 عروض العيادات", spanFull: false },
                    { id: "labs" as DailyOfferFilterGroup, label: "🧪 عروض المعامل", spanFull: false },
                    { id: "shops" as DailyOfferFilterGroup, label: "🛒 عروض المحلات والمطاعم", spanFull: true },
                  ] as const
                ).map((tabItem) => {
                  const count = dailyOffers.filter(
                    (item) => getSponsorOfferCategoryGroup(item, services, categories) === tabItem.id,
                  ).length;
                  const isSelected = dailyOfferFilter === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`daily-offer-filter-chip ${tabItem.spanFull ? "is-full-row" : "is-half-row"} ${isSelected ? "is-active" : ""}`}
                      onClick={() => setDailyOfferFilter((curr) => (curr === tabItem.id ? "all" : tabItem.id))}
                    >
                      <span>{tabItem.label}</span>
                      <b className="daily-offer-filter-count">{count}</b>
                    </button>
                  );
                })}
              </div>

              <div className="daily-offers-grid">
                {dailyOffers
                  .filter(
                    (offer) =>
                      dailyOfferFilter === "all" ||
                      getSponsorOfferCategoryGroup(offer, services, categories) === dailyOfferFilter,
                  )
                  .map((offer, idx) => {
                  const matchedService = services.find((srv) => srv.id === offer.serviceId);
                  const contactPhone = (offer.phone || matchedService?.phone || matchedService?.phoneSecondary || settings.phone).trim();
                  const orderMsg = `مرحبًا (${offer.providerName})، شاهدت عرضكم (${offer.dailyOfferDiscount}: ${offer.dailyOfferTitle}) على دليل قرية جنزور وأود الاستفسار أو الحجز.`;

                  return (
                    <article key={`${offer.serviceId}-${idx}`} className="daily-offer-card">
                      <div className="daily-offer-top">
                        <span className="daily-offer-crown-badge">
                          <Crown size={14}/> {offer.badgeLabel || "راعي معتمد 👑"}
                        </span>
                        <span className="daily-offer-discount-pill">
                          {offer.dailyOfferDiscount || "عرض اليوم 🔥"}
                        </span>
                      </div>

                      <h3 className="daily-offer-provider">{offer.providerName}</h3>
                      <span className="daily-offer-category">{offer.categoryName}</span>
                      <p className="daily-offer-description">{offer.dailyOfferTitle}</p>

                      <div className="daily-offer-actions">
                        <a
                          href={whatsappUrl(contactPhone, orderMsg)}
                          target="_blank"
                          rel="noreferrer"
                          className="daily-offer-wa-btn"
                        >
                          <MessageCircle size={17}/>
                          <span>اطلب العرض عبر واتساب</span>
                        </a>
                        {matchedService ? (
                          <button
                            type="button"
                            className="daily-offer-view-btn"
                            onClick={() => openDetail(matchedService)}
                          >
                            <span>فتح الصفحة</span>
                          </button>
                        ) : (
                          <a href={`tel:${contactPhone}`} className="daily-offer-view-btn">
                            <Phone size={15}/>
                            <span>اتصال</span>
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
      {isTeachersContext && (
        <section id="teacher-stages" className="categories-section teacher-stages-section" style={scoped ? { order: 1 } : { order: sectionOrderIndex("categories", 3) - 1 }}>
          <div className="section-heading directory-section-heading">
            <div>
              <h2><GraduationCap size={23}/> المراحل الدراسية للمدرسين</h2>
              <p>اضغط على المرحلة الدراسية لتنسدل وتظهر تحتها جميع تخصصات ومواد المدرسين</p>
            </div>
            <span className="section-count">{TEACHER_STAGES.length} مراحل دراسية</span>
          </div>
          <div className="teacher-stages-accordion" role="region" aria-label="المراحل الدراسية وتخصصاتها">
            {([{ id: "all" as TeacherStageId, label: "كل المراحل الدراسية" }, ...TEACHER_STAGES]).map((stage) => {
              const isOpen = openTeacherStage === stage.id;
              const isSelectedStage = teacherStage === stage.id;
              return (
                <div key={stage.id} className={`teacher-stage-dropdown-card ${isOpen ? "is-open" : ""} ${isSelectedStage ? "is-selected" : ""}`}>
                  <button
                    type="button"
                    className="teacher-stage-dropdown-header"
                    aria-expanded={isOpen}
                    onClick={() => {
                      const nextOpen = isOpen ? null : stage.id;
                      setOpenTeacherStage(nextOpen);
                      setTeacherStage(stage.id);
                      setFeaturedOpen(true);
                    }}
                  >
                    <span className="teacher-stage-dropdown-icon"><GraduationCap size={24}/></span>
                    <div className="teacher-stage-dropdown-copy">
                      <strong>{stage.label}</strong>
                      <span>{isOpen ? "اختر التخصص أو المادة الدراسية من الأسفل" : "اضغط لفتح التخصصات والمواد الدراسية لهذه المرحلة"}</span>
                    </div>
                    <span className="teacher-stage-dropdown-count">{teacherStageCount(stage.id)} مدرس</span>
                    <ChevronDown size={18} className={`teacher-stage-dropdown-chevron ${isOpen ? "is-rotated" : ""}`}/>
                  </button>
                  {isOpen && (
                    <div className="teacher-stage-dropdown-body">
                      <div className="category-grid specialties-grid teacher-stage-specialties-grid">
                        <button
                          type="button"
                          className={`category-tile teacher-specialty-choice ${!activeSpecialtyId ? "category-selected is-active" : ""}`}
                          style={{ "--category-color": "#9160df", "--category-light": "#9160df14" } as CSSProperties}
                          onClick={() => {
                            setTeacherStage(stage.id);
                            setTeacherSpecialtyFilter("");
                            setFeaturedOpen(true);
                            scrollToProviders();
                          }}
                        >
                          <span className="category-icon"><GraduationCap size={30}/></span>
                          <strong>كل تخصصات {stage.id === "all" ? "المدرسين" : stage.label}</strong>
                          <span className="category-meta">{teacherStageCount(stage.id)} مدرس<ChevronLeft size={12}/></span>
                        </button>
                        {teacherSpecialties.map((spec) => {
                          const isSpecSelected = activeSpecialtyId === spec.id && teacherStage === stage.id;
                          return (
                            <button
                              key={`${stage.id}-${spec.id}`}
                              type="button"
                              className={`category-tile teacher-specialty-choice ${isSpecSelected ? "category-selected is-active" : ""}`}
                              style={{ "--category-color": spec.color, "--category-light": spec.light } as CSSProperties}
                              onClick={() => {
                                setTeacherStage(stage.id);
                                setTeacherSpecialtyFilter(spec.id);
                                setFeaturedOpen(true);
                                scrollToProviders();
                              }}
                            >
                              <span className="category-icon"><CategoryIcon icon={spec.icon} size={32}/></span>
                              <strong>{spec.name}</strong>
                              <span className="category-meta">{teacherStageCount(stage.id, spec.id)} مدرس<ChevronLeft size={12}/></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {isShopsContext && (
        <div className="shops-delivery-filter-bar" role="region" aria-label="فلتر التوصيل للمنازل في قسم المحلات" style={scoped ? { order: 1 } : undefined}>
          <div className="shops-delivery-filter-copy">
            <span className="shops-delivery-icon"><Truck size={18}/></span>
            <div>
              <strong>خدمة التوصيل للمنازل (دليفري جنزور)</strong>
              <span>اعرض فقط المحلات والصيدليات والمطاعم التي توفر توصيل للطلبات</span>
            </div>
          </div>
          <button
            type="button"
            className={`button button-small shops-delivery-toggle-btn ${deliveryOnly ? "is-active" : ""}`}
            aria-pressed={deliveryOnly}
            onClick={() => {
              const next = !deliveryOnly;
              setDeliveryOnly(next);
              if (next) setFeaturedOpen(true);
            }}
          >
            <Truck size={16}/>
            <span>{deliveryOnly ? "معروض محلات التوصيل فقط ✓" : "🛵 يوفر توصيل للمنزل"}</span>
          </button>
        </div>
      )}
      {isClinicsContext && (
        <div className="clinics-booking-filter-bar" role="region" aria-label="فلتر نظام الكشف وأيام التواجد في قسم العيادات" style={scoped ? { order: 1 } : undefined}>
          <div className="clinics-booking-filter-copy">
            <span className="clinics-booking-icon"><Stethoscope size={19}/></span>
            <div>
              <strong>نظام الكشف ومواعيد تواجد الأطباء في جنزور</strong>
              <span>فلتر الأطباء حسب طريقة الحجز (حجز مسبق أو بأسبقية الحضور) أو المتواجدين اليوم</span>
            </div>
          </div>
          <div className="clinics-booking-chips" role="tablist" aria-label="فلترة العيادات والأطباء">
            {([
              { id: "all" as ClinicBookingFilter, label: "كل الأطباء" },
              { id: "appointment" as ClinicBookingFilter, label: "📅 بحجز مسبق" },
              { id: "walk-in" as ClinicBookingFilter, label: "🚶 بأسبقية الحضور" },
              { id: "open-today" as ClinicBookingFilter, label: "✅ متواجد اليوم" },
            ]).map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={clinicFilter === option.id}
                className={`clinic-booking-chip ${clinicFilter === option.id ? "is-active" : ""}`}
                onClick={() => {
                  setClinicFilter(option.id);
                  if (option.id !== "all") setFeaturedOpen(true);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {(isTeachersContext || specialty) && (
        <div
          className="categories-top-action-frame"
          role="region"
          aria-label="البحث السريع وإضافة مهنة"
          style={scoped ? { order: 0 } : { order: sectionOrderIndex("categories", 3) - 1 }}
        >
          <button
            type="button"
            className="search-icon-only-trigger-btn"
            aria-label="فتح نافذة البحث في الدليل"
            title="بحث في الدليل"
            onClick={() => {
              setSearchModalOpen(true);
              setTimeout(() => {
                document.getElementById("hero-search-input")?.focus();
              }, 60);
            }}
          >
            <Search size={21}/>
          </button>
          <button
            type="button"
            className="button button-success compact-add-service-btn"
            onClick={() => setModal("service")}
          >
            <CirclePlus size={15}/>
            <span>أضف مهنتك</span>
          </button>
        </div>
      )}
      {!isTeachersContext && !specialty && (scoped || design.showCategoriesSection) && (
        <section
          id="categories"
          className="categories-section"
          style={scoped ? { order: 2 } : { order: sectionOrderIndex("categories", 3) }}
        >
          <div className="categories-top-action-frame" role="region" aria-label="البحث السريع وإضافة مهنة">
            <button
              type="button"
              className="search-icon-only-trigger-btn"
              aria-label="فتح نافذة البحث في الدليل"
              title="بحث في الدليل"
              onClick={() => {
                setSearchModalOpen(true);
                setTimeout(() => {
                  document.getElementById("hero-search-input")?.focus();
                }, 60);
              }}
            >
              <Search size={21}/>
            </button>
            <button
              type="button"
              className="button button-success compact-add-service-btn"
              onClick={() => setModal("service")}
            >
              <CirclePlus size={15}/>
              <span>أضف مهنتك</span>
            </button>
          </div>
          <div className="section-heading directory-section-heading">
            <div>
              <h2><Grid2X2 size={23}/>{root ? `تخصصات ${root.name}` : "تصفح أقسام القرية"}</h2>
            </div>
            <span className="section-count">{displayedCategories.length} {root ? "تخصص" : "أقسام رئيسية"}</span>
          </div>
          <div className={`category-grid ${root ? "specialties-grid" : "main-category-grid"}`}>
            {displayedCategories.map((category) => {
              const href = category.parentId ? `/categories/${category.parentId}/${category.id}` : `/categories/${category.id}`;
              return (
                <Link
                  key={category.id}
                  href={href}
                  aria-label={category.name}
                  className="category-tile"
                  style={{ "--category-color": category.color, "--category-light": category.light } as CSSProperties}
                >
                  <span className="category-icon">{category.parentId ? <CategoryIcon icon={category.icon} size={35}/> : <MainCategoryIcon icon={category.icon}/>}</span>
                  <strong>{category.name}</strong>
                  <span className="category-meta">{categoryCount(category)} {category.parentId ? "مقدم خدمة" : "تخصص"}<ChevronLeft size={12}/></span>
                </Link>
              );
            })}
          </div>
          {!displayedCategories.length && <div className="empty-state"><h3>التخصصات قيد التجهيز</h3><p>الإدارة هتضيف تخصصات القسم قريبًا.</p></div>}
        </section>
      )}
      {(scoped || isFiltering || design.showFeaturedSection) && <section id="providers" className={`providers-section ${specialty ? "specialty-providers" : ""}`} style={scoped ? { order: 3 } : { order: sectionOrderIndex("featured", 2) }}>{isFeaturedCollapsible ? (
        <div
          className={`category-tile featured-providers-banner-card ${featuredOpen ? "is-open" : ""}`}
          style={{ "--category-color": "#078cf0", "--category-light": "#078cf012" } as CSSProperties}
        >
          <div className="featured-banner-right">
            <button
              type="button"
              className={`featured-banner-main-btn ${featuredOpen ? "is-open" : ""}`}
              aria-expanded={featuredOpen}
              onClick={() => setFeaturedOpen((open) => !open)}
            >
              <h2 className="featured-framed-heading"><Crown size={20}/><span>{providerTitle}</span></h2>
              <p className="featured-banner-subtitle">نخبة من المهنيين والخدمات المميزة في قرية جنزور</p>
              <span className="featured-banner-status">
                <span>{featuredOpen ? "إخفاء المميزين" : "اضغط لعرض المميزين"}</span>
                <ChevronDown size={18} className={featuredOpen ? "is-rotated" : ""}/>
              </span>
            </button>
            {isShopsContext && (
              <div className="featured-banner-actions">
                <button
                  type="button"
                  className={`availability-toggle delivery-filter-toggle ${deliveryOnly ? "is-on" : ""}`}
                  aria-pressed={deliveryOnly}
                  onClick={() => {
                    const next = !deliveryOnly;
                    setDeliveryOnly(next);
                    if (next) setFeaturedOpen(true);
                  }}
                >
                  <Truck size={15} aria-hidden="true"/>
                  <span>يوجد توصيل</span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="featured-banner-icon-btn"
            aria-label={providerTitle}
            onClick={() => setFeaturedOpen((open) => !open)}
          >
            <span className="category-icon featured-3d-icon"><MainCategoryIcon icon="featured"/></span>
          </button>
        </div>
      ) : (
        <div className="section-heading directory-section-heading"><div><h2>{view === "favorites" ? <Heart size={22} className="pink-icon"/> : emergency ? <Siren size={24} className="red-icon"/> : activeSpecialtyCategory ? <UsersRound size={23}/> : <Crown size={23} className="crown-icon"/>}{providerTitle}</h2>{(isFiltering || activeSpecialtyCategory) && <p>{filteredServices.length} مقدم خدمة متاح في الدليل</p>}</div><div className="section-heading-actions">{specialty && viewer.role !== "guest" && <button type="button" className={`follow-toggle ${isFollowed ? "is-on" : ""}`} aria-pressed={isFollowed} disabled={followBusy} onClick={() => void toggleFollow()}><BellRing size={15}/><span>{isFollowed ? "إلغاء المتابعة" : "متابعة التخصص"}</span></button>}{specialty && viewer.role !== "guest" && followError && <small className="follow-error" role="alert">{followError}</small>}{isShopsContext && <button type="button" className={`availability-toggle delivery-filter-toggle ${deliveryOnly ? "is-on" : ""}`} aria-pressed={deliveryOnly} onClick={() => setDeliveryOnly(!deliveryOnly)}><Truck size={15} aria-hidden="true"/><span>يوجد توصيل</span></button>}</div></div>
      )}
      {isFiltering && <div className="filter-tags">{view === "favorites" && <span><Heart size={13}/>المفضلة</span>}{query && <span>{query}<button onClick={() => { setQuery(""); setQueryDraft(""); }} aria-label="إزالة كلمة البحث"><X size={12}/></button></span>}{!scoped && rootFilter && <span>{getCategory(rootFilter, categories).name}</span>}{area && <span><MapPin size={12}/>{area === OTHER_ADDRESS ? customAddress || OTHER_ADDRESS : area}<button onClick={() => { setArea(""); setCustomAddress(""); }} aria-label="إزالة العنوان"><X size={12}/></button></span>}{emergency && <span className="emergency-filter">خدمات الطوارئ</span>}{activeDeliveryOnly && <span className="delivery-filter-tag"><Truck size={13}/>يوجد توصيل للمنازل<button onClick={() => setDeliveryOnly(false)} aria-label="إزالة فلتر التوصيل"><X size={12}/></button></span>}{isClinicsContext && activeClinicFilter !== "all" && <span className="clinic-filter-tag"><Stethoscope size={13}/>{activeClinicFilter === "appointment" ? "بحجز مسبق" : activeClinicFilter === "walk-in" ? "بأسبقية الحضور" : "متواجد اليوم"}<button onClick={() => setClinicFilter("all")} aria-label="إزالة فلتر العيادة"><X size={12}/></button></span>}{isTeachersContext && teacherStage !== "all" && <span className="stage-filter-tag"><GraduationCap size={13}/>{TEACHER_STAGES.find((s) => s.id === teacherStage)?.label}<button onClick={() => setTeacherStage("all")} aria-label="إزالة فلتر المرحلة"><X size={12}/></button></span>}{isTeachersContext && teacherSpecialtyFilter && !specialtyId && <span className="stage-filter-tag"><GraduationCap size={13}/>{getCategory(teacherSpecialtyFilter, categories).name}<button onClick={() => setTeacherSpecialtyFilter("")} aria-label="إزالة فلتر التخصص"><X size={12}/></button></span>}<button className="clear-filters" onClick={clearFilters}>مسح الفلاتر</button></div>}{showProvidersList && (visibleServices.length ? <div className="provider-grid">{visibleServices.map((service) => <ProviderCard key={service.id} service={service} category={getCategory(service.category, categories)} favorite={favorites.includes(service.id)} now={now} showAdminQuickEdit={Boolean(isAdmin && design.showAdminQuickEdit)} sponsorInfo={activeSponsorMap.get(service.id)} onOpen={openDetail} onOpenCompletion={(item) => setCompletionService(item)} onShare={(item) => void shareService(item)} onToggleFavorite={toggleFavorite}/>)}</div> : <div className="empty-state"><span><SearchX size={36}/></span><h3>{view === "favorites" ? "مفضلتك لسه فاضية" : "لسه مفيش خدمات مطابقة"}</h3><p>{view === "favorites" ? "اضغط على القلب بجانب أي خدمة عشان ترجع لها بسهولة." : "كن أول مقدم خدمة هنا.. أضف بياناتك والإدارة هتراجعها قبل النشر."}</p><button className="button button-soft" onClick={view === "favorites" ? clearFilters : () => setModal("service")}>{view === "favorites" ? "تصفح الخدمات" : "أضف مهنتك مجانًا"}<ArrowLeft size={16}/></button></div>)}{showProvidersList && visibleServices.some((service) => service.demo) && <p className="demo-note"><span/> بعض البطاقات نماذج توضيحية، وليست بيانات مقدمي خدمة حقيقيين. المهن الجديدة تُنشر بعد الموافقة.</p>}</section>}
      {(scoped || design.showFeatureCards) && <section className="feature-cards-section" aria-label="الخدمات الحيوية والسريعة" style={scoped ? { order: 4 } : { order: sectionOrderIndex("features", 1) }}>
        <div className="category-grid main-category-grid feature-cards-grid">
          <button
            type="button"
            id="on-duty-section"
            className="category-tile feature-card-tile"
            style={{ "--category-color": "#22b96d", "--category-light": "#22b96d12" } as CSSProperties}
            onClick={() => setModal("duty")}
          >
            <span className="category-icon"><MainCategoryIcon icon="duty"/></span>
            <strong className="feature-card-title">
              <span>الصيدلية والعيادة</span>
              <span>المناوبة الآن</span>
            </strong>
          </button>

          <button
            type="button"
            id="public-utilities"
            className="category-tile feature-card-tile"
            style={{ "--category-color": "#078cf0", "--category-light": "#078cf012" } as CSSProperties}
            onClick={() => { setUtilityMessage(""); setEditingUtility(null); setModal("utilities"); }}
          >
            <span className="category-icon"><MainCategoryIcon icon="utilities"/></span>
            <strong className="feature-card-title">
              <span>أرقام تهمك</span>
              <span>في جنزور</span>
            </strong>
          </button>

          <button
            type="button"
            id="quick-services"
            className="category-tile feature-card-tile"
            style={{ "--category-color": "#ff941f", "--category-light": "#ff941f12" } as CSSProperties}
            onClick={() => setModal("quick")}
          >
            <span className="category-icon"><MainCategoryIcon icon="quick"/></span>
            <strong className="feature-card-title">
              <span>الخدمات</span>
              <span>السريعة</span>
            </strong>
          </button>
        </div>
      </section>}
      {!scoped && design.showTransitGuide && (
        <section id="transit-guide" className="transit-guide-section" aria-labelledby="transit-guide-title" style={{ order: sectionOrderIndex("transit", 4) }}>
          <div className="section-heading directory-section-heading">
            <div>
              <h2 id="transit-guide-title"><Bus size={22}/> دليل مواصلات وخطوط سير جنزور</h2>
              <p>مواقف وخطوط المواصلات اليومية من قرية جنزور وإليها مع وصول سريع لسائقي التوصيل</p>
            </div>
            <Link href="/categories/other-services/transport" className="button button-soft button-small">
              <span>سائقو التوصيل بجنزور</span>
              <ChevronLeft size={14}/>
            </Link>
          </div>
          <div className="transit-routes-grid">
            {ganzourTransitRoutes.map((route) => (
              <article key={route.id} className={`transit-route-card is-${route.tone}`}>
                <div className="transit-route-head">
                  <span className="transit-route-icon"><Bus size={18}/></span>
                  <div>
                    <h3>{route.title}</h3>
                    <span className="transit-route-badge">{route.vehicleType}</span>
                  </div>
                </div>
                <p className="transit-route-notes">{route.notes}</p>
                <div className="transit-route-meta">
                  <span><MapPin size={13}/> <strong>الموقف:</strong> {route.station}</span>
                  <span><Clock size={13}/> <strong>المواعيد:</strong> {route.schedule}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {settings.showEmergency && <section className="emergency-strip" aria-labelledby="emergency-strip-title" style={!scoped ? { order: sectionOrderIndex("professionBanner", 5) } : undefined}><span className="emergency-strip-icon"><Siren size={24}/></span><div className="emergency-strip-copy"><h2 id="emergency-strip-title">الخدمات والطوارئ</h2><p>لأن بعض المواقف.. ما تستحملش انتظار</p></div><button type="button" className="emergency-strip-button" onClick={showEmergency}><PhoneCall size={16}/>عرض الأرقام</button></section>}
    </main></div>
    <footer className="site-footer"><div className="container footer-main"><div className="footer-brand-group">{(viewer.role === "admin" || viewer.role === "moderator") && <Link href="/admin" className="footer-admin-link"><ShieldCheck size={14}/><span>{viewer.role === "moderator" ? "لوحة المشرف" : "لوحة التحكم"}</span></Link>}<div className="footer-brand-lockup"><div className="footer-brand-copy"><strong>جنزور في مكان واحد</strong><span>{design.footerDescription || "دليل المهن والخدمات.. من أهل القرية لأهلها"}</span></div></div></div>{design.showFooterStats && <div className="footer-stats-strip" aria-label="إحصائيات دليل جنزور"><span><strong>+{services.length}</strong> خدمة ومهنة</span><span><strong>{roots.length}</strong> أقسام رئيسية</span><span><strong>{data.areas.length}</strong> مناطق في جنزور</span></div>}<nav aria-label="روابط تذييل الصفحة"><Link href="/"><Search size={15}/> الرئيسية</Link><Link href="/#categories"><Grid2X2 size={15}/> التصنيفات</Link>{design.showHeaderFavorites && <button onClick={showFavorites}><Heart size={15}/> المفضلة</button>}<button onClick={() => setModal("contact")}><MessageCircle size={15}/> اتصل بنا</button>{design.footerFacebookUrl && <a href={design.footerFacebookUrl} target="_blank" rel="noopener noreferrer">صفحة فيسبوك</a>}{design.footerWhatsappGroupUrl && <a href={design.footerWhatsappGroupUrl} target="_blank" rel="noopener noreferrer">جروب واتساب جنزور</a>}</nav><p className="footer-copyright">{settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</p>{design.showFooterWhatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="التواصل مع الإدارة عبر واتساب" className="footer-whatsapp"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.52 0 .19 5.34.19 11.9c0 2.1.55 4.14 1.59 5.95L.08 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.45-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.03-1.37l-.36-.22-3.74.98.99-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg></span><div><small>التواصل مع الإدارة</small><strong dir="ltr">{settings.phone}</strong></div></a>}</div></footer>
    {design.floatingWhatsappEnabled && (
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="floating-quick-whatsapp" aria-label="تواصل سريع مع الإدارة عبر واتساب">
        <MessageCircle size={20}/>
        <span>واتساب الإدارة</span>
      </a>
    )}
    {suggestions.length > 0 && <section className="container search-assistance" aria-label="مساعدة البحث"><div className="specialty-suggestions"><h3>ملقيناش نتيجة مطابقة. جرّب التخصصات دي</h3><p>فتح التخصص يعرض كل خدماته بدون فلاتر البحث الحالية.</p>{suggestions.map((item) => <Link className="button button-soft" key={item.id} href={`/categories/${item.parentId}/${item.id}`}>{item.name}</Link>)}</div></section>}
    {modal === "duty" && (
      <Modal floating wide title={dutyShift.title} subtitle={dutyShift.subtitle} onClose={closeModal}>
        <div className="duty-modal-content">
          <div className="duty-modal-head">
            <span className={`duty-shift-badge is-${dutyShift.mode}`}><Stethoscope size={15}/>{dutyShift.badge}</span>
            <div className="duty-filter-tabs" role="tablist" aria-label="فلترة المناوبات والطوارئ">
              <button type="button" role="tab" aria-selected={dutyFilter === "all"} className={dutyFilter === "all" ? "is-active" : ""} onClick={() => setDutyFilter("all")}><Grid2X2 size={14}/>الكل</button>
              <button type="button" role="tab" aria-selected={dutyFilter === "pharmacies"} className={dutyFilter === "pharmacies" ? "is-active" : ""} onClick={() => setDutyFilter("pharmacies")}><Pill size={14}/>الصيدليات</button>
              <button type="button" role="tab" aria-selected={dutyFilter === "clinics"} className={dutyFilter === "clinics" ? "is-active" : ""} onClick={() => setDutyFilter("clinics")}><Stethoscope size={14}/>العيادات والمعامل</button>
              <button type="button" role="tab" aria-selected={dutyFilter === "emergency"} className={dutyFilter === "emergency" ? "is-active" : ""} onClick={() => setDutyFilter("emergency")}><Siren size={14}/>طوارئ ومتاح الآن</button>
            </div>
          </div>
          {dutyServices.length > 0 ? (
            <div className="duty-grid">
              {dutyServices.map((service) => {
                const cat = getCategory(service.category, categories);
                const liveNow = now > 0 && isAvailableNow(service, now);
                return (
                  <article key={service.id} className="duty-card" onClick={() => { closeModal(); openDetail(service); }} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); closeModal(); openDetail(service); } }}>
                    <div className="duty-card-top">
                      <span className="duty-card-icon" style={categoryTheme(cat)}><CategoryIcon icon={cat.icon} size={20}/></span>
                      <div className="duty-card-copy">
                        <h3>{service.name}</h3>
                        <span>{cat.name} • {service.address || service.area}</span>
                      </div>
                      <span className={`duty-status-pill ${liveNow ? "is-live" : "is-emergency"}`}>{liveNow ? "متاح الآن" : service.emergency ? "طوارئ" : "مناوبة"}</span>
                    </div>
                    <div className="duty-card-actions" onClick={(event) => event.stopPropagation()}>
                      <a href={`tel:${service.phone}`} className="button button-primary button-small"><PhoneCall size={14}/><span dir="ltr">{service.phone}</span></a>
                      <a href={whatsappUrl(service.phone, serviceWhatsappMessage(service, cat.name))} target="_blank" rel="noopener noreferrer" className="button button-whatsapp button-small"><MessageCircle size={14}/>واتساب</a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="duty-empty"><p>لا توجد خدمات مطابقة لهذا التبويب حاليًا.</p></div>
          )}
        </div>
      </Modal>
    )}
    {modal === "utilities" && (
      <Modal floating wide title="أرقام تهمك في جنزور (المرافق والطوارئ العامة)" subtitle="أرقام الطوارئ والمرافق الحيوية وشكاوى الخدمات العامة للاتصال الفوري بضغطة واحدة" onClose={closeModal}>
        <div className="utilities-modal-content">
          {isAdmin && (
            <div className="utilities-admin-bar">
              <span><ShieldCheck size={16}/>إدارة أرقام المرافق والطوارئ (تظهر للأدمن فقط)</span>
              <button type="button" className="button button-primary button-small" onClick={() => setEditingUtility({ name: "", number: "", category: "مرافق عامة", detail: "", tone: "blue" })}>
                <Plus size={15}/>إضافة رقم جديد
              </button>
            </div>
          )}
          {utilityMessage && <div className="form-notice"><CheckCircle2 size={16}/><span>{utilityMessage}</span></div>}
          {isAdmin && editingUtility && (
            <form className="utility-editor-form" onSubmit={handleUtilitySubmit}>
              <h4>{editingUtility.id ? "تعديل بيانات الرقم" : "إضافة رقم جديد في أرقام تهمك في جنزور"}</h4>
              <div className="form-row">
                <label className="field">اسم الجهة أو المرفق<input name="name" defaultValue={editingUtility.name} required minLength={2} maxLength={120} placeholder="مثال: طوارئ الكهرباء بجنزور"/></label>
                <label className="field">رقم الهاتف أو الخط الساخن<input name="number" defaultValue={editingUtility.number} required dir="ltr" maxLength={24} placeholder="مثال: 121"/></label>
              </div>
              <div className="form-row">
                <label className="field">التصنيف<input name="category" defaultValue={editingUtility.category ?? "مرافق عامة"} maxLength={60} placeholder="مثال: مرافق عامة"/></label>
                <label className="field">لون البطاقة
                  <SelectField name="tone" defaultValue={editingUtility.tone ?? "blue"}>
                    <option value="blue">أزرق (مرافق وإدارة)</option>
                    <option value="red">أحمر (طوارئ عاجلة)</option>
                    <option value="amber">ذهبي (كهرباء وإطفاء)</option>
                    <option value="emerald">أخضر (صحة وخدمات عامة)</option>
                  </SelectField>
                </label>
              </div>
              <label className="field">وصف مختصر<input name="detail" defaultValue={editingUtility.detail} maxLength={240} placeholder="تفاصيل الخدمة أو مواعيد العمل"/></label>
              <div className="utility-editor-actions">
                <button type="submit" className="button button-success button-small" disabled={utilityBusy}><Check size={15}/>حفظ الرقم</button>
                <button type="button" className="button button-soft button-small" onClick={() => setEditingUtility(null)}><X size={15}/>إلغاء</button>
              </div>
            </form>
          )}
          <div className="utilities-grid">
            {utilityNumbers.map((item) => (
              <article key={item.id} className={`utility-card is-${item.tone}`}>
                <div className="utility-card-head">
                  <span className="utility-category-tag">{item.category}</span>
                  <div className="utility-card-tools">
                    <button type="button" className="utility-copy-btn" onClick={() => void copyUtilityNumber(item.id, item.number)} aria-label={`نسخ رقم ${item.name}`} title="نسخ الرقم">
                      {copiedUtilityId === item.id ? <ClipboardCheck size={14}/> : <Clipboard size={14}/>}
                      <span>{copiedUtilityId === item.id ? "تم النسخ" : "نسخ"}</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button type="button" className="utility-admin-btn" onClick={() => setEditingUtility(item)} aria-label={`تعديل ${item.name}`} title="تعديل">
                          <Pencil size={13}/>تعديل
                        </button>
                        <button type="button" className="utility-admin-btn is-delete" onClick={() => handleUtilityDelete(item.id)} aria-label={`حذف ${item.name}`} title="حذف">
                          <Trash2 size={13}/>حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
                <a href={`tel:${item.number}`} className="utility-call-link" aria-label={`اتصال بـ ${item.name} على رقم ${item.number}`}>
                  <PhoneCall size={16}/>
                  <strong dir="ltr">{item.number}</strong>
                  <span>اتصل الآن</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </Modal>
    )}
    {modal === "quick" && (
      <Modal floating title="الخدمات السريعة" subtitle="وصول سريع لخدمات الطوارئ، والبحث حسب عنوانك في جنزور، وقائمة خدماتك المفضلة" onClose={closeModal}>
        <div className="quick-links-card quick-services-grid quick-modal-grid">
          {settings.showEmergency && (
            <button type="button" onClick={() => setModal("emergency")}>
              <span className="quick-icon quick-red"><Siren size={25}/></span>
              خدمات الطوارئ
              <ChevronLeft size={15}/>
            </button>
          )}
          <button type="button" onClick={() => setModal("location")}>
            <span className="quick-icon quick-blue"><MapPinned size={24}/></span>
            ابحث حسب العنوان
            <ChevronLeft size={15}/>
          </button>
          <button type="button" onClick={() => { closeModal(); showFavorites(); }}>
            <span className="quick-icon quick-pink"><Heart size={25} fill="currentColor"/></span>
            المفضلة
            <ChevronLeft size={15}/>
          </button>
        </div>
      </Modal>
    )}
    {modal === "emergency" && <Modal floating title="أرقام الطوارئ والمرافق في جنزور ومصر" subtitle="اتصل بالجهة المختصة مباشرة من هاتفك" onClose={closeModal}><div className="emergency-contact-list">{utilityNumbers.map((contact) => <a className="emergency-contact-link" key={contact.id} href={`tel:${contact.number}`}><span className="emergency-contact-icon"><PhoneCall size={20}/></span><span className="emergency-contact-copy"><strong>{contact.name}</strong><small>{contact.detail}</small></span><b dir="ltr">{contact.number}</b></a>)}<p className="emergency-contact-note">للحالات الطبية المهددة للحياة اتصل بالإسعاف على 123. أرقام الخدمات قد تختلف حسب المنطقة.</p></div></Modal>}
    {modal === "service" && <Modal floating title="أضف مهنتك لدليل جنزور" subtitle="طلب إضافة خدمة.. بعد مراجعة الإدارة" onClose={closeModal} wide><ServiceForm catalog={categories} areaOptions={data.areas} initialCategory={specialtyId || rootFilter} initialArea={area} onClose={closeModal}/></Modal>}
    {modal === "location" && <Modal floating title="اختار عنوانك في جنزور" subtitle="الخدمة في ناحيتك.. في خطوات بسيطة" onClose={closeModal}><LocationPicker areaOptions={data.areas} selected={area} onSelect={selectLocation}/></Modal>}
    {feedOpen && (
      <Modal floating title="إشعارات الأعضاء والمهنيين" subtitle="تنبيهات استكمال البيانات ورسائل الإدارة والجديد في تخصصاتك" onClose={() => setFeedOpen(false)}>
        {completionAlerts.length > 0 || providerAlerts.length > 0 || feedServices.length > 0 ? (
          <div className="follow-feed member-notifications-feed">
            {completionAlerts.map((service) => (
              <button
                type="button"
                key={`completion-${service.id}`}
                className={`member-notif-item is-completion ${service.completionStatus === "rejected" ? "is-rejected" : ""}`}
                onClick={() => {
                  setFeedOpen(false);
                  setCompletionService(service);
                }}
              >
                <span className="provider-card-icon" aria-hidden="true">
                  <ClipboardList size={21}/>
                </span>
                <div className="follow-feed-copy">
                  <strong>
                    {service.completionStatus === "rejected" ? `مطلوب تصحيح بيانات: ${service.name}` : `مطلوب استكمال بيانات: ${service.name}`}
                    {service.completionStatus === "rejected" && <span className="completion-red-dot" title="طلبت الإدارة تصحيح البيانات"/>}
                  </strong>
                  <span>{service.completionNote || `اضغط هنا لاستكمال بيانات مهنتك في قسم ${getCategory(service.category, categories).name}`}</span>
                </div>
                <small className="notif-action-pill">استكمال الآن <ChevronLeft size={14}/></small>
              </button>
            ))}
            {providerAlerts.map(({ notif, service }) => (
              <button
                type="button"
                key={notif.id}
                className="member-notif-item is-admin-msg"
                onClick={() => {
                  setFeedOpen(false);
                  if (service) {
                    if (service.completionStatus === "requested" || service.completionStatus === "rejected") {
                      setCompletionService(service);
                    } else {
                      openDetail(service);
                    }
                  }
                }}
              >
                <span className="provider-card-icon" aria-hidden="true">
                  <BellRing size={20}/>
                </span>
                <div className="follow-feed-copy">
                  <strong>{notif.title}</strong>
                  <span>{notif.message}</span>
                </div>
                <small>{new Date(notif.createdAt).toLocaleDateString("ar-EG")}<ChevronLeft size={14}/></small>
              </button>
            ))}
            {feedServices.map(({ service, createdAt }) => (
              <button type="button" key={`feed-${service.id}`} onClick={() => { setFeedOpen(false); openDetail(service); }}>
                <span className="provider-card-icon" aria-hidden="true"><CategoryIcon icon={getCategory(service.category, categories).icon} size={22}/></span>
                <div className="follow-feed-copy"><strong>{service.name}</strong><span>{getCategory(service.category, categories).name}</span></div>
                <small>{new Date(createdAt).toLocaleDateString("ar-EG")}<ChevronLeft size={14}/></small>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>مفيش إشعارات جديدة حاليًا</h3>
            <p>أي تنبيه لاستكمال البيانات أو إشعار من الإدارة أو مهنة جديدة في التخصصات المتابعة هيظهرلك هنا.</p>
          </div>
        )}
      </Modal>
    )}
    {modal === "contact" && <Modal floating title="خلّينا على تواصل" subtitle="مكتب الجمال للدعاية والإعلان" onClose={closeModal}><div className="contact-content"><span className="contact-illustration"><MessageCircle size={46}/></span><h3>إحنا هنا عشان نساعدك</h3><p>{settings.contactText}</p><a className="contact-number" href={`tel:${settings.phone}`} dir="ltr">{settings.phone}</a><a className="button button-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={20}/>تواصل على واتساب</a><a className="button button-soft" href={`tel:${settings.phone}`}><Phone size={18}/>اتصل بمكتب الجمال</a></div></Modal>}
    {completionService && (
      <Modal floating wide title="استكمال بيانات المهنة" subtitle={`${completionService.name} — ${getCategory(completionService.category, categories).name}`} onClose={() => setCompletionService(null)}>
        <ProviderCompletionModalForm
          service={completionService}
          categories={categories}
          areas={data.areas}
          onSubmitted={(updated) => handleProviderCompletionSubmitted(completionService.id, updated)}
          onClose={() => setCompletionService(null)}
        />
      </Modal>
    )}
    {detail && <Modal floating title={getCategory(detail.category, categories).parentId === "clinics" ? "بيانات الطبيب والعيادة" : "تفاصيل مقدم الخدمة"} subtitle={`${getCategory(detail.category, categories).name} • ${detail.address || detail.area}`} onClose={closeDetail}><div className="service-details">
      <div className="detail-hero" style={categoryTheme(getCategory(detail.category, categories))}>
        <ServiceArt category={detail.category} item={getCategory(detail.category, categories)}/>
        <div className="detail-name-colored-box">
          <div className="detail-name-box-top">
            <div className="detail-name-box-copy">
              <h3>{detail.name}</h3>
              <span className="detail-hero-category"><CategoryIcon icon={getCategory(detail.category, categories).icon} size={14}/>{getCategory(detail.category, categories).name}</span>
            </div>
            <div className="detail-name-left-actions" role="group" aria-label="المشاركة والمفضلة">
              <button
                type="button"
                className="detail-header-icon-btn is-share"
                onClick={() => void shareService(detail)}
                aria-label={`مشاركة ${detail.name}`}
                title="مشاركة الصفحة"
              >
                <Share2 size={17}/>
              </button>
              <button
                type="button"
                className={`detail-header-icon-btn is-favorite ${favorites.includes(detail.id) ? "is-active" : ""}`}
                onClick={() => toggleFavorite(detail.id)}
                aria-pressed={favorites.includes(detail.id)}
                aria-label={favorites.includes(detail.id) ? `إزالة ${detail.name} من المفضلة` : `أضف ${detail.name} للمفضلة`}
                title={favorites.includes(detail.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                <Heart size={17} fill={favorites.includes(detail.id) ? "currentColor" : "none"}/>
              </button>
            </div>
          </div>
          <div className="detail-name-box-rating">
            <ProviderRating value={detail.rating} reviews={detail.reviews}/>
          </div>
        </div>
      </div>

      <div className="detail-badges-fold-wrap">
        <button
          type="button"
          className={`detail-badges-fold-btn ${detailBadgesOpen ? "is-open" : ""}`}
          aria-expanded={detailBadgesOpen}
          onClick={() => setDetailBadgesOpen((open) => !open)}
          title={detailBadgesOpen ? "طي الأوسمة والشارات" : "عرض الأوسمة والشارات"}
        >
          <Award size={14}/>
          <span>{detailBadgesOpen ? "إخفاء الأوسمة" : "عرض الأوسمة والشارات"}</span>
          {detailBadgesOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
        {detailBadgesOpen && (
          <div className="details-badges">
            {detail.verified && <span className="detail-verified"><ShieldCheck size={14}/>تم التحقق بالمعاينة</span>}
            {liveDetail && now > 0 && isAvailableNow(liveDetail, now) && <span className="detail-open"><span/>متاح الآن</span>}
            {supportsHomeDelivery(liveDetail ?? detail) && <span className="detail-delivery"><Truck size={14}/>🛵 يوجد توصيل للمنازل</span>}
            {getCategory(detail.category, categories).parentId === "teachers" && getTeacherStagesForService(liveDetail ?? detail).map((stage) => <span key={stage.id} className="detail-stage-badge"><GraduationCap size={14}/>{stage.label}</span>)}
            {detail.emergency && <span className="detail-emergency"><Siren size={14}/>متاح للطوارئ</span>}
            {detail.featured && <span className="detail-featured"><Crown size={14}/>خدمة مميزة</span>}
            {isTopRated(detail) && <span className="detail-toprated"><Medal size={14}/>الأعلى تقييمًا</span>}
            {isNewService(detail) && <span className="detail-new"><Sparkles size={14}/>جديد</span>}
            {getServiceTrustBadges(liveDetail ?? detail, now).map((badge) => <span key={badge.id} className={`detail-trust-badge is-${badge.tone}`}><Award size={14}/>{badge.label}</span>)}
          </div>
        )}
      </div>

      {detail.demo && <div className="form-notice notice-amber"><span>هذه بطاقة تجريبية لتوضيح شكل الدليل، وليست بيانات مقدم خدمة حقيقي.</span></div>}
      <dl className="detail-data">
        <div><dt>التخصص</dt><dd>{getCategory(detail.category, categories).name}</dd></div>
        <div><dt>العنوان</dt><dd><MapPin size={14}/>{detail.address || detail.area}</dd></div>
        <div><dt>الهاتف</dt><dd dir="ltr">{detail.phone}</dd></div>
        {detail.phoneSecondary && <div><dt>هاتف إضافي</dt><dd dir="ltr">{detail.phoneSecondary}</dd></div>}
      </dl>
      {detail.menuUrl && <a className="button button-soft detail-menu-button" href={detail.menuUrl} target="_blank" rel="noopener noreferrer">عرض المنيو</a>}

      <div className="detail-popup-icons-bar" role="group" aria-label="نوافذ التقييم ومواعيد العيادة">
        {getCategory(detail.category, categories).parentId === "clinics" && (
          <button
            type="button"
            className="detail-popup-trigger-btn is-clinic"
            onClick={() => setDetailClinicOpen(true)}
            aria-haspopup="dialog"
          >
            <span className="detail-popup-trigger-icon"><Stethoscope size={19}/></span>
            <div className="detail-popup-trigger-copy">
              <strong>نظام الكشف وأيام التواجد بالعيادة</strong>
              <small>اضغط لعرض مواعيد الطبيب وطريقة الحجز</small>
            </div>
            <ChevronLeft size={16}/>
          </button>
        )}

        <button
          type="button"
          className="detail-popup-trigger-btn is-rating"
          onClick={() => setDetailRatingOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="detail-popup-trigger-icon"><Star size={19} fill="currentColor"/></span>
          <div className="detail-popup-trigger-copy">
            <strong>التقييمات وآراء الأهالي ({detail.reviews || detail.comments?.length || 0})</strong>
            <small>اضغط لعرض التقييمات أو إضافة تقييمك</small>
          </div>
          <ChevronLeft size={16}/>
        </button>
      </div>

      {getCategory(detail.category, categories).parentId === "shops" && (() => {
        const currentShop = liveDetail ?? detail;
        const catalogItems = getShopCatalogItems(currentShop);
        const shopHasDelivery = supportsHomeDelivery(currentShop);
        if (!catalogItems.length) return null;
        return (
          <section className="detail-shop-catalog-card" aria-label="قائمة الأصناف والأسعار المختصرة للطلب السريع">
            <div className="detail-shop-catalog-head">
              <div className="detail-shop-catalog-title">
                <span className="detail-shop-catalog-icon"><ShoppingBag size={18}/></span>
                <div>
                  <h4>قائمة الأصناف والعروض المتاحة</h4>
                  <span>حدد الأصناف التي تريدها واضغط «اطلب عبر واتساب» لتجهيز الرسالة تلقائياً</span>
                </div>
              </div>
              {selectedShopItems.length > 0 && (
                <span className="detail-shop-selected-count">{selectedShopItems.length} أصناف محددة</span>
              )}
            </div>
            <ul className="detail-shop-items-list">
              {catalogItems.map((item) => {
                const isSelected = selectedShopItems.includes(item.raw);
                return (
                  <li key={item.raw}>
                    <button
                      type="button"
                      className={`detail-shop-item-row ${isSelected ? "is-selected" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedShopItems((curr) =>
                          curr.includes(item.raw) ? curr.filter((x) => x !== item.raw) : [...curr, item.raw],
                        );
                      }}
                    >
                      <span className={`detail-shop-item-check ${isSelected ? "is-checked" : ""}`} aria-hidden="true">
                        {isSelected && <Check size={13}/>}
                      </span>
                      <span className="detail-shop-item-name">{item.name}</span>
                      <span className={`detail-shop-item-price ${item.price ? "has-price" : ""}`}>
                        {item.price || "متوفر للطلب"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="detail-shop-order-controls">
              <input
                type="text"
                className="detail-shop-note-input"
                value={shopOrderNote}
                onChange={(event) => setShopOrderNote(event.target.value)}
                placeholder="أضف الكمية أو ملاحظة للطلب (اختياري)..."
                maxLength={160}
              />
              {shopHasDelivery && (
                <label className="detail-shop-delivery-check">
                  <input
                    type="checkbox"
                    checked={shopOrderDelivery}
                    onChange={(event) => setShopOrderDelivery(event.target.checked)}
                  />
                  <Truck size={14}/>
                  <span>طلب توصيل للمنزل بجنزور</span>
                </label>
              )}
              <a
                href={whatsappUrl(
                  detail.phone,
                  buildShopWhatsappOrderMessage(
                    detail,
                    selectedShopItems,
                    contactArea,
                    shopOrderNote,
                    shopHasDelivery && shopOrderDelivery,
                  ),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-whatsapp detail-shop-whatsapp-btn"
                onClick={() => trackDirectoryEvent({ kind: "whatsapp", label: detail.name, serviceId: detail.id, categoryId: detail.category })}
              >
                <MessageCircle size={18}/>
                <span>
                  {selectedShopItems.length > 0
                    ? `اطلب الأصناف المحددة عبر واتساب (${selectedShopItems.length})`
                    : "اطلب أو استفسر عن الأصناف عبر واتساب"}
                </span>
              </a>
            </div>
          </section>
        );
      })()}
      <div className="detail-about"><h4>نبذة عن الخدمة</h4><p>{detail.description}</p></div>
      {liveDetail?.subSpecialties?.length ? <section className="detail-subspec"><h4>التخصصات الفرعية</h4><ul>{liveDetail.subSpecialties.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {liveDetail?.serviceItems?.length && getCategory(detail.category, categories).parentId !== "shops" ? <section className="detail-service-items"><h4>الخدمات التفصيلية</h4><ul>{liveDetail.serviceItems.map((item) => <li key={item}>{item} <a href={whatsappUrl(detail.phone, serviceWhatsappMessage(detail, getCategory(detail.category, categories).name, contactArea, item))} target="_blank" rel="noopener noreferrer">اسأل على واتساب</a></li>)}</ul></section> : null}
      <div className="detail-tools">
        <button type="button" className={detailQr ? "is-open" : ""} aria-expanded={detailQr} onClick={() => { setDetailQr(true); setDetailUpdate(false); }}><QrCode size={17}/>بطاقة عمل و QR</button>
        {isAdmin && design.showAdminQuickEdit && (
          <Link href={`/admin?tab=directory&editService=${encodeURIComponent(detail.id)}`} className="button button-soft button-small">
            <Pencil size={15}/> تعديل كأدمن
          </Link>
        )}
        {isServiceOwner(liveDetail ?? detail, viewer, ownedServiceIds) && (
          <button type="button" className={detailUpdate ? "is-open" : ""} aria-expanded={detailUpdate} onClick={() => { setDetailUpdate(true); setDetailQr(false); setUpdateMessage(""); }}><Pencil size={17}/>تحديث البيانات</button>
        )}
      </div>
      <div className="detail-actions"><a className="button button-primary" href={`tel:${detail.phone}`} onClick={() => trackDirectoryEvent({ kind: "call", label: detail.name, serviceId: detail.id, categoryId: detail.category })}><Phone size={18}/>اتصل الآن</a>{detail.phoneSecondary && <a className="button button-soft" href={`tel:${detail.phoneSecondary}`} onClick={() => trackDirectoryEvent({ kind: "call", label: detail.name, serviceId: detail.id, categoryId: detail.category })}><Phone size={18}/><span dir="ltr">{detail.phoneSecondary}</span></a>}<a className="button button-whatsapp" href={whatsappUrl(detail.phone, design.whatsappDefaultGreeting || "مرحبًا، وصلت إليك من دليل المهن والخدمات بقرية جنزور.")} target="_blank" rel="noopener noreferrer" onClick={() => trackDirectoryEvent({ kind: "whatsapp", label: detail.name, serviceId: detail.id, categoryId: detail.category })}><MessageCircle size={19}/>واتساب</a></div>
    </div></Modal>}
    {detail && detailClinicOpen && (() => {
      const currentDoc = liveDetail ?? detail;
      const bookingMode = getClinicBookingMode(currentDoc);
      const schedule = getClinicScheduleSummary(currentDoc, now || undefined);
      return (
        <Modal
          floating
          title="نظام الكشف وأيام التواجد بالعيادة"
          subtitle={`${detail.name} — ${getCategory(detail.category, categories).name}`}
          onClose={() => setDetailClinicOpen(false)}
        >
          <div className="floating-submodal-body clinic-submodal-body">
            <div className="clinic-submodal-grid">
              <div className="clinic-submodal-item">
                <span className="clinic-submodal-label"><CalendarCheck size={16}/> نظام الكشف والحجز</span>
                <strong className={`detail-clinic-mode-pill is-${bookingMode}`}>
                  {getClinicBookingLabel(bookingMode)}
                </strong>
              </div>
              <div className="clinic-submodal-item">
                <span className="clinic-submodal-label"><Clock size={16}/> حالة العيادة اليوم</span>
                <strong className={`detail-clinic-today-pill ${schedule.isOpenToday ? "is-open" : "is-closed"}`}>
                  {schedule.todayHoursText}
                </strong>
              </div>
            </div>
            <div className="clinic-submodal-days-box">
              <h5>📅 أيام ومواعيد التواجد بالعيادة</h5>
              <p>{schedule.daysText}</p>
            </div>
            <div className="floating-submodal-actions">
              <a
                href={whatsappUrl(
                  detail.phone,
                  `مرحبًا ${detail.name}، وصلت إليك من دليل جنزور. أود الاستفسار عن مواعيد الكشف (${getClinicBookingLabel(bookingMode)})${contactArea ? ` — العنوان: ${contactArea}` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-whatsapp"
                onClick={() => trackDirectoryEvent({ kind: "whatsapp", label: detail.name, serviceId: detail.id, categoryId: detail.category })}
              >
                <MessageCircle size={17}/>
                <span>احجز أو استفسر عبر واتساب</span>
              </a>
              <button
                type="button"
                className="button button-soft detail-floating-close"
                onClick={() => setDetailClinicOpen(false)}
              >
                <X size={17}/>
                <span>إغلاق</span>
              </button>
            </div>
          </div>
        </Modal>
      );
    })()}
    {detail && detailRatingOpen && (
      <Modal
        floating
        title={`التقييمات وآراء الأهالي — ${detail.name}`}
        subtitle={getCategory(detail.category, categories).name}
        onClose={() => setDetailRatingOpen(false)}
      >
        <div className="floating-submodal-body rating-submodal-body">
          <div className="rating-submodal-summary">
            <ProviderRating value={detail.rating} reviews={detail.reviews}/>
          </div>
          {viewer.role === "guest" ? (
            <p className="rating-login-hint">
              <Star size={15}/>
              <span>عندك عضوية؟ <a href="/login">سجّل دخولك</a> لتقييم {detail.name}.. تقييمات الأعضاء تظهر بعد مراجعة الإدارة.</span>
            </p>
          ) : (
            <div className="member-rating">
              <h4>قيّم {detail.name}</h4>
              <div className="member-rating-stars">
                {[1, 2, 3, 4, 5].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={step <= ratingStars ? "is-on" : ""}
                    aria-label={`تقييم ${step} من 5`}
                    aria-pressed={ratingStars === step}
                    onClick={() => setRatingStars(step)}
                  >
                    <Star size={22} fill={step <= ratingStars ? "currentColor" : "none"}/>
                  </button>
                ))}
              </div>
              <input
                value={ratingComment}
                onChange={(event) => setRatingComment(event.target.value)}
                placeholder="اكتب تعليقك أو تجربتك (اختياري).."
                maxLength={300}
              />
              <button
                type="button"
                className="button button-success button-small"
                disabled={!ratingStars || ratingBusy}
                onClick={() => void submitRating()}
              >
                {ratingBusy ? "جاري الإرسال.." : "إرسال التقييم"}
              </button>
              {ratingMessage && <small role="status">{ratingMessage}</small>}
              <small className="member-rating-note">تقييمك يظهر بعد مراجعة الإدارة، ولو قيّمت قبل كده تقييمك الجديد يحل محله.</small>
            </div>
          )}
          {detail.comments?.length ? (
            <section className="detail-comments">
              <h4>آراء وتعليقات الأعضاء ({detail.comments.length})</h4>
              <ul>
                {detail.comments.map((item, index) => (
                  <li key={index}>
                    <span className="comment-stars" aria-label={`${item.stars} من 5`}>
                      {[1, 2, 3, 4, 5].map((step) => (
                        <Star key={step} size={13} fill={step <= item.stars ? "currentColor" : "none"}/>
                      ))}
                    </span>
                    <p>{item.comment}</p>
                    <small>{item.member} • {new Date(item.date).toLocaleDateString("ar-EG")}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="rating-empty-note">لا توجد تعليقات منشورة بعد — كن أول من يشارك تجربته!</p>
          )}
          <div className="floating-submodal-actions">
            <button
              type="button"
              className="button button-soft detail-floating-close"
              onClick={() => setDetailRatingOpen(false)}
            >
              <X size={17}/>
              <span>إغلاق نافذة التقييمات</span>
            </button>
          </div>
        </div>
      </Modal>
    )}
    {detail && detailQr && <BusinessCardModal service={liveDetail ?? detail} category={getCategory(detail.category, categories)} siteName={settings.siteName} now={now} onClose={() => setDetailQr(false)}/>}
    {detail && detailUpdate && isServiceOwner(liveDetail ?? detail, viewer, ownedServiceIds) && <Modal floating title="تحديث البيانات" subtitle={`تحديث بيانات ${detail.name} — ستراجعها الإدارة`} onClose={() => setDetailUpdate(false)}><div className="detail-update"><h4>هل هذه بياناتك؟</h4><p>حدّث رقم الهاتف أو أضف ملاحظة وسيراجعها فريق الإدارة.</p><input value={updatePhone} onChange={(event) => setUpdatePhone(event.target.value)} placeholder="رقم الهاتف الصحيح" inputMode="tel"/><input value={updateNote} onChange={(event) => setUpdateNote(event.target.value)} placeholder="ملاحظة أو رقم إضافي"/><div className="detail-update-actions"><button type="button" className="button button-primary" onClick={() => void requestServiceUpdate()}>حدّثها الآن</button><button type="button" className="button button-soft detail-floating-close" onClick={() => setDetailUpdate(false)}><X size={17}/>إغلاق</button></div>{updateMessage && <small role="status">{updateMessage}</small>}</div></Modal>}
    {searchModalOpen && (
      <Modal
        floating
        title="البحث في دليل قرية جنزور"
        subtitle="ابحث بالاسم أو المهنة أو التخصص أو العنوان وانتقل مباشرة للنتائج"
        onClose={() => setSearchModalOpen(false)}
      >
        <div className="floating-search-modal-body">
          <form className="hero-search floating-modal-search-form" onSubmit={search} role="search">
            <div className="search-input-wrap">
              <Search size={22}/>
              <input
                id="hero-search-input"
                type="search"
                role="combobox"
                aria-expanded={suggestOpen && searchSuggestions.length > 0}
                aria-controls="hero-search-suggestions"
                aria-autocomplete="list"
                aria-label="ابحث عن مهنة أو مقدم خدمة"
                value={queryDraft}
                onChange={(event) => {
                  setQueryDraft(event.target.value);
                  setSuggestOpen(true);
                  setSuggestActive(-1);
                }}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                onKeyDown={searchKeyDown}
                placeholder="ابحث عن مهنة، طبيب أو مقدم خدمة..."
              />
              {suggestOpen && searchSuggestions.length > 0 && (
                <ul id="hero-search-suggestions" className="search-suggestions" role="listbox">
                  {searchSuggestions.map((item, index) => (
                    <li
                      key={`${item.kind}-${item.id}`}
                      role="option"
                      aria-selected={suggestActive === index}
                      className={suggestActive === index ? "is-active" : ""}
                    >
                      {item.kind === "specialty" ? (
                        <Link
                          href={item.href}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSuggestOpen(false);
                            setSearchModalOpen(false);
                          }}
                        >
                          <Search size={14}/>
                          <span>{item.label}</span>
                          <small>{item.hint}</small>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseSearchSuggestion(item)}
                        >
                          <Search size={14}/>
                          <span>{item.label}</span>
                          <small>{item.hint}</small>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <SelectField
              aria-label="اختر التصنيف"
              value={rootFilter}
              onChange={(event) => setRootFilter(event.target.value)}
              disabled={scoped}
              icon={<Grid2X2 size={17}/>}
              options={[{ value: "", label: "كل التصنيفات" }, ...roots.map(({ id, name }) => ({ value: id, label: name }))]}
            />
            <SelectField
              className="area-select"
              aria-label="اختر العنوان"
              value={area}
              onChange={(event) => {
                setArea(event.target.value);
                setCustomAddress("");
              }}
              icon={<MapPin size={18}/>}
              options={[
                { value: "", label: "كل عناوين جنزور" },
                ...data.areas.map(({ name }) => ({ value: name, label: name })),
                { value: OTHER_ADDRESS, label: OTHER_ADDRESS },
              ]}
            />
            {area === OTHER_ADDRESS && (
              <label className="hero-custom-address">
                العنوان الآخر
                <input
                  value={customAddress}
                  onChange={(event) => setCustomAddress(event.target.value)}
                  placeholder="اكتب الشارع أو العلامة المميزة"
                  required
                  minLength={3}
                  maxLength={240}
                />
              </label>
            )}
            <button className="search-button" type="submit">
              ابحث الآن <Search size={17}/>
            </button>
          </form>
        </div>
      </Modal>
    )}
    <SponsorshipModal
      open={sponsorModalOpen}
      autoTriggered={sponsorModalAuto}
      designSettings={design}
      fallbackPhone={settings.phone}
      onClose={() => setSponsorModalOpen(false)}
    />
    {!scoped && neededServices.length > 0 && <section className="container search-assistance most-needed"><h2>الأكثر احتياجًا</h2><p>خدمات تختارها وترتبها الإدارة لاحتياجات أهل القرية، وليست ترتيبًا حسب المشاهدات.</p>{neededServices.map((service) => <button className="button button-soft" key={service.id} onClick={() => openDetail(service)}>{service.name} — {getCategory(service.category, categories).name}</button>)}</section>}
  </>;
}

// شارة "الأعلى تقييمًا": تقييم ٤.٥ أو أكثر مع ٥ تقييمات على الأقل.
function isTopRated(service: Pick<ServiceRecord, "rating" | "reviews">) { return (Number.parseFloat(service.rating) || 0) >= 4.5 && service.reviews >= 5; }

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
  now: number;
  showAdminQuickEdit?: boolean;
  sponsorInfo?: SponsoredProviderConfig;
  onOpen: (service: ServiceRecord) => void;
  onOpenCompletion: (service: ServiceRecord) => void;
  onShare: (service: ServiceRecord) => void;
  onToggleFavorite: (id: string) => void;
};
// Outer card layout: shows ONLY Provider Name, Specialty, Stars, and Call Button (plus Golden VIP Frame & Crown Badge if sponsored).
// All other details appear inside the Service Provider Detail Modal.
function ProviderCard({ service, category, showAdminQuickEdit, sponsorInfo, onOpen }: ProviderCardProps) {
  return (
    <article
      className={`provider-card provider-card-minimal ${sponsorInfo ? "is-vip-sponsor" : ""}`}
      data-service-id={service.id}
      role="button"
      tabIndex={0}
      aria-label={`عرض تفاصيل ${service.name}`}
      style={categoryTheme(category)}
      onClick={() => onOpen(service)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(service);
        }
      }}
    >
      {sponsorInfo && (
        <div className="vip-sponsor-card-ribbon">
          <Crown size={14}/>
          <span>{sponsorInfo.badgeLabel || "راعي معتمد 👑"}</span>
        </div>
      )}
      <div className="provider-card-main provider-card-minimal-main">
        <span className="provider-card-icon" aria-hidden="true">
          <CategoryIcon icon={category.icon} size={26}/>
        </span>
        <div className="provider-card-copy provider-card-minimal-copy">
          <h3 className="provider-name">{service.name}</h3>
          <span className="provider-specialty">{category.name}</span>
          <ProviderRating value={service.rating} reviews={service.reviews}/>
        </div>
        {showAdminQuickEdit && (
          <div className="provider-card-side">
            <Link
              href={`/admin?tab=directory&editService=${encodeURIComponent(service.id)}`}
              className="provider-admin-edit-btn"
              onClick={(event) => event.stopPropagation()}
              aria-label={`تعديل سريع لـ ${service.name} كأدمن`}
              title="تعديل سريع كأدمن"
            >
              <Pencil size={14}/>
            </Link>
          </div>
        )}
      </div>
      <div className="provider-call-strip provider-minimal-call-strip">
        <a
          href={`tel:${service.phone}`}
          className="provider-direct-call-btn"
          onClick={(event) => {
            event.stopPropagation();
            trackDirectoryEvent({ kind: "call", label: service.name, serviceId: service.id, categoryId: service.category });
          }}
          aria-label={`اتصال بـ ${service.name} على رقم ${service.phone}`}
        >
          <PhoneCall size={16}/>
          <span>اتصال مباشر</span>
          <b dir="ltr">{service.phone}</b>
        </a>
      </div>
    </article>
  );
}

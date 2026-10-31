"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import { Timer, BadgePercent, BarChart3, Minus, Plus as PlusIcon, ListChecks, PackageOpen, ArrowLeft, Award, BellRing, Building2, Droplets, Flame, Zap, Megaphone, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CirclePlus, Clipboard, ClipboardCheck, ClipboardList, Clock, Crown, Grid2X2, Heart, Info, LockKeyhole, LogIn, LogOut, MapPin, MapPinned, Medal, Menu, MessageCircle, Moon, Pencil, Phone, PhoneCall, Pill, Plus, QrCode, Search, SearchX, Share2, ShieldCheck, ShoppingBag, Siren, Smartphone, Sparkles, Star, Stethoscope, Sun, Trash2, Truck, UserPlus, UserRound, UserRoundPlus, UsersRound, X, Volume2, VolumeX, Copy, MessageSquareWarning } from "lucide-react";
import { buildShopWhatsappOrderMessage, categoryStickerSrc, defaultDesignSettings, resolveHeroBanner, getCategory, getClinicBookingLabel, getClinicBookingMode, getClinicScheduleSummary, getDutyShiftInfo, getOnDutyServices, getServiceTrustBadges, getShopCatalogItems, getSpecialtyKeywords, isAvailableNow, isNewService, isServiceOwner, matchesClinicFilter, matchesServiceQuery, normalizeSearch, OTHER_ADDRESS, eventPhase, liveTickerItems, parseAnnouncementItems, publicUtilityNumbers, serviceWhatsappMessage, serviceDirectUrl, suggestSpecialties, supportsHomeDelivery, whatsappUrl, type CategoryRecord, type ClinicBookingFilter, type DutyFilter, type FollowFeedItem, type FollowState, type PublicDirectory, type PublicUtilityContact, type ServiceRecord, type Viewer, parseProviderEdgeTools, type ProviderEdgeToolId, hasProfessionArt, categoryInStage, getTeacherStage, serviceInStage, serviceTeachesSubject, stageHref, TEACHER_CENTER_ID, TEACHER_STAGES, TEACHERS_ROOT_ID, activeOffer, offerTimeLeft, OFFICE_WHATSAPP, isNewOffer, servicesWithOffers } from "@/lib/catalog";
import { isSoundMuted, menuFeedback, setSoundMuted, SOUND_MUTE_EVENT } from "@/lib/feedback";
import { CategoryIcon, MainCategoryIcon, Modal, ServiceArt, SpecialtyIcon, StickerIcon } from "@/components/ui";
import ProviderCard, { categoryTheme, ProviderRating } from "@/components/provider-card";
import NotifyToggle from "@/components/notify-toggle";
import { openInstallAppModal } from "@/components/install-app-modal";
import dynamic from "next/dynamic";
import AdRotator from "@/components/ad-rotator";
import TelecomCards from "@/components/telecom-cards";
import DesignApplicator from "@/components/design-applicator";
import SelectField from "@/components/select-field";
import { trackDirectoryEvent, sendCategoryHit } from "@/lib/analytics-tracker";
import ProfilePhotoCircle from "@/components/profile-photo-circle";
import AdminNotificationsModal, { chimeForNewItems, fetchAdminFeed, type AdminFeed } from "@/components/admin-notifications-modal";
import { saveVCard, serviceVCard } from "@/lib/vcard";
import { withViewTransition } from "@/lib/motion";
import { useIsDark } from "@/lib/use-is-dark";
import { TickerText } from "@/components/ticker-text";
import TeacherStageModal from "@/components/teacher-stage-modal";
import CenterScheduleView from "@/components/center-schedule-view";
import QrSvg from "@/components/qr-svg";

// تحميل كسول للمكوّنات التي لا تظهر إلا عند فتحها (نوافذ وأدوات الإدارة) لتخفيف الحزمة الأولى للصفحة الرئيسية.
const AppInfoModal = dynamic(() => import("@/components/app-info-modal"), { ssr: false });
const BusinessCardModal = dynamic(() => import("@/components/business-card-modal"), { ssr: false });
const ServiceForm = dynamic(() => import("@/components/request-forms").then((m) => m.ServiceForm), { ssr: false, loading: () => <p className="muted" style={{ padding: 16, textAlign: "center" }}>جارٍ تجهيز النموذج…</p> });
const LocationPicker = dynamic(() => import("@/components/request-forms").then((m) => m.LocationPicker), { ssr: false });
const ProviderCompletionModalForm = dynamic(() => import("@/components/management-editor").then((m) => m.ProviderCompletionModalForm), { ssr: false });

const ADD_PROFESSION_INVITE = "📣 لكل أعضاء الدليل: التطبيق لسه في بدايته — أضف مهنتك أو محلك أو عيادتك الآن مجاناً وكن أول من يظهر لأهل القرية";
/** أيقونة بطاقة «أرقام تهمك» حسب نوع الجهة (إسعاف، شرطة، إطفاء، كهرباء، مياه، غاز، صحة…). */
function utilityIcon(item: { id: string; name: string; category: string; tone: string }) {
  const text = `${item.id} ${item.name} ${item.category}`;
  if (/ambulance|إسعاف|طوارئ طبية/.test(text)) return Siren;
  if (/police|شرطة|نجدة|أمن/.test(text)) return ShieldCheck;
  if (/fire|مطافئ|حريق|إطفاء|gas|غاز/.test(text)) return Flame;
  if (/electric|كهرباء/.test(text)) return Zap;
  if (/water|مياه|صرف/.test(text)) return Droplets;
  if (/health|صحة|مستشفى|رعاية/.test(text)) return Stethoscope;
  if (/daleel|office|دليل|مكتب|إدارة/.test(text)) return Building2;
  if (/complaint|شكاوى|حكوم/.test(text)) return Megaphone;
  return PhoneCall;
}
type ModalName = "service" | "location" | "contact" | "emergency" | "duty" | "utilities" | "quick" | "about" | null;

export default function Directory({ initialData, viewer, rootId, specialtyId, stageId, initialFavorites = false, guestLocked = false, onData, refreshOnMount = false }: { initialData: PublicDirectory; viewer: Viewer; rootId?: string; specialtyId?: string; stageId?: string; initialFavorites?: boolean; guestLocked?: boolean; onData?: (data: PublicDirectory) => void; refreshOnMount?: boolean }) {
  // الغلاف (DirectoryShell) يحتفظ بأحدث نسخة من البيانات حتى يفتح القسم التالي فورًا بها.
  const onDataRef = useRef(onData);
  useEffect(() => { onDataRef.current = onData; }, [onData]);
  // آخر نسخة JSON وصلت من الخادم (أو التي رُسمت بها الصفحة) لتخطي التحديثات المتطابقة.
  const lastPayloadRef = useRef<string>("");
  useEffect(() => { lastPayloadRef.current = JSON.stringify(initialData); }, [initialData]);
  const [data, setData] = useState(initialData), [modal, setModal] = useState<ModalName>(null), [detail, setDetail] = useState<ServiceRecord | null>(null);
  const [updatePhone, setUpdatePhone] = useState(""), [updateNote, setUpdateNote] = useState(""), [updateMessage, setUpdateMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false), [favorites, setFavorites] = useState<string[]>([]);
  const menuRef = useRef<HTMLElement>(null), menuButtonRef = useRef<HTMLButtonElement>(null);
  const [soundMuted, setSoundMutedState] = useState(false);
  useEffect(() => {
    const sync = () => setSoundMutedState(isSoundMuted());
    sync();
    window.addEventListener(SOUND_MUTE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(SOUND_MUTE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const [queryDraft, setQueryDraft] = useState(""), [query, setQuery] = useState(""), [rootFilter, setRootFilter] = useState(rootId ?? "");
  const [area, setArea] = useState(""), [customAddress, setCustomAddress] = useState(""), [emergency, setEmergency] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false), [now, setNow] = useState(0);
  const [clinicFilter, setClinicFilter] = useState<ClinicBookingFilter>("all");
  const [selectedShopItems, setSelectedShopItems] = useState<string[]>([]);
  const [shopOrderNote, setShopOrderNote] = useState("");
  const [shopOrderDelivery, setShopOrderDelivery] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerNow] = useState(() => Date.now());
  const [aboutFabHidden, setAboutFabHidden] = useState(false);
  const [dutyFilter, setDutyFilter] = useState<DutyFilter>("pharmacies"), [copiedUtilityId, setCopiedUtilityId] = useState("");
  const [completionService, setCompletionService] = useState<ServiceRecord | null>(null);
  const [editingUtility, setEditingUtility] = useState<Partial<PublicUtilityContact> | null>(null);
  const [utilityBusy, setUtilityBusy] = useState(false), [utilityMessage, setUtilityMessage] = useState("");
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    // كل 30 ثانية تكفي (العدّادات بالدقائق/الساعات) — كل ثانية كانت تعيد رسم الصفحة كاملة 60 مرة في الدقيقة.
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => { clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);
  useEffect(() => {
    if (window.location.hash === "#add-service") {
      if (viewer.role === "guest") { window.location.replace("/register?next=%2F%23add-service"); return; }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Deep link from the announcement ticker on auth pages.
      setModal("service");
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } else if (window.location.hash === "#about-app") {
      setModal("about");
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [viewer.role]);
  const liveDetail = detail ? data.services.find((service) => service.id === detail.id) ?? detail : null;
  const design = useMemo(() => ({ ...defaultDesignSettings, ...(data.designSettings ?? {}) }), [data.designSettings]);
  const isDark = useIsDark();
  const heroBannerSrc = resolveHeroBanner(design, isDark);
  const edgeTools = useMemo(() => parseProviderEdgeTools(design.providerEdgeTools), [design.providerEdgeTools]);
  useEffect(() => { if (specialtyId && !guestLocked) sendCategoryHit(specialtyId, "view", `page:${specialtyId}`); }, [specialtyId, guestLocked]);
  // صفحات الأقسام والتخصصات تفتح مباشرة على شبكة التخصصات/النتائج بدل أعلى الصفحة.
  useEffect(() => {
    if (!rootId) return;
    const section = document.getElementById(specialtyId ? "providers" : "categories");
    const target = section?.querySelector<HTMLElement>(".directory-section-heading") ?? section;
    if (!target) return;
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
    return () => window.cancelAnimationFrame(frame);
  }, [rootId, specialtyId]);
  const [view, setView] = useState<"all" | "favorites">(initialFavorites ? "favorites" : "all");
  const [appShareState, setAppShareState] = useState<"idle" | "shared" | "copied">("idle");
  useEffect(() => { if (appShareState === "idle") return; const timer = setTimeout(() => setAppShareState("idle"), 2600); return () => clearTimeout(timer); }, [appShareState]);
  const [featuredOpen, setFeaturedOpen] = useState(() => Boolean(initialData.designSettings?.featuredDefaultOpen));
  const [ownedServiceIds, setOwnedServiceIds] = useState<string[]>([]);
  const [logoutError, setLogoutError] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false), [suggestActive, setSuggestActive] = useState(-1);
  const [detailQr, setDetailQr] = useState(false), [detailUpdate, setDetailUpdate] = useState(false);
  const [suggestTarget, setSuggestTarget] = useState<ServiceRecord | null>(null);
  const [suggestNote, setSuggestNote] = useState(""), [suggestContact, setSuggestContact] = useState(""), [suggestState, setSuggestState] = useState<{ busy: boolean; message: string; ok: boolean }>({ busy: false, message: "", ok: false });
  function openSuggest(service: ServiceRecord) { setSuggestTarget(service); setSuggestNote(""); setSuggestContact(""); setSuggestState({ busy: false, message: "", ok: false }); }
  async function submitSuggestion(event: FormEvent) {
    event.preventDefault();
    if (!suggestTarget) return;
    setSuggestState({ busy: true, message: "", ok: false });
    try {
      const response = await fetch("/api/service-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serviceId: suggestTarget.id, action: "suggest", note: suggestNote, contact: suggestContact }) });
      const result = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      setSuggestState({ busy: false, ok: response.ok, message: result.message ?? result.error ?? (response.ok ? "تم الإرسال." : "تعذر الإرسال، حاول مرة أخرى.") });
    } catch { setSuggestState({ busy: false, ok: false, message: "تعذر الاتصال بالخادم." }); }
  }
  const [detailRatingOpen, setDetailRatingOpen] = useState(false);
  const [detailClinicOpen, setDetailClinicOpen] = useState(false);
  const [detailScheduleOpen, setDetailScheduleOpen] = useState(false);
  const [detailBadgesOpen, setDetailBadgesOpen] = useState(() => Boolean(initialData.designSettings?.badgesDefaultOpen));
  const [detailItemsOpen, setDetailItemsOpen] = useState(false);
  const [detailOfferOpen, setDetailOfferOpen] = useState(false);
  // صف العروض: نقاط أسفل الصف تبيّن عدد العروض وموقعك فيها (تتبع التمرير + نقر للانتقال).
  const offersStripRef = useRef<HTMLDivElement>(null);
  const [offerIndex, setOfferIndex] = useState(0);
  function syncOfferIndex() {
    const strip = offersStripRef.current;
    if (!strip) return;
    const center = strip.getBoundingClientRect().left + strip.clientWidth / 2;
    let best = 0, bestDistance = Number.POSITIVE_INFINITY;
    Array.from(strip.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    setOfferIndex((current) => (current === best ? current : best));
  }
  function scrollToOffer(index: number) {
    const strip = offersStripRef.current, child = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !child) return;
    const stripRect = strip.getBoundingClientRect(), rect = child.getBoundingClientRect();
    strip.scrollBy({ left: (rect.left + rect.width / 2) - (stripRect.left + stripRect.width / 2), behavior: "smooth" });
  }
  const [detailCopied, setDetailCopied] = useState(false);
  const [detailContactSaved, setDetailContactSaved] = useState(false);
  async function copyDetailPhone(phone: string) {
    try { await navigator.clipboard.writeText(phone); setDetailCopied(true); window.setTimeout(() => setDetailCopied(false), 1600); } catch { window.prompt("انسخ الرقم:", phone); }
  }
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(0), [ratingComment, setRatingComment] = useState(""), [ratingMessage, setRatingMessage] = useState(""), [ratingBusy, setRatingBusy] = useState(false);
  const [followIds, setFollowIds] = useState<string[]>([]), [feedItems, setFeedItems] = useState<FollowFeedItem[]>([]), [feedOpen, setFeedOpen] = useState(false), [followBusy, setFollowBusy] = useState(false), [followError, setFollowError] = useState("");
  const [feedSeen, setFeedSeen] = useState(() => { try { return Number(localStorage.getItem("janzour-feed-seen")) || 0; } catch { return 0; } });
  const closeModal = useCallback(() => setModal(null), []);
  const isGuest = viewer.role === "guest";
  /** «أضف مهنتك»: visitors without an account are taken straight to the membership screen and come back to the form afterwards. */
  const openAddService = useCallback(() => {
    if (isGuest) { window.location.assign("/register?next=%2F%23add-service"); return; }
    setModal("service");
  }, [isGuest]);
  /** Guests may browse, but contact numbers and section pages stay locked until they register. */
  const contactLocked = isGuest && guestLocked;
  const authNext = rootId ? `/categories/${rootId}${specialtyId ? `/${specialtyId}` : ""}` : "/";
  const registerHref = `/register?next=${encodeURIComponent(authNext)}`, loginHref = `/login?next=${encodeURIComponent(authNext)}`;
  const closeDetail = useCallback(() => {
    if (!detail) return;
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === detail.id);
    withViewTransition(() => {
      source?.style.setProperty("view-transition-name", "provider-detail");
      setDetail(null);
      setDetailRatingOpen(false);
      setDetailClinicOpen(false);
      setDetailScheduleOpen(false);
      setDetailItemsOpen(false);
      setDetailOfferOpen(false);
    }, () => source?.style.removeProperty("view-transition-name"));
  }, [detail]);
  function openDetail(service: ServiceRecord, options?: { offer?: boolean }) {
    trackDirectoryEvent({ kind: "view", label: service.name, serviceId: service.id, categoryId: service.category });
    setDetailItemsOpen(false); setDetailOfferOpen(Boolean(options?.offer));
    // فتح من العدّاد التنازلي: نُظهر قسم العرض مفتوحًا ونمرّر إليه بعد انتهاء الانتقال.
    if (options?.offer) window.setTimeout(() => document.querySelector(".detail-modal .detail-offer")?.scrollIntoView({ behavior: "smooth", block: "center" }), 420);
    const source = Array.from(document.querySelectorAll<HTMLElement>(".provider-card")).find((card) => card.dataset.serviceId === service.id);
    source?.style.setProperty("view-transition-name", "provider-detail");
    withViewTransition(() => {
      source?.style.removeProperty("view-transition-name");
      setDetail(service);
      setDetailQr(false); setDetailUpdate(false); setDetailRatingOpen(false); setDetailClinicOpen(false); setDetailScheduleOpen(false);
      setDetailBadgesOpen(Boolean(design.badgesDefaultOpen));
      setRatingStars(0); setRatingComment(""); setRatingMessage("");
      setSelectedShopItems([]); setShopOrderNote(""); setShopOrderDelivery(supportsHomeDelivery(service));
    });
  }
  const { settings, categories, services } = data;
  async function saveDetailContact(service: ServiceRecord) {
    const origin = window.location.origin;
    await saveVCard(serviceVCard(service, getCategory(service.category, categories), settings.siteName, origin), service.name);
    setDetailContactSaved(true); window.setTimeout(() => setDetailContactSaved(false), 1800);
  }
  const roots = categories.filter((category) => !category.parentId);
  const root = rootId ? getCategory(rootId, categories) : null, specialty = specialtyId ? getCategory(specialtyId, categories) : null;
  const scoped = Boolean(rootId), isHome = !scoped;
  // قسم المدرسين: المرحلة الدراسية المختارة من الرابط (?stage=)، وشاشة الاختيار تظهر تلقائيًا لو لم تُحدد.
  const isTeachersContext = rootId === TEACHERS_ROOT_ID || specialty?.parentId === TEACHERS_ROOT_ID;
  const stage = isTeachersContext ? getTeacherStage(stageId) : null;
  const [stageModalOpen, setStageModalOpen] = useState(rootId === TEACHERS_ROOT_ID && !specialtyId && !stage);
  const stageCounts = useMemo(() => Object.fromEntries(TEACHER_STAGES.map((item) => [item.id, categories.filter((category) => category.active && category.parentId === TEACHERS_ROOT_ID && categoryInStage(category, item.id)).length])), [categories]);
  const whatsapp = whatsappUrl(settings.phone);
  const adSlot = <AdRotator ads={data.ads ?? []} services={data.services} categories={categories} adminPhone={settings.phone} siteName={settings.siteName} logoUrl={design.headerLogoUrl} pricing={data.adPricing ?? null} onOpenService={(service) => openDetail(service)}/>;
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const serviceParam = params.get("service");
      if (serviceParam) {
        const match = initialData.services.find((item) => item.id === serviceParam);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Open deep-linked service card from QR/shared link on mount.
        if (match) { setDetail(match); if (params.get("rate") === "1") setDetailRatingOpen(true); }
      }
    } catch { /* Ignore URL parsing errors */ }
  }, [initialData.services]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    // الضغط في أي مكان خارج القائمة أو زرها يغلقها (وليس زر القائمة فقط).
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer, true); };
  }, [menuOpen]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-only favorites and owned services after server rendering.
    try { const stored: unknown = JSON.parse(localStorage.getItem("elgamal-favorites") ?? "[]"); if (Array.isArray(stored)) setFavorites(stored.filter((id): id is string => typeof id === "string")); } catch { /* Use session-only favorites if storage is unavailable. */ }
    try { const storedOwned: unknown = JSON.parse(localStorage.getItem("janzour-owned-services") ?? "[]"); if (Array.isArray(storedOwned)) setOwnedServiceIds(storedOwned.filter((id): id is string => typeof id === "string")); } catch { /* Ignore storage issues. */ }
    let disposed = false;
    // لا نعيد رسم الدليل كله إلا إذا تغيّرت البيانات فعلًا: نقارن نص الاستجابة بآخر نسخة معروفة
    // (المقارنة النصية أرخص بكثير من إعادة رسم مئات الكروت على الهاتف كل 30 ثانية أو عند كل رجوع للتبويب).
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/services", { cache: "no-store" });
        if (!response.ok || disposed) return;
        const text = await response.text();
        if (text === lastPayloadRef.current) return;
        lastPayloadRef.current = text;
        const fresh = JSON.parse(text) as PublicDirectory;
        setData(fresh); onDataRef.current?.(fresh);
      } catch { /* Preserve the directory on temporary network failures. */ }
    };
    // عند الفتح الفوري من بيانات الجهاز (تنقّل داخلي) نحدّث بهدوء في الخلفية فورًا.
    if (refreshOnMount) void refresh();
    const timer = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refreshOnMount]);
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
  // إشعارات شخصية فقط: طلبات استكمال/تصحيح لخدمات هذا العضو نفسه، ورسائل الإدارة عن خدماته، والجديد في تخصصاته المتابَعة.
  const completionAlerts = useMemo(
    () => viewer.role === "guest" ? [] : services.filter((service) => (service.completionStatus === "requested" || service.completionStatus === "rejected") && isServiceOwner(service, viewer, ownedServiceIds)),
    [services, viewer, ownedServiceIds],
  );
  const providerAlerts = useMemo(
    () => (data.providerNotifications ?? []).flatMap((notif) => {
      const service = services.find((entry) => entry.id === notif.entityId);
      return service && isServiceOwner(service, viewer, ownedServiceIds) ? [{ notif, service }] : [];
    }),
    [data.providerNotifications, services, viewer, ownedServiceIds],
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
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  async function shareApp() {
    const url = `${window.location.origin}/`;
    const text = `📱 دليل المهن والخدمات بقرية جنزور\nكل الحرفيين والعيادات والمحلات والخدمات في مكان واحد.. ابحث واتصل بضغطة واحدة 👇\n${url}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "دليل جنزور", text, url }); setAppShareState("shared"); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(text); setAppShareState("copied"); }
    catch { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); }
  }
  async function shareService(service: ServiceRecord) {
    trackDirectoryEvent({ kind: "share", label: service.name, serviceId: service.id, categoryId: service.category });
    const url = `${window.location.origin}/?service=${encodeURIComponent(service.id)}`;
    const text = `${service.name} - ${getCategory(service.category, categories).name}${service.area ? ` - ${service.area}` : ""}${service.phone ? `\nالهاتف: ${service.phone}` : ""}\nمن دليل جنزور: ${url}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: service.name, text, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  function toggleFavorite(id: string) { setFavorites((current) => { const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]; try { localStorage.setItem("elgamal-favorites", JSON.stringify(next)); } catch { /* Favorites still work during this visit. */ } return next; }); }
  function scrollToProviders() { setTimeout(() => document.getElementById("providers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function showFavorites() { if (scoped) { window.history.pushState(null, "", "/?favorites=1"); window.dispatchEvent(new PopStateEvent("popstate")); return; } setView("favorites"); setRootFilter(""); setArea(""); setCustomAddress(""); setEmergency(false); setQuery(""); setQueryDraft(""); setMenuOpen(false); scrollToProviders(); }
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
  function clearFilters() { setRootFilter(rootId ?? ""); setArea(""); setCustomAddress(""); setQuery(""); setQueryDraft(""); setEmergency(false); setDeliveryOnly(false); setClinicFilter("all"); setView("all"); }
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
  const isShopsContext = Boolean(rootId === "shops" || rootFilter === "shops" || (specialty && specialty.parentId === "shops"));
  const isClinicsContext = Boolean(rootId === "clinics" || rootFilter === "clinics" || (specialty && specialty.parentId === "clinics"));
  const activeDeliveryOnly = isShopsContext && deliveryOnly;
  const activeClinicFilter: ClinicBookingFilter = isClinicsContext ? clinicFilter : "all";
  const activeSpecialtyId = specialtyId ?? "";
  const filteredServices = useMemo(() => services
    .filter((service) => {
      const item = getCategory(service.category, categories);
      return (!activeDeliveryOnly || supportsHomeDelivery(service))
        && (!isClinicsContext || activeClinicFilter === "all" || matchesClinicFilter(service, activeClinicFilter, now || undefined))
        && (!activeSpecialtyId || service.category === activeSpecialtyId || (specialty ? serviceTeachesSubject(service, specialty) : false))
        && (!stage || serviceInStage(service, stage.id))
        && (!rootFilter || item.parentId === rootFilter || item.id === rootFilter)
        && (!query || matchesServiceQuery(service, item.name, query))
        && (!area || service.area === area)
        && (area !== OTHER_ADDRESS || !customAddress || normalizeSearch(service.address).includes(normalizeSearch(customAddress)))
        && (!emergency || service.emergency)
        && (view !== "favorites" || favorites.includes(service.id));
    }), [services, categories, activeSpecialtyId, specialty, stage, rootFilter, query, area, customAddress, emergency, view, favorites, activeDeliveryOnly, isClinicsContext, activeClinicFilter, now]);
  const isFiltering = Boolean(activeDeliveryOnly || (isClinicsContext && activeClinicFilter !== "all") || query || area || emergency || view === "favorites" || (!rootId && rootFilter));
  const isFeaturedCollapsible = !isFiltering && !specialty;
  const showProvidersList = !isFeaturedCollapsible || featuredOpen;
  const featured = filteredServices.filter((service) => service.featured);
  const visibleServices = isFiltering || activeSpecialtyId ? filteredServices : (featured.length ? featured : filteredServices);
  const activeSpecialtyCategory = activeSpecialtyId ? getCategory(activeSpecialtyId, categories) : specialty;
  const providerTitle = view === "favorites" ? "خدماتك المفضلة" : emergency ? "خدمات الطوارئ" : activeDeliveryOnly && !specialty ? "محلات توفر التوصيل للمنازل بجنزور" : activeSpecialtyCategory ? `${rootId === "clinics" ? "أطباء" : "مقدمو خدمات"} ${activeSpecialtyCategory.name}` : isFiltering ? "نتائج البحث" : root ? `خدمات ${root.name} المميزة في جنزور` : "مقدمو الخدمات المميزين";
  // شكل أيقونات التخصصات (فلات/مجسمة) يخص التخصصات فقط؛ الأقسام الرئيسية تحتفظ بشكلها.
  const flatSpecialties = design.specialtyIconStyle === "flat";
  const specArt3d = design.specialtyArt3d && !flatSpecialties;
  const specSticker = design.specialtyStickerIcons && !flatSpecialties;
  const hasSticker = (category: { id: string; imageVersion?: number; parentId?: string | null }) => Boolean(design.specialtyStickerIcons && categoryStickerSrc(category)) && !(flatSpecialties && category.parentId);
  const displayedCategories = root ? categories.filter((category) => category.parentId === root.id && (!stage || categoryInStage(category, stage.id))) : roots;
  const title = specialty ? `${specialty.name}${stage ? ` (${stage.short})` : ""} بقرية جنزور` : root ? `${stage ? `مدرسين ${stage.name}` : root.name} بقرية جنزور` : settings.siteName;
  function categoryCount(category: CategoryRecord) {
    if (category.parentId) {
      return services.filter((service) => service.category === category.id && (!isClinicsContext || activeClinicFilter === "all" || matchesClinicFilter(service, activeClinicFilter, now || undefined))).length;
    }
    return categories.filter((item) => item.parentId === category.id).length;
  }

  const suggestions = query && filteredServices.length === 0 && view !== "favorites" ? suggestSpecialties(query, categories, services, rootId) : [];
  // Live autocomplete: matching specialties open their page, matching services jump straight to the results (with VIP sponsors prioritized first #6).
  const searchSuggestions = useMemo(() => {
    const term = normalizeSearch(queryDraft.trim());
    if (term.length < 2) return [];
    const specialties = categories.flatMap((category) => category.active && category.parentId && (!rootId || category.parentId === rootId) && normalizeSearch(`${category.name} ${getSpecialtyKeywords(category.id)}`).includes(term) ? [{ kind: "specialty" as const, id: category.id, label: category.name, hint: `تخصص • ${getCategory(category.parentId, categories).name}`, href: `/categories/${category.parentId}/${category.id}`, isSponsor: false }] : []);
    const services_ = services
      .filter((service) => matchesServiceQuery(service, getCategory(service.category, categories).name, queryDraft))
      .slice(0, 4)
      .map((service) => ({
        kind: "service" as const,
        id: service.id,
        label: service.name,
        hint: getCategory(service.category, categories).name,
        href: "",
        isSponsor: false,
      }));
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
  const offerServices = useMemo(() => servicesWithOffers(services, now || undefined), [services, now]);
  const dutyServices = useMemo(() => getOnDutyServices(services, categories, dutyFilter, now), [services, categories, dutyFilter, now]);
  const utilityNumbers = data.utilityNumbers && data.utilityNumbers.length > 0 ? data.utilityNumbers : publicUtilityNumbers;
  const isAdmin = viewer.role === "admin";
  // إشعارات الإدارة في قائمة ☰ (بدل الجرس العائم): نجلب العدد عند الفتح ثم كل 30 ثانية.
  const [adminFeed, setAdminFeed] = useState<AdminFeed>({ notifications: [], unread: 0 });
  const [adminFeedOpen, setAdminFeedOpen] = useState(false);
  useEffect(() => {
    if (!isAdmin || data.previewMode) return;
    let disposed = false;
    let seenIds: Set<string> | null = null;
    const load = () => { if (document.hidden) return; void fetchAdminFeed().then((next) => { if (!next || disposed) return; seenIds = chimeForNewItems(seenIds, next); setAdminFeed(next); }); };
    load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, [isAdmin, data.previewMode]);
  const menuUnread = isAdmin ? adminFeed.unread : feedUnread;
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
    const items = parseAnnouncementItems(design);
    const hasInvite = items.some((item) => item.includes("مهنتك") || item.includes("نشاطك"));
    // Seasonal greetings + the nearest village event lead the ticker (computed server-side so SSR and hydration agree).
    const live = liveTickerItems(data.greetings, data.events, new Date(tickerNow));
    return [...live, ...(hasInvite ? items : [...items, ADD_PROFESSION_INVITE])];
  }, [design, data.greetings, data.events, tickerNow]);
  const seasonBadge = data.greetings?.[0] ?? null;
  const isRotatingTickerMode =
    design.announcementTickerMode === "rotate" ||
    design.announcementTickerMode === "vertical-slide" ||
    design.announcementTickerMode === "pulse-glow" ||
    design.announcementTickerMode === "bounce";
  useEffect(() => {
    if (!design.announcementEnabled || !isRotatingTickerMode || announcementList.length <= 1) return;
    const speedMap: Record<string, number> = {
      "ultra-slow": 12000,
      "very-slow": 9500,
      slow: 7000,
      normal: 4800,
      "medium-fast": 3800,
      fast: 3000,
      "very-fast": 2400,
      turbo: 1900,
      flash: 1400,
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
            width={44}
            height={44}
            decoding="async"
            fetchPriority="high"
          />
          <div className="site-header-brand-copy">
            <strong>دليل جنزور</strong>
            <span>المهن والخدمات</span>
          </div>
        </Link>
        {seasonBadge && <span className="season-badge" title={seasonBadge.message} aria-label={seasonBadge.name}><i aria-hidden="true">{seasonBadge.icon}</i><span>{seasonBadge.name}</span></span>}
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
                <span>تسجيل</span>
              </Link>
              <Link href="/register" className="header-auth-btn is-register">
                <UserPlus size={15}/>
                <span>إنشاء عضوية</span>
              </Link>
            </div>
          ) : null}
          <NotifyToggle className="header-notify" sections={categories.filter((category) => !category.parentId && category.active).map((category) => ({ id: category.id, name: category.name }))}/>
          <button
            type="button"
            className={`sound-toggle ${soundMuted ? "is-muted" : ""}`}
            aria-pressed={soundMuted}
            aria-label={soundMuted ? "تشغيل صوت النقرات" : "كتم صوت النقرات"}
            title={soundMuted ? "الصوت مكتوم — اضغط للتشغيل" : "كتم صوت النقرات"}
            onClick={() => setSoundMuted(!soundMuted)}
            data-no-feedback
          >
            {soundMuted ? <VolumeX size={17}/> : <Volume2 size={17}/>}
          </button>
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
            ref={menuButtonRef} className={`header-menu-toggle-btn mobile-menu-button is-icon-only ${menuOpen ? "is-open" : ""}`}
            onClick={() => { menuFeedback(!menuOpen); setMenuOpen((open) => !open); }} data-no-feedback
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21}/> : <Menu size={21}/>}
            {!menuOpen && menuUnread > 0 && <span className="header-menu-unread-dot" aria-hidden="true"/>}
          </button>
        </div>
        {menuOpen && (
          <div className="header-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true"/>
        )}
        <nav ref={menuRef} className={`main-nav header-dropdown-menu ${menuOpen ? "nav-open" : ""}`} aria-label="القائمة الرئيسية وأدوات الموقع">
          <div className="header-menu-section-title">التنقل السريع</div>
          <Link href="/" className={isHome && !isFiltering ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Search size={17}/>
            <span>الرئيسية</span>
          </Link>
          <a href={isHome ? "#categories" : "/#categories"} className={scoped ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Grid2X2 size={17}/>
            <span>أقسام وتصنيفات الدليل</span>
          </a>
          <button type="button" onClick={() => { setMenuOpen(false); openAddService(); }}>
            <CirclePlus size={17}/>
            <span>أضف مهنتك للدليل</span>
          </button>
          {design.showHeaderFavorites && (
            <button type="button" className={view === "favorites" ? "active" : ""} onClick={showFavorites}>
              <Heart size={17}/>
              <span>المفضلة</span>
              {favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}
            </button>
          )}
          <Link href="/events" onClick={() => setMenuOpen(false)}>
            <CalendarDays size={17}/>
            <span>مناسبات القرية</span>
            {(data.events ?? []).some((event) => eventPhase(event, new Date(tickerNow)) === "today") && <span className="nav-count is-alert">اليوم</span>}
          </Link>
          <Link href="/advertise" onClick={() => setMenuOpen(false)}>
            <Megaphone size={17}/>
            <span>أعلن معنا</span>
          </Link>
          <div className="header-menu-divider" role="separator"/>
          <div className="header-menu-section-title">الأدوات</div>
          {isAdmin && (
            <button type="button" onClick={() => { setMenuOpen(false); setAdminFeedOpen(true); }}>
              <BellRing size={17}/>
              <span>إشعارات الإدارة</span>
              {adminFeed.unread > 0 && <span className="nav-count is-alert">{adminFeed.unread > 99 ? "99+" : adminFeed.unread}</span>}
            </button>
          )}
          {design.showHeaderBell && viewer.role !== "guest" && !isAdmin && (
            <button type="button" onClick={() => { setMenuOpen(false); openFeed(); }}>
              <BellRing size={17}/>
              <span>إشعاراتي</span>
              {feedUnread > 0 && <span className="nav-count is-alert">{feedUnread > 99 ? "99+" : feedUnread}</span>}
            </button>
          )}
          <button type="button" className="menu-install-item" onClick={() => { setMenuOpen(false); openInstallAppModal(); }}>
            <Smartphone size={17}/>
            <span>تثبيت التطبيق على الموبايل</span>
            <span className="nav-count is-on">QR</span>
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
    {(scoped || design.showHero) && <section className={`hero ${scoped ? "category-page-hero" : "hero-with-banner"}`} aria-labelledby="hero-title"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/><svg className="hero-skyline" viewBox="0 0 1440 210" preserveAspectRatio="none" aria-hidden="true"><path d="M0 210V105h43V81h32v50h29V64h32V22h8V0h6v22h10v42h29v83h27v-39h24V77h22v31h20v102h31V97h33v28h17V65h50v145h42v-65h22v-20h29v20h28v65h33V79h26V36h8V15h5v21h9v43h31v131h32v-86h22V98h38v26h24v86h31V73h49v35h29v102h45V94h31V62h40v148h29v-62h50v62h50V99h34V80h21v19h32v111h41V64h29V26h9V5h5v21h12v38h30v146h42V91h47v119h31V70h26V40h23v30h22v140h37v-63h52v63h34v-98h26V79h31v33h20v98Z"/></svg>{!scoped && <div className={`hero-banner-wrap is-h-${design.heroBannerHeight || "auto"} is-fit-${design.heroBannerFit || "cover"}`} style={{ "--hero-overlay": (design.heroBannerOverlay || 0) / 100 } as CSSProperties}><Image key={heroBannerSrc} src={heroBannerSrc} alt="دليل المهن والخدمات بقرية جنزور، كل أرقام المهنيين والخدمات والمشاريع في مكان واحد" width={3072} height={1152} sizes="(max-width: 700px) 100vw, (max-width: 1378px) 90vw, 1240px" quality={92} priority/>{(design.heroBannerOverlay || 0) > 0 && <span className="hero-banner-overlay" aria-hidden="true"/>}{design.heroBannerText && <div className="hero-banner-text"><strong>{settings.siteName}</strong>{settings.heroSubtitle && <span>{settings.heroSubtitle}</span>}</div>}</div>}<div className="container hero-inner"><div className="hero-visual"><span className="hero-floating-tag"><CheckCircle2 size={16}/> من أهل القرية.. لأهل القرية</span></div><div className="hero-copy">{scoped ? <nav className="hero-breadcrumb" aria-label="مسار الصفحة"><Link href="/">الرئيسية</Link><ChevronLeft size={13}/>{specialty ? <><Link href={stageHref(rootId ?? "", stage?.id)}>{root?.name}</Link>{stage && <><ChevronLeft size={13}/><Link href={stageHref(rootId ?? "", stage.id)}>{stage.short}</Link></>}<ChevronLeft size={13}/><span>{specialty.name}</span></> : stage ? <><Link href={`/categories/${rootId}`}>{root?.name}</Link><ChevronLeft size={13}/><span>{stage.name}</span></> : <span>{root?.name}</span>}</nav> : <div className="hero-eyebrow"><Sparkles size={15}/>{settings.heroEyebrow}</div>}<h1 id="hero-title">{title}</h1>{!scoped && <><p className="hero-subtitle">{settings.heroSubtitle}</p><p className="hero-tagline">{settings.tagline}</p></>}
    {design.announcementEnabled && announcementList.length > 0 && (
      <div
        className={`site-announcement-ticker-card is-${design.announcementStyle} is-mode-${design.announcementTickerMode || "marquee"}`}
        style={{ "--ticker-bg": design.announcementBgColor } as CSSProperties}
      >
        <span className="ticker-badge-icon"><Sparkles size={15}/></span>
        {design.announcementTickerMode === "marquee" || design.announcementTickerMode === "marquee-reverse" ? (
          <div className={`site-announcement-marquee is-speed-${design.announcementSpeed || "normal"} ${design.announcementTickerMode === "marquee-reverse" ? "is-reverse" : ""}`} aria-label="شريط الأخبار والتنبيهات">
            <div className="site-announcement-marquee-track">
              {[...announcementList, ...announcementList].map((item, idx) => (
                <TickerText key={`${idx}-${item}`} text={item} className="site-announcement-marquee-item">
                  <i aria-hidden="true">•</i>
                </TickerText>
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
            <TickerText className={`announcement-rotate-text is-anim-${design.announcementTickerMode}`} key={tickerIndex % announcementList.length} text={announcementList[tickerIndex % announcementList.length]}/>
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
          <TickerText className="announcement-single-text" text={design.announcementText || announcementList[0] || ""}/>
        )}
        <button type="button" className="ticker-add-cta" onClick={() => openAddService()}>
          <CirclePlus size={14}/><span>أضف مهنتك</span>
        </button>
      </div>
    )}
    </div></div></section>}
    <div className="container directory-layout"><aside className="directory-sidebar" aria-label="الخدمات السريعة" hidden><div className="quick-links-card"><h2>الخدمات السريعة <Sparkles size={17}/></h2>{settings.showEmergency && <button onClick={showEmergency}><span className="quick-icon quick-red"><Siren size={25}/></span>خدمات الطوارئ<ChevronLeft size={15}/></button>}<button onClick={() => setModal("location")}><span className="quick-icon quick-blue"><MapPinned size={24}/></span>ابحث حسب العنوان<ChevronLeft size={15}/></button><button className="add-service-quick-link" onClick={() => openAddService()}><span className="quick-icon quick-green"><CirclePlus size={25}/></span>أضف مهنتك مجانًا<ChevronLeft size={15}/></button><button onClick={showFavorites}><span className="quick-icon quick-pink"><Heart size={25} fill="currentColor"/></span>المفضلة<ChevronLeft size={15}/></button></div><div className="community-card"><span><UsersRound size={28}/></span><strong>{data.memberCount}</strong><h2>عضو في مجتمع جنزور</h2><p>العضوية غير إضافة المهنة.. انضم وخليك واحد من أهل الدليل.</p><Link href={viewer.role === "guest" ? "/register" : viewer.role === "admin" ? "/admin?tab=members" : viewer.role === "moderator" ? "/admin" : "/account"} className="button button-soft">{viewer.role === "guest" ? "انضم للموقع" : viewer.role === "admin" ? "إدارة الأعضاء" : viewer.role === "moderator" ? "لوحة المشرف" : "حساب عضويتك"}<ArrowLeft size={15}/></Link></div><div className="verified-card"><ShieldCheck size={47}/><div><strong>النشر بعد المراجعة</strong><span><CheckCircle2 size={14}/> الإدارة بتراجع كل طلب</span></div></div></aside>
    <main id="main-content" tabIndex={-1} className="directory-main directory-ordered-main">
      <a href="#main-content" className="skip-to-content">تخطَّ إلى نتائج البحث</a>
      {contactLocked && scoped ? (<>
        <div className="categories-top-action-stack">{adSlot}</div>
        <GuestGateCard sectionName={specialty?.name ?? (rootId ? getCategory(rootId, categories).name : "")} registerHref={registerHref} loginHref={loginHref}/>
      </>) : (<>
      {specialty && (
        <div className="categories-top-action-stack" style={scoped ? { order: 0 } : { order: sectionOrderIndex("categories", 3) - 1 }}>
        {adSlot}
        <div
          className="categories-top-action-frame"
          role="region"
          aria-label="البحث السريع وإضافة مهنة"
        >
          <button
            type="button"
            className="search-icon-only-trigger-btn"
            aria-label="فتح نافذة البحث في الدليل"
            title="بحث في الدليل"
            onClick={() => {
              setSearchModalOpen(true);
            }}
          >
            <Search size={22}/>
            <span>بحث</span>
          </button>
          <button
            type="button"
            className="button button-success compact-add-service-btn"
            onClick={() => openAddService()}
          >
            <CirclePlus size={20}/>
            <span>أضف مهنتك</span>
          </button>
        </div>
        </div>
      )}
      {!specialty && (scoped || design.showCategoriesSection) && (
        <section
          id="categories"
          className="categories-section"
          style={scoped ? { order: 2 } : { order: sectionOrderIndex("categories", 3) }}
        >
          {adSlot}
          <div className="categories-top-action-frame" role="region" aria-label="البحث السريع وإضافة مهنة">
            <button
              type="button"
              className="search-icon-only-trigger-btn"
              aria-label="فتح نافذة البحث في الدليل"
              title="بحث في الدليل"
              onClick={() => {
                setSearchModalOpen(true);
              }}
            >
              <Search size={22}/>
              <span>بحث</span>
            </button>
            <button
              type="button"
              className="button button-success compact-add-service-btn"
              onClick={() => openAddService()}
            >
              <CirclePlus size={20}/>
              <span>أضف مهنتك</span>
            </button>
          </div>
          <div className="section-heading directory-section-heading">
            <div>
              <h2><Grid2X2 size={23}/>{root ? `تخصصات ${stage ? stage.name : root.name}` : "تصفح أقسام القرية"}</h2>
            </div>
            <span className="section-count">{displayedCategories.length} {root ? "تخصص" : "أقسام رئيسية"}</span>
          </div>
          {rootId === TEACHERS_ROOT_ID && <div className="stage-switcher" role="navigation" aria-label="المرحلة الدراسية">
            {TEACHER_STAGES.map((item) => <Link key={item.id} href={stageHref(TEACHERS_ROOT_ID, item.id)} className={`stage-chip ${stage?.id === item.id ? "is-active" : ""}`} style={{ "--stage-color": item.color } as CSSProperties} aria-current={stage?.id === item.id ? "page" : undefined}><StickerIcon src={item.sticker} size={26}/>{item.short}</Link>)}
            <Link href={stageHref(TEACHERS_ROOT_ID, null)} className={`stage-chip stage-chip-all ${!stage ? "is-active" : ""}`} aria-current={!stage ? "page" : undefined}>كل المراحل</Link>
            <button type="button" className="stage-chip stage-chip-change" onClick={() => setStageModalOpen(true)}><Grid2X2 size={15}/> اختيار المرحلة</button>
          </div>}
          <div className={`category-grid ${root ? "specialties-grid" : "main-category-grid"}`}>
            {displayedCategories.map((category) => {
              const href = category.parentId ? stageHref(category.parentId, category.parentId === TEACHERS_ROOT_ID ? stage?.id : null, category.id) : `/categories/${category.id}`;
              const opensStageChooser = !category.parentId && category.id === TEACHERS_ROOT_ID;
              return (
                <Link
                  key={category.id}
                  href={href}
                  aria-label={category.name}
                  aria-haspopup={opensStageChooser ? "dialog" : undefined}
                  onClick={opensStageChooser ? (event) => { event.preventDefault(); setStageModalOpen(true); } : undefined}
                  className="category-tile"
                  style={{ "--category-color": category.color, "--category-light": category.light } as CSSProperties}
                >
                  <span className={`category-icon ${hasSticker(category) ? "has-profession-art has-sticker" : (category.parentId ? specArt3d : design.specialtyArt3d && hasProfessionArt(category.id)) ? "has-profession-art" : ""}`}>{hasSticker(category) ? <StickerIcon src={categoryStickerSrc(category)} size={category.parentId ? 78 : 76}/> : (category.parentId ? specArt3d : design.specialtyArt3d && hasProfessionArt(category.id)) ? <SpecialtyIcon category={category} size={category.parentId ? 56 : 76} art3d/> : category.parentId ? <CategoryIcon icon={category.icon} size={35}/> : <MainCategoryIcon icon={category.icon} art={category.art}/>}</span>
                  <strong>{category.name}</strong>
                  <span className="category-meta">{categoryCount(category)} {category.parentId ? "مقدم خدمة" : "تخصص"}<ChevronLeft size={12}/></span>
                </Link>
              );
            })}
          </div>
          {!displayedCategories.length && <div className="empty-state"><h3>التخصصات قيد التجهيز</h3><p>{stage ? `الإدارة هتضيف تخصصات ${stage.name} قريبًا.` : "الإدارة هتضيف تخصصات القسم قريبًا."}</p></div>}
        </section>
      )}
      {(scoped || isFiltering || design.showFeaturedSection) && <section id="providers" className={`providers-section ${specialty ? "specialty-providers" : ""}`} style={scoped ? { order: 3 } : { order: sectionOrderIndex("featured", 2) }}>{isFeaturedCollapsible ? (
        <div className={`featured-strip ${featuredOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="featured-strip-main"
            aria-expanded={featuredOpen}
            aria-controls="featured-providers-panel"
            onClick={() => setFeaturedOpen((open) => !open)}
          >
            <span className="featured-strip-icon" aria-hidden="true"><Crown size={22}/></span>
            <span className="featured-strip-text">
              <span className="featured-strip-title-row">
                <h2 className="featured-strip-title">{providerTitle}</h2>
                {visibleServices.length > 0 && <span className="featured-strip-count">{visibleServices.length} مميز</span>}
              </span>
              <span className="featured-strip-subtitle">نخبة من المهنيين والخدمات المميزة في قرية جنزور</span>
            </span>
            <span className="featured-strip-arrow" aria-hidden="true">
              <ChevronDown size={22}/>
            </span>
          </button>
          {isShopsContext && (
            <div className="featured-strip-actions">
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
          <span className="featured-strip-hint">{featuredOpen ? "اضغط السهم لإخفاء المميزين" : "اضغط السهم لعرض المميزين"}</span>
        </div>
      ) : (
        <div className="section-heading directory-section-heading"><div><h2>{view === "favorites" ? <Heart size={22} className="pink-icon"/> : emergency ? <Siren size={24} className="red-icon"/> : activeSpecialtyCategory ? <UsersRound size={23}/> : <Crown size={23} className="crown-icon"/>}{providerTitle}</h2>{(isFiltering || activeSpecialtyCategory) && <p aria-live="polite">{filteredServices.length} مقدم خدمة متاح في الدليل</p>}</div><div className="section-heading-actions">{specialty && viewer.role !== "guest" && <button type="button" className={`follow-toggle ${isFollowed ? "is-on" : ""}`} aria-pressed={isFollowed} disabled={followBusy} onClick={() => void toggleFollow()}><BellRing size={15}/><span>{isFollowed ? "إلغاء المتابعة" : "متابعة التخصص"}</span></button>}{specialty && viewer.role !== "guest" && followError && <small className="follow-error" role="alert">{followError}</small>}{isShopsContext && <button type="button" className={`availability-toggle delivery-filter-toggle ${deliveryOnly ? "is-on" : ""}`} aria-pressed={deliveryOnly} onClick={() => setDeliveryOnly(!deliveryOnly)}><Truck size={15} aria-hidden="true"/><span>يوجد توصيل</span></button>}</div></div>
      )}
      {isFiltering && <div className="filter-tags">{view === "favorites" && <span><Heart size={13}/>المفضلة</span>}{query && <span>{query}<button onClick={() => { setQuery(""); setQueryDraft(""); }} aria-label="إزالة كلمة البحث"><X size={12}/></button></span>}{!scoped && rootFilter && <span>{getCategory(rootFilter, categories).name}</span>}{area && <span><MapPin size={12}/>{area === OTHER_ADDRESS ? customAddress || OTHER_ADDRESS : area}<button onClick={() => { setArea(""); setCustomAddress(""); }} aria-label="إزالة العنوان"><X size={12}/></button></span>}{emergency && <span className="emergency-filter">خدمات الطوارئ</span>}{activeDeliveryOnly && <span className="delivery-filter-tag"><Truck size={13}/>يوجد توصيل للمنازل<button onClick={() => setDeliveryOnly(false)} aria-label="إزالة فلتر التوصيل"><X size={12}/></button></span>}{isClinicsContext && activeClinicFilter !== "all" && <span className="clinic-filter-tag"><Stethoscope size={13}/>{activeClinicFilter === "appointment" ? "بحجز مسبق" : activeClinicFilter === "walk-in" ? "بأسبقية الحضور" : "متواجد اليوم"}<button onClick={() => setClinicFilter("all")} aria-label="إزالة فلتر العيادة"><X size={12}/></button></span>}<button className="clear-filters" onClick={clearFilters}>مسح الفلاتر</button></div>}{showProvidersList && (visibleServices.length ? <div className={`provider-grid ${isFeaturedCollapsible ? "featured-strip-panel" : ""}`} id={isFeaturedCollapsible ? "featured-providers-panel" : undefined}>{visibleServices.map((service) => <ProviderCard art3d={specArt3d} sticker={specSticker} key={service.id} service={service} categories={categories} category={getCategory(service.category, categories)} favorite={favorites.includes(service.id)} now={now} showAdminQuickEdit={Boolean(isAdmin && design.showAdminQuickEdit)} edgeTools={edgeTools} onOpen={openDetail} onOpenCompletion={(item) => setCompletionService(item)} onShare={(item) => void shareService(item)} onSuggest={openSuggest} onToggleFavorite={toggleFavorite}/>)}</div> : <div className="empty-state"><span><SearchX size={36}/></span><h3>{view === "favorites" ? "مفضلتك لسه فاضية" : "لسه مفيش خدمات مطابقة"}</h3><p>{view === "favorites" ? "اضغط على القلب بجانب أي خدمة عشان ترجع لها بسهولة." : "كن أول مقدم خدمة هنا.. أضف بياناتك والإدارة هتراجعها قبل النشر."}</p><button className="button button-soft" onClick={view === "favorites" ? clearFilters : () => openAddService()}>{view === "favorites" ? "تصفح الخدمات" : "أضف مهنتك مجانًا"}<ArrowLeft size={16}/></button></div>)}</section>}
      {!scoped && !isFiltering && design.showOffersSection && offerServices.length > 0 && (
        <section className="container offers-section" aria-labelledby="offers-title" style={{ order: sectionOrderIndex("offers", 3) }}>
          <div className="offers-head">
            <h2 id="offers-title"><BadgePercent size={20}/>عروض وخصومات محدودة المدة<span className="offers-count">{offerServices.length}</span></h2>
            <p>اضغط على العرض لفتح بطاقة مقدم العرض</p>
          </div>
          <div className="offers-strip" role="list" ref={offersStripRef} onScroll={syncOfferIndex}>
            {offerServices.slice(0, 12).map((service) => {
              const cat = getCategory(service.category, categories);
              const offer = activeOffer(service, now || undefined)!;
              const left = offerTimeLeft(offer, now || undefined);
              return (
                <button type="button" key={service.id} role="listitem" className="offer-card" style={categoryTheme(cat)} onClick={() => openDetail(service)} aria-label={`عرض ${service.name}: ${offer.title}`}>
                  {isNewOffer(service, now || undefined) && <span className="offer-card-new"><Sparkles size={11} aria-hidden="true"/>جديد</span>}
                  <span className="offer-card-icon"><SpecialtyIcon category={cat} size={44} art3d sticker/></span>
                  <span className="offer-card-body">
                    <strong className="offer-card-title">{offer.title}</strong>
                    <span className="offer-card-name">{service.name}</span>
                    <span className="offer-card-meta"><span className="offer-card-cat">{cat.name}</span><em className={`offer-countdown ${left.urgent ? "is-urgent" : left.days <= 3 ? "is-soon" : ""}`} role="button" tabIndex={0} title="اضغط لفتح تفاصيل العرض" onClick={(event) => { event.stopPropagation(); openDetail(service, { offer: true }); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); openDetail(service, { offer: true }); } }}><Timer size={12} aria-hidden="true"/>{left.label}</em></span>
                  </span>
                </button>
              );
            })}
          </div>
          {offerServices.length > 1 && (
            <div className="offers-dots" role="tablist" aria-label={`${Math.min(offerServices.length, 12)} عروض — اسحب يمينًا ويسارًا`}>
              {offerServices.slice(0, 12).map((service, index) => (
                <button type="button" key={service.id} role="tab" aria-selected={index === offerIndex} aria-label={`العرض ${index + 1} من ${Math.min(offerServices.length, 12)}: ${service.name}`} className={`offers-dot ${index === offerIndex ? "is-active" : ""}`} onClick={() => scrollToOffer(index)} data-no-feedback/>
              ))}
              <span className="offers-dots-count" aria-hidden="true">{offerIndex + 1} / {Math.min(offerServices.length, 12)}</span>
            </div>
          )}
        </section>
      )}
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
      {(scoped || design.showFeatureCards) && design.showTelecomCards !== false && <TelecomCards order={scoped ? 5 : sectionOrderIndex("features", 1)}/>}
      {settings.showEmergency && <section className="emergency-strip" aria-labelledby="emergency-strip-title" style={!scoped ? { order: sectionOrderIndex("professionBanner", 5) } : undefined}><span className="emergency-strip-icon"><Siren size={24}/></span><div className="emergency-strip-copy"><h2 id="emergency-strip-title">الخدمات والطوارئ</h2><p>لأن بعض المواقف.. ما تستحملش انتظار</p></div><button type="button" className="emergency-strip-button" onClick={showEmergency}><PhoneCall size={16}/>عرض الأرقام</button></section>}
      </>)}
    </main></div>
    <footer className="site-footer"><div className="container footer-main"><div className="footer-brand-group">{(viewer.role === "admin" || viewer.role === "moderator") && <Link href="/admin" className="footer-admin-link"><ShieldCheck size={14}/><span>{viewer.role === "moderator" ? "لوحة المشرف" : "لوحة التحكم"}</span></Link>}<div className="footer-brand-lockup"><div className="footer-brand-copy"><strong>جنزور في مكان واحد</strong><span>{design.footerDescription || "دليل المهن والخدمات.. من أهل القرية لأهلها"}</span></div></div></div>{design.showFooterStats && <div className="footer-stats-strip" aria-label="إحصائيات دليل جنزور"><span><strong>+{services.length}</strong> خدمة ومهنة</span><span><strong>{roots.length}</strong> أقسام رئيسية</span><span><strong>{data.areas.length}</strong> مناطق في جنزور</span></div>}<nav aria-label="روابط تذييل الصفحة"><Link href="/"><Search size={15}/> الرئيسية</Link>{design.showHeaderFavorites && <button onClick={showFavorites}><Heart size={15}/> المفضلة</button>}<button onClick={() => setModal("contact")}><MessageCircle size={15}/> اتصل بنا</button><Link href="/events"><CalendarDays size={15}/> مناسبات القرية</Link>{(viewer.role === "admin" || viewer.role === "moderator") && <Link href="/stats"><BarChart3 size={15}/> تقرير الدليل</Link>}<Link href="/advertise"><Megaphone size={15}/> أعلن معنا</Link>{design.footerFacebookUrl && <a href={design.footerFacebookUrl} target="_blank" rel="noopener noreferrer">صفحة فيسبوك</a>}{design.footerWhatsappGroupUrl && <a href={design.footerWhatsappGroupUrl} target="_blank" rel="noopener noreferrer">جروب واتساب جنزور</a>}</nav><p className="footer-copyright"><span className="footer-copyright-line">{settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</span>{design.footerCredit && <span className="footer-credit" dir="rtl"><Sparkles className="footer-credit-sparkle" size={13} aria-hidden="true"/><span className="footer-credit-text">{design.footerCredit}</span></span>}</p>{design.showFooterWhatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="التواصل مع الإدارة عبر واتساب" className="footer-whatsapp"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.52 0 .19 5.34.19 11.9c0 2.1.55 4.14 1.59 5.95L.08 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.45-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.03-1.37l-.36-.22-3.74.98.99-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg></span><div><small>التواصل مع الإدارة</small><strong dir="ltr">{settings.phone}</strong></div></a>}</div></footer>
    {!aboutFabHidden && !modal && !detail && (
      <div className="floating-about-fab" role="group" aria-label="عن التطبيق">
        <button type="button" className="floating-about-fab-main" onClick={() => setModal("about")} aria-label="عن التطبيق وطريقة الاستخدام" title="شرح التطبيق">
          <Info size={20}/>
          <span>عن التطبيق</span>
        </button>
        <button type="button" className="floating-about-fab-close" onClick={() => setAboutFabHidden(true)} aria-label="إخفاء زر عن التطبيق" title="إخفاء">
          <X size={12}/>
        </button>
      </div>
    )}
    {design.floatingWhatsappEnabled && (
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="floating-quick-whatsapp" aria-label="تواصل سريع مع الإدارة عبر واتساب">
        <MessageCircle size={20}/>
        <span>واتساب الإدارة</span>
      </a>
    )}
    {suggestions.length > 0 && <section className="container search-assistance" aria-label="مساعدة البحث"><div className="specialty-suggestions"><h3>ملقيناش نتيجة مطابقة. جرّب التخصصات دي</h3><p>فتح التخصص يعرض كل خدماته بدون فلاتر البحث الحالية.</p>{suggestions.map((item) => <Link className="button button-soft" key={item.id} href={`/categories/${item.parentId}/${item.id}`}>{item.name}</Link>)}</div></section>}
    {modal === "duty" && (
      <Modal floating wide className="modal-quiet-scroll" title={dutyShift.title} subtitle={dutyShift.subtitle} onClose={closeModal}>
        <div className="duty-modal-content">
          <div className="duty-modal-head">
            <span className={`duty-shift-badge is-${dutyShift.mode}`}><Stethoscope size={15}/>{dutyShift.badge}</span>
            <div className="duty-filter-tabs" role="tablist" aria-label="فلترة المناوبات والطوارئ">
              <button type="button" role="tab" aria-selected={dutyFilter === "pharmacies"} className={dutyFilter === "pharmacies" ? "is-active" : ""} onClick={() => setDutyFilter("pharmacies")}><Pill size={14}/>الصيدليات</button>
              <button type="button" role="tab" aria-selected={dutyFilter === "clinics"} className={dutyFilter === "clinics" ? "is-active" : ""} onClick={() => setDutyFilter("clinics")}><Stethoscope size={14}/>العيادات والمعامل</button>
              <button type="button" role="tab" aria-selected={dutyFilter === "emergency"} className={dutyFilter === "emergency" ? "is-active" : ""} onClick={() => setDutyFilter("emergency")}><Siren size={14}/>طوارئ ومتاح الآن</button>
            </div>
          </div>
          {dutyServices.length > 0 ? (
            <div className="duty-grid-v3">
              {dutyServices.map((service) => {
                const cat = getCategory(service.category, categories);
                const liveNow = now > 0 && isAvailableNow(service, now);
                const open = () => { closeModal(); openDetail(service); };
                return (
                  <article key={service.id} className="duty-card-v3" onClick={open} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } }} aria-label={`فتح تفاصيل ${service.name}`}>
                    <div className="duty-v3-main">
                      <span className={`duty-status-pill ${liveNow ? "is-live" : "is-emergency"}`}>{liveNow ? "متاح الآن" : service.emergency ? "طوارئ" : "مناوبة"}</span>
                      <h3 className="duty-v3-title"><span className="duty-card-icon" style={categoryTheme(cat)}><CategoryIcon icon={cat.icon} size={17}/></span><span>{service.name}</span></h3>
                      <p className="duty-v3-sub"><span>{cat.name}</span>{(service.address || service.area) && <span className="duty-v3-address"><MapPin size={12}/>{service.address || service.area}</span>}</p>
                      <div className="duty-v3-actions" onClick={(event) => event.stopPropagation()}>
                        {contactLocked
                          ? <Link href={registerHref} className="duty-v3-call is-locked"><LockKeyhole size={15}/><span>سجّل لعرض الرقم</span></Link>
                          : <button type="button" className="duty-v3-call" onClick={open} aria-label={`اتصال وتفاصيل ${service.name}`} title="افتح التفاصيل للاتصال"><PhoneCall size={16}/><span>اتصال</span><span dir="ltr" className="duty-v3-phone">{service.phone}</span></button>}
                        {!contactLocked && <a href={whatsappUrl(service.phone, serviceWhatsappMessage(service, cat.name, "", "", { siteName: settings.siteName, url: serviceDirectUrl(service.id) }))} target="_blank" rel="noopener noreferrer" className="duty-v3-wa" aria-label={`واتساب ${service.name}`} title="واتساب"><MessageCircle size={17}/></a>}
                      </div>
                    </div>
                    <div className="duty-v3-qr" onClick={(event) => event.stopPropagation()}>
                      <span className="duty-v3-qr-frame"><QrSvg value={`${siteOrigin}/?service=${encodeURIComponent(service.id)}`} size={92} label={`رمز QR لـ ${service.name}`}/></span>
                      <small><QrCode size={11}/> امسح لفتح الكارت</small>
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
      <Modal floating wide className="modal-quiet-scroll" title="أرقام تهمك في جنزور (المرافق والطوارئ العامة)" subtitle="أرقام الطوارئ والمرافق الحيوية وشكاوى الخدمات العامة للاتصال الفوري بضغطة واحدة" onClose={closeModal}>
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
          <div className="duty-grid utilities-grid">
            {utilityNumbers.map((item) => {
              const UtilityIcon = utilityIcon(item);
              return (
              <article key={item.id} className={`duty-card duty-card-v2 utility-duty-card is-${item.tone}`}>
                <span className="duty-status-pill utility-tone-pill">{item.category}</span>
                <div className="duty-hover-tools">
                  <button type="button" className={`duty-tool-btn ${copiedUtilityId === item.id ? "is-copied" : ""}`} onClick={() => void copyUtilityNumber(item.id, item.number)} aria-label={`نسخ رقم ${item.name}`} title={copiedUtilityId === item.id ? "تم النسخ" : "نسخ الرقم"}>
                    {copiedUtilityId === item.id ? <ClipboardCheck size={15}/> : <Clipboard size={15}/>}
                  </button>
                  {isAdmin && (
                    <>
                      <button type="button" className="duty-tool-btn" onClick={() => setEditingUtility(item)} aria-label={`تعديل ${item.name}`} title="تعديل"><Pencil size={14}/></button>
                      <button type="button" className="duty-tool-btn is-delete" onClick={() => handleUtilityDelete(item.id)} aria-label={`حذف ${item.name}`} title="حذف"><Trash2 size={14}/></button>
                    </>
                  )}
                </div>
                <h3 className="duty-card-title"><span className="duty-card-icon utility-tone-icon"><UtilityIcon size={17}/></span><span>{item.name}</span></h3>
                <p className="duty-card-sub">{item.detail || item.category}</p>
                <div className="duty-card-foot">
                  <a href={`tel:${item.number}`} className="button button-primary duty-call-full" aria-label={`اتصال بـ ${item.name} على رقم ${item.number}`}><PhoneCall size={15}/><span>اتصال</span><span dir="ltr">{item.number}</span></a>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </Modal>
    )}
    {modal === "utilities" && isAdmin && editingUtility && (
      <Modal floating className="modal-quiet-scroll" title={editingUtility.id ? "تعديل بيانات الرقم" : "إضافة رقم جديد"} subtitle="أرقام تهمك في جنزور — التعديل يُنشر فورًا لكل الزوار" onClose={() => setEditingUtility(null)}>
        <div className="floating-submodal-body">
            <form key={editingUtility.id ?? "new"} className="utility-editor-form" onSubmit={handleUtilitySubmit}>
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
        </div>
      </Modal>
    )}
    {modal === "quick" && (
      <Modal floating title="الخدمات السريعة" subtitle="وصول سريع لخدمات الطوارئ، والبحث حسب عنوانك في جنزور، وقائمة خدماتك المفضلة، ومشاركة التطبيق" onClose={() => { setAppShareState("idle"); closeModal(); }}>
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
          <button type="button" className="share-app-quick-link" onClick={() => void shareApp()}>
            <span className="quick-icon quick-green"><Share2 size={24}/></span>
            {appShareState === "copied" ? "تم نسخ رابط التطبيق ✓" : appShareState === "shared" ? "شكرًا لمشاركتك ✓" : "شارك التطبيق مع أهل جنزور"}
            <ChevronLeft size={15}/>
          </button>
        </div>
      </Modal>
    )}
    {modal === "emergency" && <Modal floating title="أرقام الطوارئ والمرافق في جنزور ومصر" subtitle="اتصل بالجهة المختصة مباشرة من هاتفك" onClose={closeModal}><div className="emergency-contact-list">{utilityNumbers.map((contact) => <a className="emergency-contact-link" key={contact.id} href={`tel:${contact.number}`}><span className="emergency-contact-icon"><PhoneCall size={20}/></span><span className="emergency-contact-copy"><strong>{contact.name}</strong><small>{contact.detail}</small></span><b dir="ltr">{contact.number}</b></a>)}<p className="emergency-contact-note">للحالات الطبية المهددة للحياة اتصل بالإسعاف على 123. أرقام الخدمات قد تختلف حسب المنطقة.</p></div></Modal>}
    {modal === "service" && <Modal floating title="أضف مهنتك لدليل جنزور" subtitle="طلب إضافة خدمة.. بعد مراجعة الإدارة" onClose={closeModal} wide><ServiceForm catalog={categories} areaOptions={data.areas} initialCategory={specialtyId || rootFilter} initialArea={area} onClose={closeModal}/></Modal>}
    {modal === "location" && <Modal floating title="اختار عنوانك في جنزور" subtitle="الخدمة في ناحيتك.. في خطوات بسيطة" onClose={closeModal}><LocationPicker areaOptions={data.areas} selected={area} onSelect={selectLocation}/></Modal>}
    {adminFeedOpen && <AdminNotificationsModal feed={adminFeed} onRefresh={setAdminFeed} onClose={() => setAdminFeedOpen(false)}/>}
    {feedOpen && (
      <Modal floating title="إشعاراتي" subtitle="تنبيهات تخصك أنت فقط: بيانات مهنتك ورسائل الإدارة لك والجديد في التخصصات التي تتابعها" onClose={() => setFeedOpen(false)}>
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
            <h3>مفيش إشعارات ليك حاليًا</h3>
            <p>هنا تظهر فقط التنبيهات الخاصة بك: طلبات الإدارة بخصوص مهنتك المسجلة برقمك، ورسائل الاعتماد، وأي مهنة جديدة في التخصصات التي تتابعها.</p>
          </div>
        )}
      </Modal>
    )}
    {modal === "about" && <AppInfoModal siteName={settings.siteName} logoUrl={design.headerLogoUrl} memberCount={data.memberCount} onClose={closeModal} onAddService={() => openAddService()}/>}
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
    {stageModalOpen && <TeacherStageModal current={stage?.id} counts={stageCounts} centerCount={services.filter((service) => service.category === TEACHER_CENTER_ID).length} onClose={() => setStageModalOpen(false)}/>}
    {detail && <Modal floating className="modal-quiet-scroll detail-modal" title={getCategory(detail.category, categories).parentId === "clinics" ? "بيانات الطبيب والعيادة" : "تفاصيل مقدم الخدمة"} subtitle={`${getCategory(detail.category, categories).name} • ${detail.address || detail.area}`} onClose={closeDetail}><div className="service-details detail-v2">
      <header className="detail-v2-hero" style={categoryTheme(getCategory(detail.category, categories))}>
        <span className="detail-v2-hero-glow" aria-hidden="true"/>
        <div className="detail-v2-hero-row">
          <span className="detail-v2-avatar" aria-hidden="true">
            <ServiceArt category={detail.category} item={getCategory(detail.category, categories)}/>
          </span>
          <div className="detail-v2-identity">
            <h3>{detail.name}</h3>
            <div className="detail-v2-identity-pills">
              <span className="detail-v2-specialty">
                <CategoryIcon icon={getCategory(detail.category, categories).icon} size={13}/>
                {getCategory(detail.category, categories).name}
              </span>
              {detail.verified && <span className="detail-v2-verified"><ShieldCheck size={13}/> موثّق</span>}
            </div>
            <div className="detail-v2-stars">
              <ProviderRating value={detail.rating} reviews={detail.reviews}/>
            </div>
          </div>
          {/* دائرة الصورة الكبيرة على الشمال: تفتح الملف الشخصي للزائر، ورفع الصورة لصاحب المهنة */}
          <ProfilePhotoCircle service={liveDetail ?? detail} size={120} className="detail-v2-photo" />
        </div>
        <button
          type="button"
          className={`detail-v2-badges-toggle ${detailBadgesOpen ? "is-open" : ""}`}
          aria-expanded={detailBadgesOpen}
          onClick={() => setDetailBadgesOpen((open) => !open)}
          title={detailBadgesOpen ? "طي الأوسمة والشارات" : "عرض الأوسمة والشارات"}
        >
          <Award size={14}/>
          <span>{detailBadgesOpen ? "إخفاء الأوسمة" : "عرض الأوسمة والشارات"}</span>
          {detailBadgesOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </header>
      {detailBadgesOpen && (
        <div className="details-badges detail-v2-badges">
          {detail.verified && <span className="detail-verified"><ShieldCheck size={14}/>تم التحقق بالمعاينة</span>}
          {liveDetail && now > 0 && isAvailableNow(liveDetail, now) && <span className="detail-open"><span/>متاح الآن</span>}
          {supportsHomeDelivery(liveDetail ?? detail) && <span className="detail-delivery"><Truck size={14}/>🛵 يوجد توصيل للمنازل</span>}
          {detail.emergency && <span className="detail-emergency"><Siren size={14}/>متاح للطوارئ</span>}
          {detail.featured && <span className="detail-featured"><Crown size={14}/>خدمة مميزة</span>}
          {isTopRated(detail) && <span className="detail-toprated"><Medal size={14}/>الأعلى تقييمًا</span>}
          {isNewService(detail) && <span className="detail-new"><Sparkles size={14}/>جديد</span>}
          {getServiceTrustBadges(liveDetail ?? detail, now).map((badge) => <span key={badge.id} className={`detail-trust-badge is-${badge.tone}`}><Award size={14}/>{badge.label}</span>)}
        </div>
      )}


      <div className="detail-v2-facts detail-facts-rows" role="list">
        <div className="detail-v2-fact" role="listitem">
          <span className={`detail-v2-fact-icon is-spec ${hasSticker(getCategory(detail.category, categories)) ? "has-profession-art has-sticker" : specArt3d ? "has-profession-art" : ""}`}><SpecialtyIcon category={getCategory(detail.category, categories)} size={specArt3d ? 34 : 17} art3d={specArt3d} sticker={specSticker}/></span>
          <div><small>التخصص</small><strong>{getCategory(detail.category, categories).name}</strong></div>
        </div>
        <div className="detail-v2-fact" role="listitem">
          <span className="detail-v2-fact-icon is-place"><MapPin size={17}/></span>
          <div><small>العنوان</small><strong>{detail.address || detail.area}</strong></div>
        </div>
        <div className="detail-v2-fact" role="listitem">
          <span className="detail-v2-fact-icon is-phone"><Phone size={17}/></span>
          <div><small>الهاتف</small>{contactLocked ? <strong className="detail-locked-value"><LockKeyhole size={13}/> للأعضاء فقط</strong> : <strong dir="ltr">{detail.phone}</strong>}</div>
        </div>
        {!contactLocked && detail.phoneSecondary && (
          <div className="detail-v2-fact" role="listitem">
            <span className="detail-v2-fact-icon is-phone"><PhoneCall size={17}/></span>
            <div><small>هاتف إضافي</small><strong dir="ltr">{detail.phoneSecondary}</strong></div>
          </div>
        )}
      </div>
      {detail.menuUrl && <a className="button button-soft detail-menu-button" href={detail.menuUrl} target="_blank" rel="noopener noreferrer">عرض المنيو</a>}

      {!contactLocked && <div className="detail-popup-icons-bar detail-v2-triggers" role="group" aria-label="نوافذ التقييم ومواعيد العيادة">
        {detail.category === TEACHER_CENTER_ID && ((liveDetail ?? detail).schedule?.length ?? 0) > 0 && (
          <button
            type="button"
            className="detail-popup-trigger-btn is-schedule"
            onClick={() => setDetailScheduleOpen(true)}
            aria-haspopup="dialog"
          >
            <span className="detail-popup-trigger-icon"><CalendarDays size={19}/></span>
            <div className="detail-popup-trigger-copy">
              <strong>جدول الحصص الأسبوعي ({(liveDetail ?? detail).schedule?.length} حصة)</strong>
              <small>المواد والمدرسون والمواعيد — ويمكنك مشاركته صورة</small>
            </div>
            <ChevronLeft size={16}/>
          </button>
        )}
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
      </div>}

      {!contactLocked && getCategory(detail.category, categories).parentId === "shops" && (() => {
        const currentShop = liveDetail ?? detail;
        const catalogItems = getShopCatalogItems(currentShop);
        const shopHasDelivery = supportsHomeDelivery(currentShop);
        if (!catalogItems.length) return null;
        return (
          <section className={`detail-shop-catalog-card detail-collapsible ${detailItemsOpen ? "is-open" : ""}`} aria-label="قائمة الأصناف والأسعار المختصرة للطلب السريع">
            <button type="button" className="detail-shop-catalog-head detail-collapsible-head" aria-expanded={detailItemsOpen} onClick={() => setDetailItemsOpen((open) => !open)}>
              <div className="detail-shop-catalog-title">
                <span className={`detail-shop-catalog-icon ${detailItemsOpen ? "is-open" : ""}`}>{detailItemsOpen ? <PackageOpen size={18}/> : <ShoppingBag size={18}/>}</span>
                <div>
                  <h4>قائمة الأصناف والعروض المتاحة <small>({catalogItems.length})</small></h4>
                  <span>{detailItemsOpen ? "حدد الأصناف التي تريدها واضغط «اطلب عبر واتساب» لتجهيز الرسالة تلقائياً" : "اضغط لعرض الأصناف والأسعار والطلب عبر واتساب"}</span>
                </div>
              </div>
              {selectedShopItems.length > 0 && (
                <span className="detail-shop-selected-count">{selectedShopItems.length} أصناف محددة</span>
              )}
              <span className="detail-collapsible-icon" aria-hidden="true">{detailItemsOpen ? <Minus size={16}/> : <PlusIcon size={16}/>}</span>
            </button>
            {detailItemsOpen && <>
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
            </>}
          </section>
        );
      })()}
      {(() => { const offer = activeOffer(liveDetail ?? detail, now || undefined); return offer ? (
        <section className={`detail-offer detail-collapsible ${detailOfferOpen ? "is-open" : ""}`} role="note">
          <button type="button" className="detail-collapsible-head" aria-expanded={detailOfferOpen} onClick={() => setDetailOfferOpen((open) => !open)}>
            <span className="detail-offer-icon"><BadgePercent size={20}/></span>
            <span className="detail-collapsible-title"><strong>{offer.title}</strong><small className={offerTimeLeft(offer, now || undefined).urgent ? "is-urgent" : ""}>عرض محدود — {offerTimeLeft(offer, now || undefined).label}</small></span>
            <span className="detail-collapsible-icon" aria-hidden="true">{detailOfferOpen ? <Minus size={16}/> : <PlusIcon size={16}/>}</span>
          </button>
          {detailOfferOpen && <div className="detail-collapsible-body detail-offer-copy">{offer.details ? <p>{offer.details}</p> : <p>اسأل عن تفاصيل العرض عند التواصل — صالح حتى {new Date(offer.endsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}.</p>}</div>}
        </section>
      ) : null; })()}
      <div className="detail-about detail-about-centered"><h4 className="detail-about-title">نبذة عن الخدمة</h4><p>{detail.description}</p></div>
      {liveDetail?.subSpecialties?.length ? <section className="detail-subspec"><h4>التخصصات الفرعية</h4><ul>{liveDetail.subSpecialties.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {liveDetail?.serviceItems?.length && getCategory(detail.category, categories).parentId !== "shops" ? <section className={`detail-service-items detail-collapsible ${detailItemsOpen ? "is-open" : ""}`}>
        <button type="button" className="detail-collapsible-head" aria-expanded={detailItemsOpen} onClick={() => setDetailItemsOpen((open) => !open)}>
          <span className="detail-collapsible-badge"><ListChecks size={18}/></span>
          <span className="detail-collapsible-title"><strong>الخدمات التفصيلية</strong><small>{liveDetail.serviceItems.length} خدمة — اضغط للعرض</small></span>
          <span className="detail-collapsible-icon" aria-hidden="true">{detailItemsOpen ? <Minus size={16}/> : <PlusIcon size={16}/>}</span>
        </button>
        {detailItemsOpen && <ul className="detail-collapsible-body">{liveDetail.serviceItems.map((item) => <li key={item}>{item} <a href={whatsappUrl(detail.phone, serviceWhatsappMessage(detail, getCategory(detail.category, categories).name, contactArea, item))} target="_blank" rel="noopener noreferrer">اسأل على واتساب</a></li>)}</ul>}
      </section> : null}
      {!contactLocked && <div className="detail-tools">
        <button type="button" className={`detail-card-btn ${detailQr ? "is-open" : ""}`} aria-expanded={detailQr} onClick={() => { setDetailQr(true); setDetailUpdate(false); }}><QrCode size={17}/>بطاقة عمل و QR</button>
        {isAdmin && design.showAdminQuickEdit && (
          <Link href={`/admin?tab=directory&editService=${encodeURIComponent(detail.id)}`} className="button button-soft button-small">
            <Pencil size={15}/> تعديل كأدمن
          </Link>
        )}
        {isServiceOwner(liveDetail ?? detail, viewer, ownedServiceIds) && (
          <button type="button" className={detailUpdate ? "is-open" : ""} aria-expanded={detailUpdate} onClick={() => { setDetailUpdate(true); setDetailQr(false); setUpdateMessage(""); }}><Pencil size={17}/>تحديث البيانات</button>
        )}
      </div>}
      {contactLocked ? (
        <div className="detail-locked-contact" role="region" aria-label="أرقام التواصل للأعضاء فقط">
          <span className="detail-locked-icon"><LockKeyhole size={22}/></span>
          <strong>أرقام التواصل للأعضاء فقط</strong>
          <p>أنت غير مسجل في التطبيق. سجّل دخولك أو أنشئ عضوية مجانية في ثوانٍ لتظهر لك أرقام الاتصال والواتساب الخاصة بـ {detail.name}.</p>
          <div className="guest-gate-actions">
            <Link href={loginHref} className="button button-soft"><LogIn size={16}/> تسجيل الدخول</Link>
            <Link href={registerHref} className="button button-primary"><UserRoundPlus size={16}/> إنشاء عضوية</Link>
          </div>
        </div>
      ) : (
      <div className="circle-host detail-v2-tools-host">
        <div className="circle-tools is-row detail-v2-tools" role="group" aria-label="اتصال وواتساب ومشاركة ومفضلة ونسخ الرقم">
          <a
            className="circle-tool is-call"
            href={`tel:${detail.phone}`}
            data-tip="اتصال"
            aria-label={`اتصال بـ ${detail.name}`}
            onClick={() => trackDirectoryEvent({ kind: "call", label: detail.name, serviceId: detail.id, categoryId: detail.category })}
          >
            <PhoneCall size={17}/>
          </a>
          {detail.phoneSecondary && (
            <a
              className="circle-tool is-call-secondary"
              href={`tel:${detail.phoneSecondary}`}
              data-tip="رقم إضافي"
              aria-label={`اتصال بالرقم الإضافي لـ ${detail.name}`}
              onClick={() => trackDirectoryEvent({ kind: "call", label: detail.name, serviceId: detail.id, categoryId: detail.category })}
            >
              <Phone size={16}/>
            </a>
          )}
          <a
            className="circle-tool is-whatsapp"
            href={whatsappUrl(detail.phone, design.whatsappDefaultGreeting || serviceWhatsappMessage(detail, getCategory(detail.category, categories).name, contactArea, "", { siteName: settings.siteName, url: serviceDirectUrl(detail.id) }))}
            target="_blank"
            rel="noopener noreferrer"
            data-tip="واتساب"
            aria-label={`واتساب ${detail.name}`}
            onClick={() => trackDirectoryEvent({ kind: "whatsapp", label: detail.name, serviceId: detail.id, categoryId: detail.category })}
          >
            <MessageCircle size={17}/>
          </a>
          <button type="button" className="circle-tool is-share" data-tip="مشاركة" onClick={() => void shareService(detail)} aria-label={`مشاركة ${detail.name}`}>
            <Share2 size={16}/>
          </button>
          <button
            type="button"
            className={`circle-tool is-favorite ${favorites.includes(detail.id) ? "is-active" : ""}`}
            data-tip={favorites.includes(detail.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            onClick={() => toggleFavorite(detail.id)}
            aria-pressed={favorites.includes(detail.id)}
            aria-label={favorites.includes(detail.id) ? `إزالة ${detail.name} من المفضلة` : `أضف ${detail.name} للمفضلة`}
          >
            <Heart size={16} fill={favorites.includes(detail.id) ? "currentColor" : "none"}/>
          </button>
          <button
            type="button"
            className={`circle-tool is-copy ${detailCopied ? "is-active" : ""}`}
            data-tip={detailCopied ? "تم النسخ ✓" : "نسخ الرقم"}
            onClick={() => void copyDetailPhone(detail.phone)}
            aria-label={detailCopied ? "تم نسخ الرقم" : `نسخ رقم ${detail.name}`}
          >
            {detailCopied ? <Check size={16}/> : <Copy size={16}/>}
          </button>
          <button
            type="button"
            className={`circle-tool is-contact ${detailContactSaved ? "is-active" : ""}`}
            data-tip={detailContactSaved ? "تم تجهيز جهة الاتصال ✓" : "احفظ في جهات الاتصال"}
            onClick={() => void saveDetailContact(liveDetail ?? detail)}
            aria-label={`احفظ رقم ${detail.name} في جهات الاتصال`}
          >
            {detailContactSaved ? <Check size={16}/> : <UserPlus size={16}/>}
          </button>
          <button
            type="button"
            className="circle-tool is-suggest"
            data-tip="اقترح تعديل"
            onClick={() => openSuggest(liveDetail ?? detail)}
            aria-label={`اقترح تعديلًا على بيانات ${detail.name}`}
          >
            <MessageSquareWarning size={16}/>
          </button>
        </div>
        <small className="detail-v2-tools-hint" dir="ltr">{detail.phone}</small>
      </div>
      )}
      <a className="detail-credit" href={OFFICE_WHATSAPP} target="_blank" rel="noopener noreferrer" title="تواصل مع مكتب الجمال للدعاية والإعلان على واتساب">تصميم وتنفيذ م.وائل الجمال</a>
    </div></Modal>}
    {detail && detailScheduleOpen && (
      <Modal floating wide className="modal-quiet-scroll" title="جدول الحصص الأسبوعي" subtitle={`${detail.name} — سنتر تعليمي`} onClose={() => setDetailScheduleOpen(false)}>
        <div className="floating-submodal-body"><CenterScheduleView name={detail.name} schedule={(liveDetail ?? detail).schedule ?? []}/></div>
      </Modal>
    )}
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
    {suggestTarget && (
      <Modal floating title="اقترح تعديلًا" subtitle={`بيانات «${suggestTarget.name}» غير دقيقة؟ اكتب ملاحظتك وستراجعها الإدارة`} onClose={() => setSuggestTarget(null)} className="modal-quiet-scroll">
        <form className="suggest-edit-form" onSubmit={(event) => void submitSuggestion(event)}>
          <label className="field"><span>الملاحظة أو التعديل المقترح *</span><textarea required minLength={5} maxLength={400} rows={4} value={suggestNote} onChange={(event) => setSuggestNote(event.target.value)} placeholder="مثال: الرقم تغيّر، العنوان الجديد، المحل أغلق، التخصص غير صحيح…"/></label>
          <label className="field"><span>رقم للتواصل معك (اختياري)</span><input type="tel" inputMode="tel" dir="ltr" maxLength={14} value={suggestContact} onChange={(event) => setSuggestContact(event.target.value)} placeholder="01xxxxxxxxx"/></label>
          {suggestState.message && <p className={`form-message ${suggestState.ok ? "is-ok" : "is-error"}`} role="status">{suggestState.message}</p>}
          <div className="suggest-edit-actions">
            {suggestState.ok
              ? <button type="button" className="button button-primary" onClick={() => setSuggestTarget(null)}>تم ✓ إغلاق</button>
              : <button type="submit" className="button button-primary" disabled={suggestState.busy || suggestNote.trim().length < 5}>{suggestState.busy ? "جارٍ الإرسال…" : "إرسال للإدارة"}</button>}
            <button type="button" className="button button-ghost" onClick={() => setSuggestTarget(null)}>إلغاء</button>
          </div>
        </form>
      </Modal>
    )}
    {searchModalOpen && (
      <Modal
        floating
        autoFocus={false}
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
    {!scoped && neededServices.length > 0 && <section className="container search-assistance most-needed"><h2>الأكثر احتياجًا</h2><p>خدمات تختارها وترتبها الإدارة لاحتياجات أهل القرية، وليست ترتيبًا حسب المشاهدات.</p>{neededServices.map((service) => <button className="button button-soft" key={service.id} onClick={() => openDetail(service)}>{service.name} — {getCategory(service.category, categories).name}</button>)}</section>}
  </>;
}

// شارة "الأعلى تقييمًا": تقييم ٤.٥ أو أكثر مع ٥ تقييمات على الأقل.
function isTopRated(service: Pick<ServiceRecord, "rating" | "reviews">) { return (Number.parseFloat(service.rating) || 0) >= 4.5 && Number(service.reviews) >= 5; }

function GuestGateCard({ sectionName, registerHref, loginHref }: { sectionName: string; registerHref: string; loginHref: string }) {
  return (
    <section className="guest-gate-card" role="region" aria-labelledby="guest-gate-title" style={{ order: 0 }}>
      <span className="guest-gate-icon"><LockKeyhole size={30}/></span>
      <h2 id="guest-gate-title">أنت غير مسجل في التطبيق</h2>
      <p>لازم تسجّل عشان تظهرلك بيانات {sectionName ? `قسم «${sectionName}»` : "هذا القسم"} وأرقام التواصل مع المهنيين. العضوية مجانية وتاخد ثوانٍ.</p>
      <div className="guest-gate-actions">
        <Link href={loginHref} className="button button-soft"><LogIn size={17}/> تسجيل الدخول</Link>
        <Link href={registerHref} className="button button-primary"><UserRoundPlus size={17}/> إنشاء عضوية</Link>
      </div>
      <small><ShieldCheck size={14}/> بيانات عضويتك لا تظهر للزوار ولا تُضاف لدليل المهنيين.</small>
    </section>
  );
}

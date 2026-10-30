"use client";

import { notificationChime } from "@/lib/feedback";
import { extractEgyptPhone, whatsappReplyLink } from "@/lib/whatsapp-alert-kinds";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Smartphone, History, CheckSquare, CopyCheck, TriangleAlert, ListChecks, SlidersHorizontal, SquareMinus, XCircle, ArrowDown, ArrowUp, BadgeCheck, BarChart3, Bell, CalendarDays, Clapperboard, BellRing, BriefcaseBusiness, Building2, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft, CircleX, ClipboardList, Crown, EllipsisVertical, Eye, EyeOff, FileClock, FileSpreadsheet, Grid2X2, Hammer, LoaderCircle, LockKeyhole, Link2, LogOut, MapPin, Menu, MessageCircle, Megaphone, MessageSquareQuote, Palette, Pencil, Phone, Plus, RotateCw, Search, Settings2, ShieldCheck, Star, Trash2, UserRound, UsersRound, X, MessageSquareWarning } from "lucide-react";
import { defaultAdPricing, findServiceDuplicates, getCategory, normalizeSearch, whatsappUrl, type AdminDirectory, type CategoryRecord, type CommunityListingRecord, type NotificationRecord, type ServiceRecord, type AdminPaletteId } from "@/lib/catalog";
import { CategoryIcon, Logo, MainCategoryIcon, Modal } from "@/components/ui";
import ManagementEditor, { type EditorState, type EntityKind } from "@/components/management-editor";
import SettingsEditor from "@/components/settings-editor";
import DesignCustomizer from "@/components/design-customizer";
import DesignApplicator from "@/components/design-applicator";
import AdminAnalytics from "@/components/admin-analytics";
import AdminCodesSettings from "@/components/admin-codes-settings";
import AdminReplies from "@/components/admin-replies";
import AdminImport from "@/components/admin-import";
import AdminSponsors from "@/components/admin-sponsors";
import AdminAds from "@/components/admin-ads";
import AdminEvents from "@/components/admin-events";
import AdminActionSheet, { type AdminSheetItem } from "@/components/admin-action-sheet";
import SelectField from "@/components/select-field";
import { missingServiceData } from "@/lib/catalog";
import { activityActionLabel, activityKindLabel } from "@/lib/activity-labels";

type Tab = "requests" | "community" | "directory" | "completion" | "sponsors" | "ads" | "events" | "analytics" | "categories" | "addresses" | "members" | "ratings" | "posts" | "replies" | "notifications" | "settings" | "design" | "codes" | "import" | "activity";
const tabs: Array<{ id: Tab; name: string; icon: typeof FileClock }> = [{ id: "requests", name: "طلبات المهن", icon: FileClock }, { id: "community", name: "إعلانات المجتمع", icon: Megaphone }, { id: "directory", name: "الدليل المنشور", icon: UsersRound }, { id: "sponsors", name: "باقات الرعاية والتميز", icon: Crown }, { id: "ads", name: "الإعلانات المتحركة", icon: Clapperboard }, { id: "events", name: "مناسبات القرية والتهاني", icon: CalendarDays }, { id: "completion", name: "طلب استكمال بيانات", icon: ClipboardList }, { id: "analytics", name: "إحصائيات التفاعل والبحث", icon: BarChart3 }, { id: "import", name: "استيراد Excel", icon: FileSpreadsheet }, { id: "categories", name: "التصنيفات والتخصصات", icon: Grid2X2 }, { id: "addresses", name: "عناوين جنزور", icon: MapPin }, { id: "members", name: "أعضاء الموقع", icon: UserRound }, { id: "ratings", name: "تقييمات الأعضاء", icon: Star }, { id: "posts", name: "مولد المنشورات", icon: Megaphone }, { id: "replies", name: "الردود الجاهزة", icon: MessageSquareQuote }, { id: "notifications", name: "الإشعارات", icon: Bell }, { id: "activity", name: "سجل النشاط", icon: History }, { id: "design", name: "تخصيص المظهر والهيكل", icon: Palette }, { id: "codes", name: "صفحة الأكواد", icon: Smartphone }, { id: "settings", name: "إعدادات الموقع", icon: Settings2 }];
const ADMIN_PALETTES: Array<{ id: AdminPaletteId; name: string; swatch: string }> = [
  { id: "indigo", name: "بنفسجي نيلي", swatch: "linear-gradient(135deg,#4338ca 50%,#6366f1 50%)" },
  { id: "teal", name: "أخضر بحري + برتقالي", swatch: "linear-gradient(135deg,#0d9488 50%,#f97316 50%)" },
  { id: "graphite", name: "جرافيت + فيروزي", swatch: "linear-gradient(135deg,#475569 50%,#06b6d4 50%)" },
  { id: "maroon", name: "عنابي + ذهبي", swatch: "linear-gradient(135deg,#be123c 50%,#d4a017 50%)" },
  { id: "midnight", name: "كحلي ليلي + سماوي", swatch: "linear-gradient(135deg,#1d4ed8 50%,#0ea5e9 50%)" },
  { id: "copper", name: "نحاسي + برتقالي", swatch: "linear-gradient(135deg,#c2410c 50%,#d97706 50%)" },
  { id: "forest", name: "أخضر غابة + ليموني", swatch: "linear-gradient(135deg,#15803d 50%,#84cc16 50%)" },
  { id: "ocean", name: "أزرق محيط + فيروزي", swatch: "linear-gradient(135deg,#0284c7 50%,#22d3ee 50%)" },
  { id: "plum", name: "برقوقي + وردي", swatch: "linear-gradient(135deg,#7e22ce 50%,#ec4899 50%)" },
  { id: "cocoa", name: "بني كاكاو + كريمي", swatch: "linear-gradient(135deg,#92400e 50%,#f59e0b 50%)" },
  { id: "rose", name: "وردي داكن + مرجاني", swatch: "linear-gradient(135deg,#db2777 50%,#fb7185 50%)" },
  { id: "steel", name: "رمادي فولاذي + أخضر", swatch: "linear-gradient(135deg,#52607a 50%,#10b981 50%)" },
  { id: "royal", name: "أزرق ملكي + ذهبي", swatch: "linear-gradient(135deg,#2563eb 50%,#fbbf24 50%)" },
];
const statusLabels: Record<string, string> = { pending: "قيد المراجعة", "needs-info": "بانتظار الاستكمال", approved: "منشور", rejected: "مرفوض / موقوف", sold: "تم البيع", filled: "تم شغل الوظيفة" };
const communityTypeLabels: Record<CommunityListingRecord["type"], string> = { labor: "عمالة يومية", property: "عقارات بدون وسطاء", job: "وظائف جنزور" };
type Confirmation = { id: string; kind: EntityKind | "ad" | "ad-request" | "event"; action: "delete"; label: string };

export default function AdminPanel({ initialData, initialTab, initialEditService, username = "admin", role = "admin" }: { initialData: AdminDirectory; initialTab?: string; initialEditService?: string; username?: string; role?: "admin" | "moderator" }) {
  const isModerator = role === "moderator";
  // Community listings, completion requests, and sponsorship packages are retired/hidden from navigation.
  const activeTabs = tabs.filter((item) => item.id !== "community" && item.id !== "completion" && item.id !== "sponsors");
  const visibleTabs = isModerator ? activeTabs.filter((item) => ["requests", "directory", "categories", "addresses", "ratings", "posts", "replies", "notifications"].includes(item.id)) : activeTabs;
  const starting = visibleTabs.some((tab) => tab.id === initialTab) ? initialTab as Tab : "requests";
  const [data, setData] = useState(initialData), [tab, setTab] = useState<Tab>(starting), [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // لون لوحة الإدارة: اختيار مشترك محفوظ في الإعدادات — يتغير عند كل الأدمنز والمشرفين (الأدمن فقط يغيّره).
  const [palettePending, setPalettePending] = useState<AdminPaletteId | null>(null);
  const palette: AdminPaletteId = palettePending ?? data.adminPalette ?? "indigo";
  async function choosePalette(next: AdminPaletteId) {
    if (next === palette || isModerator) return;
    setPalettePending(next);
    await mutate("PATCH", { type: "admin-palette", palette: next }, "تم تغيير لون لوحة الإدارة لكل الأدمنز والمشرفين.");
    setPalettePending(null);
  }
  const [serviceMenu, setServiceMenu] = useState<{ title: string; subtitle: string; items: AdminSheetItem[] } | null>(null);
  const sidebar = useRef<HTMLElement>(null);
  const [status, setStatus] = useState(starting === "requests" ? "pending" : "all"), [communityStatus, setCommunityStatus] = useState(starting === "community" ? "pending" : "all"), [rootFilter, setRootFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null), [editing, setEditing] = useState<EditorState | null>(() => {
    if (!initialEditService) return null;
    const found = initialData.services.find((item) => item.id === initialEditService);
    return found ? { kind: "service", item: found } : null;
  }), [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null), [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationSelectionMode, setNotificationSelectionMode] = useState(false), [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{ ids: string[]; deleteAll: boolean } | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeWord, setPurgeWord] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]), [selectMode, setSelectMode] = useState(false), [areaFilter, setAreaFilter] = useState(""), [bulkServiceAction, setBulkServiceAction] = useState<{ action: "approve" | "reject"; ids: string[] } | null>(null), [openCategoryGroups, setOpenCategoryGroups] = useState<Record<string, boolean>>({});
  // التصنيفات: القسم يُفتح ويُطوى بالضغط على عنوانه فقط (لا يُطوى تلقائيًا عند الضغط في مكان آخر — بطلب المدير).
  const categoriesPanel = useRef<HTMLDivElement>(null);
  const knownNotifications = useRef(new Set(initialData.notifications.map((notification) => notification.id)));
  const closeEditor = () => setEditing(null), closeConfirmation = () => setConfirmation(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Read the browser notification permission on mount.
  useEffect(() => { setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission); }, []);
  useEffect(() => {
    if (busy) return;
    let cancelled = false;
    const synchronize = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/admin", { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) { window.location.assign(response.status === 401 ? "/login" : "/account"); return; }
        if (!response.ok) return;
        const next: AdminDirectory = await response.json();
        const fresh = next.notifications.filter((item) => !item.read && !knownNotifications.current.has(item.id));
        knownNotifications.current = new Set(next.notifications.map((item) => item.id));
        setData(next);
        const serviceNotice = fresh.find((item) => item.type === "service") ?? fresh[0];
        if (serviceNotice) {
          notificationChime(serviceNotice.type === "service" || serviceNotice.type === "rating" || serviceNotice.type === "community" ? serviceNotice.type : "other");
          setToast({ text: `${serviceNotice.title}: ${serviceNotice.message}`, error: false });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(serviceNotice.title, { body: serviceNotice.message, icon: "/images/logo-janzour.png", tag: serviceNotice.id });
        }
      } catch { /* Retry after temporary connection errors without losing the dashboard. */ }
    };
    const timer = setInterval(synchronize, 10000); window.addEventListener("focus", synchronize);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", synchronize); };
  }, [busy]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 7000); return () => clearTimeout(timer); }, [toast]);

  // Mobile section dropdown: close on outside tap or Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnOutside = (event: PointerEvent) => { if (!sidebar.current?.contains(event.target as Node)) setMobileMenuOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [mobileMenuOpen]);
  const roots = data.categories.filter((category) => !category.parentId);
  const pending = data.services.filter((service) => service.status === "pending").length, ratingsPending = data.ratings.filter((rating) => rating.status === "pending").length, published = data.services.filter((service) => service.status === "approved").length;
  const unread = data.notificationUnread;
  const title = visibleTabs.find((item) => item.id === tab)?.name ?? "لوحة التحكم";
  // فحص المكررات: نفس الهاتف أو اسم شديد الشبه في نفس التخصص — يظهر تحذير في الصف، وزر في شريط الأدوات لعرض المكررات فقط.
  const duplicates = useMemo(() => findServiceDuplicates(data.services), [data.services]);
  const [dupOnly, setDupOnly] = useState(false);
  const duplicateCount = useMemo(() => data.services.filter((service) => (tab === "directory" ? service.status === "approved" : service.status !== "approved") && duplicates.has(service.id)).length, [data.services, duplicates, tab]);
  const filteredServices = data.services.filter((service) => (tab === "directory" ? service.status === "approved" : service.status !== "approved") && (!dupOnly || duplicates.has(service.id)) && (status === "all" || service.status === status) && (!rootFilter || getCategory(service.category, data.categories).parentId === rootFilter) && (!areaFilter || service.area === areaFilter) && normalizeSearch(`${service.name} ${service.phone} ${service.phoneSecondary} ${service.area} ${getCategory(service.category, data.categories).name}`).includes(normalizeSearch(search)))
    // طلبات التعديل الواردة من أصحاب الخدمات (صفحة «حسابي») تتصدر القائمة حتى لا تضيع.
    .sort((a, b) => Number(b.completionStatus === "submitted") - Number(a.completionStatus === "submitted"));
  const filteredMembers = data.members.filter((member) => normalizeSearch(`${member.name} ${member.username} ${member.phone}`).includes(normalizeSearch(search)));
  const filteredRatings = data.ratings.filter((rating) => normalizeSearch(`${rating.serviceName} ${rating.memberName} ${rating.comment}`).includes(normalizeSearch(search)));
  const filteredCommunityListings = data.communityListings.filter((listing) => (communityStatus === "all" || listing.status === communityStatus) && normalizeSearch(`${listing.title} ${listing.profession} ${listing.description} ${listing.phone} ${listing.whatsapp} ${listing.area} ${listing.price} ${communityTypeLabels[listing.type]}`).includes(normalizeSearch(search)));
  const filteredRoots = roots.filter((category) => (!rootFilter || category.id === rootFilter) && (!search || normalizeSearch(`${category.name} ${data.categories.filter((item) => item.parentId === category.id).map((item) => item.name).join(" ")}`).includes(normalizeSearch(search))));
  const incompleteServices = data.services.filter((service) => missingServiceData(service).length > 0 || service.status === "needs-info" || (service.completionStatus && service.completionStatus !== "none"));
  const filteredIncompleteServices = incompleteServices.filter((service) => (!rootFilter || getCategory(service.category, data.categories).parentId === rootFilter) && (!areaFilter || service.area === areaFilter) && normalizeSearch(`${service.name} ${service.phone} ${service.phoneSecondary} ${service.area} ${getCategory(service.category, data.categories).name}`).includes(normalizeSearch(search)));
  const completionPairs: Array<[ServiceRecord, ServiceRecord | undefined]> = [];
  for (let index = 0; index < filteredIncompleteServices.length; index += 2) {
    completionPairs.push([filteredIncompleteServices[index], filteredIncompleteServices[index + 1]]);
  }
  const allNotificationsSelected = data.notifications.length > 0 && data.notifications.every((notification) => selectedNotificationIds.has(notification.id));
  // Mobile action sheet for a service card. The list is built when the menu opens (event handler), not during render.
  function openServiceMenu(service: ServiceRecord) { setServiceMenu({ title: service.name, subtitle: `${getCategory(service.category, data.categories).name} · ${statusLabels[service.status]}`, items: serviceMenuItems(service) }); }
  function serviceMenuItems(service: ServiceRecord): AdminSheetItem[] {
    const items: AdminSheetItem[] = [{ id: "edit", label: "تعديل البيانات", icon: <Pencil size={17}/>, onSelect: () => setEditing({ kind: "service", item: service }) }];
    if (service.status !== "approved") items.push({ id: "approve", label: "موافقة ونشر", icon: <Check size={17}/>, tone: "success", onSelect: () => void change(service.id, "service", "approve") });
    if (service.status === "pending") items.push({ id: "reject", label: "رفض", icon: <X size={17}/>, tone: "danger", onSelect: () => void change(service.id, "service", "reject") });
    if (service.status === "approved") {
      items.push({ id: "feature", label: service.featured ? "إلغاء التمييز" : "تمييز", icon: <Star size={17}/>, tone: "amber", onSelect: () => void change(service.id, "service", "feature") }, { id: "unpublish", label: "إيقاف النشر", icon: <EyeOff size={17}/>, tone: "danger", onSelect: () => void change(service.id, "service", "reject") });
    }
    items.push({ id: "availability-link", label: "نسخ لينك تجديد الإتاحة", icon: <Link2 size={17}/>, onSelect: () => void copyAvailabilityLink(service) });
    items.push({ id: "account-link", label: "إرسال لينك «حسابه» على واتساب (يعدّل بياناته بنفسه)", icon: <MessageCircle size={17}/>, tone: "success", onSelect: () => void sendAccountLink(service, "whatsapp") });
    items.push({ id: "account-link-copy", label: "نسخ لينك «حسابه»", icon: <Link2 size={17}/>, onSelect: () => void sendAccountLink(service, "copy") });
    items.push({ id: "account-link-reset", label: "إلغاء لينك «حسابه» وإنشاء جديد", icon: <LockKeyhole size={17}/>, tone: "danger", onSelect: () => { if (window.confirm(`سيتوقف الرابط القديم فورًا ويُنشأ رابط جديد لـ ${service.name}. متابعة؟`)) void sendAccountLink(service, "copy", true); } });
    items.push({ id: "delete", label: "حذف", icon: <Trash2 size={17}/>, tone: "danger", onSelect: () => setConfirmation({ id: service.id, kind: "service", action: "delete", label: service.name }) });
    return items;
  }
  async function requestServiceInfo(service: ServiceRecord) {
    const reviewNote = window.prompt("ما البيانات المطلوب استكمالها؟ ستظهر لصاحب الرابط الخاص.");
    if (reviewNote?.trim()) await mutate("PATCH", { id: service.id, type: "service", action: "request-info", reviewNote }, "تم طلب استكمال البيانات.");
  }
  async function requestProviderCompletion(service: ServiceRecord) {
    await mutate("PATCH", { id: service.id, type: "service", action: "request-completion" }, `تم إظهار زر «استكمال بيانات» لـ ${service.name} على بطاقته في الدليل.`);
  }
  async function approveProviderCompletion(service: ServiceRecord) {
    await mutate("PATCH", { id: service.id, type: "service", action: "approve-completion" }, `تمت الموافقة على استكمال بيانات ${service.name} وإغلاق زر الاستكمال عند المهني.`);
  }
  async function rejectProviderCompletion(service: ServiceRecord) {
    const completionNote = window.prompt("ملاحظة للمهني لتصحيح الخطأ (اختياري):", service.completionNote || "يرجى مراجعة البيانات وتصحيح الخطأ ثم إعادة الإرسال.") ?? "يرجى مراجعة البيانات وتصحيح الخطأ ثم إعادة الإرسال.";
    await mutate("PATCH", { id: service.id, type: "service", action: "reject-completion", completionNote }, `تم رفض الاستكمال وظهرت النقطة الحمراء على زر الاستكمال لـ ${service.name}.`);
  }
  function renderCompletionCell(service: ServiceRecord) {
    const cStatus = service.completionStatus ?? "none";
    return (
      <div className="completion-cell-actions">
        {cStatus === "none" ? (
          <button type="button" className="button button-primary button-small completion-btn" disabled={busy === service.id} onClick={() => void requestProviderCompletion(service)}>
            <ClipboardList size={14}/>استكمال
          </button>
        ) : (
          <>
            <button type="button" className="button button-success button-small completion-btn" disabled={busy === service.id} onClick={() => void approveProviderCompletion(service)} title="موافقة على الاستكمال وإغلاق الزر عند المهني">
              <Check size={14}/>موافقة
            </button>
            <button type="button" className="button button-danger-soft button-small completion-btn" disabled={busy === service.id} onClick={() => void rejectProviderCompletion(service)} title="رفض الاستكمال وإظهار نقطة حمراء للمهني">
              <X size={14}/>رفض
            </button>
          </>
        )}
        {!isModerator && (
          <button type="button" className="button button-soft button-small completion-edit-btn" onClick={() => setEditing({ kind: "service", item: service })} title="فتح شاشة الاستكمال والتعديل">
            <Pencil size={13}/>معاينة
          </button>
        )}
      </div>
    );
  }
  /** طلب تعديل أرسله صاحب الخدمة من صفحة «حسابي»: يظهر داخل بطاقته في اللوحة مع الفروق وزرّي الموافقة/الرفض. */
  function renderDraftRequest(service: ServiceRecord) {
    const draft = service.completionDraft;
    if (service.completionStatus !== "submitted" || !draft) return null;
    const categoryName = (id: string) => getCategory(id, data.categories).name;
    const diffs = [
      draft.name !== service.name && ["الاسم", service.name, draft.name],
      draft.phone !== service.phone && ["الهاتف", service.phone, draft.phone],
      (draft.phoneSecondary ?? "") !== (service.phoneSecondary ?? "") && ["هاتف إضافي", service.phoneSecondary || "—", draft.phoneSecondary || "—"],
      draft.category !== service.category && ["التخصص", categoryName(service.category), categoryName(draft.category)],
      draft.area !== service.area && ["المنطقة", service.area, draft.area],
      draft.address !== service.address && ["العنوان", service.address || "—", draft.address || "—"],
      draft.description !== service.description && ["الوصف", service.description, draft.description],
    ].filter(Boolean) as Array<[string, string, string]>;
    return <div className="admin-draft-request" role="group" aria-label="طلب تعديل من صاحب الخدمة">
      <strong><Pencil size={14}/> طلب تعديل من صاحب الخدمة{draft.updatedAt ? ` — ${new Date(draft.updatedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}` : ""}</strong>
      {diffs.length > 0 ? <ul>{diffs.map(([label, before, after]) => <li key={label}><b>{label}:</b> <s>{before}</s> ← <mark>{after}</mark></li>)}</ul> : <p>لا توجد فروق عن البيانات الحالية.</p>}
      <div>
        <button type="button" className="button button-success button-small" disabled={busy === service.id} onClick={() => void approveProviderCompletion(service)}><Check size={14}/>اعتماد ونشر</button>
        <button type="button" className="button button-danger-soft button-small" disabled={busy === service.id} onClick={() => void rejectProviderCompletion(service)}><X size={14}/>رفض مع ملاحظة</button>
      </div>
    </div>;
  }
  function renderCompletionSubtitle(service: ServiceRecord) {
    const missing = missingServiceData(service);
    const cStatus = service.completionStatus ?? "none";
    const statusText = cStatus === "requested"
      ? " • ظهر زر الاستكمال للمهني"
      : cStatus === "submitted"
        ? " • أرسل المهني الاستكمال (بانتظار موافقتك)"
        : cStatus === "rejected"
          ? " • مرفوض (نقطة حمراء للمهني لتصحيح الخطأ)"
          : service.status === "needs-info"
            ? " • بانتظار استكمال صاحب الطلب"
            : "";
    return `${getCategory(service.category, data.categories).name}${missing.length > 0 ? ` • ناقص: ${missing.join("، ")}` : ""}${statusText}`;
  }
  async function copyAvailabilityLink(service: ServiceRecord) {
    setBusy(service.id);
    try {
      const response = await fetch("/api/admin", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: service.id, type: "service", action: "availability-link" }) });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) { window.location.assign(response.status === 401 ? "/login" : "/account"); return; }
      if (!response.ok || !result.link) throw new Error(result.error ?? "تعذر إنشاء اللينك.");
      if (result.services) { setData(result); knownNotifications.current = new Set(result.notifications.map((item: NotificationRecord) => item.id)); }
      const url = `${window.location.origin}${result.link}`;
      try { await navigator.clipboard.writeText(url); setToast({ text: `تم نسخ لينك تجديد إتاحة ${service.name}.. ابعتله على واتساب صاحب المهنة.`, error: false }); }
      catch { window.prompt("انسخ اللينك يدويًا:", url); }
    } catch (error) { setToast({ text: error instanceof Error ? error.message : "تعذر الاتصال.", error: true }); } finally { setBusy(null); }
  }
  /** رابط «حسابي» لصاحب الخدمة: يُنشأ (أو يُجدَّد) ثم يُنسخ أو يُفتح واتساب برسالة جاهزة له. */
  async function sendAccountLink(service: ServiceRecord, mode: "copy" | "whatsapp", reset = false) {
    setBusy(service.id);
    try {
      const response = await fetch("/api/admin", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: service.id, type: "service", action: reset ? "account-link-reset" : "account-link" }) });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) { window.location.assign(response.status === 401 ? "/login" : "/account"); return; }
      if (!response.ok || !result.link) throw new Error(result.error ?? "تعذر إنشاء اللينك.");
      if (result.services) { setData(result); knownNotifications.current = new Set(result.notifications.map((item: NotificationRecord) => item.id)); }
      const url = `${window.location.origin}${result.link}`;
      if (mode === "whatsapp") {
        const text = `أهلًا ${service.name} 👋\nده رابط حسابك الخاص على دليل جنزور، تقدر منه تعدّل نبذتك ومواعيدك وقائمة خدماتك وتفعّل «متاح الآن» بنفسك في أي وقت:\n${url}\n\n⚠️ الرابط سري وخاص بك، لا تشاركه مع أحد.`;
        window.open(whatsappUrl(service.phone, text), "_blank", "noopener,noreferrer");
        setToast({ text: `فتحنا واتساب ${service.name} برسالة فيها لينك حسابه.`, error: false });
        return;
      }
      try { await navigator.clipboard.writeText(url); setToast({ text: `${reset ? "تم تجديد" : "تم نسخ"} لينك حساب ${service.name}.. ابعتهوله على واتساب.`, error: false }); }
      catch { window.prompt("انسخ اللينك يدويًا:", url); }
    } catch (error) { setToast({ text: error instanceof Error ? error.message : "تعذر الاتصال.", error: true }); } finally { setBusy(null); }
  }
  function selectTab(value: Tab) { setTab(value); setMobileMenuOpen(false); setSearch(""); setRootFilter(""); setAreaFilter(""); setSelectedServiceIds([]); setSelectMode(false); setStatus(value === "requests" ? "pending" : "all"); setCommunityStatus(value === "community" ? "pending" : "all"); setNotificationSelectionMode(false); setSelectedNotificationIds(new Set()); setBulkDeleteConfirmation(null); }
  async function mutate(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, success = "تم الحفظ بنجاح.") {
    const key = typeof body?.id === "string" ? body.id : method === "GET" ? "refresh" : "saving"; setBusy(key);
    try {
      const response = await fetch("/api/admin", { method, cache: "no-store", headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) { window.location.assign(response.status === 401 ? "/login" : "/account"); throw new Error("لم تعد هذه الجلسة تملك صلاحية لوحة الإدارة."); }
      if (!response.ok) throw new Error(result.error ?? "تعذر تنفيذ الطلب.");
      setData(result); knownNotifications.current = new Set(result.notifications.map((item: NotificationRecord) => item.id));
      setToast({ text: success, error: false }); return true;
    } catch (error) { setToast({ text: error instanceof Error ? error.message : "تعذر الاتصال.", error: true }); return false; }
    finally { setBusy(null); }
  }
  async function change(id: string, kind: EntityKind, action: string) {
    const reviewNote = action === "reject" && kind === "service" ? window.prompt("سبب الرفض أو إيقاف النشر (يظهر لصاحب رابط المتابعة):") : undefined;
    if (action === "reject" && kind === "service" && !reviewNote?.trim()) return;
    const ok = await mutate("PATCH", { id, type: kind, action, reviewNote }, action === "approve" ? "تمت الموافقة، والخدمة ظهرت في الدليل." : action === "feature" ? "تم تحديث تمييز الخدمة." : "تم إيقاف النشر وتحديث الطلب.");
    if (ok) setConfirmation(null);
  }
  async function changeCommunityListing(listing: CommunityListingRecord, action: "approve" | "reject" | "sold" | "filled") {
    const message = action === "approve" ? "تمت الموافقة على الإعلان، وسيظهر في القسم المناسب وعلى الرئيسية."
      : action === "sold" ? "تم تعليم العقار كمبيع، واختفى الإعلان من العرض العام."
      : action === "filled" ? "تم تعليم الوظيفة كمشغولة، واختفى الإعلان من العرض العام."
      : "تم إيقاف الإعلان، ولن يظهر للزوار.";
    await mutate("PATCH", { id: listing.id, type: "community", action }, message);
  }
  const visibleSelectedIds = selectedServiceIds.filter((id) => filteredServices.some((service) => service.id === id));
  async function runBulkServiceAction(action: "approve" | "reject", ids: string[]) {
    const reviewNote = action === "reject" ? window.prompt("سبب الرفض للمهن المحددة (يظهر لصاحب رابط المتابعة):") : undefined;
    if (action === "reject" && !reviewNote?.trim()) return;
    setBusy("bulk"); setBulkServiceAction(null);
    let done = 0, failed = 0, latest = null as AdminDirectory | null;
    try {
      for (const id of ids) {
        try {
          const response = await fetch("/api/admin", { method: "PATCH", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, type: "service", action, reviewNote }) });
          if (response.status === 401 || response.status === 403) { window.location.assign(response.status === 401 ? "/login" : "/account"); break; }
          const result = await response.json();
          if (!response.ok) { failed += 1; continue; }
          latest = result as AdminDirectory; done += 1;
        } catch { failed += 1; }
      }
      if (latest) { setData(latest); knownNotifications.current = new Set(latest.notifications.map((item) => item.id)); }
      setSelectedServiceIds([]);
      const verb = action === "approve" ? "نشر" : "رفض";
      setToast({ text: failed ? `تم ${verb} ${done} مهنة، وتعذّر ${failed}.` : `تم ${verb} ${done} مهنة بنجاح.`, error: failed > 0 && done === 0 });
    } finally { setBusy(null); }
  }
  async function saveEditor(values: Record<string, unknown>) {
    if (!editing) return false;
    const ok = await mutate(editing.item ? "PATCH" : "POST", { type: editing.kind, action: "edit", id: editing.item?.id, values }, editing.item ? "تم حفظ التعديلات." : "تمت الإضافة بنجاح.");
    if (ok) setEditing(null); return ok;
  }
  async function moveCategory(category: CategoryRecord, direction: "up" | "down") { await mutate("PATCH", { type: "category", id: category.id, action: "move", direction }, "تم تحديث الترتيب."); }
  function siblingPosition(category: CategoryRecord) {
    const siblings = data.categories.filter((item) => item.parentId === category.parentId);
    const index = siblings.findIndex((item) => item.id === category.id);
    return { first: index <= 0, last: index === siblings.length - 1 };
  }
  async function toggleCategory(category: CategoryRecord) { await mutate("PATCH", { type: "category", id: category.id, action: "edit", values: { ...category, active: !category.active } }, category.active ? "تم إخفاء التصنيف وخدماته دون حذفها." : "تم إظهار التصنيف."); }
  async function logout() { setBusy("logout"); try { const response = await fetch("/api/auth", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/"); } catch { setBusy(null); setToast({ text: "تعذر الخروج. حاول مرة أخرى.", error: true }); } }
  async function enableNotifications() { try { if (typeof Notification === "undefined") return; const value = await Notification.requestPermission(); setPermission(value); setToast({ text: value === "granted" ? "تم تفعيل تنبيهات المتصفح أثناء فتح لوحة التحكم." : "تنبيهات اللوحة تظل شغالة حتى بدون إذن المتصفح.", error: false }); } catch { setToast({ text: "المتصفح لا يدعم التنبيهات هنا. إشعارات اللوحة تظل متاحة.", error: true }); } }
  async function openNotification(notification: NotificationRecord) {
    const destination: Tab = notification.type === "service" ? "requests" : notification.type === "community" ? "community" : notification.type === "rating" ? "ratings" : notification.type === "ad-request" ? "ads" : "members";
    if (!notification.read) await mutate("PATCH", { type: "notification", id: notification.id, action: "read" }, "تم تحديد الإشعار كمقروء.");
    selectTab(destination);
    const label = notification.type === "service"
      ? data.services.find((item) => item.id === notification.entityId)?.name
      : notification.type === "community"
        ? data.communityListings.find((item) => item.id === notification.entityId)?.title
        : notification.type === "ad-request"
          ? ""
          : data.members.find((item) => item.id === notification.entityId)?.name;
    setSearch(label ?? "");
    if (destination === "requests") setStatus("all");
    if (destination === "community") setCommunityStatus("all");
  }
  function toggleNotificationSelection(id: string) {
    setSelectedNotificationIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAllNotifications() {
    setSelectedNotificationIds(allNotificationsSelected ? new Set() : new Set(data.notifications.map((notification) => notification.id)));
  }
  async function deleteBulkNotifications() {
    if (!bulkDeleteConfirmation) return;
    const { ids, deleteAll } = bulkDeleteConfirmation;
    const ok = await mutate("DELETE", { type: "notification", action: deleteAll ? "delete-all" : "delete-selected", ...(deleteAll ? {} : { ids }) }, deleteAll ? "تم حذف كل الإشعارات." : `تم حذف ${ids.length} إشعار.`);
    if (ok) { setSelectedNotificationIds(new Set()); setNotificationSelectionMode(false); setBulkDeleteConfirmation(null); }
  }
  const descriptions: Record<Tab, string> = { events: "أضف مناسبات القرية (أفراح، قوافل، معارض…) وتحكّم في التهاني الموسمية اللي بتظهر تلقائيًا في الشريط والهيدر.", ads: "ارفع GIF من جهازك أو اختر قالبًا متحركًا جاهزًا، واربط كل إعلان بصفحة المعلن وواتسابه، وحدّد أسعار الإعلانات بالجنيه.", requests: "المهن الجديدة بتوصلك هنا، ومعاها إشعار، قبل ما تظهر لأي زائر.", community: "راجع بيانات العمالة اليومية والعقارات والوظائف. الإعلان لا يظهر للزوار قبل الموافقة.", directory: isModerator ? "استعرض الخدمات المنشورة وبياناتها." : "عدّل بيانات أي مقدم خدمة، وميّز الخدمات أو أوقف نشرها.", sponsors: "إدارة الشاشة العائمة لباقات الرعاية والتميز (١٠ أيام مجاناً) وتفعيل الرعاة المعتمدين وعروض اليوم وإعلانات الشريط المتحرك.", completion: "قائمة مرتبة بالمهن والطلبات التي تحتاج استكمال بياناتها في جدول رباعي الأعمدة لسرعة المراجعة.", analytics: "إحصائيات شاملة لتغطية الأقسام، أكثر كلمات البحث والتفاعلات، والتخصصات التي تحتاج لإضافة مهنيين بجنزور.", categories: "الأقسام الرئيسية والتخصصات بداخلها. أضف، عدّل، أخفِ أو احذف.", addresses: "عناوين جنزور، مع اختيار عنوان آخر وخانة كتابة تلقائية للزائر.", members: "الأعضاء المسجلون بالموقع فقط. العضوية لا تضيف الشخص إلى المهنيين.", ratings: "تقييمات الأعضاء للمهن. التقييم يظهر في الدليل بعد موافقتك فقط.", posts: "مولّد منشورات فيسبوك وواتساب جاهزة للنشر في جروبات جنزور بأسماء وأرقام المهن المنشورة.", replies: "قوالب رسائل وردود جاهزة لمراسلة المهنيين عبر واتساب أو إرسال إشعارات فورية بضغطة واحدة.", notifications: isModerator ? "إشعارات طلبات المهن وإعلانات المجتمع المتاحة لصلاحيتك." : "طلبات المهن والأعضاء الجدد وإعلانات المجتمع.. محفوظة لحين قراءتها.", design: "تحكم كامل في ألوان، عناوين، محاذاة، براويز، أيقونات، هيدر، فوتر، وشاشة الدخول والعضوية مع معاينة حية فورية.", settings: "إعدادات هوية الموقع ونصوصه ورقم التواصل وروابط السوشيال ميديا وتنبيهات الإدارة.", codes: "نصوص صفحة الأكواد العلوية، أسماء وألوان أقسام الأكواد (الدعم/الرصيد/الإنترنت/المحفظة)، وخيارات العرض مثل QR.", import: "ارفع ملف Excel، راجع الأسماء والأرقام والتكرارات، ثم أضف المعامل كطلبات بانتظار الموافقة.", activity: "كل إجراء نفّذه الأدمن أو المشرفون (قبول، رفض، تعديل، حذف…) باسم من نفّذه ووقته — للمتابعة والمحاسبة.", };
  const editorTitle = editing ? `${editing.item ? "تعديل" : "إضافة"} ${editing.kind === "service" ? "مقدم خدمة" : editing.kind === "category" ? "تصنيف أو تخصص" : editing.kind === "area" ? "عنوان" : "عضو"}` : "";
  const count = tab === "requests" || tab === "directory" ? filteredServices.length : tab === "completion" ? filteredIncompleteServices.length : tab === "community" ? filteredCommunityListings.length : tab === "members" ? filteredMembers.length : tab === "ratings" ? filteredRatings.length : tab === "posts" || tab === "replies" || tab === "sponsors" ? undefined : tab === "notifications" ? unread : undefined;
  const communityPending = data.communityListings.filter((listing) => listing.status === "pending").length;

  return <div className={`admin-shell ${isModerator ? "admin-shell-moderator" : ""}`} data-palette={palette}><DesignApplicator design={data.designSettings}/><aside ref={sidebar} className={`admin-sidebar ${mobileMenuOpen ? "admin-sidebar-open" : ""}`}><Logo compact footer name="دليل جنزور" logoUrl={data.designSettings?.headerLogoUrl}/><div className="admin-sidebar-label">{isModerator ? "إشراف دليل جنزور" : "إدارة دليل جنزور"}</div><button type="button" className="admin-mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-controls="admin-section-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X size={18}/> : <Menu size={18}/>}<span className="admin-mobile-toggle-title">{title}</span><span className="admin-mobile-toggle-pill">الأقسام</span><ChevronDown size={16} className={`admin-mobile-chevron ${mobileMenuOpen ? "is-open" : ""}`}/></button><div className="admin-sidebar-menu"><nav id="admin-section-navigation" aria-label="أقسام لوحة الإدارة">{visibleTabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => selectTab(item.id)}><item.icon size={18}/><b>{item.name}</b>{item.id === "requests" && pending > 0 ? <span>{pending}</span> : item.id === "completion" && incompleteServices.length > 0 ? <span>{incompleteServices.length}</span> : item.id === "community" && communityPending > 0 ? <span>{communityPending}</span> : item.id === "notifications" && unread > 0 ? <span>{unread}</span> : item.id === "members" ? <span>{data.memberCount}</span> : item.id === "ratings" && ratingsPending > 0 ? <span>{ratingsPending}</span> : null}</button>)}</nav>{!isModerator && <div className="admin-palette-picker" role="radiogroup" aria-label="لون لوحة الإدارة (مشترك لكل الأدمنز والمشرفين)" title="لون اللوحة — يتغير عند كل الأدمنز والمشرفين"><span className="admin-palette-label"><Palette size={14}/> لون اللوحة</span><span className="admin-palette-dots">{ADMIN_PALETTES.map((item) => <button key={item.id} type="button" role="radio" aria-checked={palette === item.id} className={`admin-palette-dot ${palette === item.id ? "is-active" : ""}`} style={{ background: item.swatch }} title={item.name} aria-label={item.name} disabled={busy === "saving"} onClick={() => void choosePalette(item.id)}/>)}</span></div>}<div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noopener noreferrer"><Grid2X2 size={17}/>عرض الموقع</a><a href={whatsappUrl(data.settings.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/>واتساب الإدارة</a><button onClick={logout} disabled={busy === "logout"}><LogOut size={17}/>خروج</button></div></div></aside><main className="admin-main"><header className="admin-topbar"><div className="admin-topbar-title"><h1>{isModerator ? "لوحة إشراف دليل جنزور" : "لوحة إدارة دليل جنزور"}</h1></div><div className="admin-topbar-actions">{!isModerator && <button type="button" className={`button button-small admin-design-quick-btn ${tab === "sponsors" ? "button-amber" : "button-soft"}`} onClick={() => selectTab("sponsors")}><Crown size={16}/><span>باقات الرعاية</span></button>}{!isModerator && <button type="button" className={`button button-small admin-design-quick-btn ${tab === "design" ? "button-primary" : "button-soft"}`} onClick={() => selectTab("design")}><Palette size={16}/><span>استوديو المظهر</span></button>}<button className="admin-notification-button" onClick={() => selectTab("notifications")} aria-label="فتح إشعارات الإدارة"><BellRing size={19}/>{unread > 0 && <span className="bell-count">{unread}</span>}</button><div className="admin-user"><span><UserRound size={18}/></span><strong>{username}</strong></div></div></header>
    <div className="admin-stats"><button className="admin-stat" onClick={() => selectTab("requests")}><span className="stat-icon stat-orange"><FileClock size={24}/></span><div><span>مهن بانتظار المراجعة</span><strong>{pending}</strong><small>راجعها قبل النشر</small></div></button><button className="admin-stat" onClick={() => selectTab("directory")}><span className="stat-icon stat-green"><BadgeCheck size={24}/></span><div><span>مهن منشورة في الدليل</span><strong>{published}</strong><small>ظاهرة في تخصصاتها</small></div></button>{!isModerator && <button className="admin-stat" onClick={() => selectTab("members")}><span className="stat-icon stat-blue"><UsersRound size={24}/></span><div><span>عدد أعضاء الموقع</span><strong>{data.memberCount}</strong><small>عضويات مستقلة عن المهن</small></div></button>}<button className="admin-stat" onClick={() => selectTab("addresses")}><span className="stat-icon stat-purple"><MapPin size={24}/></span><div><span>عناوين جنزور</span><strong>{data.areas.length}</strong><small>مناطق مرتبطة بالمهن</small></div></button><button className="admin-stat" onClick={() => selectTab("notifications")}><span className="stat-icon stat-orange"><Bell size={24}/></span><div><span>الإشعارات غير المقروءة</span><strong>{unread}</strong><small>طلبات وتقييمات جديدة</small></div></button></div>
    <section className="admin-content"><div className="admin-content-heading"><div><h2>{title}{count !== undefined && <span>{count}</span>}</h2><p>{descriptions[tab]}</p></div><div className="admin-heading-actions"><button className="button button-soft refresh-button" onClick={() => mutate("GET", undefined, "تم تحديث الطلبات والبيانات.")} disabled={busy === "refresh"}><RotateCw size={17} className={busy === "refresh" ? "spin" : ""}/>تحديث</button>{(tab === "requests" || tab === "directory" || tab === "completion") && !isModerator && <button className="button button-primary button-small" onClick={() => setEditing({ kind: "service" })}><Plus size={16}/>إضافة مهنة</button>}{tab === "directory" && !isModerator && data.services.length > 0 && <button className="button button-danger-soft button-small" onClick={() => { setPurgeWord(""); setPurgeOpen(true); }}><Trash2 size={16}/>تفريغ جدول المهنيين</button>}{tab === "categories" && <button className="button button-primary button-small" onClick={() => setEditing({ kind: "category" })}><Plus size={16}/>تصنيف جديد</button>}{tab === "addresses" && <button className="button button-primary button-small" onClick={() => setEditing({ kind: "area" })}><Plus size={16}/>عنوان جديد</button>}</div></div>
    {["requests", "community", "directory", "completion", "members", "categories", "ratings"].includes(tab) && <div className="admin-toolbar"><div className="admin-search"><Search size={19}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "community" ? "ابحث بالاسم أو المهنة أو الهاتف..." : "ابحث بالاسم أو الهاتف أو التخصص..."} aria-label="البحث في بيانات الإدارة"/></div>{tab === "requests" && <SelectField value={status} onChange={(event) => setStatus(event.target.value)} aria-label="حالة الطلب"><option value="all">كل الحالات</option><option value="pending">قيد المراجعة</option><option value="needs-info">بانتظار الاستكمال</option><option value="rejected">مرفوض / موقوف</option></SelectField>}{tab === "community" && <SelectField value={communityStatus} onChange={(event) => setCommunityStatus(event.target.value)} aria-label="حالة إعلان المجتمع"><option value="pending">قيد المراجعة</option><option value="approved">منشور</option><option value="sold">تم البيع</option><option value="filled">تم شغل الوظيفة</option><option value="rejected">مرفوض / موقوف</option><option value="all">كل الحالات</option></SelectField>}{["requests", "directory", "completion"].includes(tab) && <SelectField value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} aria-label="المنطقة"><option value="">كل المناطق</option>{data.areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}</SelectField>}{["requests", "directory", "completion", "categories"].includes(tab) && <SelectField value={rootFilter} onChange={(event) => setRootFilter(event.target.value)} aria-label="التصنيف الرئيسي"><option value="">كل الأقسام</option>{roots.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField>}{(tab === "requests" || tab === "directory") && <button type="button" className={`button button-small admin-dup-toggle ${dupOnly ? "button-amber" : "button-soft"}`} aria-pressed={dupOnly} title="إظهار الخدمات التي لها نفس الهاتف أو اسم شديد الشبه فقط" onClick={() => setDupOnly((value) => !value)}><CopyCheck size={16}/><span>فحص المكررات</span>{duplicateCount > 0 && <em className="admin-dup-count">{duplicateCount}</em>}</button>}</div>}
    {tab === "requests" && filteredServices.length > 0 && (() => {
      const allSelected = filteredServices.every((service) => selectedServiceIds.includes(service.id));
      const approvable = (visibleSelectedIds.length ? filteredServices.filter((service) => visibleSelectedIds.includes(service.id)) : filteredServices).filter((service) => service.status !== "approved").map((service) => service.id);
      const rejectable = (visibleSelectedIds.length ? filteredServices.filter((service) => visibleSelectedIds.includes(service.id)) : filteredServices).filter((service) => service.status === "pending").map((service) => service.id);
      const scope = visibleSelectedIds.length ? "المحدد" : "الكل";
      return <div className="admin-bulk-bar admin-bulk-bar-v2" role="toolbar" aria-label="إجراءات جماعية على طلبات المهن">
        <button type="button" className={`button button-small ${selectMode ? "button-primary" : "button-soft"}`} aria-pressed={selectMode} onClick={() => { const next = !selectMode; setSelectMode(next); if (!next) setSelectedServiceIds([]); }}><ListChecks size={15}/>تحديد</button>
        <button type="button" className="button button-soft button-small" onClick={() => { setSelectMode(true); setSelectedServiceIds(allSelected ? [] : filteredServices.map((service) => service.id)); }}>{allSelected ? <><SquareMinus size={15}/>إلغاء التحديد</> : <><CheckSquare size={15}/>تحديد الكل ({filteredServices.length})</>}</button>
        <span className="admin-bulk-spacer" aria-hidden="true"/>
        {visibleSelectedIds.length > 0 && <span className="admin-bulk-count">المحدد: {visibleSelectedIds.length}</span>}
        <button type="button" className="button button-success button-small" disabled={busy === "bulk" || approvable.length === 0} onClick={() => setBulkServiceAction({ action: "approve", ids: approvable })}><CheckCheck size={15}/>موافقة {scope}{approvable.length ? ` (${approvable.length})` : ""}</button>
        <button type="button" className="button button-danger button-small" disabled={busy === "bulk" || rejectable.length === 0} onClick={() => setBulkServiceAction({ action: "reject", ids: rejectable })}><XCircle size={15}/>رفض {scope}{rejectable.length ? ` (${rejectable.length})` : ""}</button>
      </div>;
    })()}{(tab === "requests" || tab === "directory") && <div className="admin-service-list">{filteredServices.map((service) => <article className={`admin-service-row${tab === "requests" && (selectMode || selectedServiceIds.length > 0) ? " has-select" : ""}${tab === "requests" ? " is-request-row" : ""}${selectedServiceIds.includes(service.id) ? " is-selected" : ""}`} key={service.id}>{tab === "requests" && (selectMode || selectedServiceIds.length > 0) && <label className="admin-select-check"><input type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={() => setSelectedServiceIds((current) => current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id])} aria-label={`تحديد ${service.name}`}/></label>}<div className="admin-service-summary"><span className="admin-category-icon" style={{ color: getCategory(service.category, data.categories).color, background: getCategory(service.category, data.categories).light }}><CategoryIcon icon={getCategory(service.category, data.categories).icon} size={26}/></span><div className="admin-service-name"><div><h3>{service.name}</h3><span className={`status-badge status-${service.status}`}>{statusLabels[service.status]}</span>{service.featured && <span className="admin-featured-badge"><Star size={12} fill="currentColor"/>مميز</span>}{service.demo && <span className="admin-demo-badge">نموذج توضيحي</span>}</div><p><span>{getCategory(service.category, data.categories).name}</span><span><MapPin size={12}/>{service.address || service.area}</span><a href={`tel:${service.phone}`} dir="ltr"><Phone size={12}/>{service.phone}</a></p></div><span className="admin-date">{new Date(service.createdAt).toLocaleDateString("ar-EG")}</span></div><p className="admin-service-description">{service.description}</p>{(duplicates.get(service.id) ?? []).length > 0 && <div className="admin-dup-warning" role="note"><TriangleAlert size={16}/><div><b>مكرر محتمل:</b>{(duplicates.get(service.id) ?? []).slice(0, 3).map((hit) => <button key={hit.id} type="button" className="admin-dup-link" title="فتح إجراءات الخدمة المشابهة" onClick={() => { const other = data.services.find((item) => item.id === hit.id); if (other) openServiceMenu(other); }}>{hit.reason === "phone" ? <Phone size={12}/> : <UserRound size={12}/>}{hit.reason === "phone" ? `نفس الرقم عند «${hit.name}»` : `اسم مشابه «${hit.name}»`}<small>({statusLabels[hit.status] ?? hit.status})</small></button>)}</div></div>}{renderDraftRequest(service)}{tab === "directory" ? <div className="admin-directory-only-actions"><button type="button" className="button button-soft button-small admin-card-menu-button" aria-haspopup="dialog" aria-label={`إجراءات ${service.name}`} onClick={() => openServiceMenu(service)}><EllipsisVertical size={17}/>إجراءات</button></div> : <div className="admin-request-icons" aria-label={`إجراءات ${service.name}`}>
                  {service.status !== "approved" && <button type="button" className="admin-req-icon is-approve" disabled={busy === service.id} title="موافقة ونشر" aria-label={`موافقة ونشر ${service.name}`} onClick={() => change(service.id, "service", "approve")}><Check size={20} strokeWidth={3}/></button>}
                  {service.status === "pending" && <button type="button" className="admin-req-icon is-reject" disabled={busy === service.id} title="رفض" aria-label={`رفض ${service.name}`} onClick={() => change(service.id, "service", "reject")}><X size={20} strokeWidth={3}/></button>}
                  {service.status === "approved" && <button type="button" className="admin-req-icon is-reject" disabled={busy === service.id} title="إيقاف النشر" aria-label={`إيقاف نشر ${service.name}`} onClick={() => change(service.id, "service", "reject")}><EyeOff size={18}/></button>}
                  <button type="button" className="admin-req-icon is-more" aria-haspopup="dialog" title="إجراءات" aria-label={`إجراءات ${service.name}`} onClick={() => openServiceMenu(service)}><SlidersHorizontal size={18}/></button>
                </div>}</article>)}{!filteredServices.length && <AdminEmpty title={search ? "مفيش نتائج للبحث" : "كل الطلبات تحت السيطرة!"} text="أي مهنة جديدة هتوصلك هنا للمراجعة، ومعاها إشعار. مفيش نشر تلقائي."/>}</div>}
    {tab === "completion" && (completionPairs.length > 0 ? <div className="admin-completion-table-wrap"><table className="admin-completion-table" aria-label="جدول استكمال بيانات المهن"><thead><tr><th>الاسم</th><th>الإجراء</th><th>الاسم</th><th>الإجراء</th></tr></thead><tbody>{completionPairs.map(([first, second]) => <tr key={first.id}><td className="completion-name-cell"><strong>{first.name}</strong><small>{renderCompletionSubtitle(first)}</small></td><td className="completion-action-cell">{renderCompletionCell(first)}</td>{second ? <><td className="completion-name-cell"><strong>{second.name}</strong><small>{renderCompletionSubtitle(second)}</small></td><td className="completion-action-cell">{renderCompletionCell(second)}</td></> : <><td className="completion-name-cell is-empty" aria-hidden="true"/><td className="completion-action-cell is-empty" aria-hidden="true"/></>}</tr>)}</tbody></table></div> : <AdminEmpty title={search ? "مفيش نتائج مطابقة" : "كل بيانات المهن مكتملة!"} text="أي مهنة ينقصها وصف أو واتساب أو صورة أو عنوان تفصيلي ستظهر هنا لاستكمالها بسهولة."/>)}
    {tab === "community" && <div className="admin-community-list">{filteredCommunityListings.map((listing) => <article className="admin-community-row" key={listing.id}><div className="admin-community-summary"><span className={`admin-community-icon is-${listing.type}`}>{listing.type === "labor" ? <Hammer size={22}/> : listing.type === "property" ? <Building2 size={22}/> : <BriefcaseBusiness size={22}/>}</span><div className="admin-community-info"><div className="admin-community-badges"><span className={`status-badge status-${listing.status}`}>{statusLabels[listing.status] ?? listing.status}</span><span className="community-type-badge">{communityTypeLabels[listing.type]}</span><time>{new Date(listing.createdAt).toLocaleDateString("ar-EG")}</time></div><h3>{listing.title}</h3>{listing.type === "labor" && listing.profession && <strong className="admin-community-profession">{listing.profession}</strong>}<p>{listing.description || (listing.type === "labor" ? "بيانات عامل يومي" : "لا توجد تفاصيل إضافية.")}</p><div className="admin-community-meta"><a href={`tel:${listing.phone}`} dir="ltr"><Phone size={13}/>{listing.phone}</a>{listing.area && <span><MapPin size={13}/>{listing.area}</span>}{listing.price && <strong>{listing.price}</strong>}</div></div></div><div className="admin-community-actions">{listing.status !== "approved" && <button className="button button-success button-small" disabled={busy === listing.id} onClick={() => void changeCommunityListing(listing, "approve")}><Check size={15}/>موافقة ونشر</button>}{listing.status === "approved" && listing.type === "property" && <button className="button button-soft button-small" disabled={busy === listing.id} onClick={() => void changeCommunityListing(listing, "sold")}><BadgeCheck size={15}/>تم البيع</button>}{listing.status === "approved" && listing.type === "job" && <button className="button button-soft button-small" disabled={busy === listing.id} onClick={() => void changeCommunityListing(listing, "filled")}><BriefcaseBusiness size={15}/>تم شغل الوظيفة</button>}{(listing.status === "pending" || listing.status === "approved") && <button className="button button-danger-soft button-small" disabled={busy === listing.id} onClick={() => void changeCommunityListing(listing, "reject")}><X size={15}/>{listing.status === "approved" ? "إيقاف الإعلان" : "رفض"}</button>}</div></article>)}{!filteredCommunityListings.length && <AdminEmpty title={search ? "مفيش نتائج للبحث" : communityStatus === "pending" ? "لا توجد إعلانات بانتظار المراجعة" : "لا توجد إعلانات في هذه الحالة"} text="إعلانات العقارات والوظائف وطلبات العمالة اليومية التي تصل من الموقع ستظهر هنا لمراجعتها."/>}</div>}
    {tab === "categories" && <div className="categories-management" ref={categoriesPanel}>{filteredRoots.map((category) => <div className="category-management-group" data-open={search || openCategoryGroups[category.id] ? "true" : "false"} style={{ "--group-color": category.color, "--group-light": category.light } as CSSProperties} key={category.id}><div className="category-management-heading" role="button" tabIndex={0} aria-expanded={Boolean(search || openCategoryGroups[category.id])} onClick={(event) => { if ((event.target as HTMLElement).closest("button, a, input, select")) return; setOpenCategoryGroups((current) => ({ ...current, [category.id]: !current[category.id] })); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpenCategoryGroups((current) => ({ ...current, [category.id]: !current[category.id] })); } }}><span className="admin-category-icon admin-category-art" style={{ background: category.light, color: category.color }}><MainCategoryIcon icon={category.icon} art={category.art} size={34}/></span><div><h3>{category.name}<span className={`status-badge ${category.active ? "status-approved" : "status-rejected"}`}>{category.active ? "ظاهر" : "مخفي"}</span></h3></div><div className="category-management-actions"><span className="category-order-arrows"><button className="icon-button" disabled={busy === category.id || siblingPosition(category).first} onClick={() => void moveCategory(category, "up")} aria-label={`تحريك ${category.name} لأعلى`}><ArrowUp size={15}/></button><button className="icon-button" disabled={busy === category.id || siblingPosition(category).last} onClick={() => void moveCategory(category, "down")} aria-label={`تحريك ${category.name} لأسفل`}><ArrowDown size={15}/></button></span><button className="button button-soft button-small" onClick={() => setEditing({ kind: "category", parentId: category.id })}><Plus size={14}/>تخصص</button><button className="icon-button" onClick={() => setEditing({ kind: "category", item: category })} aria-label={`تعديل ${category.name}`}><Pencil size={16}/></button><button className="icon-button" onClick={() => toggleCategory(category)} aria-label={`${category.active ? "إخفاء" : "إظهار"} ${category.name}`}>{category.active ? <EyeOff size={16}/> : <Eye size={16}/>}</button><button className="icon-button admin-delete" onClick={() => setConfirmation({ id: category.id, kind: "category", action: "delete", label: category.name })} aria-label={`حذف ${category.name}`}><Trash2 size={16}/></button></div></div>{data.categories.some((item) => item.parentId === category.id) && <button type="button" className="category-group-toggle" aria-expanded={Boolean(search || openCategoryGroups[category.id])} onClick={() => setOpenCategoryGroups((current) => ({ ...current, [category.id]: !current[category.id] }))}><ChevronDown size={16}/><span>{search || openCategoryGroups[category.id] ? "إخفاء التخصصات" : `عرض التخصصات (${data.categories.filter((item) => item.parentId === category.id).length})`}</span></button>}<div className="specialties-management-list">{data.categories.filter((item) => item.parentId === category.id && (!search || normalizeSearch(item.name).includes(normalizeSearch(search)) || normalizeSearch(category.name).includes(normalizeSearch(search)))).map((item) => <div className="category-management-row" key={item.id}><CategoryIcon icon={item.icon} size={18}/><div><strong>{item.name}</strong><span>{data.services.filter((service) => service.category === item.id).length} مهنة مرتبطة</span></div><span className={`status-badge ${item.active ? "status-approved" : "status-rejected"}`}>{item.active ? "ظاهر" : "مخفي"}</span><div className="category-management-actions"><span className="category-order-arrows"><button className="icon-button" disabled={busy === item.id || siblingPosition(item).first} onClick={() => void moveCategory(item, "up")} aria-label={`تحريك ${item.name} لأعلى`}><ArrowUp size={14}/></button><button className="icon-button" disabled={busy === item.id || siblingPosition(item).last} onClick={() => void moveCategory(item, "down")} aria-label={`تحريك ${item.name} لأسفل`}><ArrowDown size={14}/></button></span><button className="icon-button" onClick={() => setEditing({ kind: "category", item })} aria-label={`تعديل ${item.name}`}><Pencil size={15}/></button><button className="icon-button" onClick={() => toggleCategory(item)} aria-label={`${item.active ? "إخفاء" : "إظهار"} ${item.name}`}>{item.active ? <EyeOff size={15}/> : <Eye size={15}/>}</button><button className="icon-button admin-delete" onClick={() => setConfirmation({ id: item.id, kind: "category", action: "delete", label: item.name })} aria-label={`حذف ${item.name}`}><Trash2 size={15}/></button></div></div>)}</div></div>)}{!filteredRoots.length && <AdminEmpty title="مفيش تصنيفات مطابقة" text="أضف تصنيفًا رئيسيًا جديدًا، ثم أضف التخصصات بداخله."/>}</div>}
    {tab === "addresses" && <div className="address-management-list">{data.areas.map((area) => <div className="address-management-row" key={area.id}><span><MapPin size={22}/></span><div><h3>{area.name}</h3><p>{data.services.filter((service) => service.area === area.name).length} خدمة مرتبطة • الترتيب {area.sortOrder}</p></div><button className="button button-soft button-small" onClick={() => setEditing({ kind: "area", item: area })}><Pencil size={14}/>تعديل</button><button className="icon-button admin-delete" onClick={() => setConfirmation({ id: area.id, kind: "area", action: "delete", label: area.name })} aria-label={`حذف ${area.name}`}><Trash2 size={15}/></button></div>)}<div className="form-notice"><MapPin size={23}/><span>اختيار «عنوان آخر» موجود تلقائيًا، وبيظهر بعده تكست بوكس صغير لكتابة العنوان.</span></div></div>}
    {tab === "members" && <><div className="member-count-banner"><UsersRound size={31}/><div><strong>{data.memberCount} عضو مسجل في الموقع</strong><span>لا يشمل حساب الأدمن، ولا يمثل عدد المهنيين.</span></div></div><div className="admin-member-list">{filteredMembers.map((member) => <article className="admin-member-row" key={member.id}><span className="member-row-avatar"><UserRound size={23}/></span><div><h3>{member.name}<span className={`status-badge ${member.active ? "status-approved" : "status-rejected"}`}>{member.active ? "نشط" : "موقوف"}</span>{member.role === "moderator" && <span className="status-badge status-approved">مشرف</span>}</h3><p><span dir="ltr">@{member.username}</span><span dir="ltr">{member.phone}</span><span>انضم {new Date(member.createdAt).toLocaleDateString("ar-EG")}</span></p></div><div className="member-row-actions"><button className="button button-soft button-small" onClick={() => setEditing({ kind: "member", item: member })}><Pencil size={14}/>تعديل</button><button className={`button button-small ${member.active ? "button-danger-soft" : "button-success"}`} disabled={busy === member.id} onClick={() => mutate("PATCH", { type: "member", id: member.id, values: { active: !member.active } }, member.active ? "تم إيقاف العضوية وإنهاء جلساتها." : "تم تفعيل العضوية.")}>{member.active ? "إيقاف" : "تفعيل"}</button><button className="icon-button admin-delete" onClick={() => setConfirmation({ id: member.id, kind: "member", action: "delete", label: member.name })} aria-label={`حذف العضو ${member.name}`}><Trash2 size={15}/></button></div></article>)}{!filteredMembers.length && <AdminEmpty title="لسه مفيش أعضاء هنا" text="أي تسجيل جديد هيظهر كعضوية مستقلة هنا، وليس كمهنة في الدليل."/>}</div></>}
    {tab === "posts" && <AdminReplies mode="posts" services={data.services} categories={data.categories} onNotified={(next, message) => { if (next?.services) setData(next); setToast({ text: message, error: false }); }}/>}
    {tab === "replies" && <AdminReplies mode="replies" services={data.services} categories={data.categories} onNotified={(next, message) => { if (next?.services) setData(next); setToast({ text: message, error: false }); }}/>}
        {tab === "ratings" && <div className="admin-ratings-list">{filteredRatings.map((rating) => <article className="admin-rating-row" key={rating.id}><span className={`rating-row-stars ${rating.status === "approved" ? "is-approved" : rating.status === "rejected" ? "is-rejected" : ""}`}>{[1, 2, 3, 4, 5].map((step) => <Star key={step} size={15} fill={step <= rating.stars ? "currentColor" : "none"}/>)}</span><div className="rating-row-copy"><h3>{rating.serviceName}<span className={`status-badge ${rating.status === "approved" ? "status-approved" : rating.status === "rejected" ? "status-rejected" : "status-pending"}`}>{rating.status === "approved" ? "معروض في الدليل" : rating.status === "rejected" ? "مرفوض" : "بانتظار المراجعة"}</span></h3><p>{rating.comment || "بدون تعليق"}</p><small>بواسطة {rating.memberName} • {new Date(rating.createdAt).toLocaleString("ar-EG")}</small></div><div className="rating-row-actions">{rating.status === "pending" && <button className="button button-success button-small" disabled={busy === rating.id} onClick={() => mutate("PATCH", { id: rating.id, type: "rating", action: "approve" }, "تمت الموافقة.. التقييم ظهر في الدليل.")}><Check size={15}/>موافقة</button>}{rating.status !== "rejected" && <button className="button button-danger-soft button-small" disabled={busy === rating.id} onClick={() => mutate("PATCH", { id: rating.id, type: "rating", action: "reject" }, "تم رفض التقييم ولن يظهر في الدليل.")}><X size={15}/>رفض</button>}{!isModerator && <button className="icon-button admin-delete" disabled={busy === rating.id} onClick={() => mutate("DELETE", { id: rating.id, type: "rating" }, "تم حذف التقييم نهائيًا.")} aria-label="حذف التقييم"><Trash2 size={15}/></button>}</div></article>)}{!filteredRatings.length && <AdminEmpty title="لسه مفيش تقييمات" text="أول ما عضو يقيّم مهنة، التقييم هيظهر هنا للمراجعة قبل النشر."/>}</div>}
    {tab === "activity" && !isModerator && <div className="activity-log-list">{(data.activityLog ?? []).length === 0 && <p className="empty-state">لا يوجد نشاط مسجل بعد — هيظهر هنا أول إجراء من الأدمن أو المشرفين.</p>}{(data.activityLog ?? []).filter((entry) => !search || `${entry.actorName} ${entry.actorUsername} ${entry.entityLabel} ${entry.detail} ${activityKindLabel(entry.entityKind)} ${activityActionLabel(entry.action)}`.includes(search)).map((entry) => <article className={`activity-log-row is-${entry.actorRole}`} key={entry.id}><span className="activity-log-avatar">{entry.actorRole === "admin" ? <ShieldCheck size={18}/> : <UserRound size={18}/>}</span><div className="activity-log-body"><p><b>{entry.actorName}</b>{entry.actorUsername && <small>@{entry.actorUsername}</small>}<span className={`activity-log-role is-${entry.actorRole}`}>{entry.actorRole === "admin" ? "أدمن" : "مشرف"}</span></p><p className="activity-log-action"><strong>{activityActionLabel(entry.action)}</strong> — {activityKindLabel(entry.entityKind)}{entry.entityLabel && <>: <em>{entry.entityLabel}</em></>}</p>{entry.detail && <p className="activity-log-detail">{entry.detail}</p>}</div><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}</time></article>)}</div>}
    {tab === "notifications" && <><div className="notification-tools"><button className="button button-soft button-small" onClick={() => mutate("PATCH", { type: "notification", action: "read-all" }, "تم تحديد كل الإشعارات كمقروءة.")}><CheckCheck size={17}/>تحديد الكل كمقروء</button>{data.notifications.length > 0 && <><button className="button button-soft button-small" aria-pressed={notificationSelectionMode} onClick={() => { setNotificationSelectionMode(!notificationSelectionMode); setSelectedNotificationIds(new Set()); }}>{notificationSelectionMode ? "إلغاء التحديد" : "تحديد"}</button>{notificationSelectionMode && <><button className="button button-soft button-small notification-select-all" onClick={toggleAllNotifications}>{allNotificationsSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}</button>{selectedNotificationIds.size > 0 && <button className="button button-danger-soft button-small" onClick={() => setBulkDeleteConfirmation({ ids: [...selectedNotificationIds], deleteAll: allNotificationsSelected })}><Trash2 size={16}/>{allNotificationsSelected ? "حذف الكل" : `حذف المحدد (${selectedNotificationIds.size})`}</button>}</>}</>}{permission !== "unsupported" && <button className="button button-soft button-small" onClick={enableNotifications} disabled={permission === "granted"}><BellRing size={17}/>{permission === "granted" ? "تنبيهات المتصفح مفعّلة" : "تفعيل تنبيهات المتصفح"}</button>}</div><p className="notification-help">الطلبات تُفحص كل ١٠ ثوانٍ أثناء فتح اللوحة. إشعارات المتصفح تحتاج إذنك، وإشعارات اللوحة متاحة دائمًا.</p><div className="notifications-list">{data.notifications.map((notification) => <article key={notification.id} className={`notification-row ${notification.read ? "" : "notification-unread"} ${selectedNotificationIds.has(notification.id) ? "notification-row-selected" : ""}`}>{notificationSelectionMode && <label className="notification-row-checkbox"><input type="checkbox" checked={selectedNotificationIds.has(notification.id)} onChange={() => toggleNotificationSelection(notification.id)} aria-label={`تحديد إشعار: ${notification.title}`}/></label>}<span className="notification-type-icon">{notification.type === "service" ? <FileClock size={23}/> : notification.type === "community" ? <Megaphone size={23}/> : notification.type === "rating" ? <Star size={23}/> : notification.type === "suggestion" || notification.type === "service-update" ? <MessageSquareWarning size={23}/> : notification.type === "ad-request" ? <Megaphone size={23}/> : <UserRound size={23}/>}</span><div><h3>{notification.title}{!notification.read && <span>جديد</span>}</h3><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleString("ar-EG")}</small></div><div className="notification-row-actions">{extractEgyptPhone(notification.message) && <a className="button button-soft button-small notification-whatsapp" href={whatsappReplyLink(extractEgyptPhone(notification.message), notification.title)} target="_blank" rel="noopener noreferrer" title="رد عبر واتساب"><MessageCircle size={15}/>واتساب</a>}<button className="button button-soft button-small" onClick={() => openNotification(notification)}>عرض<ChevronLeft size={14}/></button></div></article>)}{!data.notifications.length && <AdminEmpty title="مفيش إشعارات حاليًا" text="طلبات المهن والتسجيلات الجديدة ستظهر هنا تلقائيًا."/>}</div></>}
    {tab === "analytics" && <AdminAnalytics data={data} onAddServiceInCategory={() => setEditing({ kind: "service" })} onEditService={(service) => setEditing({ kind: "service", item: service })}/>}
    {tab === "events" && <AdminEvents events={data.events ?? []} greetings={data.greetingSettings} busy={busy} mutate={mutate} onConfirmDelete={(event) => setConfirmation({ id: event.id, kind: "event", action: "delete", label: `مناسبة: ${event.title}` })}/>}
    {tab === "ads" && <AdminAds ads={data.ads ?? []} requests={data.adRequests ?? []} services={data.services} categories={data.categories} busy={busy} mutate={mutate} siteName={data.settings.siteName} logoUrl={data.designSettings?.headerLogoUrl ?? ""} pricing={data.adPricing ?? defaultAdPricing} onConfirmDelete={(ad) => setConfirmation({ id: ad.id, kind: "ad", action: "delete", label: `إعلان: ${ad.title}` })} onConfirmDeleteRequest={(request) => setConfirmation({ id: request.id, kind: "ad-request", action: "delete", label: `طلب إعلان: ${request.business || request.name}` })}/>}
    {tab === "sponsors" && <AdminSponsors services={data.services} categories={data.categories} designSettings={data.designSettings} fallbackPhone={data.settings.phone} onSaveDesign={(values) => mutate("PATCH", { type: "design-settings", values }, "تم حفظ إعدادات باقات الرعاية والتميز وتحديث الرعاة بنجاح.")}/>}
    {tab === "design" && <DesignCustomizer key="design-customizer" initialDesign={data.designSettings} categories={data.categories} onSave={(values) => mutate("PATCH", { type: "design-settings", values }, "تم حفظ وتطبيق المظهر والهيكل الجديد على الموقع بنجاح.")}/>}
    {tab === "codes" && <AdminCodesSettings key="codes-settings" initial={data.telecomSettings} onSave={(values) => mutate("PATCH", { type: "codes-settings", values }, "تم حفظ إعدادات صفحة الأكواد وظهرت على الموقع.")}/>}
    {tab === "settings" && <SettingsEditor key="full-settings" settings={data.settings} designSettings={data.designSettings} alertKinds={data.whatsappAlertKinds} alertStatus={data.whatsappAlertStatus} onSaveAlertKinds={(kinds) => mutate("PATCH", { type: "whatsapp-alert-kinds", kinds }, "تم حفظ أحداث تنبيهات واتساب.")} onSave={(values) => mutate("PATCH", { type: "settings", values }, "تم حفظ إعدادات الموقع ومحتواه.")} onSaveDesign={(values) => mutate("PATCH", { type: "design-settings", values }, "تم حفظ إعدادات الموقع ومحتواه بالكامل.")}/>}
    {tab === "import" && <AdminImport data={data} onImported={() => { void mutate("GET", undefined, "تم تحديث طلبات المعامل."); }}/>}
    </section><footer className="admin-footer"><p className="admin-footer-copyright">{data.settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</p><span><LockKeyhole size={13}/>{isModerator ? "مشرف بصلاحيات محدودة • جلسة محمية" : "أدمن فقط • جلسة محمية"}</span></footer></main>
    {toast && <div className={`admin-toast ${toast.error ? "toast-error" : ""}`} role={toast.error ? "alert" : "status"}>{toast.error ? <CircleX size={20}/> : <CheckCircle2 size={20}/>}<span>{toast.text}</span><button onClick={() => setToast(null)} aria-label="إغلاق التنبيه"><X size={16}/></button></div>}
    {editing && <Modal title={editorTitle} subtitle="كل التعديلات محفوظة في قاعدة بيانات الموقع" onClose={closeEditor} wide={editing.kind === "service" || editing.kind === "category"}><ManagementEditor key={`${editing.kind}-${editing.item?.id ?? "new"}`} editing={editing} data={data} onSave={saveEditor}/></Modal>}
    {confirmation && <Modal title="حذف نهائي؟" onClose={closeConfirmation}><div className="confirmation-content"><span className="confirm-delete-icon"><Trash2 size={32}/></span><h3>{confirmation.label}</h3><p>الحذف نهائي ولا يمكن التراجع عنه. التصنيف أو العنوان المرتبط بمهن لا يُحذف قبل نقلها، ويمكن إخفاء التصنيف بدل حذفه.</p><div className="confirmation-buttons"><button className="button button-danger" disabled={busy === confirmation.id} onClick={async () => { if (await mutate("DELETE", { id: confirmation.id, type: confirmation.kind }, "تم الحذف نهائيًا.")) setConfirmation(null); }}>{busy === confirmation.id ? <LoaderCircle size={18} className="spin"/> : <Check size={18}/>} نعم، احذف نهائيًا</button><button className="button button-soft" onClick={closeConfirmation}>إلغاء</button></div></div></Modal>}
    {bulkServiceAction && <Modal title={bulkServiceAction.action === "approve" ? "نشر المهن المحددة؟" : "رفض المهن المحددة؟"} onClose={() => setBulkServiceAction(null)}><div className="confirmation-content"><span className={bulkServiceAction.action === "approve" ? "confirm-approve-icon" : "confirm-delete-icon"}>{bulkServiceAction.action === "approve" ? <Check size={32}/> : <X size={32}/>}</span><h3>{bulkServiceAction.ids.length} مهنة</h3><p>{bulkServiceAction.action === "approve" ? "هتظهر في الدليل للزوار فور الموافقة." : "هتتشال من ظهور الزوار، وتفضل محفوظة في قسم الطلبات."}</p><div className="confirmation-buttons"><button className={bulkServiceAction.action === "approve" ? "button button-success" : "button button-danger"} disabled={busy === "bulk"} onClick={() => void runBulkServiceAction(bulkServiceAction.action, bulkServiceAction.ids)}>{busy === "bulk" ? <LoaderCircle size={18} className="spin"/> : bulkServiceAction.action === "approve" ? <Check size={18}/> : <X size={18}/>} {bulkServiceAction.action === "approve" ? "نعم، انشر" : "نعم، ارفض"}</button><button className="button button-soft" onClick={() => setBulkServiceAction(null)}>إلغاء</button></div></div></Modal>}{purgeOpen && <Modal title="تفريغ جدول المهنيين؟" onClose={() => setPurgeOpen(false)}><div className="confirmation-content"><span className="confirm-delete-icon"><Trash2 size={32}/></span><h3>{data.services.length} مهني سيتم حذفهم</h3><p>سيتم مسح كل المهنيين (المنشورين وقيد المراجعة) مع تقييماتهم وإشعاراتهم نهائيًا. التصنيفات والأعضاء والإعدادات تبقى كما هي، ويمكن إضافة مهنيين جدد من التطبيق بعدها بشكل طبيعي.</p><label className="purge-confirm-field"><span>اكتب كلمة <strong>تفريغ</strong> للتأكيد</span><input value={purgeWord} onChange={(event) => setPurgeWord(event.target.value)} placeholder="تفريغ" autoComplete="off" aria-label="كلمة التأكيد"/></label><div className="confirmation-buttons"><button className="button button-danger" disabled={busy === "saving" || purgeWord.trim() !== "تفريغ"} onClick={() => void (async () => { const ok = await mutate("DELETE", { type: "service", action: "purge-all", confirm: purgeWord.trim() }, "تم تفريغ جدول المهنيين بالكامل."); if (ok) setPurgeOpen(false); })()}>{busy === "saving" ? <LoaderCircle size={18} className="spin"/> : <Trash2 size={18}/>} نعم، فرّغ الجدول</button><button className="button button-soft" onClick={() => setPurgeOpen(false)}>إلغاء</button></div></div></Modal>}{bulkDeleteConfirmation && <Modal title="حذف الإشعارات؟" onClose={() => setBulkDeleteConfirmation(null)}><div className="confirmation-content"><span className="confirm-delete-icon"><Trash2 size={32}/></span><h3>{bulkDeleteConfirmation.deleteAll ? "كل الإشعارات" : `${bulkDeleteConfirmation.ids.length} إشعار`}</h3><p>الحذف نهائي ولا يمكن التراجع عنه.</p><div className="confirmation-buttons"><button className="button button-danger" disabled={busy === "saving"} onClick={() => void deleteBulkNotifications()}>{busy === "saving" ? <LoaderCircle size={18} className="spin"/> : <Trash2 size={18}/>} {bulkDeleteConfirmation.deleteAll ? "نعم، احذف الكل" : "نعم، احذف المحدد"}</button><button className="button button-soft" onClick={() => setBulkDeleteConfirmation(null)}>إلغاء</button></div></div></Modal>}
  {serviceMenu && <AdminActionSheet title={serviceMenu.title} subtitle={serviceMenu.subtitle} items={serviceMenu.items} onClose={() => setServiceMenu(null)}/>}
  </div>;
}
function AdminEmpty({ title, text }: { title: string; text: string }) { return <div className="empty-state admin-empty"><span><FileClock size={36}/></span><h3>{title}</h3><p>{text}</p></div>; }

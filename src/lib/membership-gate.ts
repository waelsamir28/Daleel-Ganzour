import { isServiceOwner, type DesignSettings, type PublicDirectory, type ServiceRecord, type Viewer } from "@/lib/catalog";

/** Only same-site paths are accepted as a post-login destination (prevents open redirects). */
export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\") || /[\r\n]/.test(candidate)) return fallback;
  if (candidate.startsWith("/api/") || candidate.startsWith("/login") || candidate.startsWith("/register")) return fallback;
  return candidate.slice(0, 500);
}

export function registerUrl(next: string) {
  return `/register?next=${encodeURIComponent(safeNextPath(next))}`;
}
export function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(safeNextPath(next))}`;
}

/** Where a visitor lands after signing in or registering. */
export function postAuthDestination(role: Viewer["role"], next?: unknown) {
  if (role === "admin" || role === "moderator") return "/admin";
  return safeNextPath(next, "/");
}

/**
 * Visitors without an account may browse, but while `membershipRequired` is on they cannot see
 * provider contact numbers or open section pages until they register.
 */
export function guestLocked(viewer: Pick<Viewer, "role">, design: Pick<DesignSettings, "membershipRequired"> | undefined) {
  if (viewer.role !== "guest") return false;
  return !design || design.membershipRequired !== false;
}

/** Strip every contact number before the data reaches a guest's browser (cards, detail page and the polling API). */
export function maskServiceForGuest<T extends Pick<ServiceRecord, "phone" | "phoneSecondary" | "menuWhatsapp">>(service: T): T {
  return { ...service, phone: "", phoneSecondary: "", menuWhatsapp: "" };
}
export function maskDirectoryForGuest<T extends Pick<PublicDirectory, "services">>(data: T): T {
  return { ...data, services: data.services.map(maskServiceForGuest) };
}
/**
 * إشعارات المهنيين (رسائل الإدارة عن استكمال/اعتماد البيانات) شخصية: لا يصل للمتصفح إلا ما يخص خدمات
 * هذا العضو نفسه (مطابقة هاتفه/اسمه)، ولا شيء للزائر — فلا يرى عضو رسائل موجهة لمهني آخر.
 */
export function personalNotificationsFor<T extends Pick<PublicDirectory, "services" | "providerNotifications">>(data: T, viewer: Viewer): T {
  if (!data.providerNotifications?.length) return data;
  if (viewer.role === "guest") return { ...data, providerNotifications: [] };
  const owned = new Set(data.services.filter((service) => isServiceOwner(service, viewer)).map((service) => service.id));
  return { ...data, providerNotifications: data.providerNotifications.filter((item) => item.entityId && owned.has(item.entityId)) };
}
export function directoryForViewer<T extends Pick<PublicDirectory, "services" | "designSettings" | "providerNotifications">>(data: T, viewer: Viewer): T {
  const personal = personalNotificationsFor(data, viewer);
  return guestLocked(viewer, data.designSettings) ? maskDirectoryForGuest(personal) : personal;
}

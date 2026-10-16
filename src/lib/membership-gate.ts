import { redirect } from "next/navigation";
import type { DesignSettings, Viewer } from "@/lib/catalog";

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

/** Where a visitor lands after signing in or registering. */
export function postAuthDestination(role: Viewer["role"], next?: unknown) {
  if (role === "admin" || role === "moderator") return "/admin";
  return safeNextPath(next, "/");
}

/**
 * Directory pages are members-only while `membershipRequired` is on: guests are redirected to the
 * registration screen and brought back to the page they wanted once they have an account.
 */
export function enforceMembership(viewer: Viewer, design: Pick<DesignSettings, "membershipRequired"> | undefined, currentPath: string) {
  if (viewer.role !== "guest") return;
  if (design && design.membershipRequired === false) return;
  redirect(registerUrl(currentPath));
}

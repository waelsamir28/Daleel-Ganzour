"use client";

import { CONTACT_EVENT } from "@/lib/quick-rating";

export type AnalyticsEventRecord = {
  kind: "search" | "view" | "call" | "whatsapp" | "share";
  label: string;
  serviceId?: string;
  categoryId?: string;
  timestamp: number;
};

const STORAGE_KEY = "janzour-analytics-log-v1";
const MAX_EVENTS = 250;

export function readAnalyticsEvents(): AnalyticsEventRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AnalyticsEventRecord =>
        Boolean(item && typeof item === "object" && typeof item.kind === "string" && typeof item.label === "string"),
    );
  } catch {
    return [];
  }
}

// Server-side aggregate per specialty (feeds «أهم مهن القرية»). Anonymous; de-duplicated per
// browser session so repeated taps on the same provider do not inflate the ranking.
const HIT_SESSION_KEY = "janzour-hits-sent-v1";
export function sendCategoryHit(categoryId: string | undefined, kind: "view" | "contact", dedupeKey = categoryId) {
  if (typeof window === "undefined" || !categoryId) return;
  try {
    const key = `${kind}:${dedupeKey}`;
    const sent: string[] = JSON.parse(sessionStorage.getItem(HIT_SESSION_KEY) ?? "[]");
    if (sent.includes(key)) return;
    sessionStorage.setItem(HIT_SESSION_KEY, JSON.stringify([...sent, key].slice(-200)));
  } catch {
    // session storage unavailable — still count the hit
  }
  try {
    void fetch("/api/hits", { method: "POST", keepalive: true, headers: { "content-type": "application/json", "x-silent": "1" }, body: JSON.stringify({ categoryId, kind }) }).catch(() => undefined);
  } catch {
    // ignore network errors
  }
}

export function trackDirectoryEvent(event: Omit<AnalyticsEventRecord, "timestamp">) {
  if (typeof window === "undefined") return;
  // أي ضغطة «اتصال» أو «واتساب» على مقدم خدمة تُطلق حدثًا تسمعه بطاقة التقييم السريع.
  if ((event.kind === "call" || event.kind === "whatsapp") && event.serviceId) {
    window.dispatchEvent(new CustomEvent(CONTACT_EVENT, { detail: { serviceId: event.serviceId, label: event.label } }));
  }
  if (event.kind === "view") sendCategoryHit(event.categoryId, "view", event.serviceId ?? event.categoryId);
  if (event.kind === "call" || event.kind === "whatsapp") sendCategoryHit(event.categoryId, "contact", `${event.kind}:${event.serviceId ?? event.categoryId}`);
  try {
    const label = event.label.trim();
    if (!label) return;
    const current = readAnalyticsEvents();
    const next: AnalyticsEventRecord[] = [
      { ...event, label, timestamp: Date.now() },
      ...current,
    ].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAnalyticsEvents() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

"use client";

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

export function trackDirectoryEvent(event: Omit<AnalyticsEventRecord, "timestamp">) {
  if (typeof window === "undefined") return;
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

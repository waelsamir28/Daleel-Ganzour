"use client";

import { useEffect, useState } from "react";
import { phoneDigits, type ServiceRecord } from "@/lib/catalog";

/**
 * «هل الزائر الحالي صاحب هذا الكارت؟» — ليتمكن من إضافة/تغيير صورته من دائرة الكارت مباشرة:
 * - عضو مسجّل برقم هاتف مطابق لرقم المهنة (يُقرأ مرة واحدة من /api/profile).
 * - أو دخل من قبل على رابط «حسابي» الخاص بالمهنة على نفس الجهاز (التوكن محفوظ محليًا).
 */
export type ViewerIdentity = { memberId: string; phone: string; name: string; photoUrl: string } | null;
export type Ownership = { ready: boolean; viewer: ViewerIdentity; tokens: Record<string, string> };

const TOKENS_KEY = "janzour-my-tokens";
let cached: Ownership | null = null;
let pending: Promise<Ownership> | null = null;
const listeners = new Set<(next: Ownership) => void>();

export function readMyTokens(): Record<string, string> {
  try { const raw = localStorage.getItem(TOKENS_KEY); const parsed = raw ? JSON.parse(raw) : {}; return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; }
}
/** يُستدعى من صفحة «حسابي» ليتذكر الجهاز أن صاحبه يملك هذه المهنة. */
export function rememberMyToken(serviceId: string, token: string) {
  try {
    const tokens = readMyTokens(); tokens[serviceId] = token; localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    if (cached) { cached = { ...cached, tokens }; listeners.forEach((listener) => listener(cached!)); }
  } catch { /* ignore */ }
}

async function load(): Promise<Ownership> {
  const tokens = readMyTokens();
  let viewer: ViewerIdentity = null;
  try {
    const response = await fetch("/api/profile", { cache: "no-store" });
    const data = await response.json();
    if (data?.member) viewer = { memberId: data.member.id, phone: data.member.phone, name: data.member.name, photoUrl: data.photoUrl ?? "" };
  } catch { /* زائر */ }
  cached = { ready: true, viewer, tokens };
  listeners.forEach((listener) => listener(cached!));
  return cached;
}
export function refreshOwnership() { pending = load(); return pending; }

export function useOwnership(): Ownership {
  const [state, setState] = useState<Ownership>(() => cached ?? { ready: false, viewer: null, tokens: {} });
  useEffect(() => {
    listeners.add(setState);
    if (!cached) (pending ??= load()).then((next) => setState(next)).catch(() => undefined);
    return () => { listeners.delete(setState); };
  }, []);
  return state;
}

export function ownsService(ownership: Ownership, service: Pick<ServiceRecord, "id" | "phone" | "phoneSecondary">): boolean {
  if (!ownership.ready) return false;
  if (ownership.tokens[service.id]) return true;
  const mine = ownership.viewer ? phoneDigits(ownership.viewer.phone) : "";
  if (!mine) return false;
  return phoneDigits(service.phone) === mine || (!!service.phoneSecondary && phoneDigits(service.phoneSecondary) === mine);
}

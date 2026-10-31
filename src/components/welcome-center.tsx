"use client";

import { useCallback, useEffect, useState } from "react";
import WelcomeModal from "@/components/welcome-modal";
import {
  memberWelcome,
  memberWelcomeKey,
  parseSeenMap,
  providerApproved,
  providerAttention,
  providerPending,
  providerStatusKey,
  rememberWelcome,
  shouldShowWelcome,
  WELCOME_STORAGE_PREFIX,
  type WelcomeMessage,
} from "@/lib/welcome-messages";

type ProviderSnapshot = { serviceId: string; name: string; status: string; statusUpdatedAt: string; reviewNote?: string; accountHref?: string; publicHref?: string };

/** يبني الرسالة المناسبة لحالة المهنة، أو null لو الحالة مش محتاجة رسالة. */
function messageForProvider(provider: ProviderSnapshot, siteName: string): WelcomeMessage | null {
  const key = providerStatusKey(provider.serviceId, provider.statusUpdatedAt);
  const accountHref = provider.accountHref || "/";
  const publicHref = provider.publicHref || "/";
  const base =
    provider.status === "approved"
      ? providerApproved(provider.name, publicHref, accountHref)
      : provider.status === "needs-info" || provider.status === "rejected"
        ? providerAttention(provider.status, provider.reviewNote ?? "", accountHref)
        : provider.status === "pending"
          ? providerPending(provider.name, accountHref)
          : null;
  if (!base) return null;
  void siteName;
  return { ...base, storageKey: key };
}

/**
 * مركز الرسائل الترحيبية:
 * 1) بعد التسجيل مباشرة (‎?welcome=member) → ترحيب بالعضو الجديد.
 * 2) أي فتح للموقع: لو فيه مهنة للعضو حالتها اتغيرت (اتوافق عليها مثلًا) تظهر رسالة مرة واحدة.
 */
export default function WelcomeCenter() {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);
  const [kind, setKind] = useState("");

  const readSeen = useCallback(() => {
    try { return localStorage.getItem("janzour-welcome-seen-v1") ?? "{}"; } catch { return "{}"; }
  }, []);

  const show = useCallback((next: WelcomeMessage, nextKind: string) => {
    const seen = parseSeenMap(readSeen());
    if (!shouldShowWelcome(next.storageKey, seen[nextKind])) return;
    setKind(nextKind);
    setMessage(next);
  }, [readSeen]);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const freshMember = url.searchParams.get("welcome") === "member";
    void (async () => {
      try {
        const response = await fetch("/api/welcome", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { member?: { id: string; name: string } | null; provider?: ProviderSnapshot | null };
        if (cancelled) return;
        // رسالة العضو الجديد: مرة واحدة فقط، وبتُطلق بعد التسجيل مباشرة.
        if (freshMember) {
          // بعد التسجيل بيبقى فيه عضو، ولو الرابط اتفتح لوحده (معاينة) بنعرض نسخة عامة.
          const welcome = memberWelcome(data.member?.name ?? "");
          const seen = parseSeenMap(readSeen());
          const key = memberWelcomeKey(data.member?.id ?? "preview");
          if (shouldShowWelcome(key, seen["member"])) {
            setKind("member");
            setMessage({ ...welcome, storageKey: key });
            // إزالة الباراميتر من الرابط عشان ما تتكررش لو حد عمل Refresh.
            url.searchParams.delete("welcome");
            window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
          }
        }
        // رسالة حالة المهنة: مرة واحدة لكل تغيير حالة (بتظهر أول ما يفتح الموقع).
        if (data.provider) {
          const providerMessage = messageForProvider(data.provider, "دليل جنزور");
          if (providerMessage && !cancelled) {
            const seen = parseSeenMap(readSeen());
            if (shouldShowWelcome(providerMessage.storageKey, seen["provider"])) {
              setKind("provider");
              setMessage(providerMessage);
            }
          }
        }
      } catch {
        // الشبكة مش متاحة — الرسائل اختيارية، مفيش أي خطأ للمستخدم.
      }
    })();
    return () => { cancelled = true; };
  }, [readSeen]);

  if (!message) return null;

  return (
    <WelcomeModal
      message={message}
      onClose={() => {
        try { localStorage.setItem("janzour-welcome-seen-v1", rememberWelcome(readSeen(), kind, message.storageKey)); } catch { /* التخزين ممنوع */ }
        setMessage(null);
      }}
    />
  );
}

/**
 * نفس الشاشة العائمة لكن لصفحة حساب المهني (رابط بدون تسجيل):
 * بتستقبل الحالة من الخادم مباشرة، وبتظهر مرة واحدة لكل تغيير حالة.
 */
export function ProviderStatusWelcome({ serviceId, name, status, statusUpdatedAt, reviewNote = "", accountHref, publicHref }: ProviderSnapshot & { statusUpdatedAt: string }) {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);

  useEffect(() => {
    let stored = "{}";
    try { stored = localStorage.getItem(WELCOME_STORAGE_PREFIX + ":provider-seen") ?? "{}"; } catch { return; }
    const next = messageForProvider({ serviceId, name, status, statusUpdatedAt, reviewNote, accountHref, publicHref }, "دليل جنزور");
    if (!next) return;
    if (!shouldShowWelcome(next.storageKey, parseSeenMap(stored)["provider"])) return;
    // حالة «هل شاف الرسالة» محفوظة في المتصفح فقط، فمينفعش تُقرأ أثناء الرسم على الخادم.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- قراءة التخزين المحلي بعد أول رسم فقط.
    setMessage(next);
  }, [serviceId, name, status, statusUpdatedAt, reviewNote, accountHref, publicHref]);

  if (!message) return null;
  return (
    <WelcomeModal
      message={message}
      onClose={() => {
        try {
          const stored = localStorage.getItem(WELCOME_STORAGE_PREFIX + ":provider-seen") ?? "{}";
          localStorage.setItem(WELCOME_STORAGE_PREFIX + ":provider-seen", rememberWelcome(stored, "provider", message.storageKey));
        } catch { /* التخزين ممنوع */ }
        setMessage(null);
      }}
    />
  );
}

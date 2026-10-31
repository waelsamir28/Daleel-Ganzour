"use client";

import { useCallback, useEffect, useState } from "react";
import WelcomeModal from "@/components/welcome-modal";
import {
  isValidWelcomeKey,
  memberWelcome,
  providerApproved,
  providerAttention,
  providerPending,
  providerStatusKey,
  welcomeAlreadySeen,
  type WelcomeMessage,
} from "@/lib/welcome-messages";
import { markWelcomeSeen, readLocalSeen } from "@/lib/welcome-seen-client";

type ProviderSnapshot = { serviceId: string; name: string; status: string; statusUpdatedAt: string; reviewNote?: string; accountHref?: string; publicHref?: string };

/** يبني رسالة حالة المهنة + مفتاحها الثابت (مرة واحدة للأبد لكل نوع رسالة). */
function messageForProvider(provider: ProviderSnapshot): WelcomeMessage | null {
  const accountHref = provider.accountHref || "/";
  const publicHref = provider.publicHref || "/";
  const tone =
    provider.status === "approved" ? "approved"
    : provider.status === "needs-info" ? "needs-info"
    : provider.status === "rejected" ? "rejected"
    : provider.status === "pending" ? "pending"
    : null;
  if (!tone) return null;
  const key = providerStatusKey(provider.serviceId, tone);
  const base =
    tone === "approved" ? providerApproved(provider.name, publicHref, accountHref)
    : tone === "pending" ? providerPending(provider.name, accountHref)
    : providerAttention(tone, provider.reviewNote ?? "", accountHref);
  return { ...base, storageKey: key };
}

/**
 * مركز الرسائل الترحيبية:
 * 1) بعد التسجيل مباشرة (‎?welcome=member) → ترحيب بالعضو الجديد.
 * 2) أي فتح للموقع: لو فيه مهنة للعضو حالتها اتغيرت تظهر رسالة مناسبة.
 *
 * **قاعدة صارمة:** كل رسالة بتظهر **مرة واحدة بس** في عمرها، وبتُسجَّل «اتشافت»
 * على الخادم + على الجهاز، فمش بترجع تاني خالص (حتى لو الحالة اتغيرت أو المستخدم
 * مسح بيانات المتصفح أو فتح من جهاز تاني).
 */
export default function WelcomeCenter() {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);

  const close = useCallback(() => {
    const key = message?.storageKey;
    setMessage(null);
    if (key && isValidWelcomeKey(key)) void markWelcomeSeen(key);
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const freshMember = url.searchParams.get("welcome") === "member";
    if (freshMember) {
      // إزالة الباراميتر فورًا حتى لا تتكرر المحاولة عند إعادة التحميل.
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    void (async () => {
      try {
        const response = await fetch("/api/welcome", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          member?: { id: string; name: string } | null;
          provider?: ProviderSnapshot | null;
          seen?: string[];
        };
        if (cancelled) return;
        const serverSeen = Array.isArray(data.seen) ? data.seen : [];
        const localSeen = readLocalSeen();
        const seen = (key: string) => welcomeAlreadySeen(key, localSeen, serverSeen);

        // ١) ترحيب العضو الجديد — مرة واحدة فقط.
        if (freshMember) {
          const key = `member:${data.member?.id ?? "guest"}`;
          if (!seen(key)) {
            setMessage({ ...memberWelcome(data.member?.name ?? ""), storageKey: key as WelcomeMessage["storageKey"] });
            return;
          }
        }
        // ٢) رسالة حالة المهنة — مرة واحدة لكل نوع، ومش بترجع بعد كده.
        if (data.provider) {
          const providerMessage = messageForProvider(data.provider);
          if (providerMessage && !seen(providerMessage.storageKey)) setMessage(providerMessage);
        }
      } catch {
        // الشبكة مش متاحة — الرسائل اختيارية، مفيش أي خطأ للمستخدم.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!message) return null;
  return <WelcomeModal message={message} onClose={close}/>;
}

/**
 * نفس الشاشة العائمة لصفحة حساب المهني (رابط بدون تسجيل).
 * بتستقبل «اتشافت قبل كده» من الخادم (seenKeys) — فالرسالة تظهر مرة واحدة بس للأبد.
 */
export function ProviderStatusWelcome({
  serviceId,
  name,
  status,
  statusUpdatedAt,
  reviewNote = "",
  accountHref,
  publicHref,
  seenKeys = [],
}: ProviderSnapshot & { statusUpdatedAt: string; seenKeys?: string[] }) {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);

  useEffect(() => {
    const next = messageForProvider({ serviceId, name, status, statusUpdatedAt, reviewNote, accountHref, publicHref });
    if (!next) return;
    if (welcomeAlreadySeen(next.storageKey, readLocalSeen(), seenKeys)) return;
    // حالة «اتشافت» بتيجي من الخادم/المتصفح، فمينفعش تُقرأ أثناء الرسم على الخادم.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- قراءة التخزين المحلي بعد أول رسم فقط.
    setMessage(next);
  }, [serviceId, name, status, statusUpdatedAt, reviewNote, accountHref, publicHref, seenKeys]);

  if (!message) return null;
  return (
    <WelcomeModal
      message={message}
      onClose={() => {
        const key = message.storageKey;
        setMessage(null);
        if (key) void markWelcomeSeen(key);
      }}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, BellOff, LoaderCircle } from "lucide-react";
import { sanitizePushTopics, urlBase64ToUint8Array } from "@/lib/push-shared";

/**
 * زر «فعّل إشعارات الموقع» في الفوتر: يسجّل الجهاز مرة واحدة، فيوصل الزائر تنبيه
 * لما الإدارة تبعت خبرًا — بدون تطبيق وبدون رقم هاتف. لو الميزة غير مُهيّأة على
 * الخادم (مفاتيح VAPID) الزر ما يظهرش خالص.
 */

type State = "checking" | "hidden" | "off" | "on" | "busy" | "denied" | "error";

function supported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return registration.pushManager.getSubscription();
}

/** أقسام الدليل اللي الزائر يقدر يختار ينبّه لها. */
export type NotifySection = { id: string; name: string };

export default function NotifyToggle({ className = "", sections = [] }: { className?: string; sections?: NotifySection[] }) {
  const [state, setState] = useState<State>("checking");
  const [publicKey, setPublicKey] = useState("");
  const [note, setNote] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const detect = useCallback(async () => {
    if (!supported()) { setState("hidden"); return; }
    try {
      const response = await fetch("/api/push", { cache: "no-store" });
      const data = (await response.json()) as { configured?: boolean; publicKey?: string };
      if (!data.configured || !data.publicKey) { setState("hidden"); return; }
      setPublicKey(data.publicKey);
      if (Notification.permission === "denied") { setState("denied"); return; }
      const subscription = await currentSubscription();
      if (subscription) {
        // أقسام الجهاز المحفوظة على الخادم — الأزرار تظهر مختارة صح بعد إعادة التحميل.
        const mine = await fetch(`/api/push?endpoint=${encodeURIComponent(subscription.endpoint)}`, { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null)).catch(() => null) as { topics?: string[] } | null;
        setTopics(sanitizePushTopics(mine?.topics));
      }
      setState(subscription ? "on" : "off");
    } catch {
      setState("hidden");
    }
  }, []);

  // الفحص بعد أول رسم فقط (المتصفح هو مصدر الحقيقة لحالة الإذن والاشتراك).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- قراءة حالة المتصفح لا تتم على الخادم.
  useEffect(() => { void detect(); }, [detect]);

  async function enable() {
    setState("busy"); setNote("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), topics }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("on");
      setNote("تم تفعيل الإشعارات — هنبلّغك بأي جديد يخص جنزور.");
    } catch {
      setState("error");
      setNote("تعذّر تفعيل الإشعارات على هذا المتصفح. جرّب من موبايلك أو متصفح آخر.");
    }
  }

  async function disable() {
    setState("busy"); setNote("");
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => undefined);
        await subscription.unsubscribe().catch(() => undefined);
      }
      setState("off");
      setNote("تم إيقاف الإشعارات على هذا الجهاز.");
    } catch {
      setState("off");
    }
  }

  /** اختيار/إلغاء قسم — يُحفظ فورًا على الخادم (بدون ما يحتاج يعيد التفعيل). */
  async function toggleTopic(id: string) {
    const next = topics.includes(id) ? topics.filter((item) => item !== id) : [...topics, id];
    setTopics(next);
    try {
      const subscription = await currentSubscription();
      if (!subscription) return;
      await fetch("/api/push", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint, topics: next }) });
      setNote(next.length ? `هنبلّغك بجديد: ${sections.filter((item) => next.includes(item.id)).map((item) => item.name).join(" • ")}` : "هنبلّغك بأي جديد في كل الأقسام.");
    } catch {
      setNote("تعذّر حفظ أقسامك — جرّب تاني.");
    }
  }

  if (state === "hidden" || state === "checking") return null;

  const busy = state === "busy";
  const on = state === "on";
  const label = busy ? "بنجهّز…" : on ? "الإشعارات مفعّلة" : state === "denied" ? "الإشعارات ممنوعة من المتصفح" : "فعّل إشعارات الموقع";
  const Icon = busy ? LoaderCircle : on ? BellRing : state === "denied" ? BellOff : Bell;

  return (
    <div className={`notify-toggle ${className}`}>
      <button
        type="button"
        className={`notify-toggle-btn ${on ? "is-on" : ""} ${state === "denied" ? "is-blocked" : ""}`}
        onClick={() => void (on ? disable() : enable())}
        disabled={busy || state === "denied"}
        aria-pressed={on}
        aria-label={on ? "إيقاف إشعارات الموقع على هذا الجهاز" : "تفعيل إشعارات الموقع على هذا الجهاز"}
      >
        <Icon size={15} className={busy ? "spin" : ""}/>
        <span>{label}</span>
      </button>
      {note && <p className="notify-toggle-note" role="status">{note}</p>}
      {state === "denied" && <p className="notify-toggle-note">فعّل الإشعارات من إعدادات المتصفح لهذا الموقع، ثم أعد تحميل الصفحة.</p>}
      {on && sections.length > 0 && (
        <>
          <button type="button" className="notify-toggle-topics-btn" onClick={() => setPickerOpen((open) => !open)} aria-expanded={pickerOpen}>
            {topics.length ? `أقسامك: ${topics.length} مختار` : "كل الأقسام — اختار اللي يهمك"} {pickerOpen ? "▲" : "▼"}
          </button>
          {pickerOpen && (
            <div className="notify-toggle-topics" role="group" aria-label="اختار أقسام إشعاراتك">
              {sections.map((section) => (
                <button key={section.id} type="button" className={topics.includes(section.id) ? "is-on" : ""} aria-pressed={topics.includes(section.id)} onClick={() => void toggleTopic(section.id)}>
                  {section.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

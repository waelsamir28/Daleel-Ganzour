"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, BellRing, Check, ChevronDown, LoaderCircle, LockKeyhole, Megaphone, Sparkles } from "lucide-react";
import { sanitizePushTopics, urlBase64ToUint8Array } from "@/lib/push-shared";

/**
 * جرس «إشعارات جنزور» في رأس الصفحة:
 * أيقونة أنيقة، وبالضغط عليها تنزل قائمة منسدلة مختصرة —
 * لو الإشعارات مقفولة: شرح سطر واحد + زر واحدة للتشغيل.
 * بعد التفعيل: القائمة بتتحول لأقسام القرية، والزائر يختار اللي يهمه («المدرسين»، «العيادات»…)
 * والتغيير بيتحفظ فورًا بدون إعادة تحميل.
 */

type State = "checking" | "hidden" | "off" | "on" | "busy" | "denied" | "error";
export type NotifySection = { id: string; name: string };

function supported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return registration.pushManager.getSubscription();
}

export default function NotifyToggle({ className = "", sections = [] }: { className?: string; sections?: NotifySection[] }) {
  const [state, setState] = useState<State>("checking");
  const [publicKey, setPublicKey] = useState("");
  const [note, setNote] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

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
  useEffect(() => { setMounted(true); void detect(); }, [detect]);

  /** تثبيت القائمة تحت الجرس مع مراعاة اتجاه الصفحة (RTL) وحجم الشاشة. */
  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(372, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    setPos({ top: rect.bottom + 12, left });
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      if (next) place();
      return next;
    });
  }, [place]);

  // إغلاق بالضغط خارج القائمة أو بمفتاح Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    }
    function onViewport() { place(); }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport);
    };
  }, [open, place]);

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
      // القائمة بتفضل مفتوحة وبتتحول قائمة الأقسام — الزائر يكمل اختياره في نفس المكان.
      place();
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

  /** اختيار/إلغاء قسم — يُحفظ فورًا على الخادم. */
  async function toggleTopic(id: string) {
    const next = topics.includes(id) ? topics.filter((item) => item !== id) : [...topics, id];
    setTopics(next);
    try {
      const subscription = await currentSubscription();
      if (!subscription) return;
      await fetch("/api/push", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint, topics: next }) });
    } catch {
      setNote("تعذّر حفظ الاختيار — جرّب تاني.");
    }
  }

  if (state === "hidden" || state === "checking") return null;

  const busy = state === "busy";
  const on = state === "on";
  const label = on ? "إشعارات جنزور مفعّلة" : "إشعارات جنزور";

  const panel = open && pos && mounted ? createPortal(
    <div
      ref={panelRef}
      className="notify-menu"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label="إشعارات جنزور"
    >
      <div className="notify-menu-head">
        <span className="notify-menu-icon"><BellRing size={20}/></span>
        <div>
          <strong>إشعارات جنزور</strong>
          <span>{on ? "هنبلّغك أول ما ينزل جديد يخصك" : "من غير رقم ومن غير تطبيق — إشعار واحد بس لما يبقى في جديد"}</span>
        </div>
        <span className={`notify-menu-status ${on ? "is-on" : ""}`}>{on ? <><Check size={12}/> مفعّلة</> : "مقفولة"}</span>
      </div>

      <div className="notify-menu-body">
        {state === "denied" ? (
          <p className="notify-menu-note is-warn"><BellOff size={15}/> الإشعارات ممنوعة من المتصفح لهذا الموقع. افتح إعدادات الموقع من المتصفح، اسمح بالإشعارات، وبعدها أعد تحميل الصفحة.</p>
        ) : on ? (
          <>
            <p className="notify-menu-label">اختار الأقسام اللي تهمك</p>
            <div className="notify-menu-chips" role="group" aria-label="أقسام الإشعارات">
              {sections.map((section) => {
                const active = topics.includes(section.id);
                return (
                  <button key={section.id} type="button" className={active ? "is-on" : ""} aria-pressed={active} onClick={() => void toggleTopic(section.id)}>
                    {active && <Check size={12}/>} {section.name}
                  </button>
                );
              })}
            </div>
            <p className="notify-menu-hint">
              {topics.length ? `هنبلّغك بجديد: ${sections.filter((section) => topics.includes(section.id)).map((section) => section.name).join(" • ")}` : "لو مختارش حاجة، هيوصلك أي خبر جديد في الدليل كله."}
            </p>
          </>
        ) : (
          <>
            <ul className="notify-menu-points">
              <li><Sparkles size={14}/> مهن جديدة بتتضاف في القرية</li>
              <li><Megaphone size={14}/> أخبار وعروض موسمية مهمة</li>
              <li><LockKeyhole size={14}/> بدون رقم، بدون تطبيق، وتقدر توقفها في أي وقت</li>
            </ul>
            <button type="button" className="notify-menu-cta" onClick={() => void enable()} disabled={busy}>
              {busy ? <LoaderCircle size={16} className="spin"/> : <BellRing size={16}/>} {busy ? "بنجهّز…" : "تشغيل الإشعارات"}
            </button>
          </>
        )}

        {note && <p className="notify-menu-note">{note}</p>}

        {on && (
          <button type="button" className="notify-menu-off" onClick={() => void disable()} disabled={busy}>
            <BellOff size={13}/> إيقاف الإشعارات على هذا الجهاز
          </button>
        )}
      </div>

      <span className="notify-menu-arrow" aria-hidden="true"/>
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`notify-bell ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`notify-bell-btn ${on ? "is-on" : ""} ${open ? "is-open" : ""}`}
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label} — افتح قائمة الإشعارات`}
        title={label}
        data-no-feedback
      >
        {busy ? <LoaderCircle size={18} className="spin"/> : on ? <BellRing size={18}/> : <Bell size={18}/>}
        {on && <span className="notify-bell-dot" aria-hidden="true"/>}
        <ChevronDown size={12} className="notify-bell-caret" aria-hidden="true"/>
      </button>
      {panel}
    </div>
  );
}

"use client";

import { notificationChime, type NotificationChimeKind } from "@/lib/feedback";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCheck, ChevronLeft, FileClock, Megaphone, Star, UserRound, Volume2, VolumeX, X } from "lucide-react";
import type { NotificationRecord } from "@/lib/catalog";

const SOUND_KEY = "janzour-admin-alert-sound";
const POLL_MS = 10000;

type Feed = { notifications: NotificationRecord[]; unread: number };
function chimeKind(type: string | undefined): NotificationChimeKind { return type === "service" || type === "rating" || type === "community" ? type : "other"; }

/**
 * Floating admin bell on the public pages: polls the review feed, shows the unread count,
 * and plays a short chime (plus a browser notification when allowed) whenever a new
 * profession request arrives while the admin is browsing the site.
 */
export default function AdminAlertsFab() {
  const [feed, setFeed] = useState<Feed>({ notifications: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => { try { return typeof window === "undefined" || localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; } });
  const [soundReady, setSoundReady] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const soundOnRef = useRef(soundOn);

  const ensureAudio = useCallback(async () => {
    try {
      const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      if (!audioRef.current) audioRef.current = new Ctor();
      if (audioRef.current.state === "suspended") await audioRef.current.resume();
      setSoundReady(audioRef.current.state === "running");
      return audioRef.current.state === "running" ? audioRef.current : null;
    } catch { return null; }
  }, []);

  const chime = useCallback(async (kind: NotificationChimeKind) => {
    await ensureAudio();
    notificationChime(kind);
  }, [ensureAudio]);

  // Browsers only allow audio after a user gesture: unlock the context on the first tap/key press.
  useEffect(() => {
    const unlock = () => { void ensureAudio(); };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, [ensureAudio]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as Feed;
        setFeed(data);
        const fresh = data.notifications.filter((item) => !item.read && knownIds.current && !knownIds.current.has(item.id));
        if (knownIds.current && fresh.length) {
          setPulse(true);
          window.setTimeout(() => setPulse(false), 6000);
          const serviceNotice = fresh.find((item) => item.type === "service") ?? fresh[0];
          if (soundOnRef.current) void chime(chimeKind(serviceNotice?.type));
          if (serviceNotice && typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(serviceNotice.title, { body: serviceNotice.message, icon: "/icon-192.png", tag: serviceNotice.id, dir: "rtl", lang: "ar" }); } catch { /* Notification UI unavailable. */ }
          }
        }
        knownIds.current = new Set(data.notifications.map((item) => item.id));
      } catch { /* Keep the last feed on transient network errors. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    window.addEventListener("focus", refresh);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [chime]);

  async function markAllRead() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
      if (response.ok) setFeed((current) => ({ unread: 0, notifications: current.notifications.map((item) => ({ ...item, read: true })) }));
    } catch { /* The next poll resyncs the state. */ }
    finally { setBusy(false); }
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next); soundOnRef.current = next;
    try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* Preference lives for this visit only. */ }
    if (next) void chime("service");
  }

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined" || Notification.permission === "granted") return;
    try { await Notification.requestPermission(); } catch { /* Permission UI unavailable. */ }
  }

  const pendingServices = feed.notifications.filter((item) => item.type === "service" && !item.read).length;
  const typeIcon = (type: string) => type === "service" ? <FileClock size={18}/> : type === "community" ? <Megaphone size={18}/> : type === "rating" ? <Star size={18}/> : <UserRound size={18}/>;
  const targetTab = (type: string) => type === "service" ? "requests" : type === "community" ? "community" : type === "rating" ? "ratings" : "members";

  return (
    <div className={`admin-alerts-fab ${open ? "is-open" : ""} ${pulse ? "is-pulsing" : ""}`}>
      {open && (
        <div className="admin-alerts-panel" role="dialog" aria-label="إشعارات الإدارة">
          <div className="admin-alerts-panel-head">
            <strong><BellRing size={17}/> إشعارات الإدارة {feed.unread > 0 && <span className="admin-alerts-count">{feed.unread}</span>}</strong>
            <div className="admin-alerts-panel-tools">
              <button type="button" className="icon-button" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "كتم صوت التنبيه" : "تشغيل صوت التنبيه"} title={soundOn ? "كتم صوت التنبيه" : "تشغيل صوت التنبيه"}>{soundOn ? <Volume2 size={17}/> : <VolumeX size={17}/>}</button>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={17}/></button>
            </div>
          </div>
          {pendingServices > 0 && <Link href="/admin?tab=requests" className="admin-alerts-pending"><FileClock size={18}/><span>{pendingServices} طلب مهنة جديد بانتظار المراجعة</span><ChevronLeft size={15}/></Link>}
          {soundOn && !soundReady && <button type="button" className="admin-alerts-sound-hint" onClick={() => void chime("service")}><Volume2 size={15}/> اضغط هنا مرة واحدة لتفعيل صوت التنبيه في هذا المتصفح</button>}
          <div className="admin-alerts-list">
            {feed.notifications.slice(0, 8).map((item) => (
              <Link key={item.id} href={`/admin?tab=${targetTab(item.type)}`} className={`admin-alerts-item ${item.read ? "" : "is-unread"}`}>
                <span className="admin-alerts-item-icon">{typeIcon(item.type)}</span>
                <span className="admin-alerts-item-body"><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</small></span>
              </Link>
            ))}
            {!feed.notifications.length && <p className="admin-alerts-empty">لا توجد إشعارات حاليًا. أي طلب مهنة جديد سيظهر هنا فورًا مع صوت تنبيه.</p>}
          </div>
          <div className="admin-alerts-panel-foot">
            <button type="button" className="button button-soft button-small" onClick={() => void markAllRead()} disabled={busy || feed.unread === 0}><CheckCheck size={15}/> تحديد الكل كمقروء</button>
            {typeof Notification !== "undefined" && Notification.permission === "default" && <button type="button" className="button button-soft button-small" onClick={() => void enableBrowserNotifications()}><Bell size={15}/> تنبيهات المتصفح</button>}
            <Link href="/admin?tab=requests" className="button button-primary button-small">لوحة الطلبات<ChevronLeft size={14}/></Link>
          </div>
        </div>
      )}
      <button type="button" className="admin-alerts-fab-main" aria-expanded={open} aria-label={`إشعارات الإدارة${feed.unread ? `، ${feed.unread} غير مقروءة` : ""}`} title="إشعارات طلبات المهن" onClick={() => { setOpen((value) => !value); void ensureAudio(); }}>
        {feed.unread > 0 ? <BellRing size={24}/> : <Bell size={24}/>}
        {feed.unread > 0 && <span className="admin-alerts-badge">{feed.unread > 99 ? "99+" : feed.unread}</span>}
      </button>
    </div>
  );
}

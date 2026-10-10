"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { NotificationRecord } from "@/lib/catalog";

export default function AdminBell() {
  const [items, setItems] = useState<NotificationRecord[]>([]), [unread, setUnread] = useState(0), [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => { if (document.hidden) return; try { const response = await fetch("/api/admin/notifications", { cache: "no-store" }); if (response.ok && !cancelled) { const data = await response.json(); setItems(data.notifications); setUnread(data.unread); } } catch { /* Retry at the next interval. */ } };
    refresh(); const timer = setInterval(refresh, 10000); window.addEventListener("focus", refresh);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  async function markRead() { const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); if (response.ok) { setUnread(0); setItems((current) => current.map((item) => ({ ...item, read: true }))); } }
  return <div className="public-admin-bell"><button className="icon-button" aria-label={`الإشعارات${unread ? `، ${unread} غير مقروءة` : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={20}/>{unread > 0 && <span className="bell-count">{unread > 99 ? "99+" : unread}</span>}</button>{open && <div className="public-notification-dropdown"><div><strong>إشعارات الإدارة</strong><button onClick={markRead} title="تحديد الكل كمقروء"><CheckCheck size={17}/></button></div>{items.length ? items.slice(0, 5).map((item) => <a key={item.id} className={!item.read ? "unread" : ""} href={`/admin?tab=${item.type === "service" ? "requests" : "members"}`}><strong>{item.title}</strong><span>{item.message}</span></a>) : <p>مفيش إشعارات جديدة حاليًا.</p>}<a className="all-notifications" href="/admin?tab=notifications">كل الإشعارات</a></div>}</div>;
}

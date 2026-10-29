"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, FileClock, Megaphone, MessageSquareWarning, RefreshCw, Star, UserRound, UserRoundPen } from "lucide-react";
import { Modal } from "@/components/ui";
import type { NotificationRecord } from "@/lib/catalog";

/**
 * «إشعارات الإدارة» من قائمة ☰ في رأس الموقع (للأدمن فقط — إشعارات الأعضاء تبقى «إشعاراتي» كما هي):
 * مهنة جديدة، عضو جديد، تقييم، طلب إعلان، اقتراح تعديل، تحديث من صاحب الخدمة… مع رابط مباشر للوحة الإدارة.
 */
export type AdminFeed = { notifications: NotificationRecord[]; unread: number };

export async function fetchAdminFeed(): Promise<AdminFeed | null> {
  try {
    const response = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return { notifications: data.notifications ?? [], unread: data.unread ?? 0 };
  } catch { return null; }
}

const kinds: Record<string, { label: string; icon: typeof Bell; tone: string; tab: string }> = {
  service: { label: "مهنة جديدة", icon: FileClock, tone: "orange", tab: "requests" },
  member: { label: "عضو جديد", icon: UserRound, tone: "blue", tab: "members" },
  rating: { label: "تقييم", icon: Star, tone: "gold", tab: "ratings" },
  "ad-request": { label: "طلب إعلان", icon: Megaphone, tone: "purple", tab: "ads" },
  suggestion: { label: "اقتراح تعديل", icon: MessageSquareWarning, tone: "red", tab: "notifications" },
  "service-update": { label: "تحديث من صاحب الخدمة", icon: UserRoundPen, tone: "green", tab: "directory" },
};
const kindOf = (type: string) => kinds[type] ?? { label: "إشعار", icon: Bell, tone: "blue", tab: "notifications" };

export default function AdminNotificationsModal({ feed, onRefresh, onClose }: { feed: AdminFeed; onRefresh: (next: AdminFeed) => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => { void fetchAdminFeed().then((next) => { if (next) onRefresh(next); }); }, [onRefresh]);

  async function markAll() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
      if (response.ok) onRefresh({ notifications: feed.notifications.map((item) => ({ ...item, read: true })), unread: 0 });
    } finally { setBusy(false); }
  }
  async function refresh() { setBusy(true); const next = await fetchAdminFeed(); if (next) onRefresh(next); setBusy(false); }

  return <Modal floating title="إشعارات الإدارة" subtitle="كل ما وصل الإدارة: مهن جديدة، أعضاء جدد، تقييمات، طلبات إعلان، اقتراحات وتحديثات." onClose={onClose}>
    <div className="admin-notif-modal">
      <div className="admin-notif-toolbar">
        <span className="admin-notif-count">{feed.unread > 0 ? `${feed.unread} غير مقروء` : "لا جديد الآن"}</span>
        <div className="admin-notif-toolbar-actions">
          <button type="button" className="button button-soft button-small" onClick={() => void refresh()} disabled={busy}><RefreshCw size={14} className={busy ? "spin" : ""}/> تحديث</button>
          {feed.unread > 0 && <button type="button" className="button button-soft button-small" onClick={() => void markAll()} disabled={busy}><CheckCheck size={14}/> تحديد الكل كمقروء</button>}
          <Link href="/admin?tab=notifications" className="button button-primary button-small">لوحة الإدارة <ChevronLeft size={14}/></Link>
        </div>
      </div>
      {feed.notifications.length === 0
        ? <p className="admin-notif-empty">لا توجد إشعارات للإدارة بعد.</p>
        : <div className="admin-notif-list">
          {feed.notifications.map((item) => {
            const kind = kindOf(item.type); const Icon = kind.icon;
            return <Link key={item.id} href={`/admin?tab=${kind.tab}`} className={`admin-notif-item tone-${kind.tone} ${item.read ? "" : "is-unread"}`}>
              <span className="admin-notif-icon"><Icon size={18}/></span>
              <span className="admin-notif-copy">
                <small className="admin-notif-kind">{kind.label}</small>
                <strong>{item.title}</strong>
                {item.message && <span>{item.message}</span>}
              </span>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
            </Link>;
          })}
        </div>}
    </div>
  </Modal>;
}

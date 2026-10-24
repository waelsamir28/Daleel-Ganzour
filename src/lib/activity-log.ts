import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, directoryAreas, directoryCategories, members, serviceRatings, services, villageEvents, adBanners } from "@/db/schema";
import type { Viewer } from "@/lib/catalog";
export { activityActionLabel, activityKindLabel } from "@/lib/activity-labels";

export type ActivityActor = { role: "admin" | "moderator"; name: string; username: string };
type Method = "POST" | "PATCH" | "DELETE";

export function actorFromViewer(viewer: Viewer): ActivityActor {
  return { role: viewer.role === "admin" ? "admin" : "moderator", name: viewer.name || (viewer.role === "admin" ? "مدير الموقع" : "مشرف"), username: viewer.username || "" };
}

/** يُقرأ اسم العنصر قبل تنفيذ الإجراء (لأن الحذف يمسحه). خطأ القراءة لا يوقف الطلب. */
export async function resolveActivityLabel(type: unknown, id: unknown, values: unknown): Promise<string> {
  const key = typeof id === "string" ? id : "";
  const record = values && typeof values === "object" ? values as Record<string, unknown> : {};
  const fromValues = [record.name, record.title].find((value): value is string => typeof value === "string" && value.trim().length > 0);
  try {
    if (type === "service" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ name: services.name }).from(services).where(eq(services.id, key)).limit(1); if (row) return row.name; }
    if (type === "rating" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ name: services.name, stars: serviceRatings.stars }).from(serviceRatings).innerJoin(services, eq(serviceRatings.serviceId, services.id)).where(eq(serviceRatings.id, key)).limit(1); if (row) return `${row.name} (${row.stars}★)`; }
    if (type === "member" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ name: members.name, username: members.username }).from(members).where(eq(members.id, key)).limit(1); if (row) return `${row.name} (@${row.username})`; }
    if (type === "event" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ title: villageEvents.title }).from(villageEvents).where(eq(villageEvents.id, key)).limit(1); if (row) return row.title; }
    if (type === "ad" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ title: adBanners.title }).from(adBanners).where(eq(adBanners.id, key)).limit(1); if (row) return row.title; }
    if (type === "area" && /^[0-9a-f-]{36}$/i.test(key)) { const [row] = await db.select({ name: directoryAreas.name }).from(directoryAreas).where(eq(directoryAreas.id, key)).limit(1); if (row) return row.name; }
    if (type === "category" && key) { const [row] = await db.select({ name: directoryCategories.name }).from(directoryCategories).where(eq(directoryCategories.id, key)).limit(1); if (row) return row.name; }
  } catch { /* best effort */ }
  return fromValues ?? "";
}

const silent = new Set(["notification:read", "notification:read-all", "whatsapp-test:", "service:refresh"]);

/** يسجّل إجراءً ناجحًا؛ لا يرمي أخطاء أبدًا حتى لا يفشل الطلب الأصلي بسبب السجل. */
export async function logActivity(actor: ActivityActor, method: Method, body: Record<string, unknown>, entityLabel: string, detail = ""): Promise<void> {
  const type = typeof body.type === "string" ? body.type : "unknown";
  const action = typeof body.action === "string" ? body.action : "";
  if (silent.has(`${type}:${action}`)) return;
  const note = detail || (typeof body.note === "string" ? body.note : typeof body.reason === "string" ? body.reason : "");
  try {
    await db.insert(activityLog).values({
      actorRole: actor.role, actorName: actor.name.slice(0, 120), actorUsername: actor.username.slice(0, 80),
      action: `${method}:${action}`.slice(0, 40), entityKind: type.slice(0, 24), entityId: String(body.id ?? "").slice(0, 64), entityLabel: entityLabel.slice(0, 160), detail: note.slice(0, 300),
    });
  } catch (error) { console.error("activity-log", error); }
}

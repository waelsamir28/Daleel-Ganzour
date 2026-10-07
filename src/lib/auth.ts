import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { adminSessions, members, memberSessions } from "@/db/schema";
import type { Viewer } from "@/lib/catalog";
import { ensureSeed } from "@/lib/directory";

const ADMIN_COOKIE = "elgamal_admin";
const MEMBER_COOKIE = "janzour_member";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
});

export function validCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "admin";
  return timingSafeEqual(Buffer.from(hash(username)), Buffer.from(hash(expectedUser))) && timingSafeEqual(Buffer.from(hash(password)), Buffer.from(hash(expectedPassword)));
}
export function reservedUsername(username: string) {
  return ["admin", (process.env.ADMIN_USERNAME ?? "admin").toLowerCase()].includes(username.toLowerCase());
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded || encoded.length !== 128) return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(encoded, "hex"));
}
export async function isAdmin() {
  if (!databaseConfigured) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length !== 64) return false;
  const [session] = await db.select({ id: adminSessions.id }).from(adminSessions).where(and(eq(adminSessions.id, hash(token)), gt(adminSessions.expiresAt, new Date()))).limit(1);
  return Boolean(session);
}
export async function getViewer(): Promise<Viewer> {
  if (!databaseConfigured) return { role: "guest" };
  if (await isAdmin()) return { role: "admin", name: "مدير الموقع", username: process.env.ADMIN_USERNAME ?? "admin" };
  const token = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!token || token.length !== 64) return { role: "guest" };
  await ensureSeed();
  const [member] = await db.select({ id: members.id, name: members.name, username: members.username, role: members.role }).from(memberSessions).innerJoin(members, eq(memberSessions.memberId, members.id)).where(and(eq(memberSessions.id, hash(token)), gt(memberSessions.expiresAt, new Date()), eq(members.active, true))).limit(1);
  return member ? { role: member.role === "moderator" ? "moderator" : "member", id: member.id, name: member.name, username: member.username } : { role: "guest" };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host") ?? new URL(request.url).host;
  try { return new URL(origin).host === host; } catch { return false; }
}
export function usesSecureCookies(request: Request) {
  try {
    return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" || Boolean(request.headers.get("origin")?.startsWith("https://") && sameOrigin(request));
  } catch { return false; }
}
const cookieOptions = (secure: boolean) => ({ httpOnly: true, secure, sameSite: secure ? "none" as const : "strict" as const, partitioned: secure, path: "/" });
export async function createAdminSession(secure: boolean) {
  await destroyAdminSession(secure);
  await destroyMemberSession(secure);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  await db.insert(adminSessions).values({ id: hash(token), expiresAt });
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieOptions(secure), expires: expiresAt });
}
export async function createMemberSession(memberId: string, secure: boolean) {
  await destroyMemberSession(secure);
  await destroyAdminSession(secure);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.delete(memberSessions).where(lt(memberSessions.expiresAt, new Date()));
  await db.insert(memberSessions).values({ id: hash(token), memberId, expiresAt });
  (await cookies()).set(MEMBER_COOKIE, token, { ...cookieOptions(secure), expires: expiresAt });
}
export async function destroyAdminSession(secure: boolean) {
  const store = await cookies(); const token = store.get(ADMIN_COOKIE)?.value;
  if (token && databaseConfigured) await db.delete(adminSessions).where(eq(adminSessions.id, hash(token)));
  store.set(ADMIN_COOKIE, "", { ...cookieOptions(secure), maxAge: 0 });
}
export async function destroyMemberSession(secure: boolean) {
  const store = await cookies(); const token = store.get(MEMBER_COOKIE)?.value;
  if (token && databaseConfigured) await db.delete(memberSessions).where(eq(memberSessions.id, hash(token)));
  store.set(MEMBER_COOKIE, "", { ...cookieOptions(secure), maxAge: 0 });
}

import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { directoryCategories, memberProfiles, members, services } from "@/db/schema";
import { emptyMemberProfile, memberPhotoUrl, MEMBER_PROFILE_FIELDS, phoneDigits, servicePhotoUrl, type MemberProfileValues, type PublicProfile } from "@/lib/catalog";
import { InputError } from "@/lib/inputs";
import { saveServicePhoto, type PhotoPayload } from "@/lib/service-photo";
import { cleanPhone, cleanText, validPhone } from "@/lib/validation";

/**
 * الملف الشخصي للعضو — مستقل تمامًا عن بيانات المهنة:
 * - الخانات الإضافية (إيميل، ميلاد، عنوان، نبذة…) لا تُنسخ أبدًا إلى المهنة.
 * - الصورة الشخصية هي الوحيدة المشتركة: تظهر على كارت/بطاقة كل مهنة منشورة بنفس رقم الهاتف.
 */

type ProfileRow = typeof memberProfiles.$inferSelect;

export function profileValues(row: ProfileRow | undefined): MemberProfileValues {
  if (!row) return { ...emptyMemberProfile };
  return { jobTitle: row.jobTitle, email: row.email, birthDate: row.birthDate, address: row.address, whatsapp: row.whatsapp, facebook: row.facebook, bio: row.bio };
}

/** يتحقق من الخانات الاختيارية ويعيدها نظيفة (الفارغ مسموح دائمًا). */
export function sanitizeProfileValues(input: Record<string, unknown>, current: MemberProfileValues): MemberProfileValues {
  const next = { ...current };
  for (const field of MEMBER_PROFILE_FIELDS) {
    if (input[field.key] === undefined) continue;
    const value = cleanText(input[field.key], field.max);
    if (!value) { next[field.key] = ""; continue; }
    if (field.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) throw new InputError("البريد الإلكتروني غير صحيح.");
    if (field.key === "birthDate") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError("تاريخ الميلاد غير صحيح.");
      const year = Number(value.slice(0, 4));
      if (year < 1920 || year > new Date().getFullYear()) throw new InputError("تاريخ الميلاد غير منطقي.");
    }
    if (field.key === "whatsapp") {
      const phone = cleanPhone(value);
      if (!validPhone(phone)) throw new InputError("رقم الواتساب البديل غير صحيح.");
      next.whatsapp = phone; continue;
    }
    if (field.key === "facebook") {
      const url = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
      if (!/^https?:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me)\//i.test(url)) throw new InputError("رابط فيسبوك غير صحيح — انسخه من صفحة حسابك.");
      next.facebook = url; continue;
    }
    next[field.key] = value;
  }
  return next;
}

export async function getMemberProfileRow(memberId: string) {
  const [row] = await db.select().from(memberProfiles).where(eq(memberProfiles.memberId, memberId)).limit(1);
  return row;
}

/** معرّفات المهن المنشورة/المعلّقة التي تحمل نفس رقم العضو (الرقم الأساسي أو الثاني). */
export async function ownedServiceIds(phone: string): Promise<string[]> {
  const digits = phoneDigits(phone);
  if (!digits) return [];
  const rows = await db.select({ id: services.id, phone: services.phone, phoneSecondary: services.phoneSecondary }).from(services);
  return rows.filter((row) => phoneDigits(row.phone) === digits || (row.phoneSecondary && phoneDigits(row.phoneSecondary) === digits)).map((row) => row.id);
}

/** هل العضو صاحب هذه المهنة (بالرقم)؟ */
export async function memberOwnsService(memberPhone: string, serviceId: string): Promise<boolean> {
  const ids = await ownedServiceIds(memberPhone);
  return ids.includes(serviceId);
}

/** يحفظ صورة العضو ويبثّها إلى كل مهنه (صورة واحدة مشتركة). null يحذفها من الجميع. */
export async function saveMemberPhoto(memberId: string, memberPhone: string, photo: PhotoPayload | null) {
  if (photo === null) {
    await db.insert(memberProfiles).values({ memberId, photoVersion: 0, photoData: "" })
      .onConflictDoUpdate({ target: memberProfiles.memberId, set: { photoVersion: 0, photoData: "", updatedAt: new Date() } });
  } else {
    await db.insert(memberProfiles).values({ memberId, photoVersion: 1, photoMime: photo.mime, photoData: photo.base64 })
      .onConflictDoUpdate({ target: memberProfiles.memberId, set: { photoVersion: sql`${memberProfiles.photoVersion} + 1`, photoMime: photo.mime, photoData: photo.base64, updatedAt: new Date() } });
  }
  for (const serviceId of await ownedServiceIds(memberPhone)) await saveServicePhoto(db, serviceId, photo);
}

/** عند رفع صورة من «حسابي» (رابط التوكن) ننسخها أيضًا إلى ملف العضو الذي يحمل نفس الرقم. */
export async function mirrorServicePhotoToMember(servicePhone: string, photo: PhotoPayload | null | undefined) {
  if (photo === undefined) return;
  const digits = phoneDigits(servicePhone);
  if (!digits) return;
  const rows = await db.select({ id: members.id, phone: members.phone }).from(members).where(eq(members.active, true));
  const owner = rows.find((row) => phoneDigits(row.phone) === digits);
  if (!owner) return;
  if (photo === null) {
    await db.update(memberProfiles).set({ photoVersion: 0, photoData: "", updatedAt: new Date() }).where(eq(memberProfiles.memberId, owner.id));
  } else {
    await db.insert(memberProfiles).values({ memberId: owner.id, photoVersion: 1, photoMime: photo.mime, photoData: photo.base64 })
      .onConflictDoUpdate({ target: memberProfiles.memberId, set: { photoVersion: sql`${memberProfiles.photoVersion} + 1`, photoMime: photo.mime, photoData: photo.base64, updatedAt: new Date() } });
  }
}

export async function saveMemberProfileValues(memberId: string, values: MemberProfileValues) {
  await db.insert(memberProfiles).values({ memberId, ...values })
    .onConflictDoUpdate({ target: memberProfiles.memberId, set: { ...values, updatedAt: new Date() } });
}

type ServiceRow = typeof services.$inferSelect;
async function publicServices(rows: ServiceRow[]) {
  const published = rows.filter((row) => row.status === "approved");
  if (published.length === 0) return [];
  const categoryRows = await db.select({ id: directoryCategories.id, name: directoryCategories.name }).from(directoryCategories).where(inArray(directoryCategories.id, [...new Set(published.map((row) => row.category))]));
  const names = new Map(categoryRows.map((row) => [row.id, row.name]));
  return published.map((row) => ({
    id: row.id, name: row.name, categoryId: row.category, categoryName: names.get(row.category) ?? "", address: row.address || row.area,
    description: row.description, photoUrl: servicePhotoUrl({ id: row.id, photoVersion: row.photoVersion }), rating: row.rating, reviews: row.reviews, verified: row.verified,
  }));
}

/**
 * يبني الملف الشخصي العام من معرّف عضو أو معرّف مهنة:
 * - عضو: بياناته + مهنه المنشورة بنفس الرقم.
 * - مهنة: لو لصاحبها حساب عضو بنفس الرقم نعرض ملفه، وإلا نبني ملفًا من بيانات المهنة نفسها.
 */
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [member] = await db.select().from(members).where(and(eq(members.id, id), eq(members.active, true))).limit(1);
  if (member) {
    const [profile, ownedIds] = await Promise.all([getMemberProfileRow(member.id), ownedServiceIds(member.phone)]);
    const serviceRows = ownedIds.length ? await db.select().from(services).where(inArray(services.id, ownedIds)).orderBy(desc(services.createdAt)) : [];
    const list = await publicServices(serviceRows);
    return {
      id: member.id, kind: "member", name: member.name,
      photoUrl: memberPhotoUrl(member.id, profile?.photoVersion ?? 0) || list.find((item) => item.photoUrl)?.photoUrl || "",
      phone: list.length ? member.phone : "", memberSince: member.createdAt.toISOString(), profile: profileValues(profile), services: list,
    };
  }
  const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!service || service.status !== "approved") return null;
  const digits = phoneDigits(service.phone);
  const memberRows = await db.select().from(members).where(eq(members.active, true));
  const owner = memberRows.find((row) => phoneDigits(row.phone) === digits);
  if (owner) return getPublicProfile(owner.id);
  const list = await publicServices([service]);
  return { id: service.id, kind: "service", name: service.name, photoUrl: list[0]?.photoUrl ?? "", phone: service.phone, memberSince: service.createdAt.toISOString(), profile: { ...emptyMemberProfile, address: service.address || service.area }, services: list };
}

/** قراءة صورة العضو للمسار العام. */
export async function readMemberPhoto(memberId: string) {
  const [row] = await db.select({ mime: memberProfiles.photoMime, data: memberProfiles.photoData }).from(memberProfiles).where(eq(memberProfiles.memberId, memberId)).limit(1);
  return row?.data ? row : null;
}

import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { serviceGallery, services } from "@/db/schema";
import { InputError } from "@/lib/inputs";
import {
  gallerySlotList,
  gallerySlotNumber,
  parseGalleryPhoto,
  type GalleryPhotoPayload,
} from "@/lib/service-gallery-rules";

export {
  SERVICE_GALLERY_MAX,
  SERVICE_GALLERY_MAX_BYTES,
  SERVICE_GALLERY_MAX_FILE,
  SERVICE_GALLERY_MIME,
  gallerySlotList,
} from "@/lib/service-gallery-rules";

/** يلفّ أخطاء القواعد العامة في خطأ إدخال (400) برسالة عربية واضحة. */
function asInputError<T>(run: () => T): T {
  try { return run(); } catch (error) { throw error instanceof InputError ? error : new InputError(error instanceof Error ? error.message : "بيانات غير صحيحة."); }
}

export const gallerySlotInput = (value: unknown) => asInputError(() => gallerySlotNumber(value));
export const galleryPhotoInput = (value: unknown): GalleryPhotoPayload | null => asInputError(() => parseGalleryPhoto(value));

type Executor = Pick<typeof db, "select" | "insert" | "update" | "delete">;
/**
 * يحفظ صورة في خانة محددة أو يحذفها، ثم يحدّث قائمة الخانات ورقم الإصدار.
 * أي تغيير يرفع الرقم حتى يتغيّر رابط الصورة فيتحدّث المتصفح فورًا.
 */
export async function saveServiceGalleryPhoto(executor: Executor, serviceId: string, slot: number, photo: GalleryPhotoPayload | null): Promise<number[]> {
  const [current] = await executor.select({ gallerySlots: services.gallerySlots }).from(services).where(eq(services.id, serviceId)).limit(1);
  const slots = new Set(gallerySlotList(current?.gallerySlots));
  if (photo) {
    await executor.insert(serviceGallery).values({ serviceId, slot, mime: photo.mime, data: photo.base64 })
      .onConflictDoUpdate({ target: [serviceGallery.serviceId, serviceGallery.slot], set: { mime: photo.mime, data: photo.base64, updatedAt: new Date() } });
    slots.add(slot);
  } else {
    await executor.delete(serviceGallery).where(and(eq(serviceGallery.serviceId, serviceId), eq(serviceGallery.slot, slot)));
    slots.delete(slot);
  }
  const list = [...slots].sort((a, b) => a - b);
  await executor.update(services).set({ gallerySlots: list.join(","), galleryVersion: sql`${services.galleryVersion} + 1` }).where(eq(services.id, serviceId));
  return list;
}

import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { servicePhotos, services } from "@/db/schema";
import { InputError } from "@/lib/inputs";

export type PhotoPayload = { mime: string; base64: string };
/** أقصى حجم للصورة بعد القص والضغط في المتصفح (الصورة المقصوصة 320×320 عادةً 15–40 كيلوبايت). */
export const SERVICE_PHOTO_MAX_BYTES = 400 * 1024;

/**
 * يقرأ الصورة الشخصية المرسلة مع النموذج:
 * - undefined → لم تُرسل (لا تغيير)
 * - null أو "" → حذف الصورة الحالية
 * - data URL (webp/jpeg/png) → صورة جديدة
 */
export function parsePhotoInput(value: unknown): PhotoPayload | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === false) return null;
  if (typeof value !== "string") throw new InputError("صيغة الصورة الشخصية غير صحيحة.");
  const match = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(value.trim());
  if (!match) throw new InputError("الصورة الشخصية يجب أن تكون JPG أو PNG أو WebP.");
  const [, mime, base64] = match;
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (bytes < 200) throw new InputError("الصورة الشخصية فارغة أو تالفة.");
  if (bytes > SERVICE_PHOTO_MAX_BYTES) throw new InputError("الصورة الشخصية كبيرة بعد الضغط. أعد اختيارها من جديد.");
  return { mime, base64 };
}

type Executor = Pick<typeof db, "insert" | "update" | "delete">;
/** يحفظ/يحذف الصورة ويرفع رقم الإصدار حتى تتجدد الصورة في المتصفحات فورًا. */
export async function saveServicePhoto(executor: Executor, serviceId: string, photo: PhotoPayload | null | undefined) {
  if (photo === undefined) return;
  if (photo === null) {
    await executor.delete(servicePhotos).where(eq(servicePhotos.serviceId, serviceId));
    await executor.update(services).set({ photoVersion: 0 }).where(eq(services.id, serviceId));
    return;
  }
  await executor.insert(servicePhotos).values({ serviceId, mime: photo.mime, data: photo.base64 })
    .onConflictDoUpdate({ target: servicePhotos.serviceId, set: { mime: photo.mime, data: photo.base64, updatedAt: new Date() } });
  await executor.update(services).set({ photoVersion: sql`${services.photoVersion} + 1` }).where(eq(services.id, serviceId));
}

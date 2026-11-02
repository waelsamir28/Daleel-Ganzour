/**
 * نسخة احتياطية من بيانات الدليل + التحقق من ملف الاسترجاع.
 * منطق نقي بلا اعتماديات: يبني شكل الملف، يتحقق منه، ويحسب الملخص المعروض للأدمن.
 */

export const BACKUP_APP = "daleel-ganzour-backup";
export const BACKUP_VERSION = 1;
/** أقصى حجم مقبول لملف الاسترجاع (٢ ميجابايت) حتى لا يعلق المتصفح. */
export const BACKUP_MAX_BYTES = 2 * 1024 * 1024;

export type BackupPayload = {
  app: string;
  version: number;
  generatedAt: string;
  counts: { services: number; categories: number; areas: number; events: number };
  data: {
    services: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    areas: string[];
    events: Record<string, unknown>[];
    settings: Record<string, unknown>;
    design: Record<string, unknown>;
    telecom?: Record<string, unknown>;
    greetings?: Record<string, unknown>;
    utilities?: unknown[];
  };
};

type Loose = Record<string, unknown>;

function asArray(value: unknown): Loose[] {
  return Array.isArray(value) ? value.filter((item): item is Loose => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

/** يبني ملف النسخة الاحتياطية من بيانات لوحة الإدارة (بدون كلمات مرور أو جلسات). */
export function buildBackup(input: {
  services?: unknown[];
  categories?: unknown[];
  areas?: { name?: string }[];
  events?: unknown[];
  settings?: unknown;
  design?: unknown;
  telecom?: unknown;
  greetings?: unknown;
  utilities?: unknown[];
  generatedAt?: string;
}): BackupPayload {
  const services = asArray(input.services).filter((service) => service.demo !== true);
  const categories = asArray(input.categories);
  const events = asArray(input.events);
  const areas = (input.areas ?? []).map((area) => String(area?.name ?? "").trim()).filter(Boolean);
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    counts: { services: services.length, categories: categories.length, areas: areas.length, events: events.length },
    data: {
      services,
      categories,
      areas,
      events,
      settings: (input.settings ?? {}) as Loose,
      design: (input.design ?? {}) as Loose,
      ...(input.telecom ? { telecom: input.telecom as Loose } : {}),
      ...(input.greetings ? { greetings: input.greetings as Loose } : {}),
      ...(input.utilities ? { utilities: input.utilities } : {}),
    },
  };
}

/** اسم ملف النسخة: daleel-ganzour-backup-2026-11-02 */
export function backupFileName(now = Date.now()): string {
  return `daleel-ganzour-backup-${new Date(now).toISOString().slice(0, 10)}`;
}

export type ParsedBackup = { ok: true; backup: BackupPayload } | { ok: false; error: string };

/** التحقق من ملف الاسترجاع: لازم يكون ملف النسخة الاحتياطية اللي نزّلناه من نفس التطبيق. */
export function parseBackupPayload(raw: unknown): ParsedBackup {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "الملف غير صالح — اختار ملف النسخة الاحتياطية (JSON) اللي نزّلته من هنا." };
  const payload = raw as Loose;
  if (payload.app !== BACKUP_APP) return { ok: false, error: "الملف ده مش نسخة احتياطية من دليل جنزور." };
  if (Number(payload.version) > BACKUP_VERSION) return { ok: false, error: "الملف من إصدار أحدث من الموقع — حدّث الموقع أولًا." };
  const data = payload.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, error: "الملف ناقص البيانات جواه." };
  const body = data as Loose;
  const services = asArray(body.services);
  const categories = asArray(body.categories);
  if (!services.length && !categories.length) return { ok: false, error: "الملف مفيهوش خدمات ولا أقسام — اتحقق إنك اخترت الملف الصح." };
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: Number(payload.version) || BACKUP_VERSION,
      generatedAt: typeof payload.generatedAt === "string" ? payload.generatedAt : "",
      counts: { services: services.length, categories: categories.length, areas: (Array.isArray(body.areas) ? body.areas : []).length, events: asArray(body.events).length },
      data: {
        services,
        categories,
        areas: (Array.isArray(body.areas) ? body.areas : []).map((name) => String(name ?? "").trim()).filter(Boolean),
        events: asArray(body.events),
        settings: (body.settings && typeof body.settings === "object" ? body.settings : {}) as Loose,
        design: (body.design && typeof body.design === "object" ? body.design : {}) as Loose,
        ...(body.telecom && typeof body.telecom === "object" ? { telecom: body.telecom as Loose } : {}),
        ...(body.greetings && typeof body.greetings === "object" ? { greetings: body.greetings as Loose } : {}),
        ...(Array.isArray(body.utilities) ? { utilities: body.utilities } : {}),
      },
    },
  };
}

/** سطر مختصر يوضح إيه اللي جوه النسخة قبل الاسترجاع. */
export function backupSummaryText(backup: Pick<BackupPayload, "counts" | "generatedAt">): string {
  const date = backup.generatedAt ? new Date(backup.generatedAt) : null;
  const when = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(date)
    : "تاريخ غير معروف";
  return `${backup.counts.services} خدمة · ${backup.counts.categories} قسم وتخصص · ${backup.counts.areas} عنوان · نسخة ${when}`;
}

/** نص تحذير الاسترجاع (يُعرض قبل التنفيذ). */
export const RESTORE_CONFIRM_WORD = "استرجاع";

export function restoreConfirmMessage(backup: Pick<BackupPayload, "counts">): string {
  return `هيتم إضافة/تحديث ${backup.counts.services} خدمة و${backup.counts.categories} قسم من الملف. `
    + "البيانات الموجودة مش هتتمسح — بس اللي في الملف هيتم تحديثه. اكتب كلمة «استرجاع» للتأكيد.";
}

/** صفوف شيت Excel للمهن (أعمدة عربية مفهومة، نفس ترتيب ملف الاستيراد). */
export function servicesSheetRows(services: Record<string, unknown>[], categoryNames: Map<string, string>): (string | number)[][] {
  const header = ["الاسم", "الهاتف", "هاتف إضافي", "التخصص", "القسم", "العنوان", "الحالة", "مميز", "تم التحقق", "التقييم", "عدد التقييمات", "تاريخ الإضافة"];
  const rows = services.map((service) => [
    String(service.name ?? ""),
    String(service.phone ?? ""),
    String(service.phoneSecondary ?? ""),
    categoryNames.get(String(service.category ?? "")) ?? String(service.category ?? ""),
    String(service.area ?? ""),
    String(service.address ?? ""),
    String(service.status ?? ""),
    service.featured === true ? "نعم" : "لا",
    service.verified === true ? "نعم" : "لا",
    String(service.rating ?? ""),
    Number(service.reviews ?? 0),
    String(service.createdAt ?? "").slice(0, 10),
  ]);
  return [header, ...rows];
}

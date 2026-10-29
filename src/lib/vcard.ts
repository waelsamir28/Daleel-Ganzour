/**
 * بطاقة جهة اتصال (vCard 3.0) لحفظ المهني في هاتف الزائر بضغطة واحدة.
 * يُستخدم في بطاقة العمل وصفحة التفاصيل وصفحة الملف الشخصي.
 */
import type { CategoryRecord, ServiceRecord } from "@/lib/catalog";
import { servicePhotoUrl } from "@/lib/catalog";

/** لاحقة اسم جهة الاتصال حتى يسهل إيجادها لاحقًا في الهاتف («أحمد السباك — دليل جنزور»). */
export const CONTACT_SUFFIX = "دليل جنزور";

export function vcardEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
/** رقم دولي (+20) حتى تظهر جهة الاتصال صحيحة في واتساب. */
export function vcardPhone(phone: string): string {
  const digits = (phone || "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
  if (/^0?1[0125]\d{8}$/.test(digits)) return `+20${digits.replace(/^0/, "")}`;
  if (/^20\d{10}$/.test(digits)) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export type VCardInput = {
  name: string;
  phones: string[];
  org?: string;
  title?: string;
  address?: string;
  url?: string;
  photoUrl?: string;
  email?: string;
  note?: string;
};

export function buildVCard(input: VCardInput): string {
  const fullName = `${input.name} — ${CONTACT_SUFFIX}`;
  const phones = input.phones.map(vcardPhone).filter(Boolean);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vcardEscape(CONTACT_SUFFIX)};${vcardEscape(input.name)};;;`,
    `FN:${vcardEscape(fullName)}`,
    ...(input.org ? [`ORG:${vcardEscape(input.org)}`] : []),
    ...(input.title ? [`TITLE:${vcardEscape(input.title)}`] : []),
    ...phones.map((phone, index) => `TEL;TYPE=CELL,VOICE${index === 0 ? ",PREF" : ""}:${phone}`),
    ...(input.email ? [`EMAIL;TYPE=INTERNET:${vcardEscape(input.email)}`] : []),
    ...(input.address ? [`ADR;TYPE=WORK:;;${vcardEscape(input.address)};جنزور;المنوفية;;مصر`] : []),
    ...(input.url ? [`URL:${input.url}`] : []),
    ...(input.photoUrl ? [`PHOTO;VALUE=URI:${input.photoUrl}`] : []),
    ...(input.note ? [`NOTE:${vcardEscape(input.note)}`] : []),
    "END:VCARD",
  ];
  return lines.join("\r\n");
}

export function serviceVCard(service: ServiceRecord, category: Pick<CategoryRecord, "name">, siteName: string, origin: string): string {
  const photo = servicePhotoUrl(service);
  return buildVCard({
    name: service.name,
    phones: [service.phone, ...(service.phoneSecondary ? [service.phoneSecondary] : [])],
    org: siteName,
    title: category.name,
    address: service.address || service.area,
    url: `${origin}/?service=${encodeURIComponent(service.id)}`,
    photoUrl: photo ? `${origin}${photo}` : "",
    note: `${category.name} — من ${siteName}`,
  });
}

export function vcardFileName(name: string): string {
  return `${name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "contact"}.vcf`;
}

/**
 * يحفظ الـ vCard: على الموبايل عبر نافذة المشاركة بالملف (تفتح «جهات الاتصال» مباشرة)،
 * وعلى الكمبيوتر بتنزيل ملف .vcf. يُستدعى من حدث ضغط فقط (المتصفح لا يسمح بغير ذلك).
 */
export async function saveVCard(vcf: string, name: string): Promise<void> {
  const fileName = vcardFileName(name);
  const file = new File([vcf], fileName, { type: "text/vcard;charset=utf-8" });
  const mobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  if (mobile && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch { /* نرجع للتنزيل */ }
  }
  const url = URL.createObjectURL(new Blob([vcf], { type: "text/vcard;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

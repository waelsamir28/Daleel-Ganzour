/**
 * إعدادات صفحة الأكواد (/telecom) — مشتركة بين الموقع ولوحة الإدارة (بلا قاعدة بيانات).
 *
 * كل ما يغيّره الأدمن من لوحة التحكم يُحفظ في صف واحد داخل directory_settings بالمفتاح
 * `telecom_config`، ويُطبَّق على الشاشات الست (4 شركات + الخط الأرضي + البنوك):
 * - نصوص الهيدر (الشارة، العنوان الكبير، الوصف) وعنوان شبكة الكروت.
 * - اسم ولون كل قسم من أقسام الأكواد (الدعم / الرصيد والشحن / الإنترنت / المحفظة …).
 * - إظهار/إخفاء رمز QR وشرائح «تعمل بدون إنترنت».
 */
import type { TelecomGroupIcon } from "@/lib/telecom";

export const TELECOM_TILE_KEYS = ["support", "wallet", "wifi", "card", "phone", "sim", "siren", "train"] as const;
export type TelecomTileKey = (typeof TELECOM_TILE_KEYS)[number];

export type TelecomGroupStyle = { label: string; color: string };

export type TelecomSettings = {
  /** الشارة الصغيرة أعلى عنوان الصفحة. */
  eyebrow: string;
  /** العنوان الكبير للصفحة. */
  title: string;
  /** الوصف تحت العنوان. */
  subtitle: string;
  /** عنوان شبكة الكروت. */
  homeHeading: string;
  /** جملة توضيحية تحت عنوان الشبكة. */
  homeNote: string;
  showQr: boolean;
  showHeroChips: boolean;
  /** اسم ولون كل قسم من أقسام الأكواد (مشترك بين كل الشركات). */
  groupStyles: Record<TelecomTileKey, TelecomGroupStyle>;
};

export const defaultTelecomSettings: TelecomSettings = {
  eyebrow: "أرقام وأكواد المحمول والأرضي والبنوك",
  title: "كل الأرقام والأكواد اللي تحتاجها في مكان واحد",
  subtitle: "فودافون وأورنج واتصالات ووي، والخط الأرضي والفايبر، والبنوك وتطبيقات الدفع — اختار القسم من الكروت، وكل حاجة تظهر بشكل واضح وتشتغل بضغطة. الصفحة تتخزن على موبايلك بعد أول زيارة وتعمل بدون إنترنت.",
  homeHeading: "اختار من الكروت",
  homeNote: "كل كارت يفتح شاشة كاملة بأكواد الشركة وأقسامها.",
  showQr: true,
  showHeroChips: true,
  groupStyles: {
    support: { label: "الدعم", color: "#1d6fdc" },
    wallet: { label: "الرصيد والشحن", color: "#0f9d58" },
    wifi: { label: "الإنترنت", color: "#e88a16" },
    card: { label: "المحفظة", color: "#7c3aed" },
    phone: { label: "خدمات الخط", color: "#0e8f95" },
    sim: { label: "الشريحة", color: "#d94a4a" },
    siren: { label: "طوارئ", color: "#d64545" },
    train: { label: "نقل", color: "#3b5bdb" },
  },
};

const TEXT_LIMITS: Record<"eyebrow" | "title" | "subtitle" | "homeHeading" | "homeNote", number> = {
  eyebrow: 70, title: 120, subtitle: 420, homeHeading: 60, homeNote: 180,
};

const HEX = /^#[0-9a-f]{6}$/i;

/** يقبل أي شكل محفوظ ويرجّع إعدادات صحيحة دائمًا (النصوص الفارغة ترجع للافتراضي). */
export function sanitizeTelecomSettings(value: unknown): TelecomSettings {
  const saved = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const next: TelecomSettings = {
    ...defaultTelecomSettings,
    groupStyles: Object.fromEntries(TELECOM_TILE_KEYS.map((key) => [key, { ...defaultTelecomSettings.groupStyles[key] }])) as Record<TelecomTileKey, TelecomGroupStyle>,
  };
  for (const key of Object.keys(TEXT_LIMITS) as Array<keyof typeof TEXT_LIMITS>) {
    const raw = saved[key];
    if (typeof raw === "string" && raw.trim()) next[key] = raw.trim().slice(0, TEXT_LIMITS[key]);
  }
  next.showQr = saved.showQr !== false;
  next.showHeroChips = saved.showHeroChips !== false;
  const styles = saved.groupStyles;
  if (styles && typeof styles === "object") {
    for (const key of TELECOM_TILE_KEYS) {
      const entry = (styles as Record<string, unknown>)[key];
      if (!entry || typeof entry !== "object") continue;
      const label = (entry as Record<string, unknown>).label;
      const color = (entry as Record<string, unknown>).color;
      if (typeof label === "string" && label.trim()) next.groupStyles[key].label = label.trim().slice(0, 22);
      if (typeof color === "string" && HEX.test(color.trim())) next.groupStyles[key].color = color.trim().toLowerCase();
    }
  }
  return next;
}

/** يغمّق اللون لبناء تدرّج المربّع من نفس لون القسم. */
export function darkenHex(hex: string, amount = 0.3) {
  const safe = HEX.test(hex) ? hex : "#1d6fdc";
  const parts = [1, 3, 5].map((index) => Math.max(0, Math.min(255, Math.round(parseInt(safe.slice(index, index + 2), 16) * (1 - amount)))));
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

/** يرجّع اسم ولون القسم من الإعدادات (مع الرجوع لاسم المجموعة الأصلي). */
export function tileStyleFor(settings: TelecomSettings, icon: TelecomGroupIcon, fallbackLabel: string) {
  const known = (TELECOM_TILE_KEYS as readonly string[]).includes(icon);
  const style = settings.groupStyles[(known ? icon : "phone") as TelecomTileKey] ?? defaultTelecomSettings.groupStyles.phone;
  const color = style.color || "#1d6fdc";
  return { label: (known && style.label) ? style.label : fallbackLabel, color, deep: darkenHex(color) };
}

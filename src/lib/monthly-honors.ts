/**
 * شهادة التكريم الشهرية: أفضل ٣ مهنيين في الشهر حسب التفاعل الحقيقي (مشاهدات + اتصالات).
 * - لو فيه «بداية شهر» محفوظة (snapshot) بنحسب تفاعل الشهر نفسه (الفرق عن بداية الشهر).
 * - لو مفيش، بنحسب الإجمالي من بداية الدليل ونكتب ده صريح في الشهادة.
 * منطق نقي بلا أي اعتماديات — يمكن اختباره مباشرة.
 */

export const HONORS_LIMIT = 3;
/** الاتصال أغلى من المشاهدة في التقييم (٤ مشاهدات = اتصال واحد تقريبًا). */
export const HONOR_CONTACT_WEIGHT = 3;
/** أقل تفاعل يسمح بالترشح (حتى لا تُمنح شهادة لصاحب مهنة بلا أي تفاعل). */
export const HONOR_MIN_SCORE = 5;

export type HonorStat = { serviceId: string; views: number; contacts: number };
export type HonorService = { id: string; name: string; category: string; area?: string; address?: string; rating?: string; reviews?: number; photoVersion?: number };
export type HonorEntry = {
  rank: number;
  service: HonorService;
  views: number;
  contacts: number;
  score: number;
  /** رقم الشهادة للطباعة (مثال: JZ-2026-11-1). */
  certificateNo: string;
};

/** مفتاح الشهر بصيغة YYYY-MM بتوقيت القاهرة. */
export function monthKey(date: Date | number = new Date(), timeZone = "Africa/Cairo"): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone }).formatToParts(new Date(date));
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    return year && month ? `${year}-${month}` : new Date(date).toISOString().slice(0, 7);
  } catch {
    return new Date(date).toISOString().slice(0, 7);
  }
}

/** «نوفمبر ٢٠٢٦» — اسم الشهر كما يُطبع على الشهادة. */
export function monthLabel(month: string, timeZone = "Africa/Cairo"): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return "";
  try {
    return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 15, 9)));
  } catch {
    return month;
  }
}

/** ترتيب المراكز كما يُطبع على الشهادة. */
export const HONOR_TITLES = [
  { rank: 1, title: "المركز الأول", medal: "🥇", tone: "#b45309" },
  { rank: 2, title: "المركز الثاني", medal: "🥈", tone: "#5b7183" },
  { rank: 3, title: "المركز الثالث", medal: "🥉", tone: "#9a5b34" },
] as const;

export function honorTitle(rank: number) {
  return HONOR_TITLES.find((item) => item.rank === rank) ?? HONOR_TITLES[HONOR_TITLES.length - 1];
}

/** رقم الشهادة المطبوع حتى يبقى لكل تكريم مرجع. */
export function certificateNo(month: string, rank: number): string {
  return `JZ-${month}-${rank}`;
}

/** درجة التفاعل: كل اتصال = ٣ نقاط، وكل مشاهدة = نقطة. */
export function honorScore(stat: Pick<HonorStat, "views" | "contacts">): number {
  const views = Number.isFinite(stat.views) ? Math.max(0, stat.views) : 0;
  const contacts = Number.isFinite(stat.contacts) ? Math.max(0, stat.contacts) : 0;
  return views + contacts * HONOR_CONTACT_WEIGHT;
}

export type HonorBaselines = Record<string, Record<string, [number, number]>>;

/** تفاعل الشهر = الحالي ناقص بداية الشهر (لا يقل عن صفر حتى لو الأرقام اتصفّرت). */
export function monthDelta(current: HonorStat, baseline: [number, number] | undefined): { views: number; contacts: number } {
  if (!baseline) return { views: Math.max(0, current.views), contacts: Math.max(0, current.contacts) };
  return { views: Math.max(0, current.views - baseline[0]), contacts: Math.max(0, current.contacts - baseline[1]) };
}

/**
 * أفضل المهنيين للشهر: الترشيح لمن عنده تفاعل كافٍ فقط، والترتيب بالدرجة ثم التقييم ثم الاسم.
 * (`hasBaseline` = هل الأرقام دي خاصة بالشهر الحالي ولا إجمالية من بداية الدليل.)
 */
export function rankMonthlyHonors(
  services: HonorService[],
  stats: HonorStat[],
  options: { month: string; baselines?: Record<string, [number, number]>; limit?: number; minScore?: number },
): HonorEntry[] {
  const limit = options.limit ?? HONORS_LIMIT;
  const minScore = options.minScore ?? HONOR_MIN_SCORE;
  const statById = new Map(stats.map((stat) => [stat.serviceId, stat]));
  return services
    .map((service) => {
      const stat = statById.get(service.id) ?? { serviceId: service.id, views: 0, contacts: 0 };
      const { views, contacts } = monthDelta(stat, options.baselines?.[service.id]);
      return { service, views, contacts, score: honorScore({ views, contacts }) };
    })
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score
      || (Number.parseFloat(b.service.rating ?? "0") || 0) - (Number.parseFloat(a.service.rating ?? "0") || 0)
      || (b.service.reviews ?? 0) - (a.service.reviews ?? 0)
      || a.service.name.localeCompare(b.service.name, "ar"))
    .slice(0, Math.max(1, limit))
    .map((entry, index) => ({
      rank: index + 1,
      service: entry.service,
      views: entry.views,
      contacts: entry.contacts,
      score: entry.score,
      certificateNo: certificateNo(options.month, index + 1),
    }));
}

/** حفظ أقل قدر من البيانات: الشهر الحالي والشهر السابق فقط. */
export function trimmedBaselines(all: HonorBaselines, month: string): HonorBaselines {
  return Object.fromEntries(Object.entries(all).filter(([key]) => key === month).slice(0, 1));
}

/** «١٢ مشاهدة و٤ اتصالات» — سطر الإنجاز المطبوع على الشهادة. */
export function honorAchievementLine(entry: Pick<HonorEntry, "views" | "contacts">): string {
  const parts: string[] = [];
  if (entry.views > 0) parts.push(`${entry.views} مشاهدة`);
  if (entry.contacts > 0) parts.push(`${entry.contacts} اتصال`);
  return parts.join(" و") || "تفاعل مميز من أهل القرية";
}

/** نص منشور جاهز لفيسبوك/واتساب للاحتفال بالمكرمين. */
export function honorPostText(month: string, honors: HonorEntry[], siteName = "دليل جنزور"): string {
  const label = monthLabel(month);
  const lines = honors.map((entry) => `${honorTitle(entry.rank).medal} ${entry.service.name} — ${honorAchievementLine(entry)}`);
  return `🏆 تكريم ${siteName}\nأكثر المهنيين تفاعلًا مع أهل القرية في ${label}:\n\n${lines.join("\n")}\n\nمبروك للجميع، وشكرًا لكل من ساعد أهل جنزور 💙`;
}

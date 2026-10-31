/**
 * الرسائل الترحيبية العائمة — منطق نقي (بدون متصفح أو قاعدة بيانات).
 *
 * ثلاث لحظات:
 * 1) عضو جديد لسه مسجّل → ترحيب + خطوات سريعة.
 * 2) مهني قدّم مهنة والإدارة لسه بتراجع → طمأنة + متابعة الطلب + نصيحة.
 * 3) الإدارة وافقت → احتفال + رابط بطاقته + ملصق QR (وتظهر أول ما يفتح الموقع،
 *    حتى لو كان قافل التطبيق وقت الموافقة).
 *
 * كل رسالة بتظهر مرة واحدة لكل حالة، والإظهار محفوظ على جهاز الزائر.
 */

export type WelcomeTone = "member" | "pending" | "approved" | "needs-info" | "rejected";

export type WelcomeMessage = {
  tone: WelcomeTone;
  emoji: string;
  title: string;
  body: string;
  bullets: string[];
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** مفتاح «شوهدت» — يتغير لما الحالة تتغير، فتظهر الرسالة من جديد. */
  storageKey: string;
};

export const WELCOME_STORAGE_PREFIX = "janzour-welcome-v1";

export function memberWelcomeKey(memberId: string) {
  return `${WELCOME_STORAGE_PREFIX}:member:${memberId || "guest"}`;
}

export function providerStatusKey(serviceId: string, statusUpdatedAt: string | Date) {
  const stamp = typeof statusUpdatedAt === "string" ? statusUpdatedAt : statusUpdatedAt.toISOString();
  return `${WELCOME_STORAGE_PREFIX}:provider:${serviceId}:${stamp}`;
}

/** رسالة العضو الجديد بعد التسجيل مباشرة. */
export function memberWelcome(name: string, siteName = "دليل جنزور"): WelcomeMessage {
  const firstName = (name ?? "").trim().split(/\s+/)[0] || "صديقنا";
  return {
    tone: "member",
    emoji: "🎉",
    title: `أهلًا بيك يا ${firstName} في ${siteName}`,
    body: "عضويتك اتفعلت — بقى عندك وصول كامل لأرقام أهل القرية وخدماتهم، وتقدر تضيف مهنتك مجانًا.",
    bullets: [
      "ابحث بالاسم أو المهنة أو حتى لو كتبتها غلط",
      "احفظ اللي بتحبه في المفضلة وارجعله في ثانية",
      "فعّل الإشعارات من الجرس فوق عشان تعرف أول ما يتضاف جديد",
    ],
    primary: { label: "ابدأ تصفّح الدليل", href: "/" },
    storageKey: memberWelcomeKey(""),
  };
}

/** رسالة المهني اللي قدّم مهنة والإدارة لسه بتراجع. */
export function providerPending(name: string, trackingHref = ""): WelcomeMessage {
  return {
    tone: "pending",
    emoji: "⏳",
    title: "طلبك وصل.. وإحنا بنراجعه دلوقتي",
    body: `شكرًا ${name} — طلب نشر مهنتك وصل للإدارة، والمراجعة بتاخد عادة أقل من يوم. مش محتاج تعمل أي حاجة.`,
    bullets: [
      "هنبلغك على واتساب أول ما تتم الموافقة",
      "تأكد إن رقمك مكتوب صح عشان نوصلك بسرعة",
      "لو الإدارة طلبت استكمال بيانات، هيوصلك إشعار بيه",
    ],
    ...(trackingHref ? { primary: { label: "متابعة حالة الطلب", href: trackingHref } } : {}),
    secondary: { label: "تصفّح الدليل لحد ما نرجعلك", href: "/" },
    storageKey: "provider-pending",
  };
}

/** رسالة الاحتفال بعد موافقة الإدارة — تظهر أول ما يفتح الموقع. */
export function providerApproved(name: string, publicHref: string, accountHref: string): WelcomeMessage {
  return {
    tone: "approved",
    emoji: "🎊",
    title: "مبروك! مهنتك اتنشرت على الدليل",
    body: `${name}، بطاقتك بقت ظاهرة لأهل جنزور — أي حد يدوّر على شغلك هيلاقيك بأرقامك وأزرار الاتصال والواتساب.`,
    bullets: [
      "شارك رابط بطاقتك على فيسبوك وواتساب",
      "اطبع ملصق QR من حسابك وحطه على المحل أو الكاشير",
      "أكّد بياناتك من وقت للتاني عشان الرقم يفضل محدّث",
    ],
    primary: { label: "شوف بطاقتك", href: publicHref },
    secondary: { label: "حسابي وملصق QR", href: accountHref },
    storageKey: "provider-approved",
  };
}

/** حالات محتاجة انتباه المهني (استكمال بيانات / رفض). */
export function providerAttention(status: "needs-info" | "rejected", note: string, accountHref: string): WelcomeMessage {
  const needsInfo = status === "needs-info";
  return {
    tone: status,
    emoji: needsInfo ? "📝" : "⚠️",
    title: needsInfo ? "محتاجين استكمال بيانات منك" : "مهنتك مش منشورة حاليًا",
    body: needsInfo
      ? "الإدارة طلبت بيانات إضافية قبل النشر — الخطوة بسيطة وممكن تخلصها في دقيقة."
      : "الإدارة أوقفت نشر بطاقتك. تقدر تتواصل معانا ونساعدك تصلّح اللي ناقص.",
    bullets: note ? [note] : ["افتح حسابك وشوف التفاصيل المطلوبة"],
    primary: { label: "افتح حسابي", href: accountHref },
    secondary: { label: "تواصل مع الإدارة", href: "/" },
    storageKey: `provider-${status}`,
  };
}

/** هل نعرض الرسالة؟ (مشوفناهاش قبل كده على الجهاز) */
export function shouldShowWelcome(storageKey: string, seen: string | null | undefined) {
  return Boolean(storageKey) && storageKey !== seen;
}

/** يقرأ مفاتيح «شوهدت» من نص JSON — يتعامل مع أي تلف بهدوء. */
export function parseSeenMap(raw: string | null | undefined): Record<string, string> {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === "string" && typeof value === "string") result[key] = value;
    }
    return result;
  } catch { return {}; }
}

/** يسجّل إن الرسالة اتشافت، مع الحفاظ على آخر ٦٠ مفتاح فقط. */
export function rememberWelcome(raw: string | null | undefined, kind: string, storageKey: string) {
  const map = parseSeenMap(raw);
  map[kind] = storageKey;
  const entries = Object.entries(map).slice(-60);
  return JSON.stringify(Object.fromEntries(entries));
}

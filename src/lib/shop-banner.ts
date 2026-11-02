/**
 * «بانر رقمي للمحل» — صورة عريضة جاهزة من بيانات المحل المنشورة في الدليل.
 *
 * الفكرة: صاحب المحل بيحتاج صورة واحدة تتحط في أكتر من مكان:
 *  - غلاف صفحة الفيسبوك أو واتساب بزنس (عرضي).
 *  - ستوري/حالة واتساب (طولي).
 *  - شاشة تلفزيون صغيرة على الكاونتر (عرضي كبير).
 *  - منشور مربع في جروبات جنزور.
 * كل مقاس ليه تصميمه، والمحتوى نفسه: الاسم + التخصص + المنطقة + الأرقام + المواعيد +
 * عرض اختياري + QR يفتح بطاقة المحل.
 *
 * هذا الملف نقي (بدون Canvas أو DOM) حتى يُختبر مباشرة؛ الرسم في
 * `src/components/shop-banner-modal.tsx`.
 */

export type BannerFormatId = "cover" | "story" | "screen" | "square";

export type BannerFormat = {
  id: BannerFormatId;
  label: string;
  short: string;
  width: number;
  height: number;
  /** فين بيتحط البانر ده. */
  useCase: string;
  landscape: boolean;
};

/** المقاسات المعتمدة — نفس نسب المنصات الشائعة حتى ما يتقصّش النص. */
export const BANNER_FORMATS: BannerFormat[] = [
  { id: "cover", label: "غلاف فيسبوك أو واتساب بزنس", short: "غلاف", width: 1640, height: 856, useCase: "يتحط غلاف لصفحة المحل على فيسبوك أو واتساب بزنس", landscape: true },
  { id: "story", label: "ستوري إنستجرام أو حالة واتساب", short: "ستوري", width: 1080, height: 1920, useCase: "حالة واتساب أو ستوري — بتوصل لكل اللي عندهم رقمك", landscape: false },
  { id: "screen", label: "شاشة المحل (تلفزيون)", short: "شاشة", width: 1920, height: 1080, useCase: "شاشة تلفزيون على الكاونتر أو واجهة المحل — العميل يمسح الكود", landscape: true },
  { id: "square", label: "منشور مربع", short: "منشور", width: 1080, height: 1080, useCase: "منشور في جروبات جنزور أو صفحة المحل", landscape: false },
];

export function bannerFormat(id: string | undefined | null): BannerFormat {
  return BANNER_FORMATS.find((format) => format.id === id) ?? BANNER_FORMATS[0];
}

/** مقاس بالمقاسات المفهومة: «1640 × 856 بكسل». */
export function bannerSizeLabel(format: BannerFormat): string {
  return `${format.width} × ${format.height} بكسل`;
}

export type BannerThemeId = "day" | "night" | "gold" | "green";

export type BannerTheme = {
  id: BannerThemeId;
  label: string;
  /** تدرّج الخلفية (من أعلى لأسفل). */
  bg: [string, string];
  /** لون اللوحة الشفافة اللي بيتحط عليها الاسم. */
  panel: string;
  text: string;
  muted: string;
  accent: string;
  /** لون الـQR — لازم يفضل غامق على فاتح حتى يتقري بالكاميرا. */
  qrDark: string;
  qrLight: string;
  /** لون الشريط السفلي. */
  strip: string;
};

export const BANNER_THEMES: BannerTheme[] = [
  { id: "day", label: "نهاري", bg: ["#ffffff", "#e8f3ff"], panel: "#ffffff", text: "#0b2138", muted: "#4c6a86", accent: "#0b7fd4", qrDark: "#0b2138", qrLight: "#ffffff", strip: "#0b5f9e" },
  { id: "night", label: "ليلي", bg: ["#0b2138", "#123a5c"], panel: "#0f2b45", text: "#ffffff", muted: "#a9c7de", accent: "#4fb3ff", qrDark: "#0b2138", qrLight: "#ffffff", strip: "#0b7fd4" },
  { id: "gold", label: "ذهبي", bg: ["#1c1206", "#3a2408"], panel: "#2a1a06", text: "#fff6e0", muted: "#e2c89a", accent: "#f5b942", qrDark: "#1c1206", qrLight: "#ffffff", strip: "#f5b942" },
  { id: "green", label: "أخضر", bg: ["#f4fdf7", "#d7f2e1"], panel: "#ffffff", text: "#0c2f20", muted: "#4c6f5d", accent: "#15803d", qrDark: "#0c2f20", qrLight: "#ffffff", strip: "#15803d" },
];

export function bannerTheme(id: string | undefined | null): BannerTheme {
  return BANNER_THEMES.find((theme) => theme.id === id) ?? BANNER_THEMES[0];
}

export type ShopBannerData = {
  name: string;
  /** التخصص كما يظهر في الدليل (مثال: سباكة — الحرفيين). */
  headline: string;
  area: string;
  phones: string[];
  hours?: string;
  /** عرض أو رسالة قصيرة تحت البيانات (اختياري). */
  offer?: string;
  /** رابط صفحة المحل اللي يفتحها الكود. */
  url: string;
  siteName: string;
  officePhone?: string;
  verified?: boolean;
  rating?: string;
  reviews?: number;
};

/** أقصى طول لسطر العرض حتى ما يزحمش البانر. */
export const BANNER_OFFER_MAX = 64;

/** سطر العرض بعد التنظيف والتقصير. */
export function bannerOfferLine(value: string | undefined | null): string {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= BANNER_OFFER_MAX) return clean;
  return `${clean.slice(0, BANNER_OFFER_MAX - 1).trimEnd()}…`;
}

/** الأرقام بعد التنظيف (بدون تكرار، وأقصى رقمين). */
export function bannerPhones(phones: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const phone of phones) {
    const value = (phone ?? "").trim();
    if (!value) continue;
    const key = value.replace(/\D/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push(value);
  }
  return list.slice(0, 2);
}

/** مواعيد العمل للعرض المختصر (بتشيل الشرطات الزايدة). */
export function bannerHoursLine(value: string | undefined | null): string {
  return (value ?? "").replace(/\s*[-–—]\s*/g, " – ").replace(/\s+/g, " ").trim().slice(0, 40);
}

/** سطور المعلومات المرسومة على البانر — الخانات الفارغة مش بتترسم. */
export function bannerFacts(data: ShopBannerData): { label: string; value: string; ltr?: boolean }[] {
  const facts: { label: string; value: string; ltr?: boolean }[] = [];
  const phones = bannerPhones(data.phones);
  if (phones.length) facts.push({ label: phones.length > 1 ? "أرقام المحل" : "رقم المحل", value: phones.join("  •  "), ltr: true });
  const hours = bannerHoursLine(data.hours);
  if (hours) facts.push({ label: "المواعيد", value: hours });
  if (data.area) facts.push({ label: "العنوان", value: data.area });
  return facts;
}

/** هل البيانات كافية لبانر مفيد؟ (اسم + رابط + رقم). */
export function bannerReady(data: ShopBannerData): boolean {
  return Boolean(data.name.trim() && data.url.trim() && bannerPhones(data.phones).length);
}

/** الجملة الصغيرة فوق الاسم — بتوضح إن المحل على الدليل. */
export function bannerKicker(data: Pick<ShopBannerData, "siteName" | "verified">): string {
  return data.verified ? `محل موثّق على ${data.siteName}` : `موجود على ${data.siteName}`;
}

/** الجملة اللي تحت الـQR: إيه اللي يحصل لما العميل يمسح الكود. */
export function bannerScanHint(): string {
  return "امسح الكود تشوف البطاقة كاملة وتتصل بضغطة";
}

/** اسم ملف PNG نضيف (بدون رموز تكسر التنزيل). */
export function bannerFileName(data: Pick<ShopBannerData, "name">, formatId: BannerFormatId | string): string {
  const clean = (data.name || "").replace(/[\\/:*?"<>|\n\r\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);
  return `بانر-${clean || "محل"}-${bannerFormat(formatId).short}-دليل-جنزور.png`;
}

/** النص الجاهز للنشر مع البانر على واتساب/فيسبوك. */
export function bannerCaption(data: ShopBannerData, formatId: BannerFormatId | string): string {
  const format = bannerFormat(formatId);
  const phones = bannerPhones(data.phones);
  const lines = [
    `🏪 ${data.name}`,
    data.headline ? `🏷️ ${data.headline}` : "",
    data.area ? `📍 ${data.area}` : "",
    phones.length ? `📞 ${phones.join(" — ")}` : "",
    bannerHoursLine(data.hours) ? `🕒 ${bannerHoursLine(data.hours)}` : "",
    bannerOfferLine(data.offer) ? `📣 ${bannerOfferLine(data.offer)}` : "",
    `🔗 ${data.url}`,
    `— ${format.label} جاهزة من ${data.siteName}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/* =====================================================================
 * حساب مكان كل سطر قبل الرسم
 * ---------------------------------------------------------------------
 * الرسم على Canvas مش متاح في الاختبارات، فكل الأرقام (أحجام الخطوط،
 * لفّ الأسطر، مكان الكود، الشريط السفلي) بتتحسب هنا بدالة `measure`
 * بسيطة، والرسم في المكوّن بيستهلك الناتج زي ما هو.
 * ===================================================================== */

/** يقيس عرض نص بحجم/وزن معيّن — في المتصفح بترجع من Canvas، وفي الاختبار تقريب. */
export type BannerMeasure = (text: string, size: number, weight: number) => number;

export type BannerColorRole = "text" | "muted" | "accent" | "onAccent" | "onStrip";

export type BannerTextItem = {
  text: string;
  /** خط الأساس (baseline). */
  x: number;
  y: number;
  size: number;
  weight: number;
  align: "left" | "right" | "center";
  /** أرقام لاتينية: تُرسم في اتجاه LTR حتى ما تتقلبش. */
  ltr?: boolean;
  color: BannerColorRole;
};

export type BannerBox = { x: number; y: number; w: number; h: number; radius: number };

export type BannerLayout = {
  width: number;
  height: number;
  format: BannerFormat;
  theme: BannerTheme;
  items: BannerTextItem[];
  /** لوحة رمز QR (المستطيل اللي ورا الكود) والكود جواها. */
  panel: BannerBox;
  qr: { x: number; y: number; side: number };
  strip: BannerBox;
  offer: (BannerBox & { text: string; size: number }) | null;
  /** أقل ارتفاع لمحتوى النص — يساعد في اختبار عدم التزاحم. */
  contentBottom: number;
};

function fitSize(measure: BannerMeasure, text: string, maxWidth: number, start: number, weight: number, min: number) {
  let size = start;
  while (size > min && measure(text, size, weight) > maxWidth) size -= Math.max(1, size * 0.04);
  return Math.max(min, Math.round(size));
}

function ellipsizeWith(measure: BannerMeasure, text: string, maxWidth: number, size: number, weight: number) {
  if (measure(text, size, weight) <= maxWidth) return text;
  let value = text;
  while (value.length > 4 && measure(`${value}…`, size, weight) > maxWidth) value = value.slice(0, -1);
  return `${value.trim()}…`;
}

function wrapTwoLinesWith(measure: BannerMeasure, text: string, maxWidth: number, size: number, weight: number) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (measure(next, size, weight) <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && current) lines.push(current);
  return lines.map((line) => ellipsizeWith(measure, line, maxWidth, size, weight));
}

/** رقم الهاتف بشكل مقروء: 0100 123 4567. */
export function bannerPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return value;
}

/** كل نصوص ومساحات البانر قبل الرسم. */
export function bannerLayout(data: ShopBannerData, formatId: BannerFormatId | string, themeId: BannerThemeId | string, measure: BannerMeasure): BannerLayout {
  const format = bannerFormat(formatId);
  const theme = bannerTheme(themeId);
  const W = format.width;
  const H = format.height;
  const items: BannerTextItem[] = [];
  const phones = bannerPhones(data.phones).map(bannerPhoneDisplay);
  const offer = bannerOfferLine(data.offer);
  const facts = bannerFacts(data);

  if (format.landscape) {
    const m = Math.round(W * 0.042);
    const stripH = Math.round(H * 0.085);
    const contentH = H - stripH;
    const panelSide = Math.round(Math.min(contentH * 0.58, W * 0.3));
    const panelPad = Math.round(panelSide * 0.08);
    const panelW = panelSide + panelPad * 2;
    const panelX = m;
    const panelY = Math.round((contentH - panelSide - panelPad * 2) / 2);
    const textRight = W - m;
    const textLeft = panelX + panelW + Math.round(W * 0.03);
    const textWidth = Math.max(120, textRight - textLeft);
    const available = contentH - m * 2;
    const hintSize = Math.max(13, Math.round(panelSide * 0.075));

    let scale = 1;
    let kickerSize = 13, nameSize = 24, headlineSize = 13, phoneLabelSize = 11, phoneSize = 15, factSize = 11, offerSize = 12;
    let nameLines: string[] = [];
    for (let step = 0; step < 10; step += 1) {
      kickerSize = Math.max(13, Math.round(H * 0.036 * scale));
      headlineSize = Math.max(13, Math.round(H * 0.045 * scale));
      phoneLabelSize = Math.max(11, Math.round(H * 0.033 * scale));
      phoneSize = Math.max(15, Math.round(H * 0.062 * scale));
      factSize = Math.max(11, Math.round(H * 0.036 * scale));
      offerSize = Math.max(12, Math.round(H * 0.042 * scale));
      nameSize = fitSize(measure, data.name, textWidth, Math.round(H * 0.125 * scale), 900, Math.round(H * 0.055 * scale));
      nameLines = wrapTwoLinesWith(measure, data.name, textWidth, nameSize, 900);
      const stack = kickerSize * 1.9
        + nameLines.length * nameSize * 1.16
        + headlineSize * 1.9
        + (phones.length ? phoneLabelSize * 1.5 + phoneSize * 1.35 : 0)
        + facts.filter((fact) => !fact.ltr).length * factSize * 1.75
        + (offer ? offerSize * 2.2 : 0);
      if (stack <= available) break;
      scale -= 0.08;
    }

    const blockHeight = kickerSize * 1.9
      + nameLines.length * nameSize * 1.16
      + headlineSize * 1.9
      + (phones.length ? phoneLabelSize * 1.5 + phoneSize * 1.35 : 0)
      + facts.filter((fact) => !fact.ltr).length * factSize * 1.75
      + (offer ? offerSize * 2.2 : 0);
    const centerY = contentH / 2;
    let y = Math.round(Math.max(m, centerY - blockHeight / 2) + kickerSize);

    items.push({ text: bannerKicker(data), x: textRight, y, size: kickerSize, weight: 900, align: "right", color: "accent" });
    y += Math.round(kickerSize * 0.9);
    for (const line of nameLines) {
      y += Math.round(nameSize * 1.02);
      items.push({ text: line, x: textRight, y, size: nameSize, weight: 900, align: "right", color: "text" });
    }
    y += Math.round(headlineSize * 0.75);
    items.push({ text: ellipsizeWith(measure, data.headline, textWidth, headlineSize, 700), x: textRight, y, size: headlineSize, weight: 700, align: "right", color: "muted" });
    y += Math.round(headlineSize * 1.5);

    if (phones.length) {
      items.push({ text: phones.length > 1 ? "أرقام المحل" : "رقم المحل", x: textRight, y, size: phoneLabelSize, weight: 700, align: "right", color: "muted" });
      y += Math.round(phoneSize * 0.95);
      items.push({ text: phones.join("  •  "), x: textRight, y, size: phoneSize, weight: 900, align: "right", color: "accent", ltr: true });
      y += Math.round(phoneSize * 0.65);
    }

    for (const fact of facts.filter((item) => !item.ltr)) {
      y += Math.round(factSize * 1.5);
      items.push({ text: `${fact.label}: ${fact.value}`, x: textRight, y, size: factSize, weight: 700, align: "right", color: "muted" });
    }

    let offerBox: BannerLayout["offer"] = null;
    if (offer) {
      y += Math.round(offerSize * 1.9);
      const text = ellipsizeWith(measure, `📣 ${offer}`, textWidth, offerSize, 900);
      const w = Math.min(textWidth, Math.round(measure(text, offerSize, 900) + offerSize * 1.6));
      offerBox = { x: textRight - w, y: y - Math.round(offerSize * 1.05), w, h: Math.round(offerSize * 1.75), radius: Math.round(offerSize * 0.7), text, size: offerSize };
    }

    // نصوص الشريط السفلي
    const stripSize = Math.max(13, Math.round(stripH * 0.36));
    items.push({ text: `${data.siteName} — دليل أهل جنزور`, x: W - m, y: Math.round(contentH + stripH * 0.62), size: stripSize, weight: 900, align: "right", color: "onStrip" });
    if (data.officePhone) {
      items.push({ text: `☎ ${bannerPhoneDisplay(data.officePhone)}`, x: m, y: Math.round(contentH + stripH * 0.62), size: stripSize, weight: 700, align: "left", color: "onStrip", ltr: true });
    }

    return {
      width: W, height: H, format, theme, items,
      panel: { x: panelX, y: panelY, w: panelW, h: panelSide + panelPad * 2, radius: Math.round(panelSide * 0.09) },
      qr: { x: panelX + panelPad, y: panelY + panelPad, side: panelSide },
      strip: { x: 0, y: contentH, w: W, h: stripH, radius: 0 },
      offer: offerBox,
      contentBottom: contentH,
    };
  }

  // ===== طولي: ستوري أو منشور مربع =====
  const m = Math.round(W * 0.075);
  const stripH = Math.round(H * 0.055);
  const contentH = H - stripH;
  const textWidth = W - m * 2;
  const compactFacts = facts.filter((fact) => !fact.ltr).slice(0, 2);
  const qrSide = Math.round(Math.min(W * 0.4, contentH * 0.28));
  const qrPad = Math.round(qrSide * 0.07);
  const hintSize = Math.max(12, Math.round(W * 0.026));
  const qrTop = contentH - m - qrSide - qrPad * 2 - Math.round(hintSize * 1.9);
  const available = qrTop - m - Math.round(H * 0.01);

  let scale = 1;
  let nameSize = Math.round(W * 0.115);
  let nameLines: string[] = [];
  const kickerSize = () => Math.max(13, Math.round(W * 0.032 * scale));
  const headlineSize = () => Math.max(12, Math.round(W * 0.036 * scale));
  const phoneSize = () => Math.max(15, Math.round(W * 0.055 * scale));
  const factSize = () => Math.max(12, Math.round(W * 0.033 * scale));
  const offerSize = () => Math.max(12, Math.round(W * 0.036 * scale));
  for (let step = 0; step < 12; step += 1) {
    nameSize = Math.round(W * 0.115 * scale);
    nameLines = wrapTwoLinesWith(measure, data.name, textWidth, nameSize, 900);
    const stack = kickerSize() * 1.9
      + nameLines.length * nameSize * 1.12
      + headlineSize() * 1.9
      + (phones.length ? phoneSize() * 1.7 : 0)
      + compactFacts.length * factSize() * 1.85
      + (offer ? offerSize() * 2.3 : 0);
    if (stack <= available) break;
    scale -= 0.07;
  }

  const centerX = W / 2;
  let y = m + kickerSize();
  items.push({ text: ellipsizeWith(measure, bannerKicker(data), textWidth, kickerSize(), 900), x: centerX, y, size: kickerSize(), weight: 900, align: "center", color: "accent" });
  y += Math.round(nameSize * 0.85);
  for (const line of nameLines) {
    y += Math.round(nameSize * 1.02);
    items.push({ text: line, x: centerX, y, size: nameSize, weight: 900, align: "center", color: "text" });
  }
  y += Math.round(headlineSize() * 1.6);
  items.push({ text: ellipsizeWith(measure, data.headline, textWidth, headlineSize(), 700), x: centerX, y, size: headlineSize(), weight: 700, align: "center", color: "muted" });

  if (phones.length) {
    y += Math.round(phoneSize() * 1.55);
    items.push({ text: phones.join("   •   "), x: centerX, y, size: phoneSize(), weight: 900, align: "center", color: "accent", ltr: true });
  }
  for (const fact of compactFacts) {
    y += Math.round(factSize() * 1.6);
    if (y > qrTop - factSize()) break;
    items.push({ text: ellipsizeWith(measure, `${fact.label}: ${fact.value}`, textWidth, factSize(), 700), x: centerX, y, size: factSize(), weight: 700, align: "center", color: "muted" });
  }

  let offerBox: BannerLayout["offer"] = null;
  if (offer) {
    y += Math.round(offerSize() * 2);
    if (y < qrTop - offerSize() * 1.5) {
      const text = ellipsizeWith(measure, `📣 ${offer}`, Math.round(textWidth * 0.94), offerSize(), 900);
      const w = Math.min(textWidth, Math.round(measure(text, offerSize(), 900) + offerSize() * 1.8));
      offerBox = { x: Math.round(centerX - w / 2), y: y - Math.round(offerSize() * 1.05), w, h: Math.round(offerSize() * 1.85), radius: Math.round(offerSize() * 0.75), text, size: offerSize() };
    }
  }

  items.push({ text: ellipsizeWith(measure, bannerScanHint(), textWidth, hintSize, 700), x: centerX, y: qrTop + qrSide + qrPad * 2 + Math.round(hintSize * 1.3), size: hintSize, weight: 700, align: "center", color: "muted" });

  const stripSize = Math.max(12, Math.round(stripH * 0.4));
  items.push({
    text: `${data.siteName}${data.officePhone ? `  •  ☎ ${bannerPhoneDisplay(data.officePhone)}` : ""}`,
    x: centerX, y: Math.round(contentH + stripH * 0.62), size: stripSize, weight: 900, align: "center", color: "onStrip",
  });

  return {
    width: W, height: H, format, theme, items,
    panel: { x: Math.round(centerX - qrSide / 2 - qrPad), y: qrTop, w: qrSide + qrPad * 2, h: qrSide + qrPad * 2, radius: Math.round(qrSide * 0.09) },
    qr: { x: Math.round(centerX - qrSide / 2), y: qrTop + qrPad, side: qrSide },
    strip: { x: 0, y: contentH, w: W, h: stripH, radius: 0 },
    offer: offerBox,
    contentBottom: qrTop,
  };
}

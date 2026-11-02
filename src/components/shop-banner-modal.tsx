"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, Download, LoaderCircle, Palette, Printer, Share2, Store } from "lucide-react";
import { Modal } from "@/components/ui";
import { drawQr } from "@/components/qr-svg";
import {
  BANNER_FORMATS, BANNER_THEMES, bannerCaption, bannerFileName, bannerFormat, bannerLayout, bannerSizeLabel,
  type BannerFormatId, type BannerLayout, type BannerThemeId, type ShopBannerData,
} from "@/lib/shop-banner";

/**
 * «بانر رقمي للمحل»: رسم كامل على Canvas داخل المتصفح (بدون أي خدمة خارجية).
 * صاحب المحل بيختار المقاس (غلاف/ستوري/شاشة/منشور) واللون، ويضيف سطر عرض،
 * ثم يحفظ الصورة PNG أو يشاركها على واتساب أو يطبعها.
 * كل الأرقام والأسطر بتيجي جاهزة من `bannerLayout` في `@/lib/shop-banner` — هنا الرسم بس.
 */

const FONT_STACK = "Cairo, \"Segoe UI\", Tahoma, sans-serif";
const GOLD_INK = "#2a1a06";
const ON_ACCENT = "#ffffff";

async function readyFonts() {
  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load("900 64px Cairo"), document.fonts.load("700 32px Cairo"), document.fonts.load("400 24px Cairo")]);
  } catch { /* الخط قد يكون محفوظًا مسبقًا */ }
}

type Ctx = CanvasRenderingContext2D;

function fillRoundRect(ctx: Ctx, box: { x: number; y: number; w: number; h: number; radius: number }, fill: string) {
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, box.radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** خلفية البانر: تدرّج لوني + دوائر وخطوط خفيفة حتى ما تبقاش الصورة فاضية. */
function drawBackground(ctx: Ctx, layout: BannerLayout) {
  const { width: W, height: H, theme } = layout;
  const gradient = ctx.createLinearGradient(0, 0, W * 0.35, H);
  gradient.addColorStop(0, theme.bg[0]);
  gradient.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = theme.accent;
  ctx.beginPath(); ctx.arc(W * 0.02, H * 0.06, Math.min(W, H) * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.96, H * 0.94, Math.min(W, H) * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = theme.text;
  ctx.lineWidth = Math.max(1, W * 0.0016);
  for (let x = -H; x < W; x += Math.max(28, W * 0.045)) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
  }
  ctx.restore();
}

/** يرسم كل حاجة من نتيجة الحساب: الخلفية، شريط العنوان، سطر العرض، لوحة الكود، والنصوص. */
function paintLayout(ctx: Ctx, layout: BannerLayout) {
  const { theme } = layout;
  const onDark = theme.id === "gold" ? GOLD_INK : ON_ACCENT;
  drawBackground(ctx, layout);

  // الشريط السفلي
  ctx.fillStyle = theme.strip;
  ctx.fillRect(layout.strip.x, layout.strip.y, layout.strip.w, layout.strip.h);

  // سطر العرض
  if (layout.offer) {
    fillRoundRect(ctx, layout.offer, theme.accent);
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillStyle = onDark;
    ctx.font = `900 ${layout.offer.size}px ${FONT_STACK}`;
    ctx.fillText(layout.offer.text, layout.offer.x + layout.offer.w / 2, layout.offer.y + Math.round(layout.offer.size * 1.05));
  }

  // لوحة الكود (الكود نفسه بيترسم في renderShopBanner لأنه محتاج رابط البطاقة)
  fillRoundRect(ctx, layout.panel, theme.panel);

  // النصوص
  for (const item of layout.items) {
    ctx.textAlign = item.align;
    ctx.direction = item.ltr ? "ltr" : "rtl";
    ctx.fillStyle = item.color === "text" ? theme.text
      : item.color === "muted" ? theme.muted
        : item.color === "accent" ? theme.accent
          : onDark;
    ctx.font = `${item.weight} ${item.size}px ${FONT_STACK}`;
    ctx.fillText(item.text, item.x, item.y);
  }
}

/** يرسم البانر ويرجّع الـcanvas جاهزًا للتحويل لصورة. */
export async function renderShopBanner(data: ShopBannerData, formatId: BannerFormatId | string, themeId: BannerThemeId | string): Promise<HTMLCanvasElement> {
  const format = bannerFormat(formatId);
  await readyFonts();
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("المتصفح لا يدعم الرسم");
  ctx.textBaseline = "alphabetic";
  const measure = (text: string, size: number, weight: number) => {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    return ctx.measureText(text).width;
  };
  const layout = bannerLayout(data, formatId, themeId, measure);
  paintLayout(ctx, layout);
  // الكود بيرسم بعد الخلفية واللوحة: مكانه جاي من نفس الـlayout، ومحتواه رابط البطاقة.
  drawQr(ctx, data.url, layout.qr.x, layout.qr.y, layout.qr.side, layout.theme.qrDark, layout.theme.qrLight, 2);
  return canvas;
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export default function ShopBannerModal({ data, onClose }: { data: ShopBannerData; onClose: () => void }) {
  const [formatId, setFormatId] = useState<BannerFormatId>("cover");
  const [themeId, setThemeId] = useState<BannerThemeId>("day");
  const [offer, setOffer] = useState(() => (data.offer ?? "").slice(0, 64));
  const [preview, setPreview] = useState("");
  const [rendering, setRendering] = useState(true);
  const [busy, setBusy] = useState<"" | "download" | "share">("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const live: ShopBannerData = { ...data, offer };

  // إعادة الرسم مع كل تغيير في المقاس أو اللون أو سطر العرض — Canvas مش متاح غير في المتصفح.
  useEffect(() => {
    let alive = true;
    const next: ShopBannerData = { ...data, offer };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- المعاينة تُرسم بعد تركيب المكوّن (Canvas)
    setRendering(true);
    renderShopBanner(next, formatId, themeId)
      .then((canvas) => {
        if (!alive) return;
        canvasRef.current = canvas;
        setPreview(canvas.toDataURL("image/png"));
      })
      .catch(() => { if (alive) setNotice("تعذر تجهيز البانر — جرّب تغيير المقاس."); })
      .finally(() => { if (alive) setRendering(false); });
    return () => { alive = false; };
    // بيانات المحل الأساسية ثابتة داخل النافذة؛ التغيير الحقيقي هو المقاس واللون وسطر العرض.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatId, themeId, offer]);

  async function download() {
    setBusy("download");
    try {
      const canvas = canvasRef.current ?? await renderShopBanner(live, formatId, themeId);
      const blob = await canvasBlob(canvas);
      if (!blob) throw new Error();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = bannerFileName(live, formatId);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setNotice("تم حفظ البانر في التنزيلات ✓");
    } catch { setNotice("تعذر الحفظ — جرّب من متصفح تاني."); }
    finally { setBusy(""); }
  }

  async function share() {
    setBusy("share");
    const caption = bannerCaption(live, formatId);
    try {
      const canvas = canvasRef.current ?? await renderShopBanner(live, formatId, themeId);
      const blob = await canvasBlob(canvas);
      const file = blob ? new File([blob], bannerFileName(live, formatId), { type: "image/png" }) : null;
      if (file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption, title: live.name });
      } else if (typeof navigator.share === "function") {
        await navigator.share({ text: caption, title: live.name, url: live.url });
      } else {
        await navigator.clipboard.writeText(caption);
        setNotice("نص المنشور اتنسخ — استخدم زر الحفظ لتحميل الصورة ✓");
      }
    } catch { /* المستخدم قفل نافذة المشاركة */ }
    finally { setBusy(""); }
  }

  async function copyCaption() {
    try { await navigator.clipboard.writeText(bannerCaption(live, formatId)); setNotice("نص المنشور اتنسخ ✓"); }
    catch { setNotice("تعذر النسخ — انسخ الرابط من العنوان."); }
  }

  function print() {
    const source = canvasRef.current;
    if (!source) return;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) { setNotice("المتصفح منع نافذة الطباعة."); return; }
    const title = bannerFileName(live, formatId);
    win.document.write(`<html dir="rtl"><head><title>${title}</title><style>@page{margin:8mm}body{margin:0;display:grid;place-items:center}img{max-width:100%;max-height:100vh}</style></head><body><img src="${source.toDataURL("image/png")}" onload="window.print()"/></body></html>`);
    win.document.close();
  }

  const format = bannerFormat(formatId);

  return (
    <Modal title="بانر رقمي للمحل" subtitle="صورة واحدة تنفع غلاف صفحة، حالة واتساب، شاشة المحل، أو منشور — جاهزة من بياناتك." onClose={onClose} wide className="shop-banner-modal">
      <div className="shop-banner">
        <div className="shop-banner-formats" role="tablist" aria-label="مقاس البانر">
          {BANNER_FORMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={formatId === item.id}
              className={`shop-banner-format ${formatId === item.id ? "is-active" : ""}`}
              onClick={() => setFormatId(item.id)}
            >
              <b>{item.short}</b>
              <small>{item.width}×{item.height}</small>
            </button>
          ))}
        </div>
        <p className="shop-banner-usecase"><Store size={14}/>{format.useCase} · {bannerSizeLabel(format)}</p>

        <div className={`shop-banner-preview ${format.landscape ? "is-wide" : "is-tall"}`}>
          {rendering && !preview && <span className="shop-banner-loading"><LoaderCircle size={20} className="spin"/> جاري تجهيز البانر…</span>}
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- معاينة Canvas محلية (data URL)
            <img src={preview} alt="معاينة بانر المحل"/>
          )}
          {rendering && preview && <span className="shop-banner-repainting"><LoaderCircle size={14} className="spin"/></span>}
        </div>

        <div className="shop-banner-row">
          <span className="shop-banner-label"><Palette size={14}/> اللون</span>
          <div className="shop-banner-themes">
            {BANNER_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`shop-banner-theme ${themeId === item.id ? "is-active" : ""}`}
                aria-pressed={themeId === item.id}
                onClick={() => setThemeId(item.id)}
              >
                <span className="shop-banner-swatch" style={{ background: `linear-gradient(135deg, ${item.bg[0]}, ${item.accent})` }}/>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="shop-banner-offer">
          <span className="shop-banner-label">سطر عرض (اختياري)</span>
          <input
            className="studio-textbox"
            value={offer}
            maxLength={64}
            placeholder="مثال: خصم ١٠٪ على التصليح طول نوفمبر"
            onChange={(event) => setOffer(event.target.value)}
          />
          <small>{offer.length}/64 — خليه قصير يفضل مقروء على الموبايل.</small>
        </label>

        <div className="shop-banner-actions">
          <button type="button" className="button button-primary" onClick={() => void download()} disabled={busy !== ""}>
            {busy === "download" ? <LoaderCircle size={16} className="spin"/> : <Download size={16}/>} حفظ البانر
          </button>
          <button type="button" className="button button-soft" onClick={() => void share()} disabled={busy !== ""}>
            {busy === "share" ? <LoaderCircle size={16} className="spin"/> : <Share2 size={16}/>} مشاركة
          </button>
          <button type="button" className="button button-soft" onClick={() => void copyCaption()}><Clipboard size={16}/> نسخ نص المنشور</button>
          <button type="button" className="button button-soft" onClick={print}><Printer size={16}/> طباعة</button>
        </div>

        {notice && <p className="shop-banner-notice" role="status">{notice}</p>}
        <p className="shop-banner-hint">
          البانر بيترسم من بياناتك المنشورة في الدليل: الاسم والتخصص والمنطقة والأرقام والمواعيد، والكود بيفتح بطاقتك مباشرة.
          عدّل بياناتك من حسابك وهتلاقي البانر اتحدّث لوحده.
        </p>
      </div>
    </Modal>
  );
}

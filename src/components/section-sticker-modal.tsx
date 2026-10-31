"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageDown, LoaderCircle, Printer, Share2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { drawQr } from "@/components/qr-svg";
import { sectionStickerFileName, sectionStickerText, sectionStickerUrl } from "@/lib/section-sticker";

/** مقاس A6 بدقة 300 نقطة/بوصة (105×148 مم) — نفس مقاس ملصق التقييم. */
const A6_W = 1240, A6_H = 1748;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  return lines;
}

/** يفتح الألوان: نفتح اللون للدرجة الأغمق لحساب التدرّج. */
function shade(hex: string, factor: number) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "0877e6";
  const num = Number.parseInt(value, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((num >> shift) & 0xff) * factor)));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

/** يرسم ملصق «كل … في مكان واحد — امسح» للقسم بلونه ويرجع PNG. */
export async function renderSectionSticker(opts: { name: string; url: string; accent: string; siteName: string; siteHost: string; logoSrc?: string }): Promise<Blob> {
  const canvas = document.createElement("canvas"); canvas.width = A6_W; canvas.height = A6_H;
  const ctx = canvas.getContext("2d")!;
  const text = sectionStickerText(opts.name);
  try { await document.fonts.ready; await document.fonts.load("900 80px Cairo"); } catch { /* ignore */ }
  const font = (weight: number, size: number) => `${weight} ${size}px Cairo, "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif`;
  const round = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 0) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } };

  // الخلفية: أبيض + رأس بلون القسم + ذيل غامق
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, A6_W, A6_H);
  const grad = ctx.createLinearGradient(0, 0, A6_W, 560);
  grad.addColorStop(0, opts.accent); grad.addColorStop(1, shade(opts.accent, 0.62));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, A6_W, 560);
  ctx.beginPath(); ctx.ellipse(A6_W / 2, 560, A6_W * 0.72, 70, 0, 0, Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
  const foot = ctx.createLinearGradient(0, A6_H - 220, 0, A6_H);
  foot.addColorStop(0, shade(opts.accent, 0.62)); foot.addColorStop(1, shade(opts.accent, 0.4));
  ctx.fillStyle = foot; ctx.fillRect(0, A6_H - 220, A6_W, 220);
  ctx.fillStyle = "rgba(255,255,255,.09)";
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((i * 173) % A6_W, (i * 97) % 520, 6 + (i % 4) * 4, 0, Math.PI * 2); ctx.fill(); }

  ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const logo = opts.logoSrc ? await loadImage(opts.logoSrc) : null;
  if (logo) { const h = 130, w = (logo.width / logo.height) * h; ctx.drawImage(logo, (A6_W - w) / 2, 46, w, h); }
  ctx.fillStyle = "#ffffff"; ctx.font = font(900, 74);
  const titleLines = wrapLines(ctx, text.title, A6_W - 150, 2);
  titleLines.forEach((line, index) => ctx.fillText(line, A6_W / 2, (logo ? 300 : 220) + index * 88));
  ctx.fillStyle = "#ffe066"; ctx.font = font(900, 62);
  ctx.fillText(`${text.action} ⬇`, A6_W / 2, (logo ? 300 : 220) + titleLines.length * 88 + 30);

  // إطار QR
  const qrSide = 660, qx = (A6_W - qrSide) / 2, qy = 820;
  round(qx - 30, qy - 30, qrSide + 60, qrSide + 60, 46, "#ffffff", opts.accent, 12);
  drawQr(ctx, opts.url, qx, qy, qrSide, shade(opts.accent, 0.5), "#ffffff", 1);

  ctx.fillStyle = "#0b2f55"; ctx.font = font(800, 38);
  ctx.fillText(text.sub, A6_W / 2, qy + qrSide + 100);
  ctx.fillStyle = "#4b6584"; ctx.font = font(700, 30);
  ctx.fillText(text.hint, A6_W / 2, qy + qrSide + 155);

  ctx.fillStyle = "#ffffff"; ctx.font = font(900, 40); ctx.fillText(opts.siteName, A6_W / 2, A6_H - 145);
  ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = font(700, 32); ctx.direction = "ltr"; ctx.fillText(opts.siteHost, A6_W / 2, A6_H - 80); ctx.direction = "rtl";

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("تعذر إنشاء الصورة."))), "image/png"));
}

export type SectionStickerOption = { id: string; name: string; accent: string; count?: number };

/**
 * ملصق QR لكل قسم من أقسام الدليل (للطباعة):
 * تختار القسم → يتولّد ملصق A6 بلون القسم واسمه، والكود يفتح صفحة القسم نفسها.
 */
export default function SectionStickerModal({ sections, siteName, onClose }: { sections: SectionStickerOption[]; siteName: string; onClose: () => void }) {
  const [selected, setSelected] = useState(sections[0]?.id ?? "");
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  const host = origin.replace(/^https?:\/\//, "");
  const current = useMemo(() => sections.find((item) => item.id === selected) ?? sections[0], [sections, selected]);
  const target = current ? sectionStickerUrl(origin, current.id) : "";
  const fileName = sectionStickerFileName(current?.name ?? "قسم");

  useEffect(() => {
    if (!current) return;
    let revoked = false; let objectUrl = "";
    renderSectionSticker({ name: current.name, url: target, accent: current.accent, siteName, siteHost: host, logoSrc: "/images/logo-daleel-transparent.png" })
      .then((blob) => { if (revoked) return; objectUrl = URL.createObjectURL(blob); setPreview({ id: current.id, url: objectUrl }); })
      .catch(() => { if (!revoked) setError("تعذر إنشاء الملصق على هذا المتصفح. جرّب متصفحًا آخر."); });
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [current, target, siteName, host]);
  // المعاينة تخص القسم المختار بس — أثناء توليد قسم جديد نعرض «جارٍ التجهيز».
  const url = preview && preview.id === current?.id ? preview.url : "";
  const busy = !url && !error;

  async function share() {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: fileName }); return; }
    } catch { /* المستخدم أغلق المشاركة */ }
    download();
  }
  function download() {
    const a = document.createElement("a"); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  }
  function print() {
    const win = window.open("", "_blank", "noopener,width=720,height=960");
    if (!win) { download(); return; }
    win.document.write(`<!doctype html><html dir="rtl"><head><title>${fileName}</title><style>@page{size:A6;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:105mm;height:148mm}</style></head><body><img src="${url}" alt="ملصق QR للقسم" onload="setTimeout(function(){window.print()},150)"/></body></html>`);
    win.document.close();
  }

  return (
    <Modal floating title="ملصق QR لكل قسم (A6)" subtitle="اختار القسم → طبّع الملصق وعلّقه في المكان — الزبون يمسحه ويوصل لكل الأرقام" onClose={onClose}>
      <div className="rating-sticker-body">
        <div className="section-sticker-chips" role="group" aria-label="اختيار القسم">
          {sections.map((item) => (
            <button key={item.id} type="button" className={`section-sticker-chip${item.id === current?.id ? " is-active" : ""}`} style={{ "--chip": item.accent } as React.CSSProperties} onClick={() => { setSelected(item.id); setError(""); }} aria-pressed={item.id === current?.id}>
              {item.name}{typeof item.count === "number" ? <span>{item.count}</span> : null}
            </button>
          ))}
        </div>
        {busy && <p className="rating-sticker-wait"><LoaderCircle size={18} className="spin"/> جارٍ تجهيز الملصق…</p>}
        {error && <p className="form-error">{error}</p>}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- معاينة لصورة مولّدة محليًا
          <img key={url} src={url} alt={fileName} className="rating-sticker-preview"/>
        )}
        <div className="rating-sticker-actions">
          <button type="button" className="button button-primary" onClick={() => void share()} disabled={!url}><Share2 size={16}/> مشاركة / إرسال للمطبعة</button>
          <button type="button" className="button button-soft" onClick={download} disabled={!url}><ImageDown size={16}/> تنزيل PNG</button>
          <button type="button" className="button button-soft" onClick={print} disabled={!url}><Printer size={16}/> طباعة A6</button>
        </div>
        <p className="rating-sticker-hint">الكود ثابت على صفحة القسم، فأي إضافة جديدة للمهنيين تظهر للزبون تلقائيًا بدون ما تعيد طباعة.</p>
      </div>
    </Modal>
  );
}

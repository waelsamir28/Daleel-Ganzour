"use client";

import { useEffect, useState } from "react";
import { ImageDown, LoaderCircle, Printer, Share2, Star } from "lucide-react";
import { Modal } from "@/components/ui";
import { drawQr } from "@/components/qr-svg";

/** مقاس A6 بدقة 300 نقطة/بوصة (105×148 مم). */
const A6_W = 1240, A6_H = 1748;

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** يلفّ نصًا عربيًا على أسطر بحسب العرض المتاح. */
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
  if (lines.length === maxLines && ctx.measureText(lines[maxLines - 1]).width > maxWidth) lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, 18)}…`;
  return lines;
}

/** يرسم ملصق «امسح لتقييمنا على دليل جنزور» بمقاس A6 ويرجع صورة PNG. */
export async function renderRatingSticker(opts: { name: string; category: string; url: string; siteName: string; siteHost: string; logoSrc?: string }): Promise<Blob> {
  const canvas = document.createElement("canvas"); canvas.width = A6_W; canvas.height = A6_H;
  const ctx = canvas.getContext("2d")!;
  try { await document.fonts.ready; await document.fonts.load("900 80px Cairo"); } catch { /* ignore */ }
  const font = (weight: number, size: number) => `${weight} ${size}px Cairo, "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif`;
  const round = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 0) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } };
  // الخلفية: أبيض مع رأس وذيل بتدرّج أزرق
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, A6_W, A6_H);
  const grad = ctx.createLinearGradient(0, 0, A6_W, 520); grad.addColorStop(0, "#0d8ee0"); grad.addColorStop(1, "#0b4a93");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, A6_W, 520);
  ctx.beginPath(); ctx.ellipse(A6_W / 2, 520, A6_W * 0.72, 70, 0, 0, Math.PI); ctx.fillStyle = "#ffffff"; ctx.fill();
  const foot = ctx.createLinearGradient(0, A6_H - 230, 0, A6_H); foot.addColorStop(0, "#0b4a93"); foot.addColorStop(1, "#072f61");
  ctx.fillStyle = foot; ctx.fillRect(0, A6_H - 230, A6_W, 230);
  // زخرفة نقاط خفيفة
  ctx.fillStyle = "rgba(255,255,255,.08)";
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((i * 173) % A6_W, (i * 97) % 480, 6 + (i % 4) * 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  // الشعار
  const logo = opts.logoSrc ? await loadImage(opts.logoSrc) : null;
  if (logo) { const h = 150, w = (logo.width / logo.height) * h; ctx.drawImage(logo, (A6_W - w) / 2, 50, w, h); }
  // العنوان
  ctx.fillStyle = "#ffffff"; ctx.font = font(900, 86); ctx.fillText("امسح لتقييمنا", A6_W / 2, logo ? 290 : 200);
  ctx.fillStyle = "#ffe066"; ctx.font = font(900, 54); ctx.fillText(`على ${opts.siteName}`, A6_W / 2, logo ? 385 : 300);
  // النجوم
  const starY = 470; ctx.font = font(900, 60); ctx.fillStyle = "#ffcc33";
  ctx.fillText("★ ★ ★ ★ ★", A6_W / 2, starY);
  // اسم المحل
  ctx.fillStyle = "#0b2f55"; ctx.font = font(900, 70);
  const nameLines = wrapLines(ctx, opts.name, A6_W - 160, 2);
  nameLines.forEach((line, index) => ctx.fillText(line, A6_W / 2, 650 + index * 84));
  ctx.fillStyle = "#4b6584"; ctx.font = font(800, 38); ctx.fillText(opts.category, A6_W / 2, 650 + nameLines.length * 84 + 10);
  // إطار QR
  const qrSide = 640, qx = (A6_W - qrSide) / 2, qy = 860;
  round(qx - 28, qy - 28, qrSide + 56, qrSide + 56, 44, "#ffffff", "#0d8ee0", 10);
  drawQr(ctx, opts.url, qx, qy, qrSide, "#0b2f55", "#ffffff", 1);
  // تعليمات
  ctx.fillStyle = "#0b2f55"; ctx.font = font(800, 36);
  ctx.fillText("افتح الكاميرا ووجّهها للرمز، ثم اضغط «قيّم الخدمة»", A6_W / 2, qy + qrSide + 95);
  ctx.fillStyle = "#4b6584"; ctx.font = font(700, 30);
  ctx.fillText("رأيك يساعد جيرانك على اختيار الأفضل", A6_W / 2, qy + qrSide + 150);
  // الذيل
  ctx.fillStyle = "#ffffff"; ctx.font = font(900, 40); ctx.fillText("دليل المهن والخدمات بقرية جنزور", A6_W / 2, A6_H - 150);
  ctx.fillStyle = "#cfe6ff"; ctx.font = font(700, 32); ctx.direction = "ltr"; ctx.fillText(opts.siteHost, A6_W / 2, A6_H - 85); ctx.direction = "rtl";
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("تعذر إنشاء الصورة."))), "image/png"));
}

export default function RatingStickerModal({ name, category, serviceId, siteName, onClose }: { name: string; category: string; serviceId: string; siteName: string; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  const host = origin.replace(/^https?:\/\//, "");
  const rateUrl = `${origin}/?service=${encodeURIComponent(serviceId)}&rate=1`;
  const fileName = `ملصق-تقييم-${name.replace(/[\\/:*?"<>|]+/g, " ").trim()}.png`;

  useEffect(() => {
    let revoked = false; let objectUrl = "";
    renderRatingSticker({ name, category, url: rateUrl, siteName, siteHost: host, logoSrc: "/images/logo-daleel-transparent.png" })
      .then((blob) => { if (revoked) return; objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); setError(""); })
      .catch(() => { if (!revoked) setError("تعذر إنشاء الملصق على هذا المتصفح. جرّب متصفحًا آخر."); })
      .finally(() => { if (!revoked) setBusy(false); });
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [name, category, rateUrl, siteName, host]);

  async function share() {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `ملصق تقييم ${name}` }); return; }
    } catch { /* المستخدم أغلق المشاركة */ }
    download();
  }
  function download() {
    const a = document.createElement("a"); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  }
  function print() {
    const win = window.open("", "_blank", "noopener,width=720,height=960");
    if (!win) { download(); return; }
    win.document.write(`<!doctype html><html dir="rtl"><head><title>ملصق تقييم ${name}</title><style>@page{size:A6;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:105mm;height:148mm}</style></head><body><img src="${url}" alt="ملصق التقييم" onload="setTimeout(function(){window.print()},150)"/></body></html>`);
    win.document.close();
  }

  return (
    <Modal floating title="ملصق QR للتقييم (A6)" subtitle="اطبعه وعلّقه على الكاشير أو الباب — العميل يمسحه ويقيّمك مباشرة" onClose={onClose}>
      <div className="rating-sticker-body">
        {busy && <p className="rating-sticker-wait"><LoaderCircle size={18} className="spin"/> جارٍ تجهيز الملصق…</p>}
        {error && <p className="form-error">{error}</p>}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- معاينة لصورة مولّدة محليًا
          <img src={url} alt={`ملصق تقييم ${name}`} className="rating-sticker-preview"/>
        )}
        <div className="rating-sticker-actions">
          <button type="button" className="button button-primary" onClick={() => void share()} disabled={!url}><Share2 size={16}/> مشاركة / إرسال للمطبعة</button>
          <button type="button" className="button button-soft" onClick={download} disabled={!url}><ImageDown size={16}/> تنزيل PNG</button>
          <button type="button" className="button button-soft" onClick={print} disabled={!url}><Printer size={16}/> طباعة A6</button>
        </div>
        <p className="rating-sticker-hint"><Star size={14}/> الرمز يفتح بطاقتك على نافذة التقييم مباشرة، ويعمل حتى لو غيّرت بياناتك لاحقًا.</p>
      </div>
    </Modal>
  );
}

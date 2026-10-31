"use client";

import { useEffect, useState } from "react";
import { ImageDown, LoaderCircle, MessageCircle, Printer, Share2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { drawQr } from "@/components/qr-svg";
import {
  SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, cardAccent, shareCardCaption, shareCardFacts, shareCardFileName,
  shareCardPhones, type ShareCardData,
} from "@/lib/share-card";

/**
 * كارت المهني كصورة (1080×1350): شعار الدليل + الاسم + التخصص + المنطقة + الأرقام + QR لصفحته.
 * يُرسم كاملًا على Canvas داخل المتصفح (بدون أي خدمة خارجية) ثم يمكن:
 * حفظه على الموبايل، إرساله على واتساب كصورة، أو طباعته.
 */

const W = SHARE_CARD_WIDTH;
const H = SHARE_CARD_HEIGHT;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** يلفّ النص العربي على أسطر بحسب عرض الكارت. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
    let last = lines[maxLines - 1];
    while (last.length > 4 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trim()}…`;
  }
  return lines;
}

/** يرسم كارت المهني ويرجّع صورة PNG جاهزة للحفظ والمشاركة. */
export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  try { await document.fonts.ready; await document.fonts.load("900 64px Cairo"); } catch { /* الخط قد يكون محفوظًا مسبقًا */ }

  const font = (weight: number, size: number) => `${weight} ${size}px Cairo, "Segoe UI", Tahoma, sans-serif`;
  const accent = cardAccent(data.accent);
  const round = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 0) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };

  // الخلفية الهادئة
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#f4f8fd"); bg.addColorStop(1, "#e8f1fa");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(11, 95, 158, .06)";
  ctx.beginPath(); ctx.arc(-60, 120, 240, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W + 40, H - 120, 260, 0, Math.PI * 2); ctx.fill();

  // الرأس: الشعار + اسم الدليل
  const logo = await loadImage(data.logoUrl || "/images/logo-daleel-transparent.png");
  if (logo) {
    const h = 118, w = (logo.width / logo.height) * h;
    ctx.drawImage(logo, (W - w) / 2, 26, w, h);
  }
  ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#12344f"; ctx.font = font(900, 26);
  ctx.fillText(data.siteName || "دليل جنزور", W / 2, logo ? 160 : 60);

  // الكارت الأبيض
  const cardX = 56, cardY = 196, cardW = W - 112, cardH = H - 196 - 150;
  round(cardX + 8, cardY + 14, cardW, cardH, 46, "rgba(11, 61, 107, .10)");
  round(cardX, cardY, cardW, cardH, 46, "#ffffff", "#dce9f6", 3);
  // شريط لون القسم أعلى الكارت
  ctx.save();
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 46); ctx.clip();
  const ribbon = ctx.createLinearGradient(cardX + cardW, cardY, cardX, cardY + 22);
  ribbon.addColorStop(0, accent); ribbon.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = accent; ctx.fillRect(cardX, cardY, cardW, 20);
  ctx.restore();

  ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let y = cardY + 92;

  // الصورة الشخصية (دائرة) أو دائرة بالأيقونة الأولى من الاسم
  const photo = data.photoUrl ? await loadImage(data.photoUrl) : null;
  const avatarR = 62;
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, y, avatarR, 0, Math.PI * 2); ctx.clip();
  if (photo) ctx.drawImage(photo, W / 2 - avatarR, y - avatarR, avatarR * 2, avatarR * 2);
  else { ctx.fillStyle = `${accent}1f`; ctx.fillRect(W / 2 - avatarR, y - avatarR, avatarR * 2, avatarR * 2); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(W / 2, y, avatarR, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = accent; ctx.stroke();
  if (!photo) {
    ctx.fillStyle = accent; ctx.font = font(900, 58);
    ctx.fillText((data.name || "").trim().charAt(0) || "؟", W / 2, y + 2);
  }
  y += avatarR + 54;

  // الاسم (حتى سطرين)
  ctx.fillStyle = "#0f2f4d"; ctx.font = font(900, 58);
  const nameLines = wrapLines(ctx, data.name, cardW - 150, 2);
  for (const line of nameLines) { ctx.fillText(line, W / 2, y); y += 68; }

  // شارة «موثّق»
  if (data.verified) {
    ctx.fillStyle = "#eefbf3"; ctx.strokeStyle = "#b7e8cd"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(W / 2 - 96, y - 6, 192, 46, 23); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#0a8f54"; ctx.font = font(900, 24);
    ctx.fillText("بيانات موثّقة", W / 2 + 16, y + 18);
    // علامة صح مرسومة (رمز ✓ غير موجود في خط Cairo)
    ctx.strokeStyle = "#0a8f54"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(W / 2 - 62, y + 18); ctx.lineTo(W / 2 - 56, y + 24); ctx.lineTo(W / 2 - 44, y + 10);
    ctx.stroke();
    y += 62;
  }

  // التخصص + المنطقة
  ctx.fillStyle = accent; ctx.font = font(800, 34);
  const headLines = wrapLines(ctx, data.headline, cardW - 150, 2);
  for (const line of headLines) { ctx.fillText(line, W / 2, y); y += 44; }
  y += 10;

  // سطور المعلومات (أرقام / منطقة / تقييم) كشرائح — بحد أقصى المساحة المتاحة فوق رمز QR
  const qrSide = 300;
  const qrTop = cardY + cardH - qrSide - 150;
  for (const fact of shareCardFacts(data)) {
    const boxH = fact.ltr ? 96 : 78;
    if (y + boxH > qrTop) break;
    round(cardX + 46, y, cardW - 92, boxH, 24, "#f7fbff", "#e3eef9", 2);
    ctx.textAlign = "right"; ctx.direction = "rtl";
    ctx.fillStyle = "#7b90a6"; ctx.font = font(700, 23);
    ctx.fillText(fact.label, cardX + cardW - 74, y + 26);
    ctx.fillStyle = "#12344f"; ctx.font = font(900, fact.ltr ? 40 : 30);
    ctx.direction = fact.ltr ? "ltr" : "rtl"; ctx.textAlign = fact.ltr ? "center" : "right";
    const valueX = fact.ltr ? W / 2 : cardX + cardW - 74;
    ctx.fillText(fact.value, valueX, y + (fact.ltr ? 64 : 52));
    ctx.direction = "rtl"; ctx.textAlign = "center";
    y += boxH + 16;
  }

  // رمز QR — دائمًا أسفل الكارت في مساحة محفوظة
  const qrY = Math.max(y + 16, cardY + cardH - qrSide - 118);
  const qx = (W - qrSide) / 2;
  round(qx - 18, qrY - 18, qrSide + 36, qrSide + 36, 26, "#ffffff", accent, 4);
  drawQr(ctx, data.url, qx, qrY, qrSide, "#0b2f55", "#ffffff", 2);
  ctx.fillStyle = "#0f2f4d"; ctx.font = font(900, 28);
  ctx.fillText("امسح الكود لفتح الصفحة على أي موبايل", W / 2, qrY + qrSide + 46);
  ctx.fillStyle = "#6b8298"; ctx.font = font(700, 22);
  const host = data.url.replace(/^https?:\/\//, "");
  ctx.direction = "ltr"; ctx.fillText(host.slice(0, 46), W / 2, qrY + qrSide + 80); ctx.direction = "rtl";

  // التذييل
  ctx.textAlign = "center"; ctx.direction = "rtl";
  ctx.fillStyle = "#12344f"; ctx.font = font(900, 30);
  ctx.fillText("دليل المهن والخدمات بقرية جنزور", W / 2, H - 106);
  ctx.fillStyle = "#6b8298"; ctx.font = font(700, 24);
  ctx.fillText(data.officePhone ? `مكتب الجمال للدعاية والإعلان • ${data.officePhone}` : "مكتب الجمال للدعاية والإعلان", W / 2, H - 68);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("تعذر إنشاء الصورة."))), "image/png"));
}

export default function ShareCardModal({ data, onClose }: { data: ShareCardData; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const fileName = shareCardFileName(data.name);

  useEffect(() => {
    let revoked = false;
    let objectUrl = "";
    renderShareCard(data)
      .then((blob) => { if (revoked) return; objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); setError(""); })
      .catch(() => { if (!revoked) setError("تعذر تجهيز الكارت على هذا المتصفح. جرّب متصفحًا آخر أو أعد تحميل الصفحة."); })
      .finally(() => { if (!revoked) setBusy(false); });
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // الكارت يُرسم مرة واحدة عند الفتح؛ تغيير البيانات يفتح نافذة جديدة.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function download() {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url; link.download = fileName;
    document.body.appendChild(link); link.click(); link.remove();
  }

  async function share() {
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `كارت ${data.name}`, text: shareCardCaption(data) });
        return;
      }
    } catch { /* المستخدم أغلق نافذة المشاركة */ }
    download();
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareCardCaption(data))}`, "_blank", "noopener,noreferrer");
  }

  function print() {
    if (!url) return;
    const win = window.open("", "_blank", "noopener,width=760,height=1000");
    if (!win) { download(); return; }
    win.document.write(`<!doctype html><html dir="rtl"><head><title>كارت ${data.name}</title><style>@page{size:A5;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:148mm;margin:0 auto}</style></head><body><img src="${url}" alt="كارت ${data.name}" onload="setTimeout(function(){window.print()},160)"/></body></html>`);
    win.document.close();
  }

  return (
    <Modal floating className="modal-quiet-scroll" title="كارت المهني كصورة" subtitle={`${data.name}${data.headline ? ` • ${data.headline}` : ""}`} onClose={onClose}>
      <div className="share-card-body">
        {busy && <p className="share-card-wait"><LoaderCircle size={18} className="spin"/> بنجهّز الكارت…</p>}
        {error && <p className="form-error">{error}</p>}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- معاينة لصورة مولّدة محليًا على المتصفح
          <img src={url} alt={`كارت ${data.name}`} className="share-card-preview"/>
        )}
        <div className="share-card-actions">
          <button type="button" className="button button-primary" onClick={() => void share()} disabled={!url}><Share2 size={16}/> مشاركة كصورة</button>
          <button type="button" className="button button-soft" onClick={download} disabled={!url}><ImageDown size={16}/> حفظ على الجهاز</button>
          <button type="button" className="button button-whatsapp" onClick={whatsapp}><MessageCircle size={16}/> نص على واتساب</button>
          <button type="button" className="button button-soft" onClick={print} disabled={!url}><Printer size={16}/> طباعة</button>
        </div>
        <p className="share-card-hint">
          الكارت فيه رمز QR لصفحتك على الدليل — أي حد يمسحه يوصلك على طول. لو زر «مشاركة كصورة» مش ظاهر على جهازك،
          استخدم «حفظ على الجهاز» وبعدها ابعتها من واتساب بنفسك.
        </p>
      </div>
    </Modal>
  );
}

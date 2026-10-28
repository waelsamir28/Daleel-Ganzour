/** عناصر التصميم المشتركة لصور المشاركة (خلفية، نصوص، كبسولة الرابط، شارة، بطاقة الباركود). */
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const QRCode = require("qrcode");
const fs = require("node:fs");
GlobalFonts.registerFromPath(process.env.CAIRO_TTF || "/tmp/fonts/Cairo.ttf", "Cairo");

const LOGO = "docs/brand/logo-option-1.png";
const LOGO_SMALL = "public/images/logo-daleel-transparent.png";
const SITE = "daleel-ganzour.vercel.app", SITE_URL = `https://${SITE}`;
const TITLE_1 = "دليل المهن والخدمات", TITLE_2 = "بقرية جنزور";
const SUB = "كل أرقام المهنيين والصيدليات والمحلات في مكان واحد";
const SUB_1 = "كل أرقام المهنيين والصيدليات", SUB_2 = "والمحلات في مكان واحد";
const BADGE = "مجاناً لأهل القرية", QR_CAPTION = "امسح وافتح الدليل";
const GOLD = "#ffe066", NAVY = "#0b4a93";

function background(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0d8ee0"); g.addColorStop(0.55, "#0765bd"); g.addColorStop(1, "#0d3f7d");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = (x, y, r, color) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, color); rg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); };
  glow(W * 0.82, H * 0.12, W * 0.5, "rgba(255,255,255,0.22)");
  glow(W * 0.08, H * 0.92, W * 0.4, "rgba(120,200,255,0.16)");
  // شعاع ضوء قطري ناعم
  const sweep = ctx.createLinearGradient(0, 0, W, H);
  sweep.addColorStop(0.35, "rgba(255,255,255,0)"); sweep.addColorStop(0.5, "rgba(255,255,255,0.07)"); sweep.addColorStop(0.65, "rgba(255,255,255,0)");
  ctx.fillStyle = sweep; ctx.fillRect(0, 0, W, H);
  // شبكة نقاط خفيفة
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 12; y < H; y += 36) for (let x = 12; x < W; x += 36) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); }
  // إطار داخلي رفيع ذهبي/أبيض يعطي لمسة احترافية
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(18, 18, W - 36, H - 36, 28); ctx.stroke();
  ctx.strokeStyle = "rgba(255,224,102,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(24, 24, W - 48, H - 48, 24); ctx.stroke();
  // زوايا ذهبية
  ctx.strokeStyle = "rgba(255,224,102,0.9)"; ctx.lineWidth = 3; ctx.lineCap = "round";
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x + dx * 34, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * 34); ctx.stroke(); };
  corner(40, 40, 1, 1); corner(W - 40, 40, -1, 1); corner(40, H - 40, 1, -1); corner(W - 40, H - 40, -1, -1);
}
function roundRect(ctx, x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); } }
function fitFont(ctx, str, weight, size, maxW) {
  for (let px = size; px >= 18; px -= 2) { ctx.font = `${weight} ${px}px Cairo`; if (ctx.measureText(str).width <= maxW) return ctx.font; }
  return `${weight} 18px Cairo`;
}
function text(ctx, str, x, y, font, color, align = "right", shadow = true, maxW = 0) {
  if (maxW) { const [weight, px] = font.split(" "); font = fitFont(ctx, str, weight, parseInt(px, 10), maxW); }
  ctx.font = font; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.direction = "rtl";
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  return ctx.measureText(str).width;
}
async function drawLogo(ctx, boxW, boxH, cx, cy) {
  const img = await loadImage(LOGO);
  const s = Math.min(boxW / img.width, boxH / img.height); const w = img.width * s, h = img.height * s;
  // هالة ناعمة خلف اللوجو
  const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.62);
  rg.addColorStop(0, "rgba(255,255,255,0.18)"); rg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rg; ctx.fillRect(cx - w, cy - h, w * 2, h * 2);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
}
function urlPill(ctx, right, y, h, centered = false) {
  ctx.font = "800 27px Cairo"; ctx.direction = "ltr"; const w = ctx.measureText(SITE).width;
  const pillW = w + 96; const x = centered ? right - pillW / 2 : right - pillW;
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, pillW, h, h / 2, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath(); ctx.arc(x + pillW - h / 2, y + h / 2, h / 2 - 11, 0, Math.PI * 2); ctx.fillStyle = "#0a6fc2"; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "900 24px Cairo"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("↗", x + pillW - h / 2, y + h / 2 + 1);
  ctx.font = "800 27px Cairo"; ctx.fillStyle = NAVY; ctx.textAlign = "left"; ctx.fillText(SITE, x + 26, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic"; ctx.direction = "rtl";
  return { x, w: pillW };
}
function badge(ctx, right, y, centered = false) {
  ctx.font = "800 24px Cairo"; ctx.direction = "rtl"; const w = ctx.measureText(BADGE).width + 60;
  const x = centered ? right - w / 2 : right - w;
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, 50, 25, "#10b981"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath(); ctx.arc(x + w - 25, y + 25, 7, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(BADGE, x + w - 42, y + 26); ctx.textBaseline = "alphabetic";
  return { x, w };
}
async function qrCard(ctx, x, y, size) {
  // بطاقة بيضاء بزوايا دائرية + باركود يفتح الموقع + تعليق
  const pad = 14, capH = 34;
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  roundRect(ctx, x, y, size + pad * 2, size + pad * 2 + capH, 22, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const qr = await QRCode.toBuffer(SITE_URL, { errorCorrectionLevel: "H", margin: 0, width: size * 2, color: { dark: NAVY, light: "#ffffff" } });
  const img = await loadImage(qr); ctx.drawImage(img, x + pad, y + pad, size, size);
  ctx.fillStyle = NAVY; ctx.font = "800 17px Cairo"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl"; ctx.fillText(QR_CAPTION, x + pad + size / 2, y + pad + size + capH / 2 + 4); ctx.textBaseline = "alphabetic";
  return { w: size + pad * 2, h: size + pad * 2 + capH };
}


module.exports = { createCanvas, loadImage, LOGO, LOGO_SMALL, SITE, SITE_URL, TITLE_1, TITLE_2, SUB, SUB_1, SUB_2, BADGE, GOLD, NAVY, background, roundRect, fitFont, text, drawLogo, urlPill, badge, qrCard, fs };

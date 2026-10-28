/**
 * توليد صور معاينة الرابط (Open Graph) لدليل جنزور: عريضة 1200×630 (فيسبوك/واتساب/تويتر) ومربعة 1080×1080.
 * التشغيل:  npm i --no-save @napi-rs/canvas && node scripts/make-og-images.cjs
 * يحتاج خط Cairo المتغيّر في /tmp/fonts/Cairo.ttf (https://github.com/google/fonts/tree/main/ofl/cairo).
 * اللوجو: docs/brand/logo-option-1.png (نسخة شفافة من اللوجو الذي أرسله المدير).
 */
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("node:fs");
GlobalFonts.registerFromPath(process.env.CAIRO_TTF || "/tmp/fonts/Cairo.ttf", "Cairo");

const LOGO = "docs/brand/logo-option-1.png";
const SITE = "daleel-ganzour.vercel.app";
const TITLE_1 = "دليل المهن والخدمات", TITLE_2 = "بقرية جنزور";
const SUB = "كل أرقام المهنيين والصيدليات والمحلات في مكان واحد";
const SUB_1 = "كل أرقام المهنيين والصيدليات", SUB_2 = "والمحلات في مكان واحد";
const BADGE = "مجاناً لأهل القرية", FOOT = "ابحث واتصل بضغطة واحدة";

function background(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a87d7"); g.addColorStop(0.58, "#0765bd"); g.addColorStop(1, "#104c91");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = (x, y, r, color) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, color); rg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); };
  glow(W * 0.85, H * 0.1, W * 0.55, "rgba(255,255,255,0.20)");
  glow(W * 0.05, H * 0.95, W * 0.45, "rgba(120,200,255,0.18)");
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  for (let y = 12; y < H; y += 36) for (let x = 12; x < W; x += 36) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
}
function roundRect(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
/** يصغّر حجم الخط تلقائيًا حتى يدخل النص في العرض المتاح. */
function fitFont(ctx, str, weight, size, maxW) {
  for (let px = size; px >= 18; px -= 2) { ctx.font = `${weight} ${px}px Cairo`; if (ctx.measureText(str).width <= maxW) return ctx.font; }
  return `${weight} 18px Cairo`;
}
function text(ctx, str, x, y, font, color, align = "right", shadow = true, maxW = 0) {
  if (maxW) { const [weight, px] = font.split(" "); font = fitFont(ctx, str, weight, parseInt(px, 10), maxW); }
  ctx.font = font; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.direction = "rtl";
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  return ctx.measureText(str).width;
}
async function drawLogo(ctx, boxW, boxH, cx, cy) {
  const img = await loadImage(LOGO);
  const s = Math.min(boxW / img.width, boxH / img.height); const w = img.width * s, h = img.height * s;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 18;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
}
function urlPill(ctx, right, y, h, centered = false) {
  ctx.font = "800 34px Cairo"; ctx.direction = "ltr"; const w = ctx.measureText(SITE).width;
  const pillW = w + 112; const x = centered ? right - pillW / 2 : right - pillW;
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, pillW, h, h / 2, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath(); ctx.arc(x + pillW - h / 2, y + h / 2, h / 2 - 12, 0, Math.PI * 2); ctx.fillStyle = "#0a6fc2"; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "900 26px Cairo"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("↗", x + pillW - h / 2, y + h / 2 + 1);
  ctx.font = "800 34px Cairo"; ctx.fillStyle = "#0b4a93"; ctx.textAlign = "left"; ctx.fillText(SITE, x + 30, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
}
function badge(ctx, right, y, centered = false) {
  ctx.font = "800 26px Cairo"; ctx.direction = "rtl"; const w = ctx.measureText(BADGE).width + 48;
  const x = centered ? right - w / 2 : right - w;
  roundRect(ctx, x, y, w, 54, 27, "#10b981");
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(BADGE, x + w / 2, y + 29); ctx.textBaseline = "alphabetic";
}

async function wide() {
  const W = 1200, H = 630; const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  await drawLogo(ctx, 540, 580, 905, 318);
  const right = 640;
  const maxW = right - 40;
  text(ctx, TITLE_1, right, 126, "900 76px Cairo", "#ffffff", "right", true, maxW);
  text(ctx, TITLE_2, right, 214, "900 76px Cairo", "#ffe066", "right", true, maxW);
  roundRect(ctx, right - 250, 230, 250, 8, 4, "rgba(255,224,102,0.9)");
  text(ctx, SUB_1, right, 292, "700 30px Cairo", "#e2f0ff", "right", true, maxW);
  text(ctx, SUB_2, right, 336, "700 30px Cairo", "#e2f0ff", "right", true, maxW);
  badge(ctx, right, 364);
  urlPill(ctx, right, 452, 72);
  text(ctx, FOOT, right, 584, "700 24px Cairo", "#bedcff");
  fs.writeFileSync("public/images/og-cover.jpg", c.toBuffer("image/jpeg", 90));
}
async function square() {
  const W = 1080, H = 1080; const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  await drawLogo(ctx, 600, 580, 540, 322);
  const cx = 540;
  text(ctx, TITLE_1, cx, 700, "900 74px Cairo", "#ffffff", "center", true, W - 80);
  text(ctx, TITLE_2, cx, 788, "900 74px Cairo", "#ffe066", "center", true, W - 80);
  roundRect(ctx, cx - 120, 806, 240, 8, 4, "rgba(255,224,102,0.9)");
  text(ctx, SUB, cx, 868, "700 30px Cairo", "#e2f0ff", "center", true, W - 80);
  badge(ctx, cx, 892, true);
  urlPill(ctx, cx, 972, 72, true);
  fs.writeFileSync("public/images/og-square.jpg", c.toBuffer("image/jpeg", 90));
}
(async () => { await wide(); await square(); console.log("done"); })();

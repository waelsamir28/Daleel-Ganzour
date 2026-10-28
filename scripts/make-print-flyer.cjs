/**
 * منشور للطباعة بمقاس A5 (148×210 مم) بدقة 300 نقطة/بوصة = 1748×2480 بكسل، بنفس هوية صور المشاركة.
 * التشغيل: node scripts/make-print-flyer.cjs  → public/images/print/daleel-ganzour-a5.jpg (+ .png)
 */
const { createCanvas, loadImage, LOGO, SITE, SITE_URL, GOLD, NAVY, background, roundRect, text, fs } = require("./og-style.cjs");
const QRCode = require("qrcode");
const OFFICE_PHONE = "01222355769";
const WA_URL = `https://wa.me/2${OFFICE_PHONE}?text=${encodeURIComponent("أريد إضافة مهنتي في دليل جنزور")}`;
const W = 1748, H = 2480;
const STICKERS = ["pharmacies", "electricity", "clinics", "groceries", "plumbing", "teachers", "barbers", "food"];

async function qrBlock(ctx, cx, y, size, url, caption, captionSize) {
  const pad = Math.round(size * 0.1), capH = Math.round(captionSize * 2.1);
  const w = size + pad * 2, h = size + pad * 2 + capH, x = cx - w / 2;
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  roundRect(ctx, x, y, w, h, Math.round(size * 0.12), "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const qr = await loadImage(await QRCode.toBuffer(url, { errorCorrectionLevel: "H", margin: 0, width: size * 2, color: { dark: NAVY, light: "#ffffff" } }));
  ctx.drawImage(qr, x + pad, y + pad, size, size);
  ctx.fillStyle = NAVY; ctx.font = `800 ${captionSize}px Cairo`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
  ctx.fillText(caption, cx, y + pad + size + capH / 2 + 2); ctx.textBaseline = "alphabetic";
  return h;
}

(async () => {
  const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  // اللوجو
  const logo = await loadImage(LOGO);
  const lw = 640, lh = lw * logo.height / logo.width;
  const rg = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620); rg.addColorStop(0, "rgba(255,255,255,0.2)"); rg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 1200);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30; ctx.drawImage(logo, (W - lw) / 2, 90, lw, lh); ctx.restore();
  let y = 90 + lh + 100;
  text(ctx, "دليل المهن والخدمات", W / 2, y, "900 104px Cairo", "#ffffff", "center", true, W - 200); y += 116;
  text(ctx, "بقرية جنزور", W / 2, y, "900 104px Cairo", GOLD, "center", true, W - 200); y += 86;
  text(ctx, "كل أرقام المهنيين والصيدليات والمحلات والعيادات في مكان واحد", W / 2, y, "700 42px Cairo", "#e2f0ff", "center", true, W - 200); y += 60;
  // شريط ملصقات الأقسام
  const n = STICKERS.length, s = 136, gap = 24, total = n * s + (n - 1) * gap; let sx = (W - total) / 2;
  for (const id of STICKERS) {
    try { const img = await loadImage(`public/images/specialty-stickers/${id}.webp`); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; roundRect(ctx, sx, y, s, s, 34, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.drawImage(img, sx + 10, y + 10, s - 20, s - 20); } catch { /* ملصق غير موجود */ }
    sx += s + gap;
  }
  y += s + 70;
  // باركود كبير للموقع
  const qrH = await qrBlock(ctx, W / 2, y, 370, SITE_URL, "امسح الباركود وافتح الدليل", 34);
  // الرابط
  y += qrH + 44;
  ctx.font = "800 54px Cairo"; ctx.direction = "ltr"; const uw = ctx.measureText(SITE).width + 180; const ux = (W - uw) / 2;
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; roundRect(ctx, ux, y, uw, 100, 50, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = NAVY; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(SITE, W / 2, y + 52); ctx.textBaseline = "alphabetic"; ctx.direction = "rtl";
  y += 100 + 54;
  // صف: شارة مجانًا + واتساب الإدارة + باركود واتساب صغير
  ctx.font = "800 40px Cairo"; const bText = "الإضافة مجانًا لأهل القرية"; const bw = ctx.measureText(bText).width + 100;
  roundRect(ctx, W - 120 - bw, y, bw, 84, 42, "#10b981"); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(bText, W - 120 - bw / 2, y + 44);
  text(ctx, "لإضافة مهنتك أو محلك — واتساب:", W - 120, y + 156, "700 40px Cairo", "#e2f0ff", "right");
  ctx.font = "900 74px Cairo"; ctx.direction = "ltr"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = GOLD; ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillText(OFFICE_PHONE, W - 120, y + 246); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.direction = "rtl";
  await qrBlock(ctx, 120 + 140, y, 210, WA_URL, "راسلنا واتساب", 26);
  // تذييل
  text(ctx, "ابحث واتصل بضغطة واحدة — من أهل القرية لأهلها  •  مكتب الجمال للدعاية والإعلان", W / 2, H - 58, "700 28px Cairo", "#bedcff", "center", true, W - 240);
  fs.writeFileSync("public/images/print/daleel-ganzour-a5.jpg", c.toBuffer("image/jpeg", 92));
  fs.writeFileSync("public/images/print/daleel-ganzour-a5.png", c.toBuffer("image/png"));
  console.log("done", W, H);
})();

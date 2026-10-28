/**
 * توليد صور معاينة الرابط (Open Graph) لدليل جنزور: عريضة 1200×630 (فيسبوك/واتساب/تويتر) ومربعة 1080×1080.
 * التشغيل:  npm i --no-save @napi-rs/canvas qrcode && node scripts/make-og-images.cjs
 * يحتاج خط Cairo المتغيّر في /tmp/fonts/Cairo.ttf (https://github.com/google/fonts/tree/main/ofl/cairo).
 * اللوجو: docs/brand/logo-option-1.png (نسخة شفافة من اللوجو الذي أرسله المدير).
 */
const { createCanvas, SITE_URL: _u, TITLE_1, TITLE_2, SUB, SUB_1, SUB_2, GOLD, background, text, drawLogo, urlPill, badge, qrCard, fs } = require("./og-style.cjs");
void _u;

async function wide() {
  const W = 1200, H = 630; const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  await drawLogo(ctx, 520, 560, 915, 315);
  const right = 655, maxW = right - 60;
  text(ctx, TITLE_1, right, 128, "900 74px Cairo", "#ffffff", "right", true, maxW);
  text(ctx, TITLE_2, right, 214, "900 74px Cairo", GOLD, "right", true, maxW);
  text(ctx, SUB_1, right, 282, "700 29px Cairo", "#e2f0ff", "right", true, maxW);
  text(ctx, SUB_2, right, 324, "700 29px Cairo", "#e2f0ff", "right", true, maxW);
  badge(ctx, right, 350);
  urlPill(ctx, right, 426, 62);
  text(ctx, "ابحث واتصل بضغطة واحدة", right, 548, "700 22px Cairo", "#bedcff");
  // الباركود أسفل اليسار
  await qrCard(ctx, 60, 398, 132);
  fs.writeFileSync("public/images/og-cover.jpg", c.toBuffer("image/jpeg", 90));
}
async function square() {
  const W = 1080, H = 1080; const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  await drawLogo(ctx, 580, 560, 540, 318);
  const cx = 540;
  text(ctx, TITLE_1, cx, 690, "900 72px Cairo", "#ffffff", "center", true, W - 120);
  text(ctx, TITLE_2, cx, 776, "900 72px Cairo", GOLD, "center", true, W - 120);
  text(ctx, SUB, cx, 838, "700 29px Cairo", "#e2f0ff", "center", true, W - 120);
  // الصف السفلي: باركود يسارًا، الرابط والشارة يمينًا
  const right = W - 64;
  badge(ctx, right, 876);
  urlPill(ctx, right, 948, 66);
  await qrCard(ctx, 64, 858, 124);
  fs.writeFileSync("public/images/og-square.jpg", c.toBuffer("image/jpeg", 90));
}
(async () => { await wide(); await square(); console.log("done"); })();

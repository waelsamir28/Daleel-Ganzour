/**
 * صور معاينة المشاركة (1200×630) لكل قسم/تخصص له ملصق — بنفس ستايل صورة الرابط الرئيسية.
 * التشغيل: node scripts/make-category-og.cjs /tmp/cats.json   (cats.json = [{id,name,parentId,parentName,color}] من initialCategories)
 */
const { createCanvas, loadImage, LOGO_SMALL, GOLD, background, roundRect, text, urlPill, qrCard, fs } = require("./og-style.cjs");
const cats = JSON.parse(fs.readFileSync(process.argv[2] || "/tmp/cats.json", "utf8"));
const W = 1200, H = 630;

async function build(cat) {
  const c = createCanvas(W, H); const ctx = c.getContext("2d");
  background(ctx, W, H);
  // بلاطة الملصق يمينًا: بطاقة بيضاء بزوايا دائرية وظل، مع هالة بلون القسم
  const tile = 400, tx = W - 90 - tile, ty = (H - tile) / 2 - 10;
  const rg = ctx.createRadialGradient(tx + tile / 2, ty + tile / 2, 20, tx + tile / 2, ty + tile / 2, tile * 0.8);
  rg.addColorStop(0, cat.color + "66"); rg.addColorStop(1, cat.color + "00"); ctx.fillStyle = rg; ctx.fillRect(tx - 200, ty - 200, tile + 400, tile + 400);
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  roundRect(ctx, tx, ty, tile, tile, 64, "#ffffff"); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  roundRect(ctx, tx + 10, ty + 10, tile - 20, tile - 20, 56, cat.color + "22");
  const sticker = await loadImage(`public/images/specialty-stickers/${cat.id}.webp`);
  const inner = tile - 60; ctx.drawImage(sticker, tx + 30, ty + 30, inner, inner);
  // النصوص يسارًا (محاذاة يمين عند حافة العمود)
  const right = tx - 60, maxW = right - 60;
  const parentLabel = cat.parentName ? `قسم ${cat.parentName}` : "قسم رئيسي في الدليل";
  // شارة القسم الأب بلون القسم
  ctx.font = "800 24px Cairo"; ctx.direction = "rtl"; const bw = ctx.measureText(parentLabel).width + 56;
  roundRect(ctx, right - bw, 86, bw, 48, 24, cat.color);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(parentLabel, right - bw / 2, 111); ctx.textBaseline = "alphabetic";
  text(ctx, cat.name, right, 240, "900 92px Cairo", "#ffffff", "right", true, maxW);
  text(ctx, "دليل المهن والخدمات بقرية جنزور", right, 306, "800 32px Cairo", GOLD, "right", true, maxW);
  text(ctx, "الأرقام والعناوين والتواصل المباشر.. بضغطة واحدة", right, 352, "700 25px Cairo", "#e2f0ff", "right", true, maxW);
  urlPill(ctx, right, 404, 62);
  // اللوجو الصغير + سطر ختامي
  const logo = await loadImage(LOGO_SMALL);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.drawImage(logo, right - 92, 486, 92, 92); ctx.restore();
  text(ctx, "ابحث واتصل بضغطة واحدة", right - 108, 544, "700 22px Cairo", "#bedcff");
  await qrCard(ctx, 60, 398, 132);
  fs.writeFileSync(`public/images/og/${cat.id}.jpg`, c.toBuffer("image/jpeg", 88));
}
(async () => { for (const cat of cats) await build(cat); console.log("built", cats.length); })();

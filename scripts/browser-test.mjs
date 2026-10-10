import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Custom dropdowns (SelectField) replace native selects: open the combobox, then click the option by its value.
async function pickValue(page, combobox, value) {
  await combobox.click();
  await page.locator(`[role="option"][data-value="${value}"]`).click();
}
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
// Every full page load paints the splash screen for about a second; wait for it to leave the DOM.
async function settle(target) { await expect(target.locator(".splash-screen")).toHaveCount(0, { timeout: 10000 }); }
fs.mkdirSync(".qa", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const guestContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const memberContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await guestContext.newPage(), admin = await adminContext.newPage(), member = await memberContext.newPage();
const errors = []; for (const target of [page, admin, member]) target.on("pageerror", (error) => errors.push(error.message));
const suffix = Date.now().toString(36);
let serviceId, memberId, moderatorId, rootId, specialtyId, savedSettings;
const serviceName = "اختبار واجهة - نجار جنزور";
const memberName = "عضو اختبار الواجهة";
try {
  // Expected counts come from the API so the assertions follow the seeded catalogue instead of hardcoding it.
  const baseline = await (await guestContext.request.get(`${base}/api/services`)).json();
  const rootIds = baseline.categories.filter((category) => !category.parentId).map((category) => category.id);
  const specialtyCount = (root) => baseline.categories.filter((category) => category.parentId === root).length;
  const homeCards = Math.min(4, baseline.services.filter((service) => service.featured).length);
  assert.equal("ads" in baseline, false, "The public directory has no advertising payload any more");
  assert.deepEqual(Object.keys(baseline.settings).filter((key) => /^(ad|marquee)/.test(key)), [], "no advertising settings are published");

  // Splash screen: covers the site while it opens, fades after about a second, then unmounts itself.
  await page.goto(base, { waitUntil: "commit" });
  await expect(page.locator(".splash-screen")).toBeVisible();
  await expect(page.locator(".splash-screen .splash-title")).toHaveText("دليل جنزور");
  await expect(page.locator(".splash-screen .splash-icon")).toHaveText("📍");
  await expect(page.locator(".splash-screen .splash-tagline")).not.toBeEmpty();
  await expect(page.locator(".splash-screen .splash-dots i")).toHaveCount(3);
  const splash = await page.locator(".splash-screen").evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundImage, position: style.position, zIndex: parseInt(style.zIndex, 10) };
  });
  assert.ok(splash.background.includes("gradient"), "the splash uses a navy gradient");
  assert.equal(splash.position, "fixed"); assert.ok(splash.zIndex >= 50, `the splash covers the page, z-index ${splash.zIndex}`);
  await page.screenshot({ path: ".qa/janzour-splash.png" });
  await expect(page.locator(".splash-screen.is-leaving")).toBeVisible({ timeout: 4000 });
  await expect(page.locator(".splash-screen")).toHaveCount(0, { timeout: 4000 });
  console.log("PASS: splash screen appears on open, fades after a second and leaves the DOM");

  await page.goto(base, { waitUntil: "networkidle" });
  await settle(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".main-category-grid .category-tile")).toHaveCount(rootIds.length);
  await expect(page.locator(".provider-card")).toHaveCount(homeCards);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontSize), "15px");
  // Every public advertising surface is gone: carousel, strip, sponsored grid, sidebar card and ad links.
  for (const selector of [".hero-advertisements", ".advertising-strip", ".marquee-track", ".featured-advertisers", ".sidebar-ad", ".home-advertising", ".campaign-card", ".campaign-management", ".admin-ad-row"]) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "الإعلانات", exact: true })).toHaveCount(0);
  await expect(page.locator('.header-inner a[href="/admin"]')).toHaveCount(0);
  await page.screenshot({ path: ".qa/janzour-home-desktop.png", fullPage: true });
  console.log("PASS: home renders the catalogue with no public advertising surface");

  // Card palette: 2px blue frame, red name, blue specialty and address, five gold stars, a 54px
  // category-coloured icon square, favourite above share on the left, and a light-blue call strip.
  const firstCard = page.locator(".provider-card").first();
  const card = await firstCard.evaluate((element) => {
    const rgb = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
    const style = (selector) => getComputedStyle(element.querySelector(selector));
    const box = (selector) => element.querySelector(selector).getBoundingClientRect();
    const icon = style(".provider-card-icon");
    return {
      borderWidth: parseFloat(getComputedStyle(element).borderTopWidth),
      borderColor: rgb(getComputedStyle(element).borderTopColor),
      name: rgb(style(".provider-name").color),
      specialty: rgb(style(".provider-specialty").color),
      address: rgb(style(".provider-address").color),
      iconWidth: box(".provider-card-icon").width, iconHeight: box(".provider-card-icon").height,
      iconGradient: icon.backgroundImage, iconColor: rgb(icon.color),
      stars: element.querySelectorAll(".rating-stars svg").length,
      starsOn: rgb(style(".rating-stars .is-on").color),
      rating: element.querySelector(".provider-rating strong").textContent.trim(),
      strip: rgb(style(".provider-call-strip").backgroundColor),
      number: rgb(style(".provider-call-number").color), numberWeight: parseInt(style(".provider-call-number").fontWeight, 10),
      callLabel: element.querySelector(".provider-call-button").textContent.trim(),
      sideLeftOfCopy: box(".provider-card-side").left < box(".provider-card-copy").left,
      heartAboveShare: box(".favorite-button").top < box(".provider-share-button").top,
      telLinks: element.querySelectorAll('a[href^="tel:"]').length,
    };
  });
  const BLUE = [28, 93, 170], RED = [180, 35, 24], STRIP = [231, 238, 249], GOLD = [245, 166, 35];
  assert.equal(card.borderWidth, 2, "the card frame is 2px wide");
  assert.deepEqual(card.borderColor, BLUE, "the card frame is #1c5daa");
  assert.deepEqual(card.name, RED, "the provider name is #b42318");
  assert.deepEqual(card.specialty, BLUE, "the specialty is blue");
  assert.deepEqual(card.address, BLUE, "the address is blue");
  assert.equal(card.iconWidth, 54); assert.equal(card.iconHeight, 54, "the icon square is 54px");
  assert.ok(card.iconGradient.includes("gradient"), "the icon square uses a category gradient");
  assert.deepEqual(card.iconColor, [255, 255, 255], "the icon glyph is white");
  assert.equal(card.stars, 5, "five stars");
  assert.deepEqual(card.starsOn, GOLD, "the filled stars are gold");
  assert.match(card.rating, /^\d\.\d$|^جديد$/, `the rating shows a number, got ${card.rating}`);
  assert.deepEqual(card.strip, STRIP, "the call strip is #e7eef9");
  assert.deepEqual(card.number, BLUE, "the number is blue");
  assert.ok(card.numberWeight >= 800, `the number is bold, got ${card.numberWeight}`);
  assert.equal(card.callLabel, "اتصال");
  assert.ok(card.sideLeftOfCopy, "the favourite/share column sits on the left");
  assert.ok(card.heartAboveShare, "the heart is above the share button");
  assert.equal(card.telLinks, 0, "the card never dials by itself: calling happens in the details overlay");
  await expect(page.locator(".provider-card .provider-address").first()).toContainText("جنزور");
  await page.screenshot({ path: ".qa/janzour-card-desktop.png" });

  // Tapping anywhere on the card — name, strip or the "اتصال" button — opens the details overlay.
  const firstName = await firstCard.locator(".provider-name").innerText();
  await firstCard.locator(".provider-name").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator(".detail-hero h3")).toHaveText(firstName);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await firstCard.locator(".provider-call-strip").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await firstCard.locator(".provider-call-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  console.log("PASS: card palette (blue frame, red name, gold stars, call strip) and every click opens the details overlay");

  // Details overlay: hero, chips, data rows, call/WhatsApp actions, about, share/favourite.
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".detail-hero")).toBeVisible();
  await expect(dialog.locator(".detail-hero-category")).not.toBeEmpty();
  await expect(dialog.locator(".provider-rating .rating-stars svg")).toHaveCount(5);
  assert.ok((await dialog.locator(".details-badges > span").count()) >= 1, "details show status chips");
  await expect(dialog.locator(".detail-data dd").first()).not.toBeEmpty();
  await expect(dialog.locator('.detail-actions a[href^="tel:"]')).toHaveCount(1);
  await expect(dialog.locator('.detail-actions a[href*="wa.me"]')).toHaveCount(1);
  await expect(dialog.locator(".detail-about p")).not.toBeEmpty();
  await expect(dialog.locator(".detail-utility-row .detail-share")).toBeVisible();
  await expect(dialog.locator(".detail-utility-row .detail-favorite")).toBeVisible();
  assert.ok(!(await dialog.innerText()).includes("بيانات مراجعة"), "no moderation wording in the details overlay");
  const details = await dialog.evaluate((element) => {
    const rgb = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
    return {
      hero: getComputedStyle(element.querySelector(".detail-hero")).backgroundImage,
      name: rgb(getComputedStyle(element.querySelector(".detail-hero h3")).color),
      category: rgb(getComputedStyle(element.querySelector(".detail-hero-category")).color),
      call: getComputedStyle(element.querySelector('.detail-actions a[href^="tel:"]')).backgroundImage,
      whatsapp: rgb(getComputedStyle(element.querySelector('.detail-actions a[href*="wa.me"]')).backgroundColor),
    };
  });
  assert.ok(details.hero.includes("gradient"), "the hero is tinted with the light category colour");
  assert.deepEqual(details.name, [180, 35, 24], "the name is red in the details overlay");
  assert.deepEqual(details.category, [28, 93, 170], "the category is blue in the details overlay");
  assert.ok(details.call.includes("gradient"), "the call button uses a blue gradient");
  assert.ok(details.whatsapp[1] > details.whatsapp[0] && details.whatsapp[1] > details.whatsapp[2], "the WhatsApp button stays green");
  await page.screenshot({ path: ".qa/janzour-service-details.png" });
  await page.keyboard.press("Escape");

  // Compact emergency box: red gradient strip with a white button that opens the numbers.
  await expect(page.locator(".emergency-strip")).toBeVisible();
  const strip = await page.locator(".emergency-strip").evaluate((element) => getComputedStyle(element).backgroundImage);
  assert.ok(strip.includes("gradient"), "emergency strip uses a red gradient");
  await expect(page.locator(".emergency-strip-button")).toHaveText("عرض الأرقام");
  await page.locator(".emergency-strip-button").click();
  await expect(page.getByRole("dialog").locator(".emergency-contact-link")).toHaveCount(5);
  await page.screenshot({ path: ".qa/janzour-emergency.png" });
  await page.keyboard.press("Escape");
  console.log("PASS: professional details overlay and the compact emergency box");

  await page.getByRole("link", { name: "الحرفيين", exact: true }).click();
  await expect(page).toHaveURL(`${base}/categories/crafts`);
  await expect(page.locator(".splash-screen")).toHaveCount(0, "client-side navigation never re-runs the splash");
  await expect(page.locator(".specialties-grid .category-tile")).toHaveCount(specialtyCount("crafts"));
  await page.screenshot({ path: ".qa/janzour-crafts.png", fullPage: true });
  await page.getByRole("link", { name: "النجارة", exact: true }).click();
  await expect(page).toHaveURL(`${base}/categories/crafts/carpentry`);
  await expect(page.locator(".provider-card .provider-name")).toContainText(["أحمد للنجارة والديكور"]);
  await page.locator(".provider-card").first().click();
  await expect(page.getByRole("dialog").locator('.detail-actions a[href^="tel:"]')).toHaveCount(1);
  await expect(page.getByRole("dialog").locator(".detail-data")).toContainText("جنزور");
  await page.keyboard.press("Escape");
  await page.goto(`${base}/categories/clinics`, { waitUntil: "networkidle" });
  await settle(page);
  await expect(page.locator(".specialties-grid .category-tile")).toHaveCount(specialtyCount("clinics"));
  await page.getByRole("link", { name: "طب الأسرة والباطنة", exact: true }).click();
  await expect(page.locator(".provider-card .provider-name")).toHaveText("د. سارة أحمد");
  await page.screenshot({ path: ".qa/janzour-clinic.png", fullPage: true });
  for (const root of rootIds.filter((id) => id !== "crafts" && id !== "clinics")) {
    await page.goto(`${base}/categories/${root}`, { waitUntil: "networkidle" });
    await settle(page);
    assert.ok(await page.locator(".specialties-grid .category-tile").count() > 0, `specialties for ${root}`);
  }
  console.log("PASS: every primary section leads to real specialty pages and provider details");

  await page.goto(base, { waitUntil: "networkidle" });
  await settle(page);
  await page.getByRole("button", { name: "أضف كهربائي منازل للمفضلة", exact: true }).click();
  await page.locator(".main-nav").getByRole("button", { name: /المفضلة/ }).click();
  await expect(page.locator(".provider-card")).toHaveCount(1);
  await page.reload({ waitUntil: "networkidle" });
  await settle(page);
  await expect(page.getByRole("button", { name: "إزالة كهربائي منازل من المفضلة", exact: true })).toHaveAttribute("aria-pressed", "true");
  await pickValue(page, page.getByRole("combobox", { name: "اختر العنوان", exact: true }), "جنزور / بجوار مكتبة الجمال");
  await page.getByRole("searchbox").fill("نجاره"); await page.getByRole("button", { name: "ابحث الآن", exact: true }).click();
  await expect(page.locator(".provider-card .provider-name")).toHaveText("أحمد للنجارة والديكور");
  await page.getByRole("button", { name: "مسح الفلاتر", exact: true }).click();
  await page.getByRole("button", { name: /ابحث حسب العنوان/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "عنوان آخر", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".custom-location-form input")).toBeVisible();
  await page.keyboard.press("Escape");
  console.log("PASS: favourites persist, Arabic search works and other-address search reveals a textbox");

  await admin.goto(`${base}/login`, { waitUntil: "networkidle" });
  await admin.screenshot({ path: ".qa/janzour-login.png", fullPage: true });
  await admin.locator("[name=username]").fill("admin"); await admin.locator("[name=password]").fill("admin");
  await admin.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await admin.getByRole("heading", { name: /أهلًا بيك، يا مدير الدليل/ }).waitFor();
  await settle(admin);
  // Advertising is gone from the dashboard: no tab, no stat card, no campaign rows, and the API rejects it.
  const adminTabs = await admin.locator(".admin-sidebar nav button").allInnerTexts();
  assert.ok(!adminTabs.some((label) => label.includes("إعلان")), `no advertising tab, got ${adminTabs.join(" | ")}`);
  assert.deepEqual(adminTabs.map((label) => label.replace(/\s*\d+\s*$/, "").trim()), ["طلبات المهن", "الدليل المنشور", "استيراد Excel", "التصنيفات والتخصصات", "عناوين جنزور", "أعضاء الموقع", "الإشعارات", "إعدادات الموقع"]);
  assert.ok(!(await admin.locator(".admin-stats").innerText()).includes("إعلان"), "no advertising stat card");
  await expect(admin.locator(".campaign-management")).toHaveCount(0);
  for (const request of [
    adminContext.request.post(`${base}/api/admin`, { data: { type: "ad", values: { businessName: "إعلان", text: "نص", phone: "01012345678" } } }),
    adminContext.request.patch(`${base}/api/admin`, { data: { type: "ad", id: "10000000-0000-4000-8000-000000000001", action: "approve" } }),
    adminContext.request.delete(`${base}/api/admin`, { data: { type: "ad", id: "10000000-0000-4000-8000-000000000001" } }),
  ]) assert.equal((await request).status(), 400, "the admin API rejects advertising requests");
  await admin.screenshot({ path: ".qa/janzour-admin.png", fullPage: true });
  await page.bringToFront();
  await page.getByRole("button", { name: "أضف مهنتك", exact: true }).click();
  const form = page.getByRole("dialog");
  await form.locator("[name=name]").fill(serviceName);
  await pickValue(page, form.getByRole("combobox", { name: /التصنيف الرئيسي/ }), "crafts");
  await pickValue(page, form.locator(".ui-select:has([name=category]) [role=combobox]"), "carpentry");
  await pickValue(page, form.locator(".ui-select:has([name=area]) [role=combobox]"), "عنوان آخر");
  await expect(form.locator("[name=address]")).toBeVisible();
  await form.locator("[name=address]").fill("جنزور / بجوار مدرسة اختبار الواجهة");
  await form.locator("[name=phone]").fill("01012345678");
  await form.locator("[name=description]").fill("طلب اختبار للتأكد من إشعار الإدارة ومراجعتها قبل نشر بيانات مقدم الخدمة في جنزور.");
  await page.screenshot({ path: ".qa/janzour-other-address-form.png" });
  const submitted = page.waitForResponse((response) => response.url().endsWith("/api/services") && response.request().method() === "POST");
  await form.getByRole("button", { name: "إرسال طلب إضافة مهنتك", exact: true }).click();
  serviceId = (await (await submitted).json()).id;
  await expect(form.getByRole("heading", { name: "طلبك وصل.. وأهلًا بيك!", exact: true })).toBeVisible();
  assert.ok(!(await (await guestContext.request.get(`${base}/api/services`)).json()).services.some((service) => service.id === serviceId));
  await form.getByRole("button", { name: "تمام، شكرًا", exact: true }).click();
  await admin.bringToFront();
  await expect(admin.locator(".admin-toast")).toContainText("طلب مهنة جديد بانتظارك", { timeout: 20000 });
  const row = admin.locator(".admin-service-row").filter({ hasText: serviceName });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "موافقة ونشر", exact: true }).click();
  await expect(row).toHaveCount(0);
  await admin.locator(".admin-sidebar nav").getByRole("button", { name: "الدليل المنشور", exact: true }).click();
  const publishedRow = admin.locator(".admin-service-row").filter({ hasText: serviceName });
  await publishedRow.getByRole("button", { name: "تعديل البيانات", exact: true }).click();
  await admin.getByRole("dialog").locator("[name=name]").fill(`${serviceName} - معدل`);
  await admin.getByRole("dialog").getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
  await expect(admin.getByRole("dialog")).toHaveCount(0);
  assert.equal((await (await guestContext.request.get(`${base}/api/services`)).json()).services.find((service) => service.id === serviceId).name, `${serviceName} - معدل`);
  console.log("PASS: service request creates a live admin notification, stays hidden until approval and supports editing");

  await admin.locator(".admin-sidebar nav").getByRole("button", { name: "التصنيفات والتخصصات", exact: true }).click();
  await admin.getByRole("button", { name: "تصنيف جديد", exact: true }).click();
  let editor = admin.getByRole("dialog"); await editor.locator("[name=name]").fill("قسم اختبار الواجهة"); await editor.locator("[name=slug]").fill(`qa-ui-${suffix}`);
  await editor.getByRole("button", { name: "حفظ التعديلات", exact: true }).click(); await expect(editor).toHaveCount(0);
  let catalog = await (await adminContext.request.get(`${base}/api/admin`)).json(); rootId = catalog.categories.find((category) => category.id === `qa-ui-${suffix}`).id;
  const group = admin.locator(".category-management-group").filter({ hasText: "قسم اختبار الواجهة" });
  await group.getByRole("button", { name: "تخصص", exact: true }).click(); editor = admin.getByRole("dialog");
  await editor.locator("[name=name]").fill("تخصص اختبار الواجهة"); await editor.locator("[name=slug]").fill(`qa-ui-specialty-${suffix}`);
  await editor.getByRole("button", { name: "حفظ التعديلات", exact: true }).click(); await expect(editor).toHaveCount(0);
  catalog = await (await adminContext.request.get(`${base}/api/admin`)).json(); specialtyId = catalog.categories.find((category) => category.id === `qa-ui-specialty-${suffix}`).id;
  assert.equal((await guestContext.request.get(`${base}/categories/${rootId}/${specialtyId}`)).status(), 200);
  await admin.getByRole("button", { name: "إخفاء تخصص اختبار الواجهة", exact: true }).click();
  await expect(admin.getByRole("button", { name: "إظهار تخصص اختبار الواجهة", exact: true })).toBeVisible();
  assert.ok(!(await (await guestContext.request.get(`${base}/api/services`)).json()).categories.some((category) => category.id === specialtyId));
  await admin.screenshot({ path: ".qa/janzour-admin-categories.png", fullPage: true });
  await adminContext.request.delete(`${base}/api/admin`, { data: { type: "category", id: specialtyId } }); specialtyId = undefined;
  await adminContext.request.delete(`${base}/api/admin`, { data: { type: "category", id: rootId } }); rootId = undefined;
  savedSettings = (await (await adminContext.request.get(`${base}/api/admin`)).json()).settings;
  await admin.locator(".admin-sidebar nav").getByRole("button", { name: "إعدادات الموقع", exact: true }).click();
  for (const field of ["marqueeEnabled", "adPrice", "adDays"]) await expect(admin.locator(`.settings-editor [name=${field}]`)).toHaveCount(0);
  assert.ok(!(await admin.locator(".settings-editor").innerText()).includes("إعلان"), "the settings form has no advertising section");
  await admin.locator("[name=heroSubtitle]").fill("وصف اختبار من لوحة التحكم - أهل جنزور");
  await admin.getByRole("button", { name: "حفظ الإعدادات", exact: true }).click();
  await expect(admin.locator(".form-success")).toBeVisible();
  assert.equal((await (await guestContext.request.get(`${base}/api/services`)).json()).settings.heroSubtitle, "وصف اختبار من لوحة التحكم - أهل جنزور");
  await adminContext.request.patch(`${base}/api/admin`, { data: { type: "settings", values: savedSettings } }); savedSettings = undefined;
  console.log("PASS: category/specialty CRUD and visibility controls; editable homepage settings without advertising fields");

  const beforeMember = await (await guestContext.request.get(`${base}/api/services`)).json();
  await member.goto(`${base}/register`, { waitUntil: "networkidle" });
  await settle(member);
  await member.screenshot({ path: ".qa/janzour-register-mobile.png", fullPage: true });
  await member.locator("[name=name]").fill(memberName); await member.locator("[name=phone]").fill("01012345678"); await member.locator("[name=username]").fill(`ui.${suffix}`);
  await member.locator("[name=password]").fill("test-pass-123"); await member.locator("[name=confirmPassword]").fill("test-pass-123");
  await member.getByRole("button", { name: "إنشاء العضوية", exact: true }).click(); await expect(member).toHaveURL(`${base}/account`);
  memberId = (await (await memberContext.request.get(`${base}/api/auth`)).json()).viewer.id;
  await expect(member.locator(".profile-member-badge")).toHaveText("عضو في الموقع");
  const afterMember = await (await guestContext.request.get(`${base}/api/services`)).json(); assert.equal(afterMember.memberCount, beforeMember.memberCount + 1); assert.equal(afterMember.services.length, beforeMember.services.length);
  await member.goto(`${base}/admin`, { waitUntil: "networkidle" }); await expect(member).toHaveURL(`${base}/account`);
  assert.equal((await memberContext.request.get(`${base}/api/admin`)).status(), 401);
  await member.goto(base, { waitUntil: "networkidle" }); await expect(member.locator('a[href="/admin"]')).toHaveCount(0);
  await admin.bringToFront(); await admin.locator(".admin-sidebar nav").getByRole("button", { name: /أعضاء الموقع/ }).click(); await admin.getByRole("button", { name: "تحديث", exact: true }).click();
  await expect(admin.locator(".admin-member-row").filter({ hasText: memberName })).toBeVisible();
  await expect(admin.locator(".member-count-banner")).toContainText(`${afterMember.memberCount} عضو مسجل`);
  await admin.screenshot({ path: ".qa/janzour-admin-members.png", fullPage: true });
  console.log("PASS: independent member signup, correct member count, member directory separation and admin denial");

  // A moderator sees four sections only: requests, published directory, categories and notifications.
  const moderatorContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const moderator = await moderatorContext.newPage();
  moderator.on("pageerror", (error) => errors.push(error.message));
  await moderatorContext.request.post(`${base}/api/auth`, { data: { action: "register", name: "مشرف اختبار الواجهة", username: `ui.mod.${suffix}`, phone: "01012345678", password: "test-pass-123", confirmPassword: "test-pass-123" } });
  moderatorId = (await (await moderatorContext.request.get(`${base}/api/auth`)).json()).viewer.id;
  await adminContext.request.patch(`${base}/api/admin`, { data: { type: "member", id: moderatorId, values: { role: "moderator" } } });
  await moderator.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await settle(moderator);
  const moderatorTabs = await moderator.locator(".admin-sidebar nav button").allInnerTexts();
  assert.deepEqual(moderatorTabs.map((label) => label.replace(/\s*\d+\s*$/, "").trim()), ["طلبات المهن", "الدليل المنشور", "التصنيفات والتخصصات", "الإشعارات"]);
  await expect(moderator.locator(".admin-shell-moderator")).toBeVisible();
  assert.ok(!(await moderator.locator(".admin-content").innerText()).includes("إعلان"), "the moderator dashboard never mentions advertising");
  await moderator.screenshot({ path: ".qa/janzour-admin-moderator.png", fullPage: true });
  await moderatorContext.request.delete(`${base}/api/auth`); await moderatorContext.close();
  console.log("PASS: moderator dashboard is limited to requests, directory, categories and notifications");

  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base, { waitUntil: "networkidle" });
    await settle(page);
    const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth })); assert.ok(size.content <= size.viewport, `overflow at ${width}: ${size.content}`);
    if (width === 390) {
      await page.screenshot({ path: ".qa/janzour-home-mobile.png", fullPage: true });
      await page.getByRole("button", { name: "فتح القائمة", exact: true }).click(); await expect(page.locator(".main-nav")).toBeVisible(); await page.getByRole("button", { name: "إغلاق القائمة", exact: true }).click();
      await page.locator(".provider-card").first().click();
      const mobileDialog = page.getByRole("dialog");
      await expect(mobileDialog).toBeVisible();
      await page.screenshot({ path: ".qa/janzour-details-mobile.png" });
      const dialogBox = await mobileDialog.locator(".modal-panel").boundingBox();
      assert.ok(dialogBox.width <= 390, `details overlay fits the mobile viewport: ${dialogBox.width}`);
      await page.keyboard.press("Escape");
    }
    console.log(`PASS: no horizontal overflow at ${width}px`);
  }
  await admin.setViewportSize({ width: 390, height: 844 }); await admin.reload({ waitUntil: "networkidle" });
  await settle(admin);
  const adminSize = await admin.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth })); assert.ok(adminSize.content <= adminSize.viewport);
  await admin.screenshot({ path: ".qa/janzour-admin-mobile.png", fullPage: true });
  assert.equal(errors.length, 0, errors.join("\n")); console.log("PASS: responsive administration and no browser runtime errors");
} finally {
  await adminContext.request.post(`${base}/api/auth`, { data: { action: "login", username: "admin", password: "admin" } });
  if (savedSettings) await adminContext.request.patch(`${base}/api/admin`, { data: { type: "settings", values: savedSettings } });
  for (const [type, id] of [["service", serviceId], ["member", memberId], ["member", moderatorId], ["category", specialtyId], ["category", rootId]]) if (id) await adminContext.request.delete(`${base}/api/admin`, { data: { type, id } });
  await adminContext.request.delete(`${base}/api/auth`); await memberContext.request.delete(`${base}/api/auth`); await browser.close();
  console.log("Cleaned up UI test records and restored settings.");
}

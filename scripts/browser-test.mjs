import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Custom dropdowns (SelectField) replace native selects: open the combobox, then click the option by its value.
async function pickValue(page, combobox, value) {
  await combobox.click();
  await page.locator(`[role="option"][data-value="${value}"]`).click();
}
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
fs.mkdirSync(".qa", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const guestContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const memberContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await guestContext.newPage(), admin = await adminContext.newPage(), member = await memberContext.newPage();
const errors = []; for (const target of [page, admin, member]) target.on("pageerror", (error) => errors.push(error.message));
const suffix = Date.now().toString(36);
let serviceId, memberId, rootId, specialtyId, savedSettings;
const serviceName = "اختبار واجهة - نجار جنزور";
const memberName = "عضو اختبار الواجهة";
try {
  // Expected counts come from the API so the assertions follow the seeded catalogue instead of hardcoding it.
  const baseline = await (await guestContext.request.get(`${base}/api/services`)).json();
  const rootIds = baseline.categories.filter((category) => !category.parentId).map((category) => category.id);
  const specialtyCount = (root) => baseline.categories.filter((category) => category.parentId === root).length;
  const homeCards = Math.min(4, baseline.services.filter((service) => service.featured).length);
  assert.deepEqual(baseline.ads, [], "The public directory serves no advertisements any more");

  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".main-category-grid .category-tile")).toHaveCount(rootIds.length);
  await expect(page.locator(".provider-card")).toHaveCount(homeCards);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontSize), "15px");
  // Every public advertising surface is gone: carousel, strip, sponsored grid, sidebar card and ad links.
  for (const selector of [".hero-advertisements", ".advertising-strip", ".marquee-track", ".featured-advertisers", ".sidebar-ad", ".home-advertising", ".campaign-card"]) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "الإعلانات", exact: true })).toHaveCount(0);
  await expect(page.locator('.header-inner a[href="/admin"]')).toHaveCount(0);
  await page.screenshot({ path: ".qa/janzour-home-desktop.png", fullPage: true });
  console.log("PASS: home renders the catalogue with no public advertising surface");

  // Card: green phone capsule, address line, and tapping anywhere opens the details overlay.
  const phone = page.locator(".provider-card .provider-phone").first();
  const capsule = await phone.evaluate((element) => {
    const style = getComputedStyle(element);
    const [red, green, blue] = style.color.match(/\d+/g).map(Number);
    return { radius: parseFloat(style.borderRadius), green: green > red && green > blue };
  });
  assert.ok(capsule.green, "phone capsule is green");
  assert.ok(capsule.radius >= 15, `phone capsule is a pill, got ${capsule.radius}`);
  await expect(page.locator(".provider-card .provider-address").first()).toContainText("جنزور");
  const firstCard = page.locator(".provider-card").first();
  const firstName = await firstCard.locator(".provider-name").innerText();
  await firstCard.locator(".provider-name").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator(".detail-hero h3")).toHaveText(firstName);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await firstCard.locator(".provider-phone").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  console.log("PASS: the whole card (name and phone capsule) opens the details overlay");

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
  await expect(page.locator(".specialties-grid .category-tile")).toHaveCount(specialtyCount("clinics"));
  await page.getByRole("link", { name: "طب الأسرة والباطنة", exact: true }).click();
  await expect(page.locator(".provider-card .provider-name")).toHaveText("د. سارة أحمد");
  await page.screenshot({ path: ".qa/janzour-clinic.png", fullPage: true });
  for (const root of rootIds.filter((id) => id !== "crafts" && id !== "clinics")) {
    await page.goto(`${base}/categories/${root}`, { waitUntil: "networkidle" });
    assert.ok(await page.locator(".specialties-grid .category-tile").count() > 0, `specialties for ${root}`);
  }
  console.log("PASS: every primary section leads to real specialty pages and provider details");

  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "أضف كهربائي منازل للمفضلة", exact: true }).click();
  await page.locator(".main-nav").getByRole("button", { name: /المفضلة/ }).click();
  await expect(page.locator(".provider-card")).toHaveCount(1);
  await page.reload({ waitUntil: "networkidle" });
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
  await expect(admin.locator(".settings-editor [name=marqueeEnabled]")).toHaveCount(0);
  await admin.locator("[name=heroSubtitle]").fill("وصف اختبار من لوحة التحكم - أهل جنزور");
  await admin.getByRole("button", { name: "حفظ الإعدادات", exact: true }).click();
  await expect(admin.locator(".form-success")).toBeVisible();
  assert.equal((await (await guestContext.request.get(`${base}/api/services`)).json()).settings.heroSubtitle, "وصف اختبار من لوحة التحكم - أهل جنزور");
  await adminContext.request.patch(`${base}/api/admin`, { data: { type: "settings", values: savedSettings } }); savedSettings = undefined;
  console.log("PASS: category/specialty CRUD and visibility controls; editable homepage settings without the carousel");

  const beforeMember = await (await guestContext.request.get(`${base}/api/services`)).json();
  await member.goto(`${base}/register`, { waitUntil: "networkidle" });
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

  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base, { waitUntil: "networkidle" });
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
  const adminSize = await admin.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth })); assert.ok(adminSize.content <= adminSize.viewport);
  await admin.screenshot({ path: ".qa/janzour-admin-mobile.png", fullPage: true });
  assert.equal(errors.length, 0, errors.join("\n")); console.log("PASS: responsive administration and no browser runtime errors");
} finally {
  await adminContext.request.post(`${base}/api/auth`, { data: { action: "login", username: "admin", password: "admin" } });
  if (savedSettings) await adminContext.request.patch(`${base}/api/admin`, { data: { type: "settings", values: savedSettings } });
  for (const [type, id] of [["service", serviceId], ["member", memberId], ["category", specialtyId], ["category", rootId]]) if (id) await adminContext.request.delete(`${base}/api/admin`, { data: { type, id } });
  await adminContext.request.delete(`${base}/api/auth`); await memberContext.request.delete(`${base}/api/auth`); await browser.close();
  console.log("Cleaned up UI test records and restored settings.");
}

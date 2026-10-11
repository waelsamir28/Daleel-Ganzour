import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base);
  await expect(page.locator(".splash-screen")).toHaveCount(0);
  const data = await (await page.request.get(`${base}/api/services`)).json();
  data.services = [{ ...data.services[0], demo: false, featured: true, neededRank: 1, subSpecialties: ["كهرباء سيارات تجريبية"] }];
  await page.route("**/api/services", (route) => route.fulfill({ json: data }));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".most-needed button")).toHaveCount(1);
  await page.getByRole("searchbox").fill("كهرباء سيارات تجريبية");
  await page.locator(".hero-search .search-button").click();
  await expect(page.locator(".provider-card")).toHaveCount(1);
  await page.locator(".provider-card").click();
  await expect(page.getByText("كهرباء سيارات تجريبية", { exact: true })).toBeVisible();
  let submitted;
  await page.route("**/api/appointments", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { id: "test-reference", message: "طلب انتظار وليس حجزًا مؤكدًا" } });
  });
  const form = page.locator(".service-details form");
  await form.locator('[name="name"]').fill("مستخدم اختبار");
  await form.locator('[name="phone"]').fill("01012345678");
  await form.locator('[name="preference"]').fill("الأحد مساءً");
  await form.getByRole("button", { name: "إرسال طلب موعد" }).click();
  await expect(page.getByText(/رقم الطلب: test-reference/)).toBeVisible();
  assert.equal(submitted.serviceId, data.services[0].id);
  assert.equal((await page.request.get(`${base}/api/appointments`)).status(), 403);
  assert.equal((await page.request.get(`${base}/track/invalid`)).status(), 404);
  console.log("PASS: sub-specialty search, most-needed section, appointment submission confirmation, admin protection and invalid private link");
} finally { await browser.close(); }

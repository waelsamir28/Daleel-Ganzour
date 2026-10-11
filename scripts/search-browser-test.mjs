import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    window.SpeechRecognition = window.webkitSpeechRecognition = class {
      start() {
        this.onresult({ results: [[{ transcript: "كلام غير مطابق تمامًا" }]] });
        this.onend();
      }
    };
  });
  await page.goto(base);
  await expect(page.locator(".splash-screen")).toHaveCount(0);
  const before = await page.locator(".provider-card").count();
  await page.getByRole("button", { name: "بحث بالصوت", exact: true }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("كلام غير مطابق تمامًا");
  assert.equal(await page.locator(".provider-card").count(), before, "voice result does not submit search");
  await page.locator(".hero-search .search-button").click();
  await expect(page.locator(".provider-card")).toHaveCount(0);
  await expect(page.locator(".specialty-suggestions a")).toHaveCount(3);
  await page.getByRole("button", { name: "مسح الفلاتر" }).click();
  const data = await (await page.request.get(`${base}/api/services`)).json();
  data.services = [{ ...data.services[0], featured: true, serviceItems: ["كشف تسريب", "تركيب"] }];
  await page.route("**/api/services", (route) => route.fulfill({ json: data }));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".provider-card")).toHaveCount(1);
  await page.getByRole("searchbox").fill("كشف تسريب");
  await page.locator(".hero-search .search-button").click();
  await expect(page.locator(".provider-card")).toHaveCount(1);
  await page.locator(".provider-card").click();
  await expect(page.locator(".detail-service-items li")).toHaveCount(2);
  const link = await page.locator(".detail-service-items a").first().getAttribute("href");
  const message = new URL(link).searchParams.get("text");
  assert.ok(message.includes("كشف تسريب") && message.includes(data.services[0].name));
  console.log("PASS: mobile voice confirmation, no-result suggestions, detailed-service search/display and contextual WhatsApp");
  await page.close();
} finally { await browser.close(); }

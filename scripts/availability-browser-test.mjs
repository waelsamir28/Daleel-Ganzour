import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await expect(page.locator(".splash-screen")).toHaveCount(0);
    const data = await (await page.request.get(`${base}/api/services`)).json();
    assert.ok(data.services.length > 1, "preview data is required");
    const now = Date.now();
    data.services = data.services.slice(0, 2).map((service, index) => ({
      ...service, featured: false, availableNow: true,
      availableUntil: new Date(now + (index === 0 ? 4 * 60 * 60 * 1000 : -1000)).toISOString(),
      workingHours: Array.from({ length: 7 }, (_, day) => day === 5
        ? { closed: true, opens: "", closes: "" }
        : { closed: false, opens: "20:00", closes: "02:00" }),
    }));
    await page.route("**/api/services", (route) => route.fulfill({ json: data }));
    await page.clock.install({ time: new Date(now) });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".provider-card")).toHaveCount(2);
    const filter = page.getByRole("button", { name: "متاح الآن", exact: true });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".provider-card")).toHaveCount(1);
    await page.locator(".provider-card").click();
    await expect(page.locator(".detail-open")).toContainText("متاح الآن");
    await expect(page.locator(".weekly-hours > div")).toHaveCount(7);
    await expect(page.locator(".weekly-hours")).toContainText("إجازة");
    await expect(page.locator(".weekly-hours")).toContainText("اليوم التالي");
    await page.clock.fastForward(4 * 60 * 60 * 1000 + 1000);
    await expect(page.locator(".detail-open")).toHaveCount(0);
    await expect(page.locator(".provider-card")).toHaveCount(0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "no horizontal overflow");
    assert.deepEqual(errors, [], "no browser errors");
    await page.close();
    console.log(`PASS: ${viewport.width}px availability filter, seven-day schedule, holiday, overnight hours and live expiry`);
  }
} finally {
  await browser.close();
}

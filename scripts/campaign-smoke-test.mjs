import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.TEST_BASE_URL || "http://localhost:3047";
const cookies = new Map();
const created = [];
async function api(path, method = "GET", body, admin = true, origin = base) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", Origin: origin, ...(admin ? { Cookie: [...cookies].map(([key, val]) => `${key}=${val}`).join("; ") } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (admin) for (const header of response.headers.getSetCookie()) { const [pair] = header.split(";"); const i = pair.indexOf("="); cookies.set(pair.slice(0, i), pair.slice(i + 1)); }
  return { status: response.status, data: await response.json() };
}
const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const later = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const basics = { name: "حملة اختبار الإعلانات", businessName: "مكتبة تجربة محلية", text: "أدوات مدرسية لكل طالب وخصومات حصرية لأهالي قرية جنزور", offerText: "خصم ٢٠٪", phone: "01012345678", whatsappPhone: "01222355769", destinationUrl: "/categories/crafts", categoryId: "", imageUrl: "/icon-192.png", videoUrl: "", adType: "banner", placement: "hero", startsAt: null, expiresAt: later, priority: 500, campaignStatus: "active", status: "approved", paid: true, price: 0 };
function getAd(payload, id) { return payload.data.ads.find((ad) => ad.id === id); }
try {
  const login = await api("/api/auth", "POST", { action: "login", username: process.env.TEST_ADMIN_USERNAME || "admin", password: process.env.TEST_ADMIN_PASSWORD || "admin" });
  assert.equal(login.status, 200, JSON.stringify(login.data));
  const html = await (await fetch(base)).text();
  assert.ok(html.includes("hero-advertisements") && !html.includes("ad-carousel"), "Premium banner replaces old carousel");

  for (const [placement, overrides] of [["hero", {}], ["inline", { categoryId: "carpentry", adType: "card" }], ["sponsored", { adType: "video", videoUrl: "https://example.com/promo.mp4" }]]) {
    const result = await api("/api/admin", "POST", { type: "ad", values: { ...basics, placement, ...overrides, name: `اختبار ${placement}` } });
    assert.equal(result.status, 201, JSON.stringify(result.data));
    const ad = result.data.ads.find((item) => item.name === `اختبار ${placement}`);
    assert.ok(ad); created.push(ad.id);
    assert.equal(ad.placement, placement); assert.equal(ad.adType, overrides.adType || "banner");
  }
  const [hero, inline, sponsored] = created;
  const publicAds = (await api("/api/advertisements", "GET", null, false)).data.ads;
  assert.deepEqual(publicAds.filter((ad) => created.includes(ad.id)).map((ad) => ad.placement).sort(), ["hero", "inline", "sponsored"]);
  assert.equal(publicAds.find((ad) => ad.id === hero).name, "");
  assert.equal(publicAds.find((ad) => ad.id === hero).impressions, 0);

  const impressionId = randomUUID();
  const impression = { adId: hero, eventId: impressionId, eventType: "impression" };
  const results = await Promise.all(Array.from({ length: 6 }, () => api("/api/advertisements/events", "POST", impression, false)));
  assert.deepEqual(results.map((r) => r.status), Array(6).fill(200));
  assert.equal(results.filter((r) => r.data.recorded).length, 1);
  const click = { adId: hero, eventId: randomUUID(), eventType: "click", action: "call" };
  assert.equal((await api("/api/advertisements/events", "POST", click, false)).data.recorded, true);
  assert.equal((await api("/api/advertisements/events", "POST", click, false)).data.recorded, false);
  const stats = getAd(await api("/api/admin"), hero);
  assert.equal(stats.impressions, 1); assert.equal(stats.clicks, 1);
  assert.equal((await api("/api/advertisements", "GET", null, false)).data.ads.find((ad) => ad.id === hero).clicks, 0, "Admin analytics remain private");
  console.log("PASS: 3 placements, unique atomic event IDs, safe public metrics and legacy defaults");

  assert.equal((await api("/api/admin", "PATCH", { type: "ad", id: hero, action: "pause" })).status, 200);
  assert.ok(!(await api("/api/advertisements", "GET", null, false)).data.ads.some((ad) => ad.id === hero));
  assert.equal((await api("/api/advertisements/events", "POST", { adId: hero, eventId: randomUUID(), eventType: "impression" }, false)).data.recorded, false);
  assert.equal((await api("/api/admin", "PATCH", { type: "ad", id: hero, action: "resume" })).status, 200);
  assert.equal((await api("/api/admin", "PATCH", { type: "ad", id: hero, action: "edit", values: { ...basics, startsAt: future } })).status, 200);
  assert.ok(!(await api("/api/advertisements", "GET", null, false)).data.ads.some((ad) => ad.id === hero));
  assert.equal((await api("/api/admin", "PATCH", { type: "ad", id: hero, action: "edit", values: { ...basics, expiresAt: new Date(Date.now() - 1000).toISOString() } })).status, 200);
  assert.ok(!(await api("/api/advertisements", "GET", null, false)).data.ads.some((ad) => ad.id === hero));
  console.log("PASS: paused, scheduled and expired campaigns are hidden and never gain impressions");

  for (const invalid of [
    { adType: "unknown" }, { placement: "other" }, { placement: "inline", categoryId: "" }, { categoryId: "missing-category" },
    { videoUrl: "javascript:alert(1)" }, { adType: "video", videoUrl: "" }, { destinationUrl: "data:text/html,test" },
    { whatsappPhone: "not-a-phone" }, { priority: -1 }, { campaignStatus: "archived" }, { startsAt: later, expiresAt: future }, { startsAt: "2026-02-30T12:00:00Z" },
    { placement: "sponsored", destinationUrl: "" }, { status: "approved", paid: false },
  ]) {
    const rejected = await api("/api/admin", "PATCH", { type: "ad", id: inline, action: "edit", values: { ...basics, ...invalid } });
    assert.equal(rejected.status, 400, JSON.stringify({ invalid, rejected }));
  }
  assert.equal((await api("/api/advertisements/events", "POST", { adId: inline, eventId: randomUUID(), eventType: "click", action: "call" }, false, "https://untrusted.example")).status, 403);
  for (const invalid of [{ eventType: ["impression"] }, { action: ["call"] }, { eventType: "click", action: "" }, { eventType: "impression", action: "call" }]) {
    assert.equal((await api("/api/advertisements/events", "POST", { adId: inline, eventId: randomUUID(), eventType: "click", action: "call", ...invalid }, false)).status, 400);
  }
  const pending = await api("/api/advertisements", "POST", { businessName: "طلب جمهور تجربة", text: basics.text, phone: basics.phone, status: "approved", paid: true, placement: "hero" }, false);
  assert.equal(pending.status, 201);
  created.push(pending.data.id);
  assert.ok(!(await api("/api/advertisements", "GET", null, false)).data.ads.some((ad) => ad.id === pending.data.id));
  console.log("PASS: validation, origin checks, public moderation/payment gate");
} finally {
  for (const id of created) { const result = await api("/api/admin", "DELETE", { type: "ad", id }); assert.equal(result.status, 200, `cleanup ${id}`); }
  await api("/api/auth", "DELETE");
}

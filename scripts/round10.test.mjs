import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

/** يحمّل ملف TS كنقي (بدون شبكة أو قاعدة بيانات) عبر data URL — نفس أسلوب catalog.test.mjs. */
async function loadLib(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2019 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const push = await loadLib("../src/lib/push-shared.ts");
const quick = await loadLib("../src/lib/quick-rating.ts");
const sticker = await loadLib("../src/lib/section-sticker.ts");
const catalog = await loadLib("../src/lib/catalog.ts");

const SERVICE_ID = "3f2b1c40-9d1e-4b2a-8f0e-0f5c2a4d7b11";

test("push subscriptions are validated and normalised before storage", () => {
  const clean = push.sanitizePushSubscription({ endpoint: " https://fcm.googleapis.com/wp/abc ", keys: { p256dh: "p".repeat(20), auth: "a".repeat(10) }, extra: "drop" });
  assert.equal(clean.endpoint, "https://fcm.googleapis.com/wp/abc");
  const stored = JSON.parse(clean.subscription);
  assert.equal(stored.endpoint, clean.endpoint);
  assert.equal(stored.keys.p256dh, "p".repeat(20));
  assert.equal(stored.keys.auth, "a".repeat(10));
  assert.equal("extra" in stored, false);
  for (const bad of [null, {}, { endpoint: "http://insecure.example/x", keys: { p256dh: "p", auth: "a" } }, { endpoint: "https://ok.example/x", keys: { p256dh: "", auth: "" } }]) {
    assert.equal(push.sanitizePushSubscription(bad), null);
  }
});

test("push message clamps text length and only allows in-site links", () => {
  const long = push.sanitizePushMessage({ title: "ع".repeat(120), body: "ب".repeat(400), url: "https://evil.example/x" });
  assert.equal(long.title.length, 60);
  assert.equal(long.body.length, 160);
  assert.equal(long.url, "/");
  assert.equal(push.sanitizePushMessage({ title: "خبر", body: "تفاصيل", url: "/telecom" }).url, "/telecom");
  const payload = push.pushPayload({ title: "خبر", body: "تفاصيل", url: "/categories/doctors" }, "https://daleel-ganzour.vercel.app");
  const parsed = JSON.parse(payload);
  assert.equal(parsed.url, "/categories/doctors");
  assert.ok(payload.length <= 3800);
});

test("push topic preferences filter who gets a section notification", () => {
  assert.deepEqual(push.sanitizePushTopics(["doctors", "doctors", "Teachers!", "teachers", 7]), ["doctors", "teachers"]);
  assert.deepEqual(push.sanitizePushTopics("doctors"), []);
  assert.equal(push.sanitizePushTopics(Array.from({ length: 30 }, (_, index) => `sec-${index}`)).length, push.PUSH_TOPICS_MAX);
  assert.equal(push.pushTargetsTopics([], "doctors"), true);
  assert.equal(push.pushTargetsTopics(undefined, "doctors"), true);
  assert.equal(push.pushTargetsTopics(["doctors"], "doctors"), true);
  assert.equal(push.pushTargetsTopics(["teachers"], "doctors"), false);
  assert.equal(push.pushTargetsTopics(["teachers"], undefined), true);
});

test("expired push subscriptions are detected for cleanup", () => {
  assert.equal(push.isExpiredSubscriptionError({ statusCode: 404 }), true);
  assert.equal(push.isExpiredSubscriptionError({ statusCode: 410 }), true);
  assert.equal(push.isExpiredSubscriptionError({ statusCode: 500 }), false);
  assert.equal(push.isExpiredSubscriptionError(null), false);
  assert.deepEqual([...push.urlBase64ToUint8Array("AQID")], [1, 2, 3]);
});

test("quick rating accepts only 1-5 stars for a real service", () => {
  assert.deepEqual(quick.sanitizeQuickRating({ serviceId: SERVICE_ID, stars: 4 }), { serviceId: SERVICE_ID, stars: 4 });
  assert.deepEqual(quick.sanitizeQuickRating({ serviceId: ` ${SERVICE_ID} `, stars: "5" }), { serviceId: SERVICE_ID, stars: 5 });
  for (const bad of [{ serviceId: SERVICE_ID, stars: 0 }, { serviceId: SERVICE_ID, stars: 6 }, { serviceId: SERVICE_ID, stars: 3.5 }, { serviceId: "abc", stars: 4 }, { stars: 4 }]) {
    assert.equal(quick.sanitizeQuickRating(bad), null);
  }
});

test("quick rating asks once per device and remembers the answer", () => {
  assert.equal(quick.shouldAskQuickRating(null, SERVICE_ID), true);
  assert.equal(quick.shouldAskQuickRating("[]", SERVICE_ID), true);
  const once = quick.rememberRated(null, SERVICE_ID);
  assert.deepEqual(once, [SERVICE_ID]);
  assert.equal(quick.shouldAskQuickRating(JSON.stringify(once), SERVICE_ID), false);
  assert.deepEqual(quick.rememberRated(JSON.stringify(once), SERVICE_ID), once);
  assert.equal(quick.parseRatedServices("{oops").length, 0);
  const many = quick.rememberRated(JSON.stringify(Array.from({ length: 60 }, () => SERVICE_ID)), "7c1d8a2e-5b6f-4c3d-9e0a-123456789abc");
  assert.equal(many.length, quick.QUICK_RATING_MAX_REMEMBERED);
  assert.ok(quick.quickRatingText("أحمد الهواري").title.includes("أحمد الهواري"));
  assert.equal(quick.quickRatingText("").title, "قيّمت تجربتك؟");
});

test("WhatsApp request names the provider, the need, the site and the direct link", () => {
  const message = catalog.serviceWhatsappMessage({ name: "أحمد" }, "سباكة", "جنزور / السوق", "كشف تسريب", { siteName: "دليل جنزور", url: "https://daleel-ganzour.vercel.app/?service=x" });
  assert.ok(message.includes("أحمد") && message.includes("كشف تسريب") && message.includes("جنزور / السوق"));
  assert.ok(message.includes("من دليل جنزور"));
  assert.ok(message.includes("https://daleel-ganzour.vercel.app/?service=x"));
  assert.equal(message.split("\n").length, 5);
  assert.equal(catalog.serviceDirectUrl("a b/c").endsWith("/?service=a%20b%2Fc"), true);
  assert.ok(catalog.whatsappUrl("01000000000", message).startsWith("https://wa.me/201000000000?text="));
});

test("every section has a stable accent colour and a branded share card", () => {
  const accents = new Set();
  for (const id of ["doctors", "teachers", "maintenance", "home-services", "beauty", "cars-services", "food-supply", "trade", "construction", "events", "technology", "other-services", "agri-engineering", "tailors", "brand-new-section"]) {
    const accent = catalog.sectionAccent(id);
    assert.match(accent, /^#[0-9a-f]{6}$/i);
    accents.add(accent);
    const images = catalog.categoryOgImage(id, "قسم", accent);
    assert.equal(images.length, 1);
    assert.match(images[0].url, /^(\/images\/og\/.+\.jpg|\/api\/og\/category\?)/);
    assert.equal(images[0].width, 1200);
  }
  assert.equal(accents.has(catalog.sectionAccent("brand-new-section")), true);
  assert.equal(catalog.sectionAccent("doctors"), catalog.sectionAccent("doctors"));
});

test("section QR sticker text and URL are clean and printable", () => {
  const doctors = sticker.sectionStickerText("عيادات");
  assert.equal(doctors.title, "كل عيادات في مكان واحد");
  assert.equal(doctors.action, "امسح الكود");
  assert.equal(sticker.sectionStickerText("  ").title, "كل خدمات جنزور في مكان واحد");
  assert.equal(sticker.sectionStickerUrl("https://daleel-ganzour.vercel.app/", "doctors"), "https://daleel-ganzour.vercel.app/categories/doctors");
  assert.equal(sticker.sectionStickerFileName('عيادات / "أسنان"'), "ملصق-عيادات أسنان.png");
});

test("round-10 screens are wired: push API, service worker and admin panels", () => {
  const api = readFileSync(new URL("../src/app/api/push/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("sendPushToAll") && api.includes("sameOrigin(request)") && api.includes("rateLimit(request, \"push-subscribe\""));
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.ok(sw.includes("addEventListener(\"push\"") && sw.includes("notificationclick") && sw.includes("openWindow"));
  const quickApi = readFileSync(new URL("../src/app/api/ratings/quick/route.ts", import.meta.url), "utf8");
  assert.ok(quickApi.includes("sanitizeQuickRating") && quickApi.includes("quickRatings") && quickApi.includes("serviceRatings"));
  const analytics = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  for (const part of ["AdminPush", "AdminQuickRatings", "SectionStickerModal"]) assert.ok(analytics.includes(part));
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes("<QuickRating />"));
});

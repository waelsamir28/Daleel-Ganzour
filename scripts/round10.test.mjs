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
  for (const id of ["crafts", "clinics", "labs", "pharmacies", "shops", "teachers", "charities", "printing", "events", "beauty", "transport", "cleaning", "law", "other-services", "brand-new-section"]) {
    const accent = catalog.sectionAccent(id);
    assert.match(accent, /^#[0-9a-f]{6}$/i);
    accents.add(accent);
    const images = catalog.categoryOgImage(id, "قسم", accent);
    assert.equal(images.length, 1);
    assert.match(images[0].url, /^(\/images\/og\/.+\.jpg|\/api\/og\/category\?)/);
    assert.equal(images[0].width, 1200);
  }
  assert.equal(accents.has(catalog.sectionAccent("brand-new-section")), true);
  assert.equal(catalog.sectionAccent("clinics"), "#22b96d");
  assert.equal(catalog.sectionAccent("crafts"), "#ff941f");
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

test("Arabic search tolerates common typos and letter substitutions", () => {
  const service = { name: "محمد السباك", description: "تركيب وصيانة حمامات", serviceItems: ["كشف تسريب"], subSpecialties: ["منازل"], category: "plumbing", address: "جنزور / السوق", phone: "01000000000", phoneSecondary: "" };
  assert.equal(catalog.editDistanceAtMost("سباكه", "سباكه", 1), true);
  assert.equal(catalog.editDistanceAtMost("كهربا", "كهرباء", 1), true);
  assert.equal(catalog.editDistanceAtMost("نجار", "نجر", 1), true);
  assert.equal(catalog.editDistanceAtMost("سباك", "كهربا", 1), false);
  assert.equal(catalog.isCloseWord("سباكه", "سباك"), true);
  assert.equal(catalog.isCloseWord("حداد", "نجار"), false);
  // البحث العادي والبحث بغلطة إملائية يوصلوا لنفس المهني.
  assert.equal(catalog.matchesServiceQuery(service, "سباكة", "سباكه"), true);
  assert.equal(catalog.matchesServiceQuery(service, "سباكة", "سباك"), true);
  assert.equal(catalog.matchesServiceQuery(service, "سباكة", "سبااك"), true);
  assert.equal(catalog.matchesServiceQuery(service, "سباكة", "كهرباء"), false);
  // الاقتراحات بترشّح الأقرب حتى مع غلطة.
  const categories = [{ id: "plumbing", name: "سباكة", description: "", parentId: "maintenance", active: true, sortOrder: 1, imageVersion: 0 }];
  const [suggestion] = catalog.suggestSpecialties("سباكه", categories, [{ category: "plumbing" }]);
  assert.equal(suggestion?.id, "plumbing");
});

test("per-provider usage counters are recorded server-side and shown to the admin", () => {
  const api = readFileSync(new URL("../src/app/api/hits/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("recordServiceHit") && api.includes("serviceId"));
  const insights = readFileSync(new URL("../src/app/api/insights/route.ts", import.meta.url), "utf8");
  assert.ok(insights.includes("serviceHits") && insights.includes("categoryHits") && insights.includes("viewer.role"));
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("directory_service_hits") && directory.includes("export async function recordServiceHit"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes("directory_service_hits"));
  const tracker = readFileSync(new URL("../src/lib/analytics-tracker.ts", import.meta.url), "utf8");
  assert.ok(tracker.includes("serviceId"));
  const admin = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  assert.ok(admin.includes("AdminUsageInsights"));
});

test("push keys are generated and stored server-side when env vars are absent", () => {
  const push = readFileSync(new URL("../src/lib/push.ts", import.meta.url), "utf8");
  assert.ok(push.includes("generateVAPIDKeys"));
  assert.ok(push.includes('"vapid_keys"'));
  assert.ok(push.includes("directorySettings"));
  assert.ok(push.includes("export async function pushConfigured"));
  // المفتاح الخاص لا يُرسل للمتصفح أبدًا: مسار API بيرجّع العام فقط.
  const api = readFileSync(new URL("../src/app/api/push/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("publicKey: await pushPublicKey()"));
  assert.ok(!api.includes("privateKey"));
  const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.ok(envExample.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY"));
});

test("install shortcuts and screen-reader helpers are wired", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const urls = manifest.shortcuts.map((shortcut) => shortcut.url);
  assert.deepEqual(urls, ["/telecom", "/categories/clinics", "/categories/crafts", "/categories/teachers"]);
  for (const shortcut of manifest.shortcuts) assert.ok(shortcut.name && shortcut.icons.length === 1);
  assert.equal(manifest.launch_handler.client_mode, "navigate-existing");
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes('className="skip-to-content"'));
  assert.ok(directory.includes('id="main-content"'));
  assert.ok(directory.includes('aria-live="polite"'));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".skip-to-content"));
});

test("notification bell lives in the header as an elegant dropdown menu", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes('className="header-notify"'));
  assert.ok(!directory.includes("footer-notify"));
  const bell = readFileSync(new URL("../src/components/notify-toggle.tsx", import.meta.url), "utf8");
  assert.ok(bell.includes('role="dialog"'));
  assert.ok(bell.includes("aria-expanded={open}"));
  assert.ok(bell.includes("createPortal"));
  assert.ok(bell.includes("Escape"));
  assert.ok(bell.includes("notify-menu-chips"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  for (const part of [".notify-bell-btn", ".notify-menu-head", ".notify-menu-chips", ".notify-menu-cta"]) assert.ok(css.includes(part), part);
  assert.ok(css.includes("html.dark .notify-menu"));
});

// ===== دفعة ١٣: عروض الأسعار من ٣ مهنيين + التذكيرات الموسمية =====

test("quote requests are validated before reaching providers", async () => {
  const quotes = await loadLib("../src/lib/quotes.ts");
  const good = quotes.cleanQuoteRequest({ name: " محمود  عبد الله ", phone: "01012345678", details: "تشطيب شقة ١٢٠ متر محارة وسيراميك", categoryId: "plumbing", area: "جنزور / السوق القديم" });
  assert.equal(good.ok, true);
  assert.equal(good.value.name, "محمود عبد الله");
  assert.equal(good.value.phone, "01012345678");
  for (const bad of [{ name: "", phone: "01012345678", details: "تشطيب شقة ١٢٠ متر", categoryId: "plumbing" }, { name: "محمود", phone: "12345", details: "تشطيب شقة ١٢٠ متر", categoryId: "plumbing" }, { name: "محمود", phone: "01012345678", details: "قصير", categoryId: "plumbing" }, { name: "محمود", phone: "01012345678", details: "تشطيب شقة ١٢٠ متر", categoryId: "../x" }]) {
    assert.equal(quotes.cleanQuoteRequest(bad).ok, false);
  }
  const message = quotes.quoteWhatsappMessage({ name: "محمود", phone: "01012345678", details: "تشطيب شقة", area: "السوق القديم" }, "أحمد", "السباكة", "دليل جنزور");
  assert.ok(message.includes("أحمد") && message.includes("تشطيب شقة") && message.includes("01012345678") && message.includes("من دليل جنزور"));
  assert.equal(quotes.QUOTE_TARGETS, 3);
  assert.ok(quotes.quoteSummary("ا".repeat(200), 50).length <= 51);
});

test("seasonal reminders produce ready texts for the right month", async () => {
  const seasonal = await loadLib("../src/lib/seasonal-reminders.ts");
  const may = seasonal.dueSeasonalReminders(new Date("2026-05-10T12:00:00Z"));
  assert.ok(may.some((item) => item.id === "ac-before-summer"));
  const november = seasonal.dueSeasonalReminders(new Date("2026-11-02T12:00:00Z"));
  assert.ok(november.some((item) => item.id === "water-heater-before-winter"));
  assert.equal(seasonal.currentMonth(new Date("2026-11-02T12:00:00Z")), 11);
  for (const reminder of seasonal.SEASONAL_REMINDERS) {
    assert.ok(reminder.title.length >= 2 && reminder.title.length <= 60, reminder.id);
    assert.ok(reminder.body.length >= 2 && reminder.body.length <= 160, reminder.id);
    assert.ok(seasonal.seasonalUrl(reminder).startsWith("/"));
  }
  assert.equal(seasonal.seasonalUrl({ ...seasonal.SEASONAL_REMINDERS[0], url: "https://evil.example" }), "/");
  const ids = seasonal.SEASONAL_REMINDERS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(seasonal.upcomingSeasonalReminders(new Date("2026-05-10T12:00:00Z")).length > 0);
});

test("quotes and seasonal screens are wired end to end", () => {
  const quotesApi = readFileSync(new URL("../src/app/api/quotes/route.ts", import.meta.url), "utf8");
  assert.ok(quotesApi.includes("cleanQuoteRequest") && quotesApi.includes("rateLimit(request, \"quote-request\"") && quotesApi.includes("QUOTE_TARGETS"));
  const seasonalApi = readFileSync(new URL("../src/app/api/seasonal/route.ts", import.meta.url), "utf8");
  assert.ok(seasonalApi.includes("dueSeasonalReminders") && seasonalApi.includes("sendPushToAll"));
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes("QuoteRequestModal") && directory.includes('className="quote-request-btn"') && directory.includes('setModal("quote")'));
  const admin = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  for (const part of ["AdminQuotes", "AdminSeasonal"]) assert.ok(admin.includes(part));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes("directory_quote_requests"));
});

// ===== دفعة ١٤: دفتر الأرقام + ترحيب المهنيين + مهنة ناقصة + صحة الدليل =====

test("directory health ranks stale, incomplete and empty specialties", async () => {
  const health = await loadLib("../src/lib/directory-health.ts");
  const now = Date.parse("2026-10-31T12:00:00Z");
  const services = [
    { id: "1", name: "أحمد", category: "plumbing", address: "جنزور", serviceItems: ["كشف"], subSpecialties: ["منازل"], confirmedAt: "2026-10-25T12:00:00Z", createdAt: "2025-01-01T12:00:00Z" },
    { id: "2", name: "محمود", category: "electricity", address: "", serviceItems: [], subSpecialties: [], confirmedAt: "2025-01-01T12:00:00Z", createdAt: "2025-01-01T12:00:00Z" },
  ];
  const categories = [
    { id: "crafts", name: "الحرفيين", parentId: null, active: true },
    { id: "plumbing", name: "السباكة", parentId: "crafts", active: true },
    { id: "electricity", name: "الكهرباء", parentId: "crafts", active: true },
    { id: "carpentry", name: "النجارة", parentId: "crafts", active: true },
  ];
  const report = health.directoryHealth({ services, categories }, now);
  assert.equal(report.providers, 2);
  assert.deepEqual(report.stale.map((item) => item.id), ["2"]);
  assert.deepEqual(report.incomplete.map((item) => item.id), ["2"]);
  assert.deepEqual(report.incomplete[0].missing, ["العنوان", "الخدمات التفصيلية", "التخصصات الفرعية"]);
  assert.deepEqual(report.emptySpecialties.map((item) => item.id), ["carpentry"]);
  assert.ok(report.score > 0 && report.score < 100);
  assert.equal(health.daysSinceUpdate({ createdAt: "2026-10-01T12:00:00Z" }, now), 30);
  assert.equal(health.missingData({ address: "x", serviceItems: ["a"], subSpecialties: ["b"] }).length, 0);
  assert.equal(health.healthVerdict(95).tone, "good");
  assert.equal(health.healthVerdict(20).tone, "bad");
  assert.equal(health.directoryHealth({ services: [], categories: [] }, now).score, 0);
});

test("missing-profession requests validate and build a fulfilled message", async () => {
  const missing = await loadLib("../src/lib/missing-profession.ts");
  const good = missing.cleanMissingRequest({ need: "  حد بيصلح تكييف عربيات  ", name: " محمود ", phone: "", categoryId: "" });
  assert.equal(good.ok, true);
  assert.equal(good.value.need, "حد بيصلح تكييف عربيات");
  assert.equal(good.value.name, "محمود");
  assert.equal(missing.cleanMissingRequest({ need: "قصير" }).ok, false);
  assert.equal(missing.cleanMissingRequest({ need: "حد بيصلح تكييف عربيات", phone: "123" }).ok, false);
  assert.equal(missing.cleanMissingRequest({ need: "حد بيصلح تكييف عربيات", categoryId: "../x" }).ok, false);
  const message = missing.missingFulfilledMessage({ name: "محمود", need: "تكييف عربيات", title: "ميكانيكا السيارات", url: "/categories/crafts" });
  assert.ok(message.includes("محمود") && message.includes("تكييف عربيات") && message.includes("/categories/crafts"));
  assert.equal(missing.missingKindLabel("محتاج نجار"), "مهني");
  assert.equal(missing.missingKindLabel("محل حلويات"), "مكان");
  assert.ok(missing.missingSummary("ا".repeat(200), 40).length <= 41);
});

test("provider welcome message carries the direct page link", async () => {
  const onboarding = await loadLib("../src/lib/provider-onboarding.ts");
  const message = onboarding.providerWelcomeMessage({ name: "أحمد", categoryName: "السباكة", serviceId: "abc-123", siteName: "دليل جنزور" });
  assert.ok(message.includes("أحمد") && message.includes("السباكة") && message.includes("دليل جنزور"));
  assert.ok(message.includes("/?service=abc-123"));
  assert.equal(onboarding.providerPublicUrl("a b", "https://x.test/"), "https://x.test/?service=a%20b");
  assert.ok(onboarding.providerStickerRequestMessage("أحمد").includes("أحمد"));
});

test("booklet, welcoming, missing-profession and health screens are wired", () => {
  const page = readFileSync(new URL("../src/app/dafter/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("DafterBook") && page.includes("getPublicDirectory"));
  const book = readFileSync(new URL("../src/components/dafter-book.tsx", import.meta.url), "utf8");
  assert.ok(book.includes("window.print") && book.includes("QrSvg"));
  const api = readFileSync(new URL("../src/app/api/missing/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("cleanMissingRequest") && api.includes("rateLimit(request, \"missing-profession\"") && api.includes("validId"));
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes("MissingProfessionModal") && directory.includes('setModal("missing")') && directory.includes('href="/dafter"'));
  const admin = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  for (const part of ["AdminHealth", "AdminOnboarding", "AdminMissing"]) assert.ok(admin.includes(part));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes("directory_missing_requests"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes("@media print") && css.includes(".dafter-sheet"));
});

// ===== دفعة ١٥: الرسائل الترحيبية العائمة =====

test("welcome messages cover member, pending and approved moments", async () => {
  const welcome = await loadLib("../src/lib/welcome-messages.ts");
  const member = welcome.memberWelcome("محمود عبد الله", "دليل جنزور");
  assert.equal(member.tone, "member");
  assert.ok(member.title.includes("محمود") && member.title.includes("دليل جنزور"));
  assert.ok(member.bullets.length >= 2);
  assert.equal(welcome.memberWelcome("").title.includes("صديقنا"), true);

  const pending = welcome.providerPending("أحمد", "/my/token");
  assert.equal(pending.tone, "pending");
  assert.ok(pending.title.length > 5);
  assert.equal(pending.primary?.href, "/my/token");

  const approved = welcome.providerApproved("أحمد", "/?service=1", "/my/token");
  assert.equal(approved.tone, "approved");
  assert.ok(approved.title.includes("اتنشرت"));
  assert.equal(approved.primary?.href, "/?service=1");
  assert.equal(approved.secondary?.href, "/my/token");

  const needsInfo = welcome.providerAttention("needs-info", "لازم صورة المحل", "/my/token");
  assert.ok(needsInfo.bullets[0].includes("لازم صورة المحل"));
  assert.equal(welcome.providerAttention("rejected", "", "/my/token").tone, "rejected");
});

test("welcome messages show exactly once, for good", async () => {
  const welcome = await loadLib("../src/lib/welcome-messages.ts");
  const svc = "3f2b1c40-9d1e-4b2a-8f0e-0f5c2a4d7b11";
  const member = "7c1d8a2e-5b6f-4c3d-9e0a-123456789abc";
  // المفتاح ثابت ومربوط بنوع الرسالة + صاحبها، مش بوقت تغيير الحالة.
  assert.equal(welcome.providerStatusKey(svc, "approved"), `approved:${svc}`);
  assert.equal(welcome.providerStatusKey(svc, "approved"), welcome.providerStatusKey(svc, "approved"));
  assert.equal(welcome.memberWelcomeKey(member), `member:${member}`);
  assert.equal(welcome.welcomeKey("pending", svc), `pending:${svc}`);
  assert.notEqual(welcome.providerStatusKey(svc, "approved"), welcome.providerStatusKey(svc, "pending"));

  // التخزين المحلي: قائمة مفاتيح بدون تكرار.
  const first = welcome.rememberSeenKey(null, `approved:${svc}`);
  assert.deepEqual(welcome.parseSeenKeys(first), [`approved:${svc}`]);
  assert.equal(welcome.welcomeAlreadySeen(`approved:${svc}`, welcome.parseSeenKeys(first)), true);
  assert.equal(welcome.welcomeAlreadySeen(`pending:${svc}`, welcome.parseSeenKeys(first)), false);
  const dup = welcome.rememberSeenKey(first, `approved:${svc}`);
  assert.deepEqual(welcome.parseSeenKeys(dup), [`approved:${svc}`]);
  assert.deepEqual(welcome.parseSeenKeys("{bad"), []);
  assert.deepEqual(welcome.parseSeenKeys('["admin:x"]'), []);
  // «اتشافت على الخادم» تمنع الظهور حتى لو الجهاز جديد.
  assert.equal(welcome.welcomeAlreadySeen(`approved:${svc}`, [], [`approved:${svc}`]), true);
  // مفيش مفتاح = مفيش رسالة، فبنتعامل معاها كـ«اتشافت» حتى ما يظهرش أي كارت فاضي.
  assert.equal(welcome.welcomeAlreadySeen("", [], []), true);

  // صيغة المفاتيح المقبولة على الخادم.
  assert.equal(welcome.isValidWelcomeKey(`member:${member}`), true);
  assert.equal(welcome.isValidWelcomeKey(`approved:${svc}`), true);
  assert.equal(welcome.isValidWelcomeKey("approved:not-a-uuid"), false);
  assert.equal(welcome.isValidWelcomeKey("admin:member:1"), false);
  assert.equal(welcome.isValidWelcomeKey(42), false);
});

test("welcome screens are wired to register, provider account and tracking", () => {
  const auth = readFileSync(new URL("../src/components/auth-form.tsx", import.meta.url), "utf8");
  assert.ok(auth.includes("welcome=member"));
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes("<WelcomeCenter />"));
  const api = readFileSync(new URL("../src/app/api/welcome/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("statusUpdatedAt") && api.includes("ownedServiceIds"));
  // «مرة واحدة فقط»: تسجيل المشاهدة على الخادم + قراءتها قبل العرض.
  assert.ok(api.includes("welcomeSeen") && api.includes("onConflictDoNothing") && api.includes("isValidWelcomeKey"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes("directory_welcome_seen"));
  const client = readFileSync(new URL("../src/lib/welcome-seen-client.ts", import.meta.url), "utf8");
  assert.ok(client.includes("markWelcomeSeen"));
  const myPage = readFileSync(new URL("../src/app/my/[token]/page.tsx", import.meta.url), "utf8");
  assert.ok(myPage.includes("ProviderStatusWelcome"));
  const trackPage = readFileSync(new URL("../src/app/track/[token]/page.tsx", import.meta.url), "utf8");
  assert.ok(trackPage.includes("ProviderStatusWelcome"));
  const forms = readFileSync(new URL("../src/components/request-forms.tsx", import.meta.url), "utf8");
  assert.ok(forms.includes("ServiceSubmittedWelcome"));
  assert.ok(api.includes("seen:") || api.includes("seen:"));
  const admin = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(admin.includes("statusUpdatedAt: new Date()"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  for (const part of [".welcome-overlay", ".welcome-card", ".welcome-bullets", ".welcome-primary"]) assert.ok(css.includes(part), part);
});

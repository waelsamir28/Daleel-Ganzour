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

test("the public notification bell is gone, admin notifications stay", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  // جرس إشعارات الزوار اتشال خالص من الهيدر ومن القائمة.
  assert.equal(directory.includes("NotifyToggle"), false);
  assert.equal(directory.includes("notify-bell"), false);
  // إشعارات الإدارة باقية في القائمة.
  assert.ok(directory.includes("إشعارات الإدارة"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".notify-menu-head"));
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
  // زر «اطلب عرض سعر» اتشال نهائيًا من الواجهة — الخدمة نفسها موجودة في الخادم ولوحة الإدارة.
  assert.equal(directory.includes("quote-request-btn"), false);
  assert.equal(directory.includes('setModal("quote")'), false);
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

test("section heading is one line on the right with the count under it and the buttons on the other side", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  const headingStart = directory.lastIndexOf('className="section-heading directory-section-heading"');
  const heading = directory.slice(headingStart, headingStart + 1800);
  // العنوان + العدّاد في عمود واحد، والأزرار في عمود تاني.
  assert.ok(heading.includes('className="section-heading-title"'));
  assert.ok(heading.indexOf("section-heading-count") > heading.indexOf("section-heading-title"));
  assert.ok(heading.indexOf("section-heading-count") < heading.indexOf('className="section-heading-actions"'));
  // زر المتابعة أيقونة فقط، وزر عرض السعر جنبه في نفس الصف.
  assert.ok(heading.includes("follow-toggle-icon"));
  assert.ok(heading.includes('aria-label={isFollowed ? "إلغاء متابعة التخصص" : "متابعة التخصص"}'));
  // زر «اطلب عرض سعر» اتشال نهائي من برواز العنوان.
  assert.equal(heading.includes("quote-request-btn"), false);
  assert.ok(heading.includes("follow-toggle-icon"));
  // سطر «كام مهنة مرتبطة» تحت العنوان.
  assert.ok(heading.includes("{providerCountLabel}"));
  assert.ok(directory.includes("`${filteredServices.length} مهنة مرتبطة`"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".providers-section .directory-section-heading h2 {\n  white-space: nowrap;"));
  // الهيدر صف أفقي: العنوان في عمود والأزرار في العمود الآخر.
  assert.ok(css.includes("flex-direction: row !important;\n  align-items: center !important;\n  justify-content: space-between !important;"));
  assert.ok(css.includes(".follow-toggle-icon {\n  display: inline-grid;"));
});

test("admin category rows keep the title on a single line on mobile", () => {
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes('"icon name badge"'));
  assert.ok(css.includes('"icon meta actions"'));
  assert.ok(css.includes(".category-management-row > div:nth-child(2) { display: contents; }"));
  assert.ok(css.includes("text-overflow: ellipsis;"));
});

test("header tools moved into the menu: sound sheet and red members badge", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  const headerEnd = directory.indexOf('</header>');
  const headerStart = directory.indexOf('<header');
  const header = directory.slice(headerStart, headerEnd);
  // مفيش جرس إشعارات ولا أيقونة صوت في الهيدر.
  assert.equal(header.includes('className="sound-toggle'), false);
  assert.equal(header.includes("NotifyToggle"), false);
  // الأدوات موجودة كصفوف في القائمة باسم واضح.
  assert.ok(directory.includes('className="menu-tools-row"'));
  assert.equal(directory.includes("إشعارات جنزور"), false);
  assert.ok(directory.includes('className="menu-sound-item"'));
  assert.ok(directory.includes("setSoundSheetOpen(true)"));
  // الشاشة العائمة: أيقونتين — تفعيل وكتم — وتقفل لوحدها بعد الاختيار.
  const sheet = readFileSync(new URL("../src/components/sound-sheet.tsx", import.meta.url), "utf8");
  assert.ok(sheet.includes("تفعيل الصوت") && sheet.includes("كتم الصوت"));
  assert.ok(sheet.includes("onPick(false); onClose();") && sheet.includes("onPick(true); onClose();"));
  assert.ok(sheet.includes("Volume2") && sheet.includes("VolumeX"));
  // زر عدد الأعضاء أحمر والكتابة بيضاء.
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".header-menu-member-badge {\n  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);"));
  // الجرس الدهبي بلمعان.
  assert.ok(css.includes("animation: follow-bell-shine"));
  assert.ok(css.includes("linear-gradient(160deg, #ffd54a 0%, #f6b81a 45%, #d99512 100%)"));
});

test("the ask-for-price button is gone for good", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.equal(directory.includes("quote-request-btn"), false);
  assert.equal(directory.includes("QuoteRequestModal"), false);
});

test("ad strip spans the full width with its original height + red missing-profession button", () => {
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  // الإعلان بعرض الشريط الكامل، والارتفاع رجع لطبيعته 3:1 (مش شريط رفيع).
  assert.ok(css.includes("  width: 100%;\n  max-width: none;\n  margin: 0 auto 12px;"));
  assert.ok(css.includes(".ad-rotator-stage {\n  width: 100%;\n  aspect-ratio: 3 / 1;\n  height: auto;\n  min-height: 110px;\n  max-height: 240px;"));
  assert.equal(css.includes("--strip-h"), false);
  // زر «مهنة ناقصة» أحمر بنفس مقاس الزرّين التانيين.
  assert.ok(css.includes(".categories-top-action-frame .missing-profession-btn {"));
  assert.ok(css.includes("grid-template-columns: repeat(3, minmax(0, 1fr));"));

  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  // الزر اتحذف من الفوتر.
  const footer = directory.slice(directory.indexOf("<footer"), directory.indexOf("</footer>"));
  assert.equal(footer.includes("مهنة ناقصة"), false);
  // وبقى في إطار البحث والإضافة (النسختين) بنفس مقاس البحث وأضف مهنتك.
  assert.equal((directory.match(/className="missing-profession-btn"/g) ?? []).length, 2);
  const frame = directory.slice(directory.indexOf('className="categories-top-action-frame"'), directory.indexOf('className="categories-top-action-frame"') + 1200);
  assert.ok(frame.includes("missing-profession-btn"));
  assert.ok(frame.includes("compact-add-service-btn"));
  assert.ok(frame.includes("search-icon-only-trigger-btn"));
});

// ===== جولة ٢٠: انتهاء الإعلانات تلقائيًا + دفتر أرقام مقسّم + باركود =====

const adExpiry = await loadLib("../src/lib/ad-expiry.ts");
const barcode = await loadLib("../src/lib/barcode.ts");

test("ads stop on their own and the admin is warned two days before", () => {
  const DAY = 86_400_000;
  const now = Date.parse("2026-11-01T12:00:00Z");
  const base = { active: true, hasImage: true, startsAt: null };
  // شغال وباقي له كتير.
  assert.equal(adExpiry.adExpiryInfo({ ...base, endsAt: new Date(now + 10 * DAY).toISOString() }, now).state, "live");
  // هينتهي خلال يومين → تنبيه.
  const soon = adExpiry.adExpiryInfo({ ...base, endsAt: new Date(now + 1.2 * DAY).toISOString() }, now);
  assert.equal(soon.state, "expiring");
  assert.equal(soon.daysLeft, 2);
  // بعد الميعاد → انتهى (وبالتالي isAdLive بيخفيه تلقائيًا).
  assert.equal(adExpiry.adExpiryInfo({ ...base, endsAt: new Date(now - 1000).toISOString() }, now).state, "expired");
  // بلا تاريخ نهاية → شغال، والموقوف والمجدول حالات مستقلة.
  assert.equal(adExpiry.adExpiryInfo({ ...base, endsAt: null }, now).state, "live");
  assert.equal(adExpiry.adExpiryInfo({ ...base, endsAt: null, active: false }, now).state, "paused");
  assert.equal(adExpiry.adExpiryInfo({ ...base, endsAt: null, startsAt: new Date(now + 3 * DAY).toISOString() }, now).state, "scheduled");

  const ads = [
    { id: "a", title: "إعلان أ", ...base, endsAt: new Date(now + 0.5 * DAY).toISOString() },
    { id: "b", title: "إعلان ب", ...base, endsAt: new Date(now + 9 * DAY).toISOString() },
  ];
  const due = adExpiry.expiringAds(ads, now);
  assert.deepEqual(due.map((ad) => ad.id), ["a"]);
  assert.equal(adExpiry.adExpirySummary(ads, now).expiring, 1);
  // منع تكرار التنبيه لنفس الإعلان بنفس تاريخ النهاية.
  assert.equal(adExpiry.adExpiryAlertKey(ads[0]), adExpiry.adExpiryAlertKey({ ...ads[0] }));
  assert.ok(adExpiry.adExpiryAlertMessage(ads[0], 1).includes("إعلان أ"));
  // التمديد بيحسب من آخر يوم (مش من النهاردة) لو الإعلان لسه شغال.
  const extended = Date.parse(adExpiry.extendAdEndsAt(new Date(now + 9 * DAY).toISOString(), 30, now));
  assert.equal(Math.round((extended - (now + 9 * DAY)) / DAY), 30);
  // لو انتهى، التمديد بيبدأ من الآن.
  const revived = Date.parse(adExpiry.extendAdEndsAt(new Date(now - 5 * DAY).toISOString(), 7, now));
  assert.equal(Math.round((revived - now) / DAY), 7);

  const api = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes('action === "extend"') && api.includes("extendAdEndsAt"));
  const server = readFileSync(new URL("../src/lib/ad-expiry-server.ts", import.meta.url), "utf8");
  assert.ok(server.includes("alertExpiringAds") && server.includes("ad_expiry_alerts"));
  const adminPage = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
  assert.ok(adminPage.includes("alertExpiringAds"));
  const adminAds = readFileSync(new URL("../src/components/admin-ads.tsx", import.meta.url), "utf8");
  assert.ok(adminAds.includes("admin-ad-expiry-panel") && adminAds.includes("expiringAds(ads)"));
  const kinds = readFileSync(new URL("../src/lib/whatsapp-alert-kinds.ts", import.meta.url), "utf8");
  assert.ok(kinds.includes("ad-expiry"));
});

test("section barcodes encode a scannable Code 39 pattern", () => {
  const units = barcode.code39Modules("CLINICS");
  assert.ok(units.length > 20);
  assert.equal(units[0].bar, true);
  assert.equal(units[units.length - 1].bar, true);
  // كل حرف ١٥ وحدة + مسافة فاصلة، ومع علامتي البداية والنهاية.
  assert.equal(barcode.code39Width("CLINICS"), (7 + 2) * 15 + (7 + 1));
  // التنظيف: حروف كبيرة وأرقام بس، وأي رمز غريب بيتحول لشرطة.
  assert.equal(barcode.barcodeValue("clinics"), "CLINICS");
  assert.equal(barcode.barcodeValue("a_b"), "A-B");
  assert.equal(barcode.code39Modules("").length, 0);
  const svg = readFileSync(new URL("../src/components/barcode-svg.tsx", import.meta.url), "utf8");
  assert.ok(svg.includes("code39Modules") && svg.includes("<svg"));
});

test("printed booklet: one section at a time, two-row entries, ruled table, watermark", () => {
  const book = readFileSync(new URL("../src/components/dafter-book.tsx", import.meta.url), "utf8");
  // اختيار قسم واحد وطباعته لوحده.
  assert.ok(book.includes("خيار القسم") === false);
  assert.ok(book.includes("dafter-filter") && book.includes("dafter-chip"));
  assert.ok(book.includes("useState<string>(ALL)"));
  assert.ok(book.includes("is-single"));
  // كل قسم ليه باركوده الخاص.
  assert.ok(book.includes("sectionBarcode") && book.includes("<BarcodeSvg value={code}"));
  // كل رقم في صفين (اسم فوق ونمرة تحت) جوه جدول مسطّر.
  assert.ok(book.includes("dafter-cell") && book.includes("dafter-line") && book.includes("dafter-phone"));
  // التذييل: اسم التطبيق + التصميم والتنفيذ + اللوجو كعلامة مائية.
  assert.ok(book.includes("تصميم وتنفيذ وائل الجمال"));
  assert.ok(book.includes("dafter-sheet-foot"));
  assert.ok(book.includes("dafter-watermark"));

  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".dafter-grid { display: grid; grid-template-columns: 1fr 1fr;"));
  assert.ok(css.includes(".dafter-watermark img { width: 150px; height: auto; opacity: .07;"));
  assert.ok(css.includes(".dafter-title {") && css.includes("text-align: center;"));
  assert.ok(css.includes(".dafter-cell {\n  display: grid;"));
  const page = readFileSync(new URL("../src/app/dafter/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("logoUrl") && page.includes("designCredit"));
});

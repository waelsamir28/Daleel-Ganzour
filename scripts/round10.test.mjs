import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("seasonal screen is wired end to end and quote requests are gone", () => {
  for (const gone of ["../src/app/api/quotes/route.ts", "../src/lib/quotes.ts", "../src/components/admin-quotes.tsx"]) {
    assert.throws(() => readFileSync(new URL(gone, import.meta.url), "utf8"), gone);
  }
  const seasonalApi = readFileSync(new URL("../src/app/api/seasonal/route.ts", import.meta.url), "utf8");
  assert.ok(seasonalApi.includes("dueSeasonalReminders") && seasonalApi.includes("sendPushToAll"));
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  // زر «اطلب عرض سعر» اتشال نهائيًا من الواجهة — الخدمة نفسها موجودة في الخادم ولوحة الإدارة.
  assert.equal(directory.includes("quote-request-btn"), false);
  assert.equal(directory.includes('setModal("quote")'), false);
  const admin = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  assert.ok(admin.includes("AdminSeasonal"));
  assert.equal(admin.includes("AdminQuotes"), false);
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.equal(schema.includes("directory_quote_requests"), false);
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

test("the booklet downloads as a real PDF in one click, with a print fallback", () => {
  const book = readFileSync(new URL("../src/components/dafter-book.tsx", import.meta.url), "utf8");
  assert.ok(book.includes('import("jspdf")') && book.includes('import("html-to-image")'));
  assert.ok(book.includes("pdf.save(") && book.includes("toCanvas("));
  assert.ok(book.includes("حمّل الدفتر PDF"));
  // لو المتصفح ما قدرش يجهّز الملف، بيرجع لنافذة الطباعة تلقائيًا.
  assert.ok(book.includes("window.print()"));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.dependencies.jspdf && pkg.dependencies["html-to-image"]);
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".dafter-pdf-note {"));
});

test("sponsorship packages are gone from the whole app", () => {
  const admin = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  assert.equal(admin.includes("AdminSponsors"), false);
  assert.equal(admin.includes("باقات الرعاية"), false);
  assert.equal(admin.includes('"sponsors"'), false);
  const pkg = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  assert.ok(pkg.length > 0);
  const catalog = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
  for (const gone of ["SponsoredProviderConfig", "parseSponsoredProviders", "getSponsorTrialStatus", "sponsorModalEnabled", "sponsoredProvidersJson"]) {
    assert.equal(catalog.includes(gone), false, `${gone} should be deleted`);
  }
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.equal(/sponsor/i.test(css), false);
  for (const file of ["admin-sponsors.tsx", "sponsorship-modal.tsx"]) {
    assert.throws(() => readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8"), file);
  }
});

test("provider work gallery: four photos, 3 MB input, compressed to kilobytes", async () => {
  const gallery = await loadLib("../src/lib/service-gallery-rules.ts");
  assert.equal(gallery.SERVICE_GALLERY_MAX, 4);
  assert.equal(gallery.SERVICE_GALLERY_MAX_FILE, 3 * 1024 * 1024);
  assert.equal(gallery.SERVICE_GALLERY_MAX_BYTES, 300 * 1024);
  assert.equal(gallery.gallerySlotList("2,4").join(","), "2,4");
  // قراءة الصور: يرفض غير الصور ويقبل data URL مضغوط، ويحسب الحجم من base64.
  assert.equal(gallery.parseGalleryPhoto(null), null);
  assert.throws(() => gallery.parseGalleryPhoto("data:text/plain;base64,AAAA"));
  assert.equal(gallery.parseGalleryPhoto("data:image/webp;base64," + "A".repeat(400)).mime, "image/webp");
  // الخانات: 1..4 فقط، والقائمة المخزَّنة تُنظَّف وتُرتَّب.
  assert.equal(gallery.gallerySlotList("3,1,1,9").join(","), "1,3");
  assert.equal(gallery.gallerySlotNumber("2"), 2);
  assert.throws(() => gallery.gallerySlotNumber(5));
  assert.throws(() => gallery.gallerySlotNumber(0));

  const client = readFileSync(new URL("../src/components/provider-gallery.tsx", import.meta.url), "utf8");
  // تعليمات الحجم مكتوبة صراحة للعميل داخل شاشة الرفع.
  assert.ok(client.includes("٣ ميجابايت"));
  assert.ok(client.includes("بالكيلوبايت"));
  assert.ok(client.includes("shrinkImageFile"));
  assert.ok(client.includes("SERVICE_GALLERY_MAX_FILE"));
  const account = readFileSync(new URL("../src/components/provider-account.tsx", import.meta.url), "utf8");
  assert.ok(account.includes("ProviderGallery") && account.includes('call("gallery"'));
  const route = readFileSync(new URL("../src/app/api/my/route.ts", import.meta.url), "utf8");
  assert.ok(route.includes('body.action === "gallery"') && route.includes("saveServiceGalleryPhoto"));
  const file = readFileSync(new URL("../src/app/api/service-gallery/[id]/[slot]/route.ts", import.meta.url), "utf8");
  assert.ok(file.includes("serviceGallery") && file.includes("IMMUTABLE_IMAGE_HEADERS"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes('"directory_service_gallery"') && schema.includes("gallerySlots"));
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("CREATE TABLE IF NOT EXISTS directory_service_gallery"));
  const strip = readFileSync(new URL("../src/components/service-gallery-strip.tsx", import.meta.url), "utf8");
  assert.ok(strip.includes("serviceGalleryUrls") && strip.includes("صور من شغله"));
  const page = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("<ServiceGalleryStrip service={liveDetail ?? detail}"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".gallery-grid {") && css.includes(".gallery-rules {") && css.includes(".detail-gallery-strip {"));
});

test("suggestion 9: directory status shows on the lock splash screen", () => {
  const splash = readFileSync(new URL("../src/components/splash-screen.tsx", import.meta.url), "utf8");
  assert.ok(splash.includes("/api/status"));
  assert.ok(splash.includes("حالة الدليل الآن"));
  assert.ok(splash.includes("مقدّم خدمة") && splash.includes("مهنة وخدمة"));
  const status = readFileSync(new URL("../src/app/api/status/route.ts", import.meta.url), "utf8");
  assert.ok(status.includes("professions") && status.includes("providers") && status.includes("visits"));
  // حالة الدليل لا تعطّل الشاشة ولا ترمي أخطاء لو القاعدة غير متصلة.
  assert.ok(splash.includes("AbortController") && splash.includes(".catch("));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".splash-status-pill {") && css.includes(".splash-status-row {"));
});

test("splash audio: uploaded from the admin studio and respects autoplay limits", async () => {
  const catalog = await loadLib("../src/lib/catalog.ts");
  assert.equal(catalog.SPLASH_AUDIO_KEY, "splash");
  assert.equal(catalog.DESIGN_AUDIO_MAX_BYTES, 2 * 1024 * 1024);
  assert.equal(catalog.isDesignAudioKey("splash"), true);
  assert.equal(catalog.isDesignAudioKey("other"), false);
  // data URL: يرفض غير الصوت ويقبل mp3، ويحسب الحجم من base64.
  assert.throws(() => catalog.parseDesignAudioDataUrl("data:image/png;base64,AAAA"));
  assert.equal(catalog.parseDesignAudioDataUrl("data:audio/mpeg;base64," + "A".repeat(4000)).mime, "audio/mpeg");
  assert.equal(catalog.designAudioUrl("splash", 3), "/api/design-audio/splash?v=3");
  assert.equal(catalog.defaultDesignSettings.splashAudioEnabled, false);
  assert.equal(catalog.defaultDesignSettings.splashAudioUrl, "");

  const admin = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(admin.includes('body.type === "design-audio"') && admin.includes("parseDesignAudioDataUrl"));
  const route = readFileSync(new URL("../src/app/api/design-audio/[key]/route.ts", import.meta.url), "utf8");
  assert.ok(route.includes("Accept-Ranges") && route.includes("Content-Range"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes('"directory_design_audio"'));
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("CREATE TABLE IF NOT EXISTS directory_design_audio"));

  const applicator = readFileSync(new URL("../src/components/design-applicator.tsx", import.meta.url), "utf8");
  assert.ok(applicator.includes("data-design-splash-audio-enabled"));

  const player = readFileSync(new URL("../src/components/splash-audio.tsx", import.meta.url), "utf8");
  // التشغيل التلقائي محاولة أولى، ثم أول تفاعل، مع احترام الكتم ومرة واحدة في الجلسة.
  assert.ok(player.includes("audio.play()"));
  assert.ok(player.includes("pointerdown") && player.includes("keydown"));
  assert.ok(player.includes("isSoundMuted") && player.includes("SOUND_MUTE_EVENT"));
  assert.ok(player.includes("janzour-splash-audio-played"));
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes("<SplashAudio />"));

  const studio = readFileSync(new URL("../src/components/design-customizer.tsx", import.meta.url), "utf8");
  assert.ok(studio.includes("AudioUploadField") && studio.includes("splashAudioEnabled"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".audio-upload-drop {") && css.includes(".audio-upload-player {"));
});

test("analytics page is a hub of buttons, each opening its own floating screen", () => {
  const admin = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  // كل قسم له زر، والزر يفتح شاشة عائمة (Modal) بزر إغلاق.
  assert.ok(admin.includes("analytics-tile-btn"));
  assert.ok(admin.includes("const tiles: Tile[]") && admin.includes("setOpen(tile.id)"));
  assert.ok(admin.includes("<Modal") && admin.includes("analytics-section-modal"));
  assert.ok(admin.includes("onClose={() => setOpen(null)}"));
  for (const section of ["summary", "search", "categories", "areas", "top", "underserved", "usage", "errors", "seasonal", "welcome", "push", "health", "missing", "quickRatings", "codes", "stickers"]) {
    assert.ok(admin.includes(`"${section}"`), section);
  }
  const css = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(css.includes(".analytics-tiles {") && css.includes(".analytics-tile-btn {"));
  assert.ok(css.includes(".analytics-section-modal .analytics-panel-head h3"));
  // توسيط المحتوى داخل الشاشات العائمة.
  assert.ok(css.includes(".analytics-section-modal { text-align: center; }"));
});

test("quote requests are deleted everywhere", () => {
  for (const gone of ["../src/app/api/quotes/route.ts", "../src/lib/quotes.ts", "../src/components/admin-quotes.tsx"]) {
    assert.throws(() => readFileSync(new URL(gone, import.meta.url), "utf8"), gone);
  }
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.equal(schema.includes("quoteRequests"), false);
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.equal(directory.includes("directory_quote_requests"), false);
});

test("browser errors: chunk failures recover and environment noise is filtered", async () => {
  const errorReport = await loadLib("../src/lib/error-report.ts");
  assert.equal(errorReport.isEnvironmentNoise("Script error."), true);
  assert.equal(errorReport.isEnvironmentNoise("Uncaught Error: Error invoking postMessage: Java object is gone"), true);
  assert.equal(errorReport.isEnvironmentNoise("ChunkLoadError: Loading chunk 12 failed"), true);
  assert.equal(errorReport.isEnvironmentNoise("TypeError: cannot read properties of undefined"), false);
  // البلاغات الضوضائية لا تُخزَّن ولا تبعت تنبيه.
  assert.equal(errorReport.sanitizeErrorReport({ message: "Script error.", path: "/" }), null);
  const reporter = readFileSync(new URL("../src/components/chunk-recovery.tsx", import.meta.url), "utf8");
  assert.ok(reporter.includes("ChunkLoadError") && reporter.includes("location.replace"));
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes("<ChunkRecovery />"));
});

test("member notifications bell and the completion handshake", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes("header-bell-btn") && directory.includes("openFeed"));
  const my = readFileSync(new URL("../src/app/api/my/route.ts", import.meta.url), "utf8");
  assert.ok(my.includes('body.action === "completion-done"'));
  const account = readFileSync(new URL("../src/components/provider-account.tsx", import.meta.url), "utf8");
  assert.ok(account.includes("تم الاستكمال ✓") && account.includes('call("completion-done"'));
  const admin = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  assert.ok(admin.includes("تم التنفيذ ✓"));
  // استكمال زر «استكمال» بيختفي لما المهني يأكّد.
  assert.ok(admin.includes('cStatus === "submitted" || cStatus === "done"'));
  const catalog = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
  assert.ok(catalog.includes('"none" | "requested" | "submitted" | "rejected" | "done"'));
  // إشعار ترحيب داخلي بجوار رسالة الواتساب والملصق.
  const onboarding = readFileSync(new URL("../src/components/admin-onboarding.tsx", import.meta.url), "utf8");
  assert.ok(onboarding.includes("إشعار بالترحيب") && onboarding.includes("notify-provider"));
});

test("seasonal reminders explain the destination and the visitor push number", () => {
  const seasonal = readFileSync(new URL("../src/components/admin-seasonal.tsx", import.meta.url), "utf8");
  assert.ok(seasonal.includes("بتروح فين بالظبط") && seasonal.includes("إشعار متصفح"));
  assert.ok(seasonal.includes("seasonal-upcoming-grid") && seasonal.includes("seasonal-send"));
  const api = readFileSync(new URL("../src/app/api/seasonal/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("subscribers") && api.includes("countPushSubscribers"));
  const push = readFileSync(new URL("../src/components/admin-push.tsx", import.meta.url), "utf8");
  assert.ok(push.includes("مين بيشوفه") && push.includes("عدد الأجهزة"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  const adminCss = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(adminCss.includes(".seasonal-upcoming-grid") && adminCss.includes(".push-explainer {"));
  assert.ok(css.includes(".header-bell-btn"));
  assert.equal(css.includes(".quote-admin-row"), false);
});

test("stickers: no faint dark text under the white footer", () => {
  const rating = readFileSync(new URL("../src/components/rating-sticker-modal.tsx", import.meta.url), "utf8");
  const section = readFileSync(new URL("../src/components/section-sticker-modal.tsx", import.meta.url), "utf8");
  // النص الرمادي الباهت اتشال، والكود مرفوع فوق الذيل الغامق فمافيش تراكب.
  assert.equal(rating.includes("رأيك يساعد جيرانك"), false);
  assert.ok(rating.includes("const qrSide = 640, qx = (A6_W - qrSide) / 2, qy = 740;"));
  assert.equal(section.includes("text.hint"), false);
  assert.ok(section.includes("const qrSide = 660, qx = (A6_W - qrSide) / 2, qy = 700;"));
});

test("splash audio can be muted from the splash screen, and providers get a welcome audio", () => {
  const splash = readFileSync(new URL("../src/components/splash-screen.tsx", import.meta.url), "utf8");
  assert.ok(splash.includes("splash-audio-toggle") && splash.includes("SPLASH_AUDIO_STOP_EVENT"));
  const player = readFileSync(new URL("../src/components/splash-audio.tsx", import.meta.url), "utf8");
  assert.ok(player.includes("SPLASH_AUDIO_STOP_EVENT") && player.includes("audio.pause()"));
  const welcome = readFileSync(new URL("../src/components/welcome-audio.tsx", import.meta.url), "utf8");
  assert.ok(welcome.includes("/api/site-audio") && welcome.includes("setSoundMuted"));
  const page = readFileSync(new URL("../src/app/my/[token]/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("<WelcomeAudio token={token}/>"));
  const catalog = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
  assert.ok(catalog.includes("WELCOME_AUDIO_KEY") && catalog.includes("welcomeAudioEnabled"));
  const studio = readFileSync(new URL("../src/components/design-customizer.tsx", import.meta.url), "utf8");
  assert.ok(studio.includes('audioKey="welcome"'));
});

test("provider card stats endpoint feeds the daily «مهنتك على الدليل» notification", () => {
  const route = readFileSync(new URL("../src/app/api/my/insights/route.ts", import.meta.url), "utf8");
  assert.ok(route.includes("serviceHits") && route.includes("📊 مهنتك على الدليل"));
  assert.ok(route.includes("20 * 60 * 60 * 1000"));
  const account = readFileSync(new URL("../src/components/provider-account.tsx", import.meta.url), "utf8");
  assert.ok(account.includes("/api/my/insights") && account.includes("my-card-stats"));
});

test("browser errors: triage, status and the «تم الإصلاح» flow", async () => {
  const triage = await loadLib("../src/lib/error-triage.ts");
  assert.equal(triage.classifyError("Failed to load chunk /_next/static/chunks/11jyqajts.65y.js").kind, "chunk");
  assert.equal(triage.classifyError("Uncaught Error: Error invoking postMessage: Java object is gone").kind, "webview");
  assert.equal(triage.classifyError("Script error.").kind, "external-script");
  assert.equal(triage.classifyError("TypeError: cannot read properties of undefined").kind, "app");
  // لكل نوع شرح وخطوة علاج مكتوبة بالعربي.
  for (const message of ["Failed to load chunk x", "Script error.", "TypeError: boom"]) {
    const info = triage.classifyError(message);
    assert.ok(info.label.length > 3 && info.hint.length > 10, message);
  }
  // الحالة: مفتوح / مقفول / رجع بعد الإصلاح.
  assert.equal(triage.errorStatus({ lastAt: "2026-11-01T10:00:00Z" }), "open");
  assert.equal(triage.errorStatus({ lastAt: "2026-11-01T10:00:00Z", resolvedAt: "2026-11-01T12:00:00Z" }), "resolved");
  assert.equal(triage.errorStatus({ lastAt: "2026-11-01T15:00:00Z", resolvedAt: "2026-11-01T12:00:00Z" }), "regressed");
  const summary = triage.errorSummary([
    { count: 3, lastAt: "2026-11-01T10:00:00Z" },
    { count: 2, lastAt: "2026-11-01T10:00:00Z", resolvedAt: "2026-11-01T12:00:00Z" },
    { count: 1, lastAt: "2026-11-01T15:00:00Z", resolvedAt: "2026-11-01T12:00:00Z" },
  ]);
  assert.deepEqual({ ...summary }, { open: 1, resolved: 1, regressed: 1, occurrences: 6, kinds: 3 });
  assert.equal(triage.ageLabel("2026-11-01T10:00:00Z", Date.parse("2026-11-01T10:05:00Z")), "قبل 5 دقيقة");

  const api = readFileSync(new URL("../src/app/api/errors/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes("export async function PATCH"));
  assert.ok(api.includes("errorResolutions") && api.includes("onConflictDoUpdate"));
  assert.ok(api.includes("fingerprint") && api.includes("occurrences"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes('"directory_error_resolutions"'));
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("CREATE TABLE IF NOT EXISTS directory_error_resolutions"));

  const panel = readFileSync(new URL("../src/components/admin-error-log.tsx", import.meta.url), "utf8");
  assert.ok(panel.includes("تم الإصلاح") && panel.includes("إعادة فتح"));
  assert.ok(panel.includes("error-log-filter") && panel.includes('filter === "open"'));
  assert.ok(panel.includes("openDetail") && panel.includes("/api/errors?fingerprint="));
  const hub = readFileSync(new URL("../src/components/admin-analytics.tsx", import.meta.url), "utf8");
  assert.ok(hub.includes("errorStatus") && hub.includes("errorCounts"));
  const css = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(css.includes(".error-log-row.is-regressed") && css.includes(".error-detail-stack"));
});

test("completion: «استكمال» only notifies the owner, shows «تم الإرسال», and there is «استكمال الكل»", () => {
  const admin = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  // الضغط على «استكمال» بيبعت الطلب لصاحب المهنة — مفيش شاشة استكمال بتتفتح عند الإدارة.
  assert.ok(admin.includes("requestProviderCompletion"));
  assert.equal(/requestProviderCompletion[\s\S]{0,400}setEditing\(\{ kind: "service"/.test(admin), false);
  assert.ok(admin.includes("completionSent") && admin.includes("تم الإرسال"));
  assert.ok(admin.includes("completion-sent-chip"));
  // «استكمال الكل» بيحوّل كل الأزرار لـ«تم الإرسال».
  assert.ok(admin.includes("requestAllCompletions") && admin.includes("استكمال الكل"));
  assert.ok(admin.includes("setCompletionSent(incompleteServices.map"));
  const api = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes('action === "request-completion-all"'));
  assert.ok(api.includes("completionStatus: \"requested\""));
  const css = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(css.includes(".completion-sent-chip"));
});

test("analytics tiles are squares two per row with the icon on top, and seasonal cards share one size", () => {
  const css = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(css.includes("grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n.analytics-tile {"));
  assert.ok(css.includes("grid-template-areas: \"icon\" \"copy\" \"btn\";"));
  assert.ok(css.includes("aspect-ratio: 1 / 1;"));
  // المواسم: كروت القادم والمستحق بنفس المقاس، اتنين جنب بعض.
  assert.ok(css.includes(".seasonal-upcoming-card {"));
  assert.ok(css.includes(".seasonal-card {\n  grid-template-columns: 1fr;"));
  assert.ok(css.includes(".seasonal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }"));
});

test("completion reminders: one automatic notification after 3 days, never repeated", async () => {
  const reminder = await loadLib("../src/lib/completion-reminder.ts");
  assert.equal(reminder.COMPLETION_REMINDER_DAYS, 3);
  const now = Date.parse("2026-11-10T12:00:00Z");
  const asked = "2026-11-05T12:00:00Z"; // عدّى ٥ أيام
  assert.equal(reminder.completionReminderDecision({ completionStatus: "requested", completionRequestedAt: asked }, now).due, true);
  // لسه بدري
  assert.equal(reminder.completionReminderDecision({ completionStatus: "requested", completionRequestedAt: "2026-11-09T12:00:00Z" }, now).reason, "too-early");
  // ردّ أو أكّد → مفيش تذكير
  assert.equal(reminder.completionReminderDecision({ completionStatus: "submitted", completionRequestedAt: asked }, now).due, false);
  assert.equal(reminder.completionReminderDecision({ completionStatus: "done", completionRequestedAt: asked }, now).due, false);
  // تذكير اتبعت بعد الطلب → ممنوع التكرار
  assert.equal(reminder.completionReminderDecision({ completionStatus: "requested", completionRequestedAt: asked, completionReminderAt: "2026-11-09T12:00:00Z" }, now).reason, "already-reminded");
  // طلب استكمال جديد بعد التذكير القديم → تذكير واحد جديد مسموح
  assert.equal(reminder.completionReminderDecision({ completionStatus: "requested", completionRequestedAt: "2026-11-06T12:00:00Z", completionReminderAt: "2026-11-05T12:00:00Z" }, now).due, true);
  // مفيش تاريخ طلب (بيانات قديمة) → مانبعتش عشوائي
  assert.equal(reminder.completionReminderDecision({ completionStatus: "requested", completionRequestedAt: null }, now).reason, "no-date");
  const message = reminder.completionReminderMessage({ name: "أحمد السباك", daysWaiting: 5 });
  assert.ok(message.title.includes("استكمال بيانات") && message.body.includes("أحمد السباك") && message.body.length <= 300);
  assert.equal(reminder.dueReminderCount([
    { completionStatus: "requested", completionRequestedAt: asked },
    { completionStatus: "requested", completionRequestedAt: "2026-11-09T12:00:00Z" },
  ], now), 1);

  const api = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes('action === "completion-reminders"'));
  assert.ok(api.includes("completionReminderMessage") && api.includes("completionReminderAt: new Date()"));
  // الطلب الجديد بيبدأ عدّاد جديد ويسمح بتذكير واحد.
  assert.ok(api.includes("completionRequestedAt: new Date(), completionReminderAt: null"));
  const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8");
  assert.ok(schema.includes("completionRequestedAt") && schema.includes("completionReminderAt"));
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("ADD COLUMN IF NOT EXISTS completion_requested_at"));
  const panel = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  assert.ok(panel.includes("completion-reminder-bar") && panel.includes("sendCompletionReminders"));
  assert.ok(panel.includes("janzour-completion-reminders"));
  const css = readFileSync(new URL("../src/app/admin/admin-panel.css", import.meta.url), "utf8");
  assert.ok(css.includes(".completion-reminder-bar.is-due"));
});

test("splash audio starts on its own when the app opens, without any tap", () => {
  const player = readFileSync(new URL("../src/components/splash-audio.tsx", import.meta.url), "utf8");
  // الإعدادات بتوصل بعد أول رسم للصفحة: لازم إعادة قراءة + مراقبة التغيير + محاولات متتابعة.
  assert.ok(player.includes("MutationObserver") && player.includes("attributeFilter"));
  assert.ok(player.includes("RETRY_DELAYS") && player.includes("function scheduleAttempts"));
  assert.ok(player.includes("readConfig") && player.includes("getAttribute(\"data-design-splash-audio\")"));
  // بيحاول تاني لما الملف يبقى جاهز، ولما الصفحة ترجع تبان، ولما شاشة البداية تخلص.
  assert.ok(player.includes("\"canplay\"") && player.includes("visibilitychange") && player.includes("pageshow"));
  assert.ok(player.includes("SPLASH_FINISHED_EVENT"));
  // لسه فيه خطة بديلة: أول لمسة في أي مكان تشغّل الصوت، وبتتعلّم إن الجهاز اتفتح عليه الموقع قبل كده.
  assert.ok(player.includes("janzour-audio-unlocked") && player.includes("GESTURES"));
  // مفيش قطع للمقطع أثناء التنقل: عنصر صوت واحد على مستوى التطبيق.
  assert.ok(player.includes("let sharedAudio: HTMLAudioElement | null = null;"));
  assert.ok(player.includes("SPLASH_AUDIO_BLOCKED_EVENT"));

  const splash = readFileSync(new URL("../src/components/splash-screen.tsx", import.meta.url), "utf8");
  assert.ok(splash.includes("export const SPLASH_FINISHED_EVENT = \"janzour-splash-finished\";"));
  assert.ok(splash.includes("export const SPLASH_AUDIO_BLOCKED_EVENT = \"janzour-splash-audio-blocked\";"));
  assert.ok(splash.includes("splash-sound-hint") && splash.includes("is-waiting"));
  // الشاشة بتقول للصوت إنها خلصت من نفس الحدث اللي بيسمعه المشغّل.
  assert.ok(splash.includes("new CustomEvent(SPLASH_FINISHED_EVENT)"));
  assert.equal(splash.includes("new CustomEvent(\"janzour-splash-finished\")"), false);

  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".splash-audio-toggle.is-waiting"));
  assert.ok(css.includes(".splash-sound-hint {"));
});

test("emergency alert bar: appears instantly, colours by level, and expires on its own", async () => {
  const alert = await loadLib("../src/lib/emergency-alert.ts");
  const now = Date.parse("2026-11-02T10:00:00Z");
  // مفيش نص → مخفي
  assert.equal(alert.activeEmergencyAlert({ emergencyAlertText: "" }, now).active, false);
  assert.equal(alert.activeEmergencyAlert(null, now).reason, "empty");
  // نص بدون مدة → ظاهر لحد ما الأدمن يمسحه
  const open = alert.activeEmergencyAlert({ emergencyAlertText: "قطع مياه بشارع حسيب", emergencyAlertLevel: "danger" }, now);
  assert.equal(open.active, true);
  assert.equal(open.level, "danger");
  assert.equal(open.until, null);
  // مدة مستقبلية → ظاهر وباقي وقت محسوب
  const timed = alert.activeEmergencyAlert({ emergencyAlertText: "تحذير من طقس سيئ", emergencyAlertLevel: "warning", emergencyAlertUntil: "2026-11-02T12:00:00Z" }, now);
  assert.equal(timed.active, true);
  assert.equal(timed.minutesLeft, 120);
  assert.match(alert.remainingAlertLabel(timed.minutesLeft), /ساعة/);
  // انتهت المدة → يختفي لوحده
  assert.equal(alert.activeEmergencyAlert({ emergencyAlertText: "قديم", emergencyAlertUntil: "2026-11-02T09:00:00Z" }, now).reason, "expired");
  // تاريخ غير صالح → مش بنعرض شريط غلط
  assert.equal(alert.activeEmergencyAlert({ emergencyAlertText: "غلط", emergencyAlertUntil: "not-a-date" }, now).active, false);
  // تنظيف النص واللون والمدة
  assert.equal(alert.normalizeEmergencyText("  انقطاع\n\nكهرباء   بالقرية  "), "انقطاع كهرباء بالقرية");
  assert.equal(alert.normalizeEmergencyText("ع".repeat(400)).length, alert.EMERGENCY_ALERT_MAX_LENGTH);
  assert.equal(alert.normalizeEmergencyLevel("weird"), "info");
  assert.equal(alert.normalizeEmergencyLevel("danger"), "danger");
  assert.equal(alert.emergencyAlertHoursToIso(2, now), "2026-11-02T12:00:00.000Z");
  assert.ok(Date.parse(alert.emergencyAlertHoursToIso(500, now)) - now === alert.EMERGENCY_ALERT_MAX_HOURS * 3_600_000);
  assert.notEqual(alert.emergencyAlertKey("نص", null), alert.emergencyAlertKey("نص", "2026-11-02T12:00:00Z"));

  // التوصيل: API + الشريط في كل الصفحات + محرر في الإعدادات
  const route = readFileSync(new URL("../src/app/api/site-alert/route.ts", import.meta.url), "utf8");
  assert.ok(route.includes("activeEmergencyAlert") && route.includes("no-store"));
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes("<EmergencyAlertBar />"));
  const editor = readFileSync(new URL("../src/components/settings-editor.tsx", import.meta.url), "utf8");
  assert.ok(editor.includes("emergencyAlertText") && editor.includes("EMERGENCY_ALERT_LEVELS") && editor.includes("شريط التنبيه الطارئ أعلى الموقع"));
  const inputs = readFileSync(new URL("../src/lib/inputs.ts", import.meta.url), "utf8");
  assert.ok(inputs.includes("normalizeEmergencyText") && inputs.includes("emergencyAlertUntil"));
});

test("new arrivals strip lists the last 7 days only, published only, and keeps featured at the end", async () => {
  const arrivals = await loadLib("../src/lib/new-arrivals.ts");
  const now = Date.parse("2026-11-02T12:00:00Z");
  const day = 86_400_000;
  const services = [
    { id: "old", createdAt: new Date(now - 20 * day).toISOString() },
    { id: "fresh", createdAt: new Date(now - 1 * day).toISOString() },
    { id: "today", createdAt: new Date(now - 60_000).toISOString() },
    { id: "featured", createdAt: new Date(now - 2 * day).toISOString(), featured: true },
    { id: "pending", createdAt: new Date(now - day).toISOString(), status: "pending" },
    { id: "bad-date", createdAt: "not-a-date" },
  ];
  const list = arrivals.newArrivalServices(services, now).map((item) => item.id);
  assert.deepEqual(list, ["today", "fresh", "featured"]);
  assert.equal(arrivals.NEW_ARRIVALS_DAYS, 7);
  assert.equal(arrivals.newArrivalServices(services, now, 7, 2).length, 2);
  assert.equal(arrivals.arrivalDayLabel(new Date(now - 60_000).toISOString(), now), "النهاردة");
  assert.equal(arrivals.arrivalDayLabel(new Date(now - day).toISOString(), now), "إمبارح");
  assert.equal(arrivals.arrivalDayLabel(new Date(now - 4 * day).toISOString(), now), "من 4 أيام");
  assert.equal(arrivals.arrivalDayLabel("bad", now), "");

  const component = readFileSync(new URL("../src/components/new-arrivals.tsx", import.meta.url), "utf8");
  assert.ok(component.includes("new-arrivals-strip") && component.includes("arrivalDayLabel"));
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  assert.ok(directory.includes("newArrivalServices") && directory.includes("<NewArrivals"));
});

test("monthly printed guide groups published services by section with phone numbers", async () => {
  const guide = await loadLib("../src/lib/printable-guide.ts");
  const categories = [
    { id: "clinics", name: "عيادات", color: "#22b96d" },
    { id: "dentistry", name: "الأسنان", parentId: "clinics" },
    { id: "crafts", name: "حرفيين", color: "#ff941f" },
    { id: "empty-section", name: "قسم فاضي" },
  ];
  const services = [
    { id: "1", name: "د. أحمد", category: "dentistry", phone: "01000000001", address: "شارع حسيب", featured: true },
    { id: "2", name: "د. سارة", category: "clinics", phone: "01000000002", area: "السوق القديم", verified: true },
    { id: "3", name: "أسطى محمود", category: "crafts", phone: "01000000003" },
    { id: "4", name: "مرفوض", category: "crafts", phone: "01000000004", status: "pending" },
  ];
  const sections = guide.printableGuideSections(categories, services);
  assert.deepEqual(sections.map((section) => section.id), ["clinics", "crafts"]);
  assert.equal(sections[0].entries.length, 2);
  assert.ok(sections[0].entries.some((entry) => entry.name === "د. أحمد (الأسنان)"));
  assert.equal(sections[1].entries.length, 1, "الطلبات غير المنشورة لا تُطبع");
  assert.equal(guide.printableGuideCount(sections), 3);
  assert.equal(guide.guideSummaryLine(3, 2), "٣ خدمة ومهنة في ٢ قسم");
  assert.equal(guide.arabicDigits("0123456789"), "٠١٢٣٤٥٦٧٨٩");
  assert.match(guide.guideEditionLabel(Date.parse("2026-11-02T12:00:00Z")), /٢٠٢٦|2026/);
  assert.match(guide.guideFileName(Date.parse("2026-11-02T12:00:00Z")), /^daleel-ganzour-guide-2026-11$/);

  const page = readFileSync(new URL("../src/app/print/guide/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("printableGuideSections") && page.includes("PrintGuideControls"));
  const css = readFileSync(new URL("../src/app/print/guide/guide.css", import.meta.url), "utf8");
  assert.ok(css.includes("@media print") && css.includes("@page"));
  const admin = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  assert.ok(admin.includes('href="/print/guide"'));
});

test("profile-complete badge is wired into the public app, and the offline mode is gone", () => {
  const catalog = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
  assert.ok(catalog.includes("export function isProfileComplete"));
  assert.ok(catalog.includes("بيانات مكتملة ✓"));
  const card = readFileSync(new URL("../src/components/provider-card.tsx", import.meta.url), "utf8");
  assert.ok(card.includes("isProfileComplete") && card.includes("complete-flag"));
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  assert.ok(css.includes(".complete-flag {"));
  assert.ok(css.includes(".site-alert-bar.is-danger") && css.includes(".new-arrival-card"));

  // وضع بدون نت اتشال بالكامل: مفيش حفظ صفحات ولا مؤشر أوفلاين، وسيرفس وركر رجع لحفظ صفحة الأكواد فقط.
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.equal(sw.includes("PAGES_CACHE"), false);
  assert.equal(sw.includes("handleNavigation"), false);
  // رجع لإصدار ما قبل وضع بدون نت (حفظ صفحة الأكواد فقط).
  assert.ok(sw.includes("const CACHE_NAME = `${CACHE_PREFIX}-v3`;"));
  assert.equal(existsSync(new URL("../src/components/offline-indicator.tsx", import.meta.url)), false);
  assert.equal(css.includes(".offline-bar"), false);
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.equal(layout.includes("OfflineIndicator"), false);
});

test("new arrivals and mobile codes sit inside one outer frame with the cards inside", () => {
  const css = readFileSync(new URL("../src/app/janzour.css", import.meta.url), "utf8");
  // إطار «وصل حديثًا»: حد + استدارة كبيرة + شريط علوي ملوّن، والكروت جوّه في مسار داخلي.
  assert.ok(css.includes(".new-arrivals {\n  position: relative;"));
  assert.ok(css.includes(".new-arrivals::before {"));
  assert.ok(css.includes("border: 1px solid #e4eefa; border-radius: 18px; background: #f2f8ff;"));
  assert.ok(css.includes("html.dark .new-arrivals-strip { border-color: #1e3448; background: #0b1a29; }"));
  // إطار أكواد المحمول (الرئيسية + صفحة /telecom).
  assert.ok(css.includes(".telecom-section {\n  position: relative;"));
  assert.ok(css.includes(".telecom-section::before {"));
  assert.ok(css.includes(".telecom-cards-grid {\n  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;\n  padding: 10px;"));
  assert.ok(css.includes(".telecom-home::before {"));
  assert.ok(css.includes(".telecom-panel::before {"));
  // الكروت نفسها لسه موجودة جوّه الإطار.
  const arrivals = readFileSync(new URL("../src/components/new-arrivals.tsx", import.meta.url), "utf8");
  assert.ok(arrivals.includes("new-arrivals-strip") && arrivals.includes("new-arrival-card"));
  const telecom = readFileSync(new URL("../src/components/telecom-cards.tsx", import.meta.url), "utf8");
  assert.ok(telecom.includes("telecom-cards-grid") && telecom.includes("category-tile"));
});

test("monthly honors: top 3 by real engagement, monthly when a baseline exists", async () => {
  const honors = await loadLib("../src/lib/monthly-honors.ts");
  assert.equal(honors.HONORS_LIMIT, 3);
  assert.equal(honors.HONOR_CONTACT_WEIGHT, 3);
  assert.equal(honors.honorScore({ views: 10, contacts: 2 }), 16);

  const services = [
    { id: "a", name: "أحمد السباك", category: "plumbing", rating: "4.5", reviews: 4 },
    { id: "b", name: "محمود الكهربائي", category: "electricity", rating: "4.9", reviews: 9 },
    { id: "c", name: "سارة الأسنان", category: "dentistry", rating: "5" },
    { id: "d", name: "بلا تفاعل", category: "crafts" },
  ];
  const stats = [
    { serviceId: "a", views: 30, contacts: 10 },   // 60
    { serviceId: "b", views: 20, contacts: 12 },   // 56
    { serviceId: "c", views: 90, contacts: 0 },    // 90
    { serviceId: "d", views: 1, contacts: 0 },     // 1 → أقل من الحد
  ];
  const ranked = honors.rankMonthlyHonors(services, stats, { month: "2026-11" });
  assert.deepEqual(ranked.map((entry) => entry.service.id), ["c", "a", "b"]);
  assert.deepEqual(ranked.map((entry) => entry.rank), [1, 2, 3]);
  assert.equal(ranked[0].certificateNo, "JZ-2026-11-1");
  assert.equal(honors.honorTitle(2).medal, "🥈");

  // بداية شهر: الفرق عن الـsnapshot هو تفاعل الشهر (والسالب يصبح صفر).
  const baseline = { a: [28, 9], b: [20, 12], c: [10, 0] };
  const monthly = honors.rankMonthlyHonors(services, stats, { month: "2026-11", baselines: baseline });
  assert.equal(monthly[0].service.id, "c", "٨٠ مشاهدة هذا الشهر");
  assert.equal(monthly[0].views, 80);
  assert.equal(monthly.find((entry) => entry.service.id === "b"), undefined, "مفيش تفاعل جديد هذا الشهر");
  assert.deepEqual(honors.monthDelta({ serviceId: "x", views: 3, contacts: 1 }, [10, 5]), { views: 0, contacts: 0 });
  assert.deepEqual(honors.monthDelta({ serviceId: "x", views: 13, contacts: 6 }, [10, 5]), { views: 3, contacts: 1 });

  // الشهور والأرقام والنصوص
  assert.equal(honors.monthKey(Date.parse("2026-11-02T12:00:00Z")), "2026-11");
  assert.match(honors.monthLabel("2026-11"), /نوفمبر/);
  assert.equal(honors.honorAchievementLine({ views: 12, contacts: 4 }), "12 مشاهدة و4 اتصال");
  assert.equal(honors.honorAchievementLine({ views: 0, contacts: 0 }), "تفاعل مميز من أهل القرية");
  assert.deepEqual(Object.keys(honors.trimmedBaselines({ "2026-10": {}, "2026-11": {} }, "2026-11")), ["2026-11"]);
  const post = honors.honorPostText("2026-11", ranked);
  assert.ok(post.includes("تكريم") && post.includes("أحمد السباك") && post.includes("نوفمبر"));

  // التوصيل
  const directory = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(directory.includes("getMonthlyHonors") && directory.includes("resetHonorBaselines") && directory.includes("honor_baselines"));
  const api = readFileSync(new URL("../src/app/api/admin/route.ts", import.meta.url), "utf8");
  assert.ok(api.includes('type === "honor-baselines"') && api.includes("resetHonorBaselines"));
  const page = readFileSync(new URL("../src/app/honors/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("getMonthlyHonors") && page.includes("HonorsToolbar") && page.includes("QrSvg"));
  const css = readFileSync(new URL("../src/app/honors/honors.css", import.meta.url), "utf8");
  assert.ok(css.includes("@media print") && css.includes("size: A4 landscape"));
  const admin = readFileSync(new URL("../src/components/admin-panel.tsx", import.meta.url), "utf8");
  assert.ok(admin.includes('href="/honors"'));
});

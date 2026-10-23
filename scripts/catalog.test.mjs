import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const catalog = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const { categoryArt, categoryArtOptions, isPharmacyCategory, NEW_SERVICE_DAYS, isNewService, normalizeSearch, isOutsideLaborScope, whatsappUrl, getCategory, initialCategories, categories, iconNames, iconArabicLabels, areas, sampleServices, defaultSettings, settingsTextKeys, sanitizeSettings, defaultDesignSettings, sanitizeDesignSettings, designThemePresets, matchesServiceQuery, suggestSpecialties, getServiceTrustBadges, getDutyShiftInfo, getOnDutyServices, publicUtilityNumbers, sanitizeUtilityNumbers, getCompletionFieldSuggestions, isServiceOwner, isOpenByWorkingHours, isServiceOpenOrAvailableNow, getGanzourPrayerAndWeather, TEACHER_STAGES, getTeacherStagesForService, matchesTeacherStage, HOME_DELIVERY_TAG, supportsHomeDelivery, parseAnnouncementItems, CLINIC_APPOINTMENT_TAG, CLINIC_WALKIN_TAG, getClinicBookingMode, getClinicBookingLabel, getClinicScheduleSummary, matchesClinicFilter, parseShopItemString, getShopCatalogItems, buildShopWhatsappOrderMessage } = catalog;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-06-01T12:00:00Z");

test("private review notes are excluded from public serialization", () => {
  const source = readFileSync(new URL("../src/lib/directory.ts", import.meta.url), "utf8");
  assert.ok(source.includes("reviewNote: _privateNote"));
  assert.ok(source.includes("...publicItem"));
});

test("completion updates only needs-info requests and returns them to pending transactionally", () => {
  const source = readFileSync(new URL("../src/app/api/submission-completion/route.ts", import.meta.url), "utf8");
  assert.ok(source.includes('eq(services.status, "needs-info")'));
  assert.ok(source.includes('status: "pending"'));
  assert.ok(source.includes("db.transaction"));
  assert.ok(source.includes('createHash("sha256")'));
  assert.ok(source.includes("409"));
});

test("missing-data indicator identifies optional information without requiring a second phone or working hours", () => {
  const service = { address: "", hours: "", workingHours: [], serviceItems: [], subSpecialties: [] };
  assert.deepEqual(catalog.missingServiceData(service), ["العنوان", "الخدمات التفصيلية", "التخصصات الفرعية"]);
  assert.deepEqual(catalog.missingServiceData({ ...service, address: "جنزور", serviceItems: ["صيانة"], subSpecialties: ["منازل"] }), []);
});

test("tracking page queries a hashed private token and does not select phone data", () => {
  const page = readFileSync(new URL("../src/app/track/[token]/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes('createHash("sha256")'));
  assert.ok(page.includes("index: false"));
  assert.ok(!page.includes("services.phone"));
  assert.ok(page.includes("notFound()"));
});

test("validates detailed service lists and removes duplicate entries", () => {
  assert.deepEqual(catalog.parseServiceItems([" صيانة ", "تركيب", "صيانة"]), ["صيانة", "تركيب"]);
  assert.deepEqual(catalog.parseServiceItems(undefined), []);
  for (const value of ["bad", [""], [42], ["a".repeat(101)], Array(21).fill("صيانة")]) assert.throws(() => catalog.parseServiceItems(value));
});

test("WhatsApp requests describe the service and only the visitor-selected area", () => {
  const text = catalog.serviceWhatsappMessage({ name: "أحمد" }, "سباكة", "جنزور / السوق", "كشف تسريب");
  assert.ok(text.includes("أحمد") && text.includes("كشف تسريب") && text.includes("جنزور / السوق"));
  assert.ok(!catalog.serviceWhatsappMessage({ name: "أحمد" }, "سباكة").includes(" في "));
});

test("specialty suggestions rank relevant active specialties with published providers", () => {
  const items = [
    { id: "paint", parentId: "crafts", name: "نقاشة", description: "", active: true, sortOrder: 1 },
    { id: "plumbing", parentId: "crafts", name: "سباكة", description: "كشف تسريب", active: true, sortOrder: 2 },
    { id: "hidden", parentId: "crafts", name: "تسريب", description: "", active: false, sortOrder: 0 },
  ];
  const providers = items.map((item) => ({ category: item.id }));
  assert.equal(catalog.suggestSpecialties("تسريب", items, providers)[0].id, "plumbing");
  assert.ok(!catalog.suggestSpecialties("تسريب", items, providers).some((item) => item.id === "hidden"));
  assert.deepEqual(catalog.suggestSpecialties("تسريب", items, [], "crafts"), []);
});

test("availability lasts four hours, expires at the boundary, and only renews explicitly", () => {
  const { availabilityUpdate, isAvailableNow } = catalog;
  const active = availabilityUpdate("activate", { availableNow: false, availableUntil: null }, now);
  assert.equal(active.availableUntil.getTime(), now + 4 * 60 * 60 * 1000);
  const record = { ...active, availableUntil: active.availableUntil.toISOString() };
  assert.equal(isAvailableNow(record, now), true);
  assert.equal(isAvailableNow(record, active.availableUntil.getTime() - 1), true);
  assert.equal(isAvailableNow(record, active.availableUntil.getTime()), false);
  assert.equal(isAvailableNow({ availableNow: true, availableUntil: null }, now), false);
  assert.equal(isAvailableNow({ availableNow: true, availableUntil: "invalid" }, now), false);
  assert.deepEqual(availabilityUpdate("keep", active, now + 1000), active);
  assert.deepEqual(availabilityUpdate(undefined, active), active);
  // Regression: "keep" must return ONLY the availability columns. The admin edit route spreads this
  // result over the edited values, so leaking the full row would silently revert every admin edit.
  const fullRow = { ...active, id: "x", name: "old name", phone: "0100", address: "old address" };
  assert.deepEqual(availabilityUpdate("keep", fullRow), { availableNow: active.availableNow, availableUntil: active.availableUntil });
  assert.deepEqual({ name: "new", ...availabilityUpdate("keep", fullRow) }.name, "new");
  assert.deepEqual(availabilityUpdate("stop", active), { availableNow: false, availableUntil: null });
  assert.throws(() => availabilityUpdate("invalid", active));
});

test("weekly hours validate all seven days and support holidays and overnight shifts", () => {
  const { parseWorkingHours } = catalog;
  const days = Array.from({ length: 7 }, () => ({ closed: false, opens: "09:00", closes: "17:00" }));
  days[5] = { closed: true, opens: "", closes: "" };
  days[6] = { closed: false, opens: "20:00", closes: "02:00" };
  assert.deepEqual(parseWorkingHours(days), days);
  assert.deepEqual(parseWorkingHours(undefined), []);
  assert.throws(() => parseWorkingHours(days.slice(1)));
  assert.throws(() => parseWorkingHours("bad"));
  for (const opens of ["24:00", "9:00", "12:60", "17:00"]) {
    assert.throws(() => parseWorkingHours([{ closed: false, opens, closes: "17:00" }, ...days.slice(1)]));
  }
});

test("removes the market and lost-and-found sections from the directory", () => {
  const directory = readFileSync(new URL("../src/components/directory.tsx", import.meta.url), "utf8");
  for (const marker of ["CommunityMarket", "community-market", "community-alerts", "أمانات ومفقودات جنزور"]) {
    assert.ok(!directory.includes(marker), `${marker} is removed`);
  }
});

test("retired market endpoints return gone without accessing the database", async () => {
  const route = readFileSync(new URL("../src/app/api/community/route.ts", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("route.ts", route, ts.ScriptTarget.Latest, true);
  for (const method of ["GET", "POST"]) {
    const handler = parsed.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === method);
    assert.ok(handler, `${method} has a retirement handler`);
    const { outputText } = ts.transpileModule(handler.getText(parsed).replace("export ", ""), {
      compilerOptions: { target: ts.ScriptTarget.ES2020 },
    });
    const response = await new Function(`${outputText}; return ${method}();`)();
    assert.equal(response.status, 410);
  }
});

test("flags a provider as new for exactly thirty days after it was created", () => {
  assert.equal(NEW_SERVICE_DAYS, 30);
  const at = (days) => ({ createdAt: new Date(now - days * DAY).toISOString() });
  assert.equal(isNewService(at(0), now), true);
  assert.equal(isNewService(at(29.9), now), true);
  assert.equal(isNewService(at(30), now), false, "the thirtieth day is no longer new");
  assert.equal(isNewService(at(400), now), false);
  // Anything that cannot be dated (future or unparsable) is never shown as new.
  assert.equal(isNewService({ createdAt: new Date(now + DAY).toISOString() }, now), false);
  assert.equal(isNewService({ createdAt: "not-a-date" }, now), false);
  assert.equal(isNewService({ createdAt: "" }, now), false);
  // A provider inserted right now (the database stamps createdAt) starts life as new.
  assert.equal(isNewService({ createdAt: new Date().toISOString() }), true);
  // The seed rows carry no timestamp of their own, and a missing date never crashes the card.
  assert.equal(sampleServices.every((service) => service.createdAt === undefined), true);
  assert.equal(isNewService(sampleServices[0]), false);
});

test("normalizes Arabic search text before comparing it", () => {
  assert.equal(normalizeSearch("أَحْمَد"), "احمد", "diacritics are dropped");
  assert.equal(normalizeSearch("إبراهيم وآلاء"), "ابراهيم والاء", "alef variants fold to ا");
  assert.equal(normalizeSearch("مستشفى الأمراض"), "مستشفي الامراض", "ى folds to ي");
  assert.equal(normalizeSearch("جمعية خيرية"), "جمعيه خيريه", "ة folds to ه");
  assert.equal(normalizeSearch("الـكـهـربـاء"), "الكهرباء", "tatweel is removed");
  assert.equal(normalizeSearch("Dr. Sara"), "dr. sara", "latin text is lower-cased");
  assert.equal(normalizeSearch("ＡＢＣ１２３"), "abc123", "full-width digits fold to ascii");
  // Search stays accent-insensitive in both directions, so a plain query finds a decorated record.
  assert.equal(normalizeSearch("أحمد"), normalizeSearch("احمد"));
  assert.ok(normalizeSearch("جمعية الأورمان").includes(normalizeSearch("جمعيه")));
});

test("keeps daily labor scoped to demolition, staging and helper work", () => {
  // Painting and ceramics keep their own crafts sections, so labor ads for those trades are redirected.
  assert.equal(isOutsideLaborScope("نقاش"), true);
  assert.equal(isOutsideLaborScope("نقاشة"), true);
  assert.equal(isOutsideLaborScope("النقاشة والدهانات"), true);
  assert.equal(isOutsideLaborScope("فني سيراميك"), true);
  assert.equal(isOutsideLaborScope("تركيب بلاط"), true);
  // Demolition, breaking, sand/cement staging and general helper work are the intended scope.
  assert.equal(isOutsideLaborScope("عامل هدم وتكسير"), false);
  assert.equal(isOutsideLaborScope("تشوين رمل وأسمنت"), false);
  assert.equal(isOutsideLaborScope("أعمال مساعدة"), false);
  // The description is checked along with the profession, and empty values never match.
  assert.equal(isOutsideLaborScope("عامل يومي", "خبرة في دهان الحوائط"), true);
  assert.equal(isOutsideLaborScope("", ""), false);
});

test("builds Egyptian WhatsApp links with an optional encoded message", () => {
  assert.equal(whatsappUrl("01222355769"), "https://wa.me/201222355769");
  assert.equal(whatsappUrl("+20 122 235 5769"), "https://wa.me/201222355769", "separators are ignored");
  assert.equal(whatsappUrl("201222355769"), "https://wa.me/201222355769", "an international number is kept as is");
  assert.equal(whatsappUrl("01044556677", "مرحبًا، وصلت إليك من دليل جنزور."), "https://wa.me/201044556677?text=" + encodeURIComponent("مرحبًا، وصلت إليك من دليل جنزور."));
  assert.equal(whatsappUrl("01044556677", ""), "https://wa.me/201044556677", "an empty message adds no query");
});

test("resolves categories and falls back safely for unknown ids", () => {
  assert.equal(getCategory("electricity").name, "الكهرباء");
  assert.equal(getCategory("electricity").parentId, "crafts");
  assert.equal(getCategory("clinics").parentId, null);
  // A custom catalog wins over the built-in one.
  const custom = [{ id: "x", name: "تخصص تجريبي", color: "#123456", light: "#12345612", icon: "Wrench", parentId: null, sortOrder: 0, active: true, description: "" }];
  assert.equal(getCategory("x", custom).name, "تخصص تجريبي");
  // Unknown ids still render a usable card instead of crashing the page.
  const fallback = getCategory("does-not-exist");
  assert.equal(fallback.id, "does-not-exist");
  assert.equal(fallback.name, "خدمة");
  assert.equal(fallback.icon, "Wrench");
  assert.match(fallback.color, /^#[0-9a-f]{6}$/i);
  assert.equal(getCategory("", custom).name, "خدمة");
});

test("keeps sections, specialties and icons coherent", () => {
  assert.equal(categories.length, 14, "the published roots are the fourteen village sections");
  const beauty = initialCategories.filter((category) => category.parentId === "beauty").map((category) => category.id);
  assert.deepEqual(beauty, ["barbers", "hairdressers", "makeup"], "the beauty section owns barbers, hairdressers and makeup");
  assert.equal(initialCategories.find((category) => category.id === "beauty").art, "beauty");
  assert.deepEqual(categories.map(({ id }) => id), ["crafts", "clinics", "labs", "pharmacies", "shops", "teachers", "charities", "printing", "events", "beauty", "transport", "cleaning", "law", "other-services"], "roots in display order");
  // Every root section renders its own dimensional (3D) artwork instead of the generic fallback,
  // and every selectable artwork option exists in the sprite.
  const svg = readFileSync(new URL("../public/images/category-3d.svg", import.meta.url), "utf8");
  for (const option of categoryArtOptions) assert.ok(svg.includes(`<symbol id="${option.id}"`), `art option ${option.id} exists in category-3d.svg`);
  for (const root of categories) {
    if (root.id !== "other-services") assert.notEqual(categoryArt(root), "other", `${root.id} has dedicated 3D artwork`);
  }
  assert.equal(categoryArt({ icon: "Grid2X2", art: "" }), "other");
  assert.equal(categoryArt({ icon: "Wrench", art: "money" }), "money", "a stored art choice wins over the icon default");
  assert.equal(categoryArt({ icon: "Wrench", art: "nope" }), "crafts", "an unknown art falls back to the icon default");
  assert.equal(isPharmacyCategory("pharmacies"), true);
  assert.equal(isPharmacyCategory("community-pharmacies"), true);
  assert.equal(isPharmacyCategory("groceries"), false);
  const ids = initialCategories.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, "category ids are unique");
  assert.ok(initialCategories.length > categories.length, "every root carries specialties");
  for (const category of initialCategories) {
    assert.ok(category.name.trim().length >= 2, category.id);
    assert.match(category.color, /^#[0-9a-f]{6}$/i, `${category.id} color`);
    assert.ok(iconNames.includes(category.icon), `${category.id} uses a supported icon (${category.icon})`);
    assert.equal(Number.isFinite(category.sortOrder), true, `${category.id} sortOrder`);
    assert.equal(category.active, true);
    if (category.parentId === null) {
      assert.equal(category.light, `${category.color}12`, `${category.id} light tint matches its color`);
      assert.ok(initialCategories.some((item) => item.parentId === category.id), `${category.id} has at least one specialty`);
    } else {
      const parent = getCategory(category.parentId, initialCategories);
      assert.equal(parent.parentId, null, `${category.id} belongs to a root section`);
      assert.equal(category.color, parent.color, `${category.id} inherits the section color`);
      assert.equal(category.light, parent.light, `${category.id} inherits the section tint`);
      assert.ok(category.description.includes(category.name), `${category.id} description mentions its name`);
    }
  }
  // The icon component map covers exactly the icons the catalogue offers, so no icon is unreachable
  // and no offered icon falls back to the wrench.
  const ui = readFileSync(new URL("../src/components/ui.tsx", import.meta.url), "utf8");
  const map = /const categoryIcons: Record<string, LucideIcon> = \{ ([^}]+) \};/.exec(ui);
  assert.ok(map, "ui.tsx keeps a categoryIcons map");
  assert.deepEqual(map[1].split(",").map((name) => name.trim()), iconNames, "the icon map matches iconNames");
  const imported = /import \{ ([^}]+) \} from "lucide-react";/.exec(ui)[1].split(",").map((name) => name.trim());
  for (const icon of iconNames) assert.ok(imported.includes(icon), `${icon} is imported from lucide-react`);
  // The sample directory only references specialties that exist, so no card renders the fallback label.
  for (const service of sampleServices) {
    const category = getCategory(service.category);
    assert.notEqual(category.name, "خدمة", `${service.name} points at a real specialty`);
    assert.ok(areas.includes(service.area), `${service.name} uses a known Janzour address`);
  }
});

test("serves settings without any advertising field", () => {
  const expected = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright", "phone", "showEmergency", "whatsappAlertsNumber", "whatsappAlertsApiKey"];
  assert.deepEqual(Object.keys(defaultSettings), expected);
  assert.deepEqual([...settingsTextKeys, "showEmergency", "whatsappAlertsNumber", "whatsappAlertsApiKey"], expected);
  for (const key of ["adPrice", "adDays", "marqueeEnabled"]) assert.equal(key in defaultSettings, false, `${key} is gone`);
  assert.equal(/إعلان/.test(defaultSettings.contactText), false, "the contact text no longer sells advertising");
  assert.equal(defaultSettings.phone, "01222355769");
  assert.equal(defaultSettings.showEmergency, true);
  // WhatsApp alerts start disabled until the admin saves a number and a CallMeBot key.
  assert.equal(defaultSettings.whatsappAlertsNumber, "");
  assert.equal(defaultSettings.whatsappAlertsApiKey, "");
  // Rows written by older releases still carry the removed fields: they are dropped, never served.
  const legacy = { ...defaultSettings, adPrice: 65, adDays: 3, marqueeEnabled: true, marqueeText: "إعلان", paid: true };
  const clean = sanitizeSettings(legacy);
  assert.deepEqual(Object.keys(clean), expected);
  assert.equal("adPrice" in clean, false);
  assert.equal("marqueeText" in clean, false);
  assert.equal(clean.siteName, defaultSettings.siteName);
  // Valid edits survive sanitizing, wrong types fall back to the defaults.
  assert.equal(sanitizeSettings({ siteName: "دليل جنزور", showEmergency: false }).siteName, "دليل جنزور");
  assert.equal(sanitizeSettings({ siteName: "دليل جنزور", showEmergency: false }).showEmergency, false);
  assert.equal(sanitizeSettings({ siteName: "   ", phone: 12345, showEmergency: "yes" }).siteName, defaultSettings.siteName);
  assert.equal(sanitizeSettings({ phone: 12345 }).phone, defaultSettings.phone);
  assert.equal(sanitizeSettings({ showEmergency: "yes" }).showEmergency, true);
  assert.equal(sanitizeSettings({ copyright: "© 2026 جميع الحقوق محفوظة — دليل جنزور" }).copyright, "جميع الحقوق محفوظة — دليل جنزور");
  assert.deepEqual(sanitizeSettings({}), defaultSettings);
  // The legacy paid-advertising API stays gone; the only ad-related exports are the admin-managed banner helpers.
  const bannerApi = ["AD_IMAGE_MAX_BYTES", "AD_IMAGE_MIMES", "AD_MIN_SECONDS", "AD_MAX_SECONDS", "AD_MAX_COUNT", "AD_CURRENCY", "isAdLive", "adImageUrl", "parseAdImageDataUrl", "adTemplates", "isAdTemplateId", "getAdTemplate", "defaultAdPricing", "sanitizeAdPricing", "cheapestAdTier", "adPricingSummary", "advertiseRequestMessage", "AD_TRANSITIONS", "AD_MOTIONS", "AD_ACCENT_PRESETS", "AD_REQUEST_KINDS", "isAdTransition", "isAdMotion", "nextAdTransition", "autoTemplateService"];
  assert.deepEqual(Object.keys(catalog).filter((name) => /advert|campaign|placement|marquee|^ad[A-Z]|Ad[A-Z]|adPrice|adDays/.test(name) && !bannerApi.includes(name)), []);
});

test("colloquial Egyptian synonym dictionary matches everyday queries and specialty suggestions (#6)", () => {
  const plumber = sampleServices.find((item) => item.category === "plumbing") ?? {
    id: "p1", name: "سباك محترف", category: "plumbing", area: "وسط البلد", address: "جنزور", phone: "01000000000", phoneSecondary: "", description: "صيانة", subSpecialties: [], serviceItems: [],
  };
  assert.equal(matchesServiceQuery(plumber, "السباكة", "حنفية"), true);
  assert.equal(matchesServiceQuery(plumber, "السباكة", "ماتور مياه"), true);
  assert.equal(matchesServiceQuery(plumber, "السباكة", "ثلاجة"), false);

  const mockProviders = [{ category: "dentistry" }, { category: "community-pharmacies" }, { category: "plumbing" }];
  const toothSuggestions = suggestSpecialties("وجع ضرس", initialCategories, mockProviders);
  assert.ok(toothSuggestions[0]?.id === "dentistry", "colloquial dental query suggests dentistry");

  const rxSuggestions = suggestSpecialties("روشته دواء", initialCategories, mockProviders);
  assert.ok(rxSuggestions[0]?.id === "community-pharmacies", "colloquial rx query suggests pharmacies");
});

test("service intent search extracts meaningful Egyptian Arabic terms from full sentences", () => {
  const plumber = { id: "p1", name: "محمد حسن للسباكة", category: "plumbing", area: "جنزور", address: "جنزور", phone: "01000000000", description: "إصلاح وصيانة أدوات السباكة", subSpecialties: [], serviceItems: [] };
  const advertising = { id: "a1", name: "مكتب دعاية وإعلان", category: "advertising", area: "جنزور", address: "جنزور", phone: "01000000000", description: "لافتات وإعلانات للمحلات", subSpecialties: [], serviceItems: [] };
  const printing = { id: "p2", name: "مطبعة جنزور", category: "print-shops", area: "جنزور", address: "جنزور", phone: "01000000000", description: "طباعة كروت وفواتير", subSpecialties: [], serviceItems: [] };

  assert.deepEqual(catalog.extractServiceIntentTokens("عايز اعمل"), [], "filler-only text has no service intent");
  assert.deepEqual(catalog.extractServiceIntentTokens("عايز اعمل دعاية لمحل"), ["دعايه"]);
  assert.equal(catalog.matchesServiceIntentQuery(advertising, "الدعاية والإعلان واللافتات", "عايز اعمل دعاية لمحل"), true);
  assert.equal(catalog.matchesServiceIntentQuery(plumber, "السباكة", "عايز اعمل دعاية لمحل"), false);

  assert.deepEqual(catalog.extractServiceIntentTokens("الحنفية عندى بتنقط مية كتير"), ["حنفيه", "بتنقط"]);
  assert.equal(catalog.matchesServiceIntentQuery(plumber, "السباكة", "الحنفية عندى بتنقط مية كتير"), true);
  assert.equal(catalog.matchesServiceIntentQuery(advertising, "الدعاية والإعلان واللافتات", "الحنفية عندى بتنقط مية كتير"), false);

  assert.equal(catalog.matchesServiceIntentQuery(printing, "الطباعة وتصوير المستندات", "كروت لمحل"), true);
  const adCategories = catalog.suggestServiceIntentCategories("عايز اعمل دعاية لمحل", initialCategories);
  assert.ok(adCategories.some((category) => category.id === "advertising"), "a full shop-promotion sentence suggests advertising");
  assert.ok(catalog.suggestServiceIntentCategories("كروت لمحل", initialCategories).some((category) => category.id === "advertising"), "business cards can suggest shop promotion too");
  assert.equal(catalog.suggestServiceIntentCategories("عايز اعمل", initialCategories).length, 0, "generic filler does not reveal unrelated categories");
  assert.ok(catalog.suggestServiceIntentCategories("الحنفية عندى بتنقط مية كتير", initialCategories).some((category) => category.id === "plumbing"));
  assert.ok(catalog.suggestServiceIntentCategories("كروت لمحل", initialCategories).some((category) => category.id === "print-shops"));
});

test("automatic trust badges reward complete profiles, community ratings, and active availability (#9)", () => {
  const completeService = {
    address: "بجوار المسجد الكبير",
    description: "عيادة مجهزة بالكامل",
    serviceItems: ["كشف", "متابعة"],
    subSpecialties: ["باطنة"],
    rating: "4.8",
    reviews: 6,
    comments: [],
    featured: true,
    verified: true,
    availableNow: true,
    availableUntil: new Date(now + 3600_000).toISOString(),
    emergency: true,
    phoneSecondary: "01200000000",
  };
  const badges = getServiceTrustBadges(completeService, now);
  assert.deepEqual(badges.map((b) => b.id), ["complete-profile", "community-recommended", "fast-response"]);

  const minimalService = {
    address: "",
    description: "",
    serviceItems: [],
    subSpecialties: [],
    rating: "3.5",
    reviews: 1,
    comments: [],
    featured: false,
    verified: false,
    availableNow: false,
    availableUntil: null,
    emergency: false,
    phoneSecondary: "",
  };
  assert.deepEqual(getServiceTrustBadges(minimalService, now), []);
});

test("on-duty pharmacies, clinics, and emergency services adapt to shift and filter (#2)", () => {
  const nightTime = new Date(2026, 5, 1, 23, 0, 0).getTime();
  const fridayTime = new Date(2026, 5, 5, 13, 0, 0).getTime();
  const dayTime = new Date(2026, 5, 2, 13, 0, 0).getTime();

  assert.equal(getDutyShiftInfo(nightTime).mode, "night");
  assert.equal(getDutyShiftInfo(fridayTime).mode, "friday");
  assert.equal(getDutyShiftInfo(dayTime).mode, "day");

  const clinicList = getOnDutyServices(sampleServices, initialCategories, "clinics", dayTime);
  assert.ok(clinicList.length > 0);
  assert.ok(clinicList.every((item) => {
    const parentId = getCategory(item.category, initialCategories).parentId;
    return parentId === "clinics" || parentId === "labs";
  }));
});

test("public utility numbers cover essential Ganzour & national emergency hotlines (#10)", () => {
  assert.ok(publicUtilityNumbers.length >= 6);
  const numbers = publicUtilityNumbers.map((item) => item.number);
  for (const num of ["123", "122", "180", "121", "125", "129"]) {
    assert.ok(numbers.includes(num), `includes ${num}`);
  }
});

test("sanitizeUtilityNumbers preserves custom admin numbers and falls back when empty", () => {
  assert.deepEqual(sanitizeUtilityNumbers(null), publicUtilityNumbers);
  assert.deepEqual(sanitizeUtilityNumbers([]), publicUtilityNumbers);
  const custom = sanitizeUtilityNumbers([
    { id: "custom-1", name: "سنترال جنزور", number: "0481234567", category: "اتصالات", detail: "خدمة الخطوط الأرضية", tone: "emerald" },
  ]);
  assert.equal(custom.length, 1);
  assert.equal(custom[0].name, "سنترال جنزور");
  assert.equal(custom[0].number, "0481234567");
  assert.equal(custom[0].tone, "emerald");
});

test("getCompletionFieldSuggestions returns profession-tailored suggestions for each field", () => {
  const clinicSuggestions = getCompletionFieldSuggestions(
    "pediatrics",
    initialCategories,
    "أحمد جمال",
    "وسط البلد - جنزور",
  );
  assert.ok(clinicSuggestions.names.length >= 2);
  assert.ok(clinicSuggestions.addresses.some((item) => item.includes("وسط البلد - جنزور")));
  assert.ok(clinicSuggestions.descriptions.some((item) => item.includes("الأطفال")));
  assert.ok(clinicSuggestions.subSpecialties.length >= 3);
  assert.ok(clinicSuggestions.serviceItems.length >= 3);
});

test("isServiceOwner restricts service update visibility to the service owner only", () => {
  const service = {
    id: "service-123",
    name: "د. سارة أحمد",
    phone: "01066778899",
    phoneSecondary: "01200001111",
  };
  assert.equal(isServiceOwner(service, { role: "guest" }), false);
  assert.equal(isServiceOwner(service, { role: "member", name: "محمود علي", phone: "01199998888" }), false);
  assert.equal(isServiceOwner(service, { role: "member", name: "مستخدم", phone: "+201066778899" }), true);
  assert.equal(isServiceOwner(service, { role: "member", name: "د. سارة أحمد", phone: "01500000000" }), true);
  assert.equal(isServiceOwner(service, { role: "guest" }, ["service-123"]), true);
});

test("iconArabicLabels provides an Arabic display name for every icon in iconNames", () => {
  for (const icon of iconNames) {
    assert.ok(iconArabicLabels[icon] && /[\u0600-\u06FF]/.test(iconArabicLabels[icon]), `Missing Arabic label for ${icon}`);
  }
});

test("sanitizeDesignSettings validates all 8 design customizer groups and falls back safely", () => {
  assert.deepEqual(sanitizeDesignSettings(null), defaultDesignSettings);
  const custom = sanitizeDesignSettings({
    themePreset: "emerald",
    primaryColor: "#0d8a5f",
    headingAlign: "center",
    cardTextAlign: "right",
    borderWidth: "medium",
    buttonShape: "pill",
    iconStyle: "glow",
    mobileColumns: "3",
    featuredDefaultOpen: true,
    authShowBanner: false,
    loginTitle: "أهلاً بك في جنزور",
    announcementEnabled: true,
    announcementText: "تنبيه هام لأهالي جنزور",
    heroStyle: "compact-minimal",
    searchBoxStyle: "pill",
    providerCardLayout: "compact",
    sectionDividerStyle: "gradient",
    cardHoverEffect: "glow",
  });
  assert.equal(custom.themePreset, "emerald");
  assert.equal(custom.primaryColor, "#0d8a5f");
  assert.equal(custom.headingAlign, "center");
  assert.equal(custom.cardTextAlign, "right");
  assert.equal(custom.borderWidth, "medium");
  assert.equal(custom.buttonShape, "pill");
  assert.equal(custom.iconStyle, "glow");
  assert.equal(custom.mobileColumns, "3");
  assert.equal(custom.featuredDefaultOpen, true);
  assert.equal(custom.authShowBanner, false);
  assert.equal(custom.loginTitle, "أهلاً بك في جنزور");
  assert.equal(custom.announcementEnabled, true);
  assert.equal(custom.heroStyle, "compact-minimal");
  assert.equal(custom.searchBoxStyle, "pill");
  assert.equal(custom.providerCardLayout, "compact");
  assert.equal(custom.sectionDividerStyle, "gradient");
  assert.equal(custom.cardHoverEffect, "glow");
  assert.ok(Object.keys(designThemePresets).length >= 9);

  const seasonal = sanitizeDesignSettings({
    themePreset: "ramadan",
    seasonalRibbon: "ramadan",
    footerDescription: "دليل جنزور الشامل",
    showFooterStats: false,
    mobileBottomNavEnabled: false,
    showPrayerWeatherBar: true,
    showTransitGuide: true,
  });
  assert.equal(seasonal.themePreset, "ramadan");
  assert.equal(seasonal.seasonalRibbon, "ramadan");
  assert.equal(seasonal.footerDescription, "دليل جنزور الشامل");
  assert.equal(seasonal.showFooterStats, false);
  assert.equal(seasonal.mobileBottomNavEnabled, false);
});

test("community helpers compute prayer times and open-now status accurately", () => {
  const pw = getGanzourPrayerAndWeather(Date.parse("2026-06-15T10:30:00Z"));
  assert.equal(pw.prayers.length, 5);
  assert.ok(pw.nextPrayer.name.length > 0);
  assert.ok(pw.weather.tempC > 0);

  const sampleHours = Array.from({ length: 7 }, () => ({ closed: false, opens: "09:00", closes: "22:00" }));
  const noonTime = new Date(2026, 5, 15, 13, 0, 0).getTime();
  const lateNight = new Date(2026, 5, 15, 23, 30, 0).getTime();
  assert.equal(isOpenByWorkingHours(sampleHours, noonTime), true);
  assert.equal(isOpenByWorkingHours(sampleHours, lateNight), false);
  assert.equal(
    isServiceOpenOrAvailableNow({ availableNow: false, availableUntil: null, workingHours: sampleHours }, noonTime),
    true,
  );
});

test("teacher stage filter, home delivery detector, and group 4 design settings work accurately", () => {
  assert.equal(TEACHER_STAGES.length, 5);
  const teacherService = {
    name: "أ. محمد حسن — مدرس رياضيات",
    description: "تدريس الرياضيات للمرحلة الإعدادية والمرحلة الثانوية",
    subSpecialties: ["المرحلة الإعدادية", "المرحلة الثانوية"],
    serviceItems: [],
  };
  assert.equal(matchesTeacherStage(teacherService, "all"), true);
  assert.equal(matchesTeacherStage(teacherService, "prep"), true);
  assert.equal(matchesTeacherStage(teacherService, "secondary"), true);
  assert.equal(matchesTeacherStage(teacherService, "foundation"), false);
  assert.equal(getTeacherStagesForService(teacherService).length, 2);

  const deliveryService = {
    name: "صيدلية الشفاء بجنزور",
    description: "خدمة على مدار الساعة",
    category: "pharmacies",
    subSpecialties: [],
    serviceItems: [HOME_DELIVERY_TAG],
  };
  const nonDeliveryService = {
    name: "ورشة نجارة الأمل",
    description: "تصنيع غرف نوم وأبواب",
    category: "carpenter",
    subSpecialties: [],
    serviceItems: ["تفصيل موبيليا"],
  };
  assert.equal(supportsHomeDelivery(deliveryService), true);
  assert.equal(supportsHomeDelivery(nonDeliveryService), false);

  const group4Design = sanitizeDesignSettings({
    announcementItems: "خبر أول\nخبر ثاني|خبر ثالث",
    announcementTickerMode: "marquee",
    announcementSpeed: "fast",
    headerPattern: "islamic",
    heroPattern: "stars",
    patternOpacity: "medium",
  });
  assert.equal(group4Design.announcementTickerMode, "marquee");
  assert.equal(group4Design.announcementSpeed, "fast");
  assert.equal(group4Design.headerPattern, "islamic");
  assert.equal(group4Design.heroPattern, "stars");
  assert.equal(group4Design.patternOpacity, "medium");
  assert.deepEqual(parseAnnouncementItems(group4Design), ["خبر أول", "خبر ثاني", "خبر ثالث"]);
});

test("clinic booking filter, schedule summary, and shop catalog WhatsApp order builder work accurately", () => {
  const appointmentClinic = {
    name: "عيادة د. سارة أحمد",
    description: "عيادة طب الأسرة والباطنة، يرجى الاتصال لحجز موعد.",
    subSpecialties: [CLINIC_APPOINTMENT_TAG, "السبت والاثنين والأربعاء"],
    serviceItems: [],
    availableNow: false,
    availableUntil: null,
  };
  const walkinClinic = {
    name: "عيادة د. محمود علي",
    description: "الكشف بأسبقية الحضور يومياً عدا الجمعة",
    subSpecialties: [CLINIC_WALKIN_TAG],
    serviceItems: [],
    availableNow: true,
    availableUntil: new Date(Date.now() + 3600_000).toISOString(),
  };

  assert.equal(getClinicBookingMode(appointmentClinic), "appointment");
  assert.equal(getClinicBookingLabel("appointment"), "حجز مسبق");
  assert.equal(getClinicBookingMode(walkinClinic), "walk-in");
  assert.equal(getClinicBookingLabel("walk-in"), "بأسبقية الحضور");

  assert.equal(matchesClinicFilter(appointmentClinic, "appointment"), true);
  assert.equal(matchesClinicFilter(appointmentClinic, "walk-in"), false);
  assert.equal(matchesClinicFilter(walkinClinic, "walk-in"), true);
  assert.equal(matchesClinicFilter(walkinClinic, "open-today"), true);

  const schedule = getClinicScheduleSummary(appointmentClinic);
  assert.ok(schedule.daysText.includes("السبت"));
  assert.ok(schedule.daysText.includes("الاثنين"));

  const parsedItem = parseShopItemString("وجبة مشويات مشكلة — 120 ج.م");
  assert.equal(parsedItem.name, "وجبة مشويات مشكلة");
  assert.equal(parsedItem.price, "120 ج.م");

  const shopItems = getShopCatalogItems({
    category: "groceries",
    serviceItems: ["لبن جاموسي طازج — 35 ج.م", HOME_DELIVERY_TAG],
  });
  assert.equal(shopItems.length, 1);
  assert.equal(shopItems[0].name, "لبن جاموسي طازج");
  assert.equal(shopItems[0].price, "35 ج.م");

  const fallbackShopItems = getShopCatalogItems({
    category: "food",
    serviceItems: [HOME_DELIVERY_TAG],
  });
  assert.ok(fallbackShopItems.length >= 3);

  const orderMsg = buildShopWhatsappOrderMessage(
    { name: "سوبر ماركت البركة" },
    ["لبن جاموسي طازج — 35 ج.م", "كرتونة بيض طازج"],
    "جنزور / شارع حسيب",
    "الاتصال قبل الوصول",
    true,
  );
  assert.ok(orderMsg.includes("سوبر ماركت البركة"));
  assert.ok(orderMsg.includes("لبن جاموسي طازج — 35 ج.م"));
  assert.ok(orderMsg.includes("جنزور / شارع حسيب"));
  assert.ok(orderMsg.includes("مطلوب توصيل الطلب للمنزل"));
  assert.ok(orderMsg.includes("الاتصال قبل الوصول"));
});

test("extended design & site studio settings sanitize cleanly", () => {
  assert.equal(defaultDesignSettings.prayerCardStyle, "dark-sky");
  assert.equal(defaultDesignSettings.prayerDefaultOpen, false);
  assert.equal(defaultDesignSettings.categorySearchDefaultOpen, false);
  assert.equal(defaultDesignSettings.showCategoryCounts, true);
  assert.equal(defaultDesignSettings.providerCallStripStyle, "sky");
  assert.equal(defaultDesignSettings.cardAnimationSpeed, "normal");
  assert.equal(defaultDesignSettings.allowPublicSubmissions, true);

  const custom = sanitizeDesignSettings({
    prayerCardStyle: "emerald",
    prayerDefaultOpen: true,
    categorySearchDefaultOpen: true,
    showCategoryCounts: false,
    providerCallStripStyle: "solid-blue",
    cardAnimationSpeed: "smooth",
    officeAddress: "جنزور — بجوار المسجد الكبير",
    allowPublicSubmissions: false,
    themePreset: "turquoise-nile",
    announcementTickerMode: "vertical-slide",
    announcementSpeed: "turbo",
    detailNameBoxColor: "#1e3a8a",
    outerCardStyle: "bordered",
    searchTriggerStyle: "gold-accent",
    badgesDefaultOpen: true,
  });
  assert.equal(custom.prayerCardStyle, "emerald");
  assert.equal(custom.prayerDefaultOpen, true);
  assert.equal(custom.categorySearchDefaultOpen, true);
  assert.equal(custom.showCategoryCounts, false);
  assert.equal(custom.providerCallStripStyle, "solid-blue");
  assert.equal(custom.cardAnimationSpeed, "smooth");
  assert.equal(custom.officeAddress, "جنزور — بجوار المسجد الكبير");
  assert.equal(custom.allowPublicSubmissions, false);
  assert.equal(custom.themePreset, "turquoise-nile");
  assert.equal(custom.announcementTickerMode, "vertical-slide");
  assert.equal(custom.announcementSpeed, "turbo");
  assert.equal(custom.detailNameBoxColor, "#1e3a8a");
  assert.equal(custom.outerCardStyle, "bordered");
  assert.equal(custom.searchTriggerStyle, "gold-accent");
  assert.equal(custom.badgesDefaultOpen, true);
  assert.equal(custom.sponsorModalEnabled, false);
  assert.equal(custom.sponsorModalDelaySeconds, 10);
  assert.equal(custom.showDailyOffersSection, false);
  assert.equal(custom.showSponsorsRibbon, false);
  assert.equal(defaultDesignSettings.themeMode, "dark");
  assert.equal(defaultDesignSettings.sectionHeadingStyle, "clean");

  const extendedVisuals = sanitizeDesignSettings({
    sectionHeadingStyle: "royal-ribbon",
    buttonShape: "cut-corner",
    buttonEffect: "gradient-flow",
    cardHoverEffect: "float-3d",
    cardAnimationSpeed: "bouncy",
    announcementSpeed: "flash",
  });
  assert.equal(extendedVisuals.sectionHeadingStyle, "royal-ribbon");
  assert.equal(extendedVisuals.buttonShape, "cut-corner");
  assert.equal(extendedVisuals.buttonEffect, "gradient-flow");
  assert.equal(extendedVisuals.cardHoverEffect, "float-3d");
  assert.equal(extendedVisuals.cardAnimationSpeed, "bouncy");
  assert.equal(extendedVisuals.announcementSpeed, "flash");

  const parsedSponsors = catalog.parseSponsoredProviders(custom.sponsoredProvidersJson);
  assert.ok(parsedSponsors.length >= 3);
  assert.equal(parsedSponsors[0].badgeLabel, "راعي معتمد 👑");

  const activeTrial = catalog.getSponsorTrialStatus(
    { planType: "trial-10-days", trialStartDate: "2026-10-10" },
    new Date("2026-10-13T12:00:00Z"),
  );
  assert.equal(activeTrial.isTrial, true);
  assert.equal(activeTrial.elapsedDays, 3);
  assert.equal(activeTrial.remainingDays, 7);
  assert.equal(activeTrial.isExpired, false);

  const expiredTrial = catalog.getSponsorTrialStatus(
    { planType: "trial-10-days", trialStartDate: "2026-10-01" },
    new Date("2026-10-13T12:00:00Z"),
  );
  assert.equal(expiredTrial.isExpired, true);
  assert.equal(expiredTrial.remainingDays, 0);

  assert.equal(catalog.getSponsorOfferCategoryGroup(parsedSponsors[0]), "clinics");
  assert.equal(catalog.getSponsorOfferCategoryGroup(parsedSponsors[1]), "labs");
  assert.equal(catalog.getSponsorOfferCategoryGroup(parsedSponsors[2]), "shops");

  const royalBlueSnippet = `'royal-blue': {
  '50': '#edf7ff',
  '100': '#d7edff',
  '200': '#b8e0ff',
  '300': '#88cfff',
  '400': '#50b4ff',
  '500': '#2794ff',
  '600': '#1079ff',
  '700': '#095de2',
  '800': '#0f4ebe',
  '900': '#134595',
  '950': '#112b5a',
}`;
  const parsedScale = catalog.parseColorScaleOrThemeJson(royalBlueSnippet);
  assert.equal(parsedScale.detectedFormat, "scale-50-950");
  assert.equal(parsedScale.settings.themePreset, "royal-blue");
  assert.equal(parsedScale.settings.pageBgColor, "#edf7ff");
  assert.equal(parsedScale.settings.modalHeaderBg, "#d7edff");
  assert.equal(parsedScale.settings.borderColor, "#b8e0ff");
  assert.equal(parsedScale.settings.buttonColor, "#1079ff");
  assert.equal(parsedScale.settings.primaryColor, "#095de2");
  assert.equal(parsedScale.settings.announcementBgColor, "#0f4ebe");
  assert.equal(parsedScale.settings.detailNameBoxColor, "#134595");
  assert.equal(parsedScale.settings.footerBgColor, "#112b5a");
  assert.equal(parsedScale.settings.darkPageBgColor, "#112b5a");
  assert.equal(parsedScale.settings.darkCardBgColor, "#134595");
  assert.equal(parsedScale.settings.darkBorderColor, "#0f4ebe");
  assert.equal(parsedScale.settings.darkPrimaryColor, "#50b4ff");
});










test("guest gate: visitors browse without contact numbers; members and the admin toggle unlock them", async () => {
  const gateSource = readFileSync(new URL("../src/lib/membership-gate.ts", import.meta.url), "utf8");
  const gate = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(gateSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } }).outputText).toString("base64")}`);
  const design = { ...defaultDesignSettings };
  assert.equal(design.membershipRequired, true);
  assert.equal(gate.guestLocked({ role: "guest" }, design), true);
  assert.equal(gate.guestLocked({ role: "member" }, design), false);
  assert.equal(gate.guestLocked({ role: "guest" }, { ...design, membershipRequired: false }), false);
  const data = { designSettings: design, services: [{ id: "a", name: "x", phone: "01000000000", phoneSecondary: "01100000000", menuWhatsapp: "01200000000", area: "جنزور" }] };
  const masked = gate.directoryForViewer(data, { role: "guest" });
  assert.deepEqual(masked.services[0], { ...data.services[0], phone: "", phoneSecondary: "", menuWhatsapp: "" });
  assert.equal(data.services[0].phone, "01000000000", "source data must stay untouched");
  assert.equal(gate.directoryForViewer(data, { role: "member" }).services[0].phone, "01000000000");
  assert.equal(gate.safeNextPath("https://evil.com"), "/");
  assert.equal(gate.safeNextPath("//evil.com"), "/");
  assert.equal(gate.safeNextPath("/categories/clinics"), "/categories/clinics");
  assert.equal(gate.postAuthDestination("admin", "/categories/clinics"), "/admin");
  assert.equal(gate.postAuthDestination("member", "/categories/clinics"), "/categories/clinics");
});

test("ad banners: live filter, image URL versioning and data-URL parsing limits", () => {
  const { isAdLive, adImageUrl, parseAdImageDataUrl, AD_IMAGE_MAX_BYTES } = catalog;
  const base = { id: "a1", title: "x", caption: "", serviceId: null, whatsapp: "", active: true, startsAt: null, endsAt: null, sortOrder: 0, durationSeconds: 6, imageMime: "image/gif", hasImage: true, imageVersion: 3, template: "", createdAt: "2026-01-01T00:00:00.000Z" };
  const now = new Date("2026-10-23T12:00:00Z");
  assert.equal(isAdLive(base, now), true);
  assert.equal(isAdLive({ ...base, active: false }, now), false);
  assert.equal(isAdLive({ ...base, hasImage: false }, now), false);
  assert.equal(isAdLive({ ...base, startsAt: "2026-11-01T00:00:00.000Z" }, now), false, "not started yet");
  assert.equal(isAdLive({ ...base, endsAt: "2026-10-01T00:00:00.000Z" }, now), false, "already ended");
  assert.equal(isAdLive({ ...base, startsAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-12-01T00:00:00.000Z" }, now), true);
  assert.equal(adImageUrl(base), "/api/ad-banner/a1?v=3");
  const payload = `GIF89a${"x".repeat(200)}`;
  const gif = parseAdImageDataUrl(`data:image/gif;base64,${Buffer.from(payload).toString("base64")}`);
  assert.equal(gif.mime, "image/gif");
  assert.equal(Buffer.from(gif.base64, "base64").toString(), payload);
  assert.throws(() => parseAdImageDataUrl(`data:image/gif;base64,${Buffer.from("GIF89a").toString("base64")}`), /فارغ|تالف/);
  assert.throws(() => parseAdImageDataUrl("data:text/html;base64,PGI+"), /GIF|PNG|صورة/);
  assert.throws(() => parseAdImageDataUrl("not a data url"), Error);
  assert.throws(() => parseAdImageDataUrl(`data:image/png;base64,${"A".repeat(Math.ceil((AD_IMAGE_MAX_BYTES + 1024) * 4 / 3))}`), /ميجا|حجم/);
});

test("ad templates and EGP price list: live without image, sanitizing, summary", () => {
  const { isAdLive, adTemplates, isAdTemplateId, sanitizeAdPricing, defaultAdPricing, formatEgp, cheapestAdTier, adPricingSummary } = catalog;
  const base = { active: true, startsAt: null, endsAt: null, hasImage: false, template: "" };
  assert.equal(isAdLive(base), false, "no image and no template → hidden");
  assert.equal(isAdLive({ ...base, template: "ad-space" }), true, "a built-in template needs no upload");
  assert.ok(adTemplates.length >= 6);
  assert.ok(adTemplates.some((template) => template.id === "app-promo"));
  assert.equal(isAdTemplateId("ad-space"), true);
  assert.equal(isAdTemplateId("evil"), false);
  assert.deepEqual(sanitizeAdPricing(undefined), defaultAdPricing);
  const custom = sanitizeAdPricing({ enabled: false, tiers: [{ label: "أسبوعين", days: "14", price: "250.4" }, { label: "", days: 3, price: 10 }, { label: "سالب", days: 7, price: -5 }], note: "x".repeat(400) });
  assert.equal(custom.enabled, false);
  assert.deepEqual(custom.tiers, [{ label: "أسبوعين", days: 14, price: 250 }]);
  assert.equal(custom.note.length, 300);
  assert.deepEqual(sanitizeAdPricing({ tiers: [] }).tiers, defaultAdPricing.tiers, "empty list falls back to defaults");
  assert.equal(formatEgp(150), `${(150).toLocaleString("ar-EG")} ج.م`);
  assert.equal(cheapestAdTier(defaultAdPricing).label, "أسبوع");
  assert.match(adPricingSummary(defaultAdPricing), /أسبوع: .*ج\.م • شهر: /);
});

test("provider of the week rotates weekly through the top-rated approved providers", () => {
  const { pickProviderOfWeek, isoWeekNumber, advertiseRequestMessage, adTemplates } = catalog;
  const make = (name, rating, reviews, extra = {}) => ({ id: name, name, rating, reviews, status: "approved", demo: false, verified: true, category: "clinics", area: "x", phone: "0100", ...extra });
  const pool = [make("a", "4.9", 10), make("b", "4.8", 50), make("c", "4.8", 20), make("d", "4.5", 5), make("e", "4.4", 1), make("f", "4.3", 1), make("pending", "5.0", 99, { status: "pending" }), make("demo", "5.0", 99, { demo: true }), make("unrated", "0", 0)];
  assert.equal(isoWeekNumber(new Date(2026, 0, 1)), 1);
  assert.equal(isoWeekNumber(new Date(2026, 11, 31)), 53);
  const picks = new Set();
  for (let week = 0; week < 10; week += 1) picks.add(pickProviderOfWeek(pool, new Date(2026, 0, 5 + week * 7)).name);
  assert.deepEqual([...picks].sort(), ["a", "b", "c", "d", "e"], "only the best five rotate; pending/demo/unrated never appear");
  assert.equal(pickProviderOfWeek(pool, new Date(2026, 2, 2)), pickProviderOfWeek(pool, new Date(2026, 2, 8)), "same ISO week → same provider");
  assert.equal(pickProviderOfWeek([]), null);
  assert.ok(adTemplates.find((template) => template.id === "pro-of-week")?.auto);
  const message = advertiseRequestMessage({ siteName: "دليل جنزور", name: "وائل", business: "صيدلية", phone: "01000000000", tier: { label: "شهر", days: 30, price: 400 }, kind: "قالب", template: "special-offer", notes: "خصم" });
  assert.match(message, /الباقة: شهر \(30 يوم\)/);
  assert.match(message, /قالب «عرض خاص»/);
  assert.match(message, /ملاحظات: خصم/);
});

test("automatic templates: shop of the month, most reviewed, newest member; transitions and brand colours", () => {
  const { autoTemplateService, nextAdTransition, shadeHex, isHexColor, AD_TRANSITIONS, AD_MOTIONS, adTemplates } = catalog;
  const make = (name, rating, reviews, extra = {}) => ({ id: name, name, rating, reviews, status: "approved", demo: false, verified: true, category: "clinics", area: "x", phone: "0100", createdAt: "2026-01-01T00:00:00.000Z", ...extra });
  const categories = [{ id: "shops", name: "محلات", parentId: null }, { id: "grocery", name: "بقالة", parentId: "shops" }];
  const pool = [make("doc", "4.9", 10), make("shop1", "4.7", 3, { category: "grocery" }), make("shop2", "4.2", 8, { category: "shops" }), make("newest", "0", 0, { createdAt: "2026-09-01T00:00:00.000Z" }), make("talk", "4.0", 99), make("demo", "5", 99, { demo: true, category: "shops" }), make("pending", "5", 99, { status: "pending", createdAt: "2027-01-01T00:00:00.000Z" })];
  for (const id of ["shop-of-month", "most-reviewed", "new-in-directory"]) assert.ok(adTemplates.find((template) => template.id === id)?.auto, `${id} is automatic`);
  const monthPick = autoTemplateService("shop-of-month", pool, categories, new Date(2026, 3, 1));
  assert.ok(["shop1", "shop2"].includes(monthPick.name), "shop of the month comes from shop categories only");
  assert.equal(autoTemplateService("shop-of-month", pool, categories, new Date(2026, 3, 1)).name, autoTemplateService("shop-of-month", pool, categories, new Date(2026, 3, 28)).name, "stable within the month");
  assert.equal(autoTemplateService("most-reviewed", pool, categories).name === "demo", false);
  assert.ok(["talk", "doc", "shop2", "shop1"].includes(autoTemplateService("most-reviewed", pool, categories).name));
  assert.equal(autoTemplateService("new-in-directory", pool, categories).name, "newest", "pending members never appear");
  assert.equal(autoTemplateService("pro-of-week", pool, categories, new Date(2026, 0, 5)).name, "doc");
  assert.equal(autoTemplateService("special-offer", pool, categories), null);
  assert.equal(autoTemplateService("shop-of-month", [], categories), null);
  assert.equal(nextAdTransition("flip", "fade"), "flip", "explicit transition wins");
  for (let i = 0; i < 30; i += 1) { const pick = nextAdTransition("random", "fade"); assert.notEqual(pick, "fade"); assert.notEqual(pick, "random"); assert.ok(AD_TRANSITIONS.some((item) => item.id === pick)); }
  assert.ok(AD_MOTIONS.some((item) => item.id === "none") && AD_MOTIONS.some((item) => item.id === "kenburns"));
  assert.equal(isHexColor("#0b63c9"), true); assert.equal(isHexColor("red"), false); assert.equal(isHexColor("#fff"), false);
  assert.equal(shadeHex("#000000", 0.5), "#808080"); assert.equal(shadeHex("#ffffff", -0.5), "#808080"); assert.equal(shadeHex("nope", 0.5), "nope");
});

test("seasonal greetings: Hijri/fixed/computed occasions, overrides, custom entries and active-today lookup", () => {
  const { occasionsForYear, orthodoxEaster, resolvedGreetings, activeGreetings, sanitizeGreetingSettings, defaultGreetingSettings, liveTickerItems } = catalog;
  const year = occasionsForYear(2026);
  const ramadan = year.find((item) => item.id === "ramadan"), fitr = year.find((item) => item.id === "eid-fitr");
  assert.ok(ramadan && ramadan.start >= "2026-02-16" && ramadan.start <= "2026-02-19", `Ramadan 1447 starts mid-February 2026 (got ${ramadan?.start})`);
  assert.ok(fitr && fitr.start >= "2026-03-18" && fitr.start <= "2026-03-21", `Eid al-Fitr 1447 around 20 March 2026 (got ${fitr?.start})`);
  assert.equal(year.find((item) => item.id === "oct6")?.start, "2026-10-06");
  assert.equal(orthodoxEaster(2026), "2026-04-12");
  assert.equal(orthodoxEaster(2025), "2025-04-20");
  const sham = year.find((item) => item.id === "sham-el-nessim"); assert.equal(sham.start, "2026-04-12"); assert.equal(sham.end, "2026-04-13");
  const settings = sanitizeGreetingSettings({ overrides: { oct6: { message: "كل سنة ومصر طيبة", start: "2026-10-05", end: "2026-10-07" }, labour: { enabled: false }, bogus: { enabled: false } }, custom: [{ name: "مولد القرية", message: "مولد سعيد", start: "2026-11-01", end: "2026-10-01" }, { name: "", message: "x", start: "2026-01-01" }] });
  assert.deepEqual(Object.keys(settings.overrides).sort(), ["labour", "oct6"]);
  assert.equal(settings.custom.length, 1); assert.equal(settings.custom[0].end, "2026-11-01", "end before start collapses to start");
  const resolved = resolvedGreetings(settings, 2026);
  assert.equal(resolved.find((item) => item.id === "oct6").message, "كل سنة ومصر طيبة");
  assert.equal(resolved.find((item) => item.id === "labour").enabled, false);
  assert.deepEqual(activeGreetings(settings, new Date(Date.UTC(2026, 9, 5, 10))).map((item) => item.id), ["oct6"], "override start date counts");
  assert.deepEqual(activeGreetings(settings, new Date(Date.UTC(2026, 4, 1, 10))).map((item) => item.id), [], "disabled occasion never shows");
  assert.deepEqual(activeGreetings(settings, new Date(Date.UTC(2026, 10, 1, 10))).map((item) => item.id), ["custom-" + settings.custom[0].id.split("custom-")[1]]);
  assert.deepEqual(activeGreetings({ ...defaultGreetingSettings, enabled: false }, new Date(Date.UTC(2026, 9, 6, 10))), []);
  assert.deepEqual(activeGreetings(defaultGreetingSettings, new Date(Date.UTC(2026, 0, 1, 10))).map((item) => item.id), ["new-year"]);
  const lines = liveTickerItems([{ id: "oct6", name: "x", icon: "🎖️", message: "كل عام ومصر بخير" }], [{ id: "e1", title: "قافلة طبية", kind: "medical", startsAt: "2026-10-08T08:00:00.000Z", endsAt: null, location: "مركز الشباب", description: "", pinned: false, createdAt: "" }], new Date("2026-10-06T10:00:00Z"));
  assert.equal(lines.length, 2); assert.match(lines[0], /^🎖️ كل عام/); assert.match(lines[1], /قافلة طبية/);
  assert.equal(liveTickerItems([], [{ id: "e2", title: "بعيد", kind: "other", startsAt: "2026-12-01T08:00:00.000Z", endsAt: null, location: "", description: "", pinned: false, createdAt: "" }], new Date("2026-10-06T10:00:00Z")).length, 0, "events further than two weeks stay out of the ticker");
});

test("village events: phases, ICS payload, Google link", () => {
  const { eventPhase, eventIcs, googleCalendarUrl, getEventKind, isEventKind } = catalog;
  const now = new Date("2026-10-06T10:00:00Z");
  assert.equal(eventPhase({ startsAt: "2026-10-06T15:00:00Z", endsAt: null }, now), "today");
  assert.equal(eventPhase({ startsAt: "2026-10-09T15:00:00Z", endsAt: null }, now), "upcoming");
  assert.equal(eventPhase({ startsAt: "2026-10-01T15:00:00Z", endsAt: null }, now), "past");
  assert.equal(eventPhase({ startsAt: "2026-10-05T15:00:00Z", endsAt: "2026-10-07T15:00:00Z" }, now), "today", "multi-day event still running");
  const event = { id: "11111111-2222-4333-8444-555555555555", title: "قافلة طبية, مجانية", kind: "medical", startsAt: "2026-10-08T08:00:00.000Z", endsAt: null, location: "مركز الشباب", description: "سطر١\nسطر٢", pinned: false, createdAt: "" };
  const ics = eventIcs(event, "دليل جنزور", "https://x.test/events?event=1");
  assert.match(ics, /BEGIN:VCALENDAR\r\n/); assert.match(ics, /DTSTART:20261008T080000Z/); assert.match(ics, /DTEND:20261008T100000Z/, "default two-hour duration");
  assert.match(ics, /SUMMARY:🩺 قافلة طبية\\, مجانية/); assert.match(ics, /DESCRIPTION:سطر١\\nسطر٢/); assert.match(ics, /TRIGGER:-P1D/);
  const google = new URL(googleCalendarUrl(event, "دليل جنزور"));
  assert.equal(google.searchParams.get("dates"), "20261008T080000Z/20261008T100000Z"); assert.equal(google.searchParams.get("location"), "مركز الشباب");
  assert.equal(getEventKind("nope").id, "other"); assert.equal(isEventKind("wedding"), true); assert.equal(isEventKind("party"), false);
});

test("Vista Aero theme presets are registered and accepted by the design sanitizer", () => {
  const { designThemePresets, sanitizeDesignSettings, defaultDesignSettings } = catalog;
  const vistaIds = Object.keys(designThemePresets).filter((id) => id.startsWith("vista-"));
  assert.equal(vistaIds.length, 10, "ten Vista themes");
  for (const id of vistaIds) {
    assert.ok(designThemePresets[id], `${id} preset exists`);
    assert.match(designThemePresets[id].label, /Vista/);
    assert.equal(sanitizeDesignSettings({ ...defaultDesignSettings, themePreset: id }).themePreset, id);
  }
  assert.equal(sanitizeDesignSettings({ ...defaultDesignSettings, themePreset: "vista-xp" }).themePreset, defaultDesignSettings.themePreset);
});

test("Windows 11 Fluent theme presets are registered and accepted by the design sanitizer", () => {
  const { designThemePresets, sanitizeDesignSettings, defaultDesignSettings } = catalog;
  const ids = Object.keys(designThemePresets).filter((id) => id.startsWith("win11-"));
  assert.equal(ids.length, 10, "ten Windows 11 themes");
  for (const id of ids) {
    assert.match(designThemePresets[id].label, /Windows 11/);
    assert.equal(designThemePresets[id].badge, "Win 11");
    assert.equal(sanitizeDesignSettings({ ...defaultDesignSettings, themePreset: id }).themePreset, id);
  }
  const fluentCss = readFileSync(new URL("../src/app/fluent.css", import.meta.url), "utf8");
  for (const id of ids.filter((item) => item !== "win11-bloom")) assert.ok(fluentCss.includes(`html[data-design-preset="${id}"]`), `${id} has its own Bloom palette`);
});

test("provider edge tools and tap feedback settings sanitize correctly", () => {
  const { sanitizeDesignSettings, defaultDesignSettings, parseProviderEdgeTools, providerEdgeToolIds } = catalog;
  assert.deepEqual(providerEdgeToolIds, ["call", "whatsapp", "share", "favorite", "copy"]);
  assert.deepEqual(parseProviderEdgeTools("copy,call"), ["copy", "call"], "copy-number tool is optional and off by default");
  assert.equal(defaultDesignSettings.providerEdgeTools, "call,whatsapp,share,favorite");
  assert.deepEqual(parseProviderEdgeTools("favorite, call,bogus,call"), ["favorite", "call"]);
  assert.deepEqual(parseProviderEdgeTools(""), []);
  const cleaned = sanitizeDesignSettings({ ...defaultDesignSettings, providerEdgeTools: "share,nope,whatsapp", providerEdgeToolsPosition: "bottom", tapFeedback: "sound" });
  assert.equal(cleaned.providerEdgeTools, "share,whatsapp");
  assert.equal(cleaned.providerEdgeToolsPosition, "bottom");
  assert.equal(cleaned.tapFeedback, "sound");
  assert.equal(sanitizeDesignSettings({ ...defaultDesignSettings, providerEdgeToolsPosition: "top", providerEdgeTools: 42 }).providerEdgeToolsPosition, "left");
  assert.equal(sanitizeDesignSettings({ ...defaultDesignSettings, providerEdgeTools: 42 }).providerEdgeTools, defaultDesignSettings.providerEdgeTools);
  // legacy key from the previous release still maps onto the new setting
  const legacy = { ...defaultDesignSettings };
  delete legacy.tapFeedback;
  assert.equal(sanitizeDesignSettings({ ...legacy, menuFeedback: "haptic" }).tapFeedback, "haptic");
});

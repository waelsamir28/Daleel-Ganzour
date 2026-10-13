import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const catalog = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const { NEW_SERVICE_DAYS, isNewService, normalizeSearch, isOutsideLaborScope, whatsappUrl, getCategory, initialCategories, categories, iconNames, iconArabicLabels, areas, sampleServices, defaultSettings, settingsTextKeys, sanitizeSettings, defaultDesignSettings, sanitizeDesignSettings, designThemePresets, matchesServiceQuery, suggestSpecialties, getServiceTrustBadges, getDutyShiftInfo, getOnDutyServices, publicUtilityNumbers, sanitizeUtilityNumbers, getCompletionFieldSuggestions, isServiceOwner, isOpenByWorkingHours, isServiceOpenOrAvailableNow, getGanzourPrayerAndWeather, ganzourTransitRoutes, TEACHER_STAGES, getTeacherStagesForService, matchesTeacherStage, HOME_DELIVERY_TAG, supportsHomeDelivery, parseAnnouncementItems } = catalog;

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
  assert.equal(availabilityUpdate("keep", active, now + 1000), active);
  assert.equal(availabilityUpdate(undefined, active), active);
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
  assert.equal(categories.length, 7, "the published roots are the seven village sections");
  assert.deepEqual(categories.map(({ id }) => id), ["crafts", "clinics", "labs", "shops", "teachers", "charities", "other-services"]);
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
  // The catalogue module itself exposes no advertising API any more.
  assert.deepEqual(Object.keys(catalog).filter((name) => /advert|campaign|placement|marquee|^ad[A-Z]|Ad[A-Z]|adPrice|adDays/.test(name)), []);
});

test("colloquial Egyptian synonym dictionary matches everyday queries and specialty suggestions (#6)", () => {
  const plumber = sampleServices.find((item) => item.category === "plumbing") ?? {
    id: "p1", name: "سباك محترف", category: "plumbing", area: "وسط البلد", address: "جنزور", phone: "01000000000", phoneSecondary: "", description: "صيانة", subSpecialties: [], serviceItems: [],
  };
  assert.equal(matchesServiceQuery(plumber, "السباكة", "حنفية"), true);
  assert.equal(matchesServiceQuery(plumber, "السباكة", "ماتور مياه"), true);
  assert.equal(matchesServiceQuery(plumber, "السباكة", "ثلاجة"), false);

  const mockProviders = [{ category: "dentistry" }, { category: "pharmacies" }, { category: "plumbing" }];
  const toothSuggestions = suggestSpecialties("وجع ضرس", initialCategories, mockProviders);
  assert.ok(toothSuggestions[0]?.id === "dentistry", "colloquial dental query suggests dentistry");

  const rxSuggestions = suggestSpecialties("روشته دواء", initialCategories, mockProviders);
  assert.ok(rxSuggestions[0]?.id === "pharmacies", "colloquial rx query suggests pharmacies");
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

test("community helpers compute prayer times, transit routes, and open-now status accurately", () => {
  const pw = getGanzourPrayerAndWeather(Date.parse("2026-06-15T10:30:00Z"));
  assert.equal(pw.prayers.length, 5);
  assert.ok(pw.nextPrayer.name.length > 0);
  assert.ok(pw.weather.tempC > 0);
  assert.ok(ganzourTransitRoutes.length >= 4);

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








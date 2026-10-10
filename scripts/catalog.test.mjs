import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const catalog = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const { NEW_SERVICE_DAYS, isNewService, normalizeSearch, whatsappUrl, getCategory, initialCategories, categories, iconNames, areas, sampleServices, defaultSettings, settingsTextKeys, sanitizeSettings } = catalog;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-06-01T12:00:00Z");

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
  const expected = ["siteName", "heroSubtitle", "heroEyebrow", "tagline", "benefitsHeading", "benefitsText", "contactText", "copyright", "phone", "showEmergency"];
  assert.deepEqual(Object.keys(defaultSettings), expected);
  assert.deepEqual([...settingsTextKeys, "showEmergency"], expected);
  for (const key of ["adPrice", "adDays", "marqueeEnabled"]) assert.equal(key in defaultSettings, false, `${key} is gone`);
  assert.equal(/إعلان/.test(defaultSettings.contactText), false, "the contact text no longer sells advertising");
  assert.equal(defaultSettings.phone, "01222355769");
  assert.equal(defaultSettings.showEmergency, true);
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
  assert.deepEqual(sanitizeSettings({}), defaultSettings);
  // The catalogue module itself exposes no advertising API any more.
  assert.deepEqual(Object.keys(catalog).filter((name) => /advert|campaign|placement|marquee|^ad[A-Z]|Ad[A-Z]|adPrice|adDays/.test(name)), []);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const { getAdMotion, isAdImageUrl, isAdVideoUrl, isAdActive, selectAds, adCtr, HERO_AD_DURATION_MS, initialCategories, adMotionOptions, adBackgroundOptions, getContrastTextColor } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("preserves static legacy ads and resolves each supported motion", () => {
  assert.deepEqual(adMotionOptions.map(({ id }) => id), ["static", "left", "right", "fade"]);
  for (const { id } of adMotionOptions) assert.equal(getAdMotion(id), id);
  for (const invalid of [undefined, null, "", "unknown", 5, {}, []]) assert.equal(getAdMotion(invalid), "static");
});

test("accepts optional, HTTPS and site-relative images", () => {
  for (const value of ["", "https://example.com/product.png", "https://example.com/image?q=1&size=2", "/images/product.png", "/images/%D8%B5%D9%88%D8%B1%D8%A9.png"]) {
    assert.equal(isAdImageUrl(value), true, value);
  }
  const prefix = "https://example.com/";
  assert.equal(isAdImageUrl(prefix + "a".repeat(1000 - prefix.length)), true);
});

test("rejects unsafe schemes, credentials, malformed or oversized image URLs", () => {
  for (const value of ["javascript:alert(1)", "data:image/svg+xml,test", "http://example.com/a.png", "//example.com/a.png", "/\\example.com/a.png", "https://user:password@example.com/a.png", "https://", "product.png", "https://example.com/a b.png", "https://example.com/a\\b.png", `https://example.com/${"a".repeat(1000)}`]) {
    assert.equal(isAdImageUrl(value), false, value);
  }
});

test("chooses contrasting text on both light and dark ad backgrounds", () => {
  for (const { color } of adBackgroundOptions) assert.equal(getContrastTextColor(color), "#173b55");
  assert.equal(getContrastTextColor("#000000"), "#ffffff");
  assert.equal(getContrastTextColor("#ffffff"), "#173b55");
  assert.equal(getContrastTextColor("invalid"), "#173b55");
});

const now = Date.parse("2026-06-01T12:00:00Z");
const active = { id: "ad", status: "approved", paid: true, campaignStatus: "active", startsAt: null, expiresAt: null, placement: "hero", categoryId: "", priority: 0, createdAt: "2026-05-01T00:00:00Z" };
test("only serves approved, paid, active campaigns within their schedule", () => {
  assert.equal(isAdActive(active, now), true);
  for (const change of [{status:"pending"}, {paid:false}, {campaignStatus:"paused"}, {startsAt:"invalid"}, {expiresAt:"invalid"}, {startsAt:"2026-06-02T00:00:00Z"}, {expiresAt:"2026-06-01T12:00:00Z"}]) assert.equal(isAdActive({...active,...change}, now), false);
  assert.equal(isAdActive({...active, startsAt:"2026-06-01T12:00:00Z", expiresAt:"2026-06-02T00:00:00Z"},now), true);
  assert.equal(HERO_AD_DURATION_MS, 5000);
});
test("keeps placements separate and matches root and specialty targeting", () => {
  const ads = [{...active, id:"root",placement:"inline",categoryId:"crafts",priority:10}, {...active,id:"electrician",placement:"inline",categoryId:"electricity",priority:20}, {...active,id:"clinic",placement:"inline",categoryId:"clinics"}, {...active,id:"hero"}, {...active,id:"sponsor",placement:"sponsored"}];
  assert.deepEqual(selectAds(ads,"inline","crafts",initialCategories,now).map(a=>a.id),["electrician","root"]);
  assert.deepEqual(selectAds(ads,"inline","plumbing",initialCategories,now).map(a=>a.id),["root"]);
  assert.deepEqual(selectAds(ads,"inline","",initialCategories,now),[]);
  assert.deepEqual(selectAds(ads,"hero","",initialCategories,now).map(a=>a.id),["hero"]);
  assert.deepEqual(selectAds(ads,"sponsored","",initialCategories,now).map(a=>a.id),["sponsor"]);
});
test("supports safe video files and finite zero-impression CTR", () => {
  for(const url of ["","https://example.com/ad.mp4?q=1","/images/ad.webm","https://example.com/ad.ogg"]) assert.equal(isAdVideoUrl(url),true,url);
  for(const url of ["https://example.com/player","javascript:alert(1)","http://example.com/ad.mp4","//example.com/ad.mp4"]) assert.equal(isAdVideoUrl(url),false,url);
  assert.equal(adCtr(0,10),0); assert.equal(adCtr(100,5),5); assert.ok(Math.abs(adCtr(8420,637)-7.5653)<0.001);
});

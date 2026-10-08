import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const { getAdMotion, isAdImageUrl, adMotionOptions, AD_SLIDE_DURATION_MS, adBackgroundOptions, getContrastTextColor } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("preserves static legacy ads and resolves each supported motion", () => {
  assert.deepEqual(adMotionOptions.map(({ id }) => id), ["static", "left", "right", "fade"]);
  for (const { id } of adMotionOptions) assert.equal(getAdMotion(id), id);
  for (const invalid of [undefined, null, "", "unknown", 5, {}, []]) assert.equal(getAdMotion(invalid), "static");
  assert.equal(AD_SLIDE_DURATION_MS, 6500);
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

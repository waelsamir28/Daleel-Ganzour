import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const cookies = new Map();
const ids = [];
async function api(path, method = "GET", body, authenticated = true) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Origin: base, ...(authenticated ? { Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; ") } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (authenticated) for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";")[0], split = pair.indexOf("=");
    cookies.set(pair.slice(0, split), pair.slice(split + 1));
  }
  return { status: response.status, data: await response.json() };
}
const values = {
  businessName: "اختبار إعلان متحرك", text: "كل خدمات نشاطك في إعلان واضح ومتحرك لأهل جنزور", phone: "01012345678",
  backgroundColor: "#e6f3ff", icon: "Store", textSize: 17, highlightWord: "خدمات",
  status: "approved", paid: true, price: 0, expiresAt: null,
};
try {
  const login = await api("/api/auth", "POST", { action: "login", username: process.env.TEST_ADMIN_USERNAME || "admin", password: process.env.TEST_ADMIN_PASSWORD || "admin" });
  assert.equal(login.status, 200);
  const legacy = await api("/api/admin", "POST", { type: "ad", values });
  assert.equal(legacy.status, 201, JSON.stringify(legacy.data));
  let all = (await api("/api/admin")).data.ads;
  const original = all.find((ad) => ad.businessName === values.businessName);
  assert.ok(original); ids.push(original.id);
  assert.equal(original.motion, "static"); assert.equal(original.imageUrl, "");
  console.log("PASS: existing ad payloads default to static with no image");

  for (const motion of ["left", "right", "fade", "static"]) {
    const imageUrl = motion === "left" ? "https://example.com/product.png" : motion === "right" ? "/images/logo-janzour.png" : "";
    const edited = await api("/api/admin", "PATCH", { type: "ad", id: original.id, action: "edit", values: { ...values, motion, imageUrl } });
    assert.equal(edited.status, 200, JSON.stringify(edited.data));
    const saved = (await api("/api/advertisements", "GET", undefined, false)).data.ads.find((ad) => ad.id === original.id);
    assert.equal(saved.motion, motion); assert.equal(saved.imageUrl, imageUrl);
    const html = await (await fetch(base)).text();
    assert.ok(html.includes(`data-ad-id="${original.id}"`));
    if (imageUrl) assert.ok(html.includes(`src="${imageUrl}"`));
  }
  console.log("PASS: all four legacy motion values persist and optional images render in the premium banner");

  for (const invalid of [
    { motion: "invalid" }, { motion: 5 }, { imageUrl: 5 },
    ...["javascript:alert(1)", "data:image/svg+xml,test", "http://example.com/a.png", "//example.com/a.png", "/\\example.com/a.png", "https://user:password@example.com/a.png", `https://example.com/${"a".repeat(1000)}`].map((imageUrl) => ({ imageUrl })),
    { status: "approved", paid: false },
  ]) {
    const rejected = await api("/api/admin", "PATCH", { type: "ad", id: original.id, action: "edit", values: { ...values, ...invalid } });
    assert.equal(rejected.status, 400, JSON.stringify(invalid));
  }
  const unchanged = (await api("/api/advertisements", "GET", undefined, false)).data.ads.find((ad) => ad.id === original.id);
  assert.equal(unchanged.motion, "static"); assert.equal(unchanged.imageUrl, "");
  console.log("PASS: invalid motion, unsafe/oversized images and unpaid publication rejected without changing saved ads");

  const submitted = await api("/api/advertisements", "POST", { ...values, motion: "left", imageUrl: "https://example.com/a.png" }, false);
  assert.equal(submitted.status, 201); ids.push(submitted.data.id);
  all = (await api("/api/admin")).data.ads;
  const pending = all.find((ad) => ad.id === submitted.data.id);
  assert.equal(pending.status, "pending"); assert.equal(pending.paid, false);
  assert.equal(pending.motion, "static"); assert.equal(pending.imageUrl, "");
  assert.ok(!(await api("/api/advertisements", "GET", undefined, false)).data.ads.some((ad) => ad.id === pending.id));
  console.log("PASS: public requests cannot bypass admin design approval or payment gating");
} finally {
  for (const id of ids) assert.equal((await api("/api/admin", "DELETE", { type: "ad", id })).status, 200);
  await api("/api/auth", "DELETE");
}

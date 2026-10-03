import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
class Client {
  cookies = new Map();
  async api(path, method = "GET", body, origin = base) {
    const response = await fetch(`${base}${path}`, { method, redirect: "manual", headers: { "Content-Type": "application/json", Origin: origin, Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; ") }, ...(body ? { body: JSON.stringify(body) } : {}) });
    for (const header of response.headers.getSetCookie()) { const [pair] = header.split(";"), split = pair.indexOf("="), key = pair.slice(0, split), value = pair.slice(split + 1); if (value) this.cookies.set(key, value); else this.cookies.delete(key); }
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { response, data };
  }
}
const visitor = new Client(), member = new Client(), admin = new Client();
const suffix = Date.now().toString(36);
let serviceId, adId, memberId, rootId, specialtyId, areaId, savedSettings;
const serviceValues = { name: "اختبار آلي - حرفي جنزور", category: "carpentry", area: "عنوان آخر", address: "جنزور / بجوار مدرسة الاختبار", phone: "01012345678", description: "بيانات اختبار للتحقق من مراجعة المهنة والعنوان الآخر قبل موافقة الإدارة.", emergency: true };
try {
  assert.equal((await visitor.api("/api/health")).data.ok, true);
  const initial = (await visitor.api("/api/services")).data;
  assert.equal(initial.categories.filter((category) => !category.parentId).length, 6);
  assert.equal(initial.areas.length, 7);
  assert.equal(initial.settings.siteName, "دليل المهن والخدمات بقرية جنزور");
  assert.ok(initial.areas.every((area) => area.name.startsWith("جنزور /")));
  assert.equal((await visitor.api("/api/admin")).response.status, 401);
  assert.equal((await visitor.api("/api/admin/notifications")).response.status, 401);
  const guestAdmin = await visitor.api("/admin"); assert.equal(guestAdmin.response.status, 307); assert.equal(guestAdmin.response.headers.get("location"), "/login");
  const publicHtml = (await visitor.api("/")).data; assert.ok(!publicHtml.includes('href="/admin"'));
  assert.equal((await visitor.api("/api/auth", "POST", { action: "register", username: "admin", name: "اختبار", phone: "01012345678", password: "admin", confirmPassword: "admin" })).response.status, 400);
  console.log("PASS: six primary categories, seven Janzour addresses; admin is hidden and protected");
  const registration = await member.api("/api/auth", "POST", { action: "register", name: "عضو اختبار جنزور", username: `qa.${suffix}`, phone: "01012345678", password: "test-pass-123", confirmPassword: "test-pass-123", role: "admin" });
  assert.equal(registration.response.status, 201); assert.equal(registration.data.role, "member");
  const viewer = (await member.api("/api/auth")).data.viewer; assert.equal(viewer.role, "member"); memberId = viewer.id;
  const afterMember = (await visitor.api("/api/services")).data;
  assert.equal(afterMember.memberCount, initial.memberCount + 1); assert.equal(afterMember.services.length, initial.services.length);
  assert.ok(!JSON.stringify(afterMember).includes('"passwordHash"')); assert.ok(!afterMember.members);
  assert.equal((await member.api("/api/admin")).response.status, 401);
  assert.equal((await member.api("/api/admin", "PATCH", { type: "settings", values: initial.settings })).response.status, 401);
  const memberAdmin = await member.api("/admin"); assert.equal(memberAdmin.response.headers.get("location"), "/account");
  await member.api("/api/auth", "DELETE"); assert.equal((await member.api("/api/auth")).data.viewer.role, "guest");
  assert.equal((await member.api("/api/auth", "POST", { action: "login", username: `qa.${suffix}`, password: "test-pass-123" })).response.status, 200);
  console.log("PASS: independent member registration, accurate count, encrypted-password login and role isolation");
  assert.equal((await visitor.api("/api/services", "POST", { ...serviceValues, address: "" })).response.status, 400);
  const submission = await visitor.api("/api/services", "POST", { ...serviceValues, status: "approved", featured: true, verified: true });
  assert.equal(submission.response.status, 201); assert.equal(submission.data.status, "pending"); serviceId = submission.data.id;
  assert.ok(!(await visitor.api("/api/services")).data.services.some((service) => service.id === serviceId));
  assert.equal((await admin.api("/api/auth", "POST", { action: "login", username: "admin", password: "wrong" })).response.status, 401);
  assert.equal((await admin.api("/api/auth", "POST", { action: "login", username: "admin", password: "admin" })).response.status, 200);
  const adminData = (await admin.api("/api/admin")).data;
  const pending = adminData.services.find((service) => service.id === serviceId); assert.equal(pending.verified, false); assert.equal(pending.featured, false); assert.equal(pending.address, serviceValues.address);
  const notice = adminData.notifications.find((notification) => notification.entityId === serviceId); assert.ok(notice && !notice.read && notice.type === "service");
  await admin.api("/api/admin", "PATCH", { type: "notification", id: notice.id, action: "read" });
  assert.equal((await admin.api("/api/admin")).data.notifications.find((notification) => notification.id === notice.id).read, true);
  assert.equal((await admin.api("/api/admin", "PATCH", { id: serviceId, type: "service", action: "approve" })).response.status, 200);
  assert.ok((await visitor.api("/api/services")).data.services.some((service) => service.id === serviceId));
  const specialtyPage = await visitor.api("/categories/crafts/carpentry"); assert.equal(specialtyPage.response.status, 200); assert.ok(specialtyPage.data.includes(serviceValues.name));
  await admin.api("/api/admin", "PATCH", { id: serviceId, type: "service", action: "edit", values: { ...serviceValues, name: "اختبار آلي - بيانات معدلة", status: "approved", verified: true, featured: true, demo: false } });
  assert.equal((await visitor.api("/api/services")).data.services.find((service) => service.id === serviceId).name, "اختبار آلي - بيانات معدلة");
  console.log("PASS: other-address validation, moderation, persistent notifications and editable service records");
  const categoryValues = { name: "قسم اختبار", color: "#ff941f", icon: "Wrench", description: "تصنيف مؤقت لاختبار إدارة الموقع", sortOrder: 20, active: true, slug: `qa-${suffix}` };
  let result = await admin.api("/api/admin", "POST", { type: "category", values: categoryValues }); assert.equal(result.response.status, 201); rootId = result.data.categories.find((category) => category.id === categoryValues.slug).id;
  result = await admin.api("/api/admin", "POST", { type: "category", values: { ...categoryValues, name: "تخصص اختبار", parentId: rootId, slug: `qa-specialty-${suffix}` } }); assert.equal(result.response.status, 201); specialtyId = result.data.categories.find((category) => category.id === `qa-specialty-${suffix}`).id;
  assert.equal((await visitor.api(`/categories/${rootId}`)).response.status, 200);
  assert.equal((await visitor.api(`/categories/${rootId}/${specialtyId}`)).response.status, 200);
  assert.equal((await admin.api("/api/admin", "DELETE", { type: "category", id: rootId })).response.status, 409);
  await admin.api("/api/admin", "PATCH", { type: "category", id: rootId, values: { ...categoryValues, active: false } });
  assert.ok(!(await visitor.api("/api/services")).data.categories.some((category) => category.id === rootId || category.id === specialtyId));
  await admin.api("/api/admin", "PATCH", { type: "category", id: rootId, values: { ...categoryValues, active: true } });
  result = await admin.api("/api/admin", "POST", { type: "area", values: { name: `جنزور / عنوان اختبار ${suffix}`, sortOrder: 20 } }); assert.equal(result.response.status, 201); areaId = result.data.areas.find((area) => area.name === `جنزور / عنوان اختبار ${suffix}`).id;
  await admin.api("/api/admin", "PATCH", { type: "area", id: areaId, values: { name: `جنزور / عنوان معدل ${suffix}`, sortOrder: 21 } });
  assert.ok((await visitor.api("/api/services")).data.areas.some((area) => area.name === `جنزور / عنوان معدل ${suffix}`));
  console.log("PASS: dynamic category and specialty pages, safe deletion, hide/show and editable addresses");
  savedSettings = (await admin.api("/api/admin")).data.settings;
  const revised = { ...savedSettings, heroSubtitle: "وصف اختبار قابل للتعديل", adPrice: 65, adDays: 3, marqueeSpeed: 20 };
  assert.equal((await admin.api("/api/admin", "PATCH", { type: "settings", values: revised })).response.status, 200);
  assert.equal((await visitor.api("/api/services")).data.settings.heroSubtitle, revised.heroSubtitle);
  result = await visitor.api("/api/advertisements", "POST", { businessName: "إعلان اختبار جنزور", text: "إعلان اختبار للتحقق من المراجعة وتأكيد الدفع والإعدادات المحفوظة.", phone: "01222355769", paid: true, status: "approved", price: 0 }); assert.equal(result.response.status, 201); adId = result.data.id;
  const pendingAd = (await admin.api("/api/admin")).data.ads.find((ad) => ad.id === adId); assert.equal(pendingAd.price, 65); assert.equal(pendingAd.paid, false);
  assert.ok(!(await visitor.api("/api/advertisements")).data.ads.some((ad) => ad.id === adId));
  await admin.api("/api/admin", "PATCH", { type: "ad", id: adId, action: "approve" });
  const activeAd = (await visitor.api("/api/advertisements")).data.ads.find((ad) => ad.id === adId); assert.equal(activeAd.paid, true); assert.ok(new Date(activeAd.expiresAt).getTime() - Date.now() > 2.9 * 86400000);
  await admin.api("/api/admin", "PATCH", { type: "settings", values: { ...revised, marqueeEnabled: false } });
  assert.equal((await visitor.api("/api/services")).data.settings.marqueeEnabled, false);
  const crossOrigin = await admin.api("/api/admin", "PATCH", { type: "settings", values: revised }, "https://not-allowed.example"); assert.equal(crossOrigin.response.status, 403);
  await admin.api("/api/admin", "PATCH", { type: "member", id: memberId, values: { active: false } });
  assert.equal((await member.api("/api/auth")).data.viewer.role, "guest");
  console.log("PASS: editable site content and advertising price/duration/speed; payment gating, CSRF and member suspension");
} finally {
  await admin.api("/api/auth", "POST", { action: "login", username: "admin", password: "admin" });
  if (savedSettings) await admin.api("/api/admin", "PATCH", { type: "settings", values: savedSettings });
  for (const [type, id] of [["service", serviceId], ["ad", adId], ["member", memberId], ["category", specialtyId], ["category", rootId], ["area", areaId]]) if (id) await admin.api("/api/admin", "DELETE", { type, id });
  await admin.api("/api/auth", "DELETE"); assert.equal((await admin.api("/api/admin")).response.status, 401);
  console.log("PASS: test data cleaned up, defaults restored and logout revokes access");
}

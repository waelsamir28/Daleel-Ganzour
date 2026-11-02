const CACHE_PREFIX = "daleel-janzour-shell";
const CACHE_NAME = `${CACHE_PREFIX}-v4`;
const PAGES_CACHE = `${CACHE_PREFIX}-pages-v1`;
const DATA_CACHE = `${CACHE_PREFIX}-api-v1`;
const OFFLINE_PAGE = "/offline.html";
/** صفحة أكواد المحمول تُحفظ مسبقًا لأنها الأكثر احتياجًا وقت نفاد الرصيد/انقطاع الإنترنت. */
const TELECOM_PAGE = "/telecom";
const PRECACHE = [OFFLINE_PAGE, TELECOM_PAGE, "/"];
/** ردود صغيرة تتغير كتير: نحفظها وبنحدّثها في الخلفية، فيشتغل التطبيق بدون نت. */
const DATA_PATHS = ["/api/status", "/api/site-alert", "/api/services", "/api/site-audio"];
/** أقصى عدد صفحات محفوظة (بعد كده نمسح الأقدم) حتى لا يكبر التخزين على الموبايل. */
const MAX_PAGES = 40;
/** صفحات فيها بيانات شخصية أو جلسات: لا تُحفظ في الكاش إطلاقًا (خصوصية على الأجهزة المشتركة). */
const PRIVATE_PREFIXES = ["/admin", "/my", "/account", "/login", "/register", "/track", "/availability", "/profile"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE.map((path) => cache.add(path))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![CACHE_NAME, PAGES_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "تنبيه من دليل جنزور", body: "لديك تحديث جديد لأهل القرية.", url: "/" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { /* بيانات غير JSON */ }
  event.waitUntil(self.registration.showNotification(data.title || "تنبيه من دليل جنزور", {
    body: data.body || "لديك تحديث جديد.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "ar",
    tag: "janzour-update",
    data: { url: data.url || "/" },
  }));
});
// الضغط على الإشعار يفتح الرابط المرفق (مثل /telecom أو قسم معيّن) بدل الصفحة الرئيسية دائمًا.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.includes(target));
    if (existing) return existing.focus();
    return self.clients.openWindow(target);
  }));
});

/** مسح أقدم الصفحات المحفوظة لما العدد يزيد على الحد. */
async function trimPages(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_PAGES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_PAGES).map((key) => cache.delete(key)));
}

/** صفحات التنقل: الشبكة أولًا، ولو فشلت نرجّع نفس الصفحة المحفوظة ثم الرئيسية ثم صفحة الطوارئ. */
async function handleNavigation(request) {
  const pages = await caches.open(PAGES_CACHE);
  const path = new URL(request.url).pathname;
  // الصفحات الخاصة: شبكة فقط، بدون أي حفظ.
  if (PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    try { return await fetch(request); } catch { return (await caches.match(OFFLINE_PAGE)) || Response.error(); }
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      void pages.put(request, copy).then(() => trimPages(pages)).catch(() => undefined);
    }
    return response;
  } catch {
    const cached = await pages.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const home = await pages.match("/") || await caches.match("/");
    if (home) return home;
    return (await caches.match(OFFLINE_PAGE)) || Response.error();
  }
}

/** ردود API صغيرة: نرجّع المحفوظ فورًا (لو موجود) وبنحدّثه في الخلفية. */
async function handleData(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) void cache.put(request, response.clone()).catch(() => undefined);
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }
  if (DATA_PATHS.some((path) => url.pathname === path)) {
    event.respondWith(handleData(request));
  }
});

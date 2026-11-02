const CACHE_PREFIX = "daleel-janzour-shell";
const CACHE_NAME = `${CACHE_PREFIX}-v3`;
const OFFLINE_PAGE = "/offline.html";
/** صفحة أكواد المحمول تُحفظ مسبقًا لأنها الأكثر احتياجًا وقت نفاد الرصيد/انقطاع الإنترنت. */
const TELECOM_PAGE = "/telecom";
const PRECACHE = [OFFLINE_PAGE, TELECOM_PAGE];

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
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isTelecom = url.pathname === TELECOM_PAGE || url.pathname === `${TELECOM_PAGE}/`;
  event.respondWith(
    fetch(request)
      .then((response) => {
        // نحدّث نسخة الأكواد المحفوظة كل ما نجح الاتصال حتى تظل متاحة دون إنترنت.
        if (isTelecom && response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(TELECOM_PAGE, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        if (isTelecom) {
          const cached = await cache.match(TELECOM_PAGE);
          if (cached) return cached;
        }
        return (await cache.match(OFFLINE_PAGE)) || Response.error();
      }),
  );
});

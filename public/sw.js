const CACHE_PREFIX = "daleel-janzour-shell";
const CACHE_NAME = `${CACHE_PREFIX}-v2`;
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
  const data = event.data ? event.data.json() : { title: "تنبيه من دليل جنزور", body: "لديك تحديث جديد لأهل القرية." };
  event.waitUntil(self.registration.showNotification(data.title || "تنبيه من دليل جنزور", { body: data.body || "لديك تحديث جديد.", icon: "/icon-192.png", badge: "/icon-192.png", dir: "rtl", lang: "ar" }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => clients[0]?.focus() || self.clients.openWindow("/")));
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

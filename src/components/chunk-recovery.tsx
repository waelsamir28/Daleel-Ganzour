"use client";

import { useEffect } from "react";

/**
 * إنقاذ من فشل تحميل ملفات الموقع (ChunkLoadError):
 * بيحصل لما ننشر نسخة جديدة والتطبيق المفتوح عند الزائر لسه بيطلب ملفات النسخة القديمة،
 * أو لما النت يقطع لحظة التحميل. الحل: تحديث الصفحة مرة واحدة تلقائيًا فترجع النسخة الجديدة.
 * لو الملف لسه مش موجود بعد التحديث، منعملش loop: محاولة واحدة كل دقيقة.
 */
const GUARD_KEY = "janzour-chunk-reload";
const GUARD_MS = 60_000;

function isChunkError(message: string) {
  return /ChunkLoadError|Loading chunk|Failed to load chunk|Importing a module script failed|error loading dynamically imported module/i.test(message);
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(GUARD_KEY) ?? "0");
    if (Date.now() - last < GUARD_MS) return;
    sessionStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch { /* تجاهل مشاكل التخزين — نحدّث على أي حال */ }
  // البحث عن رقم نسخة جديد يمنع المتصفح من استخدام الصفحة القديمة من الكاش.
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()).slice(-6));
  window.location.replace(url.toString());
}

export default function ChunkRecovery() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const message = `${event?.message ?? ""} ${(event?.error as { name?: string } | undefined)?.name ?? ""}`;
      if (isChunkError(message)) reloadOnce();
    }
    function onRejection(event: PromiseRejectionEvent) {
      const reason = event?.reason as { name?: string; message?: string } | string | undefined;
      const message = typeof reason === "string" ? reason : `${reason?.name ?? ""} ${reason?.message ?? ""}`;
      if (isChunkError(message)) reloadOnce();
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}

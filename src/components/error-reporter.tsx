"use client";

import { useEffect } from "react";

/**
 * مُرسل أخطاء المتصفح: يلتقط أخطاء JavaScript غير المعالجة وفشل تحميل الملفات،
 * ويبعت بلاغًا مجهولًا لـ /api/errors (بدون اسم أو رقم — الرسالة تُنظَّف على الخادم).
 * الحد الأقصى بلاغان لكل تحميل صفحة، ونفس الخطأ لا يُرسل مرتين.
 */

const SENT_KEY = "janzour-error-sent";
const MAX_PER_SESSION = 2;

function alreadySent(fingerprint: string) {
  try {
    const raw = sessionStorage.getItem(SENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(fingerprint);
  } catch { return false; }
}

function remember(fingerprint: string) {
  try {
    const raw = sessionStorage.getItem(SENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...list, fingerprint] : [fingerprint];
    sessionStorage.setItem(SENT_KEY, JSON.stringify(next));
    return next.length;
  } catch { return MAX_PER_SESSION; }
}

function report(payload: { message: string; detail?: string; kind?: "client" | "server" }) {
  if (typeof window === "undefined") return;
  const fingerprint = `${payload.message.slice(0, 80)}|${window.location.pathname}`;
  if (alreadySent(fingerprint)) return;
  if (remember(fingerprint) > MAX_PER_SESSION) return;
  const body = JSON.stringify({
    message: payload.message.slice(0, 400),
    detail: (payload.detail ?? "").slice(0, 1200),
    path: `${window.location.pathname}${window.location.search}`.slice(0, 200),
    kind: payload.kind ?? "client",
  });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/errors", blob)) return;
    }
  } catch { /* نكمل بالفِتش */ }
  void fetch("/api/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

export default function ErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      // موارد (<img>/<script>) تيجي كـ error على العنصر نفسه — نتجاهلها لأنها مش أخطاء كود.
      if (!(event instanceof ErrorEvent)) return;
      const target = event.target;
      if (target && target !== window && (target as HTMLElement).tagName) return;
      report({ message: event.message || "خطأ غير معروف في الصفحة", detail: event.error?.stack ?? "" });
    }
    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message = typeof reason === "string" ? reason : (reason?.message ?? "وعد مرفوض بدون رسالة");
      report({ message: `فشل عملية غير متزامنة: ${message}`, detail: reason?.stack ?? "" });
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

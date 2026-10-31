"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import { Logo } from "@/components/ui";

/**
 * شاشة الخطأ العامة: بتظهر للزائر بدل صفحة بيضاء، وتبعت بلاغًا مجهولًا للإدارة
 * (رسالة الخطأ + المسار فقط) حتى نعرف المشكلة قبل ما يشتكي حد.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      void fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message || "خطأ في تحميل الصفحة",
          detail: (error.stack ?? "") + (error.digest ? `\ndigest: ${error.digest}` : ""),
          path: window.location.pathname + window.location.search,
          kind: "server",
        }),
        keepalive: true,
      });
    } catch { /* لا نعطّل شاشة الخطأ بسبب البلاغ */ }
  }, [error]);

  return <div className="admin-login-page"><header className="admin-public-header container"><Logo/></header><main className="empty-state" style={{ maxWidth: 600, width: "calc(100% - 36px)", margin: "70px auto", background: "white", padding: "50px 25px" }}><span><CircleAlert size={36}/></span><h3>حصلت مشكلة بسيطة</h3><p>تعذر تحميل البيانات حاليًا. جرّب مرة أخرى، ولو المشكلة استمرت تواصل مع مكتب الجمال.</p><button className="button button-primary" onClick={reset}><RotateCw size={18}/> حاول مرة أخرى</button></main></div>;
}

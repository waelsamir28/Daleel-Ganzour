"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { Logo } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-login-page"><header className="admin-public-header container"><Logo/></header><main className="empty-state" style={{ maxWidth: 600, width: "calc(100% - 36px)", margin: "70px auto", background: "white", padding: "50px 25px" }}><span><CircleAlert size={36}/></span><h3>حصلت مشكلة بسيطة</h3><p>تعذر تحميل البيانات حاليًا. جرّب مرة أخرى، ولو المشكلة استمرت تواصل مع مكتب الجمال.</p><button className="button button-primary" onClick={reset}><RotateCw size={18}/> حاول مرة أخرى</button></main></div>;
}

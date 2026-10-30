"use client";

import { useEffect, useState } from "react";
import { Check, Flag, Loader2 } from "lucide-react";

type Props = {
  /** نطاق الكود: شركة محمول أو landline أو banks أو gov. */
  scope: string;
  code: string;
  label: string;
};

type State = "idle" | "sending" | "sent" | "error";

const STORAGE_KEY = "janzour-code-reports";

function alreadyReported(key: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(key);
  } catch { return false; }
}

function rememberReport(key: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...new Set([...list, key])].slice(-80) : [key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* التخزين قد يكون ممنوعًا */ }
}

/**
 * زر «الكود ده اتغيّر؟» — بلاغ مجهول (بدون اسم أو رقم) يُسجَّل في إحصاءات الإدارة،
 * ومحدود بمرة واحدة لكل كود على نفس الجهاز.
 */
export default function CodeReportButton({ scope, code, label }: Props) {
  const key = `${scope}:${code}`;
  const [state, setState] = useState<State>("idle");

  // البلاغ المحفوظ محليًا لا يُقرأ على الخادم، فنقرأه بعد أول رسم لتفادي اختلاف الهيدريشن.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- قراءة localStorage لا تتم على الخادم.
    if (alreadyReported(key)) setState("sent");
  }, [key]);

  async function report() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const response = await fetch("/api/telecom/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, code, label }),
      });
      if (!response.ok && response.status !== 204) throw new Error(String(response.status));
      rememberReport(key);
      setState("sent");
    } catch {
      setState("error");
    }
  }

  const text = state === "sent" ? "شكرًا — البلاغ وصل" : state === "error" ? "مش قادرين نبعت — جرّب تاني" : state === "sending" ? "بنبعت…" : "الكود ده اتغيّر؟";

  return (
    <button
      type="button"
      className={`code-report ${state === "sent" ? "is-sent" : ""} ${state === "error" ? "is-error" : ""}`}
      onClick={() => void report()}
      disabled={state === "sending" || state === "sent"}
      title={`بلّغ عن كود ${code} لو مش شغال أو الشركة غيّرته — البلاغ من غير اسم ولا رقم`}
      aria-label={`بلّغ أن الكود ${code} اتغيّر أو مش شغال`}
    >
      {state === "sent" ? <Check size={12} aria-hidden="true"/> : state === "sending" ? <Loader2 size={12} className="code-report-spin" aria-hidden="true"/> : <Flag size={12} aria-hidden="true"/>}
      <span>{text}</span>
    </button>
  );
}

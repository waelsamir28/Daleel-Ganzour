"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Megaphone, Siren, X } from "lucide-react";
import { emergencyAlertKey, type EmergencyAlertDecision, type EmergencyAlertLevel } from "@/lib/emergency-alert";

/** آخر تنبيه محفوظ محليًا (يظهر حتى لو النت قطع أو الصفحة فتحت أوفلاين). */
const CACHE_KEY = "janzour-site-alert";
const DISMISS_KEY = "janzour-site-alert-dismissed";

type ActiveAlert = Extract<EmergencyAlertDecision, { active: true }>;

function levelIcon(level: EmergencyAlertLevel) {
  if (level === "danger") return <Siren size={18}/>;
  if (level === "warning") return <AlertTriangle size={18}/>;
  return <Megaphone size={18}/>;
}

function readCache(): ActiveAlert | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveAlert;
    if (!parsed?.text) return null;
    if (parsed.until && Date.parse(parsed.until) <= Date.now()) return null;
    return parsed;
  } catch { return null; }
}

/**
 * شريط التنبيه الطارئ: الأدمن يكتب سطرًا في الإعدادات فيظهر فورًا أعلى كل صفحات الموقع،
 * وينتهي لوحده بعد المدة اللي اختارها. الزائر يقدر يقفله، والقفل يخص التنبيه ده بس.
 */
export default function EmergencyAlertBar() {
  const [alert, setAlert] = useState<ActiveAlert | null>(() => (typeof window === "undefined" ? null : readCache()));
  const [dismissed, setDismissed] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try { return sessionStorage.getItem(DISMISS_KEY) ?? ""; } catch { return ""; }
  });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/site-alert", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as EmergencyAlertDecision;
      if (data.active) {
        const next: ActiveAlert = data;
        setAlert(next);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      } else {
        setAlert(null);
        try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      }
    } catch { /* أوفلاين: نكمل بآخر تنبيه محفوظ */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب الأول بعد التحميل (خارج السيرفر) هو مصدر الشريط.
    void load();
    window.addEventListener("online", load);
    // تحديث دوري خفيف: لو الأدمن مسح التنبيه يختفي من الأجهزة المفتوحة.
    const timer = window.setInterval(() => { void load(); }, 5 * 60_000);
    return () => { window.removeEventListener("online", load); window.clearInterval(timer); };
  }, [load]);

  if (!alert) return null;
  const key = emergencyAlertKey(alert.text, alert.until);
  if (dismissed === key) return null;

  return (
    <div className={`site-alert-bar is-${alert.level}`} role="alert" aria-live="assertive">
      <span className="site-alert-icon" aria-hidden="true">{levelIcon(alert.level)}</span>
      <p className="site-alert-text">{alert.text}</p>
      <button
        type="button"
        className="site-alert-close"
        aria-label="إخفاء التنبيه"
        title="إخفاء التنبيه"
        onClick={() => {
          setDismissed(key);
          try { sessionStorage.setItem(DISMISS_KEY, key); } catch { /* ignore */ }
        }}
      >
        <X size={16}/>
      </button>
    </div>
  );
}

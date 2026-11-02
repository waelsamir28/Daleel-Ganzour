"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, WifiOff } from "lucide-react";

/**
 * وضع بدون نت: شريط صغير يظهر أول ما الاتصال يقطع ويقول للزائر إنه بيشوف آخر نسخة محفوظة،
 * وزر «تحديث» يظهر فور رجوع الإنترنت. الصفحات نفسها محفوظة بواسطة /sw.js.
 */
export default function OfflineIndicator() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOnline(false); setWasOffline(true); };
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online && !wasOffline) return null;

  return (
    <div className={`offline-bar ${online ? "is-back" : "is-offline"}`} role="status" aria-live="polite">
      <span className="offline-bar-icon" aria-hidden="true">{online ? <RefreshCw size={16}/> : <WifiOff size={16}/>}</span>
      <span className="offline-bar-text">
        {online
          ? "رجعت الشبكة — اضغط تحديث عشان تشوف آخر البيانات."
          : "أنت أوفلاين — بتشوف آخر نسخة محفوظة من الدليل، وأرقام الطوارئ شغالة."}
      </span>
      {online && (
        <button type="button" className="offline-bar-action" onClick={() => window.location.reload()}>
          تحديث
        </button>
      )}
      {!online && (
        <a className="offline-bar-action" href="/offline.html">
          <CloudOff size={14}/> أرقام الطوارئ
        </a>
      )}
    </div>
  );
}

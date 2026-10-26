"use client";

import { useSyncExternalStore } from "react";

function subscribeDark(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** يتابع كلاس html.dark (الذي يضبطه مبدّل الوضع الليلي) حتى تتبدّل الصور بين نسختيها الفاتحة والداكنة فورًا. على الخادم = فاتح. */
export function useIsDark() {
  return useSyncExternalStore(subscribeDark, () => document.documentElement.classList.contains("dark"), () => false);
}

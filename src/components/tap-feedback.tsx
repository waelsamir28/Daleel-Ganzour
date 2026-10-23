"use client";

import { useEffect } from "react";
import { isTapTarget, tapFeedback } from "@/lib/feedback";

// Global tap feedback: every button/link/card press in the app gets the soft tick + light
// vibration configured in استوديو المظهر (respecting the visitor's mute switch in the header).
export default function TapFeedback() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isTapTarget(event.target)) return;
      tapFeedback("tap");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

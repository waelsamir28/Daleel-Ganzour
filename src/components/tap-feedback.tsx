"use client";

import { useEffect } from "react";
import { errorFeedback, isTapTarget, successFeedback, tapFeedback } from "@/lib/feedback";

// Which API calls count as "saving / sending" for the outcome tones (mutations only).
const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Global tap feedback: every button/link/card press in the app gets the soft tick + light
// vibration configured in استوديو المظهر (respecting the visitor's mute switch in the header).
// Outcome tones: a two-note "ding" when a save/send request succeeds, a low buzz when a request
// fails or a form field fails validation.
export default function TapFeedback() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isTapTarget(event.target)) return;
      tapFeedback("tap");
    };
    let lastInvalid = 0;
    const onInvalid = () => {
      const now = Date.now();
      if (now - lastInvalid < 400) return; // one buzz per submit even if several fields are invalid
      lastInvalid = now;
      errorFeedback();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("invalid", onInvalid, true);

    const original = window.fetch;
    const patched: typeof window.fetch = async (input, init) => {
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      const track = MUTATING.has(method) && url.includes("/api/") && !url.includes("/api/hits") && !headers.has("x-silent");
      try {
        const response = await original(input, init);
        if (track) {
          if (response.ok) successFeedback();
          else errorFeedback();
        }
        return response;
      } catch (error) {
        if (track) errorFeedback();
        throw error;
      }
    };
    window.fetch = patched;

    // Inline error notices rendered by forms (e.g. "رقم الهاتف غير صحيح") also get the buzz.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(".form-error, .follow-error, .login-error") || node.querySelector(".form-error, .follow-error, .login-error")) { errorFeedback(); return; }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("invalid", onInvalid, true);
      observer.disconnect();
      if (window.fetch === patched) window.fetch = original;
    };
  }, []);
  return null;
}

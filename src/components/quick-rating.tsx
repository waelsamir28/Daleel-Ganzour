"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Star, X } from "lucide-react";
import { CONTACT_EVENT, QUICK_RATING_STORAGE_KEY, QUICK_RATING_STARS, quickRatingText, rememberRated, shouldAskQuickRating } from "@/lib/quick-rating";

/**
 * بطاقة «قيّمت تجربتك؟» بعد الاتصال أو الواتساب:
 * تظهر بعد ٢٥ ثانية من الضغط (وقت ما يكون الزائر خلص المكالمة القصيرة)، وبحد أقصى مرة
 * واحدة لكل خدمة على كل جهاز. التقييم يتبعت لوحده ومفيش أي بيانات شخصية.
 */

const DELAY_MS = 25_000;
const AUTO_HIDE_MS = 60_000;

type ContactEventDetail = { serviceId?: string; label?: string };

export default function QuickRating() {
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const timer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    function clear() {
      if (timer.current) window.clearTimeout(timer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      timer.current = null; hideTimer.current = null;
    }
    function onContact(event: Event) {
      const detail = (event as CustomEvent<ContactEventDetail>).detail ?? {};
      const serviceId = typeof detail.serviceId === "string" ? detail.serviceId : "";
      if (!serviceId) return;
      let stored: string | null = null;
      try { stored = localStorage.getItem(QUICK_RATING_STORAGE_KEY); } catch { return; }
      if (!shouldAskQuickRating(stored, serviceId)) return;
      clear();
      timer.current = window.setTimeout(() => {
        setTarget({ id: serviceId, name: (detail.label ?? "").trim() });
        setState("idle");
        hideTimer.current = window.setTimeout(() => setTarget(null), AUTO_HIDE_MS);
      }, DELAY_MS);
    }
    window.addEventListener(CONTACT_EVENT, onContact);
    return () => { window.removeEventListener(CONTACT_EVENT, onContact); clear(); };
  }, []);

  async function rate(stars: number) {
    if (!target) return;
    setState("sending");
    try {
      const response = await fetch("/api/ratings/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: target.id, stars }),
      });
      if (!response.ok) throw new Error(String(response.status));
      try { localStorage.setItem(QUICK_RATING_STORAGE_KEY, JSON.stringify(rememberRated(localStorage.getItem(QUICK_RATING_STORAGE_KEY), target.id))); } catch { /* التخزين ممنوع */ }
      setState("sent");
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setTarget(null), 3200);
    } catch {
      setState("error");
    }
  }

  if (!target) return null;
  const copy = quickRatingText(target.name);

  return (
    <div className="quick-rating" role="dialog" aria-label="تقييم سريع لمقدم الخدمة" aria-live="polite">
      <button type="button" className="quick-rating-close" aria-label="إغلاق" onClick={() => setTarget(null)}><X size={14}/></button>
      {state === "sent" ? (
        <p className="quick-rating-done"><Check size={16}/> {copy.thanks}</p>
      ) : (
        <>
          <strong className="quick-rating-title">{copy.title}</strong>
          <p className="quick-rating-body">{state === "error" ? "مش قادرين نبعت التقييم دلوقتي — جرّب تاني." : copy.body}</p>
          <div className="quick-rating-stars" role="group" aria-label="عدد النجوم">
            {QUICK_RATING_STARS.map((value) => (
              <button
                key={value}
                type="button"
                disabled={state === "sending"}
                onClick={() => void rate(value)}
                aria-label={`${value} من 5 نجوم`}
              >
                {state === "sending" ? <LoaderCircle size={22} className="spin"/> : <Star size={22} fill="currentColor"/>}
                <span>{value}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BatteryLow } from "lucide-react";

type BatteryLike = { charging: boolean; level: number; addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void };

// وضع توفير البطارية: when the phone is low on battery (Battery API — Android/Chrome) or asks for
// reduced motion, heavy effects are paused: backdrop blur, fixed Aurora/Bloom backgrounds, hover
// transforms, Ken-Burns ad motion and vibration. The admin can force it on/off from the studio
// (data-design-power-save = auto | on | off); "auto" is the default.
export default function PowerSave() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    let lowBattery = false;
    let battery: BatteryLike | undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => {
      const mode = root.getAttribute("data-design-power-save") ?? "auto";
      const on = mode === "on" || (mode === "auto" && (lowBattery || reduced.matches));
      root.classList.toggle("power-save", on);
      setActive(on);
    };
    const onBattery = () => { if (battery) lowBattery = !battery.charging && battery.level <= 0.2; evaluate(); };
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    if (typeof nav.getBattery === "function") {
      nav.getBattery().then((value) => {
        battery = value;
        battery.addEventListener("levelchange", onBattery);
        battery.addEventListener("chargingchange", onBattery);
        onBattery();
      }).catch(() => evaluate());
    }
    reduced.addEventListener("change", evaluate);
    const observer = new MutationObserver(evaluate);
    observer.observe(root, { attributes: true, attributeFilter: ["data-design-power-save"] });
    evaluate();
    return () => {
      reduced.removeEventListener("change", evaluate);
      observer.disconnect();
      battery?.removeEventListener("levelchange", onBattery);
      battery?.removeEventListener("chargingchange", onBattery);
    };
  }, []);
  if (!active) return null;
  return <span className="power-save-pill" role="status" title="تم إيقاف الضبابية والحركات الثقيلة والاهتزاز مؤقتًا لتوفير البطارية"><BatteryLow size={13}/> وضع توفير البطارية</span>;
}

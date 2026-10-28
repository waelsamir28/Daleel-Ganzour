"use client";

import { useMemo } from "react";
import QRCode from "qrcode";

/** رمز QR حقيقي يُرسم محليًا كـ SVG (بدون أي خدمة خارجية) — واضح على أي مقاس ويعمل بدون إنترنت. */
export default function QrSvg({ value, size = 96, className = "", label = "رمز QR", dark = "#0c2238", light = "#ffffff", quietZone = 2 }: { value: string; size?: number; className?: string; label?: string; dark?: string; light?: string; quietZone?: number }) {
  const { path, modules } = useMemo(() => {
    try {
      const code = QRCode.create(value, { errorCorrectionLevel: "M" });
      const count = code.modules.size;
      const data = code.modules.data;
      let d = "";
      for (let row = 0; row < count; row++) {
        let run = 0;
        for (let col = 0; col <= count; col++) {
          const filled = col < count && data[row * count + col];
          if (filled) run++;
          else if (run) { d += `M${col - run + quietZone} ${row + quietZone}h${run}v1h-${run}z`; run = 0; }
        }
      }
      return { path: d, modules: count };
    } catch {
      return { path: "", modules: 0 };
    }
  }, [value, quietZone]);
  if (!modules) return null;
  const total = modules + quietZone * 2;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} className={className} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={total} height={total} fill={light}/>
      <path d={path} fill={dark}/>
    </svg>
  );
}

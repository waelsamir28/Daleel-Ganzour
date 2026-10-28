"use client";

import { useMemo } from "react";
import QRCode from "qrcode";

/** مصفوفة وحدات QR (حجم الضلع + مصفوفة 0/1) — للرسم على Canvas في الملصقات والصور. */
export function qrMatrix(value: string, errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M"): { size: number; data: Uint8Array } {
  const code = QRCode.create(value, { errorCorrectionLevel });
  return { size: code.modules.size, data: code.modules.data as Uint8Array };
}
/** يرسم رمز QR على سياق Canvas داخل مربع (x, y, side) مع هامش هادئ. */
export function drawQr(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, side: number, dark = "#0c2238", light = "#ffffff", quietZone = 2) {
  const { size, data } = qrMatrix(value, "M");
  const total = size + quietZone * 2;
  const cell = side / total;
  ctx.fillStyle = light; ctx.fillRect(x, y, side, side);
  ctx.fillStyle = dark;
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) if (data[row * size + col]) ctx.fillRect(x + (col + quietZone) * cell, y + (row + quietZone) * cell, Math.ceil(cell), Math.ceil(cell));
}

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

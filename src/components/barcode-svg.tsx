import { code39Modules } from "@/lib/barcode";

/**
 * باركود Code 39 حقيقي يُرسم SVG محليًا (بدون مكتبات أو خدمات خارجية).
 * بيتستخدم في دفتر الأرقام: كل قسم له باركود خاص بيه يفتح صفحته في الدليل.
 */
export default function BarcodeSvg({
  value,
  height = 46,
  moduleWidth = 2,
  className = "",
  color = "#0c2238",
  showText = true,
}: {
  value: string;
  height?: number;
  moduleWidth?: number;
  className?: string;
  color?: string;
  showText?: boolean;
}) {
  const units = code39Modules(value);
  if (!units.length) return null;
  let offset = 0;
  const rects: Array<{ x: number; width: number }> = [];
  for (const unit of units) {
    if (unit.bar) rects.push({ x: offset, width: unit.width });
    offset += unit.width;
  }
  const width = offset * moduleWidth;
  return (
    <span className={`barcode-svg ${className}`.trim()}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`باركود ${value}`} shapeRendering="crispEdges" preserveAspectRatio="none">
        {rects.map((rect, index) => <rect key={index} x={rect.x * moduleWidth} y={0} width={rect.width * moduleWidth} height={height} fill={color}/>)}
      </svg>
      {showText && <span className="barcode-svg-text" dir="ltr">{value}</span>}
    </span>
  );
}

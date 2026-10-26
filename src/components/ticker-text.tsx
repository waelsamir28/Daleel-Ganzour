import type { CSSProperties, ReactNode } from "react";
import { parseTickerItem } from "@/lib/catalog";

/**
 * نص خبر في الشريط المتحرك مع دعم التلوين:
 * `[أحمر] عاجل: …` يلوّن الخبر كله، و`**كلمة**` تُبرز الكلمة بلون الإبراز المختار في الاستوديو.
 * مكوّن بلا هوكس حتى يعمل في صفحات الخادم والعميل معًا.
 */
export function TickerText({ text, className = "", children }: { text: string; className?: string; children?: ReactNode }) {
  const item = parseTickerItem(text);
  const style = item.color ? ({ "--item-fg": item.color } as CSSProperties) : undefined;
  return (
    <span className={`${className} ${item.color ? "has-item-color" : ""}`.trim()} style={style}>
      {item.segments.map((segment, index) => segment.highlight ? <b key={index} className="ticker-hl">{segment.text}</b> : <span key={index}>{segment.text}</span>)}
      {children}
    </span>
  );
}

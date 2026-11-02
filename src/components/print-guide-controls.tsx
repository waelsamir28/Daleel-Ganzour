"use client";

import { Printer, X } from "lucide-react";

/** أزرار أعلى الدليل الورقي: طباعة/حفظ PDF + رجوع. تختفي عند الطباعة نفسها. */
export default function PrintGuideControls({ total, sections }: { total: number; sections: number }) {
  return (
    <div className="print-guide-controls" role="region" aria-label="أدوات الطباعة">
      <span className="print-guide-controls-text">
        <strong>الدليل الورقي</strong>
        <small>{total} خدمة في {sections} قسم — اختر «حفظ كـ PDF» من نافذة الطباعة لو عايز تبعته على واتساب.</small>
      </span>
      <div className="print-guide-controls-actions">
        <button type="button" className="print-guide-btn is-primary" onClick={() => window.print()}>
          <Printer size={16}/> طباعة / حفظ PDF
        </button>
        <a className="print-guide-btn" href="/admin" aria-label="رجوع للوحة الإدارة">
          <X size={16}/> رجوع
        </a>
      </div>
    </div>
  );
}

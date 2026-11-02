"use client";

import { useState } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";

/** أزرار صفحة التكريم: طباعة/حفظ PDF + نسخ منشور جاهز لفيسبوك وواتساب. */
export default function HonorsToolbar({ postText, count }: { postText: string; count: number }) {
  const [copied, setCopied] = useState(false);

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(postText);
    } catch {
      window.prompt("انسخ المنشور:", postText);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="honors-toolbar" role="region" aria-label="أدوات التكريم">
      <span className="honors-toolbar-text">
        <strong>شهادة تكريم الشهر</strong>
        <small>{count > 0 ? `${count} شهادة جاهزة للطباعة أو النشر على فيسبوك وواتساب.` : "لسه مفيش تفاعل كافي الشهر ده — الشهادات تظهر أول ما توصل."}</small>
      </span>
      <div className="honors-toolbar-actions">
        {count > 0 && (
          <button type="button" className="honors-btn" onClick={() => void copyPost()}>
            {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "تم نسخ المنشور" : "نسخ منشور الفيسبوك"}
          </button>
        )}
        {count > 0 && (
          <button type="button" className="honors-btn is-primary" onClick={() => window.print()}>
            <Printer size={16}/> طباعة / حفظ PDF
          </button>
        )}
        {count > 0 && (
          <a className="honors-btn" href={`https://wa.me/?text=${encodeURIComponent(postText)}`} target="_blank" rel="noopener noreferrer">
            <Share2 size={16}/> مشاركة واتساب
          </a>
        )}
      </div>
    </div>
  );
}

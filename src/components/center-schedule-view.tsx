"use client";

import { useState } from "react";
import { ImageDown, LoaderCircle, MessageCircle, Share2 } from "lucide-react";
import { centerScheduleText, groupScheduleByDay, type CenterSchedule } from "@/lib/catalog";

const DAY_COLORS = ["#2f8be8", "#16a37a", "#e8792f", "#9160df", "#d9488a", "#0eb0b1", "#c58a00"];

/** يرسم الجدول صورة (PNG) لمشاركته على واتساب أو تنزيله. */
export async function renderScheduleImage(name: string, schedule: CenterSchedule, siteLabel = "دليل جنزور"): Promise<Blob> {
  const groups = groupScheduleByDay(schedule);
  const W = 1080, pad = 56, rowH = 78, headH = 230, dayH = 64, footH = 120;
  const H = headH + groups.reduce((sum, group) => sum + dayH + group.lessons.length * rowH + 26, 0) + footH;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  try { await document.fonts.ready; } catch { /* ignore */ }
  const font = (weight: number, size: number) => `${weight} ${size}px Cairo, "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif`;
  const grad = ctx.createLinearGradient(0, 0, W, H); grad.addColorStop(0, "#0d8ee0"); grad.addColorStop(0.55, "#0765bd"); grad.addColorStop(1, "#0d3f7d");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe066"; ctx.font = font(900, 34); ctx.fillText("🗓️ جدول الحصص الأسبوعي", W - pad, 70);
  ctx.fillStyle = "#fff"; ctx.font = font(900, 50); ctx.fillText(name, W - pad, 135, W - pad * 2);
  ctx.fillStyle = "#cfe6ff"; ctx.font = font(700, 26); ctx.fillText("من الأحد إلى السبت — بتوقيت جنزور", W - pad, 190);
  let y = headH;
  const round = (x: number, yy: number, w: number, h: number, r: number, fill: string) => { ctx.beginPath(); ctx.roundRect(x, yy, w, h, r); ctx.fillStyle = fill; ctx.fill(); };
  for (const group of groups) {
    const color = DAY_COLORS[group.day];
    const boxH = dayH + group.lessons.length * rowH;
    round(pad, y, W - pad * 2, boxH, 26, "rgba(255,255,255,0.96)");
    round(pad, y, W - pad * 2, dayH, 26, color); ctx.fillRect(pad, y + dayH - 26, W - pad * 2, 26);
    ctx.fillStyle = "#fff"; ctx.font = font(900, 30); ctx.fillText(group.label, W - pad - 26, y + dayH / 2);
    ctx.font = font(800, 22); ctx.textAlign = "left"; ctx.fillText(`${group.lessons.length} حصة`, pad + 26, y + dayH / 2); ctx.textAlign = "right";
    let ry = y + dayH;
    group.lessons.forEach((lesson, index) => {
      if (index > 0) { ctx.fillStyle = "#e6eef8"; ctx.fillRect(pad + 26, ry, W - pad * 2 - 52, 2); }
      const cy = ry + rowH / 2;
      ctx.fillStyle = "#0b2f55"; ctx.font = font(900, 30); ctx.fillText(lesson.subject, W - pad - 26, cy, 330);
      if (lesson.stage) { ctx.font = font(800, 20); const tw = ctx.measureText(lesson.stage).width + 28; round(W - pad - 26 - 345 - tw, cy - 19, tw, 38, 19, `${color}22`); ctx.fillStyle = color; ctx.fillText(lesson.stage, W - pad - 26 - 345 - 14, cy); }
      ctx.fillStyle = "#4b6584"; ctx.font = font(700, 24); ctx.textAlign = "center"; ctx.fillText(lesson.teacher, W / 2 - 60, cy, 260); ctx.textAlign = "right";
      ctx.fillStyle = "#0e6ecc"; ctx.font = font(900, 26); ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.fillText(lesson.time, pad + 26, cy, 220); ctx.direction = "rtl"; ctx.textAlign = "right";
      ry += rowH;
    });
    y += boxH + 26;
  }
  ctx.fillStyle = "#bedcff"; ctx.font = font(700, 24); ctx.textAlign = "center"; ctx.fillText(`${siteLabel} — دليل المهن والخدمات بقرية جنزور`, W / 2, H - 60);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("blob")), "image/png"));
}

export default function CenterScheduleView({ name, schedule, siteUrl }: { name: string; schedule: CenterSchedule; siteUrl?: string }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const groups = groupScheduleByDay(schedule);
  const origin = siteUrl ?? (typeof window === "undefined" ? "https://daleel-ganzour.vercel.app" : window.location.origin);
  async function shareImage(download = false) {
    if (busy) return; setBusy(true); setNote("");
    try {
      const blob = await renderScheduleImage(name, schedule);
      const file = new File([blob], `جدول-${name}.png`, { type: "image/png" });
      if (!download && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `جدول حصص ${name}`, text: `جدول حصص ${name} من دليل جنزور` });
        setNote("تمت مشاركة صورة الجدول.");
      } else {
        const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `جدول-${name}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
        setNote("تم تنزيل صورة الجدول — شاركها من معرض الصور.");
      }
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setNote("تعذر إنشاء الصورة. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }
  if (!groups.length) return <p className="input-help">لم يُضَف جدول حصص بعد.</p>;
  return <div className="center-schedule-view">
    {groups.map((group) => <section key={group.day} className="center-schedule-day" style={{ "--day-color": DAY_COLORS[group.day] } as React.CSSProperties}>
      <h5>{group.label}<span>{group.lessons.length} حصة</span></h5>
      <ul>{group.lessons.map((lesson, index) => <li key={index}><span className="cs-subject"><strong>{lesson.subject}</strong>{lesson.stage && <em>{lesson.stage}</em>}</span>{lesson.teacher && <small>{lesson.teacher}</small>}<b dir="auto">{lesson.time}</b></li>)}</ul>
    </section>)}
    <div className="center-schedule-actions">
      <button type="button" className="button button-primary" onClick={() => void shareImage(false)} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin"/> : <Share2 size={16}/>} مشاركة الجدول صورة</button>
      <button type="button" className="button button-soft" onClick={() => void shareImage(true)} disabled={busy}><ImageDown size={16}/> تنزيل الصورة</button>
      <a className="button button-soft" href={`https://wa.me/?text=${encodeURIComponent(centerScheduleText(name, schedule, origin))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> إرسال نصًا على واتساب</a>
    </div>
    {note && <p className="input-help" role="status">{note}</p>}
  </div>;
}


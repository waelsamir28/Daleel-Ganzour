"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowLeft, Award, BadgePercent, BarChart3, Grid2X2, ImageDown, LoaderCircle, MapPin, Medal, Share2, ShieldCheck, Siren, Sparkles, Star, Users, UsersRound, Zap } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import { Logo } from "@/components/ui";
import { defaultDesignSettings, type DesignSettings, type SiteSettings } from "@/lib/catalog";
import { villageStatsShareText, type VillageStats } from "@/lib/stats";

const arabic = (value: number) => value.toLocaleString("ar-EG");

/** صورة مشاركة مربعة (1080×1350) بأهم الأرقام — تُرسم محليًا على Canvas. */
async function renderStatsImage(stats: VillageStats, siteName: string, host: string): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  try { await document.fonts.ready; } catch { /* ignore */ }
  const font = (weight: number, size: number) => `${weight} ${size}px Cairo, "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif`;
  const grad = ctx.createLinearGradient(0, 0, W, H); grad.addColorStop(0, "#0d8ee0"); grad.addColorStop(0.55, "#0765bd"); grad.addColorStop(1, "#0d3f7d");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe066"; ctx.font = font(900, 40); ctx.fillText("📊 تقرير الدليل", W / 2, 90);
  ctx.fillStyle = "#fff"; ctx.font = font(900, 54); ctx.fillText(siteName, W / 2, 165, W - 120);
  ctx.fillStyle = "#cfe6ff"; ctx.font = font(700, 26); ctx.fillText(new Date(stats.generatedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }), W / 2, 220);
  const tiles: [string, string][] = [
    [arabic(stats.providers), "مهني وخدمة"], [arabic(stats.specialties), "تخصصًا"], [arabic(stats.reviews), "تقييمًا"],
    [arabic(stats.roots), "قسمًا رئيسيًا"], [arabic(stats.areas), "منطقة"], [stats.averageRating ? `${stats.averageRating}/5` : "—", "متوسط التقييم"],
  ];
  const pad = 60, gap = 24, tw = (W - pad * 2 - gap * 2) / 3, th = 190;
  tiles.forEach(([value, label], index) => {
    const x = pad + (index % 3) * (tw + gap), y = 290 + Math.floor(index / 3) * (th + gap);
    ctx.beginPath(); ctx.roundRect(x, y, tw, th, 28); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fill();
    ctx.fillStyle = "#0b4a93"; ctx.font = font(900, 64); ctx.direction = "ltr"; ctx.fillText(value, x + tw / 2, y + 78); ctx.direction = "rtl";
    ctx.fillStyle = "#4b6584"; ctx.font = font(800, 26); ctx.fillText(label, x + tw / 2, y + 142);
  });
  let y = 290 + 2 * (th + gap) + 30;
  ctx.textAlign = "right"; ctx.fillStyle = "#ffe066"; ctx.font = font(900, 34); ctx.fillText("أكثر الأقسام ازدحامًا بالمهنيين", W - pad, y); y += 60;
  const max = Math.max(1, ...stats.topRoots.map((item) => item.count));
  stats.topRoots.slice(0, 6).forEach((item) => {
    ctx.fillStyle = "#fff"; ctx.font = font(800, 28); ctx.fillText(item.name, W - pad, y, 360);
    const bx = pad + 90, bw = W - pad * 2 - 90 - 390, w = Math.max(14, (item.count / max) * bw);
    ctx.beginPath(); ctx.roundRect(bx, y - 16, bw, 32, 16); ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();
    ctx.beginPath(); ctx.roundRect(bx + bw - w, y - 16, w, 32, 16); ctx.fillStyle = item.color || "#ffe066"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = font(900, 26); ctx.textAlign = "left"; ctx.direction = "ltr"; ctx.fillText(String(item.count), pad, y); ctx.direction = "rtl"; ctx.textAlign = "right";
    y += 58;
  });
  ctx.textAlign = "center"; ctx.fillStyle = "#cfe6ff"; ctx.font = font(800, 28); ctx.fillText("كل أرقام مهنيي القرية في مكان واحد — ادخل واطلب خدمتك بضغطة", W / 2, H - 110, W - 100);
  ctx.fillStyle = "#fff"; ctx.font = font(900, 30); ctx.direction = "ltr"; ctx.fillText(host, W / 2, H - 55); ctx.direction = "rtl";
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("تعذر إنشاء الصورة."))), "image/png"));
}

export default function StatsPage({ stats, settings, design }: { stats: VillageStats; settings: SiteSettings; design?: DesignSettings }) {
  const [busy, setBusy] = useState(false);
  const theme = design ?? defaultDesignSettings;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://daleel-ganzour.vercel.app";
  const pageUrl = `${origin}/stats`;
  const host = origin.replace(/^https?:\/\//, "");
  const shareText = villageStatsShareText(stats, settings.siteName, pageUrl);

  async function shareImage(download = false) {
    setBusy(true);
    try {
      const blob = await renderStatsImage(stats, settings.siteName, host);
      const file = new File([blob], "جنزور-في-أرقام.png", { type: "image/png" });
      if (!download && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "تقرير الدليل", text: shareText });
        return;
      }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { /* المستخدم أغلق المشاركة */ }
    finally { setBusy(false); }
  }

  const headline: { icon: React.ReactNode; value: string; label: string; tone: string }[] = [
    { icon: <UsersRound size={22}/>, value: arabic(stats.providers), label: "مهني وخدمة منشورة", tone: "#0e6ecc" },
    { icon: <Grid2X2 size={22}/>, value: arabic(stats.specialties), label: `تخصصًا في ${arabic(stats.roots)} أقسام`, tone: "#9160df" },
    { icon: <Star size={22}/>, value: arabic(stats.reviews), label: stats.averageRating ? `تقييمًا بمتوسط ${stats.averageRating}/5` : "تقييمًا من أهل القرية", tone: "#e8a000" },
    { icon: <MapPin size={22}/>, value: arabic(stats.areas), label: "منطقة وحيًّا في جنزور", tone: "#16a37a" },
    { icon: <ShieldCheck size={22}/>, value: arabic(stats.verified), label: "تم التحقق منهم بالمعاينة", tone: "#0eb0b1" },
    { icon: <Siren size={22}/>, value: arabic(stats.emergency), label: "يستقبلون الطوارئ", tone: "#d9488a" },
    { icon: <Zap size={22}/>, value: arabic(stats.availableNow), label: "متاحون الآن", tone: "#10b981" },
    { icon: <Sparkles size={22}/>, value: arabic(stats.newThisMonth), label: "انضموا هذا الشهر", tone: "#e8792f" },
    { icon: <BadgePercent size={22}/>, value: arabic(stats.offers), label: "عروض نشطة الآن", tone: "#c58a00" },
    { icon: <Users size={22}/>, value: arabic(stats.members), label: "عضوًا مسجلًا", tone: "#2f8be8" },
  ];
  const max = Math.max(1, ...stats.topRoots.map((item) => item.count));

  return <div className="events-page stats-page">
    <DesignApplicator design={theme}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={theme.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>
    <main className="container events-main">
      <section className="events-hero stats-hero">
        <span className="adv-eyebrow"><BarChart3 size={14}/> إحصائيات حية</span>
        <h1>تقرير الدليل</h1>
        <p>كل ما يحدث في دليل القرية بالأرقام: المهنيون، الأقسام، التقييمات، وأكثر المهن طلبًا — يتحدّث تلقائيًا.</p>
        <div className="stats-share">
          <button type="button" className="button button-primary" onClick={() => void shareImage(false)} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin"/> : <Share2 size={16}/>} مشاركة كصورة</button>
          <button type="button" className="button button-soft" onClick={() => void shareImage(true)} disabled={busy}><ImageDown size={16}/> تنزيل الصورة</button>
          <a className="button button-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><Share2 size={16}/> واتساب</a>
        </div>
        <small className="stats-updated">آخر تحديث: {new Date(stats.generatedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" })}</small>
      </section>

      <section className="stats-grid" aria-label="الأرقام الرئيسية">
        {headline.map((item) => (
          <article key={item.label} className="stats-tile" style={{ "--tone": item.tone } as CSSProperties}>
            <span className="stats-tile-icon">{item.icon}</span>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <div className="stats-columns">
        <section className="stats-card" aria-labelledby="stats-roots">
          <h2 id="stats-roots"><Grid2X2 size={20}/> توزيع المهنيين على الأقسام</h2>
          <ul className="stats-bars">
            {stats.topRoots.map((item) => (
              <li key={item.id} style={{ "--tone": item.color } as CSSProperties}>
                <Link href={`/categories/${item.id}`} className="stats-bar-label">{item.name}</Link>
                <span className="stats-bar"><i style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}/></span>
                <b>{arabic(item.count)} <small>({item.share}%)</small></b>
              </li>
            ))}
          </ul>
        </section>

        <section className="stats-card" aria-labelledby="stats-top">
          <h2 id="stats-top"><Award size={20}/> أكثر المهن طلبًا</h2>
          {stats.topSpecialties.length ? (
            <ol className="stats-ranked">
              {stats.topSpecialties.map((item, index) => (
                <li key={item.id}>
                  <span className="stats-rank" style={{ "--tone": item.color } as CSSProperties}>{arabic(index + 1)}</span>
                  <div><strong>{item.name}</strong><small>{item.parentName}</small></div>
                  <b>{arabic(item.count)}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">لا توجد بيانات كافية بعد.</p>}
        </section>

        <section className="stats-card" aria-labelledby="stats-rated">
          <h2 id="stats-rated"><Medal size={20}/> الأعلى تقييمًا</h2>
          {stats.topRated.length ? (
            <ol className="stats-ranked">
              {stats.topRated.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <span className="stats-rank is-gold">{arabic(index + 1)}</span>
                  <div><strong>{item.name}</strong><small>{item.category}</small></div>
                  <b><Star size={13}/> {item.rating} <small>({arabic(item.reviews)})</small></b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">سيظهر هنا أعلى المهنيين تقييمًا بعد تقييمين على الأقل لكل منهم.</p>}
        </section>

        <section className="stats-card" aria-labelledby="stats-new">
          <h2 id="stats-new"><Sparkles size={20}/> أحدث المنضمين</h2>
          <ul className="stats-newest">
            {stats.newest.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <div><strong>{item.name}</strong><small>{item.category}</small></div>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short", timeZone: "Africa/Cairo" })}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="stats-cta">
        <p>مهنتك ليست هنا بعد؟ انضم إلى {arabic(stats.providers)} مهني وخدمة في دليل القرية مجانًا.</p>
        <Link href="/register" className="button button-primary">أضف مهنتك الآن</Link>
      </section>
    </main>
  </div>;
}

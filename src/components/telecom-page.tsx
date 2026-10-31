"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CloudOff, Landmark, MessageCircle, PhoneCall, QrCode, Siren, Smartphone } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import { Logo } from "@/components/ui";
import QrSvg from "@/components/qr-svg";
import { TelecomLogo } from "@/components/telecom-logos";
import TelecomScreenView from "@/components/telecom-screen";
import { defaultDesignSettings, type PublicDirectory } from "@/lib/catalog";
import { telecomPageUrl } from "@/lib/telecom";
import { telecomScreens, telecomScreenById, type TelecomScreen } from "@/lib/telecom-screens";
import { defaultTelecomSettings, type TelecomSettings } from "@/lib/telecom-settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";

type Props = { data: PublicDirectory; codes?: TelecomSettings };

/**
 * صفحة «أرقام وأكواد المحمول والأرضي والبنوك»: كروت مربّعة لكل شركة/قسم،
 * وكل شاشة فيها عنوان على سطرين بلون الشركة وأزرار أقسام مربّعة ملوّنة.
 * ومن الإضافات الجديدة: كارت «أرقام حكومية» بيجمع الطوارئ والمرافق والشكاوى والمستندات.
 */
export default function TelecomPage({ data, codes }: Props) {
  const settingsCodes = codes ?? defaultTelecomSettings;
  const design = { ...defaultDesignSettings, ...(data.designSettings ?? {}) };
  const settings = data.settings;
  const [activeId, setActiveId] = useState(telecomScreens[0].id);
  const [offlineReady, setOfflineReady] = useState(false);

  // الرابط المباشر #landline يفتح القسم فورًا، وإلا نفتح آخر قسم استخدمه الزائر.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    const fromStore = (() => { try { return localStorage.getItem("janzour-telecom-last") ?? ""; } catch { return ""; } })();
    const candidate = telecomScreenById(fromHash) ?? telecomScreenById(fromStore);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- الرابط/التفضيل المحفوظ لا يُقرأ على الخادم.
    if (candidate) setActiveId(candidate.id);
    const onHash = () => {
      const next = telecomScreenById(window.location.hash.replace("#", ""));
      if (next) setActiveId(next.id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let disposed = false;
    if (typeof navigator === "undefined") return;
    if (navigator.serviceWorker) {
      void navigator.serviceWorker.ready.then(() => {
        if (disposed) return;
        caches.keys().then((keys) => {
          void Promise.all(keys.filter((key) => key.startsWith("daleel-janzour-shell")).map((key) => caches.open(key).then((cache) => cache.match("/telecom").then((hit) => Boolean(hit) && setOfflineReady(true)))));
        }).catch(() => undefined);
      }).catch(() => undefined);
    }
    return () => { disposed = true; };
  }, []);

  const active = useMemo(() => telecomScreenById(activeId) ?? telecomScreens[0], [activeId]);
  const pageLink = `${SITE_URL}${telecomPageUrl(active.id)}`;

  function choose(screen: TelecomScreen) {
    setActiveId(screen.id);
    try { localStorage.setItem("janzour-telecom-last", screen.id); } catch { /* ignore */ }
    if (typeof window !== "undefined") history.replaceState(null, "", teleconPath(screen.id));
    if (typeof document !== "undefined") document.getElementById("telecom-codes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <div className="telecom-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>

    <main className="container telecom-page-main">
      <section className="telecom-hero">
        <span className="adv-eyebrow"><Smartphone size={15}/> {settingsCodes.eyebrow}</span>
        <h1>{settingsCodes.title}</h1>
        <p>{settingsCodes.subtitle}</p>
        {settingsCodes.showHeroChips && (
          <div className="telecom-hero-chips">
            <span><CheckCircle2 size={14}/> تعمل بدون إنترنت</span>
            <span><PhoneCall size={14}/> طلب الكود بضغطة</span>
            <span><MessageCircle size={14}/> مشاركة على واتساب</span>
            {offlineReady && <span className="is-ok"><CloudOff size={14}/> محفوظة على جهازك</span>}
          </div>
        )}
        {settingsCodes.showQr && (
          <div className="telecom-hero-qr">
            <QrSvg value={`${SITE_URL}${telecomPageUrl()}`} size={104} label="رمز QR لصفحة الأكواد"/>
            <span>امسح الكود لفتح الصفحة على أي موبايل</span>
          </div>
        )}
      </section>

      <section className="telecom-home" aria-label="اختار الشركة أو القسم">
        <div className="telecom-home-head">
          <h2>{settingsCodes.homeHeading}</h2>
          <p>{settingsCodes.homeNote}</p>
        </div>
        <div className="telecom-home-grid" role="tablist" aria-label="الشركات والأقسام">
          {telecomScreens.map((screen) => {
            const isActive = screen.id === active.id;
            const count = screen.groups.reduce((sum, group) => sum + group.rows.length, 0);
            return (
              <button
                key={screen.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`telecom-home-card is-${screen.icon} ${isActive ? "is-active" : ""}`}
                style={{ "--screen-color": screen.color, "--screen-deep": screen.colorDeep } as CSSProperties}
                onClick={() => choose(screen)}
              >
                <span className="telecom-home-logo">
                  {screen.operator
                    ? <TelecomLogo id={screen.operator.id} size={46}/>
                    : <span className="telecom-home-glyph">{screen.icon === "bank" ? <Landmark size={26}/> : screen.icon === "gov" ? <Siren size={26}/> : <PhoneCall size={26}/>}</span>}
                </span>
                <strong>{screen.name}</strong>
                <small>{count} رقمًا</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="telecom-panel" id="telecom-codes" style={{ "--screen-color": active.color, "--screen-deep": active.colorDeep } as CSSProperties}>
        <TelecomScreenView key={active.id} screen={active} link={pageLink} siteName={settings.siteName} codes={settingsCodes}/>
      </section>

      <div className="telecom-extras">
        <Link href="/telecom/poster" className="telecom-extra-card">
          <span className="telecom-extra-icon"><QrCode size={18}/></span>
          <span>
            <strong>ملصق جاهز للطباعة (A4)</strong>
            <small>أهم الأكواد + QR للصفحة — علّقه في المحل أو المكتب</small>
          </span>
          <ArrowLeft size={15}/>
        </Link>
      </div>

      <p className="telecom-page-note">
        الأكواد والأرقام مأخوذة من أدلة الشركات وقد تُحدّثها من وقت لآخر — وكل كود فيه زر «الكود ده اتغيّر؟» يوصّل بلاغك للإدارة من غير ما تكتب اسمك.
        أما أرقام الطوارئ والمرافق والشكاوى الحكومية ففي كارت «أرقام حكومية» فوق — ومطبوعة كمان في ملصق A4.
      </p>

      <p className="telecom-page-credit">من {settings.siteName} — مكتب الجمال للدعاية والإعلان · {settings.phone}</p>
    </main>
  </div>;
}

function teleconPath(id: string) {
  return id ? `${telecomPageUrl()}#${id}` : telecomPageUrl();
}

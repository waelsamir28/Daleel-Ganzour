"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CloudOff, MessageCircle, PhoneCall, QrCode, Smartphone, Siren } from "lucide-react";
import DesignApplicator from "@/components/design-applicator";
import { Logo } from "@/components/ui";
import QrSvg from "@/components/qr-svg";
import { TelecomLogo } from "@/components/telecom-logos";
import PaymentNumbers from "@/components/payment-numbers";
import TelecomCodes from "@/components/telecom-codes";
import { defaultDesignSettings, type PublicDirectory, type PublicUtilityContact } from "@/lib/catalog";
import { telecomOperators, telecomPageUrl, type TelecomOperator } from "@/lib/telecom";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";

type Props = { data: PublicDirectory; utilities: PublicUtilityContact[] };

/** صفحة «أرقام وأكواد شركات المحمول» الكاملة: تعمل بدون إنترنت بعد أول زيارة (Service Worker). */
export default function TelecomPage({ data, utilities }: Props) {
  const design = { ...defaultDesignSettings, ...(data.designSettings ?? {}) };
  const settings = data.settings;
  const [activeId, setActiveId] = useState<TelecomOperator["id"]>(telecomOperators[0].id);
  const [offlineReady, setOfflineReady] = useState(false);

  // الرابط المباشر #vodafone يفتح الشركة فورًا، وإلا نفتح آخر شركة استخدمها الزائر.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    const fromStore = (() => { try { return localStorage.getItem("janzour-telecom-last") ?? ""; } catch { return ""; } })();
    const candidate = telecomOperators.find((operator) => operator.id === (fromHash || fromStore));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- الرابط/التفضيل المحفوظ لا يُقرأ على الخادم.
    if (candidate) setActiveId(candidate.id);
    const onHash = () => {
      const next = telecomOperators.find((operator) => operator.id === window.location.hash.replace("#", ""));
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

  const active = useMemo(() => telecomOperators.find((operator) => operator.id === activeId) ?? telecomOperators[0], [activeId]);
  const pageLink = `${SITE_URL}/telecom#${active.id}`;

  function choose(operator: TelecomOperator) {
    setActiveId(operator.id);
    try { localStorage.setItem("janzour-telecom-last", operator.id); } catch { /* ignore */ }
    if (typeof window !== "undefined") history.replaceState(null, "", teleconPath(operator.id));
  }

  return <div className="telecom-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>

    <main className="container telecom-page-main">
      <section className="telecom-hero">
        <span className="adv-eyebrow"><Smartphone size={14}/> أرقام وأكواد المحمول</span>
        <h1>كل أكواد فودافون وأورنج واتصالات ووي في مكان واحد</h1>
        <p>رصيد، شحن، باقات إنترنت، سلفني، كلمني، وتحويل رصيد — بضغطة واحدة أو نسخة واحدة. الصفحة تتخزن على موبايلك بعد أول زيارة وتشتغل بدون إنترنت.</p>
        <div className="telecom-hero-chips">
          <span><CheckCircle2 size={14}/> تعمل بدون إنترنت</span>
          <span><PhoneCall size={14}/> طلب الكود بضغطة</span>
          <span><MessageCircle size={14}/> مشاركة على واتساب</span>
          {offlineReady && <span className="is-ok"><CloudOff size={14}/> محفوظة على جهازك</span>}
        </div>
        <div className="telecom-hero-qr">
          <QrSvg value={`${SITE_URL}${telecomPageUrl()}`} size={92} label="رمز QR لصفحة الأكواد"/>
          <span>امسح الكود لفتح الصفحة على أي موبايل</span>
        </div>
      </section>

      <div className="telecom-operator-tabs" role="tablist" aria-label="اختر الشبكة">
        {telecomOperators.map((operator) => (
          <button
            key={operator.id}
            type="button"
            role="tab"
            aria-selected={operator.id === active.id}
            className={`telecom-operator-tab ${operator.id === active.id ? "is-active" : ""}`}
            style={{ "--category-color": operator.color, "--brand-deep": operator.colorDeep } as CSSProperties}
            onClick={() => choose(operator)}
          >
            <TelecomLogo id={operator.id} size={44}/>
            <span>{operator.name}</span>
          </button>
        ))}
      </div>

      <section className="telecom-panel" style={{ "--category-color": active.color, "--brand-deep": active.colorDeep } as CSSProperties}>
        <header className="telecom-panel-head">
          <div>
            <h2>أرقام وأكواد {active.name}</h2>
            <p>{active.summary}</p>
          </div>
        </header>
        <TelecomCodes key={active.id} operator={active} link={pageLink} siteName={settings.siteName}/>
      </section>

      <section className="telecom-utilities">
        <h2><Siren size={18}/> أرقام حكومية ومرافق عامة</h2>
        <p>أرقام الطوارئ والمرافق الأساسية في مصر — تُطلب مباشرة من أي هاتف حتى لو الخط مفيهوش رصيد.</p>
        <div className="telecom-utils-grid">
          {utilities.map((item) => (
            <a key={item.id} className={`telecom-util-card is-${item.tone}`} href={`tel:${item.number.replace(/[^\d+]/g, "")}`}>
              <span className="telecom-util-icon"><PhoneCall size={15}/></span>
              <span className="telecom-util-copy">
                <strong>{item.name}</strong>
                <small>{item.detail || item.category}</small>
              </span>
              <b dir="ltr">{item.number}</b>
            </a>
          ))}
        </div>
      </section>

      <PaymentNumbers/>

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
        الأكواد والأرقام مأخوذة من أدلة الشركات وقد تُحدّثها من وقت لآخر. لو كود ما اشتغلش، اتصل بخدمة العملاء: فودافون 888 · أورنج 110 · اتصالات 333 · وي 111.
      </p>

      <p className="telecom-page-credit">من {settings.siteName} — مكتب الجمال للدعاية والإعلان · {settings.phone}</p>
    </main>
  </div>;
}

function teleconPath(id: string) {
  return id ? `${telecomPageUrl()}#${id}` : telecomPageUrl();
}

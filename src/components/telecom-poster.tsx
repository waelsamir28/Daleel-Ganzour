"use client";

import { Printer, ArrowRight, QrCode } from "lucide-react";
import Link from "next/link";
import QrSvg from "@/components/qr-svg";
import { TelecomLogo } from "@/components/telecom-logos";
import { telecomOperators, telecomPageUrl } from "@/lib/telecom";
import { paymentDialHref, paymentServices } from "@/lib/payments";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";
const QUICK_LABELS = ["خدمة العملاء", "الرصيد", "الشحن"];

/**
 * ملصق الأكواد للطباعة (A4): أهم أكواد الشبكات الأربع + أرقام الطوارئ + QR لصفحة الأكواد
 * و QR لواتساب المكتب. التصميم أبيض/أسود-ألوان قوية ليطبع بوضوح على أي طابعة.
 */
export default function TelecomPoster({ siteName, officePhone }: { siteName: string; officePhone: string }) {
  const pageUrl = `${SITE_URL}${telecomPageUrl()}`;
  const utilities = [
    { name: "الإسعاف", number: "123" },
    { name: "الشرطة", number: "122" },
    { name: "المطافئ", number: "180" },
    { name: "الكهرباء", number: "121" },
    { name: "المياه", number: "125" },
    { name: "الغاز", number: "129" },
    { name: "انستاباي", number: "15989" },
    { name: "فودافون كاش", number: "7000" },
  ];
  const bankNumbers = paymentServices.filter((service) => ["nbe", "banquemisr", "cib", "banquecairo"].includes(service.id));

  return (
    <div className="poster-page">
      <div className="poster-toolbar">
        <Link href="/telecom" className="button button-soft button-small"><ArrowRight size={15}/> رجوع لصفحة الأكواد</Link>
        <button type="button" className="button button-primary button-small" onClick={() => window.print()}><Printer size={15}/> طباعة الملصق</button>
        <span>اطبع على A4 — أو استخدم «حفظ كـ PDF» من نافذة الطباعة وابعتها للمطبع.</span>
      </div>

      <article className="poster">
        <header className="poster-head">
          <div>
            <span className="poster-eyebrow"><QrCode size={13}/> كل أكواد المحمول في ورقة واحدة</span>
            <h1>أرقام وأكواد شركات المحمول</h1>
            <p>علّق الورقة في المحل أو المكتب — أي حد يعرف رصيده أو يشحن أو يحوّل رصيد من غير ما يسأل.</p>
          </div>
          <div className="poster-qr">
            <QrSvg value={pageUrl} size={104} label="رمز QR لصفحة أكواد المحمول"/>
            <small>امسح الكود<br/>تفتح كل الأكواد<br/>وتشتغل بدون إنترنت</small>
          </div>
        </header>

        <div className="poster-grid">
          {telecomOperators.map((operator) => (
            <section key={operator.id} className="poster-card" style={{ "--category-color": operator.color, "--brand-deep": operator.colorDeep } as React.CSSProperties}>
              <header>
                <TelecomLogo id={operator.id} size={38}/>
                <strong>{operator.name}</strong>
                <small>{operator.latin}</small>
              </header>
              <ul>
                {operator.quick.slice(0, 3).map((item, index) => (
                  <li key={item.label}>
                    <span>{QUICK_LABELS[index] ?? item.label}</span>
                    <b dir="ltr">{item.row.code}</b>
                  </li>
                ))}
                {operator.groups[0]?.rows.slice(1, 2).map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <b dir="ltr">{row.code}</b>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="poster-strip">
          <h2>أرقام الطوارئ والمرافق</h2>
          <div className="poster-strip-grid">
            {utilities.map((item) => (
              <a key={item.name} href={paymentDialHref(item.number)}><span>{item.name}</span><b dir="ltr">{item.number}</b></a>
            ))}
          </div>
        </section>

        <section className="poster-strip">
          <h2>أهم أرقام البنوك</h2>
          <div className="poster-strip-grid">
            {bankNumbers.map((item) => (
              <a key={item.id} href={paymentDialHref(item.number)}><span>{item.name}</span><b dir="ltr">{item.number}</b></a>
            ))}
          </div>
        </section>

        <footer className="poster-foot">
          <div>
            <strong>{siteName}</strong>
            <span>مكتب الجمال للدعاية والإعلان — {officePhone}</span>
          </div>
          <span className="poster-foot-note">الأكواد قابلة للتغيير من الشركات — أحدث نسخة دائمًا على صفحة الأكواد</span>
        </footer>
      </article>
    </div>
  );
}

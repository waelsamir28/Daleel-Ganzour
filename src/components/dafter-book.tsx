"use client";

import { Printer } from "lucide-react";
import QrSvg from "@/components/qr-svg";

type Provider = { id: string; name: string; phone: string; area: string };
type Specialty = { id: string; name: string; providers: Provider[] };
type Section = { id: string; name: string; color: string; specialties: Specialty[] };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app").replace(/\/+$/, "");

/** يحوّل الرقم لعرض مقروء (٠١٠… → 0101…) مع تثبيت الاتجاه. */
function digits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

/**
 * دفتر الأرقام: غلاف + فصل لكل قسم، وكل تخصص بجدول اسم/رقم/منطقة.
 * مبني للطباعة على A4 (أو حفظ PDF) — أبيض وأسود مع لون القسم في العنوان فقط.
 */
export default function DafterBook({
  siteName,
  officePhone,
  sections,
  directProviders,
  utilityNumbers,
}: {
  siteName: string;
  officePhone: string;
  sections: Section[];
  directProviders: Array<{ id: string; name: string; phone: string; area: string; section: string }>;
  utilityNumbers: Array<{ label: string; phone: string }>;
}) {
  const total = sections.reduce((sum, section) => sum + section.specialties.reduce((count, specialty) => count + specialty.providers.length, 0), 0) + directProviders.length;
  const today = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="dafter-book">
      <div className="dafter-actions">
        <button type="button" className="button button-primary" onClick={() => window.print()}><Printer size={16}/> طباعة / حفظ PDF</button>
        <span>{total} رقم في {sections.length} قسم</span>
      </div>

      <article className="dafter-sheet dafter-cover">
        <span className="dafter-eyebrow">دليل المهن والخدمات</span>
        <h1>دفتر أرقام جنزور</h1>
        <p>كل أهل الصنعة والخدمات في القرية — أسماء وأرقام في دفتر واحد تحطه على موبايلك أو تعلّقه في البيت والمحل.</p>
        <div className="dafter-cover-stats">
          <span><b>{total}</b> رقم</span>
          <span><b>{sections.length}</b> قسم</span>
          <span><b>{today}</b></span>
        </div>
        <div className="dafter-cover-qr">
          <QrSvg value={SITE_URL} size={104} label="رمز QR يفتح الدليل"/>
          <div>
            <strong>امسح الكود</strong>
            <span>يفتح الدليل على موبايلك بأحدث الأرقام</span>
            <small dir="ltr">{SITE_URL.replace(/^https?:\/\//, "")}</small>
          </div>
        </div>
        <p className="dafter-cover-foot">لإضافة مهنتك أو تعديل رقمك: <span dir="ltr">{officePhone}</span> — {siteName}</p>
      </article>

      {utilityNumbers.length > 0 && (
        <article className="dafter-sheet">
          <h2 className="dafter-title">أرقام مهمة</h2>
          <ul className="dafter-utility">
            {utilityNumbers.map((item) => (
              <li key={`${item.label}-${item.phone}`}><span>{item.label}</span><b dir="ltr">{digits(item.phone)}</b></li>
            ))}
          </ul>
        </article>
      )}

      {sections.map((section) => (
        <article className="dafter-sheet" key={section.id}>
          <h2 className="dafter-title" style={{ "--section": section.color } as React.CSSProperties}>{section.name}</h2>
          {section.specialties.map((specialty) => (
            <section className="dafter-group" key={specialty.id}>
              <h3>{specialty.name}</h3>
              <ul>
                {specialty.providers.map((provider) => (
                  <li key={provider.id}>
                    <span className="dafter-name">{provider.name}{provider.area ? <small>{provider.area}</small> : null}</span>
                    <b dir="ltr">{digits(provider.phone)}</b>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </article>
      ))}

      {directProviders.length > 0 && (
        <article className="dafter-sheet">
          <h2 className="dafter-title">خدمات متنوعة</h2>
          <ul className="dafter-flat">
            {directProviders.map((provider) => (
              <li key={provider.id}>
                <span className="dafter-name">{provider.name}{provider.section ? <small>{provider.section}</small> : null}</span>
                <b dir="ltr">{digits(provider.phone)}</b>
              </li>
            ))}
          </ul>
        </article>
      )}

      <p className="dafter-sign">أُعدّ الدفتر من {siteName} — الأرقام محدّثة على الموقع، وامسح الكود على الغلاف للنسخة الأحدث.</p>
    </div>
  );
}

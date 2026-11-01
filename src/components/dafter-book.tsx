"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, Check, Download, Layers, LoaderCircle, Printer } from "lucide-react";
import QrSvg from "@/components/qr-svg";
import BarcodeSvg from "@/components/barcode-svg";
import { barcodeValue } from "@/lib/barcode";

type Provider = { id: string; name: string; phone: string; area: string };
type Specialty = { id: string; name: string; providers: Provider[] };
type Section = { id: string; name: string; color: string; specialties: Specialty[] };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app").replace(/\/+$/, "");
const CREDIT = "تصميم وتنفيذ وائل الجمال";
const ALL = "__all__";

/** يحوّل الرقم لعرض مقروء (٠١٠… → 0101…) مع تثبيت الاتجاه. */
function digits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

/** باركود كل قسم: كود ثابت مبني على اسم القسم يفتح صفحة القسم في الدليل. */
function sectionBarcode(section: Section) {
  const code = barcodeValue(section.id.replace(/[^a-zA-Z0-9]/g, "-"), 18);
  return { code, url: `${SITE_URL}/categories/${section.id}` };
}

/**
 * دفتر الأرقام — نسخة للطباعة أو الحفظ PDF:
 * - تختار قسم واحد تطبعه لوحده أو تطبع الدفتر كله.
 * - كل قسم في صفحة مستقلة: عنوانه في المنتصف + باركود خاص بيه + جدول مسطّر بخطوط رفيعة.
 * - كل رقم في صفين: الاسم فوق والنمرة تحته، والصفوف عمودين عشان الدفتر يبقى مضغوط ومقروء.
 * - أسفل الجدول: اسم التطبيق + «تصميم وتنفيذ وائل الجمال» + اللوجو كعلامة مائية خفيفة.
 */
export default function DafterBook({
  siteName,
  officePhone,
  logoUrl,
  designCredit,
  sections,
  directProviders,
  utilityNumbers,
}: {
  siteName: string;
  officePhone: string;
  logoUrl?: string;
  designCredit?: string;
  sections: Section[];
  directProviders: Array<{ id: string; name: string; phone: string; area: string; section: string }>;
  utilityNumbers: Array<{ label: string; phone: string }>;
}) {
  const [selected, setSelected] = useState<string>(ALL);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfStep, setPdfStep] = useState("");
  const [pdfError, setPdfError] = useState("");
  const bookRef = useRef<HTMLDivElement>(null);
  const credit = designCredit?.trim() || CREDIT;
  const total = sections.reduce((sum, section) => sum + section.specialties.reduce((count, specialty) => count + specialty.providers.length, 0), 0) + directProviders.length;
  const today = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(new Date());
  const shown = useMemo(() => (selected === ALL ? sections : sections.filter((section) => section.id === selected)), [selected, sections]);
  const activeSection = sections.find((section) => section.id === selected) ?? null;
  const span = activeSection ? activeSection.specialties.reduce((sum, specialty) => sum + specialty.providers.length, 0) : total;

  /** اسم ملف لطيف على أي نظام (حروف إنجليزية وأرقام بس). */
  const fileSlug = (activeSection ? activeSection.id : "ganzour-book") + "-" + new Date().toISOString().slice(0, 10);

  /**
   * تحميل الدفتر PDF بضغطة واحدة (بدون نافذة طباعة):
   * بنصوّر كل صفحة كصورة عالية الدقة في المتصفح، ونجمّعها في ملف PDF مقاس A4،
   * ولو حاولنا والصفحة أطول من الورقة بنقسّمها لصفحتين.
   * لو حصل أي خطأ (متصفح قديم مثلًا) بنرجع لنافذة الطباعة تلقائيًا.
   */
  const downloadPdf = useCallback(async () => {
    if (pdfBusy) return;
    setPdfError(""); setPdfBusy(true); setPdfStep("بنجهّز الصفحات…");
    try {
      const root = bookRef.current;
      if (!root) throw new Error("no-root");
      const sheets = Array.from(root.querySelectorAll<HTMLElement>(".dafter-sheet"));
      if (!sheets.length) throw new Error("no-sheets");
      if (document.fonts?.ready) await document.fonts.ready;
      const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pageW = 210, pageH = 297, margin = 7;
      const contentW = pageW - margin * 2;
      let firstPage = true;
      for (const [index, sheet] of sheets.entries()) {
        setPdfStep(`بنجهّز الصفحة ${index + 1} من ${sheets.length}…`);
        const canvas = await toCanvas(sheet, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true, width: sheet.offsetWidth, height: sheet.scrollHeight });
        // لوحة اللوجو المائية صورة محلية — بنرسمها من جديد لو المتصفح ما لقطهاش.
        const pxPerMm = canvas.width / contentW;
        const sliceH = Math.floor((pageH - margin * 2) * pxPerMm);
        for (let offset = 0; offset < canvas.height; offset += sliceH) {
          const height = Math.min(sliceH, canvas.height - offset);
          const slice = document.createElement("canvas");
          slice.width = canvas.width; slice.height = height;
          const context = slice.getContext("2d");
          if (!context) throw new Error("no-canvas");
          context.fillStyle = "#ffffff"; context.fillRect(0, 0, slice.width, slice.height);
          context.drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height);
          if (!firstPage) pdf.addPage();
          firstPage = false;
          pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", margin, margin, contentW, height / pxPerMm, undefined, "FAST");
        }
      }
      pdf.save(`${fileSlug}.pdf`);
      setPdfStep("تم تحميل الدفتر ✅");
      window.setTimeout(() => setPdfStep(""), 2600);
    } catch {
      setPdfError("تعذّر تجهيز الملف على المتصفح ده — فتحنا نافذة الطباعة، اختار «حفظ كـ PDF».");
      window.print();
    } finally {
      setPdfBusy(false);
    }
  }, [pdfBusy, fileSlug]);

  return (
    <div className={`dafter-book ${activeSection ? "is-single" : ""}`} ref={bookRef}>
      <div className="dafter-actions">
        <button type="button" className="button button-primary" onClick={() => void downloadPdf()} disabled={pdfBusy} aria-busy={pdfBusy}>
          {pdfBusy ? <LoaderCircle size={16} className="spin"/> : <Download size={16}/>}
          {pdfBusy ? "بنجهّز الملف…" : activeSection ? `حمّل «${activeSection.name}» PDF` : "حمّل الدفتر PDF"}
        </button>
        <button type="button" className="button button-soft" onClick={() => window.print()}><Printer size={16}/> طباعة</button>
        <span>{span} رقم {activeSection ? `في قسم ${activeSection.name}` : `في ${sections.length} قسم`}</span>
        {pdfStep && <span className="dafter-pdf-note" role="status">{pdfStep}</span>}
        {pdfError && <span className="dafter-pdf-note is-error" role="alert">{pdfError}</span>}
      </div>

      <div className="dafter-filter" role="group" aria-label="اختيار القسم المطلوب طباعته">
        <span className="dafter-filter-label"><Layers size={14}/> اختار القسم:</span>
        <div className="dafter-filter-chips">
          <button type="button" className={`dafter-chip ${selected === ALL ? "is-on" : ""}`} aria-pressed={selected === ALL} onClick={() => setSelected(ALL)}>
            <BookOpen size={13}/> الدفتر كله
            <b>{sections.length}</b>
          </button>
          {sections.map((section) => {
            const count = section.specialties.reduce((sum, specialty) => sum + specialty.providers.length, 0);
            return (
              <button
                key={section.id}
                type="button"
                className={`dafter-chip ${selected === section.id ? "is-on" : ""}`}
                aria-pressed={selected === section.id}
                style={{ "--section": section.color } as React.CSSProperties}
                onClick={() => setSelected(selected === section.id ? ALL : section.id)}
              >
                {selected === section.id && <Check size={12}/>} {section.name}
                <b>{count}</b>
              </button>
            );
          })}
        </div>
        <p className="dafter-filter-hint">اختار قسم واحد واضغط «اطبع» واطبع منه قد ما تحب — أو اطبع الدفتر كله مرة واحدة.</p>
      </div>

      {!activeSection && (
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
          {utilityNumbers.length > 0 && (
            <ul className="dafter-utility">
              {utilityNumbers.map((item) => (
                <li key={`${item.label}-${item.phone}`}><span>{item.label}</span><b dir="ltr">{digits(item.phone)}</b></li>
              ))}
            </ul>
          )}
          <p className="dafter-cover-foot">لإضافة مهنتك أو تعديل رقمك: <span dir="ltr">{officePhone}</span> — {siteName}</p>
        </article>
      )}

      {shown.map((section) => {
        const { code, url } = sectionBarcode(section);
        const count = section.specialties.reduce((sum, specialty) => sum + specialty.providers.length, 0);
        return (
          <article className="dafter-sheet dafter-section-sheet" key={section.id} style={{ "--section": section.color } as React.CSSProperties}>
            <header className="dafter-sheet-head">
              <span className="dafter-sheet-eyebrow">دفتر أرقام {siteName}</span>
              <h2 className="dafter-title">{section.name}</h2>
              <span className="dafter-sheet-sub">{count} رقم • {section.specialties.length} تخصص • {today}</span>
              <div className="dafter-sheet-code">
                <BarcodeSvg value={code} height={40} moduleWidth={2}/>
                <span className="dafter-sheet-code-hint">امسح الباركود يفتح قسم «{section.name}» في الدليل</span>
              </div>
            </header>

            <div className="dafter-table">
              {section.specialties.map((specialty) => (
                <section className="dafter-group" key={specialty.id}>
                  <h3 className="dafter-group-title">{specialty.name}<span>{specialty.providers.length}</span></h3>
                  <div className="dafter-grid">
                    {specialty.providers.map((provider) => (
                      <div className="dafter-cell" key={provider.id}>
                        <span className="dafter-name">{provider.name}</span>
                        <span className="dafter-line"/>
                        <b className="dafter-phone" dir="ltr">{digits(provider.phone)}</b>
                        {provider.area ? <small className="dafter-area">{provider.area}</small> : null}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <footer className="dafter-sheet-foot">
              <div className="dafter-sheet-foot-copy">
                <strong>{siteName}</strong>
                <span>{credit}</span>
                <small dir="ltr">{SITE_URL.replace(/^https?:\/\//, "")}</small>
              </div>
              <span className="dafter-sheet-foot-qr"><QrSvg value={url} size={62} label={`رمز QR يفتح قسم ${section.name}`}/></span>
            </footer>
            {logoUrl && (
              <span className="dafter-watermark" aria-hidden="true">
                <Image src={logoUrl} alt="" width={190} height={190} unoptimized/>
              </span>
            )}
          </article>
        );
      })}

      {!activeSection && directProviders.length > 0 && (
        <article className="dafter-sheet dafter-section-sheet">
          <header className="dafter-sheet-head">
            <span className="dafter-sheet-eyebrow">دفتر أرقام {siteName}</span>
            <h2 className="dafter-title">خدمات متنوعة</h2>
            <span className="dafter-sheet-sub">{directProviders.length} رقم • {today}</span>
            <div className="dafter-sheet-code">
              <BarcodeSvg value={barcodeValue("GANZOUR-SERVICES")} height={40} moduleWidth={2}/>
              <span className="dafter-sheet-code-hint">امسح الباركود يفتح الدليل على موبايلك</span>
            </div>
          </header>
          <div className="dafter-table">
            <div className="dafter-grid">
              {directProviders.map((provider) => (
                <div className="dafter-cell" key={provider.id}>
                  <span className="dafter-name">{provider.name}</span>
                  <span className="dafter-line"/>
                  <b className="dafter-phone" dir="ltr">{digits(provider.phone)}</b>
                  {provider.section ? <small className="dafter-area">{provider.section}</small> : null}
                </div>
              ))}
            </div>
          </div>
          <footer className="dafter-sheet-foot">
            <div className="dafter-sheet-foot-copy">
              <strong>{siteName}</strong>
              <span>{credit}</span>
              <small dir="ltr">{SITE_URL.replace(/^https?:\/\//, "")}</small>
            </div>
            <span className="dafter-sheet-foot-qr"><QrSvg value={SITE_URL} size={62} label="رمز QR يفتح الدليل"/></span>
          </footer>
          {logoUrl && (
            <span className="dafter-watermark" aria-hidden="true">
              <Image src={logoUrl} alt="" width={190} height={190} unoptimized/>
            </span>
          )}
        </article>
      )}

      <p className="dafter-sign">أُعدّ الدفتر من {siteName} — الأرقام محدّثة على الموقع، وامسح أي باركود للنسخة الأحدث. {credit}.</p>
    </div>
  );
}

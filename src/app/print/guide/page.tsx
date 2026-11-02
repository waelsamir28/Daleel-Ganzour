import type { Metadata } from "next";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { arabicDigits, guideEditionLabel, guideSummaryLine, printableGuideCount, printableGuideSections } from "@/lib/printable-guide";
import PrintGuideControls from "@/components/print-guide-controls";
import "./guide.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `الدليل الورقي | ${settings.siteName}`,
    description: "نسخة شهرية جاهزة للطباعة من دليل جنزور: كل الأقسام وأرقام المهنيين والعناوين على ورق A4.",
    robots: { index: false, follow: false },
  };
}

/**
 * الدليل الورقي الشهري: صفحة A4 جاهزة للطباعة أو الحفظ PDF، فيها كل خدمة منشورة تحت قسمها.
 * تُطبع من زر «طباعة» في اللوحة أو من زر الطباعة أعلى الصفحة نفسها.
 */
export default async function PrintGuidePage() {
  const [data, settings] = await Promise.all([getPublicDirectory(), getSettings()]);
  const sections = printableGuideSections(data.categories, data.services);
  const total = printableGuideCount(sections);
  const edition = guideEditionLabel();
  const today = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" }).format(new Date());

  return (
    <main className="print-guide" dir="rtl">
      <PrintGuideControls total={total} sections={sections.length}/>

      <header className="print-guide-cover">
        <div className="print-guide-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- شعار ثابت للطباعة */}
          <img src={data.designSettings?.headerLogoUrl || "/images/logo-daleel-transparent.png"} alt="" width={64} height={64}/>
          <div>
            <h1>{settings.siteName}</h1>
            <p>{settings.tagline}</p>
          </div>
        </div>
        <div className="print-guide-meta">
          <span>طبعة {edition}</span>
          <span>{guideSummaryLine(total, sections.length)}</span>
          <span>طُبع في {today}</span>
        </div>
        <p className="print-guide-note">اتصل بأي مهني مباشرة على رقمه. الأرقام والعناوين محدَّثة من الدليل الإلكتروني في تاريخ الطبعة.</p>
      </header>

      <div className="print-guide-sections">
        {sections.map((section) => (
          <section key={section.id} className="print-guide-section">
            <h2 style={{ borderColor: section.color }}>
              <span style={{ background: section.color }}>{arabicDigits(section.entries.length)}</span>
              {section.name}
            </h2>
            <table className="print-guide-table">
              <thead>
                <tr><th className="col-name">الاسم / المهنة</th><th className="col-phone">الرقم</th><th className="col-place">العنوان</th></tr>
              </thead>
              <tbody>
                {section.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="col-name">
                      {entry.featured && <span className="print-guide-star" aria-label="مميز">★</span>}
                      {entry.name}
                      {entry.verified && <span className="print-guide-verified" aria-label="تم التحقق">✓</span>}
                    </td>
                    <td className="col-phone" dir="ltr">{entry.phone}</td>
                    <td className="col-place">{entry.place || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <footer className="print-guide-footer">
        <span>دليل المهن والخدمات بقرية جنزور — {settings.siteName}</span>
        <span dir="ltr">{settings.phone}</span>
        <span>https://daleel-ganzour.vercel.app</span>
      </footer>
    </main>
  );
}

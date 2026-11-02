import type { Metadata } from "next";
import { getMonthlyHonors, getSettings } from "@/lib/directory";
import { honorAchievementLine, honorPostText, honorTitle } from "@/lib/monthly-honors";
import { getCategory, serviceDirectUrl, type CategoryRecord } from "@/lib/catalog";
import { getPublicDirectory } from "@/lib/directory";
import QrSvg from "@/components/qr-svg";
import HonorsToolbar from "@/components/honors-toolbar";
import HonorsAdminReset from "@/components/honors-admin-reset";
import { getViewer } from "@/lib/auth";
import "./honors.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `شهادة تكريم الشهر | ${settings.siteName}`,
    description: "شهادات تكريم شهرية لأكثر المهنيين تفاعلًا مع أهل القرية على دليل جنزور — جاهزة للطباعة والنشر.",
  };
}

/**
 * شهادة التكريم الشهرية: أفضل ٣ مهنيين حسب التفاعل الحقيقي (مشاهدات + اتصالات).
 * الصفحة عامة (يقدر أي حد يشاركها) وبكل شهادة QR يفتح صفحة صاحبها.
 */
export default async function HonorsPage() {
  const [data, settings, honors, viewer] = await Promise.all([getPublicDirectory(), getSettings(), getMonthlyHonors(), getViewer()]);
  const categories = data.categories as CategoryRecord[];
  const postText = honorPostText(honors.month, honors.honors, settings.siteName);
  const rangeLabel = honors.monthly ? `تفاعل شهر ${honors.monthLabel}` : `إجمالي التفاعل حتى ${honors.monthLabel}`;

  return (
    <main className="honors-page" dir="rtl">
      <HonorsToolbar postText={postText} count={honors.honors.length}/>

      <header className="honors-intro">
        <h1>🏆 تكريم أهل الخبرة</h1>
        <p>
          شهادات شهرية لأكثر ٣ مهنيين تفاعل معهم أهل القرية على دليل جنزور —
          الترتيب بيتحسب من <strong>مشاهدات صفحة المهنة والاتصالات الفعلية</strong> (كل اتصال = ٣ مشاهدات)،
          مش من إعلانات مدفوعة.
        </p>
        <span className="honors-intro-range">{rangeLabel}</span>
      </header>

      {honors.honors.length === 0 ? (
        <section className="honors-empty">
          <h2>لسه مفيش تكريم الشهر ده</h2>
          <p>الشهادات تظهر تلقائيًا أول ما يكون فيه تفاعل كافي من أهل القرية. شجّع المهنيين يكمّلوا بياناتهم ويشاركوا صفحاتهم.</p>
        </section>
      ) : (
        <div className="honors-list">
          {honors.honors.map((entry) => {
            const category = getCategory(entry.service.category, categories);
            const title = honorTitle(entry.rank);
            return (
              <article key={entry.service.id} className="honor-certificate" style={{ "--honor-tone": title.tone } as React.CSSProperties}>
                <div className="honor-certificate-frame">
                  <header className="honor-head">
                    {/* eslint-disable-next-line @next/next/no-img-element -- شعار ثابت للطباعة */}
                    <img src={data.designSettings?.headerLogoUrl || "/images/logo-daleel-transparent.png"} alt="" width={54} height={54}/>
                    <div className="honor-head-copy">
                      <strong>{settings.siteName}</strong>
                      <span>شهادة تكريم وامتنان</span>
                    </div>
                    <span className="honor-medal" aria-hidden="true">{title.medal}</span>
                  </header>

                  <p className="honor-rank">{title.title} — {honors.monthLabel}</p>
                  <h2 className="honor-name">{entry.service.name}</h2>
                  <p className="honor-category">{category.name}{entry.service.address || entry.service.area ? ` • ${entry.service.address || entry.service.area}` : ""}</p>

                  <p className="honor-body">
                    تُمنح هذه الشهادة تقديرًا لتفاعل أهل القرية مع صفحة صاحب المهنة،
                    وتقديرًا لجهده في خدمة أهل جنزور.
                  </p>

                  <div className="honor-stats">
                    <span><b>{entry.views}</b> مشاهدة</span>
                    <span><b>{entry.contacts}</b> اتصال</span>
                    <span className="honor-total"><b>{entry.score}</b> نقاط تفاعل</span>
                  </div>
                  <p className="honor-achievement">{honorAchievementLine(entry)}</p>

                  <footer className="honor-foot">
                    <div className="honor-sign">
                      <span className="honor-sign-line">{settings.phone || ""}</span>
                      <small>مكتب الجمال للدعاية والإعلان — إدارة الدليل</small>
                    </div>
                    <div className="honor-qr">
                      <QrSvg value={serviceDirectUrl(entry.service.id)} size={82} label="رمز QR لصفحة صاحب المهنة"/>
                      <small>امسح الكود لفتح الصفحة</small>
                    </div>
                    <span className="honor-serial">{entry.certificateNo}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="honors-note">
        الشهادات بتتحدث تلقائيًا مع تغيّر الأرقام. لو عايز ترتيب شهر جديد من أول يوم فيه، اضغط
        <strong> «بدء شهر جديد» </strong> قبل أول الشهر.
      </p>

      {viewer.role === "admin" && <HonorsAdminReset month={honors.month}/>}
    </main>
  );
}

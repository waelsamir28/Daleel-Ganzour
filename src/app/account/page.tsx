import { redirect } from "next/navigation";
import Link from "next/link";
import { type CSSProperties } from "react";
import { eq } from "drizzle-orm";
import { UserRound, CheckCircle2, Heart, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { db } from "@/db";
import { members } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { getDesignSettings, getSettings } from "@/lib/directory";
import { defaultDesignSettings, parseAnnouncementItems } from "@/lib/catalog";
import DesignApplicator from "@/components/design-applicator";
import { Logo } from "@/components/ui";
import { LogoutButton } from "@/components/auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي | دليل جنزور", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const viewer = await getViewer();
  if (viewer.role === "guest") redirect("/login");
  if (viewer.role === "admin" || viewer.role === "moderator") redirect("/admin");
  const [member] = await db.select({ name: members.name, username: members.username, phone: members.phone, createdAt: members.createdAt }).from(members).where(eq(members.id, viewer.id!)).limit(1);
  if (!member) redirect("/login");
  const [settings, designSettings] = await Promise.all([getSettings(), getDesignSettings()]);
  const design = { ...defaultDesignSettings, ...(designSettings ?? {}) };
  const announcementList = parseAnnouncementItems(design);
  return <div className="admin-login-page">
    <DesignApplicator design={design}/>
    <header className="admin-public-header container"><Logo name={settings.siteName} logoUrl={design.headerLogoUrl}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header>
    {design.announcementEnabled && announcementList.length > 0 && (
      <div className="container" style={{ marginTop: "0.75rem" }}>
        <div
          className={`site-announcement-ticker-card is-${design.announcementStyle} is-mode-marquee`}
          style={{ "--ticker-bg": design.announcementBgColor } as CSSProperties}
        >
          <span className="ticker-badge-icon"><Sparkles size={15}/></span>
          <div className={`site-announcement-marquee is-speed-${design.announcementSpeed || "normal"}`} aria-label="شريط الأخبار والتنبيهات">
            <div className="site-announcement-marquee-track">
              {[...announcementList, ...announcementList].map((item, idx) => (
                <span key={`${idx}-${item}`} className="site-announcement-marquee-item">
                  {item}
                  <i aria-hidden="true">•</i>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
    <main className="member-profile-card"><span className="profile-avatar"><UserRound size={43}/></span><span className="profile-member-badge"><CheckCircle2 size={15}/> عضو في الموقع</span><h1>أهلًا {member.name}</h1><p>عضويتك في دليل المهن والخدمات بقرية جنزور جاهزة.</p><div className="form-notice"><ShieldCheck size={23}/><span>أنت عضو في الموقع فقط. التسجيل لم يضف اسمك إلى المهنيين، ولو عندك خدمة تقدر تقدم طلب إضافة مستقل من الدليل.</span></div><dl><div><dt>اسم المستخدم</dt><dd dir="ltr">{member.username}</dd></div><div><dt>رقم الهاتف</dt><dd dir="ltr">{member.phone}</dd></div><div><dt>تاريخ الانضمام</dt><dd>{member.createdAt.toLocaleDateString("ar-EG")}</dd></div></dl><div className="profile-actions"><Link href="/" className="button button-primary">تصفح الدليل <ArrowLeft size={17}/></Link><Link href="/?favorites=1" className="button button-soft"><Heart size={17}/>مفضلتي</Link></div><LogoutButton/></main><footer className="login-footer">{settings.copyright.replace(/©?\s*(?:2026|٢٠٢٦)\s*/g, "").trim()}</footer></div>;
}

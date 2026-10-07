import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { UserRound, CheckCircle2, Heart, ArrowLeft, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { members } from "@/db/schema";
import { getViewer } from "@/lib/auth";
import { getSettings } from "@/lib/directory";
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
  const settings = await getSettings();
  return <div className="admin-login-page"><header className="admin-public-header container"><Logo name={settings.siteName}/><Link href="/">العودة للدليل <ArrowLeft size={17}/></Link></header><main className="member-profile-card"><span className="profile-avatar"><UserRound size={43}/></span><span className="profile-member-badge"><CheckCircle2 size={15}/> عضو في الموقع</span><h1>أهلًا {member.name}</h1><p>عضويتك في دليل المهن والخدمات بقرية جنزور جاهزة.</p><div className="form-notice"><ShieldCheck size={23}/><span>أنت عضو في الموقع فقط. التسجيل لم يضف اسمك إلى المهنيين، ولو عندك خدمة تقدر تقدم طلب إضافة مستقل من الدليل.</span></div><dl><div><dt>اسم المستخدم</dt><dd dir="ltr">{member.username}</dd></div><div><dt>رقم الهاتف</dt><dd dir="ltr">{member.phone}</dd></div><div><dt>تاريخ الانضمام</dt><dd>{member.createdAt.toLocaleDateString("ar-EG")}</dd></div></dl><div className="profile-actions"><Link href="/" className="button button-primary">تصفح الدليل <ArrowLeft size={17}/></Link><Link href="/?favorites=1" className="button button-soft"><Heart size={17}/>مفضلتي</Link></div><LogoutButton/></main><footer className="login-footer">© {new Date().getFullYear()} {settings.copyright}</footer></div>;
}

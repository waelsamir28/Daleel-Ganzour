import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db, databaseConfigured } from "@/db";
import { services, submissionTracking } from "@/db/schema";
import { ensureSeed } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "متابعة طلب إضافة المهنة", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!databaseConfigured || !/^[a-f0-9]{64}$/.test(token)) notFound();
  await ensureSeed();
  const [request] = await db.select({ id: services.id, status: services.status, createdAt: services.createdAt })
    .from(submissionTracking).innerJoin(services, eq(submissionTracking.serviceId, services.id))
    .where(eq(submissionTracking.tokenHash, createHash("sha256").update(token).digest("hex")));
  if (!request) notFound();
  const labels: Record<string, string> = { pending: "قيد مراجعة الإدارة", approved: "تمت الموافقة والنشر", rejected: "لم تتم الموافقة / تم إيقاف النشر" };
  return <main className="container search-assistance"><h1>متابعة طلب إضافة المهنة</h1><p>رقم الطلب: <span dir="ltr">{request.id}</span></p><h2>{labels[request.status] ?? "قيد المتابعة"}</h2><p>احتفظ بالرابط ولا تشاركه إلا مع شخص تثق به. حدّث الصفحة لمتابعة الحالة.</p><Link href="/">العودة للدليل</Link></main>;
}

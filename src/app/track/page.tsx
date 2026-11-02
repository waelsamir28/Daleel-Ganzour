import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/directory";
import { Logo } from "@/components/ui";
import OrderLookup from "@/components/order-lookup";
import "./track.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `طلبي وصل فين؟ | ${settings.siteName}`,
    description: "اعرف حالة طلب إضافة مهنتك على دليل جنزور برقم الموبايل — قيد المراجعة، تم النشر، أو مطلوب استكمال بيانات.",
    robots: { index: false, follow: false },
  };
}

/** صفحة عامة: الزائر يكتب رقمه ويشوف حالة طلبه بدل ما يتصل يسأل. */
export default async function TrackLookupPage() {
  const settings = await getSettings();
  return (
    <div className="track-lookup-page">
      <header className="admin-public-header container"><Logo name={settings.siteName}/><Link href="/">العودة للدليل</Link></header>
      <main className="container track-lookup-main">
        <OrderLookup officePhone={settings.phone}/>
        <p className="track-lookup-help">
          لو عندك رابط متابعة خاص (وصلك بعد إرسال الطلب)، افتحه لمتابعة كل التفاصيل واستكمال البيانات.
        </p>
      </main>
    </div>
  );
}

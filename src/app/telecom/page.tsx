import TelecomPage from "@/components/telecom-page";
import { getPublicDirectory, getSettings, getTelecomSettings } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSettings();
  const title = `أرقام وأكواد المحمول والأرضي والبنوك — فودافون وأورنج واتصالات ووي | ${settings.siteName}`;
  const description = "كل أكواد فودافون وأورنج واتصالات ووي في مكان واحد: الدعم، الرصيد والشحن، الإنترنت، والمحفظة — مع أكواد الخط الأرضي والفايبر وأرقام البنوك وتطبيقات الدفع، وأكواد جاهزة برقمك. الصفحة تعمل بدون إنترنت، وكل كود فيه زر «الكود ده اتغيّر؟».";
  return {
    title,
    description,
    alternates: { canonical: "/telecom" },
    openGraph: { title, description, type: "website" as const, url: "/telecom" },
    keywords: ["أكواد فودافون", "أكواد أورنج", "أكواد اتصالات", "أكواد وي", "كود الرصيد", "تحويل الرصيد", "أكواد الخط الأرضي", "أرقام البنوك", "خدمة عملاء البنوك", "جنزور"],
  };
}

export default async function Page() {
  const [data, codes] = await Promise.all([getPublicDirectory(), getTelecomSettings()]);
  return <TelecomPage data={data} codes={codes}/>;
}

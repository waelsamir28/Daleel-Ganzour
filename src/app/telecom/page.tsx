import TelecomPage from "@/components/telecom-page";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { publicUtilityNumbers } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSettings();
  const title = `أرقام وأكواد شركات المحمول — فودافون وأورنج واتصالات ووي | ${settings.siteName}`;
  const description = "كل أكواد فودافون وأورنج واتصالات ووي في صفحة واحدة: الرصيد، الشحن، الباقات، تحويل الرصيد، سلفني وكلمني، والمحافظ الإلكترونية — مع أكواد الخط الأرضي والفايبر وأرقام الطوارئ والشكاوى الحكومية والشهر العقاري والبريد. تعمل بدون إنترنت زر «الكود ده اتغيّر؟» لتصحيح أي رقم.";
  return {
    title,
    description,
    alternates: { canonical: "/telecom" },
    openGraph: { title, description, type: "website" as const, url: "/telecom" },
    keywords: ["أكواد فودافون", "أكواد أورنج", "أكواد اتصالات", "أكواد وي", "كود الرصيد", "تحويل الرصيد", "أرقام الطوارئ", "أكواد الخط الأرضي", "أرقام حكومية", "حماية المستهلك", "الشهر العقاري", "جنزور"],
  };
}

export default async function Page() {
  const data = await getPublicDirectory();
  const utilities = data.utilityNumbers && data.utilityNumbers.length > 0 ? data.utilityNumbers : publicUtilityNumbers;
  return <TelecomPage data={data} utilities={utilities}/>;
}

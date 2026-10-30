import TelecomPoster from "@/components/telecom-poster";
import { getSettings } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `ملصق أكواد المحمول للطباعة | ${settings.siteName}`, description: "ملصق A4 جاهز للطباعة بأهم أكواد فودافون وأورنج واتصالات ووي وأرقام الطوارئ، مع QR يفتح صفحة الأكواد الكاملة." };
}

export default async function Page() {
  const settings = await getSettings();
  return <TelecomPoster siteName={settings.siteName} officePhone={settings.phone}/>;
}

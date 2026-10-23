import AdvertisePage from "@/components/advertise-page";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { directoryForViewer } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `أعلن معنا | ${settings.siteName}`, description: `احجز إعلانًا متحركًا يظهر في كل صفحات ${settings.siteName} — قوالب جاهزة وأسعار بالجنيه المصري وطلب عبر واتساب.` };
}
export default async function Page() {
  const [data, viewer] = await Promise.all([getPublicDirectory(), getViewer()]);
  return <AdvertisePage data={directoryForViewer(data, viewer)} viewer={viewer}/>;
}

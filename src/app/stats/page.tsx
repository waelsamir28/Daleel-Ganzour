import StatsPage from "@/components/stats-page";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { computeVillageStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const settings = await getSettings();
  return {
    title: `تقرير الدليل | ${settings.siteName}`,
    description: "إحصائيات حية عن دليل قرية جنزور: عدد المهنيين والأقسام والتخصصات والتقييمات وأكثر المهن طلبًا — بتصميم قابل للمشاركة.",
    alternates: { canonical: "/stats" },
  };
}
export default async function Page() {
  const data = await getPublicDirectory();
  const stats = computeVillageStats({ services: data.services, categories: data.categories, areas: data.areas, memberCount: data.memberCount });
  return <StatsPage stats={stats} settings={data.settings} design={data.designSettings}/>;
}

import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { enforceMembership } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const settings = await getSettings(); return { title: settings.siteName, description: settings.heroSubtitle }; }
export default async function HomePage({ searchParams }: { searchParams: Promise<{ favorites?: string }> }) {
  const [data, viewer, query] = await Promise.all([getPublicDirectory(), getViewer(), searchParams]);
  enforceMembership(viewer, data.designSettings, query.favorites === "1" ? "/?favorites=1" : "/");
  return <Directory initialData={data} viewer={viewer} initialFavorites={query.favorites === "1"}/>;
}

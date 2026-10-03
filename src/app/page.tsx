import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const settings = await getSettings(); return { title: settings.siteName, description: settings.heroSubtitle }; }
export default async function HomePage({ searchParams }: { searchParams: Promise<{ favorites?: string }> }) {
  const [data, viewer, query] = await Promise.all([getPublicDirectory(), getViewer(), searchParams]);
  return <Directory initialData={data} viewer={viewer} initialFavorites={query.favorites === "1"}/>;
}

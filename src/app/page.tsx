import DirectoryShell from "@/components/directory-shell";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { directoryForViewer, guestLocked } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const settings = await getSettings(); return { title: settings.siteName, description: settings.heroSubtitle }; }
export default async function HomePage({ searchParams }: { searchParams: Promise<{ favorites?: string }> }) {
  const [data, viewer, query] = await Promise.all([getPublicDirectory(), getViewer(), searchParams]);
  return <DirectoryShell initialData={directoryForViewer(data, viewer)} viewer={viewer} initialFavorites={query.favorites === "1"} guestLocked={guestLocked(viewer, data.designSettings)}/>;
}

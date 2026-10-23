import EventsPage from "@/components/events-page";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { directoryForViewer } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `مناسبات القرية | ${settings.siteName}`, description: `تقويم مناسبات قرية جنزور: أفراح، قوافل طبية، معارض واجتماعات — مع تذكير على تقويم موبايلك من ${settings.siteName}.` };
}
export default async function Page({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const [data, viewer, params] = await Promise.all([getPublicDirectory(), getViewer(), searchParams]);
  return <EventsPage data={directoryForViewer(data, viewer)} viewer={viewer} focusId={typeof params.event === "string" ? params.event : ""}/>;
}

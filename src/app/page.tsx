import DirectoryShell from "@/components/directory-shell";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings } from "@/lib/directory";
import { directoryForViewer, guestLocked } from "@/lib/membership-gate";
import { jsonLdText, siteJsonLd } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const settings = await getSettings(); return { title: settings.siteName, description: settings.heroSubtitle }; }
export default async function HomePage({ searchParams }: { searchParams: Promise<{ favorites?: string }> }) {
  const [data, viewer, query] = await Promise.all([getPublicDirectory(), getViewer(), searchParams]);
  // بيانات منظَّمة للموقع نفسه (يُقرأها جوجل مرة واحدة من الرئيسية): الاسم + النشاط + العنوان + الرقم.
  const structured = siteJsonLd({ settings: data.settings, siteUrl: SITE_URL });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(structured) }}/>
    <DirectoryShell initialData={directoryForViewer(data, viewer)} viewer={viewer} initialFavorites={query.favorites === "1"} guestLocked={guestLocked(viewer, data.designSettings)}/>
  </>;
}

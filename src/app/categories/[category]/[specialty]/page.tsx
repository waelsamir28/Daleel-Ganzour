import { notFound } from "next/navigation";
import DirectoryShell from "@/components/directory-shell";
import { getViewer } from "@/lib/auth";
import { categoryOgImage, sectionAccent } from "@/lib/catalog";
import { getPublicDirectory } from "@/lib/directory";
import { directoryForViewer, guestLocked } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string; specialty: string }> }) {
  const { category, specialty } = await params, data = await getPublicDirectory();
  const item = data.categories.find((entry) => entry.id === specialty);
  const title = `${item?.name ?? "الخدمات"} | ${data.settings.siteName}`;
  const description = item?.description || `مقدمو خدمات ${item?.name ?? ""} في قرية جنزور: الأرقام والعناوين والتواصل المباشر.`;
  const images = item ? categoryOgImage(item.id, item.name, sectionAccent(item.parentId ?? category)) : undefined;
  return { title, description, alternates: { canonical: `/categories/${category}/${specialty}` }, openGraph: { title, description, url: `/categories/${category}/${specialty}`, siteName: data.settings.siteName, locale: "ar_EG", type: "website", ...(images ? { images } : {}) }, twitter: { card: "summary_large_image", title, description, ...(images ? { images: images.map((image) => image.url) } : {}) } };
}
export default async function SpecialtyPage({ params, searchParams }: { params: Promise<{ category: string; specialty: string }>; searchParams: Promise<{ stage?: string }> }) {
  const [data, viewer, { category, specialty }, { stage }] = await Promise.all([getPublicDirectory(), getViewer(), params, searchParams]);
  if (!data.categories.some((item) => item.id === category && !item.parentId) || !data.categories.some((item) => item.id === specialty && item.parentId === category)) notFound();
  return <DirectoryShell key={`${category}/${specialty}`} initialData={directoryForViewer(data, viewer)} viewer={viewer} rootId={category} specialtyId={specialty} stageId={stage} guestLocked={guestLocked(viewer, data.designSettings)}/>;
}

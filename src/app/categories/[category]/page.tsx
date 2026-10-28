import { notFound } from "next/navigation";
import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { categoryOgImage } from "@/lib/catalog";
import { getPublicDirectory } from "@/lib/directory";
import { directoryForViewer, guestLocked } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params, data = await getPublicDirectory();
  const root = data.categories.find((item) => item.id === category && !item.parentId);
  const title = `${root?.name ?? "التصنيفات"} | ${data.settings.siteName}`;
  const description = root?.description || `دليل ${root?.name ?? "الخدمات"} في قرية جنزور: تواصل مباشرة مع مقدمي الخدمة بضغطة واحدة.`;
  const images = root ? categoryOgImage(root.id, root.name) : undefined;
  return { title, description, alternates: { canonical: `/categories/${category}` }, openGraph: { title, description, url: `/categories/${category}`, ...(images ? { images } : {}) }, twitter: { title, description, ...(images ? { images: images.map((image) => image.url) } : {}) } };
}
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ stage?: string }> }) {
  const [data, viewer, { category }, { stage }] = await Promise.all([getPublicDirectory(), getViewer(), params, searchParams]);
  if (!data.categories.some((item) => item.id === category && !item.parentId)) notFound();
  return <Directory key={category} initialData={directoryForViewer(data, viewer)} viewer={viewer} rootId={category} stageId={stage} guestLocked={guestLocked(viewer, data.designSettings)}/>;
}

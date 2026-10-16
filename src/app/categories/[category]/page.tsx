import { notFound } from "next/navigation";
import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory } from "@/lib/directory";
import { enforceMembership } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params, data = await getPublicDirectory();
  const root = data.categories.find((item) => item.id === category && !item.parentId);
  const title = `${root?.name ?? "التصنيفات"} | ${data.settings.siteName}`;
  const description = root?.description || `دليل ${root?.name ?? "الخدمات"} في قرية جنزور: تواصل مباشرة مع مقدمي الخدمة بضغطة واحدة.`;
  return { title, description, alternates: { canonical: `/categories/${category}` }, openGraph: { title, description, url: `/categories/${category}` }, twitter: { title, description } };
}
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const [data, viewer, { category }] = await Promise.all([getPublicDirectory(), getViewer(), params]);
  if (!data.categories.some((item) => item.id === category && !item.parentId)) notFound();
  enforceMembership(viewer, data.designSettings, `/categories/${category}`);
  return <Directory key={category} initialData={data} viewer={viewer} rootId={category}/>;
}

import { notFound } from "next/navigation";
import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params, data = await getPublicDirectory();
  const root = data.categories.find((item) => item.id === category && !item.parentId);
  return { title: `${root?.name ?? "التصنيفات"} | ${data.settings.siteName}` };
}
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const [data, viewer, { category }] = await Promise.all([getPublicDirectory(), getViewer(), params]);
  if (!data.categories.some((item) => item.id === category && !item.parentId)) notFound();
  return <Directory key={category} initialData={data} viewer={viewer} rootId={category}/>;
}

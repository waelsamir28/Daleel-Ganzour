import { notFound } from "next/navigation";
import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string; specialty: string }> }) {
  const { specialty } = await params, data = await getPublicDirectory();
  const item = data.categories.find((category) => category.id === specialty);
  return { title: `${item?.name ?? "الخدمات"} | ${data.settings.siteName}` };
}
export default async function SpecialtyPage({ params }: { params: Promise<{ category: string; specialty: string }> }) {
  const [data, viewer, { category, specialty }] = await Promise.all([getPublicDirectory(), getViewer(), params]);
  if (!data.categories.some((item) => item.id === category && !item.parentId) || !data.categories.some((item) => item.id === specialty && item.parentId === category)) notFound();
  return <Directory key={`${category}/${specialty}`} initialData={data} viewer={viewer} rootId={category} specialtyId={specialty}/>;
}

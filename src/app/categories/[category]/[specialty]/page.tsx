import { notFound } from "next/navigation";
import Directory from "@/components/directory";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string; specialty: string }> }) {
  const { category, specialty } = await params, data = await getPublicDirectory();
  const item = data.categories.find((entry) => entry.id === specialty);
  const title = `${item?.name ?? "الخدمات"} | ${data.settings.siteName}`;
  const description = item?.description || `مقدمو خدمات ${item?.name ?? ""} في قرية جنزور: الأرقام والعناوين والتواصل المباشر.`;
  return { title, description, alternates: { canonical: `/categories/${category}/${specialty}` }, openGraph: { title, description, url: `/categories/${category}/${specialty}` }, twitter: { title, description } };
}
export default async function SpecialtyPage({ params }: { params: Promise<{ category: string; specialty: string }> }) {
  const [data, viewer, { category, specialty }] = await Promise.all([getPublicDirectory(), getViewer(), params]);
  if (!data.categories.some((item) => item.id === category && !item.parentId) || !data.categories.some((item) => item.id === specialty && item.parentId === category)) notFound();
  return <Directory key={`${category}/${specialty}`} initialData={data} viewer={viewer} rootId={category} specialtyId={specialty}/>;
}

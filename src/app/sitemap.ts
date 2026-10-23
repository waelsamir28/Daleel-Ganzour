import type { MetadataRoute } from "next";
import { getPublicDirectory } from "@/lib/directory";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const { categories } = await getPublicDirectory();
    const active = categories.filter((category) => category.active);
    for (const root of active.filter((category) => !category.parentId)) {
      entries.push({ url: `${SITE_URL}/categories/${root.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
      for (const specialty of active.filter((category) => category.parentId === root.id)) {
        entries.push({ url: `${SITE_URL}/categories/${root.id}/${specialty.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      }
    }
  } catch { /* Without a database the static pages are still listed. */ }
  return entries;
}

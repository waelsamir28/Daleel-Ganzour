import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProfileView from "@/components/profile-view";
import { databaseConfigured } from "@/db";
import { ensureSeed, getDesignSettings, getSettings } from "@/lib/directory";
import { getPublicProfile } from "@/lib/member-profile";
import { jsonLdText, profileCanonicalUrl, profileJsonLd, profileSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!databaseConfigured) return null;
  await ensureSeed();
  return getPublicProfile(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, settings] = await Promise.all([load(id), getSettings()]);
  if (!profile) return { title: `الملف الشخصي | ${settings.siteName}`, robots: { index: false, follow: false } };
  const seo = profileSeo(profile, settings);
  const image = `/profile/${encodeURIComponent(id)}/opengraph-image`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/profile/${encodeURIComponent(id)}` },
    openGraph: { type: "profile", title: seo.title, description: seo.description, images: [image] },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [image] },
  };
}

/** الملف الشخصي العام — يُفتح من دائرة الصورة على كارت المهني أو من رمز QR. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, settings, design, headerList] = await Promise.all([load(id), getSettings(), getDesignSettings(), headers()]);
  if (!profile) notFound();
  const host = headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ?? headerList.get("host") ?? "daleel-ganzour.vercel.app";
  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;
  // بيانات منظَّمة لمحركات البحث: نشاط محلي بعنوان ورقم وتقييم حقيقي بدل صفحة مجهولة.
  const structured = profileJsonLd({ profile, settings, siteUrl: origin, imageUrl: `${profileCanonicalUrl(origin, profile.id)}/opengraph-image` });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(structured) }}/>
    <ProfileView profile={profile} settings={settings} design={design} origin={origin}/>
  </>;
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProfileView from "@/components/profile-view";
import { databaseConfigured } from "@/db";
import { ensureSeed, getDesignSettings, getSettings } from "@/lib/directory";
import { getPublicProfile } from "@/lib/member-profile";

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
  const headline = profile.profile.jobTitle || profile.services[0]?.categoryName || "عضو في دليل جنزور";
  return {
    title: `${profile.name} | ${settings.siteName}`,
    description: `${headline} — الملف الشخصي على ${settings.siteName}.`,
    openGraph: { title: profile.name, description: headline, images: profile.photoUrl ? [profile.photoUrl] : undefined },
  };
}

/** الملف الشخصي العام — يُفتح من دائرة الصورة على كارت المهني أو من رمز QR. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, settings, design, headerList] = await Promise.all([load(id), getSettings(), getDesignSettings(), headers()]);
  if (!profile) notFound();
  const host = headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ?? headerList.get("host") ?? "daleel-ganzour.vercel.app";
  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return <ProfileView profile={profile} settings={settings} design={design} origin={`${proto}://${host}`}/>;
}

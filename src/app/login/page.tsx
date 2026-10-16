import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getViewer } from "@/lib/auth";
import { getDesignSettings, getSettings } from "@/lib/directory";
import { postAuthDestination, safeNextPath } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "تسجيل الدخول | دليل جنزور", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [viewer, settings, designSettings, query] = await Promise.all([getViewer(), getSettings(), getDesignSettings(), searchParams]);
  const next = safeNextPath(query.next, "/");
  if (viewer.role !== "guest") redirect(postAuthDestination(viewer.role, next));
  return <AuthForm mode="login" settings={settings} designSettings={designSettings} next={next} membersOnly={designSettings.membershipRequired}/>;
}

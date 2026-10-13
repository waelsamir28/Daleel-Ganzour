import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getViewer } from "@/lib/auth";
import { getDesignSettings, getSettings } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "إنشاء عضوية | دليل جنزور", robots: { index: false, follow: false } };
export default async function RegisterPage() {
  const [viewer, settings, designSettings] = await Promise.all([getViewer(), getSettings(), getDesignSettings()]);
  if (viewer.role !== "guest") redirect(viewer.role === "admin" ? "/admin" : "/account");
  return <AuthForm mode="register" settings={settings} designSettings={designSettings}/>;
}

import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getViewer } from "@/lib/auth";
import { getSettings } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "إنشاء عضوية | دليل جنزور", robots: { index: false, follow: false } };
export default async function RegisterPage() {
  const [viewer, settings] = await Promise.all([getViewer(), getSettings()]);
  if (viewer.role !== "guest") redirect(viewer.role === "admin" ? "/admin" : "/account");
  return <AuthForm mode="register" settings={settings}/>;
}

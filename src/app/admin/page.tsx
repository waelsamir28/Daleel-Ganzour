import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "./admin-panel.css";
import "./admin-mobile.css";
import "./admin-palette.css";
import AdminPanel from "@/components/admin-panel";
import { getViewer } from "@/lib/auth";
import { getAdminDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة الإدارة | دليل جنزور", robots: { index: false, follow: false } };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; editService?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "admin" && viewer.role !== "moderator") redirect(viewer.role === "member" ? "/account" : "/login");
  const [data, query] = await Promise.all([getAdminDirectory(viewer.role), searchParams]);
  return <AdminPanel initialData={data} initialTab={query.tab} initialEditService={query.editService} username={viewer.username} role={viewer.role}/>;
}

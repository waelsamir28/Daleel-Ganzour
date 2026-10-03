import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin-panel";
import { getViewer } from "@/lib/auth";
import { getAdminDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة الإدارة | دليل جنزور", robots: { index: false, follow: false } };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "admin") redirect(viewer.role === "member" ? "/account" : "/login");
  const [data, query] = await Promise.all([getAdminDirectory(), searchParams]);
  return <AdminPanel initialData={data} initialTab={query.tab} username={viewer.username}/>;
}

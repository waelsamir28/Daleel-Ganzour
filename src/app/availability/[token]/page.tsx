import { eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryCategories, services } from "@/db/schema";
import { ensureSeed, serializeCategory } from "@/lib/directory";
import { getCategory } from "@/lib/catalog";
import { Logo } from "@/components/ui";
import AvailabilityRenew from "@/components/availability-renew";

export const dynamic = "force-dynamic";
export const metadata = { title: "تجديد الإتاحة — دليل جنزور", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="availability-page">
    <header className="availability-header"><Logo name="دليل جنزور"/></header>
    <main className="availability-main">{children}</main>
  </div>;
}

async function loadService(token: string) {
  const [service] = await db.select({ id: services.id, name: services.name, category: services.category, availableNow: services.availableNow, availableUntil: services.availableUntil }).from(services).where(eq(services.availabilityToken, token)).limit(1);
  if (!service) return null;
  const categories = (await db.select().from(directoryCategories)).map(serializeCategory);
  return { name: service.name, categoryName: getCategory(service.category, categories).name, until: service.availableUntil?.toISOString() ?? null, active: service.availableNow };
}

export default async function AvailabilityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!databaseConfigured || !/^[a-f0-9]{40}$/i.test(token)) {
    return <Shell><div className="availability-card"><h1>الرابط غير صحيح</h1><p>اطلب لينك تجديد جديد من إدارة الدليل.</p></div></Shell>;
  }
  let service: Awaited<ReturnType<typeof loadService>> = null, failed = false;
  try { service = await loadService(token); } catch { failed = true; }
  if (failed) {
    return <Shell><div className="availability-card"><h1>خدمة غير متاحة حاليًا</h1><p>حاول مرة أخرى بعد قليل، أو تواصل مع إدارة الدليل.</p></div></Shell>;
  }
  if (!service) {
    return <Shell><div className="availability-card"><h1>الرابط غير صحيح</h1><p>اللينك ده غير مرتبط بأي مهنة. اطلب لينك جديد من إدارة الدليل.</p></div></Shell>;
  }
  return <Shell>
    <div className="availability-intro"><h1>تجديد الإتاحة</h1><p>الزر مخصص لـ <strong>{service.name}</strong> — <span>{service.categoryName}</span> فقط.</p></div>
    <AvailabilityRenew token={token} name={service.name} until={service.until} active={service.active}/>
  </Shell>;
}

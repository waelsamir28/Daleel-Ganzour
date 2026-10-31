import { asc, eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryAreas, directoryCategories, services } from "@/db/schema";
import { ensureSeed, serializeCategory, serializeService } from "@/lib/directory";
import { OFFICE_WHATSAPP } from "@/lib/catalog";
import { Logo } from "@/components/ui";
import ProviderAccount from "@/components/provider-account";
import { ProviderStatusWelcome } from "@/components/welcome-center";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي — دليل جنزور", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="availability-page my-account-page">
    <header className="availability-header"><Logo name="دليل جنزور"/></header>
    <main className="availability-main my-account-main">{children}</main>
  </div>;
}

function Invalid({ title, text }: { title: string; text: string }) {
  return <Shell><div className="availability-card"><h1>{title}</h1><p>{text}</p><a className="availability-contact" href={OFFICE_WHATSAPP} target="_blank" rel="noopener noreferrer">تواصل مع إدارة الدليل على واتساب</a></div></Shell>;
}

export default async function MyAccountPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!databaseConfigured || !/^[a-f0-9]{40}$/i.test(token)) return <Invalid title="الرابط غير صحيح" text="اطلب رابط حسابك من إدارة الدليل؛ يصلك على واتساب ويفتح حسابك مباشرة بدون كلمة سر."/>;
  await ensureSeed();
  const [row] = await db.select().from(services).where(eq(services.accountToken, token)).limit(1);
  if (!row) return <Invalid title="الرابط غير صحيح أو تم إلغاؤه" text="ربما جدّدت الإدارة رابط حسابك. اطلب الرابط الجديد على واتساب."/>;
  const [categoryRows, areaRows] = await Promise.all([
    db.select().from(directoryCategories).where(eq(directoryCategories.active, true)).orderBy(asc(directoryCategories.sortOrder)),
    db.select({ name: directoryAreas.name }).from(directoryAreas).orderBy(asc(directoryAreas.sortOrder), asc(directoryAreas.name)),
  ]);
  return <Shell>
    <ProviderStatusWelcome
      serviceId={row.id}
      name={row.name}
      status={row.status}
      statusUpdatedAt={row.statusUpdatedAt?.toISOString?.() ?? new Date().toISOString()}
      reviewNote={row.reviewNote}
      accountHref={`/my/${token}`}
      publicHref={`/?service=${row.id}`}
    />
    <ProviderAccount token={token} initial={serializeService(row)} categories={categoryRows.map((item) => serializeCategory(item))} areas={areaRows.map((item) => item.name)}/>
  </Shell>;
}

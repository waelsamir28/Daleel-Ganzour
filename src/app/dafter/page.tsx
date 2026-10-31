import Link from "next/link";
import { ArrowRight, Printer } from "lucide-react";
import { getPublicDirectory } from "@/lib/directory";
import { getSettings } from "@/lib/directory";
import DafterBook from "@/components/dafter-book";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSettings().catch(() => null);
  const siteName = settings?.siteName ?? "دليل جنزور";
  return {
    title: `دفتر أرقام جنزور للطباعة | ${siteName}`,
    description: "دفتر أرقام أهل جنزور جاهز للطباعة أو الحفظ PDF: كل المهن والخدمات مقسّمة بالأقسام مع أرقام الموبايل، يتحفظ على الموبايل أو يتعلّق في البيت والمحل.",
    alternates: { canonical: "/dafter" },
  };
}

/**
 * «دفتر أرقام جنزور» — نسخة للطباعة/الحفظ PDF:
 * كل المهنيين المنشورين مقسّمين بالأقسام، رقم جانب كل اسم، وQR على الغلاف يفتح الموقع.
 */
export default async function DafterPage() {
  const [data, settings] = await Promise.all([getPublicDirectory(), getSettings().catch(() => null)]);
  return (
    <main className="dafter-page">
      <div className="poster-toolbar dafter-toolbar">
        <Link href="/" className="button button-soft button-small"><ArrowRight size={15}/> رجوع للدليل</Link>
        <span className="dafter-toolbar-hint"><Printer size={14}/> اطبع على A4 (أو «حفظ كـ PDF» من نافذة الطباعة) واحتفظ بالدفتر على موبايلك.</span>
      </div>
      <DafterBook
        siteName={data.settings.siteName || settings?.siteName || "دليل جنزور"}
        officePhone={data.settings.phone}
        sections={data.categories.filter((category) => !category.parentId && category.active).map((root) => ({
          id: root.id,
          name: root.name,
          color: root.color,
          specialties: data.categories
            .filter((category) => category.parentId === root.id && category.active)
            .map((specialty) => ({
              id: specialty.id,
              name: specialty.name,
              providers: data.services
                .filter((service) => service.category === specialty.id)
                .map((service) => ({ id: service.id, name: service.name, phone: service.phone, area: service.area }))
                .sort((a, b) => a.name.localeCompare(b.name, "ar")),
            }))
            .filter((specialty) => specialty.providers.length > 0),
        })).filter((section) => section.specialties.length > 0)}
        directProviders={data.services
          .filter((service) => !data.categories.some((category) => category.id === service.category && category.parentId))
          .map((service) => ({ id: service.id, name: service.name, phone: service.phone, area: service.area, section: data.categories.find((category) => category.id === service.category)?.name ?? "" }))
          .sort((a, b) => a.name.localeCompare(b.name, "ar"))}
        utilityNumbers={(data.utilityNumbers ?? []).map((item) => ({ label: item.name, phone: item.number }))}
      />
    </main>
  );
}

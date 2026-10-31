/**
 * بيانات SEO المنظَّمة (JSON-LD) وصفحات المشاركة.
 *
 * صفحة كل مهني على الدليل هي صفحته الرسمية (`/profile/<id>`)، فبنوصفها لمحركات البحث
 * بشكل واضح: اسم النشاط، التخصص، المنطقة، الرقم، التقييم، ورابط الصورة — بدل ما تظهر
 * كصفحة عامة من غير بيانات.
 *
 * الملف نقي (بدون React/DB) حتى يُختبر بسهولة.
 */
import type { PublicProfile, SiteSettings } from "@/lib/catalog";

export type JsonLd = Record<string, unknown>;

/** اسم القرية والمركز والمحافظة — تُستخدم في العنوان البريدي لأي نشاط. */
export const VILLAGE_ADDRESS = {
  addressLocality: "جنزور",
  addressRegion: "المنوفية",
  addressCountry: "EG",
} as const;

/** يبني رابط الصفحة العامة من المعرّف (بدون سلاش مزدوج). */
export function profileCanonicalUrl(siteUrl: string, id: string) {
  return `${siteUrl.replace(/\/+$/, "")}/profile/${encodeURIComponent(id)}`;
}

/** عنوان الصفحة ووصفها لمحركات البحث (يستخدمه generateMetadata وأيضًا OG). */
export function profileSeo(profile: PublicProfile, settings: Pick<SiteSettings, "siteName">) {
  const primary = profile.services[0];
  const headline = profile.profile.jobTitle || primary?.categoryName || "عضو في دليل جنزور";
  const place = profile.profile.address || primary?.address || VILLAGE_ADDRESS.addressLocality;
  const title = `${profile.name} — ${headline} في جنزور | ${settings.siteName}`;
  const description = profile.profile.bio
    ? profile.profile.bio.slice(0, 155)
    : `${profile.name} — ${headline} بقرية جنزور (${place}). بيانات التواصل ورمز QR من ${settings.siteName}.`;
  return { title, description, headline, place, primary };
}

/**
 * JSON-LD للملف الشخصي:
 * - مهنة منشورة ⇒ `LocalBusiness` (الأقرب لطبيعة النشاط: اسم + رقم + منطقة + تقييم).
 * - عضو من غير مهنة ⇒ `Person`.
 */
export function profileJsonLd({
  profile, settings, siteUrl, imageUrl,
}: {
  profile: PublicProfile;
  settings: Pick<SiteSettings, "siteName">;
  siteUrl: string;
  imageUrl?: string;
}): JsonLd {
  const url = profileCanonicalUrl(siteUrl, profile.id);
  const { headline, place } = profileSeo(profile, settings);
  const primary = profile.services[0];
  const rating = Number.parseFloat(primary?.rating ?? "");
  const base: JsonLd = {
    "@context": "https://schema.org",
    name: profile.name,
    url,
    description: profile.profile.bio || `${profile.name} — ${headline} بقرية جنزور.`,
    telephone: profile.phone || undefined,
    image: imageUrl || undefined,
    address: { "@type": "PostalAddress", streetAddress: place, ...VILLAGE_ADDRESS },
    areaServed: "جنزور، المنوفية، مصر",
  };
  if (profile.profile.facebook) base.sameAs = [profile.profile.facebook];
  if (primary && Number.isFinite(rating) && rating > 0 && primary.reviews > 0) {
    base.aggregateRating = { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: primary.reviews, bestRating: "5", worstRating: "1" };
  }
  if (primary) {
    return {
      ...base,
      "@type": "LocalBusiness",
      additionalType: "https://schema.org/ProfessionalService",
      knowsAbout: [primary.categoryName, ...profile.services.map((service) => service.categoryName)].filter(Boolean),
      parentOrganization: { "@type": "Organization", name: settings.siteName, url: siteUrl },
    };
  }
  return { ...base, "@type": "Person", jobTitle: profile.profile.jobTitle || undefined };
}

/** JSON-LD لموقع الدليل نفسه (يُضاف مرة واحدة في الجذر). */
export function siteJsonLd({ settings, siteUrl }: { settings: SiteSettings; siteUrl: string }): JsonLd[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.siteName,
      alternateName: "دليل جنزور",
      url: siteUrl,
      inLanguage: "ar-EG",
      description: settings.tagline,
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: settings.siteName,
      description: settings.contactText || settings.tagline,
      url: siteUrl,
      telephone: settings.phone,
      image: `${siteUrl.replace(/\/+$/, "")}/images/og-cover.jpg`,
      address: { "@type": "PostalAddress", ...VILLAGE_ADDRESS },
      areaServed: "جنزور، المنوفية، مصر",
      priceRange: "مجاني",
    },
  ];
}

/** يحوّل الكائن إلى وسم <script type="application/ld+json"> آمن (بدون كسر HTML). */
export function jsonLdText(value: JsonLd | JsonLd[]) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

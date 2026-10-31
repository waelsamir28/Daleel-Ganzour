import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { databaseConfigured } from "@/db";
import { getSettings } from "@/lib/directory";
import { getPublicProfile } from "@/lib/member-profile";
import { profileSeo } from "@/lib/seo";

/**
 * صورة المشاركة (Open Graph) لكل مهني — تُولَّد على الخادم بنفس هوية الدليل:
 * الاسم + التخصص + المنطقة + الرقم + اسم الدليل. الرابط نفسه هو اللي يظهر
 * في واتساب/فيسبوك/تليجرام، فالصفحة بقت تبان ببيانات صاحبها بدل صورة عامة.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "بطاقة مهني على دليل جنزور";

type FontSpec = { name: string; data: Buffer; style: "normal"; weight: 400 | 700 | 900 };

/** خطوط الصورة من حزمة Cairo المحلية (نفس خط الموقع) — بدون أي طلب شبكة. */
function imageFonts(): FontSpec[] {
  const read = (file: string) => {
    try { return readFileSync(join(process.cwd(), "node_modules", "@fontsource", "cairo", "files", file)); } catch { return null; }
  };
  const arabic900 = read("cairo-arabic-900-normal.woff");
  const arabic700 = read("cairo-arabic-700-normal.woff");
  const latin900 = read("cairo-latin-900-normal.woff");
  const latin700 = read("cairo-latin-700-normal.woff");
  const fonts: FontSpec[] = [];
  if (arabic900) fonts.push({ name: "CairoArabic", data: arabic900, style: "normal", weight: 900 });
  if (arabic700) fonts.push({ name: "CairoArabic", data: arabic700, style: "normal", weight: 700 });
  if (latin900) fonts.push({ name: "CairoLatin", data: latin900, style: "normal", weight: 900 });
  if (latin700) fonts.push({ name: "CairoLatin", data: latin700, style: "normal", weight: 700 });
  return fonts;
}

/**
 * محرّك رسم الصور (satori) بيرصّ الكلمات من الشمال لليمين (مافيش biDi)، فبنعكس ترتيب
 * الكلمات أولًا حتى تظهر الجملة العربية صح من اليمين للشمال.
 */
function rtlWords(value: string) {
  return (value ?? "").split(/\s+/).filter(Boolean).reverse().join(" ");
}

/** تقصير النص حتى لا يلتف على سطرين داخل الصورة. */
function clip(value: string, max: number) {
  const text = (value ?? "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

async function loadProfile(id: string) {
  if (!databaseConfigured) return null;
  try { return await getPublicProfile(id); } catch { return null; }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, settings] = await Promise.all([loadProfile(id), getSettings().catch(() => null)]);
  const fonts = imageFonts();
  const hasFonts = fonts.length > 0;
  const siteName = clip(settings?.siteName ?? "دليل المهن والخدمات بقرية جنزور", 42);
  const seo = profile ? profileSeo(profile, { siteName }) : null;
  const name = clip(profile?.name ?? siteName, 44);
  const headline = clip(seo?.headline ?? "دليل المهن والخدمات بقرية جنزور", 40);
  const place = clip(seo?.place ?? "جنزور / الناحية الشرقية - المنوفية", 38);
  const phone = (profile?.phone ?? settings?.phone ?? "").trim();
  const verified = Boolean(profile?.services.some((service) => service.verified));
  const arabic = "CairoArabic, sans-serif";
  const latin = "CairoLatin, CairoArabic, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #eef5fd 0%, #dbe9f8 100%)",
          padding: 52, fontFamily: hasFonts ? arabic : "sans-serif", direction: "rtl",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#12344f", whiteSpace: "nowrap" }}>{rtlWords(siteName)}</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#5b7691", whiteSpace: "nowrap" }}>{rtlWords("دليل جنزور")}</span>
        </div>

        <div
          style={{
            marginTop: 26, flex: "1 1 auto", display: "flex", flexDirection: "column", justifyContent: "center",
            background: "#ffffff", borderRadius: 38, border: "3px solid #d9e7f5", padding: "40px 50px",
            boxShadow: "0 24px 60px rgba(13,63,125,.14)", overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: name.length > 32 ? 34 : name.length > 26 ? 40 : name.length > 20 ? 48 : name.length > 14 ? 56 : 62, fontWeight: 900, color: "#0f2f4d", lineHeight: 1.4, whiteSpace: "nowrap" }}>{rtlWords(name)}</span>
            {verified && (
              <span style={{ marginRight: 18, fontSize: 24, fontWeight: 700, color: "#0a8f54", background: "#eefbf3", border: "2px solid #b7e8cd", borderRadius: 999, padding: "6px 18px", flexShrink: 0 }}>
                بيانات موثقة
              </span>
            )}
          </div>
          <span style={{ marginTop: 14, fontSize: headline.length > 30 ? 28 : 36, fontWeight: 700, color: "#0b5f9e", lineHeight: 1.5, flexShrink: 0, whiteSpace: "nowrap" }}>{rtlWords(headline)}</span>
          <span style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: "#5b7691", lineHeight: 1.5, flexShrink: 0, whiteSpace: "nowrap" }}>{rtlWords(place)}</span>
          {phone && (
            <span style={{ marginTop: 18, fontSize: 46, fontWeight: 900, color: "#0f2f4d", fontFamily: hasFonts ? latin : "sans-serif", direction: "ltr", lineHeight: 1.4, flexShrink: 0 }}>
              {phone}
            </span>
          )}
        </div>

        <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#5b7691", whiteSpace: "nowrap" }}>{rtlWords("افتح الرابط للتواصل المباشر")}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#5b7691", whiteSpace: "nowrap" }}>{rtlWords("مكتب الجمال للدعاية والإعلان")}</span>
        </div>
      </div>
    ),
    { ...size, fonts: hasFonts ? fonts : undefined },
  );
}

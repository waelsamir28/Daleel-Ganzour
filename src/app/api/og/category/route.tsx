import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { sectionAccent } from "@/lib/catalog";

/**
 * بطاقة مشاركة مولّدة لأي قسم أو تخصص — بنفس هوية الدليل:
 * لون القسم + اسمه + جملة تعريفية + اسم الموقع.
 * تُستخدم للأقسام اللي لسه مالهاش صورة جاهزة في public/images/og،
 * فالرابط في واتساب/فيسبوك بيظهر بلون القسم واسمه بدل صورة عامة.
 */
export const dynamic = "force-dynamic";
const size = { width: 1200, height: 630 };

type FontSpec = { name: string; data: Buffer; style: "normal"; weight: 400 | 700 | 900 };

function imageFonts(): FontSpec[] {
  const read = (file: string) => {
    try { return readFileSync(join(process.cwd(), "node_modules", "@fontsource", "cairo", "files", file)); } catch { return null; }
  };
  const arabic900 = read("cairo-arabic-900-normal.woff");
  const arabic700 = read("cairo-arabic-700-normal.woff");
  const latin700 = read("cairo-latin-700-normal.woff");
  const fonts: FontSpec[] = [];
  if (arabic900) fonts.push({ name: "CairoArabic", data: arabic900, style: "normal", weight: 900 });
  if (arabic700) fonts.push({ name: "CairoArabic", data: arabic700, style: "normal", weight: 700 });
  // خط لاتيني من نفس الحزمة — بدون كده رابط الموقع يظهر مربعات فاضية في الصورة.
  if (latin700) fonts.push({ name: "CairoLatin", data: latin700, style: "normal", weight: 700 });
  return fonts;
}

/** satori بيرصّ من الشمال لليمين — فبنعكس ترتيب الكلمات ونرسمها بالعرض صح. */
function rtl(value: string) {
  return (value ?? "").split(/\s+/).filter(Boolean).reverse().join(" ");
}

function clip(value: string, max: number) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function safeColor(value: string | null) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : sectionAccent("default");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = clip(url.searchParams.get("name") ?? "", 46) || "خدمات قرية جنزور";
  const accent = safeColor(url.searchParams.get("color"));
  const fonts = imageFonts();
  const fontFamily = fonts.length ? "CairoArabic" : "sans-serif";
  const dark = `${accent}cc`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, backgroundColor: "#071a2c", backgroundImage: `radial-gradient(circle at 85% 12%, ${accent}55 0%, transparent 55%), radial-gradient(circle at 10% 90%, ${dark}44 0%, transparent 50%)`, color: "#fff", fontFamily }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 18, height: 64, borderRadius: 9, backgroundColor: accent }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 38, fontWeight: 700, color: "#dbeafe" }}>{rtl("دليل المهن والخدمات")}</span>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#93c5fd" }}>{rtl("قرية جنزور")}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.15 }}>{rtl(name)}</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#e2e8f0" }}>{rtl("أرقام وعناوين وتواصل مباشر بضغطة واحدة")}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 34, fontWeight: 700, backgroundColor: accent, padding: "14px 34px", borderRadius: 999 }}>{rtl("اتصل أو ابعت واتساب فورًا")}</span>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#cbd5e1", fontFamily: "CairoLatin" }} dir="ltr">daleel-ganzour.vercel.app</span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

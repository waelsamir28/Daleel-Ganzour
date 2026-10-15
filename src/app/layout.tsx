import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/cairo/900.css";
import InstallAppModal from "@/components/install-app-modal";
import RouteTransition from "@/components/route-transition";
import SplashScreen from "@/components/splash-screen";
import "./globals.css";
import "./janzour.css";
import "./availability.css";
import "./theme.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daleel-ganzour.vercel.app";
const SITE_TITLE = "دليل المهن والخدمات بقرية جنزور";
const SITE_DESCRIPTION = "دليل الحرفيين والعيادات والصيدليات والمحلات والمدرسين والجمعيات الخيرية وكل خدمات قرية جنزور في مكان واحد. ابحث واتصل بضغطة واحدة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "/",
    siteName: "دليل جنزور",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/og-cover.png", width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: ["/images/og-cover.png"] },
  keywords: ["جنزور", "دليل جنزور", "حرفيين جنزور", "عيادات جنزور", "صيدليات جنزور", "محلات جنزور", "مدرسين جنزور", "المنوفية", "شبين الكوم"],
  title: "دليل المهن والخدمات بقرية جنزور",
  description: "دليل الحرفيين والعيادات والمحلات والمدرسين والجمعيات الخيرية والخدمات بقرية جنزور، بإدارة مكتب الجمال للدعاية والإعلان. واتساب 01222355769.",
  applicationName: "دليل المهن والخدمات بقرية جنزور",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "دليل جنزور", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon.png?v=3", type: "image/png", sizes: "48x48" }, { url: "/icon-192.png?v=3", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-touch-icon.png?v=3", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0877e6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The blocking script applies Dark Mode by default before first paint (unless the user explicitly chose "light"),
  // and hides the splash screen on any inner page or after the initial start screen has already been shown.
  return <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__janzourInstallPrompt=e;});try{var stored=localStorage.getItem("janzour-theme");if(stored==="light"){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}if(localStorage.getItem("janzour-bigtext")==="1")document.documentElement.classList.add("big-text");if(window.location.pathname!=="/"||sessionStorage.getItem("janzour-splash-shown")==="1"){document.documentElement.classList.add("skip-splash");}else{sessionStorage.setItem("janzour-splash-shown","1");}}catch(e){document.documentElement.classList.add("dark");}})();` }}/></head><body><SplashScreen /><RouteTransition>{children}</RouteTransition><InstallAppModal /></body></html>;
}

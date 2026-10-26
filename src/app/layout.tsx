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
import TapFeedback from "@/components/tap-feedback";
import PowerSave from "@/components/power-save";
import "./globals.css";
import "./janzour.css";
import "./availability.css";
import "./theme.css";
import "./aero.css";
import "./fluent.css";
import "./metro.css";

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
    images: [
      { url: "/images/og-cover.jpg?v=3", width: 1200, height: 630, type: "image/jpeg", alt: SITE_TITLE },
      { url: "/images/og-square.jpg?v=3", width: 1080, height: 1080, type: "image/jpeg", alt: SITE_TITLE },
    ],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: ["/images/og-cover.jpg?v=3"] },
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
  // and hides the splash screen on any inner page, after it was already shown this session, or for browser visitors when it is reserved to the installed app.
  return <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__janzourInstallPrompt=e;});try{var stored=localStorage.getItem("janzour-theme");var mode=localStorage.getItem("janzour-theme-mode")||"auto";var dark=stored?stored==="dark":(mode==="light"?false:mode==="dark"?true:!(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches));if(dark){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}var standalone=(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||window.navigator.standalone===true;var audience=localStorage.getItem("janzour-splash-audience")||"installed";if(standalone){document.documentElement.classList.add("is-standalone");}if(window.location.pathname!=="/"||sessionStorage.getItem("janzour-splash-shown")==="1"||audience==="off"||(audience==="installed"&&!standalone)){document.documentElement.classList.add("skip-splash");}else{sessionStorage.setItem("janzour-splash-shown","1");}}catch(e){document.documentElement.classList.add("dark");}})();` }}/></head><body><SplashScreen /><RouteTransition>{children}</RouteTransition><InstallAppModal /><TapFeedback /><PowerSave /></body></html>;
}

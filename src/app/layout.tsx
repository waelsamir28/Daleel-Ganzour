import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/cairo/900.css";
import PwaInstall from "@/components/pwa-install";
import RouteTransition from "@/components/route-transition";
import SplashScreen from "@/components/splash-screen";
import "./globals.css";
import "./janzour.css";
import "./availability.css";
import "./theme.css";

export const metadata: Metadata = {
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The blocking script applies the saved (or system) theme before first paint to avoid a white flash,
  // and hides the splash screen on any inner page or after the initial start screen has already been shown.
  return <html lang="ar" dir="rtl"><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var stored=localStorage.getItem("janzour-theme");var dark=stored?stored==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(dark)document.documentElement.classList.add("dark");if(localStorage.getItem("janzour-bigtext")==="1")document.documentElement.classList.add("big-text");if(window.location.pathname!=="/"||sessionStorage.getItem("janzour-splash-shown")==="1"){document.documentElement.classList.add("skip-splash");}else{sessionStorage.setItem("janzour-splash-shown","1");}}catch(e){}})();` }}/></head><body><SplashScreen /><RouteTransition>{children}</RouteTransition><PwaInstall /></body></html>;
}

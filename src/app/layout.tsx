import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/tajawal/arabic.css";
import "@fontsource/tajawal/latin.css";
import PwaInstall from "@/components/pwa-install";
import RouteTransition from "@/components/route-transition";
import SplashScreen from "@/components/splash-screen";
import "./globals.css";
import "./janzour.css";

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
  return <html lang="ar" dir="rtl"><body><SplashScreen /><RouteTransition>{children}</RouteTransition><PwaInstall /></body></html>;
}

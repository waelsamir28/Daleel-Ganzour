import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import PwaInstall from "@/components/pwa-install";
import "./globals.css";
import "./janzour.css";

export const metadata: Metadata = {
  title: "دليل المهن والخدمات بقرية جنزور",
  description: "دليل الحرفيين والعيادات والمحلات والمدرسين والجمعيات الخيرية والخدمات بقرية جنزور، بإدارة مكتب الجمال للدعاية والإعلان. واتساب 01222355769.",
  applicationName: "دليل المهن والخدمات بقرية جنزور",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "دليل جنزور", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/images/logo-janzour.png", type: "image/png" }],
    apple: [{ url: "/images/logo-janzour.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0877e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}<PwaInstall /></body></html>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./janzour.css";

export const metadata: Metadata = {
  title: "دليل المهن والخدمات بقرية جنزور",
  description: "دليل الحرفيين والعيادات والمحلات والمدرسين والجمعيات الخيرية والخدمات بقرية جنزور، بإدارة مكتب الجمال للدعاية والإعلان. واتساب 01222355769.",
  applicationName: "دليل المهن والخدمات بقرية جنزور",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}

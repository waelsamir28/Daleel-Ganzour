"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // الرئيسية والأقسام والتخصصات يديرها DirectoryShell بتنقّل فوري داخل الصفحة نفسها (pushState)،
  // فلا نعيد تركيبها عند تغيّر المسار بينها وإلا ضاعت حالة القسم المفتوح.
  const transitionKey = pathname === "/" || pathname.startsWith("/categories/") ? "directory" : pathname;

  return (
    <div className="route-transition" key={transitionKey}>
      {children}
    </div>
  );
}

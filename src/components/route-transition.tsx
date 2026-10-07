"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="route-transition" key={pathname}>
      {children}
    </div>
  );
}

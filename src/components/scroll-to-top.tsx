"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Next.js scroll-behavior: smooth sometimes interrupts the route-change scroll.
    // This effect ensures we jump to the top immediately upon pathname change.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior, // 'instant' forces an immediate jump
    });
  }, [pathname]);

  return null;
}

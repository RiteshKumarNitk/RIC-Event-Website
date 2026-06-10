"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MemberLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    const target = `/login?mode=member${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`;
    router.replace(target);
  }, [router, redirect]);

  return null;
}

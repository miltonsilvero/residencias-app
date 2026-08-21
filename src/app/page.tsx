"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeForRole } from "@/components/Guard";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
    } else {
      router.replace(homeForRole(session.role));
    }
  }, [router]);

  return null;
}

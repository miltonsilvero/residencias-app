"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { Role, SessionAccount } from "@/lib/types";

export function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "supervisor") return "/supervisor";
  return "/dashboard";
}

/**
 * Protege una pagina: si no hay sesion, manda a /login.
 * Si se pasa requireRole, ademas verifica el rol (admin / house / supervisor).
 */
export function useGuard(requireRole?: Role) {
  const router = useRouter();
  const [session, setSession] = useState<SessionAccount | null | undefined>(
    undefined
  );

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (requireRole && s.role !== requireRole) {
      router.replace(homeForRole(s.role));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}

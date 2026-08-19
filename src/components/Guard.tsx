"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { Role, SessionAccount } from "@/lib/types";

/**
 * Protege una pagina: si no hay sesion, manda a /login.
 * Si se pasa requireRole, ademas verifica el rol (admin vs house).
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
      router.replace(s.role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}

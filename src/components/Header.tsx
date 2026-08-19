"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearSession } from "@/lib/session";
import { SessionAccount } from "@/lib/types";

export function Header({ session }: { session: SessionAccount }) {
  const router = useRouter();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            Casa al día
          </p>
          <Link
            href={session.role === "admin" ? "/admin" : "/dashboard"}
            className="font-display text-xl font-semibold text-[var(--color-ink)]"
          >
            {session.display_name}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {session.role === "house" && (
            <Link
              href="/dashboard/historial"
              className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
            >
              Historial
            </Link>
          )}
          <button
            onClick={logout}
            className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

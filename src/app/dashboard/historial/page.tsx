"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { Period } from "@/lib/types";
import { monthLabel } from "@/lib/format";

export default function HistorialPage() {
  const session = useGuard("house");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("periods")
      .select("*")
      .eq("house_id", session.id)
      .order("month", { ascending: false })
      .then(({ data }) => {
        setPeriods((data as Period[]) ?? []);
        setLoading(false);
      });
  }, [session]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="font-display mb-6 text-xl font-semibold text-[var(--color-ink)]">
          Historial de meses
        </h2>

        {loading ? (
          <p className="text-[var(--color-ink-soft)]">Cargando...</p>
        ) : periods.length === 0 ? (
          <p className="text-[var(--color-ink-soft)]">Todavía no hay meses registrados.</p>
        ) : (
          <div className="space-y-2">
            {periods.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/historial/${p.month.slice(0, 7)}`}
                className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 hover:border-[var(--color-accent)]"
              >
                <span className="font-medium text-[var(--color-ink)]">
                  {monthLabel(p.month)}
                </span>
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {p.funding_mode === "fijo" ? "Aporte fijo" : "Reparto exacto"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

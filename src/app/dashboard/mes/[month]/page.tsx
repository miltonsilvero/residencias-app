"use client";

import { use } from "react";
import Link from "next/link";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { PeriodView } from "@/components/PeriodView";
import { monthLabel } from "@/lib/format";

export default function MesPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = use(params);
  const session = useGuard("house");
  const monthKey = `${month}-01`;

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
          >
            ← Volver al panel
          </Link>
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            {monthLabel(monthKey)}
          </h2>
        </div>
        <PeriodView houseId={session.id} monthKey={monthKey} />
      </main>
    </div>
  );
}

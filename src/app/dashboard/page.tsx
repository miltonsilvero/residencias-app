"use client";

import { useState } from "react";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { MonthNav } from "@/components/MonthNav";
import { PeriodView } from "@/components/PeriodView";
import { currentMonthKey } from "@/lib/format";

export default function DashboardPage() {
  const session = useGuard("house");
  const [monthKey, setMonthKey] = useState(currentMonthKey());

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />
        <PeriodView houseId={session.id} monthKey={monthKey} />
      </main>
    </div>
  );
}

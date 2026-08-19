"use client";

import { monthLabel, shiftMonth } from "@/lib/format";

export function MonthNav({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        className="rounded-full p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
      >
        ←
      </button>
      <h2 className="font-display w-48 text-center text-lg font-semibold text-[var(--color-ink)]">
        {monthLabel(monthKey)}
      </h2>
      <button
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        className="rounded-full p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
      >
        →
      </button>
    </div>
  );
}

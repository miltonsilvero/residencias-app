"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bill, Period, PeriodMember } from "@/lib/types";
import { formatMoney, monthLabel } from "@/lib/format";
import { computeShare, totalBillsAmount, totalFractions } from "@/lib/shares";

interface DebtItem {
  label: string; // mes/periodo al que corresponde
  amount: number;
}

interface DebtEntry {
  name: string;
  total: number;
  items: DebtItem[];
}

/**
 * Lista de cuánto debe cada integrante en total, sumando todos los meses
 * en los que participó (haya vivido junto a otros o no). Se agrupa por
 * nombre exacto: si dos meses distintos tienen a alguien cargado con el
 * mismo nombre, se suma como la misma persona; nombres distintos (aunque
 * sean la misma persona en la vida real) quedan como filas separadas.
 * Solo entran quienes tengan algo pendiente de pagar.
 */
export function MembersDebtPanel({ houseId }: { houseId: string }) {
  const [entries, setEntries] = useState<DebtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: periodsData } = await supabase
      .from("periods")
      .select("*")
      .eq("house_id", houseId);

    const periods = (periodsData as Period[]) ?? [];

    if (periods.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const periodIds = periods.map((p) => p.id);

    const [{ data: membersData }, { data: billsData }] = await Promise.all([
      supabase.from("period_members").select("*").in("period_id", periodIds),
      supabase.from("bills").select("period_id, amount").in("period_id", periodIds),
    ]);

    const members = (membersData as PeriodMember[]) ?? [];
    const bills = (billsData as Pick<Bill, "period_id" | "amount">[]) ?? [];

    const periodById = new Map(periods.map((p) => [p.id, p]));

    const billsByPeriod = new Map<string, Bill[]>();
    for (const b of bills) {
      const list = billsByPeriod.get(b.period_id) ?? [];
      list.push(b as Bill);
      billsByPeriod.set(b.period_id, list);
    }

    const membersByPeriod = new Map<string, PeriodMember[]>();
    for (const m of members) {
      const list = membersByPeriod.get(m.period_id) ?? [];
      list.push(m);
      membersByPeriod.set(m.period_id, list);
    }

    const byName = new Map<string, DebtEntry>();

    for (const member of members) {
      if (member.paid) continue;

      const period = periodById.get(member.period_id);
      if (!period) continue;

      const periodBills = billsByPeriod.get(period.id) ?? [];
      const periodMembers = membersByPeriod.get(period.id) ?? [];

      const share = computeShare(
        member,
        period.funding_mode,
        period.fixed_amount,
        totalFractions(periodMembers),
        totalBillsAmount(periodBills)
      );

      if (share <= 0) continue;

      const existing = byName.get(member.name) ?? {
        name: member.name,
        total: 0,
        items: [],
      };
      existing.total += share;
      existing.items.push({ label: monthLabel(period.month), amount: share });
      byName.set(member.name, existing);
    }

    const list = Array.from(byName.values()).sort((a, b) => b.total - a.total);
    setEntries(list);
    setLoading(false);
  }, [houseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <section>
      <h2 className="font-display mb-3 text-lg font-semibold text-[var(--color-ink)]">
        Quién debe
      </h2>

      {loading ? (
        <p className="text-[var(--color-ink-soft)]">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
          Nadie tiene aportes pendientes por ahora.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isOpen = expandedName === entry.name;
            return (
              <div
                key={entry.name}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]"
              >
                <button
                  onClick={() => setExpandedName(isOpen ? null : entry.name)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <p className="font-medium text-[var(--color-ink)]">{entry.name}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="tabular font-semibold text-[var(--color-danger)]">
                      {formatMoney(entry.total)}
                    </span>
                    <span className="text-[var(--color-ink-soft)]">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-2 border-t border-[var(--color-line)] px-4 py-3">
                    {entry.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-[var(--color-bg)] px-3 py-2 text-sm"
                      >
                        <span className="text-[var(--color-ink)]">{item.label}</span>
                        <span className="tabular font-semibold text-[var(--color-danger)]">
                          {formatMoney(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { FundPanel } from "@/components/FundPanel";
import { MemberRow } from "@/components/MemberRow";
import { BillCard } from "@/components/BillCard";
import { BillFormModal } from "@/components/BillFormModal";
import { usePeriodData } from "@/lib/usePeriodData";
import { supabase } from "@/lib/supabaseClient";
import {
  computeShare,
  fundBalance,
  totalBillsAmount,
  totalFractions,
} from "@/lib/shares";

export function PeriodView({
  houseId,
  monthKey,
}: {
  houseId: string;
  monthKey: string;
}) {
  const [newMemberName, setNewMemberName] = useState("");
  const [showBillForm, setShowBillForm] = useState(false);
  const { loading, period, members, bills, refresh } = usePeriodData(
    houseId,
    monthKey
  );

  if (loading || !period) {
    return <p className="text-center text-[var(--color-ink-soft)]">Cargando...</p>;
  }

  const billsTotal = totalBillsAmount(bills);
  const fractions = totalFractions(members);
  const balance = fundBalance(members, bills, period.funding_mode, period.fixed_amount);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await supabase.from("period_members").insert({
      period_id: period!.id,
      name: newMemberName.trim(),
      fraction: 1,
    });
    setNewMemberName("");
    refresh();
  }

  return (
    <>
      <FundPanel
        period={period}
        balance={balance}
        totalBills={billsTotal}
        onChanged={refresh}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Facturas del mes
          </h3>
          <button
            onClick={() => setShowBillForm(true)}
            className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Nueva factura
          </button>
        </div>

        {bills.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Todavía no cargaron ninguna factura este mes.
          </p>
        ) : (
          <div className="space-y-2">
            {bills.map((b) => (
              <BillCard key={b.id} bill={b} onChanged={refresh} onDeleted={refresh} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display mb-3 text-lg font-semibold text-[var(--color-ink)]">
          Quién vive y quién pagó su parte
        </h3>

        {members.length === 0 ? (
          <p className="mb-3 rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Todavía no hay integrantes cargados para este mes.
          </p>
        ) : (
          <div className="mb-3 space-y-2">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                share={computeShare(
                  m,
                  period.funding_mode,
                  period.fixed_amount,
                  fractions,
                  billsTotal
                )}
                onChanged={refresh}
              />
            ))}
          </div>
        )}

        <form onSubmit={addMember} className="flex gap-2">
          <input
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nombre de quien se suma este mes"
            className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]"
          >
            Agregar
          </button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Si alguien vivió solo una parte del mes, cargalo y después ajustá
          &quot;parte del mes&quot; (ej. 0.5 para medio mes) en su fila.
        </p>
      </section>

      {showBillForm && (
        <BillFormModal
          periodId={period.id}
          houseId={houseId}
          createdBy={houseId}
          onClose={() => setShowBillForm(false)}
          onCreated={refresh}
        />
      )}
    </>
  );
}

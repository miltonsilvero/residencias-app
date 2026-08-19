"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FundingMode, Period } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function FundPanel({
  period,
  balance,
  totalBills,
  onChanged,
}: {
  period: Period;
  balance: number;
  totalBills: number;
  onChanged: () => void;
}) {
  const [fixedAmount, setFixedAmount] = useState(
    period.fixed_amount !== null ? String(period.fixed_amount) : ""
  );

  async function setMode(mode: FundingMode) {
    await supabase.from("periods").update({ funding_mode: mode }).eq("id", period.id);
    onChanged();
  }

  async function saveFixedAmount() {
    await supabase
      .from("periods")
      .update({ fixed_amount: fixedAmount === "" ? null : Number(fixedAmount) })
      .eq("id", period.id);
    onChanged();
  }

  return (
    <div className="rounded-2xl bg-[var(--color-paper)] p-5 ring-1 ring-[var(--color-line)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Fondo común
          </p>
          <p className="tabular font-display text-2xl font-semibold text-[var(--color-ink)]">
            {formatMoney(balance)}
          </p>
        </div>
        <div className="text-right text-sm text-[var(--color-ink-soft)]">
          <p>Total facturado: {formatMoney(totalBills)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[var(--color-line)] p-1 text-sm">
          <button
            onClick={() => setMode("fijo")}
            className={`rounded-md px-3 py-1.5 ${
              period.funding_mode === "fijo"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            Aporte fijo
          </button>
          <button
            onClick={() => setMode("exacto")}
            className={`rounded-md px-3 py-1.5 ${
              period.funding_mode === "exacto"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            Reparto exacto
          </button>
        </div>

        {period.funding_mode === "fijo" && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            $ por persona (mes completo)
            <input
              type="number"
              min="0"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              onBlur={saveFixedAmount}
              className="w-28 rounded-lg border border-[var(--color-line)] px-2 py-1 text-[var(--color-ink)]"
              placeholder="20000"
            />
          </label>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
        {period.funding_mode === "fijo"
          ? "Cada integrante aporta el monto fijo (prorrateado si vivió una parte del mes). Lo que sobra o falta queda en el fondo común."
          : "El total de las facturas del mes se reparte proporcionalmente entre los integrantes según cuánto del mes vivieron ahí."}
      </p>
    </div>
  );
}

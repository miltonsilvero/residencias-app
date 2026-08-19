"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bill } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";

export function BillCard({
  bill,
  onChanged,
  onDeleted,
}: {
  bill: Bill;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function togglePaid() {
    setBusy(true);
    await supabase
      .from("bills")
      .update({
        paid: !bill.paid,
        paid_at: !bill.paid ? new Date().toISOString() : null,
      })
      .eq("id", bill.id);
    setBusy(false);
    onChanged();
  }

  async function remove() {
    if (!confirm(`¿Eliminar la factura de ${bill.service_name}?`)) return;
    setBusy(true);
    await supabase.from("bills").delete().eq("id", bill.id);
    setBusy(false);
    onDeleted();
  }

  const overdue =
    !bill.paid && bill.due_date && new Date(bill.due_date) < new Date();

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        bill.paid
          ? "border-[var(--color-line)] bg-[var(--color-paper)] opacity-70"
          : overdue
          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-paper)]"
      }`}
    >
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-ink)]">
          {bill.service_name}{" "}
          <span className="font-normal text-[var(--color-ink-soft)]">
            · {bill.type === "mensual" ? "mensual" : "bimestral"}
            {bill.period_label ? ` · ${bill.period_label}` : ""}
          </span>
        </p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Vence {formatDate(bill.due_date)}
          {bill.file_url && (
            <>
              {" · "}
              <a
                href={bill.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] underline"
              >
                ver archivo
              </a>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="tabular font-medium text-[var(--color-ink)]">
          {formatMoney(bill.amount)}
        </span>
        <button
          disabled={busy}
          onClick={togglePaid}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            bill.paid
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              : "bg-[var(--color-ink)] text-white"
          }`}
        >
          {bill.paid ? "Pagada ✓" : "Marcar pagada"}
        </button>
        <button
          disabled={busy}
          onClick={remove}
          className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
          aria-label="Eliminar factura"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

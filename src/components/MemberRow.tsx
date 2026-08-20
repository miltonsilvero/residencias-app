"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PeriodMember } from "@/lib/types";
import { formatMoney, fractionToWeeks, weeksToFraction } from "@/lib/format";

const WEEK_OPTIONS = [
  { weeks: 1, label: "1 semana" },
  { weeks: 2, label: "2 semanas" },
  { weeks: 3, label: "3 semanas" },
  { weeks: 4, label: "Mes completo" },
];

export function MemberRow({
  member,
  share,
  onChanged,
}: {
  member: PeriodMember;
  share: number;
  onChanged: () => void;
}) {
  const [editingOverride, setEditingOverride] = useState(false);

  async function updateField(fields: Partial<PeriodMember>) {
    await supabase.from("period_members").update(fields).eq("id", member.id);
    onChanged();
  }

  async function setWeeks(weeks: number) {
    await updateField({ fraction: weeksToFraction(weeks) });
  }

  async function togglePaid() {
    await updateField({
      paid: !member.paid,
      paid_at: !member.paid ? new Date().toISOString() : null,
    });
  }

  async function remove() {
    if (!confirm(`¿Sacar a ${member.name} de este mes?`)) return;
    await supabase.from("period_members").delete().eq("id", member.id);
    onChanged();
  }

  const currentWeeks = fractionToWeeks(member.fraction);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
      <input
        checked={member.paid}
        onChange={togglePaid}
        type="checkbox"
        className="h-5 w-5 accent-[var(--color-accent)]"
      />
      <span
        className={`min-w-[7rem] font-medium ${
          member.paid ? "text-[var(--color-ink-soft)] line-through" : "text-[var(--color-ink)]"
        }`}
      >
        {member.name}
      </span>

      <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
        semanas del mes
        <select
          value={currentWeeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          className="rounded border border-[var(--color-line)] px-2 py-1 text-[var(--color-ink)]"
        >
          {WEEK_OPTIONS.map((opt) => (
            <option key={opt.weeks} value={opt.weeks}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-2">
        {editingOverride ? (
          <input
            autoFocus
            type="number"
            defaultValue={member.override_amount ?? undefined}
            placeholder="monto manual"
            onBlur={(e) => {
              const val = e.target.value;
              updateField({
                override_amount: val === "" ? null : Number(val),
              });
              setEditingOverride(false);
            }}
            className="w-28 rounded border border-[var(--color-line)] px-2 py-1 text-right text-sm"
          />
        ) : (
          <button
            onClick={() => setEditingOverride(true)}
            className="tabular text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
            title="Click para ajustar el monto a mano"
          >
            {formatMoney(share)}
            {member.override_amount !== null && (
              <span className="ml-1 text-[10px] text-[var(--color-amber)]">
                manual
              </span>
            )}
          </button>
        )}
        <button
          onClick={remove}
          className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
          aria-label="Quitar integrante"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

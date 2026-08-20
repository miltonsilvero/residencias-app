"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { BillFormModal } from "@/components/BillFormModal";
import { supabase } from "@/lib/supabaseClient";
import { usePeriodData } from "@/lib/usePeriodData";
import { Period } from "@/lib/types";
import { currentMonthKey, formatMoney, monthLabel } from "@/lib/format";
import { fundBalance, totalBillsAmount } from "@/lib/shares";

export default function DashboardPage() {
  const session = useGuard("house");
  const router = useRouter();
  const [showBillForm, setShowBillForm] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [jumpMonth, setJumpMonth] = useState("");

  const thisMonth = currentMonthKey();
  const current = usePeriodData(session?.id, thisMonth);

  async function loadPeriods() {
    if (!session) return;
    setLoadingPeriods(true);
    const { data } = await supabase
      .from("periods")
      .select("*")
      .eq("house_id", session.id)
      .order("month", { ascending: false });
    setPeriods((data as Period[]) ?? []);
    setLoadingPeriods(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  const pendingBills = current.bills.filter((b) => !b.paid);
  const pendingMembers = current.members.filter((m) => !m.paid);
  const balance = current.period
    ? fundBalance(
        current.members,
        current.bills,
        current.period.funding_mode,
        current.period.fixed_amount
      )
    : 0;
  const billsTotal = totalBillsAmount(current.bills);

  function goToMonth(monthKey: string) {
    router.push(`/dashboard/mes/${monthKey.slice(0, 7)}`);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-ink-soft)]">
              Panel general
            </p>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
              {session.display_name}
            </h1>
          </div>
          <button
            onClick={() => setShowBillForm(true)}
            className="rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            + Cargar factura
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => goToMonth(thisMonth)}
            className="rounded-2xl bg-[var(--color-paper)] p-5 text-left ring-1 ring-[var(--color-line)] hover:ring-[var(--color-accent)]"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Fondo común · {monthLabel(thisMonth)}
            </p>
            <p className="tabular font-display mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {current.loading ? "..." : formatMoney(balance)}
            </p>
          </button>

          <button
            onClick={() => goToMonth(thisMonth)}
            className="rounded-2xl bg-[var(--color-paper)] p-5 text-left ring-1 ring-[var(--color-line)] hover:ring-[var(--color-accent)]"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Facturas sin pagar
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {current.loading ? "..." : pendingBills.length}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              de {formatMoney(billsTotal)} facturados este mes
            </p>
          </button>

          <button
            onClick={() => goToMonth(thisMonth)}
            className="rounded-2xl bg-[var(--color-paper)] p-5 text-left ring-1 ring-[var(--color-line)] hover:ring-[var(--color-accent)]"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Faltan aportar
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {current.loading ? "..." : pendingMembers.length}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              de {current.members.length} integrantes
            </p>
          </button>
        </section>

        <section>
          <h2 className="font-display mb-3 text-lg font-semibold text-[var(--color-ink)]">
            Ir a un mes puntual
          </h2>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--color-paper)] p-4 ring-1 ring-[var(--color-line)]">
            <input
              type="month"
              value={jumpMonth}
              onChange={(e) => setJumpMonth(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <button
              disabled={!jumpMonth}
              onClick={() => goToMonth(`${jumpMonth}-01`)}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Abrir mes
            </button>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Podés abrir cualquier mes, futuro o pasado, para actualizar
              integrantes, pagos y facturas.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display mb-3 text-lg font-semibold text-[var(--color-ink)]">
            Meses registrados
          </h2>
          {loadingPeriods ? (
            <p className="text-[var(--color-ink-soft)]">Cargando...</p>
          ) : periods.length === 0 ? (
            <p className="text-[var(--color-ink-soft)]">
              Todavía no hay meses registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToMonth(p.month)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-left hover:border-[var(--color-accent)]"
                >
                  <span className="font-medium text-[var(--color-ink)]">
                    {monthLabel(p.month)}
                    {p.month === thisMonth && (
                      <span className="ml-2 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                        actual
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-[var(--color-ink-soft)]">
                    {p.funding_mode === "fijo" ? "Aporte fijo" : "Reparto exacto"} →
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {showBillForm && (
          <BillFormModal
            houseId={session.id}
            createdBy={session.display_name}
            defaultMonthKey={thisMonth}
            onClose={() => setShowBillForm(false)}
            onCreated={() => {
              current.refresh();
              loadPeriods();
            }}
          />
        )}
      </main>
    </div>
  );
}

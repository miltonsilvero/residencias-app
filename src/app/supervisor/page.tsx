"use client";

import { useEffect, useState } from "react";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { Account } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";

interface UnpaidBillRow {
  house_id: string;
  service_name: string;
  period_label: string | null;
  due_date: string | null;
  amount: number;
}

/**
 * Vista de solo lectura para supervisar cómo vienen todas las casas:
 * cuántas facturas tiene cada una sin pagar y cuánto dinero deben en
 * total. No permite crear, editar ni borrar nada — solo mirar.
 * Al hacer click en una casa, se despliega el detalle de cada factura
 * adeudada (título, mes, vencimiento y monto).
 */
export default function SupervisorPage() {
  const session = useGuard("supervisor");
  const [houses, setHouses] = useState<Account[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHouseId, setExpandedHouseId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: houseData }, { data: billsData }] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("role", "house")
        .order("display_name", { ascending: true }),
      supabase
        .from("bills")
        .select("house_id, service_name, period_label, due_date, amount")
        .eq("paid", false)
        .order("due_date", { ascending: true }),
    ]);
    setHouses((houseData as Account[]) ?? []);
    setUnpaidBills((billsData as UnpaidBillRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadData();
  }, [session]);

  if (!session) return null;

  const debtSummary = houses.map((house) => {
    const rows = unpaidBills.filter((b) => b.house_id === house.id);
    return {
      house,
      pendingCount: rows.length,
      pendingAmount: rows.reduce((acc, b) => acc + (b.amount || 0), 0),
      bills: rows,
    };
  });
  const totalPendingCount = debtSummary.reduce((acc, s) => acc + s.pendingCount, 0);
  const totalPendingAmount = debtSummary.reduce((acc, s) => acc + s.pendingAmount, 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <section>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-ink-soft)]">
            Solo lectura
          </p>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
            Cómo vienen las casas
          </h1>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--color-paper)] p-5 ring-1 ring-[var(--color-line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Facturas sin pagar (todas las casas)
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {loading ? "..." : totalPendingCount}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--color-paper)] p-5 ring-1 ring-[var(--color-line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Monto total adeudado
            </p>
            <p className="tabular font-display mt-1 text-2xl font-semibold text-[var(--color-ink)]">
              {loading ? "..." : formatMoney(totalPendingAmount)}
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display mb-3 text-lg font-semibold text-[var(--color-ink)]">
            Por casa
          </h2>
          {loading ? (
            <p className="text-[var(--color-ink-soft)]">Cargando...</p>
          ) : houses.length === 0 ? (
            <p className="text-[var(--color-ink-soft)]">Todavía no hay casas cargadas.</p>
          ) : (
            <div className="space-y-2">
              {debtSummary.map(({ house, pendingCount, pendingAmount, bills }) => {
                const isOpen = expandedHouseId === house.id;
                return (
                  <div
                    key={house.id}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]"
                  >
                    <button
                      onClick={() => setExpandedHouseId(isOpen ? null : house.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left"
                    >
                      <p className="font-medium text-[var(--color-ink)]">
                        {house.display_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[var(--color-ink-soft)]">
                          {pendingCount} factura{pendingCount === 1 ? "" : "s"} sin pagar
                        </span>
                        <span
                          className={`tabular font-semibold ${
                            pendingAmount > 0
                              ? "text-[var(--color-danger)]"
                              : "text-[var(--color-accent)]"
                          }`}
                        >
                          {formatMoney(pendingAmount)}
                        </span>
                        <span className="text-[var(--color-ink-soft)]">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[var(--color-line)] px-4 py-3">
                        {bills.length === 0 ? (
                          <p className="text-sm text-[var(--color-ink-soft)]">
                            No tiene facturas pendientes.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {bills.map((b, i) => (
                              <div
                                key={i}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-bg)] px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium text-[var(--color-ink)]">
                                    {b.service_name}
                                  </p>
                                  <p className="text-xs text-[var(--color-ink-soft)]">
                                    {b.period_label ?? "-"} · vence {formatDate(b.due_date)}
                                  </p>
                                </div>
                                <span className="tabular text-sm font-semibold text-[var(--color-danger)]">
                                  {formatMoney(b.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
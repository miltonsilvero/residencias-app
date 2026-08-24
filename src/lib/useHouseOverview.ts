"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Bill, Period, PeriodMember } from "./types";
import { fundBalance } from "./shares";

interface HouseOverview {
  loading: boolean;
  /** Saldo del fondo común acumulado de TODOS los meses (histórico), no solo el actual. */
  balance: number;
  /** Cantidad de facturas sin pagar en toda la historia de la casa. */
  pendingBillsCount: number;
  /** Suma de los montos de esas facturas sin pagar. */
  pendingBillsAmount: number;
  /** Cantidad de aportes de integrantes todavía sin marcar como pagados (en todos los meses). */
  pendingMembersCount: number;
  /** Cantidad total de aportes registrados (pagados + pendientes) en todos los meses. */
  membersCount: number;
  refresh: () => Promise<void>;
}

/**
 * Trae todos los periodos de una casa (todos los meses, no solo el
 * actual) y agrega el fondo común, las facturas pendientes y los
 * aportes pendientes de todos ellos. Así, por ejemplo, si en marzo
 * sobraron $10.000 en el fondo común, ese saldo sigue formando parte
 * del total mostrado en meses posteriores.
 */
export function useHouseOverview(houseId: string | undefined): HouseOverview {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [pendingBillsCount, setPendingBillsCount] = useState(0);
  const [pendingBillsAmount, setPendingBillsAmount] = useState(0);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);

  const load = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);

    const { data: periodsData } = await supabase
      .from("periods")
      .select("*")
      .eq("house_id", houseId);

    const periods = (periodsData as Period[]) ?? [];

    if (periods.length === 0) {
      setBalance(0);
      setPendingBillsCount(0);
      setPendingBillsAmount(0);
      setPendingMembersCount(0);
      setMembersCount(0);
      setLoading(false);
      return;
    }

    const periodIds = periods.map((p) => p.id);

    const [{ data: membersData }, { data: billsData }] = await Promise.all([
      supabase.from("period_members").select("*").in("period_id", periodIds),
      supabase.from("bills").select("*").in("period_id", periodIds),
    ]);

    const members = (membersData as PeriodMember[]) ?? [];
    const bills = (billsData as Bill[]) ?? [];

    const membersByPeriod = new Map<string, PeriodMember[]>();
    for (const m of members) {
      const list = membersByPeriod.get(m.period_id) ?? [];
      list.push(m);
      membersByPeriod.set(m.period_id, list);
    }

    const billsByPeriod = new Map<string, Bill[]>();
    for (const b of bills) {
      const list = billsByPeriod.get(b.period_id) ?? [];
      list.push(b);
      billsByPeriod.set(b.period_id, list);
    }

    let totalBalance = 0;
    for (const period of periods) {
      const periodMembers = membersByPeriod.get(period.id) ?? [];
      const periodBills = billsByPeriod.get(period.id) ?? [];
      totalBalance += fundBalance(
        periodMembers,
        periodBills,
        period.funding_mode,
        period.fixed_amount
      );
    }

    const pendingBills = bills.filter((b) => !b.paid);
    const pendingMembers = members.filter((m) => !m.paid);

    setBalance(totalBalance);
    setPendingBillsCount(pendingBills.length);
    setPendingBillsAmount(pendingBills.reduce((acc, b) => acc + (b.amount || 0), 0));
    setPendingMembersCount(pendingMembers.length);
    setMembersCount(members.length);
    setLoading(false);
  }, [houseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return {
    loading,
    balance,
    pendingBillsCount,
    pendingBillsAmount,
    pendingMembersCount,
    membersCount,
    refresh: load,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Bill, Period, PeriodMember } from "./types";
import { shiftMonth } from "./format";

interface UsePeriodDataResult {
  loading: boolean;
  period: Period | null;
  members: PeriodMember[];
  bills: Bill[];
  refresh: () => Promise<void>;
}

/**
 * Trae (o crea) el periodo de una casa para un mes puntual.
 * Si el periodo no existe todavia, lo crea copiando los integrantes
 * del mes anterior (con fraccion 1 y "pagado" en false) para que no
 * haya que cargar todo de nuevo cada mes. Si el mes anterior no tiene
 * datos, el periodo arranca sin integrantes.
 */
export function usePeriodData(
  houseId: string | undefined,
  monthKey: string
): UsePeriodDataResult {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period | null>(null);
  const [members, setMembers] = useState<PeriodMember[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const load = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("periods")
      .select("*")
      .eq("house_id", houseId)
      .eq("month", monthKey)
      .maybeSingle();

    let currentPeriod = existing as Period | null;

    if (!currentPeriod) {
      const prevMonth = shiftMonth(monthKey, -1);
      const { data: prevPeriod } = await supabase
        .from("periods")
        .select("*")
        .eq("house_id", houseId)
        .eq("month", prevMonth)
        .maybeSingle();

      const { data: created, error: createError } = await supabase
        .from("periods")
        .insert({
          house_id: houseId,
          month: monthKey,
          funding_mode: prevPeriod?.funding_mode ?? "exacto",
          fixed_amount: prevPeriod?.fixed_amount ?? null,
        })
        .select("*")
        .single();

      if (!createError && created) {
        currentPeriod = created as Period;

        if (prevPeriod) {
          const { data: prevMembers } = await supabase
            .from("period_members")
            .select("*")
            .eq("period_id", prevPeriod.id);

          if (prevMembers && prevMembers.length > 0) {
            const rows = prevMembers.map((m: PeriodMember) => ({
              period_id: currentPeriod!.id,
              name: m.name,
              fraction: 1,
              override_amount: null,
              paid: false,
            }));
            await supabase.from("period_members").insert(rows);
          }
        }
      }
    }

    if (currentPeriod) {
      const [{ data: membersData }, { data: billsData }] = await Promise.all([
        supabase
          .from("period_members")
          .select("*")
          .eq("period_id", currentPeriod.id)
          .order("name", { ascending: true }),
        supabase
          .from("bills")
          .select("*")
          .eq("period_id", currentPeriod.id)
          .order("due_date", { ascending: true }),
      ]);
      setMembers((membersData as PeriodMember[]) ?? []);
      setBills((billsData as Bill[]) ?? []);
    }

    setPeriod(currentPeriod);
    setLoading(false);
  }, [houseId, monthKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { loading, period, members, bills, refresh: load };
}

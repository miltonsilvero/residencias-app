"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Bill, Period, PeriodMember } from "./types";
import { shiftMonth } from "./format";

/**
 * Busca el periodo de una casa para un mes puntual. Si no existe, lo crea
 * copiando los integrantes del mes anterior (con 4/4 semanas y "pagado" en
 * false) para no tener que cargar todo de nuevo cada mes. Reutilizable
 * desde cualquier parte de la app (no solo desde la vista de un mes), por
 * ejemplo al cargar una factura para un mes que todavía no se abrió.
 */
export async function ensurePeriod(
  houseId: string,
  monthKey: string
): Promise<Period | null> {
  const { data: existing } = await supabase
    .from("periods")
    .select("*")
    .eq("house_id", houseId)
    .eq("month", monthKey)
    .maybeSingle();

  if (existing) return existing as Period;

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

  if (createError || !created) return null;

  const currentPeriod = created as Period;

  if (prevPeriod) {
    const { data: prevMembers } = await supabase
      .from("period_members")
      .select("*")
      .eq("period_id", prevPeriod.id);

    if (prevMembers && prevMembers.length > 0) {
      const rows = prevMembers.map((m: PeriodMember) => ({
        period_id: currentPeriod.id,
        name: m.name,
        fraction: 1,
        override_amount: null,
        paid: false,
      }));
      await supabase.from("period_members").insert(rows);
    }
  }

  return currentPeriod;
}

interface UsePeriodDataResult {
  loading: boolean;
  period: Period | null;
  members: PeriodMember[];
  bills: Bill[];
  refresh: () => Promise<void>;
}

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

    const currentPeriod = await ensurePeriod(houseId, monthKey);

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

import { Bill, FundingMode, PeriodMember } from "./types";

/**
 * Calcula cuanto le corresponde aportar a cada integrante del periodo.
 *
 * - Modo "fijo": cada persona pone un monto fijo (ingresado por la casa),
 *   prorrateado por la fraccion del mes que le corresponde (por si entro
 *   o se fue a mitad de mes). Ej: fijo 20000, fraccion 0.5 => 10000.
 * - Modo "exacto": se reparte el total de las facturas del mes en
 *   proporcion a la fraccion de cada persona, para que la suma de los
 *   aportes cubra exactamente el total facturado.
 *
 * En ambos casos, si hay un "override_amount" cargado a mano para esa
 * persona, ese valor manda por sobre el calculo automatico.
 */
export function computeShare(
  member: PeriodMember,
  mode: FundingMode,
  fixedAmount: number | null,
  totalFractions: number,
  totalBillsAmount: number
): number {
  if (member.override_amount !== null && member.override_amount !== undefined) {
    return member.override_amount;
  }
  if (mode === "fijo") {
    return (fixedAmount || 0) * member.fraction;
  }
  // modo exacto
  if (totalFractions <= 0) return 0;
  return (member.fraction / totalFractions) * totalBillsAmount;
}

export function totalFractions(members: PeriodMember[]): number {
  return members.reduce((acc, m) => acc + (m.fraction || 0), 0);
}

export function totalBillsAmount(bills: Bill[]): number {
  return bills.reduce((acc, b) => acc + (b.amount || 0), 0);
}

export function totalPaidBillsAmount(bills: Bill[]): number {
  return bills.filter((b) => b.paid).reduce((acc, b) => acc + (b.amount || 0), 0);
}

export function totalCollected(
  members: PeriodMember[],
  mode: FundingMode,
  fixedAmount: number | null,
  totalBills: number
): number {
  const fractions = totalFractions(members);
  return members
    .filter((m) => m.paid)
    .reduce(
      (acc, m) => acc + computeShare(m, mode, fixedAmount, fractions, totalBills),
      0
    );
}

/** Saldo del fondo comun: lo que se cobro menos lo que ya se pago de facturas. */
export function fundBalance(
  members: PeriodMember[],
  bills: Bill[],
  mode: FundingMode,
  fixedAmount: number | null
): number {
  const totalBills = totalBillsAmount(bills);
  const collected = totalCollected(members, mode, fixedAmount, totalBills);
  const paidOut = totalPaidBillsAmount(bills);
  return collected - paidOut;
}

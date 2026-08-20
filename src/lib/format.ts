export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(monthKey: string): string {
  const d = new Date(monthKey + "T00:00:00");
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(monthKey: string, delta: number): string {
  const d = new Date(monthKey + "T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export const BIMESTRES = [
  { index: 1, label: "Enero - Febrero", startMonth: 1 },
  { index: 2, label: "Marzo - Abril", startMonth: 3 },
  { index: 3, label: "Mayo - Junio", startMonth: 5 },
  { index: 4, label: "Julio - Agosto", startMonth: 7 },
  { index: 5, label: "Septiembre - Octubre", startMonth: 9 },
  { index: 6, label: "Noviembre - Diciembre", startMonth: 11 },
] as const;

/** Dado un bimestre (1 a 6), un año y una cuota (1 o 2), arma la key del mes al que corresponde. */
export function monthKeyFromBimestre(
  bimestreIndex: number,
  year: number,
  cuota: 1 | 2
): string {
  const bimestre = BIMESTRES.find((b) => b.index === bimestreIndex) ?? BIMESTRES[0];
  const month = bimestre.startMonth + (cuota - 1);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function bimestreLabel(bimestreIndex: number, year: number, cuota: 1 | 2): string {
  const bimestre = BIMESTRES.find((b) => b.index === bimestreIndex) ?? BIMESTRES[0];
  return `Bimestre ${bimestre.label} ${year} · cuota ${cuota}`;
}

/** Convierte una cantidad de semanas (1 a 4) a fraccion del mes (0.25 a 1). */
export function weeksToFraction(weeks: number): number {
  const clamped = Math.max(1, Math.min(4, Math.round(weeks)));
  return clamped / 4;
}

/** Convierte una fraccion del mes (0 a 1) a la cantidad de semanas (1 a 4) mas cercana, para mostrar en el selector. */
export function fractionToWeeks(fraction: number): number {
  const weeks = Math.round((fraction || 0) * 4);
  return Math.max(1, Math.min(4, weeks || 4));
}

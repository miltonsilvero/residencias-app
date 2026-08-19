export type Role = "admin" | "house";

export interface Account {
  id: string;
  username: string;
  password: string;
  role: Role;
  display_name: string;
  created_at: string;
}

export type FundingMode = "fijo" | "exacto";

export interface Period {
  id: string;
  house_id: string;
  month: string; // "YYYY-MM-01"
  funding_mode: FundingMode;
  fixed_amount: number | null;
  created_at: string;
}

export interface PeriodMember {
  id: string;
  period_id: string;
  name: string;
  fraction: number; // 0 a 1: proporcion del mes que corresponde pagar
  override_amount: number | null;
  paid: boolean;
  paid_at: string | null;
}

export type BillType = "mensual" | "bimestral";

export interface Bill {
  id: string;
  house_id: string;
  period_id: string;
  service_name: string;
  type: BillType;
  period_label: string;
  due_date: string | null;
  amount: number;
  file_url: string | null;
  file_name: string | null;
  paid: boolean;
  paid_at: string | null;
  created_by: string;
  created_at: string;
}

export interface SessionAccount {
  id: string;
  username: string;
  role: Role;
  display_name: string;
}

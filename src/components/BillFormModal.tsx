"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ensurePeriod } from "@/lib/usePeriodData";
import { BillType } from "@/lib/types";
import {
  BIMESTRES,
  bimestreLabel,
  monthKeyFromBimestre,
  monthLabel,
} from "@/lib/format";

function currentMonthInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BillFormModal({
  houseId,
  createdBy,
  defaultMonthKey,
  onClose,
  onCreated,
}: {
  houseId: string;
  createdBy: string;
  /** Mes sugerido por defecto (ej. el mes que se está viendo). Opcional. */
  defaultMonthKey?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceName, setServiceName] = useState("");
  const [type, setType] = useState<BillType>("mensual");

  const [monthInput, setMonthInput] = useState(
    defaultMonthKey ? defaultMonthKey.slice(0, 7) : currentMonthInputValue()
  );
  const [bimestreIndex, setBimestreIndex] = useState(1);
  const [bimestreYear, setBimestreYear] = useState(new Date().getFullYear());
  const [cuota, setCuota] = useState<1 | 2>(1);

  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const targetMonthKey =
    type === "mensual"
      ? `${monthInput}-01`
      : monthKeyFromBimestre(bimestreIndex, bimestreYear, cuota);

  const targetLabel =
    type === "mensual"
      ? monthLabel(targetMonthKey)
      : bimestreLabel(bimestreIndex, bimestreYear, cuota);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!serviceName.trim() || !amount) {
      setError("Completá al menos el servicio y el monto.");
      return;
    }

    setSaving(true);

    const period = await ensurePeriod(houseId, targetMonthKey);
    if (!period) {
      setSaving(false);
      setError("No se pudo abrir el mes de destino. Probá de nuevo.");
      return;
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      // eslint-disable-next-line react-hooks/purity -- se ejecuta en un submit, no en el render
      const path = `${houseId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("facturas")
        .upload(path, file);

      if (uploadError) {
        setSaving(false);
        setError("No se pudo subir el archivo: " + uploadError.message);
        return;
      }
      const { data: publicUrl } = supabase.storage
        .from("facturas")
        .getPublicUrl(path);
      fileUrl = publicUrl.publicUrl;
      fileName = file.name;
    }

    const { error: insertError } = await supabase.from("bills").insert({
      house_id: houseId,
      period_id: period.id,
      service_name: serviceName.trim(),
      type,
      period_label: targetLabel,
      due_date: dueDate || null,
      amount: Number(amount),
      file_url: fileUrl,
      file_name: fileName,
      paid: false,
      created_by: createdBy,
    });

    setSaving(false);

    if (insertError) {
      setError("No se pudo guardar la factura: " + insertError.message);
      return;
    }

    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-paper)] p-6 shadow-lg">
        <h3 className="font-display mb-4 text-lg font-semibold text-[var(--color-ink)]">
          Nueva factura
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Servicio</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              placeholder="Luz, gas, internet..."
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Frecuencia</label>
            <div className="flex rounded-lg border border-[var(--color-line)] p-1 text-sm">
              <button
                type="button"
                onClick={() => setType("mensual")}
                className={`flex-1 rounded-md px-3 py-1.5 ${
                  type === "mensual"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-ink-soft)]"
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setType("bimestral")}
                className={`flex-1 rounded-md px-3 py-1.5 ${
                  type === "bimestral"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-ink-soft)]"
                }`}
              >
                Bimestral
              </button>
            </div>
          </div>

          {type === "mensual" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Mes al que corresponde</label>
              <input
                type="month"
                value={monthInput}
                onChange={(e) => setMonthInput(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Bimestre</label>
                <select
                  value={bimestreIndex}
                  onChange={(e) => setBimestreIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                >
                  {BIMESTRES.map((b) => (
                    <option key={b.index} value={b.index}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Año</label>
                <input
                  type="number"
                  value={bimestreYear}
                  onChange={(e) => setBimestreYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-sm font-medium">Cuota</label>
                <div className="flex rounded-lg border border-[var(--color-line)] p-1 text-sm">
                  {([1, 2] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCuota(c)}
                      className={`flex-1 rounded-md px-3 py-1.5 ${
                        cuota === c
                          ? "bg-[var(--color-accent)] text-white"
                          : "text-[var(--color-ink-soft)]"
                      }`}
                    >
                      Cuota {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
            Se va a guardar en <strong>{monthLabel(targetMonthKey)}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Vencimiento</label>
              <input
                type="date"
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Monto ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Foto o archivo de la factura{" "}
              <span className="font-normal text-[var(--color-ink-soft)]">
                (opcional)
              </span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BillType } from "@/lib/types";

export function BillFormModal({
  periodId,
  houseId,
  createdBy,
  onClose,
  onCreated,
}: {
  periodId: string;
  houseId: string;
  createdBy: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceName, setServiceName] = useState("");
  const [type, setType] = useState<BillType>("mensual");
  const [periodLabel, setPeriodLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!serviceName.trim() || !amount) {
      setError("Completá al menos el servicio y el monto.");
      return;
    }

    setSaving(true);

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
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
      period_id: periodId,
      service_name: serviceName.trim(),
      type,
      period_label: periodLabel.trim() || null,
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
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              placeholder="Luz, gas, internet..."
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Frecuencia</label>
              <select
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                value={type}
                onChange={(e) => setType(e.target.value as BillType)}
              >
                <option value="mensual">Mensual</option>
                <option value="bimestral">Bimestral</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Vencimiento</label>
              <input
                type="date"
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Período que cubre{" "}
              <span className="font-normal text-[var(--color-ink-soft)]">
                (ej. &quot;jul-ago&quot;)
              </span>
            </label>
            <input
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
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

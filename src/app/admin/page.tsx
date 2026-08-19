"use client";

import { useEffect, useState } from "react";
import { useGuard } from "@/components/Guard";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { Account } from "@/lib/types";

export default function AdminPage() {
  const session = useGuard("admin");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("role", { ascending: true })
      .order("display_name", { ascending: true });
    setAccounts((data as Account[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadAccounts();
  }, [session]);

  if (!session) return null;

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      setError("Completá usuario, contraseña y nombre para mostrar.");
      return;
    }
    setCreating(true);
    const { error: insertError } = await supabase.from("accounts").insert({
      username: username.trim().toLowerCase(),
      password: password.trim(),
      display_name: displayName.trim(),
      role: "house",
    });
    setCreating(false);
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ese usuario ya existe."
          : "No se pudo crear la cuenta: " + insertError.message
      );
      return;
    }
    setUsername("");
    setPassword("");
    setDisplayName("");
    loadAccounts();
  }

  async function deleteAccount(account: Account) {
    if (
      !confirm(
        `¿Eliminar la cuenta "${account.display_name}" y todo su historial? Esta acción no se puede deshacer.`
      )
    )
      return;
    setBusyId(account.id);
    await supabase.from("accounts").delete().eq("id", account.id);
    setBusyId(null);
    loadAccounts();
  }

  async function resetAccount(account: Account) {
    if (
      !confirm(
        `¿Borrar todos los meses, facturas e integrantes de "${account.display_name}"? La cuenta y las claves se mantienen.`
      )
    )
      return;
    setBusyId(account.id);
    await supabase.from("periods").delete().eq("house_id", account.id);
    setBusyId(null);
    loadAccounts();
  }

  const houses = accounts.filter((a) => a.role === "house");
  const admins = accounts.filter((a) => a.role === "admin");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header session={session} />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-[var(--color-ink)]">
            Nueva cuenta de casa
          </h2>
          <form
            onSubmit={createAccount}
            className="space-y-3 rounded-2xl bg-[var(--color-paper)] p-5 ring-1 ring-[var(--color-line)]"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                placeholder="usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
              <input
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
              <input
                placeholder="nombre para mostrar"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display mb-4 text-xl font-semibold text-[var(--color-ink)]">
            Casas
          </h2>
          {loading ? (
            <p className="text-[var(--color-ink-soft)]">Cargando...</p>
          ) : houses.length === 0 ? (
            <p className="text-[var(--color-ink-soft)]">Todavía no hay casas cargadas.</p>
          ) : (
            <div className="space-y-2">
              {houses.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{a.display_name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      usuario: {a.username} · contraseña: {a.password}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === a.id}
                      onClick={() => resetAccount(a)}
                      className="rounded-lg border border-[var(--color-amber)] px-3 py-1.5 text-sm text-[var(--color-amber)] hover:bg-[var(--color-amber-soft)]"
                    >
                      Resetear registros
                    </button>
                    <button
                      disabled={busyId === a.id}
                      onClick={() => deleteAccount(a)}
                      className="rounded-lg border border-[var(--color-danger)] px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                    >
                      Eliminar cuenta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {admins.length > 0 && (
          <section>
            <h2 className="font-display mb-4 text-xl font-semibold text-[var(--color-ink)]">
              Administradores
            </h2>
            <div className="space-y-2">
              {admins.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3"
                >
                  <p className="font-medium text-[var(--color-ink)]">{a.display_name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">usuario: {a.username}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

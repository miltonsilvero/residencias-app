"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { saveSession } from "@/lib/session";
import { homeForRole } from "@/components/Guard";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from("accounts")
      .select("*")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle();

    setLoading(false);

    if (dbError) {
      console.error("Error de Supabase al hacer login:", dbError);
      setError(
        `No se pudo conectar con la base de datos (${dbError.message}).`
      );
      return;
    }
    if (!data || data.password !== password) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    saveSession({
      id: data.id,
      username: data.username,
      role: data.role,
      display_name: data.display_name,
    });

    router.replace(homeForRole(data.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            Residencias
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
            Casas de América del Sur
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[var(--color-paper)] p-8 shadow-sm ring-1 ring-[var(--color-line)]"
        >
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Usuario
            </label>
            <input
              autoFocus
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="rayuela"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          Acceso compartido por casa. Pedile las claves a tu administrador.
        </p>
      </div>
    </main>
  );
}

import { SessionAccount } from "./types";

const KEY = "residencias_session";

export function saveSession(account: SessionAccount) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(account));
}

export function getSession(): SessionAccount | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionAccount;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

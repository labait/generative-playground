import { useCallback, useEffect, useState } from "react";
import { apiFetch, readJson } from "../lib/api.js";

export function AdminPanel({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [u, s] = await Promise.all([apiFetch("/api/admin/users"), apiFetch("/api/admin/stats")]);
    const uj = await readJson(u);
    const sj = await readJson(s);
    if (!u.ok) setError("Impossibile caricare utenti");
    else setUsers(uj.users || []);
    if (s.ok) setStats(sj);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const updateQuota = async (id, standard_monthly, hires_monthly) => {
    const res = await apiFetch(`/api/admin/users/${id}/quota`, {
      method: "PUT",
      body: JSON.stringify({ standard_monthly, hires_monthly }),
    });
    if (res.ok) load();
  };

  const resetMonth = async (id) => {
    const res = await apiFetch(`/api/admin/users/${id}/reset`, { method: "POST" });
    if (res.ok) load();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="mt-8 w-full max-w-5xl rounded-2xl border border-laba-border bg-laba-bg p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Admin</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-400 hover:text-white">
            Chiudi
          </button>
        </div>
        {stats && (
          <div className="mb-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
            <div className="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
              Utenti: <strong className="text-white">{stats.totalUsers}</strong>
            </div>
            <div className="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
              Standard (mese): <strong className="text-white">{stats.standardUsedSum}</strong>
            </div>
            <div className="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
              Hi‑res (mese): <strong className="text-white">{stats.hiresUsedSum}</strong>
            </div>
          </div>
        )}
        {loading && <p className="text-sm text-zinc-500">Caricamento…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-laba-border text-zinc-500">
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Ruolo</th>
                <th className="py-2 pr-2">Standard</th>
                <th className="py-2 pr-2">Hi‑res</th>
                <th className="py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-laba-border/60">
                  <td className="py-2 pr-2 text-zinc-200">{u.email}</td>
                  <td className="py-2 pr-2">{u.role}</td>
                  <td className="py-2 pr-2">
                    {u.standard_used ?? 0} / {u.standard_monthly ?? "—"}
                  </td>
                  <td className="py-2 pr-2">
                    {u.hires_used ?? 0} / {u.hires_monthly ?? "—"}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="mr-2 text-laba-accent hover:underline"
                      onClick={() => {
                        const sm = window.prompt("Standard mensile", String(u.standard_monthly ?? 200));
                        const hm = window.prompt("Hi‑res mensile", String(u.hires_monthly ?? 20));
                        if (sm != null && hm != null) updateQuota(u.id, Number(sm), Number(hm));
                      }}
                    >
                      Quota
                    </button>
                    <button
                      type="button"
                      className="text-zinc-400 hover:underline"
                      onClick={() => resetMonth(u.id)}
                    >
                      Reset mese
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

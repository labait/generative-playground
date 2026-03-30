export function QuotaBar({ quota, loading }) {
  if (loading || !quota) {
    return (
      <div className="h-10 animate-pulse rounded-lg bg-zinc-800/60 px-4 py-2 text-xs text-zinc-500">
        Carico quota…
      </div>
    );
  }
  if (quota.unlimited) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
        Admin · quota illimitata
      </div>
    );
  }
  const s = quota.standard;
  const h = quota.hires;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-laba-border bg-laba-surface px-4 py-2 text-xs text-zinc-200">
      <span>
        Standard:{" "}
        <strong className="text-white">
          {s.used}/{s.total}
        </strong>{" "}
        (restano {s.remaining})
      </span>
      <span className="text-zinc-600">|</span>
      <span>
        Hi‑res:{" "}
        <strong className="text-white">
          {h.used}/{h.total}
        </strong>{" "}
        (restano {h.remaining})
      </span>
      {quota.resetDate && (
        <>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">Reset: {quota.resetDate}</span>
        </>
      )}
    </div>
  );
}

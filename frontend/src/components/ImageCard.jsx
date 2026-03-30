export function ImageCard({ job, onUpscale, onVary, onOpen, onDelete }) {
  const busy = job.status === "pending" || job.status === "processing";

  const copyPrompt = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(job.prompt || "");
  };

  const download = (e) => {
    e.stopPropagation();
    if (!job.imageUrl) return;
    const a = document.createElement("a");
    a.href = job.imageUrl;
    a.download = `laba-${job.jobId}.webp`;
    a.click();
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-laba-border bg-laba-surface">
      <div className="aspect-square w-full overflow-hidden bg-zinc-900">
        {busy && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-laba-accent border-t-transparent" />
            <div className="h-2 w-3/4 animate-shimmer rounded-full" />
            <p className="text-xs text-zinc-400">
              {job.status === "pending" ? "In coda…" : "Generazione…"}
            </p>
          </div>
        )}
        {!busy && job.status === "failed" && (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-red-300">
            {job.error || "Errore"}
          </div>
        )}
        {!busy && job.status === "succeeded" && job.imageUrl && (
          <button type="button" onClick={() => onOpen(job)} className="block h-full w-full">
            <img src={job.imageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
          </button>
        )}
      </div>

      {/* Hover overlay with actions */}
      <div
        className="pointer-events-none absolute inset-0 cursor-pointer bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
        onClick={() => onOpen(job)}
        role="presentation"
      >
        <div className="absolute bottom-0 left-0 right-0 p-3" onClick={(e) => e.stopPropagation()}>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-100">{job.prompt}</p>
          {job.status === "succeeded" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={download}
                className="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
              >
                Scarica
              </button>
              <button
                type="button"
                onClick={copyPrompt}
                className="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
              >
                Copia prompt
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpscale(job.jobId); }}
                className="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
              >
                Upscale
              </button>
              {job.model !== "upscale" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onVary(job); }}
                  className="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
                >
                  Variazione
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top bar: model badge + delete */}
      {job.status === "succeeded" && (
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
          {job.model && (
            <div className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
              {job.model === "schnell" ? "Schnell" : job.model === "dev" ? "Dev" : "Upscale"}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Eliminare questa immagine definitivamente?")) {
                onDelete(job.jobId);
              }
            }}
            className="pointer-events-auto rounded-md bg-black/50 p-1.5 text-zinc-400 backdrop-blur-sm transition hover:bg-red-600/80 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function ModeToggle({ mode, onChange, disabled }) {
  return (
    <div className="inline-flex rounded-lg border border-laba-border bg-laba-bg p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("relax")}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
          mode === "relax"
            ? "bg-laba-accent text-white shadow"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Relax
        <span className={`ml-1.5 text-[10px] font-normal ${mode === "relax" ? "text-violet-200" : "text-zinc-600"}`}>
          Schnell
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("fast")}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
          mode === "fast"
            ? "bg-laba-accent text-white shadow"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Quality
        <span className={`ml-1.5 text-[10px] font-normal ${mode === "fast" ? "text-violet-200" : "text-zinc-600"}`}>
          Dev
        </span>
      </button>
    </div>
  );
}

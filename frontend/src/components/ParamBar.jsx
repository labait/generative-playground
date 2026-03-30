const RATIOS = [
  { value: "1:1", label: "1:1", icon: "□" },
  { value: "3:2", label: "3:2", icon: "▬" },
  { value: "2:3", label: "2:3", icon: "▮" },
  { value: "16:9", label: "16:9", icon: "━" },
  { value: "9:16", label: "9:16", icon: "┃" },
  { value: "4:3", label: "4:3", icon: "▭" },
  { value: "3:4", label: "3:4", icon: "▯" },
];

const STYLES = [
  { value: "none", label: "Nessuno", desc: "Output naturale", color: "from-zinc-600 to-zinc-700" },
  { value: "photorealistic", label: "Foto", desc: "Fotorealistico", color: "from-blue-600 to-cyan-700" },
  { value: "cinematic", label: "Cinema", desc: "Cinematografico", color: "from-amber-700 to-orange-800" },
  { value: "illustration", label: "Illustrazione", desc: "Digitale", color: "from-pink-600 to-rose-700" },
  { value: "watercolor", label: "Acquerello", desc: "Pittura ad acqua", color: "from-teal-600 to-emerald-700" },
  { value: "oil-painting", label: "Olio", desc: "Pittura a olio", color: "from-yellow-700 to-amber-800" },
  { value: "anime", label: "Anime", desc: "Stile giapponese", color: "from-fuchsia-600 to-purple-700" },
  { value: "3d-render", label: "3D", desc: "Render 3D", color: "from-indigo-600 to-blue-700" },
  { value: "pixel-art", label: "Pixel", desc: "Retro 8-bit", color: "from-green-600 to-lime-700" },
  { value: "sketch", label: "Schizzo", desc: "Matita su carta", color: "from-stone-500 to-stone-600" },
  { value: "minimal", label: "Minimal", desc: "Composizione pulita", color: "from-slate-500 to-slate-600" },
];

export function ParamBar({
  aspectRatio,
  onAspectRatio,
  style,
  onStyle,
  guidance,
  onGuidance,
  seed,
  onSeed,
  negativePrompt,
  onNegativePrompt,
  showAdvanced,
  onToggleAdvanced,
  mode,
}) {
  return (
    <div className="space-y-5">
      {/* Aspect Ratio - visual chips */}
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Formato
        </span>
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onAspectRatio(r.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                aspectRatio === r.value
                  ? "bg-laba-accent text-white shadow-md shadow-violet-900/30"
                  : "border border-laba-border bg-laba-bg/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span className="text-[10px] opacity-60">{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style - horizontal scroll cards */}
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Stile
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyle(s.value)}
              className={`flex-none rounded-xl px-4 py-2.5 text-left transition ${
                style === s.value
                  ? `bg-gradient-to-br ${s.color} ring-2 ring-white/30 text-white shadow-lg`
                  : `bg-gradient-to-br ${s.color} opacity-40 text-white hover:opacity-70`
              }`}
            >
              <span className="block text-xs font-semibold">{s.label}</span>
              <span className="block text-[10px] text-white/70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
      >
        <svg
          className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Impostazioni avanzate
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-xl border border-laba-border/60 bg-laba-bg/40 p-4">
          <label className="block text-sm">
            <span className="text-zinc-300">Negative prompt</span>
            <textarea
              value={negativePrompt}
              onChange={(e) => onNegativePrompt(e.target.value)}
              placeholder="Elementi da evitare nell'immagine…"
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-laba-border bg-laba-bg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
            />
          </label>
          {mode === "fast" && (
            <label className="block text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Guidance</span>
                <span className="text-xs font-mono text-zinc-500">{guidance}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={guidance}
                onChange={(e) => onGuidance(Number(e.target.value))}
                className="mt-2 w-full accent-laba-accent"
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>Creativo</span>
                <span>Fedele al prompt</span>
              </div>
            </label>
          )}
          <label className="block text-sm">
            <span className="text-zinc-300">Seed</span>
            <input
              type="number"
              min={0}
              value={seed || ""}
              onChange={(e) => onSeed(e.target.value ? Number(e.target.value) : null)}
              placeholder="Casuale"
              className="mt-1 w-full rounded-lg border border-laba-border bg-laba-bg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
            />
          </label>
        </div>
      )}
    </div>
  );
}

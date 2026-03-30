import { useCallback, useState } from "react";
import { ModeToggle } from "./ModeToggle.jsx";
import { ParamBar } from "./ParamBar.jsx";

export function PromptBox({ onGenerate, busy }) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [mode, setMode] = useState("relax");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("none");
  const [guidance, setGuidance] = useState(3.5);
  const [seed, setSeed] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const submit = useCallback(() => {
    const model = mode === "fast" ? "dev" : "schnell";
    onGenerate({
      prompt,
      negative_prompt: negativePrompt,
      model,
      aspect_ratio: aspectRatio,
      style,
      guidance,
      seed,
    });
  }, [prompt, negativePrompt, mode, aspectRatio, style, guidance, seed, onGenerate]);

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!busy && prompt.trim()) submit();
    }
  };

  return (
    <div className="rounded-2xl border border-laba-border bg-laba-surface/80 p-5 shadow-xl backdrop-blur sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-white">Crea immagine</h2>
        <ModeToggle mode={mode} onChange={setMode} disabled={busy} />
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Descrivi l'immagine che vuoi creare…"
        rows={3}
        className="mb-4 w-full resize-none rounded-xl border border-laba-border bg-laba-bg px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
      />

      <ParamBar
        aspectRatio={aspectRatio}
        onAspectRatio={setAspectRatio}
        style={style}
        onStyle={setStyle}
        guidance={guidance}
        onGuidance={setGuidance}
        seed={seed}
        onSeed={setSeed}
        negativePrompt={negativePrompt}
        onNegativePrompt={setNegativePrompt}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        mode={mode}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden text-xs text-zinc-500 sm:block">
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            ⌘ Enter
          </kbd>{" "}
          per generare
        </p>
        <button
          type="button"
          disabled={busy || !prompt.trim()}
          onClick={submit}
          className="ml-auto rounded-xl bg-laba-accent px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Generazione…" : "Genera"}
        </button>
      </div>
    </div>
  );
}

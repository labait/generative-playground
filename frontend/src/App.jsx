import { useCallback, useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useGenerate } from "./hooks/useGenerate.js";
import { useQuota } from "./hooks/useQuota.js";
import { PromptBox } from "./components/PromptBox.jsx";
import { Gallery } from "./components/Gallery.jsx";
import { QuotaBar } from "./components/QuotaBar.jsx";
import { ImageModal } from "./components/ImageModal.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const { quota, loading: quotaLoading, refresh: refreshQuota } = useQuota(!!user);
  const { jobs, generateImage, upscaleJob, deleteJob } = useGenerate(refreshQuota);
  const [busy, setBusy] = useState(false);
  const [modalJob, setModalJob] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [banner, setBanner] = useState(null);

  const onGenerate = useCallback(
    async (params) => {
      setBusy(true);
      setBanner(null);
      try {
        await generateImage(params);
      } catch (e) {
        setBanner(e.message === "quota_exceeded" ? "Quota mensile superata." : "Generazione non riuscita.");
      } finally {
        setBusy(false);
      }
    },
    [generateImage]
  );

  const onUpscale = useCallback(
    async (jobId) => {
      setBusy(true);
      setBanner(null);
      try {
        await upscaleJob(jobId);
      } catch (e) {
        setBanner(e.message === "quota_exceeded" ? "Quota mensile superata." : "Upscale non riuscito.");
      } finally {
        setBusy(false);
      }
    },
    [upscaleJob]
  );

  const onVary = useCallback(
    async (job) => {
      if (job.model === "upscale") return;
      const base = job.params || {};
      const p = base.prompt || job.prompt;
      setBusy(true);
      setBanner(null);
      try {
        await generateImage({
          ...base,
          prompt: `${p}, variante ${Date.now()}`,
        });
      } catch (e) {
        setBanner(e.message === "quota_exceeded" ? "Quota mensile superata." : "Variazione non riuscita.");
      } finally {
        setBusy(false);
      }
    },
    [generateImage]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Caricamento…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">LABA AI Studio</h1>
          <p className="mt-3 max-w-md text-sm text-zinc-400">
            Generazione immagini per studenti LABA. Accedi con il tuo account Microsoft istituzionale.
          </p>
        </div>
        <button
          type="button"
          onClick={login}
          className="rounded-xl bg-laba-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:brightness-110"
        >
          Accedi con Microsoft
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-laba-border bg-laba-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">LABA AI Studio</h1>
            <p className="text-xs text-zinc-400">
              {user.displayName || user.email} · {user.role}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <QuotaBar quota={quota} loading={quotaLoading} />
            {user.role === "admin" && (
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="rounded-lg border border-laba-border px-3 py-2 text-xs text-zinc-300 hover:bg-laba-surface"
              >
                Admin
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-laba-border px-3 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {banner && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {banner}
          </div>
        )}
        <PromptBox onGenerate={onGenerate} busy={busy} />
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Galleria</h2>
          <Gallery jobs={jobs} onUpscale={onUpscale} onVary={onVary} onOpen={setModalJob} onDelete={deleteJob} />
        </section>
      </main>

      <ImageModal job={modalJob} onClose={() => setModalJob(null)} />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}

import { ImageCard } from "./ImageCard.jsx";

export function Gallery({ jobs, onUpscale, onVary, onOpen, onDelete }) {
  if (!jobs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-laba-border bg-laba-surface/40 p-12 text-center text-sm text-zinc-500">
        Nessuna immagine ancora. Scrivi un prompt e premi Genera.
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <ImageCard key={job.jobId} job={job} onUpscale={onUpscale} onVary={onVary} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  );
}

import { useEffect } from "react";

export function ImageModal({ job, onClose }) {
  useEffect(() => {
    if (!job?.imageUrl) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [job, onClose]);

  if (!job?.imageUrl) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 sm:p-12"
      onClick={onClose}
      role="presentation"
    >
      <img
        src={job.imageUrl}
        alt={job.prompt}
        className="max-h-[calc(100vh-6rem)] max-w-[calc(100vw-3rem)] sm:max-h-[calc(100vh-10rem)] sm:max-w-[calc(100vw-6rem)] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 backdrop-blur-sm"
      >
        Chiudi
      </button>
    </div>
  );
}

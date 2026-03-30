import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, readJson } from "../lib/api.js";

const POLL_MS = 2000;
const TIMEOUT_MS = 300000;

export function useGenerate(onQuotaRefresh) {
  const [jobs, setJobs] = useState([]);
  const timers = useRef(new Map());
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const res = await apiFetch("/api/jobs");
        const data = await readJson(res);
        if (res.ok && data.jobs) {
          setJobs((prev) => {
            const existingIds = new Set(prev.map((j) => j.jobId));
            const past = data.jobs.filter((j) => !existingIds.has(j.jobId));
            return [...prev, ...past];
          });
        }
      } catch {}
    })();
  }, []);

  const pollJob = useCallback(
    (jobId) => {
      const started = Date.now();
      const tick = async () => {
        if (Date.now() - started > TIMEOUT_MS) {
          setJobs((prev) =>
            prev.map((j) =>
              j.jobId === jobId ? { ...j, status: "failed", error: "timeout" } : j
            )
          );
          timers.current.delete(jobId);
          return;
        }
        const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
        const data = await readJson(res);
        if (!res.ok) {
          setJobs((prev) =>
            prev.map((j) =>
              j.jobId === jobId ? { ...j, status: "failed", error: "poll_error" } : j
            )
          );
          timers.current.delete(jobId);
          return;
        }
        setJobs((prev) =>
          prev.map((j) =>
            j.jobId === jobId
              ? {
                  ...j,
                  status: data.status,
                  imageUrl: data.imageUrl || j.imageUrl,
                  error: data.error || null,
                }
              : j
          )
        );
        if (data.status === "succeeded" || data.status === "failed") {
          timers.current.delete(jobId);
          if (data.status === "succeeded" && onQuotaRefresh) onQuotaRefresh();
          return;
        }
        timers.current.set(jobId, setTimeout(tick, POLL_MS));
      };
      tick();
    },
    [onQuotaRefresh]
  );

  const generateImage = useCallback(
    async (params) => {
      const res = await apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify(params),
      });
      const data = await readJson(res);
      if (res.status === 429) {
        throw new Error("quota_exceeded");
      }
      if (!res.ok) {
        throw new Error(data?.error || "generate_failed");
      }
      const job = {
        jobId: data.jobId,
        status: "pending",
        imageUrl: null,
        prompt: params.prompt,
        params,
        model: params.model,
      };
      setJobs((prev) => [job, ...prev]);
      pollJob(data.jobId);
    },
    [pollJob]
  );

  const upscaleJob = useCallback(
    async (sourceJobId) => {
      const res = await apiFetch("/api/upscale", {
        method: "POST",
        body: JSON.stringify({ jobId: sourceJobId }),
      });
      const data = await readJson(res);
      if (res.status === 429) {
        throw new Error("quota_exceeded");
      }
      if (!res.ok) {
        throw new Error(data?.error || "upscale_failed");
      }
      const job = {
        jobId: data.jobId,
        status: "pending",
        imageUrl: null,
        prompt: `Upscale: ${sourceJobId}`,
        params: { sourceJobId },
        model: "upscale",
      };
      setJobs((prev) => [job, ...prev]);
      pollJob(data.jobId);
    },
    [pollJob]
  );

  const deleteJob = useCallback(async (jobId) => {
    try {
      const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      }
    } catch {}
  }, []);

  return { jobs, generateImage, upscaleJob, deleteJob };
}

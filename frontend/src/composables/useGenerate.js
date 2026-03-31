import { ref, onUnmounted } from "vue";
import { apiFetch, readJson } from "../lib/api.js";

const POLL_MS = 2000;

function sortJobs(list) {
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
const TIMEOUT_MS = 300000;

export function useGenerate(onQuotaRefresh) {
  const jobs = ref([]);
  const timers = new Map();
  let loaded = false;

  // Load existing jobs on init
  if (!loaded) {
    loaded = true;
    (async () => {
      try {
        const res = await apiFetch("/api/jobs");
        const data = await readJson(res);
        if (res.ok && data.jobs) {
          const existingIds = new Set(jobs.value.map((j) => j.jobId));
          const past = data.jobs.filter((j) => !existingIds.has(j.jobId));
          jobs.value = sortJobs([...jobs.value, ...past]);
        }
      } catch {}
    })();
  }

  function pollJob(jobId) {
    const started = Date.now();
    const tick = async () => {
      if (Date.now() - started > TIMEOUT_MS) {
        jobs.value = jobs.value.map((j) =>
          j.jobId === jobId ? { ...j, status: "failed", error: "timeout" } : j
        );
        timers.delete(jobId);
        return;
      }
      const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
      const data = await readJson(res);
      if (!res.ok) {
        jobs.value = jobs.value.map((j) =>
          j.jobId === jobId ? { ...j, status: "failed", error: "poll_error" } : j
        );
        timers.delete(jobId);
        return;
      }
      jobs.value = jobs.value.map((j) =>
        j.jobId === jobId
          ? {
              ...j,
              status: data.status,
              imageUrl: data.imageUrl || j.imageUrl,
              error: data.error || null,
            }
          : j
      );
      if (data.status === "succeeded" || data.status === "failed") {
        timers.delete(jobId);
        if (data.status === "succeeded" && onQuotaRefresh) onQuotaRefresh();
        return;
      }
      timers.set(jobId, setTimeout(tick, POLL_MS));
    };
    tick();
  }

  async function generateImage(params) {
    const res = await apiFetch("/api/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
    const data = await readJson(res);
    if (res.status === 429) {
      const err = data?.error || "quota_exceeded";
      throw new Error(err === "replicate_rate_limited" ? "replicate_rate_limited" : "quota_exceeded");
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
      createdAt: new Date().toISOString(),
    };
    jobs.value = sortJobs([job, ...jobs.value]);
    pollJob(data.jobId);
  }

  async function upscaleJob(sourceJobId) {
    const res = await apiFetch("/api/upscale", {
      method: "POST",
      body: JSON.stringify({ jobId: sourceJobId }),
    });
    const data = await readJson(res);
    if (res.status === 429) {
      const err = data?.error || "quota_exceeded";
      throw new Error(err === "replicate_rate_limited" ? "replicate_rate_limited" : "quota_exceeded");
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
      createdAt: new Date().toISOString(),
    };
    jobs.value = sortJobs([job, ...jobs.value]);
    pollJob(data.jobId);
  }

  async function deleteJob(jobId) {
    try {
      const res = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
      if (res.ok) {
        jobs.value = jobs.value.filter((j) => j.jobId !== jobId);
      }
    } catch {}
  }

  onUnmounted(() => {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  });

  return { jobs, generateImage, upscaleJob, deleteJob };
}

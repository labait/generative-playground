import { useCallback, useEffect, useState } from "react";
import { apiFetch, readJson } from "../lib/api.js";

export function useQuota(enabled) {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const res = await apiFetch("/api/quota/me");
    const data = await readJson(res);
    if (res.ok) setQuota(data);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quota, loading, refresh };
}

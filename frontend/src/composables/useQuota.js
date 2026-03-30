import { ref, watch } from "vue";
import { apiFetch, readJson } from "../lib/api.js";

export function useQuota(enabled) {
  const quota = ref(null);
  const loading = ref(false);

  async function refresh() {
    if (!enabled()) return;
    loading.value = true;
    const res = await apiFetch("/api/quota/me");
    const data = await readJson(res);
    if (res.ok) quota.value = data;
    loading.value = false;
  }

  watch(enabled, (val) => {
    if (val) refresh();
  }, { immediate: true });

  return { quota, loading, refresh };
}

import { ref } from "vue";
import { apiFetch, readJson } from "../lib/api.js";

export function useAuth() {
  const user = ref(null);
  const loading = ref(true);

  async function refresh() {
    const res = await apiFetch("/auth/me");
    const data = await readJson(res);
    if (res.ok && data?.user) {
      user.value = data.user;
    } else {
      user.value = null;
    }
    loading.value = false;
  }

  const login = () => {
    window.location.href = "/auth/login";
  };

  const logout = () => {
    window.location.href = "/auth/logout";
  };

  refresh();

  return { user, loading, refresh, login, logout };
}

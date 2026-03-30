import { useCallback, useEffect, useState } from "react";
import { apiFetch, readJson } from "../lib/api.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await apiFetch("/auth/me");
    const data = await readJson(res);
    if (res.ok && data?.user) {
      setUser(data.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = () => {
    window.location.href = "/auth/login";
  };

  const logout = () => {
    window.location.href = "/auth/logout";
  };

  return { user, loading, refresh, login, logout };
}

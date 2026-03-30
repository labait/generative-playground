export async function apiFetch(path, options = {}) {
  const { headers: userHeaders, ...rest } = options;
  const headers = { ...(userHeaders || {}) };
  if (rest.body && typeof rest.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, {
    credentials: "include",
    ...rest,
    headers,
  });
  return res;
}

export async function readJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

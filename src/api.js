const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers,
    body: options.body
      ? isFormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // allow /me to return null
  if (res.status === 401 && path === "/auth/me") return null;

  // ✅ redirect only when auth expired
  if (res.status === 401) {
    if (data?.msg === "No token" || data?.msg === "Invalid token") {
      window.location.href = "/login";
      return;
    }
  }

  if (!res.ok) {
    throw new Error(
      data?.message || data?.msg || `Request failed (${res.status})`
    );
  }

  return data;
}
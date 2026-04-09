const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  // Build headers
  const headers = {
    ...(options.headers || {}),
  };

  // Only add JSON header if NOT FormData
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include", // send cookies
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
  } catch (err) {
    data = null;
  }

  // Special case for /auth/me
  if (res.status === 401 && path === "/auth/me") return null;

  // Redirect if token invalid
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

// Helpers (axios-like)
api.get = (path, options = {}) =>
  api(path, { ...options, method: "GET" });

api.post = (path, body, options = {}) =>
  api(path, { ...options, method: "POST", body });

api.put = (path, body, options = {}) =>
  api(path, { ...options, method: "PUT", body });

api.delete = (path, options = {}) =>
  api(path, { ...options, method: "DELETE" });

export default api;
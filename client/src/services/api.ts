const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const API_BASE = BASE;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    // let the browser set the multipart boundary for FormData
    headers: options.body instanceof FormData ? options.headers : { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

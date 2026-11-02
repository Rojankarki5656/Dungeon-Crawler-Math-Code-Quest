import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Helpers to unwrap the server's { success, data } envelope
export async function apiGet(path, config) {
  const { data } = await api.get(path, config);
  return data.data;
}
export async function apiPost(path, body, config) {
  const { data } = await api.post(path, body, config);
  return data.data;
}
export async function apiPatch(path, body, config) {
  const { data } = await api.patch(path, body, config);
  return data.data;
}
export function apiError(e) {
  return e?.response?.data?.error?.message || e?.message || "Something went wrong";
}
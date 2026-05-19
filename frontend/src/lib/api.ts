import { useAuthStore } from "./auth-store";
import type { Nudge, Tip, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.token ?? useAuthStore.getState().token;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const details = data?.issues?.length ? `: ${data.issues.map((issue: { path?: string[]; message: string }) => `${issue.path?.join(".") || "field"} ${issue.message}`).join(", ")}` : "";
    throw new Error(`${data?.message ?? "Request failed"}${details}`);
  }
  return data as T;
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    apiRequest<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      token: null,
    }),
  me: () => apiRequest<{ user: User }>("/api/auth/me"),
  feed: (params?: { status?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiRequest<{ tips: Tip[] }>(`/api/tips/feed${suffix}`);
  },
  nudges: () => apiRequest<{ nudges: Nudge[] }>("/api/nudges"),
  createTip: (payload: unknown) =>
    apiRequest<{ tip: Tip }>("/api/tips", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyTip: (id: string, note?: string) =>
    apiRequest<{ tip: Tip }>(`/api/tips/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  disputeTip: (id: string, note?: string) =>
    apiRequest<{ tip: Tip }>(`/api/tips/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  enrichTip: (payload: { title?: string; rawText: string }) =>
    apiRequest<{
      category: string;
      urgency: string;
      deadline: string | null;
      summary: string | null;
      actionSteps: string[];
      audience: string | null;
      sourceConfidence: number;
    }>("/api/ai/enrich-tip", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  ask: (question: string) =>
    apiRequest<{ answer: string; sources: Tip[]; sessionId: string }>("/api/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};

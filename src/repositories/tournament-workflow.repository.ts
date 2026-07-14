import type { Json, MatchMode } from "@/types/database.types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "Le tournoi n’a pas pu être enregistré.");
  return payload.data as T;
}

export class TournamentWorkflowRepository {
  latest() { return request<Record<string, unknown> | null>("/api/tournaments/workflow"); }
  create(input: { name: string; type: "single_elimination" | "round_robin"; gameMode: MatchMode; durationSeconds: number; participants: Json; workflow: Json }) {
    return request<Record<string, unknown>>("/api/tournaments/workflow", { method: "POST", body: JSON.stringify(input) });
  }
  progress(id: string, input: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/tournaments/workflow/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  }
}

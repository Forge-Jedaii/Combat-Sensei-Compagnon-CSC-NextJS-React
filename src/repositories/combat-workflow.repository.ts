import type { Json, MatchFaultRow, MatchParticipantRow, MatchResultType, MatchRow } from "@/types/database.types";

export type PersistedCombat = {
  match: MatchRow;
  participants: MatchParticipantRow[];
  faults?: MatchFaultRow[];
  events?: Array<Record<string, unknown>>;
  unlocked_achievements?: Array<Record<string, unknown>>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "Erreur de persistance du combat.");
  return payload.data as T;
}

export class CombatWorkflowRepository {
  start(input: { clientSessionId: string; mode: string; participants: Array<{ name: string; userId?: string; startingHealth?: number }>; durationSeconds: number; eventName?: string; tournamentId?: string; settings?: Json }) {
    return request<PersistedCombat>("/api/combat-workflow", {
      method: "POST",
      body: JSON.stringify({
        clientSessionId: input.clientSessionId,
        durationSeconds: input.durationSeconds || undefined,
        eventName: input.eventName,
        mode: input.mode,
        participants: input.participants,
        settings: input.settings,
        tournamentId: input.tournamentId,
      }),
    });
  }

  get(matchId: string) {
    return request<PersistedCombat>(`/api/combat-workflow/${matchId}`);
  }

  event(matchId: string, participantId: string, eventType: string, finalHealth: number, payload: Json = {}) {
    return request<MatchParticipantRow>(`/api/combat-workflow/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ action: "event", eventType, finalHealth, participantId, payload }),
    });
  }

  fault(matchId: string, input: { participantId: string; type: "yellow" | "red" | "black"; reasonCode: string; reasonLabel: string; penalty: "warning" | "health" | "points" | "disqualification"; healthDelta?: number }) {
    return request<MatchFaultRow>(`/api/combat-workflow/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ action: "fault", ...input }),
    });
  }

  finish(matchId: string, resultType: MatchResultType, winnerParticipantId: string | null) {
    return request<PersistedCombat>(`/api/combat-workflow/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ action: "finish", resultType, winnerParticipantId }),
    });
  }
}

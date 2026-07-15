import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, MatchMode, MatchResultType } from "@/types/database.types";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";

export type StartMatchInput = {
  mode: MatchMode;
  participants: Array<{ name: string; startingHealth?: number; userId?: string }>;
  durationSeconds?: number | null;
  eventName?: string | null;
  tournamentId?: string | null;
  clientSessionId: string;
  settings?: Json;
};

export class MatchWorkflowService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async start(input: StartMatchInput) {
    const { data, error } = await this.client.rpc("start_match", {
      target_client_session_id: input.clientSessionId,
      target_event_name: input.eventName ?? null,
      target_max_duration_seconds: input.durationSeconds || null,
      target_mode: input.mode,
      target_participants: input.participants.map((participant) => ({
        name: participant.name,
        starting_health: participant.startingHealth ?? 10,
        user_id: participant.userId ?? null,
      })) as Json,
      target_settings: input.settings ?? {},
      target_tournament_id: input.tournamentId ?? null,
    });
    if (error) throw fromPostgrestError(error);
    return data;
  }

  async get(matchId: string) {
    const match = await this.client.from("matches").select("*").eq("id", matchId).single();
    if (match.error) throw fromPostgrestError(match.error);
    const [participants, faults, events] = await Promise.all([
      this.client.from("match_participants").select("*").eq("match_id", matchId).order("position"),
      this.client.from("match_faults").select("*").eq("match_id", matchId).order("occurred_at"),
      this.client.from("match_events").select("*").eq("match_id", matchId).order("occurred_at"),
    ]);
    const error = participants.error ?? faults.error ?? events.error;
    if (error) throw fromPostgrestError(error);
    return { match: match.data, participants: participants.data ?? [], faults: faults.data ?? [], events: events.data ?? [] };
  }

  async event(matchId: string, input: { participantId: string; eventType: string; payload?: Json; finalHealth?: number; score?: number }) {
    const { data, error } = await this.client.rpc("record_match_event", {
      target_event_type: input.eventType,
      target_final_health: input.finalHealth ?? null,
      target_match_id: matchId,
      target_participant_id: input.participantId,
      target_payload: input.payload ?? {},
      target_score: input.score ?? null,
    });
    if (error) throw fromPostgrestError(error);
    return data;
  }

  async fault(matchId: string, input: { participantId: string; type: "yellow" | "red" | "black"; reasonCode: string; reasonLabel: string; penalty: "warning" | "health" | "points" | "disqualification"; healthDelta?: number; scoreDelta?: number }) {
    const { data, error } = await this.client.rpc("record_match_fault", {
      target_health_delta: input.healthDelta ?? 0,
      target_match_id: matchId,
      target_participant_id: input.participantId,
      target_penalty: input.penalty,
      target_reason_code: input.reasonCode,
      target_reason_label: input.reasonLabel,
      target_score_delta: input.scoreDelta ?? 0,
      target_type: input.type,
    });
    if (error) throw fromPostgrestError(error);
    return data;
  }

  async finish(matchId: string, resultType: MatchResultType, winnerParticipantId?: string | null) {
    const { data, error } = await this.client.rpc("finish_match", {
      target_match_id: matchId,
      target_result_type: resultType,
      target_winner_participant_id: winnerParticipantId ?? null,
    });
    if (error) throw fromPostgrestError(error);
    if (!data) throw new ApiError("Le combat n’a pas pu être finalisé.", 500, "MATCH_FINALIZATION_ERROR");
    return data;
  }

  async cancel(matchId: string) {
    const { data, error } = await this.client.rpc("cancel_match", { target_match_id: matchId });
    if (error) throw fromPostgrestError(error);
    if (!data) throw new ApiError("Le combat n’a pas pu être annulé.", 500, "MATCH_CANCELLATION_ERROR");
    return data;
  }
}

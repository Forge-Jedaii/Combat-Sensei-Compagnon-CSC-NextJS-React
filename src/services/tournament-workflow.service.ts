import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, MatchMode } from "@/types/database.types";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";

export class TournamentWorkflowService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async latest() {
    const { data: auth } = await this.client.auth.getUser();
    if (!auth.user) throw new ApiError("Authentification requise.", 401, "UNAUTHENTICATED");
    const tournament = await this.client.from("tournaments").select("*").eq("created_by", auth.user.id).in("status", ["active", "draft", "completed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (tournament.error) throw fromPostgrestError(tournament.error);
    if (!tournament.data) return null;
    const [participants, matches] = await Promise.all([
      this.client.from("tournament_participants").select("*").eq("tournament_id", tournament.data.id).order("seed"),
      this.client.from("matches").select("*").eq("tournament_id", tournament.data.id).order("round_number").order("bracket_position"),
    ]);
    const error = participants.error ?? matches.error;
    if (error) throw fromPostgrestError(error);
    return { tournament: tournament.data, participants: participants.data ?? [], matches: matches.data ?? [] };
  }

  async create(input: { name: string; type: "single_elimination" | "round_robin"; gameMode: MatchMode; durationSeconds: number; participants: Json; workflow: Json }) {
    const result = await this.client.rpc("create_tournament_workflow", { target_name: input.name, target_type: input.type, target_game_mode: input.gameMode, target_duration_seconds: input.durationSeconds, target_participants: input.participants, target_workflow: input.workflow });
    if (result.error) throw fromPostgrestError(result.error);
    return result.data;
  }

  async progress(id: string, input: { workflow: Json; round: number; position: number; playerOneKey: string; playerTwoKey: string; winnerKey: string; scoreOne: number; scoreTwo: number }) {
    const result = await this.client.rpc("save_tournament_progress", { target_tournament_id: id, target_workflow: input.workflow, target_round: input.round, target_position: input.position, target_player_one_key: input.playerOneKey, target_player_two_key: input.playerTwoKey, target_winner_key: input.winnerKey, target_score_one: input.scoreOne, target_score_two: input.scoreTwo });
    if (result.error) throw fromPostgrestError(result.error);
    return result.data;
  }
}

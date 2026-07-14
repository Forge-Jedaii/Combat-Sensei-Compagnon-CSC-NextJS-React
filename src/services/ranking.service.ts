import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MatchMode, RankingRow } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalNumber, optionalString, requiredString } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/errors";

const modes: MatchMode[] = ["duel", "official_duel", "handicap", "tournament", "highlander", "battle_royale"];
function payload(value: unknown, partial: boolean) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  if (!partial) result.user_id = requiredString(body, "user_id", 36);
  const mode = optionalString(body, "mode", 30); if (mode !== undefined) {
    if (mode !== null && !modes.includes(mode as MatchMode)) throw new ApiError("Mode invalide.", 400, "VALIDATION_ERROR"); result.mode = mode;
  }
  for (const field of ["score", "victories", "defeats", "draws", "matches_played", "current_win_streak", "longest_win_streak", "perfect_games"] as const) {
    const parsed = optionalNumber(body, field, 0); if (parsed !== undefined) result[field] = parsed;
  }
  if (!partial) { result.mode ??= null; result.score ??= 1000; result.victories ??= 0; result.defeats ??= 0; result.draws ??= 0; result.matches_played ??= 0; result.current_win_streak ??= 0; result.longest_win_streak ??= 0; result.perfect_games ??= 0; result.last_match_at = null; }
  return result;
}
export class RankingService extends CrudService<RankingRow> {
  constructor(client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "rankings")); }
  createFrom(value: unknown) { return this.create(payload(value, false)); }
  updateFrom(id: string, value: unknown) { return this.update(id, payload(value, true)); }
}

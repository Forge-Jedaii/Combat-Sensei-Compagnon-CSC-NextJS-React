import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MatchMode, MatchRow, MatchStatus } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalNumber, optionalString, requiredString } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/errors";

const modes: MatchMode[] = ["duel", "official_duel", "handicap", "tournament", "highlander", "battle_royale"];
const statuses: MatchStatus[] = ["draft", "active", "completed", "cancelled"];
function payload(value: unknown, partial: boolean, userId?: string) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  const mode = partial ? optionalString(body, "mode", 30) : requiredString(body, "mode", 30);
  if (mode !== undefined && mode !== null) { if (!modes.includes(mode as MatchMode)) throw new ApiError("Mode invalide.", 400, "VALIDATION_ERROR"); result.mode = mode; }
  const status = optionalString(body, "status", 20); if (status !== undefined && status !== null) { if (!statuses.includes(status as MatchStatus)) throw new ApiError("Statut invalide.", 400, "VALIDATION_ERROR"); result.status = status; }
  for (const field of ["event_name", "tournament_id", "referee_id", "scheduled_at", "started_at", "rules_version"] as const) { const parsed = optionalString(body, field, 200); if (parsed !== undefined) result[field] = parsed; }
  for (const field of ["round_number", "bracket_position", "max_duration_seconds"] as const) { const parsed = optionalNumber(body, field, 1); if (parsed !== undefined) result[field] = parsed; }
  if (!partial) { result.created_by = userId; result.status ??= "draft"; result.result_type = null; result.winner_participant_id = null; result.ended_at = null; result.duration_seconds = null; result.verification_hash = null; result.settings = {}; result.metadata = {}; result.rules_version ??= "csc-1"; }
  return result;
}
export class MatchService extends CrudService<MatchRow> {
  constructor(client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "matches")); }
  createFrom(value: unknown, userId: string) { return this.create(payload(value, false, userId)); }
  updateFrom(id: string, value: unknown) { return this.update(id, payload(value, true)); }
}

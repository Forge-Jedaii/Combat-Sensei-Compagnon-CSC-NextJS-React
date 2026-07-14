import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalBoolean, optionalString, requiredString } from "@/lib/api/validation";

function payload(value: unknown, partial: boolean, id?: string) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  const name = partial ? optionalString(body, "display_name", 40) : requiredString(body, "display_name", 40); if (name !== undefined) result.display_name = name;
  for (const field of ["club_id", "bio", "avatar_path"] as const) { const parsed = optionalString(body, field, field === "bio" ? 500 : 200); if (parsed !== undefined) result[field] = parsed; }
  const share = optionalBoolean(body, "share_data"); if (share !== undefined) result.share_data = share;
  if (!partial) { result.id = id; result.club_id ??= null; result.bio ??= null; result.avatar_path ??= null; result.share_data ??= false; result.status = "pending"; result.onboarding_completed = false; result.last_active_at = null; }
  return result;
}
export class ProfileService extends CrudService<ProfileRow> {
  constructor(client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "profiles")); }
  createFrom(value: unknown, id: string) { return this.create(payload(value, false, id)); }
  updateFrom(id: string, value: unknown) { return this.update(id, payload(value, true)); }
}

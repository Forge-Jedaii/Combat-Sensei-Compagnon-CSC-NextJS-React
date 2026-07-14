import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClubRow, Database } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalBoolean, optionalString, requiredString } from "@/lib/api/validation";

function payload(value: unknown, partial: boolean) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  for (const field of ["slug", "name"] as const) {
    const parsed = partial ? optionalString(body, field, 120) : requiredString(body, field, 120); if (parsed !== undefined) result[field] = parsed;
  }
  if (typeof result.slug === "string") {
    result.slug = result.slug
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  for (const field of ["description", "city", "department_code", "region", "country_code", "website_url", "logo_path"] as const) {
    const parsed = optionalString(body, field, field === "description" ? 500 : 200); if (parsed !== undefined) result[field] = parsed;
  }
  const verified = optionalBoolean(body, "is_verified"); if (verified !== undefined) result.is_verified = verified;
  if (!partial) { result.description ??= null; result.city ??= null; result.department_code ??= null; result.region ??= null; result.country_code ??= "FR"; result.website_url ??= null; result.logo_path ??= null; result.is_verified ??= false; }
  return result;
}

export class ClubService extends CrudService<ClubRow> {
  constructor(client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "clubs")); }
  createFrom(value: unknown) { return this.create(payload(value, false)); }
  updateFrom(id: string, value: unknown) { return this.update(id, payload(value, true)); }
}

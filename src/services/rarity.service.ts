import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RarityRow } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalNumber, optionalString, requiredString } from "@/lib/api/validation";

function payload(value: unknown, partial: boolean) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  for (const field of ["code", "name", "category"] as const) {
    const parsed = partial ? optionalString(body, field, 120) : requiredString(body, field, 120); if (parsed !== undefined) result[field] = parsed;
  }
  const description = optionalString(body, "description", 500); if (description !== undefined) result.description = description;
  const color = optionalString(body, "color_hex", 7); if (color !== undefined) result.color_hex = color;
  const order = optionalNumber(body, "sort_order", 0); if (order !== undefined) result.sort_order = order;
  if (!partial) { result.description ??= null; result.color_hex ??= null; result.sort_order ??= 0; }
  return result;
}

export class RarityService extends CrudService<RarityRow> {
  constructor(client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "rarities")); }
  createFrom(value: unknown) { return this.create(payload(value, false)); }
  updateFrom(id: string, value: unknown) { return this.update(id, payload(value, true)); }
}

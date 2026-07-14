import type { SupabaseClient } from "@supabase/supabase-js";
import type { AchievementRow, Database, RarityRow } from "@/types/database.types";
import { SupabaseRepository } from "@/repositories/supabase.repository";
import { CrudService } from "./crud.service";
import { objectBody, optionalBoolean, optionalNumber, optionalString, requiredString, uuid } from "@/lib/api/validation";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";

const conditions = ["victories", "matches", "win_streak", "perfect_games", "score", "custom"] as const;

function payload(value: unknown, partial: boolean) {
  const body = objectBody(value); const result: Record<string, unknown> = {};
  for (const field of ["code", "name", "description", "icon"] as const) {
    const parsed = partial ? optionalString(body, field, field === "description" ? 500 : 120) : requiredString(body, field, field === "description" ? 500 : 120);
    if (parsed !== undefined) result[field] = parsed;
  }
  const condition = partial ? optionalString(body, "condition_type", 30) : requiredString(body, "condition_type", 30);
  if (condition !== undefined && condition !== null) {
    if (!conditions.includes(condition as typeof conditions[number])) throw new ApiError("Condition invalide.", 400, "VALIDATION_ERROR");
    result.condition_type = condition;
  }
  for (const field of ["condition_value", "points_reward"] as const) { const parsed = optionalNumber(body, field, 0); if (parsed !== undefined) result[field] = parsed; }
  for (const field of ["is_active", "is_secret"] as const) { const parsed = optionalBoolean(body, field); if (parsed !== undefined) result[field] = parsed; }
  const badge = optionalString(body, "badge_label", 120); if (badge !== undefined) result.badge_label = badge;
  if (!partial) { result.condition_value ??= null; result.condition_metadata = {}; result.badge_label ??= null; result.points_reward ??= 0; result.is_active ??= true; result.is_secret ??= false; }
  return result;
}

export class AchievementService extends CrudService<AchievementRow> {
  constructor(private readonly client: SupabaseClient<Database>) { super(new SupabaseRepository(client, "achievements")); }

  private rarityIds(value: unknown): string[] | undefined {
    const body = objectBody(value);
    if (!("rarity_ids" in body)) return undefined;
    if (!Array.isArray(body.rarity_ids) || !body.rarity_ids.every((id) => typeof id === "string")) throw new ApiError("rarity_ids doit être un tableau d’UUID.", 400, "VALIDATION_ERROR");
    return [...new Set(body.rarity_ids.map(uuid))];
  }

  private async attachRarities(items: AchievementRow[]) {
    if (!items.length) return [];
    const { data: links, error: linkError } = await this.client.from("achievement_rarities").select("achievement_id, rarity_id").in("achievement_id", items.map((item) => item.id));
    if (linkError) throw fromPostgrestError(linkError);
    const ids = [...new Set((links ?? []).map((link) => link.rarity_id))];
    let rarities: RarityRow[] = [];
    if (ids.length) {
      const result = await this.client.from("rarities").select("*").in("id", ids);
      if (result.error) throw fromPostgrestError(result.error);
      rarities = result.data ?? [];
    }
    return items.map((item) => ({ ...item, rarities: rarities.filter((rarity) => (links ?? []).some((link) => link.achievement_id === item.id && link.rarity_id === rarity.id)) }));
  }

  private async replaceRarities(achievementId: string, rarityIds: string[]) {
    const existing = await this.client
      .from("achievement_rarities")
      .select("rarity_id")
      .eq("achievement_id", achievementId);
    if (existing.error) throw fromPostgrestError(existing.error);
    const previousIds = (existing.data ?? []).map((link) => link.rarity_id);

    const removed = await this.client.from("achievement_rarities").delete().eq("achievement_id", achievementId);
    if (removed.error) throw fromPostgrestError(removed.error);
    if (rarityIds.length) {
      const inserted = await this.client.from("achievement_rarities").insert(rarityIds.map((rarityId) => ({ achievement_id: achievementId, rarity_id: rarityId })));
      if (inserted.error) {
        if (previousIds.length) {
          await this.client.from("achievement_rarities").insert(previousIds.map((rarityId) => ({ achievement_id: achievementId, rarity_id: rarityId })));
        }
        throw fromPostgrestError(inserted.error);
      }
    }
  }

  async list(from?: number, to?: number) { const result = await super.list(from, to); return { ...result, items: await this.attachRarities(result.items) }; }
  async catalog(from = 0, to = 99) {
    const result = await this.client.rpc("achievement_catalog").range(from, to);
    if (result.error) throw fromPostgrestError(result.error);
    const items = (result.data ?? []) as AchievementRow[];
    return { items: await this.attachRarities(items), count: items.length };
  }
  async get(id: string) { return (await this.attachRarities([await super.get(id)]))[0]; }
  async createFrom(value: unknown) {
    const rarityIds = this.rarityIds(value) ?? [];
    const item = await this.create(payload(value, false));
    try {
      await this.replaceRarities(item.id, rarityIds);
    } catch (error) {
      await this.delete(item.id).catch(() => undefined);
      throw error;
    }
    return (await this.attachRarities([item]))[0];
  }
  async updateFrom(id: string, value: unknown) { const rarityIds = this.rarityIds(value); const item = await this.update(id, payload(value, true)); if (rarityIds) await this.replaceRarities(id, rarityIds); return (await this.attachRarities([item]))[0]; }
}

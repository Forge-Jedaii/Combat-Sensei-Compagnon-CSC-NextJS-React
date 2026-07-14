import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";

type TableName = keyof Database["public"]["Tables"];

export class SupabaseRepository<T> {
  constructor(
    protected readonly client: SupabaseClient<Database>,
    protected readonly table: TableName,
  ) {}

  async findMany(from = 0, to = 49): Promise<{ items: T[]; count: number }> {
    const { data, error, count } = await this.client.from(this.table).select("*", { count: "exact" }).range(from, to);
    if (error) throw fromPostgrestError(error);
    return { items: (data ?? []) as T[], count: count ?? 0 };
  }

  async findById(id: string): Promise<T> {
    const { data, error } = await this.client.from(this.table).select("*").eq("id", id).single();
    if (error) throw fromPostgrestError(error);
    if (!data) throw new ApiError("Ressource introuvable.", 404, "NOT_FOUND");
    return data as T;
  }

  async create(input: object): Promise<T> {
    const { data, error } = await this.client.from(this.table).insert(input as never).select("*").single();
    if (error) throw fromPostgrestError(error);
    return data as T;
  }

  async update(id: string, input: object): Promise<T> {
    const { data, error } = await this.client.from(this.table).update(input as never).eq("id", id).select("*").single();
    if (error) throw fromPostgrestError(error);
    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error, count } = await this.client.from(this.table).delete({ count: "exact" }).eq("id", id);
    if (error) throw fromPostgrestError(error);
    if (count === 0) throw new ApiError("Ressource introuvable.", 404, "NOT_FOUND");
  }
}

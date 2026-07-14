import { SupabaseRepository } from "@/repositories/supabase.repository";

export class CrudService<T> {
  constructor(protected readonly repository: SupabaseRepository<T>) {}
  list(from?: number, to?: number) { return this.repository.findMany(from, to); }
  get(id: string) { return this.repository.findById(id); }
  create(input: object) { return this.repository.create(input); }
  update(id: string, input: object) { return this.repository.update(id, input); }
  delete(id: string) { return this.repository.delete(id); }
}

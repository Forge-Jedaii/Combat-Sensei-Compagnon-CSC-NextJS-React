import { CombatWorkflowRepository, type PersistedCombat } from "@/repositories/combat-workflow.repository";
import type { Json, MatchResultType } from "@/types/database.types";

export class CombatWorkflowClient {
  constructor(private readonly repository = new CombatWorkflowRepository()) {}
  private pending: Promise<unknown> = Promise.resolve();
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation, operation);
    this.pending = result.catch(() => undefined);
    return result;
  }
  start(input: Parameters<CombatWorkflowRepository["start"]>[0]) { return this.repository.start(input); }
  resume(matchId: string) { return this.repository.get(matchId); }
  recordHealth(matchId: string, participantId: string, health: number, eventType: string, payload?: Json) { return this.enqueue(() => this.repository.event(matchId, participantId, eventType, health, payload)); }
  recordFault(matchId: string, input: Parameters<CombatWorkflowRepository["fault"]>[1]) { return this.enqueue(() => this.repository.fault(matchId, input)); }
  finish(matchId: string, resultType: MatchResultType, winnerParticipantId: string | null): Promise<PersistedCombat> { return this.enqueue(() => this.repository.finish(matchId, resultType, winnerParticipantId)); }
  cancel(matchId: string): Promise<PersistedCombat> { return this.enqueue(() => this.repository.cancel(matchId)); }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MatchEventRow, MatchFaultRow, MatchMode, MatchParticipantRow, MatchSummaryRow, RankingRow } from "@/types/database.types";
import { fromPostgrestError } from "@/lib/api/errors";

export class ArchiveService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async userMatches(userId: string) {
    const participants = await this.client.from("match_participants").select("*").eq("user_id", userId);
    if (participants.error) throw fromPostgrestError(participants.error);
    const matchIds = (participants.data ?? []).map((participant) => participant.match_id);
    if (!matchIds.length) return { participants: [] as MatchParticipantRow[], summaries: [] as MatchSummaryRow[] };
    const summaries = await this.client.from("match_summaries").select("*").in("id", matchIds).order("ended_at", { ascending: false });
    if (summaries.error) throw fromPostgrestError(summaries.error);
    return { participants: participants.data ?? [], summaries: summaries.data ?? [] };
  }

  async rankings(userId: string) {
    const result = await this.client.from("rankings").select("*").eq("user_id", userId);
    if (result.error) throw fromPostgrestError(result.error);
    return result.data as RankingRow[];
  }

  async fighterData(userId: string) {
    const [{ participants: ownParticipants, summaries }, rankings] = await Promise.all([
      this.userMatches(userId),
      this.rankings(userId),
    ]);
    const matchIds = summaries.map((match) => match.id);
    if (!matchIds.length) {
      return { ownParticipants, participants: [] as MatchParticipantRow[], summaries, rankings, events: [] as MatchEventRow[], faults: [] as MatchFaultRow[] };
    }

    const [participants, events, faults] = await Promise.all([
      this.client.from("match_participants").select("*").in("match_id", matchIds),
      this.client.from("match_events").select("*").in("match_id", matchIds).order("occurred_at"),
      this.client.from("match_faults").select("*").in("match_id", matchIds).order("occurred_at"),
    ]);
    const error = participants.error ?? events.error ?? faults.error;
    if (error) throw fromPostgrestError(error);

    return {
      ownParticipants,
      participants: participants.data ?? [],
      summaries,
      rankings,
      events: events.data ?? [],
      faults: faults.data ?? [],
    };
  }

  async leaderboard() {
    const result = await this.client.from("leaderboard").select("*").is("mode", null).order("rank_position").limit(100);
    if (result.error) throw fromPostgrestError(result.error);
    return result.data ?? [];
  }
}

export type FighterStatistics = {
  victories: number; defeats: number; draws: number; kills: number; deaths: number;
  killDeathRatio: number; winRate: number; matchesPlayed: number; currentStreak: number;
  longestStreak: number; touches: number; damageDealt: number; damageReceived: number;
  yellowCards: number; redCards: number; blackCards: number; combatTimeSeconds: number;
  favoriteMode: MatchMode | null; lastMatchAt: string | null;
};

function payloadDamage(event: MatchEventRow) {
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) return event.event_type === "hit" ? 1 : 0;
  const damage = event.payload.damage;
  return typeof damage === "number" && Number.isFinite(damage) ? Math.max(0, damage) : event.event_type === "hit" ? 1 : 0;
}

export function calculateFighterStatistics(data: Awaited<ReturnType<ArchiveService["fighterData"]>>): FighterStatistics {
  const completed = data.summaries.filter((match) => match.status === "completed");
  const ownByMatch = new Map(data.ownParticipants.map((participant) => [participant.match_id, participant]));
  const ownIds = new Set(data.ownParticipants.map((participant) => participant.id));
  const wins = completed.filter((match) => ownByMatch.get(match.id)?.is_winner).length;
  const draws = completed.filter((match) => match.result_type === "draw").length;
  const defeats = completed.length - wins - draws;
  const kills = data.participants.filter((participant) => !ownIds.has(participant.id) && completed.some((match) => match.id === participant.match_id) && participant.final_health === 0).length;
  const deaths = data.ownParticipants.filter((participant) => completed.some((match) => match.id === participant.match_id) && participant.final_health === 0).length;
  const hits = data.events.filter((event) => event.event_type === "hit");
  const dealt = hits.filter((event) => event.participant_id ? !ownIds.has(event.participant_id) : false);
  const received = hits.filter((event) => event.participant_id ? ownIds.has(event.participant_id) : false);
  const ownFaults = data.faults.filter((fault) => ownIds.has(fault.participant_id));
  const overall = data.rankings.find((ranking) => ranking.mode === null);
  const modeCounts = completed.reduce<Map<MatchMode, number>>((counts, match) => counts.set(match.mode, (counts.get(match.mode) ?? 0) + 1), new Map());
  const favoriteMode = [...modeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

  return {
    victories: wins,
    defeats,
    draws,
    kills,
    deaths,
    killDeathRatio: deaths ? Number((kills / deaths).toFixed(2)) : kills,
    winRate: completed.length ? Number(((wins / completed.length) * 100).toFixed(2)) : 0,
    matchesPlayed: completed.length,
    currentStreak: overall?.current_win_streak ?? 0,
    longestStreak: overall?.longest_win_streak ?? 0,
    touches: dealt.length,
    damageDealt: dealt.reduce((total, event) => total + payloadDamage(event), 0),
    damageReceived: received.reduce((total, event) => total + payloadDamage(event), 0),
    yellowCards: ownFaults.filter((fault) => fault.type === "yellow").length,
    redCards: ownFaults.filter((fault) => fault.type === "red").length,
    blackCards: ownFaults.filter((fault) => fault.type === "black").length,
    combatTimeSeconds: completed.reduce((total, match) => total + (match.duration_seconds ?? 0), 0),
    favoriteMode,
    lastMatchAt: completed[0]?.ended_at ?? null,
  };
}

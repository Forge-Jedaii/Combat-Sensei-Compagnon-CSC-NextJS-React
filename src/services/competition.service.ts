import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";
import type { CompetitionEventStatus, Database } from "@/types/database.types";

export class CompetitionService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async requireAdmin() {
    const { data: auth } = await this.client.auth.getUser();
    if (!auth.user) throw new ApiError("Authentification requise.", 401, "UNAUTHENTICATED");
    const { data: role, error } = await this.client.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (error) throw fromPostgrestError(error);
    if (!role) throw new ApiError("Droits administrateur requis.", 403, "FORBIDDEN");
    return auth.user;
  }

  async adminDashboard() {
    await this.requireAdmin();
    const [events, tournaments, clubs, profiles] = await Promise.all([
      this.client.from("competition_events").select("*").order("starts_at", { ascending: false }),
      this.client.from("tournaments").select("id,name,status,starts_at").order("created_at", { ascending: false }),
      this.client.from("clubs").select("id,name").order("name"),
      this.client.from("profiles").select("id,display_name,club_id,status").eq("status", "active").order("display_name"),
    ]);
    const error = events.error ?? tournaments.error ?? clubs.error ?? profiles.error;
    if (error) throw fromPostgrestError(error);
    const eventIds = (events.data ?? []).map((event) => event.id);
    const tournamentIds = (tournaments.data ?? []).map((tournament) => tournament.id);
    const [activities, links, invitedClubs, participants] = eventIds.length ? await Promise.all([
      this.client.from("competition_activities").select("*").in("event_id", eventIds).order("position"),
      this.client.from("competition_event_tournaments").select("*").in("event_id", eventIds),
      this.client.from("competition_event_clubs").select("*").in("event_id", eventIds),
      tournamentIds.length ? this.client.from("tournament_participants").select("id,tournament_id,display_name_snapshot,final_rank,status,user_id").in("tournament_id", tournamentIds) : Promise.resolve({ data: [], error: null }),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    const relationError = activities.error ?? links.error ?? invitedClubs.error ?? participants.error;
    if (relationError) throw fromPostgrestError(relationError);
    const participantIds = (participants.data ?? []).map((participant) => participant.id);
    const accesses = participantIds.length ? await this.client.from("competition_participant_access").select("participant_id,public_token").in("participant_id", participantIds) : { data: [], error: null };
    if (accesses.error) throw fromPostgrestError(accesses.error);
    return { events: events.data ?? [], activities: activities.data ?? [], links: links.data ?? [], invitedClubs: invitedClubs.data ?? [], participants: participants.data ?? [], accesses: accesses.data ?? [], tournaments: tournaments.data ?? [], clubs: clubs.data ?? [], profiles: profiles.data ?? [] };
  }

  async setStatus(eventId: string, status: CompetitionEventStatus) {
    await this.requireAdmin();
    const result = await this.client.rpc("set_competition_event_status", { target_event_id: eventId, target_status: status });
    if (result.error) throw fromPostgrestError(result.error);
    return result.data;
  }
}

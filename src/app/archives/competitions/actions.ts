"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompetitionService } from "@/services/competition.service";
import type { CompetitionEventStatus } from "@/types/database.types";

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const optional = (form: FormData, name: string) => field(form, name) || null;
const date = (form: FormData, name: string) => {
  const value = field(form, name);
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) throw new Error(`${name} invalide.`);
  return parsed.toISOString();
};
const refresh = () => revalidatePath("/archives/competitions");

async function admin() {
  const client = await createClient();
  const user = await new CompetitionService(client).requireAdmin();
  return { client, user };
}

export async function createCompetitionEvent(form: FormData) {
  const { client, user } = await admin();
  const disciplines = field(form, "disciplines").split(",").map((item) => item.trim()).filter(Boolean);
  const { error } = await client.from("competition_events").insert({
    name: field(form, "name"), location: field(form, "location"), starts_at: date(form, "startsAt"), organizer_id: user.id,
    description: optional(form, "description"), logo_path: optional(form, "logoPath"), image_path: optional(form, "imagePath"), disciplines,
    status: "draft",
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateCompetitionEvent(form: FormData) {
  const { client } = await admin();
  const disciplines = field(form, "disciplines").split(",").map((item) => item.trim()).filter(Boolean);
  const { error } = await client.from("competition_events").update({
    name: field(form, "name"), location: field(form, "location"), starts_at: date(form, "startsAt"),
    description: optional(form, "description"), logo_path: optional(form, "logoPath"), image_path: optional(form, "imagePath"), disciplines,
  }).eq("id", field(form, "eventId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteCompetitionEvent(form: FormData) {
  const { client } = await admin();
  const { error } = await client.from("competition_events").delete().eq("id", field(form, "eventId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function changeCompetitionEventStatus(form: FormData) {
  const { client } = await admin();
  await new CompetitionService(client).setStatus(field(form, "eventId"), field(form, "status") as CompetitionEventStatus);
  refresh();
}

export async function inviteCompetitionClub(form: FormData) {
  const { client } = await admin();
  const { error } = await client.from("competition_event_clubs").upsert({ event_id: field(form, "eventId"), club_id: field(form, "clubId") });
  if (error) throw new Error(error.message);
  refresh();
}

export async function attachCompetitionTournament(form: FormData) {
  const { client } = await admin();
  const eventId = field(form, "eventId");
  const { error } = await client.from("competition_event_tournaments").upsert({ event_id: eventId, tournament_id: field(form, "tournamentId"), sort_order: Number(field(form, "sortOrder") || 0) });
  if (error) throw new Error(error.message);
  refresh();
}

export async function changeCompetitionTournamentStatus(form: FormData) {
  const { client } = await admin();
  const status = field(form, "status") as "active" | "completed";
  const { error } = await client.from("tournaments").update({
    status,
    starts_at: status === "active" ? new Date().toISOString() : undefined,
    ended_at: status === "completed" ? new Date().toISOString() : undefined,
  }).eq("id", field(form, "tournamentId"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function createCompetitionActivity(form: FormData) {
  const { client } = await admin();
  const mode = field(form, "scheduleMode") as "fixed" | "after_previous";
  const eventId = field(form, "eventId");
  const { error } = await client.from("competition_activities").insert({
    event_id: eventId, tournament_id: optional(form, "tournamentId"), name: field(form, "name"), schedule_mode: mode,
    planned_start_at: mode === "fixed" ? date(form, "plannedStartAt") : null,
    previous_activity_id: mode === "after_previous" ? field(form, "previousActivityId") : null,
    duration_minutes: Number(field(form, "durationMinutes")), room: optional(form, "room"), tatami: optional(form, "tatami"),
    manager_id: null, manager_name: optional(form, "managerName"), description: optional(form, "description"), position: Number(field(form, "position")),
    actual_started_at: null, actual_ended_at: null,
  });
  if (error) throw new Error(error.message);
  const result = await client.rpc("recalculate_competition_schedule", { target_event_id: eventId });
  if (result.error) throw new Error(result.error.message);
  refresh();
}

export async function moveCompetitionActivity(form: FormData) {
  const { client } = await admin();
  const result = await client.rpc("move_competition_activity", { target_activity_id: field(form, "activityId"), target_position: Number(field(form, "position")) });
  if (result.error) throw new Error(result.error.message);
  refresh();
}

export async function updateCompetitionActivityDependency(form: FormData) {
  const { client } = await admin();
  const mode = field(form, "scheduleMode") as "fixed" | "after_previous";
  const eventId = field(form, "eventId");
  const { error } = await client.from("competition_activities").update({
    schedule_mode: mode,
    planned_start_at: mode === "fixed" ? date(form, "plannedStartAt") : null,
    previous_activity_id: mode === "after_previous" ? field(form, "previousActivityId") : null,
  }).eq("id", field(form, "activityId"));
  if (error) throw new Error(error.message);
  const result = await client.rpc("recalculate_competition_schedule", { target_event_id: eventId });
  if (result.error) throw new Error(result.error.message);
  refresh();
}

export async function recordCompetitionDelay(form: FormData) {
  const { client } = await admin();
  const action = field(form, "timingAction");
  const now = new Date().toISOString();
  const result = await client.rpc("record_competition_activity_timing", {
    target_activity_id: field(form, "activityId"), target_started_at: action === "start" ? now : null, target_ended_at: action === "finish" ? now : null,
  });
  if (result.error) throw new Error(result.error.message);
  refresh();
}

export async function openParticipantQr(form: FormData) {
  redirect(`/competition/p/${field(form, "token")}`);
}

export async function linkCompetitionParticipantProfile(form: FormData) {
  const { client } = await admin();
  const { error } = await client.from("tournament_participants").update({ user_id: optional(form, "userId") }).eq("id", field(form, "participantId"));
  if (error) throw new Error(error.message);
  refresh();
}

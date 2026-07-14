import { createClient } from "@/lib/supabase/server";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, optionalNumber, requiredString } from "@/lib/api/validation";
import { TournamentWorkflowService } from "@/services/tournament-workflow.service";
import type { Json, MatchMode } from "@/types/database.types";

export async function GET() { return withApiHandler(async () => jsonData(await new TournamentWorkflowService(await createClient()).latest())); }
export async function POST(request: Request) { return withApiHandler(async () => {
  const body = objectBody(await request.json());
  const type = requiredString(body, "type", 30);
  const gameMode = requiredString(body, "gameMode", 30) as MatchMode;
  return jsonData(await new TournamentWorkflowService(await createClient()).create({
    name: requiredString(body, "name", 120), type: type === "round_robin" ? "round_robin" : "single_elimination",
    gameMode, durationSeconds: optionalNumber(body, "durationSeconds", 0) ?? 0,
    participants: body.participants as Json, workflow: body.workflow as Json,
  }), 201);
}); }

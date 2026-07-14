import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, optionalNumber, optionalString, requiredString, uuid } from "@/lib/api/validation";
import { MatchWorkflowService } from "@/services";
import type { MatchMode } from "@/types/database.types";

const modes: MatchMode[] = ["duel", "official_duel", "handicap", "tournament", "highlander", "battle_royale"];

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new ApiError("Authentification requise pour enregistrer un combat.", 401, "UNAUTHENTICATED");
    const body = objectBody(await request.json());
    const mode = requiredString(body, "mode", 30) as MatchMode;
    if (!modes.includes(mode)) throw new ApiError("Mode de combat invalide.", 400, "VALIDATION_ERROR");
    if (!Array.isArray(body.participants) || body.participants.length < 2) {
      throw new ApiError("Deux participants au minimum sont requis.", 400, "VALIDATION_ERROR");
    }
    const participants = body.participants.map((value) => {
      const participant = objectBody(value);
      return {
        name: requiredString(participant, "name", 80),
        startingHealth: optionalNumber(participant, "startingHealth", 0),
        userId: optionalString(participant, "userId", 36) || undefined,
      };
    });
    const tournamentId = optionalString(body, "tournamentId", 36);
    return jsonData(await new MatchWorkflowService(client).start({
      clientSessionId: uuid(requiredString(body, "clientSessionId", 36)),
      durationSeconds: optionalNumber(body, "durationSeconds", 1),
      eventName: optionalString(body, "eventName", 120),
      mode,
      participants: participants.map((participant) => ({ ...participant, userId: participant.userId ? uuid(participant.userId) : undefined })),
      tournamentId: tournamentId ? uuid(tournamentId) : null,
      settings: (body.settings ?? {}) as import("@/types/database.types").Json,
    }), 201);
  });
}

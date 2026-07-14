import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, optionalNumber, optionalString, requiredString, uuid } from "@/lib/api/validation";
import { MatchWorkflowService } from "@/services";
import type { Json, MatchResultType } from "@/types/database.types";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  return withApiHandler(async () => jsonData(await new MatchWorkflowService(await createClient()).get(uuid((await params).id))));
}

export async function POST(request: Request, { params }: Context) {
  return withApiHandler(async () => {
    const matchId = uuid((await params).id);
    const body = objectBody(await request.json());
    const action = requiredString(body, "action", 30);
    const service = new MatchWorkflowService(await createClient());

    if (action === "event") {
      return jsonData(await service.event(matchId, {
        eventType: requiredString(body, "eventType", 80),
        finalHealth: optionalNumber(body, "finalHealth", 0),
        participantId: uuid(requiredString(body, "participantId", 36)),
        payload: (body.payload ?? {}) as Json,
        score: optionalNumber(body, "score", 0),
      }));
    }
    if (action === "fault") {
      const type = requiredString(body, "type", 10);
      const penalty = requiredString(body, "penalty", 30);
      if (!["yellow", "red", "black"].includes(type) || !["warning", "health", "points", "disqualification"].includes(penalty)) {
        throw new ApiError("Faute invalide.", 400, "VALIDATION_ERROR");
      }
      return jsonData(await service.fault(matchId, {
        healthDelta: typeof body.healthDelta === "number" ? body.healthDelta : 0,
        participantId: uuid(requiredString(body, "participantId", 36)),
        penalty: penalty as "warning" | "health" | "points" | "disqualification",
        reasonCode: requiredString(body, "reasonCode", 80),
        reasonLabel: requiredString(body, "reasonLabel", 160),
        scoreDelta: typeof body.scoreDelta === "number" ? body.scoreDelta : 0,
        type: type as "yellow" | "red" | "black",
      }));
    }
    if (action === "finish") {
      const resultType = requiredString(body, "resultType", 30) as MatchResultType;
      const winner = optionalString(body, "winnerParticipantId", 36);
      return jsonData(await service.finish(matchId, resultType, winner ? uuid(winner) : null));
    }
    throw new ApiError("Action de combat inconnue.", 400, "VALIDATION_ERROR");
  });
}

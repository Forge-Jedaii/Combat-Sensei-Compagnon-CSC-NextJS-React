import { createClient } from "@/lib/supabase/server";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, optionalNumber, requiredString, uuid } from "@/lib/api/validation";
import { TournamentWorkflowService } from "@/services/tournament-workflow.service";
import type { Json } from "@/types/database.types";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) { return withApiHandler(async () => {
  const body = objectBody(await request.json());
  return jsonData(await new TournamentWorkflowService(await createClient()).progress(uuid((await params).id), {
    workflow: body.workflow as Json, round: optionalNumber(body, "round", 1) ?? 1, position: optionalNumber(body, "position", 1) ?? 1,
    playerOneKey: requiredString(body, "playerOneKey", 80), playerTwoKey: requiredString(body, "playerTwoKey", 80), winnerKey: requiredString(body, "winnerKey", 80),
    scoreOne: optionalNumber(body, "scoreOne", 0) ?? 0, scoreTwo: optionalNumber(body, "scoreTwo", 0) ?? 0,
  }));
}); }

import { createClient } from "@/lib/supabase/server";
import { ApiError, fromPostgrestError } from "@/lib/api/errors";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, optionalString, requiredString, uuid } from "@/lib/api/validation";
import type { MatchResultType } from "@/types/database.types";

const resultTypes: MatchResultType[] = ["health", "points", "time", "disqualification", "draw", "forfeit", "other"];
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  return withApiHandler(async () => {
    const body = objectBody(await request.json());
    const resultType = requiredString(body, "resultType", 30) as MatchResultType;
    if (!resultTypes.includes(resultType)) throw new ApiError("Type de résultat invalide.", 400, "VALIDATION_ERROR");
    const winner = optionalString(body, "winnerParticipantId", 36);
    const client = await createClient();
    const { data, error } = await client.rpc("complete_match", {
      target_match_id: uuid((await params).id),
      target_result_type: resultType,
      target_winner_participant_id: winner ? uuid(winner) : null,
    });
    if (error) throw fromPostgrestError(error);
    return jsonData(data);
  });
}

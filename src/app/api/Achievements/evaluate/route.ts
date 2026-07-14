import { createClient } from "@/lib/supabase/server";
import { fromPostgrestError } from "@/lib/api/errors";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, requiredString, uuid } from "@/lib/api/validation";

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = objectBody(await request.json());
    const client = await createClient();
    const { data, error } = await client.rpc("evaluate_achievements", { target_user_id: uuid(requiredString(body, "userId", 36)) });
    if (error) throw fromPostgrestError(error);
    return jsonData(data);
  });
}

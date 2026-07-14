import { ApiError } from "@/lib/api/errors";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { objectBody, requiredString } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = objectBody(await request.json());
    const email = requiredString(body, "email", 320).toLowerCase();
    const password = requiredString(body, "password", 200);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError("Identifiants invalides.", 401, "INVALID_CREDENTIALS");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || profile?.status !== "active") {
      await supabase.auth.signOut();
      throw new ApiError("Ce compte n’est pas actif.", 403, "ACCOUNT_INACTIVE");
    }

    return jsonData({
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: Boolean(data.user.email_confirmed_at),
      },
    });
  });
}

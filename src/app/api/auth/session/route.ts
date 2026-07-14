import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, club_id, avatar_path, share_data, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return NextResponse.json({ authenticated: false, user: null }, { status: 403 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: Boolean(data.user.email_confirmed_at),
        profile,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

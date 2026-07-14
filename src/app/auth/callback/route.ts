import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/redirects";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=auth_callback`, request.url));
  }

  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", auth.user.id).maybeSingle();
    if (profile?.status !== "active") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?message=Votre+demande+est+en+attente+de+validation+administrative.", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

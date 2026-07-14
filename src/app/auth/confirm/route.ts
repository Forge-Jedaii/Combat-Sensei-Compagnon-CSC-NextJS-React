import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/redirects";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: profile } = await supabase.from("profiles").select("status").eq("id", auth.user.id).maybeSingle();
        if (profile?.status !== "active") {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/login?message=Votre+demande+est+en+attente+de+validation+administrative.", request.url));
        }
      }
      return NextResponse.redirect(new URL(next === "/" ? "/auth/verified" : next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=Lien+de+confirmation+invalide+ou+expiré.", request.url));
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { getPublicSupabaseEnvironment } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseEnvironment();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validates and refreshes the JWT when necessary. Do not replace with getSession().
  const { data } = await supabase.auth.getClaims();

  const applicationPath = request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/archives");
  if (data?.claims && applicationPath) {
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", String(data.claims.sub)).maybeSingle();
    if (profile?.status !== "active") {
      await supabase.auth.signOut();
      const pendingResponse = NextResponse.redirect(new URL("/login?message=Votre+demande+est+en+attente+de+validation+administrative.", request.url));
      response.cookies.getAll().forEach((cookie) => pendingResponse.cookies.set(cookie));
      return pendingResponse;
    }
  }

  const protectedPaths = ["/archives/profils", "/reset-password"];
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !data?.claims) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (request.nextUrl.pathname.startsWith("/archives/parametres")) {
    if (!data?.claims) {
      return NextResponse.redirect(new URL("/login?next=/archives/parametres", request.url));
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", String(data.claims.sub))
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return NextResponse.redirect(new URL("/archives", request.url));
  }

  return response;
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/redirects";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function authRedirect(path: string, key: "error" | "message", text: string): never {
  const params = new URLSearchParams({ [key]: text });
  redirect(`${path}?${params.toString()}`);
}

function getOrigin(): string {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").origin;
}

function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const next = getSafeRedirectPath(value(formData, "next"));

  if (!isEmail(email) || !password) authRedirect("/login", "error", "Email et mot de passe requis.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authRedirect("/login", "error", "Identifiants invalides ou email non vérifié.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") {
    await supabase.auth.signOut();
    const message = profile?.status === "pending" ? "Votre demande est en attente de validation." : profile?.status === "rejected" ? "Votre demande d’inscription a été refusée." : "Ce compte n’est pas actif.";
    authRedirect("/login", "error", message);
  }

  redirect(next === "/" ? "/archives" : next);
}

export async function sendMagicLink(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const next = getSafeRedirectPath(value(formData, "next"));

  if (!isEmail(email)) authRedirect("/login", "error", "Adresse email invalide.");

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${getOrigin()}/auth/callback?next=${encodeURIComponent(next === "/" ? "/archives" : next)}`,
    },
  });

  authRedirect(
    "/login",
    "message",
    "Si un compte actif correspond à cette adresse, un lien de connexion a été envoyé.",
  );
}

export async function register(formData: FormData) {
  const displayName = value(formData, "displayName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");

  if (!isEmail(email)) authRedirect("/register", "error", "Adresse email invalide.");

  if (displayName.length < 2 || displayName.length > 31) {
    authRedirect("/register", "error", "Le pseudo doit contenir entre 2 et 31 caractères.");
  }
  if (password.length < 8) authRedirect("/register", "error", "Le mot de passe doit contenir au moins 8 caractères.");
  if (password !== confirmation) authRedirect("/register", "error", "Les mots de passe ne correspondent pas.");

  const origin = getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback?next=/auth/verified`,
    },
  });

  if (error) authRedirect("/register", "error", "Inscription impossible. Vérifiez les informations saisies.");
  if (data.session) await supabase.auth.signOut();
  authRedirect("/login", "message", "Votre demande est enregistrée et reste en attente de validation administrative.");
}

export async function forgotPassword(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const origin = getOrigin();
  const supabase = await createClient();

  // Always return the same message to prevent account enumeration.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  authRedirect(
    "/forgot-password",
    "message",
    "Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.",
  );
}

export async function resetPassword(formData: FormData) {
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");

  if (password.length < 8) authRedirect("/reset-password", "error", "Le mot de passe doit contenir au moins 8 caractères.");
  if (password !== confirmation) authRedirect("/reset-password", "error", "Les mots de passe ne correspondent pas.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) authRedirect("/forgot-password", "error", "Le lien a expiré. Demandez un nouvel email.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) authRedirect("/reset-password", "error", "Le mot de passe n’a pas pu être modifié.");

  await supabase.auth.signOut();
  authRedirect("/login", "message", "Mot de passe modifié. Vous pouvez maintenant vous connecter.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

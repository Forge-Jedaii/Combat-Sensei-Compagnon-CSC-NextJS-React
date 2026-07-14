"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
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

function registerErrorMessage(error: AuthError): string {
  const code = error.code ?? "unknown_auth_error";
  if (["email_exists", "user_already_exists"].includes(code)) return "Cette adresse email est déjà utilisée.";
  if (code === "weak_password") return "Le mot de passe ne respecte pas les règles de sécurité Supabase.";
  if (code === "email_address_invalid") return "Cette adresse email est refusée par le fournisseur d’authentification.";
  if (code === "signup_disabled") return "Les nouvelles inscriptions sont désactivées dans Supabase Auth.";
  if (code === "over_email_send_rate_limit" || error.status === 429) {
    return "La limite d’envoi des emails d’inscription est atteinte. Réessayez plus tard.";
  }
  if (code === "unexpected_failure" || /database error/i.test(error.message)) {
    return "Le trigger SQL de création du profil a échoué. Aucun compte partiel n’a été conservé.";
  }
  if (/fetch|network|timeout/i.test(error.message)) return "Supabase est momentanément inaccessible ou la requête a expiré.";
  return `Supabase Auth a refusé l’inscription (${code}).`;
}

function logRegistration(step: string, context: Record<string, unknown>) {
  console.info("[register]", { step, ...context });
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

  const admin = createAdminClient();
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    console.error("[register]", { step: "auth_preflight", email, error: listError });
    authRedirect("/register", "error", "La vérification préalable du compte a échoué dans Supabase Auth.");
  }
  if (existingUsers.users.some((user) => user.email?.toLowerCase() === email)) {
    logRegistration("auth_preflight", { email, result: "duplicate_email" });
    authRedirect("/register", "error", "Cette adresse email est déjà utilisée.");
  }

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

  if (error) {
    console.error("[register]", {
      step: "auth_created",
      email,
      code: error.code,
      status: error.status,
      message: error.message,
      cause: error.cause,
    });
    authRedirect("/register", "error", registerErrorMessage(error));
  }

  logRegistration("auth_created", { email, userId: data.user?.id, result: Boolean(data.user) });
  if (!data.user) {
    console.error("[register]", { step: "auth_created", email, error: "Supabase returned no user and no error" });
    authRedirect("/register", "error", "Supabase Auth n’a retourné aucun utilisateur.");
  }

  const userId = data.user.id;
  const [profileResult, settingsResult, roleResult, notificationResult] = await Promise.all([
    admin.from("profiles").select("id,status").eq("id", userId).maybeSingle(),
    admin.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "member").maybeSingle(),
    admin.from("email_outbox").select("id,sent_at,last_error").eq("user_id", userId).eq("template", "registration_pending").maybeSingle(),
  ]);

  const checks = {
    profile_created: Boolean(profileResult.data),
    settings_created: Boolean(settingsResult.data),
    member_role_created: Boolean(roleResult.data),
    status_pending: profileResult.data?.status === "pending",
    notification_queued: Boolean(notificationResult.data),
  };
  Object.entries(checks).forEach(([step, result]) => logRegistration(step, { email, userId, result }));

  const verificationErrors = [profileResult.error, settingsResult.error, roleResult.error, notificationResult.error].filter(Boolean);
  if (verificationErrors.length || Object.values(checks).some((result) => !result)) {
    console.error("[register]", { step: "workflow_verification", email, userId, checks, errors: verificationErrors });
    const { error: cleanupError } = await admin.auth.admin.deleteUser(userId, false);
    if (cleanupError) console.error("[register]", { step: "cleanup", email, userId, error: cleanupError });
    if (data.session) await supabase.auth.signOut();
    authRedirect("/register", "error", "Le compte Auth a été créé, mais le workflow PostgreSQL est incomplet. La création a été annulée.");
  }

  if (data.session) await supabase.auth.signOut();
  logRegistration("completed", { email, userId, result: true });
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

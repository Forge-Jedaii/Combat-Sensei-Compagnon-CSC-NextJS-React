"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function profileRedirect(key: "error" | "message", message: string): never {
  redirect(`/archives/profils?${new URLSearchParams({ [key]: message })}`);
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/archives/profils");

  const displayName = field(formData, "displayName");
  const bio = field(formData, "bio");
  const clubId = field(formData, "clubId") || null;
  const shareData = formData.get("shareData") === "on";

  if (displayName.length < 2 || displayName.length > 40) {
    profileRedirect("error", "Le pseudo doit contenir entre 2 et 40 caractères.");
  }
  if (bio.length > 500) profileRedirect("error", "La biographie est limitée à 500 caractères.");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, bio: bio || null, club_id: clubId, share_data: shareData })
    .eq("id", data.user.id);

  if (error) profileRedirect("error", "Le profil n’a pas pu être enregistré. Le pseudo est peut-être déjà utilisé.");
  revalidatePath("/archives/profils");
  profileRedirect("message", "Profil enregistré.");
}

export async function updateEmail(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/archives/profils");
  const { error } = await supabase.auth.updateUser({ email });
  if (error) profileRedirect("error", "L’adresse email n’a pas pu être modifiée.");
  profileRedirect("message", "Un email de confirmation a été envoyé à la nouvelle adresse.");
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) profileRedirect("error", "Sélectionnez une image.");
  if (file.size > 2 * 1024 * 1024) profileRedirect("error", "L’image ne doit pas dépasser 2 Mo.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    profileRedirect("error", "Formats acceptés : JPG, PNG ou WebP.");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/archives/profils");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", data.user.id)
    .maybeSingle();
  const previousPath = profile?.avatar_path ?? null;

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${data.user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) profileRedirect("error", "L’avatar n’a pas pu être envoyé.");

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", data.user.id);
  if (error) {
    if (path !== previousPath) await supabase.storage.from("avatars").remove([path]);
    profileRedirect("error", "L’avatar a été envoyé mais le profil n’a pas pu être mis à jour.");
  }
  if (previousPath && previousPath !== path) {
    await supabase.storage.from("avatars").remove([previousPath]);
  }
  revalidatePath("/archives/profils");
  profileRedirect("message", "Avatar mis à jour.");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const password = field(formData, "currentPassword");
  if (!data.user.email || !password) {
    profileRedirect("error", "Saisissez votre mot de passe pour confirmer la suppression.");
  }

  const { error: authenticationError } = await supabase.auth.signInWithPassword({
    email: data.user.email,
    password,
  });
  if (authenticationError) profileRedirect("error", "Mot de passe incorrect. Le compte n’a pas été supprimé.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", data.user.id)
    .maybeSingle();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) profileRedirect("error", "Le compte n’a pas pu être supprimé.");
  if (profile?.avatar_path) {
    await admin.storage.from("avatars").remove([profile.avatar_path]);
  }
  redirect("/login?message=Compte+supprimé.");
}

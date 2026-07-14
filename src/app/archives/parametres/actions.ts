"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ClubService } from "@/services";
import type { AppRole } from "@/types/database.types";

async function adminClient() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Authentification requise.");
  const { data: role } = await client.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
  if (!role) throw new Error("Droits administrateur requis.");
  return client;
}

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function refresh() { revalidatePath("/archives/parametres"); }

export async function changeProfileStatus(formData: FormData) {
  const client = await adminClient();
  const { error } = await client.rpc("set_profile_status", { target_user_id: text(formData, "userId"), target_status: text(formData, "status") });
  if (error) throw new Error(error.message);
  refresh();
}

export async function changeRole(formData: FormData) {
  const client = await adminClient();
  const role = text(formData, "role") as AppRole;
  const operation = text(formData, "operation");
  const args = { target_user_id: text(formData, "userId"), target_role: role };
  const { error } = await client.rpc(operation === "grant" ? "grant_app_role" : "revoke_app_role", args);
  if (error) throw new Error(error.message);
  refresh();
}

export async function createClub(formData: FormData) {
  const client = await adminClient();
  await new ClubService(client).createFrom({ slug: text(formData, "slug"), name: text(formData, "name"), city: text(formData, "city") || null, country_code: "FR", is_verified: false });
  refresh();
}

export async function deleteClub(formData: FormData) {
  const client = await adminClient();
  await new ClubService(client).delete(text(formData, "clubId"));
  refresh();
}

export async function toggleAchievement(formData: FormData) {
  const client = await adminClient();
  const { error } = await client.from("achievements").update({ is_active: text(formData, "active") !== "true" }).eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleBadge(formData: FormData) {
  const client = await adminClient();
  const { error } = await client.from("badges").update({ is_active: text(formData, "active") !== "true" }).eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  refresh();
}

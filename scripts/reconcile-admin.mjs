import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "forgejedaii@gmail.com";
const ADMIN_DISPLAY_NAME = "Forge Je'daii";

function readLocalEnvironment() {
  return Object.fromEntries(
    fs
      .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

async function requireSuccess(operation) {
  const result = await operation;
  if (result.error) throw result.error;
  return result.data;
}

const environment = readLocalEnvironment();
class DisabledRealtimeTransport {
  constructor() {
    throw new Error("Realtime is disabled for this administrative script.");
  }
}
const supabase = createClient(
  new URL(environment.NEXT_PUBLIC_SUPABASE_URL).origin,
  environment.SUPABASE_SECRET_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: DisabledRealtimeTransport },
  },
);

const { users } = await requireSuccess(
  supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
);
const matches = users.filter(
  (user) => user.email?.toLowerCase() === ADMIN_EMAIL,
);

if (matches.length > 1) {
  throw new Error("Plusieurs comptes Auth utilisent l'adresse administrateur.");
}

let user = matches[0];
let operation = "existing";

if (!user) {
  const invitation = await requireSuccess(
    supabase.auth.admin.inviteUserByEmail(ADMIN_EMAIL, {
      data: { display_name: ADMIN_DISPLAY_NAME },
      redirectTo: `${environment.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/callback?next=/reset-password`,
    }),
  );
  user = invitation.user;
  operation = "invited";
}

if (!user) throw new Error("Le compte administrateur n'a pas pu être obtenu.");

await requireSuccess(
  supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: ADMIN_DISPLAY_NAME,
      onboarding_completed: true,
      share_data: false,
      status: "active",
    },
    { onConflict: "id" },
  ),
);
await requireSuccess(
  supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      auto_save: true,
      language: "fr",
      show_tutorial: true,
      sound_enabled: true,
      theme: "cyber",
      vibration_enabled: true,
    },
    { onConflict: "user_id" },
  ),
);
await requireSuccess(
  supabase.from("user_roles").upsert(
    { granted_by: null, role: "admin", user_id: user.id },
    { onConflict: "user_id,role" },
  ),
);

const [profile, settings, role] = await Promise.all([
  requireSuccess(
    supabase.from("profiles").select("id, status").eq("id", user.id).single(),
  ),
  requireSuccess(
    supabase.from("user_settings").select("user_id").eq("user_id", user.id).single(),
  ),
  requireSuccess(
    supabase.from("user_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").single(),
  ),
]);

console.log(`admin_auth=${operation}`);
console.log(`email_confirmed=${Boolean(user.email_confirmed_at)}`);
console.log(`profile_valid=${profile.status === "active"}`);
console.log(`settings_valid=${Boolean(settings.user_id)}`);
console.log(`admin_role_valid=${Boolean(role.user_id)}`);

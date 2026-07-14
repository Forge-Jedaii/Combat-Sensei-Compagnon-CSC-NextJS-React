import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TEST_EMAIL = "csc-register-workflow@tests.invalid";
const TEST_PASSWORD = "CSC-Register-Test-A9!";
const CYCLES = Number.parseInt(process.env.REGISTER_TEST_CYCLES ?? "10", 10);

function environment() {
  return Object.fromEntries(
    fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function step(cycle, name, result, details = "") {
  console.log(`cycle=${cycle} step=${name} result=${result ? "OK" : "FAIL"}${details ? ` ${details}` : ""}`);
  if (!result) throw new Error(`Register workflow failed: cycle ${cycle}, step ${name}`);
}

async function data(operation) {
  const result = await operation;
  if (result.error) throw result.error;
  return result.data;
}

async function findTestUsers(admin) {
  const result = await data(admin.auth.admin.listUsers({ page: 1, perPage: 1000 }));
  return result.users.filter((user) => user.email?.toLowerCase() === TEST_EMAIL);
}

async function deleteTestUsers(admin) {
  for (const user of await findTestUsers(admin)) {
    await data(admin.auth.admin.deleteUser(user.id, false));
  }
}

async function verifyAggregate(admin, cycle, userId) {
  const [profile, settings, role, notification] = await Promise.all([
    data(admin.from("profiles").select("id,status").eq("id", userId).single()),
    data(admin.from("user_settings").select("user_id").eq("user_id", userId).single()),
    data(admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "member").single()),
    data(admin.from("email_outbox").select("id,sent_at,last_error").eq("user_id", userId).eq("template", "registration_pending").single()),
  ]);
  step(cycle, "profile_created", profile.id === userId);
  step(cycle, "settings_created", settings.user_id === userId);
  step(cycle, "member_role_created", role.role === "member");
  step(cycle, "status_pending", profile.status === "pending");
  step(cycle, "notification_queued", Boolean(notification.id));
}

const env = environment();
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin;
class DisabledRealtimeTransport {
  constructor() {
    throw new Error("Realtime is disabled for the register workflow test.");
  }
}
const admin = createClient(url, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: DisabledRealtimeTransport },
});

await deleteTestUsers(admin);
try {
  for (let cycle = 1; cycle <= CYCLES; cycle += 1) {
    const created = await data(admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: `Register Workflow ${cycle}` },
    }));
    step(cycle, "auth_created", Boolean(created.user?.id));
    await verifyAggregate(admin, cycle, created.user.id);
    await data(admin.auth.admin.deleteUser(created.user.id, false));
    step(cycle, "deleted", (await findTestUsers(admin)).length === 0);
    step(cycle, "completed", true);
  }
} finally {
  await deleteTestUsers(admin);
}

console.log(`register_workflow_cycles=${CYCLES} result=OK`);

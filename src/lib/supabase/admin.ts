import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getPublicSupabaseEnvironment, getSupabaseSecretKey } from "./env";

class DisabledRealtimeTransport {
  constructor() {
    throw new Error("Realtime is disabled for the Supabase admin client.");
  }
}

export function createAdminClient() {
  const { url } = getPublicSupabaseEnvironment();

  return createSupabaseClient<Database>(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: DisabledRealtimeTransport as unknown as typeof WebSocket,
    },
  });
}

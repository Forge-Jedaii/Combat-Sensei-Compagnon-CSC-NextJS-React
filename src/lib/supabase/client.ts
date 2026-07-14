import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getPublicSupabaseEnvironment } from "./env";

export function createClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = getPublicSupabaseEnvironment();
  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

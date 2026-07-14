type PublicSupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

function requireEnvironmentValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requireSupabaseUrl(value: string | undefined): string {
  const rawUrl = requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL", value);
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development");
  }
  return url.origin;
}

export function getPublicSupabaseEnvironment(): PublicSupabaseEnvironment {
  return {
    url: requireSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: requireEnvironmentValue(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function getSupabaseSecretKey(): string {
  return requireEnvironmentValue(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY,
  );
}

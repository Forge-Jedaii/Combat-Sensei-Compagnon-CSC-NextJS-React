const DEFAULT_AUTH_REDIRECT = "/";

/** Prevents external redirects after an authentication callback. */
export function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}

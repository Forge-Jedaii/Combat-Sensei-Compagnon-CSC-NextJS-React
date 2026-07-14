import { ApiError } from "./errors";

export function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError("Corps JSON invalide.", 400, "INVALID_JSON");
  return value as Record<string, unknown>;
}

export function requiredString(body: Record<string, unknown>, key: string, maxLength = 200): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) throw new ApiError(`Le champ ${key} est requis.`, 400, "VALIDATION_ERROR");
  if (value.trim().length > maxLength) throw new ApiError(`Le champ ${key} est trop long.`, 400, "VALIDATION_ERROR");
  return value.trim();
}

export function optionalString(body: Record<string, unknown>, key: string, maxLength = 500): string | null | undefined {
  if (!(key in body)) return undefined;
  if (body[key] === null || body[key] === "") return null;
  if (typeof body[key] !== "string" || body[key].trim().length > maxLength) throw new ApiError(`Le champ ${key} est invalide.`, 400, "VALIDATION_ERROR");
  return body[key].trim();
}

export function optionalNumber(body: Record<string, unknown>, key: string, minimum = 0): number | undefined {
  if (!(key in body)) return undefined;
  const value = body[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) throw new ApiError(`Le champ ${key} est invalide.`, 400, "VALIDATION_ERROR");
  return value;
}

export function optionalBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
  if (!(key in body)) return undefined;
  if (typeof body[key] !== "boolean") throw new ApiError(`Le champ ${key} est invalide.`, 400, "VALIDATION_ERROR");
  return body[key];
}

export function uuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError("Identifiant invalide.", 400, "INVALID_ID");
  }
  return value;
}

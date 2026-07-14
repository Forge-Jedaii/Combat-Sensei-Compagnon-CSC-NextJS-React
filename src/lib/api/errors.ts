import type { PostgrestError } from "@supabase/supabase-js";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly code = "INTERNAL_ERROR",
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function fromPostgrestError(error: PostgrestError): ApiError {
  if (error.code === "PGRST116") return new ApiError("Ressource introuvable.", 404, "NOT_FOUND");
  if (error.code === "23505") return new ApiError("Cette ressource existe déjà.", 409, "CONFLICT");
  if (error.code === "23503") return new ApiError("Une ressource liée est introuvable.", 409, "FOREIGN_KEY_CONFLICT");
  if (error.code === "23514" || error.code === "22P02") return new ApiError("Données invalides.", 400, "VALIDATION_ERROR", error.details);
  if (error.code === "42501" || error.code === "PGRST301") return new ApiError("Action non autorisée.", 403, "FORBIDDEN");
  return new ApiError("Erreur de base de données.", 500, "DATABASE_ERROR");
}

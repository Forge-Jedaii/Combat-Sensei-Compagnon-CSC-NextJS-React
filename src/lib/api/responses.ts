import { NextResponse } from "next/server";
import { ApiError } from "./errors";

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" } as const;

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status, headers: noStoreHeaders });
}

export function jsonDeleted() {
  return new NextResponse(null, { status: 204, headers: noStoreHeaders });
}

export function jsonError(error: unknown) {
  const apiError = error instanceof ApiError
    ? error
    : error instanceof SyntaxError
      ? new ApiError("Corps JSON invalide.", 400, "INVALID_JSON")
      : new ApiError("Erreur interne du serveur.");
  if (!(error instanceof ApiError)) console.error("Unhandled API error", error);
  return NextResponse.json(
    { data: null, error: { code: apiError.code, message: apiError.message, details: apiError.details ?? null } },
    { status: apiError.status, headers: noStoreHeaders },
  );
}

export async function withApiHandler(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    return jsonError(error);
  }
}

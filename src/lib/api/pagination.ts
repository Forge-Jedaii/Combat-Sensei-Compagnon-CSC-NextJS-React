import { ApiError } from "./errors";

export function pagination(url: string) {
  const params = new URL(url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 50);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ApiError("Pagination invalide.", 400, "INVALID_PAGINATION");
  }
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

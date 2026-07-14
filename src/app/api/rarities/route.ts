import { createClient } from "@/lib/supabase/server";
import { pagination } from "@/lib/api/pagination";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { RarityService } from "@/services";
export async function GET(request: Request) { return withApiHandler(async () => { const p = pagination(request.url); const result = await new RarityService(await createClient()).list(p.from, p.to); return jsonData({ ...result, page: p.page, pageSize: p.pageSize }); }); }
export async function POST(request: Request) { return withApiHandler(async () => jsonData(await new RarityService(await createClient()).createFrom(await request.json()), 201)); }

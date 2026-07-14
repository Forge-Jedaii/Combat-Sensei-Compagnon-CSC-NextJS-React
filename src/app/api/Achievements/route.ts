import { createClient } from "@/lib/supabase/server";
import { pagination } from "@/lib/api/pagination";
import { jsonData, withApiHandler } from "@/lib/api/responses";
import { AchievementService } from "@/services";

export async function GET(request: Request) { return withApiHandler(async () => { const p = pagination(request.url); const result = await new AchievementService(await createClient()).catalog(p.from, p.to); return jsonData({ ...result, page: p.page, pageSize: p.pageSize }); }); }
export async function POST(request: Request) { return withApiHandler(async () => jsonData(await new AchievementService(await createClient()).createFrom(await request.json()), 201)); }

import { createClient } from "@/lib/supabase/server"; import { jsonData, jsonDeleted, withApiHandler } from "@/lib/api/responses"; import { uuid } from "@/lib/api/validation"; import { RarityService } from "@/services";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { return withApiHandler(async () => jsonData(await new RarityService(await createClient()).get(uuid((await params).id)))); }
export async function PUT(request: Request, { params }: Context) { return withApiHandler(async () => jsonData(await new RarityService(await createClient()).updateFrom(uuid((await params).id), await request.json()))); }
export const PATCH = PUT;
export async function DELETE(_: Request, { params }: Context) { return withApiHandler(async () => { await new RarityService(await createClient()).delete(uuid((await params).id)); return jsonDeleted(); }); }

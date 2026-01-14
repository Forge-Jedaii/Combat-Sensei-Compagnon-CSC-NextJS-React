import connectToDatabase from "@/lib/mongodb";
import Badge from "@/models/Badge";
import { NextResponse } from "next/server";

// POST /api/Badges
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const badge = await Badge.create(body);

  return NextResponse.json(badge, { status: 201 });
}

// GET /api/Badges
export async function GET() {
  await connectToDatabase();

  const badges = await Badge.find();
  return NextResponse.json(badges);
}

import connectToDatabase from "@/lib/mongodb";
import Achievement from "@/models/Achievement";
import { NextResponse } from "next/server";

// POST /api/Achievements
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const achievement = await Achievement.create(body);

  return NextResponse.json(achievement, { status: 201 });
}

// GET /api/Achievements
export async function GET() {
  await connectToDatabase();

  const achievements = await Achievement.find();
  return NextResponse.json(achievements);
}

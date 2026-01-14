import connectToDatabase from "@/lib/mongodb";
import Ranking from "@/models/Ranking";
import { NextResponse } from "next/server";

// POST /api/Rankings
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const ranking = await Ranking.create(body);

  return NextResponse.json(ranking, { status: 201 });
}

// GET /api/Rankings
export async function GET() {
  await connectToDatabase();

  const rankings = await Ranking.find();
  return NextResponse.json(rankings);
}

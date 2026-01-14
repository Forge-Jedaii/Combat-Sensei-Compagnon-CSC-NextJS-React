import connectToDatabase from "@/lib/mongodb";
import Rarity from "@/models/Rarity";
import { NextResponse } from "next/server";

// POST /api/Raritys
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const rarity = await Rarity.create(body);

  return NextResponse.json(rarity, { status: 201 });
}

// GET /api/Raritys
export async function GET() {
  await connectToDatabase();

  const raritys = await Rarity.find();
  return NextResponse.json(raritys);
}

import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

// POST /api/Users
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const user = await User.create(body);

  return NextResponse.json(user, { status: 201 });
}

// GET /api/Users
export async function GET() {
  await connectToDatabase();

  const users = await User.find();
  return NextResponse.json(users);
}

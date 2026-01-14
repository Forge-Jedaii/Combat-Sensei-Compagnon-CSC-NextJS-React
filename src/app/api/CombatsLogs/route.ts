import connectToDatabase from "@/lib/mongodb";
import CombatsLog from "@/models/CombatsLog";
import { NextResponse } from "next/server";

// POST /api/CombatsLogs
export async function POST(req: Request) {
  await connectToDatabase(); // 👈 connexion ici

  const body = await req.json();
  const combatsLog = await CombatsLog.create(body);

  return NextResponse.json(combatsLog, { status: 201 });
}

// GET /api/CombatsLogs
export async function GET() {
  await connectToDatabase();

  const combatsLogs = await CombatsLog.find();
  return NextResponse.json(combatsLogs);
}

import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await User.findById(params.id).populate("achievements._id");
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const body = await req.json();

  const allowedUpdates = {
    name: body.name,
    club: body.club,
    email: body.email,
    photo: body.photo,
    partage_donnees: body.partage_donnees,
  };

  const user = await User.findByIdAndUpdate(params.id, allowedUpdates, { new: true });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, message: "Compte supprimé définitivement" });
}
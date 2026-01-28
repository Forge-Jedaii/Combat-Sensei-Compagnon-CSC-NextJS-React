import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ name });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 401 }
      );
    }

    // ⚠️ pas de hash pour l'instant
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      achievements: user.achievements
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

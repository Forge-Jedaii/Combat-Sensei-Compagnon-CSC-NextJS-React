import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

/* =========================
   GET /api/users/:id
   Récupérer un utilisateur
========================= */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    const user = await User.findById(params.id).populate("achievements._id");

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /api/users/:id
   Modifier le profil
========================= */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    const body = await req.json();

    // 🔒 champs modifiables uniquement
    const allowedUpdates = {
      name: body.name,
      club: body.club,
      photo: body.photo,
      partage_donnees: body.partage_donnees,
      email: body.email,
    };

    const user = await User.findByIdAndUpdate(
      params.id,
      allowedUpdates,
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE /api/users/:id
   Suppression RGPD
========================= */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Compte supprimé définitivement",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  } 
}


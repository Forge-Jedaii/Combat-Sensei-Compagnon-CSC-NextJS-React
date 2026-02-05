import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

/* =========================
   GET /api/clubs
   Récupère la liste des clubs existants pour l'annuaire
   Seuls les utilisateurs partageant leurs données sont pris en compte
========================= */
export async function GET() {
  await connectToDatabase();

  try {
    // 🔹 Distinct clubs des utilisateurs partageant leurs données
    const clubs: string[] = await User.distinct("club", { partage_donnees: "true" });

    // 🔹 Filtrer les valeurs nulles ou vides
    const filteredClubs = clubs.filter((c) => c && c.trim() !== "");

    // 🔹 Tri alphabétique
    filteredClubs.sort((a, b) => a.localeCompare(b));

    return NextResponse.json(filteredClubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clubs" },
      { status: 500 }
    );
  }
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserMode } from "@/components/context/UserModeContext";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";

export default function ProfilsPage() {
  const { user, setUser } = useUserMode();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    setPseudo(user.name || "");
    setClub(user.club || "");
    setPhoto(user.photo || "");
    setShareData(user.partage_donnees === "true");
    setEmail(user.email || "");
  }, [user]);

  // ===== États Mon Profil =====
  const [pseudo, setPseudo] = useState("");
  const [club, setClub] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [shareData, setShareData] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  // ===== États Annuaire =====
  // const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  // const [search, setSearch] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  // const usersPerPage = 6;

  // ===== Récupération des utilisateurs publics =====
  // useEffect(() => {
  //   const fetchPublicUsers = async () => {
  //     try {
  //       const res = await fetch("/api/users/public");
  //       const data = await res.json();
  //       setPublicUsers(data);
  //     } catch (error) {
  //       console.error("Erreur récupération utilisateurs publics:", error);
  //     }
  //   };
  //   fetchPublicUsers();
  // }, []);

  // ===== Upload photo =====
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ===== Filtrage et Pagination =====
  // const filteredUsers = publicUsers
  //   .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
  //   .sort((a, b) => a.name.localeCompare(b.name));

  // const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  // const startIndex = (currentPage - 1) * usersPerPage;
  // const endIndex = startIndex + usersPerPage;
  // const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // const handlePrevPage = () => {
  //   if (currentPage > 1) setCurrentPage(currentPage - 1);
  // };
  // const handleNextPage = () => {
  //   if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  // };

  // ===== Sauvegarde profil =====
  const handleSaveProfile = async () => {
  if (!user) return;

  try {
    const res = await fetch(`/api/users/${user._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: pseudo,
        email,
        club,
        partage_donnees: shareData ? "true" : "false",
      }),
    });

    if (!res.ok) {
      throw new Error("Erreur mise à jour profil");
    }

    const updatedUser = await res.json();

    setUser(updatedUser);
    alert("Profil mis à jour !");
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la mise à jour du profil");
  }
};

const handleDeleteProfile = async () => {
  if (!user) return;

  const confirmed = confirm(
    "Êtes-vous sûr de supprimer le profil ? Votre classement et l'ensemble de vos données seront supprimées."
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/users/${user._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Erreur lors de la suppression du profil");
    }

    // Nettoyage local
    setUser(null);

    alert("Profil supprimé !");
    router.push("/login"); 
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la suppression du profil");
  }
};

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-10 overflow-y-auto">
      {/* ================= RETOUR ================= */}
      <Link
        href="/archives"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300
        border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40
        hover:text-purple-400 hover:border-purple-400/50 transition-all"
      >
        ← Retour aux Archives
      </Link>

      {/* ================= MON PROFIL ================= */}
      <section className="bg-gradient-to-br from-[#173f3f] to-[#0f2b2b] border border-cyan-400/40 rounded-xl p-6">
        <h1 className="text-cyan-400 text-2xl font-bold mb-6">👤 Mon Profil</h1>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-full border border-cyan-400/40 overflow-hidden bg-black/40 flex items-center justify-center">
              {photo ? (
                <img
                  src={photo}
                  alt="Profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Photo</span>
              )}
            </div>

            <label
              htmlFor="photoUpload"
              className="cursor-pointer text-sm font-semibold
              text-cyan-400 border border-cyan-400/40
              px-4 py-1 rounded-md
              hover:bg-cyan-400/10 transition"
            >
              📷 Choisir une photo
            </label>
            <input
              id="photoUpload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Infos */}
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Pseudo</label>
              <input
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="w-full mt-1 bg-black border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Club</label>
              <input
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full mt-1 bg-black border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-black border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="flex items-center gap-4 text-gray-300">
            <input
              type="checkbox"
              checked={shareData}
              onChange={() => setShareData(!shareData)}
              className="w-5 h-5 accent-purple-500"
            />
            Autoriser le partage de mes badges et expériences
          </label>

          <button
            onClick={handleSaveProfile}
            className="bg-cyan-600/80 hover:bg-cyan-500 transition
            text-white font-semibold px-6 py-2 rounded-lg"
          >
            💾 Enregistrer les modifications
          </button>
          <button
            onClick={handleDeleteProfile}
            className="bg-cyan-600/80 hover:bg-cyan-500 transition
            text-white font-semibold px-6 py-2 rounded-lg"
          >
            Supprimer le profil
          </button>
        </div>
      </section>
    </main>
  );
}
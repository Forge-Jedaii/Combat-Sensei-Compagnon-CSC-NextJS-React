"use client";

import { useState } from "react";
import Link from "next/link";

type Badge = {
  name: string;
  place: string;
  date: string;
};

type UserProfile = {
  id: number;
  pseudo: string;
  club: string;
  badges?: Badge[];
};

export default function ProfilsPage() {
  const [search, setSearch] = useState("");
  const [shareData, setShareData] = useState(true);

  const [pseudo, setPseudo] = useState("Sensei");
  const [club, setClub] = useState("Forge Je’daii");
  const [photo, setPhoto] = useState<string | null>(null);

  const users: UserProfile[] = [
    {
      id: 1,
      pseudo: "Antho",
      club: "Forge Je’daii",
      badges: [
        { name: "Maître Défensif", place: "Nice", date: "2024" },
        { name: "Top 10 Saison", place: "PACA", date: "2023" },
      ],
    },
    {
      id: 2,
      pseudo: "Romain",
      club: "Geneva Saber",
      badges: [{ name: "Vétéran CSC", place: "Genève", date: "2022" }],
    },
    {
      id: 3,
      pseudo: "Sensei",
      club: "Forge Je’daii",
    },
  ];

  const filteredUsers = users
    .filter((u) => u.pseudo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.pseudo.localeCompare(b.pseudo));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
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
          </div>
        </div>

        <button
          className="mt-6 bg-cyan-600/80 hover:bg-cyan-500 transition
          text-white font-semibold px-6 py-2 rounded-lg"
        >
          💾 Enregistrer les modifications
        </button>
      </section>

      {/* ================= CONFIDENTIALITÉ ================= */}
      <section className="bg-black/40 border border-purple-400/30 rounded-xl p-6">
        <h2 className="text-purple-400 text-xl font-bold mb-4">
          🔒 Partage de mes données
        </h2>

        <label className="flex items-center gap-4 text-gray-300">
          <input
            type="checkbox"
            checked={shareData}
            onChange={() => setShareData(!shareData)}
            className="w-5 h-5 accent-purple-500"
          />
          Autoriser le partage de mes badges et expériences
        </label>
      </section>

      {/* ================= ANNUAIRE ================= */}
      <section className="bg-black/40 border border-blue-400/30 rounded-xl p-6">
        <h2 className="text-blue-400 text-xl font-bold mb-6">
          📚 Annuaire des Profils
        </h2>

        <input
          type="text"
          placeholder="🔍 Rechercher un profil"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full bg-black border border-gray-600 rounded px-4 py-2 text-white"
        />

        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="border border-gray-700 rounded-lg p-4 bg-black/60"
            >
              <p className="font-bold text-white">{user.pseudo}</p>
              <p className="text-sm text-gray-400">{user.club}</p>

              {shareData && user.badges && (
                <ul className="mt-3 list-disc list-inside text-sm text-gray-300">
                  {user.badges.map((badge, index) => (
                    <li key={index}>
                      {badge.name} — {badge.place} ({badge.date})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

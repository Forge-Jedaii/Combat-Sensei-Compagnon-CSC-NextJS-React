"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserMode } from "@/components/context/UserModeContext";

/* ================= TYPES ================= */

interface Rarity {
  _id: string;
  name: string;
  category: string;
}

interface Achievement {
  _id: string;
  name: string;
  description: string;
  condition: string;
  icon: string;
  badge?: string;
  rarities: Rarity[];
}

/* ================= PAGE ================= */

export default function AchievementsPage() {
  const { user } = useUserMode();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch("/api/achievements");
        const data = await res.json();
        setAchievements(data);
      } catch (error) {
        console.error("Failed to fetch achievements", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement des achievements...
      </main>
    );
  }

  // ✅ Calcul du nombre d’achievements débloqués
  const total = achievements.length;
  const unlocked = achievements.filter((ach) =>
    user?.achievements.some((ua) => ua._id === ach._id)
  ).length;

  const progress = total ? Math.round((unlocked / total) * 100) : 0;

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-6 space-y-10">
      {/* RETOUR */}
      <Link
        href="/archives"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300
        border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40
        hover:text-purple-400 hover:border-purple-400/50 transition-all"
      >
        ← Retour aux Archives
      </Link>

      {/* HERO */}
      <section className="rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-[#2b130d] via-[#3b1d17] to-[#26110d] p-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">
          🏅 Achievements & Badges
        </h1>

        <div className="grid sm:grid-cols-3 gap-8 text-center mb-6">
          <div>
            <p className="text-5xl font-bold text-white">{unlocked}</p>
            <p className="text-gray-300">Débloqués</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-white">{total}</p>
            <p className="text-gray-300">Disponibles</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-green-400">{progress}%</p>
            <p className="text-gray-300">Progression</p>
          </div>
        </div>

        <div className="w-full h-4 rounded-full bg-black/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* ACHIEVEMENTS GRID */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = user?.achievements.some(
            (ua) => ua._id === achievement._id
          );

          return (
            <div
              key={achievement._id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`
                cursor-pointer rounded-xl p-4 border
                ${isUnlocked ? "border-green-400 bg-black/50" : "border-gray-700 bg-black/30 opacity-60"}
                hover:opacity-100 transition-all
              `}
            >
              <div className="text-4xl text-center mb-2">
                {achievement.icon}
              </div>

              <p className="text-center font-bold text-white text-sm">
                {achievement.name}
              </p>

              <p className="text-xs text-gray-400 text-center">
                {achievement.description}
              </p>

              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {achievement.rarities.map((rarity, index) => (
                  <span
                    key={`${achievement._id}-${rarity._id}-${index}`}
                    className="text-[10px] px-2 py-0.5 rounded
                      bg-purple-600/20 text-purple-300 border border-purple-400/30"
                  >
                    {rarity.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* DÉTAIL */}
      {selectedAchievement && (
        <section className="bg-black/60 border border-yellow-400/40 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            {selectedAchievement.icon} {selectedAchievement.name}
          </h2>

          <p className="text-gray-300 mb-2">
            {selectedAchievement.description}
          </p>

          <p className="text-sm mt-2">
            Statut : {user?.achievements.some((ua) => ua._id === selectedAchievement._id)
              ? "Débloqué ✅"
              : "Verrouillé 🔒"}
          </p>

          <div className="flex gap-2 mt-2">
            {selectedAchievement.rarities.map((rarity) => (
              <span
                key={rarity._id}
                className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300"
              >
                {rarity.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => setSelectedAchievement(null)}
            className="mt-4 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
          >
            Fermer
          </button>
        </section>
      )}
    </main>
  );
}
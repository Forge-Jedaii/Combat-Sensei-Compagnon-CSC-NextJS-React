"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ================= BADGES ================= */

export const BADGES = {
  champion: {
    name: "Champion",
    icon: "🏆",
    description: "100 victoires",
    rarity: "legendary",
  },
  veteran: {
    name: "Vétéran",
    icon: "🎖️",
    description: "500 combats",
    rarity: "legendary",
  },
  perfectionist: {
    name: "Perfectionniste",
    icon: "💎",
    description: "10 matchs parfaits",
    rarity: "epic",
  },
  rising_star: {
    name: "Étoile Montante",
    icon: "⭐",
    description: "Progression rapide",
    rarity: "rare",
  },
  determined: {
    name: "Déterminé",
    icon: "💪",
    description: "Persévérance",
    rarity: "common",
  },
  dominator: {
    name: "Dominateur",
    icon: "👑",
    description: "80% de victoires",
    rarity: "epic",
  },
  fearless: {
    name: "Intrépide",
    icon: "🦁",
    description: "Courage au combat",
    rarity: "rare",
  },
  comeback_king: {
    name: "Roi du Comeback",
    icon: "🔄",
    description: "Retournements de situation",
    rarity: "epic",
  },
  unstoppable: {
    name: "Inarrêtable",
    icon: "🚀",
    description: "Série de 10 victoires",
    rarity: "rare",
  },

  duel_master: {
    name: "Maître du Duel",
    icon: "⚔️",
    description: "Victoire duel 1vs1",
    rarity: "common",
  },
  duel_champion: {
    name: "Champion du Duel",
    icon: "🏹",
    description: "10 victoires duel",
    rarity: "rare",
  },

  official_warrior: {
    name: "Guerrier Officiel",
    icon: "🛡️",
    description: "Victoire officielle",
    rarity: "rare",
  },
  official_champion: {
    name: "Champion Officiel",
    icon: "🎖️",
    description: "5 victoires officielles",
    rarity: "epic",
  },

  highlander_survivor: {
    name: "Survivant Highlander",
    icon: "🏔️",
    description: "Victoire Highlander",
    rarity: "rare",
  },
  highlander_legend: {
    name: "Légende Highlander",
    icon: "⚡",
    description: "10 victoires Highlander",
    rarity: "legendary",
  },

  tournament_fighter: {
    name: "Combattant du Tournoi",
    icon: "🏟️",
    description: "Participation tournoi",
    rarity: "common",
  },
  tournament_champion: {
    name: "Champion du Tournoi",
    icon: "🥇",
    description: "Vainqueur tournoi",
    rarity: "legendary",
  },

  underdog: {
    name: "Challenger",
    icon: "🦾",
    description: "Victoire handicap",
    rarity: "common",
  },
  against_all_odds: {
    name: "Contre Toute Attente",
    icon: "🔥",
    description: "10 victoires handicap",
    rarity: "epic",
  },

  relentless: {
    name: "Implacable",
    icon: "🔥",
    description: "10 combats sans perdre",
    rarity: "rare",
  },
  strategist: {
    name: "Stratège",
    icon: "🧠",
    description: "Victoire tactique",
    rarity: "rare",
  },
  hero_of_the_crowd: {
    name: "Héros du Public",
    icon: "🎉",
    description: "Acclamé",
    rarity: "epic",
  },
  shadow_fighter: {
    name: "Guerrier de l’Ombre",
    icon: "🌑",
    description: "Victoire discrète",
    rarity: "rare",
  },
  titan_slayer: {
    name: "Tueur de Titan",
    icon: "⚡",
    description: "Vaincu plus fort",
    rarity: "epic",
  },
  iron_will: {
    name: "Volonté de Fer",
    icon: "🛡️",
    description: "Ne jamais abandonner",
    rarity: "rare",
  },
  lightning_strike: {
    name: "Frappe Éclair",
    icon: "🌩️",
    description: "Victoire rapide",
    rarity: "common",
  },
  legend_in_the_making: {
    name: "Légende en Devenir",
    icon: "🏹",
    description: "Rang mythique",
    rarity: "legendary",
  },
} as const;

type BadgeKey = keyof typeof BADGES;

interface UserBadge {
  badgeKey: BadgeKey;
  unlockedAt: string;
  progress?: number;
}

/* ================= PAGE ================= */

export default function AchievementsPage() {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeKey | null>(null);

  useEffect(() => {
    setUserBadges([
      { badgeKey: "duel_master", unlockedAt: "2025-01-10" },
      { badgeKey: "determined", unlockedAt: "2025-01-12" },
      { badgeKey: "rising_star", unlockedAt: "2025-01-15" },
      { badgeKey: "unstoppable", unlockedAt: "2025-01-20", progress: 7 },
      { badgeKey: "official_warrior", unlockedAt: "2025-01-22" },
      { badgeKey: "champion", unlockedAt: "2025-01-25" },
    ]);
  }, []);

  const isUnlocked = (key: BadgeKey) =>
    userBadges.some((b) => b.badgeKey === key);

  const getUserBadge = (key: BadgeKey) =>
    userBadges.find((b) => b.badgeKey === key);

  const total = Object.keys(BADGES).length;
  const unlocked = userBadges.length;
  const progress = Math.round((unlocked / total) * 100);

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

      {/* BADGES GRID */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Object.entries(BADGES).map(([key, badge]) => {
          const unlocked = isUnlocked(key as BadgeKey);
          const userBadge = getUserBadge(key as BadgeKey);

          return (
            <div
              key={key}
              onClick={() => setSelectedBadge(key as BadgeKey)}
              className={`cursor-pointer rounded-xl p-4 border transition-all
              ${
                unlocked
                  ? "border-yellow-400/40 bg-yellow-400/10 hover:scale-105"
                  : "border-gray-700 bg-black/40 opacity-50 grayscale"
              }
              `}
            >
              <div className="text-4xl text-center mb-2">{badge.icon}</div>
              <p className="text-center font-bold text-white text-sm">
                {badge.name}
              </p>
              <p className="text-xs text-gray-400 text-center">
                {badge.description}
              </p>

              {userBadge?.progress && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400">
                    {userBadge.progress}/10
                  </div>
                  <div className="w-full bg-black/60 h-1 rounded">
                    <div
                      className="bg-yellow-400 h-1 rounded"
                      style={{ width: `${(userBadge.progress / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* DÉTAIL */}
      {selectedBadge && (
        <section className="bg-black/60 border border-yellow-400/40 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            {BADGES[selectedBadge].icon} {BADGES[selectedBadge].name}
          </h2>
          <p className="text-gray-300 mb-2">
            {BADGES[selectedBadge].description}
          </p>

          {isUnlocked(selectedBadge) ? (
            <p className="text-green-400 font-bold">
              ✓ Débloqué le{" "}
              {new Date(
                getUserBadge(selectedBadge)!.unlockedAt
              ).toLocaleDateString("fr-FR")}
            </p>
          ) : (
            <p className="text-gray-500">Badge non débloqué</p>
          )}

          <button
            onClick={() => setSelectedBadge(null)}
            className="mt-4 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
          >
            Fermer
          </button>
        </section>
      )}
    </main>
  );
}

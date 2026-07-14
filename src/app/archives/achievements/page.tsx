"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserMode } from "@/components/context/UserModeContext";
import { createClient } from "@/lib/supabase/client";
import type { AchievementRow, BadgeRow, Json, RarityRow } from "@/types/database.types";

/* ================= TYPES ================= */

type Achievement = Pick<AchievementRow, "id" | "name" | "description" | "icon" | "is_secret" | "condition_type" | "condition_value" | "condition_metadata" | "points_reward"> & {
  rarities: Pick<RarityRow, "id" | "name" | "category">[];
};

const metricLabels: Record<string, string> = {
  "ranking.victories": "victoires",
  "ranking.matches_played": "matchs joués",
  "ranking.longest_win_streak": "victoires consécutives",
  "ranking.perfect_games": "combats parfaits",
  "ranking.score": "points CSC",
  "combat.kills": "kills",
  "combat.touches": "touches",
  "combat.damage_dealt": "dégâts infligés",
};

function ruleDescription(metadata: Json, fallbackType: string, fallbackValue: number | null): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return fallbackValue ? `Atteindre ${fallbackValue} ${fallbackType}.` : "Condition définie par le règlement CSC.";
  }
  const rule = metadata.rule;
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return fallbackValue ? `Atteindre ${fallbackValue} ${fallbackType}.` : "Condition définie par le règlement CSC.";
  }
  const metric = typeof rule.metric === "string" ? metricLabels[rule.metric] ?? rule.metric.replaceAll(".", " · ") : null;
  const value = typeof rule.value === "number" ? rule.value : null;
  if (metric && value !== null) return `Atteindre ${value} ${metric}.`;
  if (Array.isArray(rule.rules)) return `Remplir ${rule.rules.length} conditions (${rule.combinator === "any" ? "au moins une" : "toutes"}).`;
  return "Condition définie par le règlement CSC.";
}

/* ================= PAGE ================= */

export default function AchievementsPage() {
  const { user } = useUserMode();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAchievements = async () => {
      try {
        const supabase = createClient();
        const [catalogResult, badgeResult, rarityLinkResult, rarityResult] = await Promise.all([
          supabase.rpc("achievement_catalog"),
          createClient().from("badges").select("*").eq("is_active", true).order("category").order("name"),
          supabase.from("achievement_rarities").select("achievement_id,rarity_id"),
          supabase.from("rarities").select("id,name,category"),
        ]);
        if (catalogResult.error) throw new Error(catalogResult.error.message);
        if (badgeResult.error) throw new Error(badgeResult.error.message);
        if (rarityLinkResult.error) throw new Error(rarityLinkResult.error.message);
        if (rarityResult.error) throw new Error(rarityResult.error.message);
        const links = rarityLinkResult.data ?? [];
        const rarities = rarityResult.data ?? [];
        setAchievements((catalogResult.data ?? []).map((achievement) => ({
          ...achievement,
          rarities: rarities.filter((rarity) => links.some((link) => link.achievement_id === achievement.id && link.rarity_id === rarity.id)),
        })));
        setBadges(badgeResult.data ?? []);
        setErrorMessage(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch achievements", error);
          setErrorMessage(error instanceof Error ? error.message : "Le catalogue n’a pas pu être chargé.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAchievements();
    return () => controller.abort();
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
    user?.achievements.some((ua) => ua._id === ach.id && ua.unlocked)
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
      {errorMessage && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300">{errorMessage}</p>}
      {!errorMessage && !achievements.length && <p className="text-center text-gray-400">Aucun achievement disponible.</p>}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => {
          const userAchievement = user?.achievements.find((item) => item._id === achievement.id);
          const isUnlocked = userAchievement?.unlocked ?? false;

          return (
            <button
              type="button"
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`
                cursor-pointer rounded-xl p-4 border text-left
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
                {achievement.is_secret && !isUnlocked ? "Achievement secret" : achievement.description}
              </p>

              <p className="mt-2 text-center text-[11px] text-cyan-200/80">
                {ruleDescription(achievement.condition_metadata, achievement.condition_type, achievement.condition_value)}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800" aria-label={`Progression ${userAchievement?.progress ?? 0}%`}>
                <div className="h-full bg-green-400" style={{ width: `${userAchievement?.progress ?? 0}%` }} />
              </div>
              <p className="mt-1 text-center text-[10px] text-gray-400">{isUnlocked ? "Débloqué" : `Verrouillé · ${userAchievement?.progress ?? 0}%`}</p>

              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {achievement.rarities.map((rarity, index) => (
                  <span
                    key={`${achievement.id}-${rarity.id}-${index}`}
                    className="text-[10px] px-2 py-0.5 rounded
                      bg-purple-600/20 text-purple-300 border border-purple-400/30"
                  >
                    {rarity.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-300">Badges</h2>
          <p className="text-sm text-gray-400">Tous les badges disponibles, même lorsqu’ils ne sont pas encore débloqués.</p>
        </div>
        {!badges.length && <p className="text-gray-400">Aucun badge disponible.</p>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((badge) => {
            const owned = user?.badges.some((item) => item.id === badge.id) ?? false;
            const progress = user?.badges.find((item) => item.id === badge.id)?.progress ?? 0;
            return <article key={badge.id} className={`rounded-xl border p-4 text-center ${owned ? "border-purple-400 bg-purple-950/30" : "border-gray-700 bg-black/30 opacity-55 grayscale"}`}>
              <div className="text-4xl" aria-hidden="true">{badge.icon}</div>
              <h3 className="mt-2 font-bold text-white">{badge.name}</h3>
              <p className="mt-1 text-xs text-gray-300">{badge.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-purple-300">{badge.rarity} · {badge.category}</p>
              <p className="mt-2 text-xs text-gray-400">{owned ? `Débloqué · ${progress}%` : "Verrouillé"}</p>
            </article>;
          })}
        </div>
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
            Statut : {user?.achievements.some((ua) => ua._id === selectedAchievement.id && ua.unlocked)
              ? "Débloqué ✅"
              : "Verrouillé 🔒"}
          </p>

          <div className="flex gap-2 mt-2">
            {selectedAchievement.rarities.map((rarity) => (
              <span
                key={rarity.id}
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

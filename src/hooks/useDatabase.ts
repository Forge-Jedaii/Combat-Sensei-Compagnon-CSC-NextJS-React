"use client";
import { useCallback } from "react";

type MatchResult = {
  winner: string;
  timestamp: number;
};

export function useDatabase() {
  // Charger les stats d'un joueur
  const loadPlayerStats = useCallback(async (playerId: string) => {
    // ⚠️ Mock – à remplacer par un fetch API/Mongoose
    return {
      id: playerId,
      wins: Math.floor(Math.random() * 10),
      losses: Math.floor(Math.random() * 10),
    };
  }, []);

  // Sauvegarder le résultat d’un match
  const saveMatchResult = useCallback(async (result: MatchResult) => {
    console.log("Saving match:", result);
    // ⚠️ Mock – à remplacer par un vrai appel API
    return true;
  }, []);

  return { loadPlayerStats, saveMatchResult };
}

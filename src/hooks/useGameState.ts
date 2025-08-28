"use client";
import { useState, useEffect, useCallback } from "react";

type Player = {
  health: number;
  name: string;
};

type Players = {
  player1: Player;
  player2: Player;
};

export function useGameState() {
  const [players, setPlayers] = useState<Players>({
    player1: { health: 100, name: "Player 1" },
    player2: { health: 100, name: "Player 2" },
  });

  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(60);

  // --- Timer ---
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // --- Start Game ---
  const startGame = useCallback(() => {
    setIsRunning(true);
    setTimer(60);
    setPlayers({
      player1: { health: 100, name: "Player 1" },
      player2: { health: 100, name: "Player 2" },
    });
  }, []);

  // --- End Game ---
  const endGame = useCallback(() => {
    setIsRunning(false);
  }, []);

  // --- Reset Round ---
  const resetRound = useCallback(() => {
    setPlayers({
      player1: { ...players.player1, health: 100 },
      player2: { ...players.player2, health: 100 },
    });
    setTimer(60);
  }, [players]);

  // --- Update Health ---
  const updateHealth = useCallback(
    (player: "player1" | "player2", delta: number) => {
      setPlayers((prev) => {
        const newHealth = Math.max(prev[player].health + delta, 0);
        return {
          ...prev,
          [player]: { ...prev[player], health: newHealth },
        };
      });
    },
    []
  );

  return {
    players,
    isRunning,
    timer,
    startGame,
    endGame,
    resetRound,
    updateHealth,
  };
}

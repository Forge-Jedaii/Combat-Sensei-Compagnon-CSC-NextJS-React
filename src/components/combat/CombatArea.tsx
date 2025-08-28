"use client";

import React, { useState } from "react";
import Timer from "../ui/Timer";
import UndoHit from "../ui/UndoHit";

type CombatAreaProps = {
  player1: string;
  player2: string;
  duration: number;
  onEnd: () => void;
};

type LastHit = {
  target: "left" | "right";
  previousHp1: number;
  previousHp2: number;
};

export default function CombatArea({ player1, player2, duration, onEnd }: CombatAreaProps) {
  const [hp1, setHp1] = useState(10);
  const [hp2, setHp2] = useState(10);
  const [winner, setWinner] = useState<string | null>(null);
  const [hitHistory, setHitHistory] = useState<LastHit[]>([]);

  // Gestion timer
  const [paused, setPaused] = useState(true); // <-- start paused

  const [resetKey, setResetKey] = useState(0);

  const handleHit = (target: "left" | "right") => {
    if (winner) return;

    setHitHistory((prev) => {
      const newHistory = [
        ...prev,
        { target, previousHp1: hp1, previousHp2: hp2 },
      ];
      return newHistory.slice(-2);
    });

    if (target === "left") {
      setHp1((prev) => {
        const newHp = Math.max(prev - 1, 0);
        if (newHp === 0) setWinner(player2);
        return newHp;
      });
    } else {
      setHp2((prev) => {
        const newHp = Math.max(prev - 1, 0);
        if (newHp === 0) setWinner(player1);
        return newHp;
      });
    }
  };

  const handleUndo = () => {
    if (hitHistory.length === 0 || winner) return;
    const lastState = hitHistory[hitHistory.length - 1];
    setHp1(lastState.previousHp1);
    setHp2(lastState.previousHp2);
    setWinner(null);
    setHitHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-[100vh] relative bg-black/10">
      {/* HUD fixe en haut */}
      <div className="fixed top-0 left-0 w-full flex flex-col gap-2 py-2 px-4 bg-black/30 backdrop-blur-md z-50 border-b border-cyber-blue/30">
        {/* Timer et boutons sur la même ligne */}
        <div className="flex justify-center items-center gap-3">
          <div className="text-cyber-blue font-bold text-xl sm:text-2xl font-mono text-glow px-4 py-1 bg-black/40 border border-cyber-blue/40 rounded">
            {duration > 0 ? (
              <Timer
  key={resetKey}
  duration={duration}
  paused={paused} // démarrage manuel
  onEnd={() => setWinner("⏳ Temps écoulé")}
  compact
/>
            ) : (
              "∞"
            )}
          </div>

          <button
            onClick={() => setPaused((p) => !p)}
            className="w-10 h-10 flex justify-center items-center bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-full hover:scale-110 transition-all"
            title={paused ? "Reprendre" : "Pause"}
          >
            {paused ? "▶️" : "⏸"}
          </button>
          <button
            onClick={() => setResetKey((k) => k + 1)}
            className="w-10 h-10 flex justify-center items-center bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-full hover:scale-110 transition-all"
            title="Réinitialiser"
          >
            🔄
          </button>
          <button
            onClick={onEnd}
            className="w-10 h-10 flex justify-center items-center bg-cyber-navy/20 border border-cyber-navy text-cyber-navy rounded-full hover:scale-110 transition-all"
            title="Accueil"
          >
            🏠
          </button>
        </div>

        {/* Barres de vie des joueurs */}
        <div className="flex justify-between items-center gap-4 mt-2">
          {/* Joueur 1 */}
          <div className="flex-1 flex flex-col items-start">
            
            <div className="w-full h-3 bg-black/40 border border-cyber-blue rounded-full overflow-hidden">
              <div
                style={{ width: `${(hp1 / 10) * 100}%` }}
                className="h-full bg-green-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Joueur 2 */}
          <div className="flex-1 flex flex-col items-end">
            
            <div className="w-full h-3 bg-black/40 border border-cyber-blue rounded-full overflow-hidden">
              <div
                style={{ width: `${(hp2 / 10) * 100}%` }}
                className="h-full bg-yellow-400 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zones de combat */}
      <div className="flex flex-1 pt-28">
        {/* Zone gauche */}
        <div
          onClick={() => handleHit("left")}
          className="flex-1 flex flex-col justify-center items-center cursor-pointer bg-green-zone border-r-2 border-cyber-blue active:scale-95 transition-all duration-200"
        >
          <div className="text-center space-y-3 sm:space-y-5">
            <p className="text-cyber-blue font-bold text-lg sm:text-2xl md:text-3xl text-glow truncate max-w-[180px] sm:max-w-[220px]">
              {player1}
            </p>
            <p className="text-white text-6xl sm:text-7xl md:text-8xl font-extrabold text-glow">
              {hp1}
            </p>
            <p className="text-xs sm:text-sm text-cyber-blue mt-2 animate-pulse text-glow-sm">
              Tapez pour attaquer !
            </p>
          </div>
        </div>

        {/* Zone droite */}
        <div
          onClick={() => handleHit("right")}
          className="flex-1 flex flex-col justify-center items-center cursor-pointer bg-gold-zone border-l-2 border-cyber-blue active:scale-95 transition-all duration-200"
        >
          <div className="text-center space-y-3 sm:space-y-5">
            <p className="text-cyber-blue font-bold text-lg sm:text-2xl md:text-3xl text-glow truncate max-w-[180px] sm:max-w-[220px]">
              {player2}
            </p>
            <p className="text-white text-6xl sm:text-7xl md:text-8xl font-extrabold text-glow">
              {hp2}
            </p>
            <p className="text-xs sm:text-sm text-cyber-blue mt-2 animate-pulse text-glow-sm">
              Tapez pour attaquer !
            </p>
          </div>
        </div>
      </div>

      {/* Bouton d'annulation en bas */}
      <div className="flex justify-center p-3 sm:p-4 bg-black/20 border-t border-cyber-blue/30">
        <UndoHit
          onUndo={handleUndo}
          disabled={hitHistory.length === 0 || !!winner}
          text={`↻ Annuler la dernière touche ${
            hitHistory.length > 0 ? `(${hitHistory.length}/2)` : ""
          }`}
        />
      </div>

      {/* Modal de fin */}
      {winner && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg p-4 z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-4 sm:p-6 rounded-xl border-2 border-cyber-blue text-center max-w-sm w-full mx-4">
            <p className="text-cyber-blue text-lg sm:text-xl font-bold mb-4 text-glow">
              {winner === "⏳ Temps écoulé"
                ? winner
                : `🏆 Victoire de ${winner} !`}
            </p>
            <button
              onClick={onEnd}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-lg hover:scale-105 transition-all font-bold text-sm sm:text-base"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

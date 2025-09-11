"use client";

import React, { useState } from "react";
import Timer from "../ui/Timer";
import UndoHit from "../ui/UndoHit";
import { toPng } from "html-to-image";

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
  const [paused, setPaused] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleHit = (target: "left" | "right") => {
    if (winner) return;

    setHitHistory((prev) => {
      const newHistory = [...prev, { target, previousHp1: hp1, previousHp2: hp2 }];
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
        {/* Timer et boutons */}
        <div className="flex justify-center items-center gap-3">
          <div className="text-cyber-blue font-bold text-xl sm:text-2xl font-mono text-glow px-4 py-1 bg-black/40 border border-cyber-blue/40 rounded">
            {duration > 0 ? (
              <Timer
                key={resetKey}
                duration={duration}
                paused={paused}
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

        {/* Barres de vie */}
        <div className="flex justify-between items-center gap-4 mt-2">
          <div className="flex-1 flex flex-col items-start">
            <div className="w-full h-3 bg-black/40 border border-cyber-blue rounded-full overflow-hidden">
              <div
                style={{ width: `${(hp1 / 10) * 100}%` }}
                className="h-full bg-green-500 transition-all duration-300"
              />
            </div>
          </div>
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
        <div
          onClick={() => handleHit("left")}
          className="flex-1 flex flex-col justify-center items-center cursor-pointer bg-green-zone border-r-2 border-cyber-blue active:scale-95 transition-all duration-200"
        >
          <div className="text-center space-y-3 sm:space-y-5">
            <p className="text-cyber-blue font-bold text-lg sm:text-2xl md:text-3xl text-glow truncate max-w-[180px] sm:max-w-[220px]">
              {player1}
            </p>
            <p className="text-white text-6xl sm:text-7xl md:text-8xl font-extrabold text-glow">{hp1}</p>
          </div>
        </div>

        <div
          onClick={() => handleHit("right")}
          className="flex-1 flex flex-col justify-center items-center cursor-pointer bg-gold-zone border-l-2 border-cyber-blue active:scale-95 transition-all duration-200"
        >
          <div className="text-center space-y-3 sm:space-y-5">
            <p className="text-cyber-blue font-bold text-lg sm:text-2xl md:text-3xl text-glow truncate max-w-[180px] sm:max-w-[220px]">
              {player2}
            </p>
            <p className="text-white text-6xl sm:text-7xl md:text-8xl font-extrabold text-glow">{hp2}</p>
          </div>
        </div>
      </div>

      {/* Undo */}
      <div className="flex justify-center p-3 sm:p-4 bg-black/20 border-t border-cyber-blue/30">
        <UndoHit
          onUndo={handleUndo}
          disabled={hitHistory.length === 0 || !!winner}
          text={`↻ Annuler la dernière touche ${hitHistory.length > 0 ? `(${hitHistory.length}/2)` : ""}`}
        />
      </div>

      {/* Modal fin combat */}
      {winner && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg p-4 z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue text-center max-w-md w-full mx-4 shadow-xl">
            {/* Résultats */}
            <div id="result-card" className="mb-6">
              <h2 className="text-cyber-blue text-2xl font-bold mb-3">⚔️ Résultat du combat</h2>
              <p className="text-white">{player1} : {hp1} PV</p>
              <p className="text-white">{player2} : {hp2} PV</p>
              <p className="text-cyber-blue font-bold mt-3">
                {winner === "⏳ Temps écoulé" ? winner : `🏆 Victoire de ${winner} !`}
              </p>
            </div>

            {/* Boutons de partage */}
            <div className="flex flex-col gap-3">
              {/* PNG mais ouverture manuelle */}
              <button
                onClick={async () => {
                  const card = document.getElementById("result-card");
                  if (card) {
                    const dataUrl = await toPng(card);
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`<img src="${dataUrl}" style="width:100%;height:auto;" />`);
                    }
                  }
                }}
                className="w-full bg-cyan-600 px-4 py-2 rounded-lg font-bold hover:bg-cyan-500 transition"
              >
                📸 Voir en PNG
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  const text = `⚔️ Résultat du combat\n${player1}: ${hp1} PV\n${player2}: ${hp2} PV\n🏆 Vainqueur : ${winner}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="w-full bg-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition"
              >
                📱 Partager sur WhatsApp
              </button>

              {/* Discord */}
              <button
                onClick={async () => {
                  const text = `⚔️ Résultat du combat\n${player1}: ${hp1} PV\n${player2}: ${hp2} PV\n🏆 Vainqueur : ${winner}`;
                  await navigator.clipboard.writeText(text);
                  alert("✅ Résultat copié ! Collez-le dans Discord 🚀");
                }}
                className="w-full bg-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-500 transition"
              >
                🎮 Copier pour Discord
              </button>

              <button
                onClick={onEnd}
                className="w-full bg-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-500 transition"
              >
                ❌ Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

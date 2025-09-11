"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";

// Tes handicaps prédéfinis dans le code
const playerHandicapsPool = [
  "🤏 Main faible seulement",
  "✋ Touches main seulement",
  "🎯 Touches tête seulement",
  "👐 Deux mains obligatoires",
  "☠️ Commence avec 3 PV seulement",
  "💔 Commence avec 3 PV seulement",
  "🔥  Double dégâts pour soi !",
];

export default function HandicapMode({ onBack }: { onBack?: () => void }) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [drawnHandicaps, setDrawnHandicaps] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(180); // durée combat par défaut

  const drawHandicaps = () => {
    if (!player1 || !player2) {
      alert("Veuillez entrer les noms des deux Je'daii !");
      return;
    }

    // Tirer 2 handicaps aléatoires depuis ton tableau prédéfini
    const shuffled = [...playerHandicapsPool].sort(() => 0.5 - Math.random());
    setDrawnHandicaps(shuffled.slice(0, 2));
    setShowModal(true);
  };

  const handleStartCombat = () => {
    setShowModal(false);
    setStarted(true);
  };

  const handleReset = () => {
    setPlayer1("");
    setPlayer2("");
    setDrawnHandicaps([]);
    setShowModal(false);
    setStarted(false);
  };

  // Si combat commencé, afficher CombatArea
  if (started) {
    return (
      <CombatArea
        player1={`${player1} (${drawnHandicaps[0]})`}
        player2={`${player2} (${drawnHandicaps[1]})`}
        duration={duration}
        onEnd={handleReset}
      />
    );
  }

  return (
    <div className="bg-black/40 border border-cyan-400/40 rounded-xl p-8 box-glow max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-400/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-cyan-400 text-2xl sm:text-3xl font-orbitron font-bold text-glow text-center mb-8">
          ⚔️ MODE HANDICAP JE&apos;DAII ⚔️
        </h2>

        {/* Inputs joueurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-cyan-400 font-bold mb-2">Nom du Premier Je&apos;daii :</label>
            <input
              type="text"
              placeholder="Nom du Premier Je'daii"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className="w-full px-4 py-4 rounded-lg border border-cyan-400/40 bg-black/60 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-black/80 font-orbitron"
            />
          </div>
          <div>
            <label className="block text-cyan-400 font-bold mb-2">Nom du Second Je&apos;daii :</label>
            <input
              type="text"
              placeholder="Nom du Second Je'daii"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full px-4 py-4 rounded-lg border border-cyan-400/40 bg-black/60 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-black/80 font-orbitron"
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
          <Button onClick={drawHandicaps} className="px-8 py-4 text-lg font-bold text-glow">
            🎲 Assigner les Handicaps de la Force
          </Button>
          <Button onClick={handleReset} className="px-8 py-4 bg-red-600/60 border-red-400 text-lg font-bold">
            ❌ Réinitialiser le Combat
          </Button>
          <Button onClick={onBack} className="px-8 py-4 bg-gradient-to-r from-[#ff275b] to-[#b300ff] text-white font-bold">
            ← Retour
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-black/30 border border-cyan-400/30 rounded-lg p-6 box-glow">
          <h3 className="text-cyan-400 font-orbitron font-bold mb-4 text-glow-sm text-lg">
            📋 Instructions du Maître Combat :
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-cyan-300/90 font-orbitron text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-cyan-400 text-glow-sm">⚡</span>
              <span>Au moins un Je&apos;daii aura toujours un handicap assigné par la Force</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-cyan-400 text-glow-sm">🛡️</span>
              <span>Les handicaps peuvent réduire les PV, limiter les attaques, ou imposer des restrictions</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-cyan-400 text-glow-sm">⚔️</span>
              <span>Acceptez votre destinée et que le meilleur Je&apos;daii l&apos;emporte</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Handicaps */}
      {showModal && drawnHandicaps.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-black/80 backdrop-blur-sm border-2 border-cyan-400 rounded-2xl p-8 max-w-2xl w-full box-glow-strong relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 pointer-events-none"></div>
            
            <div className="relative z-10 text-center space-y-6">
              <h3 className="text-cyan-400 text-2xl font-orbitron font-bold text-glow tracking-wider">
                ⚔️ HANDICAPS DE LA FORCE ASSIGNÉS ⚔️
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-6 box-glow">
                  <div className="text-cyan-400 font-orbitron font-bold text-xl mb-3 text-glow-sm">
                    🌟 {player1}
                  </div>
                  <div className="bg-black/60 border border-cyan-400/20 rounded-lg p-4">
                    <p className="text-white font-orbitron text-sm leading-relaxed">
                      {drawnHandicaps[0]}
                    </p>
                  </div>
                </div>

                <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-6 box-glow">
                  <div className="text-cyan-400 font-orbitron font-bold text-xl mb-3 text-glow-sm">
                    🌟 {player2}
                  </div>
                  <div className="bg-black/60 border border-cyan-400/20 rounded-lg p-4">
                    <p className="text-white font-orbitron text-sm leading-relaxed">
                      {drawnHandicaps[1]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={drawHandicaps}
                  className="px-6 py-3 bg-yellow-500/60 border-yellow-400 font-bold"
                >
                  🔄 Changer les Handicaps
                </Button>
                <Button
                  onClick={handleStartCombat}
                  className="px-6 py-3 bg-green-600/60 border-green-400 font-bold"
                >
                  ✅ Que le Combat Commence !
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { handicaps } from "@/data/gameData";

export default function HandicapMode({ onBack }: { onBack?: () => void }) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [drawnHandicaps, setDrawnHandicaps] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleDraw = () => {
    if (!player1 || !player2) {
      alert("Veuillez entrer les noms des deux Je'daii !");
      return;
    }

    // Tirer 2 handicaps distincts aléatoires
    const shuffled = [...handicaps].sort(() => 0.5 - Math.random());
    setDrawnHandicaps(shuffled.slice(0, 2));

    // Afficher le modal
    setShowModal(true);
  };

  const handleReset = () => {
    setPlayer1("");
    setPlayer2("");
    setDrawnHandicaps([]);
    setShowModal(false);
  };

  return (
    <div className="bg-black/40 border border-cyan-400/40 rounded-xl p-8 box-glow max-w-4xl mx-auto relative overflow-hidden">
      {/* Effet de fond subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-400/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-cyan-400 text-2xl sm:text-3xl font-orbitron font-bold text-glow text-center mb-8">
          ⚔️ MODE HANDICAP JE&apos;DAII ⚔️
        </h2>

        {/* Description avec style cyber */}
        <div className="bg-black/30 border border-cyan-400/20 rounded-lg p-4 mb-8">
          <p className="text-cyan-300/80 text-center italic font-orbitron">
            Dans l&apos;équilibre de la Force, les handicaps forgent les véritables maîtres.
            <br />
            <span className="text-cyan-400 text-glow-sm">Que la sagesse guide vos lames.</span>
          </p>
        </div>

        {/* Inputs joueurs avec style cyber */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="relative group">
            <label className="block text-cyan-400 text-sm font-orbitron font-semibold mb-3 uppercase tracking-wider text-glow-sm">
              🌟 Premier Je&apos;daii
            </label>
            <input
              type="text"
              placeholder="Nom du Premier Je'daii"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className="w-full px-4 py-4 rounded-lg border border-cyan-400/40 bg-black/60 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-black/80 transition-all duration-300 font-orbitron group-hover:box-glow"
            />
          </div>
          
          <div className="relative group">
            <label className="block text-cyan-400 text-sm font-orbitron font-semibold mb-3 uppercase tracking-wider text-glow-sm">
              🌟 Second Je&apos;daii
            </label>
            <input
              type="text"
              placeholder="Nom du Second Je'daii"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full px-4 py-4 rounded-lg border border-cyan-400/40 bg-black/60 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-black/80 transition-all duration-300 font-orbitron group-hover:box-glow"
            />
          </div>
        </div>

        {/* Boutons d'action avec votre style */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
          <Button 
            onClick={handleDraw}
            className="px-8 py-4 text-lg font-orbitron font-bold uppercase tracking-wide hover:scale-105 transform transition-all duration-300 text-glow"
          >
            🎲 Assigner les Handicaps de la Force
          </Button>
          <Button
            onClick={handleReset}
            className="px-8 py-4 bg-red-600/60 border-red-400 hover:scale-105 transform transition-all duration-300 text-lg font-orbitron font-bold uppercase tracking-wide"
          >
            ❌ Réinitialiser le Combat
          </Button>
        </div>

        {/* Instructions avec style cyber */}
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
          <button
          onClick={onBack}
          className="bg-gradient-to-r from-[#ff275b] to-[#b300ff] hover:from-[#ff4d77] hover:to-[#c233ff]
                     text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 
                     border border-white/10 hover:scale-105 shadow-[0_0_18px_rgba(255,39,91,0.35)]"
        >
          ← Retour
        </button>
        </div>
      </div>

      {/* Modal Handicaps avec votre style cyber */}
      {showModal && drawnHandicaps.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-black/80 backdrop-blur-sm border-2 border-cyan-400 rounded-2xl p-8 max-w-2xl w-full box-glow-strong relative overflow-hidden">
            {/* Effet lumineux de fond */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 pointer-events-none"></div>
            
            <div className="relative z-10 text-center space-y-6">
              <h3 className="text-cyan-400 text-2xl font-orbitron font-bold text-glow tracking-wider">
                ⚔️ HANDICAPS DE LA FORCE ASSIGNÉS ⚔️
              </h3>
              
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto opacity-80"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-6 box-glow hover:box-glow-strong transition-all duration-300">
                  <div className="text-cyan-400 font-orbitron font-bold text-xl mb-3 text-glow-sm">
                    🌟 {player1}
                  </div>
                  <div className="bg-black/60 border border-cyan-400/20 rounded-lg p-4">
                    <p className="text-white font-orbitron text-sm leading-relaxed">
                      {drawnHandicaps[0]}
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/50 border border-cyan-400/40 rounded-xl p-6 box-glow hover:box-glow-strong transition-all duration-300">
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
              
              <div className="flex items-center justify-center space-x-4 my-6">
                <div className="w-8 h-1 bg-cyan-400 opacity-60"></div>
                <span className="text-cyan-400 text-2xl text-glow">⚡ VS ⚡</span>
                <div className="w-8 h-1 bg-cyan-400 opacity-60"></div>
              </div>
              
              <div className="bg-black/40 border border-cyan-400/30 rounded-lg p-4">
                <p className="text-cyan-300 font-orbitron text-sm italic text-glow-sm">
                  La Force a parlé. Que le combat commence !
                </p>
              </div>
              
              <Button
                onClick={() => setShowModal(false)}
                className="px-8 py-4 bg-green-600/60 border-green-400 hover:scale-105 transform transition-all duration-300 font-orbitron font-bold uppercase tracking-wide text-glow"
              >
                ✅ Que le Combat Commence !
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
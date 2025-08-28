"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import Timer from "../ui/Timer";

export default function OfficialDuelMode({ onBack }: { onBack?: () => void }) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [referee, setReferee] = useState("");
  const [event, setEvent] = useState("");
  const [round, setRound] = useState("1");
  const [duration, setDuration] = useState(180); // par défaut 3min
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (!player1 || !player2 || !referee) {
      alert("Veuillez entrer les noms des joueurs et de l’arbitre !");
      return;
    }
    setStarted(true);
  };

  const handleReset = () => {
    setStarted(false);
    setPlayer1("");
    setPlayer2("");
    setReferee("");
    setEvent("");
    setRound("1");
    setDuration(180);
  };

  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-xl p-6 box-glow max-w-3xl mx-auto">
      {!started ? (
        <>
          <h2 className="text-cyber-blue text-xl sm:text-2xl font-bold text-glow mb-6">
            🏆 Configuration du Duel Officiel
          </h2>

          {/* Infos Joueurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Nom Joueur 1"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
            />
            <input
              type="text"
              placeholder="Nom Joueur 2"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
            />
          </div>

          {/* Arbitre et Événement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Nom de l’Arbitre"
              value={referee}
              onChange={(e) => setReferee(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
            />
            <input
              type="text"
              placeholder="Événement (ex: Tournoi Forge 2025)"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
            />
          </div>

          {/* Round et Durée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white focus:outline-none focus:border-cyber-blue"
            >
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="final">Finale</option>
            </select>

            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white focus:outline-none focus:border-cyber-blue"
            >
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>

          {/* Bouton démarrer */}
          <div className="text-center flex space-between items-center justify-center gap-4">
            <Button onClick={handleStart}>🚀 Lancer le Duel Officiel</Button>
            <button
          onClick={onBack}
          className="bg-gradient-to-r from-[#ff275b] to-[#b300ff] hover:from-[#ff4d77] hover:to-[#c233ff]
                     text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 
                     border border-white/10 hover:scale-105 shadow-[0_0_18px_rgba(255,39,91,0.35)]"
        >
          ← Retour
        </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-cyber-blue text-xl sm:text-2xl font-bold text-glow mb-4">
            🏆 Duel Officiel en cours
          </h2>

          {/* Infos match */}
          <div className="bg-black/50 rounded-lg p-4 mb-6 border border-cyber-blue/30">
            <p className="text-gray-300 text-sm">Événement : {event || "Non spécifié"}</p>
            <p className="text-gray-300 text-sm">Arbitre : {referee}</p>
            <p className="text-gray-300 text-sm">Round : {round}</p>
          </div>

          {/* Zone joueurs + timer */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mb-6">
            <div className="text-white font-bold text-lg">{player1}</div>
            <div className="text-cyber-blue font-mono text-xl">
              <Timer
      duration={duration}  // ✅ obligatoire
      paused={!started}    // démarre seulement après start
      onEnd={() => alert("⏳ Temps écoulé !")} // ou setStarted(false)
    />
            </div>
            <div className="text-white font-bold text-lg">{player2}</div>
          </div>

          {/* Bouton reset */}
          <div className="text-center">
            <Button onClick={handleReset} className="bg-red-600/60 border-red-400 hover:scale-105">
              ❌ Terminer le Duel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

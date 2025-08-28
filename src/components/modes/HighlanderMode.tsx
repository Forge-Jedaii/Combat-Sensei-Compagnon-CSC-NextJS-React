"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

interface Duel {
  opponent: string;
  result?: string; // "Highlander" ou "Adversaire"
}

export default function HighlanderMode({ onBack }: { onBack?: () => void }) {
  const [highlander, setHighlander] = useState("");
  const [opponents, setOpponents] = useState<string[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [started, setStarted] = useState(false);
  const [currentDuel, setCurrentDuel] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleStart = () => {
    if (!highlander.trim() || opponents.length < 1 || opponents.some((o) => !o.trim())) {
      alert("Veuillez entrer le nom du Highlander et au moins un adversaire !");
      return;
    }
    setDuels(opponents.map((op) => ({ opponent: op })));
    setStarted(true);
    setCurrentDuel(0);
    setFinished(false);
  };

  const handleResult = (winner: string) => {
    const updatedDuels = [...duels];
    updatedDuels[currentDuel].result = winner;
    setDuels(updatedDuels);

    if (winner !== highlander) {
      // Highlander éliminé
      setFinished(true);
    } else if (currentDuel === duels.length - 1) {
      // Highlander a survécu à tous
      setFinished(true);
    } else {
      // Passer au duel suivant
      setCurrentDuel(currentDuel + 1);
    }
  };

  const handleReset = () => {
    setHighlander("");
    setOpponents([]);
    setDuels([]);
    setStarted(false);
    setCurrentDuel(0);
    setFinished(false);
  };

  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-xl p-6 box-glow max-w-3xl mx-auto">
      {!started ? (
        <>
          <h2 className="text-cyber-blue text-xl sm:text-2xl font-bold text-glow mb-6">
            🗡️ Configuration Highlander
          </h2>

          {/* Input Highlander */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Nom du Highlander"
              value={highlander}
              onChange={(e) => setHighlander(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
            />
          </div>

          {/* Opponents */}
          <div className="mb-6">
            <label className="block mb-2 text-gray-300">Adversaires :</label>
            {opponents.map((op, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Adversaire ${i + 1}`}
                value={op}
                onChange={(e) => {
                  const newOpponents = [...opponents];
                  newOpponents[i] = e.target.value;
                  setOpponents(newOpponents);
                }}
                className="w-full mb-2 px-3 py-2 rounded-lg border border-cyber-blue/40 bg-black/60 text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue"
              />
            ))}
            <Button onClick={() => setOpponents([...opponents, ""])}>➕ Ajouter un adversaire</Button>
          </div>

          {/* Start */}
          <div className="text-center flex space-between items-center justify-center gap-4">
            <Button onClick={handleStart}>🚀 Lancer le Highlander</Button>
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
          <h2 className="text-cyber-blue text-xl sm:text-2xl font-bold text-glow mb-6">
            🗡️ Highlander en cours
          </h2>

          {!finished ? (
            <div className="mb-6">
              <p className="text-white text-lg mb-4">
                <span className="font-bold text-cyber-blue">{highlander}</span> affronte{" "}
                <span className="font-bold">{duels[currentDuel].opponent}</span>
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => handleResult(highlander)}>✅ {highlander} gagne</Button>
                <Button onClick={() => handleResult(duels[currentDuel].opponent)}>
                  ❌ {duels[currentDuel].opponent} gagne
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center">
              {duels[currentDuel].result !== highlander ? (
                <h3 className="text-red-500 text-xl font-bold">
                  ❌ {highlander} a été éliminé par {duels[currentDuel].opponent}
                </h3>
              ) : (
                <h3 className="text-cyber-blue text-2xl font-bold">
                  🏆 {highlander} a survécu à tous les adversaires !
                </h3>
              )}
            </div>
          )}

          {/* Historique */}
          <div className="mb-6">
            <h3 className="text-cyber-blue font-bold mb-3">📜 Résultats des duels :</h3>
            <ul className="space-y-2">
              {duels.map((d, i) => (
                <li key={i} className="text-white">
                  {highlander} vs {d.opponent} →{" "}
                  {d.result ? (
                    <span className="text-cyber-blue font-bold">{d.result}</span>
                  ) : (
                    <span className="text-gray-400 italic">En attente</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Reset */}
          <div className="text-center">
            <Button
              onClick={handleReset}
              className="bg-red-600/60 border-red-400 hover:scale-105"
            >
              ❌ Réinitialiser le Highlander
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
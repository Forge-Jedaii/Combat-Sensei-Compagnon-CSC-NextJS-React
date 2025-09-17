"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";
import OfficialSheet from "../combat/OfficialSheet";

interface OfficialDuelModeProps {
  onBack?: () => void;
}

// Typage pour un combattant
interface FighterResult {
  name: string;
  finalHP: number;
  damage: number;
  faults: number;
}

// Typage pour les résultats du combat
interface CombatResults {
  fighter1: FighterResult;
  fighter2: FighterResult;
  winner: string;
  result: string;
}

export default function OfficialDuelMode({ onBack }: OfficialDuelModeProps) {
  const [player1, setPlayer1] = useState("Je'daii 1");
  const [player2, setPlayer2] = useState("Je'daii 2");
  const [referee, setReferee] = useState("Arbitre");
  const [event, setEvent] = useState("Tournoi Forge Je'daii");
  const [round, setRound] = useState("1");
  const [duration, setDuration] = useState(180);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [combatResults, setCombatResults] = useState<CombatResults | null>(null);

  const handleStart = () => {
    setPlayer1(player1.trim() || "Je'daii 1");
    setPlayer2(player2.trim() || "Je'daii 2");
    setReferee(referee.trim() || "Arbitre");
    setEvent(event.trim() || "Événement");
    setStarted(true);
    setFinished(false);
    setCombatResults(null);
  };

  const handleReset = () => {
    setStarted(false);
    setFinished(false);
    setCombatResults(null);
    setPlayer1("Je'daii 1");
    setPlayer2("Je'daii 2");
    setReferee("Arbitre");
    setEvent("Tournoi Forge Je'daii");
    setRound("1");
    setDuration(180);
  };

  const handleEnd = (winner: string) => {
  const results: CombatResults = {
    fighter1: {
      name: player1,
      finalHP: Math.floor(Math.random() * 10) + 1,
      damage: Math.floor(Math.random() * 9) + 1,
      faults: Math.floor(Math.random() * 3),
    },
    fighter2: {
      name: player2,
      finalHP: Math.floor(Math.random() * 10) + 1,
      damage: Math.floor(Math.random() * 9) + 1,
      faults: Math.floor(Math.random() * 3),
    },
    winner: winner,
    result: "Victoire par points",
  };

  setCombatResults(results);
  setStarted(false);
  setFinished(true);
};


  const handleCloseOfficialSheet = () => {
    setFinished(false);
    setCombatResults(null);
  };

  // Préparer les données pour OfficialSheet
  const combatData = combatResults
    ? {
        event: event,
        duration: duration === 0 ? "Illimitée" : `${duration / 60} minutes`,
        actualDuration: "À calculer",
        arbitre: referee,
        combatId: `JD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        fighter1: combatResults.fighter1,
        fighter2: combatResults.fighter2,
        winner: combatResults.winner,
        result: combatResults.result,
      }
    : null;

  // Si duel en cours
  if (started) {
    return <CombatArea player1={player1} player2={player2} duration={duration} onEnd={handleEnd} />;
  }

  // Sinon configuration
  return (
    <>
      <div className="bg-black/40 border border-cyber-blue/40 rounded-2xl p-6 box-glow max-w-2xl mx-auto">
        <h2 className="text-cyber-blue text-xl sm:text-2xl md:text-3xl font-bold text-glow mb-6 text-center">
          🏆 Configuration du Duel Officiel 🏆
        </h2>

        {/* Joueurs */}
        <div className="space-y-4 sm:space-y-6 mb-6">
          <div>
            <label className="block text-green-400 font-bold mb-2 text-sm sm:text-base">
              Je&apos;daii 1 (Zone Verte) :
            </label>
            <input
              type="text"
              value={player1}
              maxLength={20}
              onChange={(e) => setPlayer1(e.target.value)}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-green-400 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-yellow-400 font-bold mb-2 text-sm sm:text-base">
              Je&apos;daii 2 (Zone Dorée) :
            </label>
            <input
              type="text"
              value={player2}
              maxLength={20}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-yellow-400 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Arbitre + Événement */}
        <div className="space-y-4 sm:space-y-6 mb-6">
          <div>
            <label className="block text-cyber-blue font-bold mb-2">Arbitre :</label>
            <input
              type="text"
              value={referee}
              maxLength={30}
              onChange={(e) => setReferee(e.target.value)}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-cyber-blue font-bold mb-2">Événement :</label>
            <input
              type="text"
              value={event}
              maxLength={50}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
            />
          </div>
        </div>

        {/* Round + Durée */}
        <div className="space-y-4 sm:space-y-6 mb-6">
          <div>
            <label className="block text-cyber-blue font-bold mb-2">Round :</label>
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
            >
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="final">Finale</option>
            </select>
          </div>
          <div>
            <label className="block text-cyber-blue font-bold mb-2">Durée :</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
            >
              <option value={0}>Illimitée</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button onClick={handleStart}>🚀 Lancer le Duel</Button>
          <Button onClick={onBack} className="bg-red-600/70">
            ← Retour
          </Button>
        </div>
      </div>

      {/* Fiche Officielle Modal */}
      {finished && combatData && (
        <OfficialSheet isOpen={finished} onClose={handleCloseOfficialSheet} combatData={combatData} />
      )}
    </>
  );
}

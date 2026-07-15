"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";
import OfficialSheet from "../combat/OfficialSheet";
import type { PersistedCombat } from "@/repositories/combat-workflow.repository";
import type { Json } from "@/types/database.types";
import FighterField from "../combat/FighterField";
import { useUserMode } from "@/components/context/UserModeContext";

interface OfficialDuelModeProps {
  onBack?: () => void;
}

export default function OfficialDuelMode({ onBack }: OfficialDuelModeProps) {
  const { mode, fighterId } = useUserMode();
  const [player1, setPlayer1] = useState("Je'daii 1");
  const [player2, setPlayer2] = useState("Je'daii 2");
  const [referee, setReferee] = useState("Arbitre");
  const [event, setEvent] = useState("Tournoi Forge Je'daii");
  const [round, setRound] = useState("1");
  const [duration, setDuration] = useState(180);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [persistedCombat, setPersistedCombat] = useState<PersistedCombat | null>(null);

  const handleStart = () => {
    if (mode === "authenticated" && (!fighterId(player1) || !fighterId(player2) || player1 === player2)) {
      alert("Sélectionnez deux utilisateurs différents.");
      return;
    }
    setPlayer1(player1.trim() || "Je'daii 1");
    setPlayer2(player2.trim() || "Je'daii 2");
    setReferee(referee.trim() || "Arbitre");
    setEvent(event.trim() || "Événement");
    setStarted(true);
    setFinished(false);
    setPersistedCombat(null);
  };

  const handlePersistedResult = (result: PersistedCombat) => {
    setPersistedCombat(result);
    setStarted(false);
    setFinished(true);
  };


  const handleCloseOfficialSheet = () => {
    setFinished(false);
    setPersistedCombat(null);
  };

  // Préparer les données pour OfficialSheet
  const storedSettings = persistedCombat?.match.settings as Json;
  const settings = storedSettings && typeof storedSettings === "object" && !Array.isArray(storedSettings) ? storedSettings : {};
  const storedFighter1 = persistedCombat?.participants.find((participant) => participant.position === 1);
  const storedFighter2 = persistedCombat?.participants.find((participant) => participant.position === 2);
  const storedWinner = persistedCombat?.participants.find((participant) => participant.id === persistedCombat.match.winner_participant_id);
  const combatData = persistedCombat && storedFighter1 && storedFighter2
    ? {
        event: persistedCombat.match.event_name ?? event,
        duration: persistedCombat.match.max_duration_seconds ? `${persistedCombat.match.max_duration_seconds} secondes` : "Illimitée",
        actualDuration: `${persistedCombat.match.duration_seconds ?? 0} secondes`,
        arbitre: typeof settings.referee_name === "string" ? settings.referee_name : referee,
        combatId: `CSC-${persistedCombat.match.public_id}`,
        verificationHash: persistedCombat.match.verification_hash ?? "",
        fighter1: { name: storedFighter1.display_name_snapshot, finalHP: storedFighter1.final_health ?? 0, damage: (storedFighter2.starting_health ?? 10) - (storedFighter2.final_health ?? 0), faults: persistedCombat.faults?.filter((fault) => fault.participant_id === storedFighter1.id).length ?? 0 },
        fighter2: { name: storedFighter2.display_name_snapshot, finalHP: storedFighter2.final_health ?? 0, damage: (storedFighter1.starting_health ?? 10) - (storedFighter1.final_health ?? 0), faults: persistedCombat.faults?.filter((fault) => fault.participant_id === storedFighter2.id).length ?? 0 },
        winner: storedWinner?.display_name_snapshot ?? "Égalité",
        result: persistedCombat.match.result_type === "draw" ? "Match nul" : persistedCombat.match.result_type === "disqualification" ? "Victoire par disqualification" : "Victoire enregistrée",
      }
    : null;

  // Si duel en cours
  if (started) {
    return <CombatArea player1={player1} player2={player2} duration={duration} eventName={event} persistenceMode="official_duel" persistenceSettings={{ referee_name: referee, round }} onEnd={() => { setStarted(false); setPersistedCombat(null); }} onPersistedResult={handlePersistedResult} />;
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
            <FighterField
              label="Je'daii 1 (Zone Verte) :"
              value={player1}
              onChange={setPlayer1}
              excludedNames={[player2]}
              className="border-2 border-green-400"
            />
          </div>
          <div>
            <FighterField
              label="Je'daii 2 (Zone Dorée) :"
              value={player2}
              onChange={setPlayer2}
              excludedNames={[player1]}
              className="border-2 border-yellow-400"
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

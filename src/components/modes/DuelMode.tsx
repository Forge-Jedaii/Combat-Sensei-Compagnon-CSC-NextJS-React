"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";
import FighterField from "../combat/FighterField";
import { useUserMode } from "@/components/context/UserModeContext";

export default function DuelMode({ onBack }: { onBack?: () => void }) {
  const { mode, fighterId } = useUserMode();
  const [player1, setPlayer1] = useState("Je'daii 1");
  const [player2, setPlayer2] = useState("Je'daii 2");
  const [duration, setDuration] = useState(180); // 180s par défaut
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (mode === "authenticated" && (!fighterId(player1) || !fighterId(player2) || player1 === player2)) {
      alert("Sélectionnez deux utilisateurs différents.");
      return;
    }
    // Utiliser des noms par défaut si les champs sont vides ou contiennent seulement des espaces
    const finalPlayer1 = player1.trim() || "Je'daii 1";
    const finalPlayer2 = player2.trim() || "Je'daii 2";
    
    setPlayer1(finalPlayer1);
    setPlayer2(finalPlayer2);
    setStarted(true);
  };

  const handleReset = () => {
    setStarted(false);
    setPlayer1("Je'daii 1");
    setPlayer2("Je'daii 2");
    setDuration(180);
  };

  // Si le duel a commencé, afficher CombatArea
  if (started) {
    return (
      <CombatArea 
        player1={player1}
        player2={player2}
        duration={duration}
        onEnd={handleReset}
        persistenceMode="duel"
      />
    );
  }

  // Sinon afficher la configuration
  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-2xl p-6 box-glow max-w-2xl mx-auto">
      <h2 className="text-cyber-blue text-xl sm:text-2xl md:text-3xl font-bold text-glow mb-6 text-center">
        ⚔️ Configuration du Duel ⚔️
      </h2>

      {/* Inputs joueurs */}
      <div className="space-y-4 sm:space-y-6 mb-6">
        <div className="text-left">
          <FighterField
            label="Nom du Je'daii 1 (Zone Verte) :"
            value={player1}
            onChange={setPlayer1}
            excludedNames={[player2]}
            className="border-2 border-green-400"
          />
        </div>

        <div className="text-left">
          <FighterField
            label="Nom du Je'daii 2 (Zone Dorée) :"
            value={player2}
            onChange={setPlayer2}
            excludedNames={[player1]}
            className="border-2 border-yellow-400"
          />
        </div>

        <div className="text-left">
          <label className="block text-cyber-blue font-bold mb-2 text-sm sm:text-base text-glow-sm">
            Durée du combat :
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white text-sm sm:text-base text-glow-sm focus:box-glow-strong focus:outline-none"
          >
            <option value={0}>⏳ Pas de limite</option>
            <option value={30}>⏱️ 30 secondes</option>
            <option value={60}>⏱️ 1 minute</option>
            <option value={90}>⏱️ 1 minute 30</option>
            <option value={120}>⏱️ 2 minutes</option>
            <option value={180}>⏱️ 3 minutes</option>
            <option value={300}>⏱️ 5 minutes</option>
          </select>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
        <Button
          onClick={handleStart}
          className="w-full sm:w-auto bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyber-blue border-2 border-cyber-blue px-6 py-3 sm:px-8 sm:py-3 rounded-lg text-base sm:text-lg font-bold cursor-pointer hover:scale-105 hover:box-glow-strong"
        >
          🚀 Commencer le Duel
        </Button>
        <Button
          onClick={onBack}
          className="w-full sm:w-auto bg-gradient-to-r from-[#ff275b] to-[#b300ff] text-white border border-white/20 shadow-[0_0_18px_rgba(255,39,91,0.35)] hover:from-[#ff4d77] hover:to-[#c233ff]"
        >
          ← Retour
        </Button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";
import html2canvas from "html2canvas";

export default function OfficialDuelMode({ onBack }: { onBack?: () => void }) {
  const [player1, setPlayer1] = useState("Je'daii 1");
  const [player2, setPlayer2] = useState("Je'daii 2");
  const [referee, setReferee] = useState("Arbitre");
  const [event, setEvent] = useState("Tournoi Forge Je'daii");
  const [round, setRound] = useState("1");
  const [duration, setDuration] = useState(180);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleStart = () => {
    setPlayer1(player1.trim() || "Je'daii 1");
    setPlayer2(player2.trim() || "Je'daii 2");
    setReferee(referee.trim() || "Arbitre");
    setEvent(event.trim() || "Événement");
    setStarted(true);
    setFinished(false);
  };

  const handleReset = () => {
    setStarted(false);
    setFinished(false);
    setPlayer1("Je'daii 1");
    setPlayer2("Je'daii 2");
    setReferee("Arbitre");
    setEvent("Tournoi Forge Je'daii");
    setRound("1");
    setDuration(180);
  };

  const handleEnd = () => {
    setStarted(false);
    setFinished(true);
  };

  const exportToPNG = async () => {
    const element = document.getElementById("officialSheet");
    if (!element) return;
    const canvas = await html2canvas(element);
    const link = document.createElement("a");
    link.download = "fiche-officielle.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Si duel en cours
  if (started) {
    return (
      <CombatArea
        player1={player1}
        player2={player2}
        duration={duration}
        onEnd={handleEnd} // 👈 fin du duel = fiche officielle
      />
    );
  }

  // Si fiche officielle
  if (finished) {
    return (
      <div
        id="officialSheet"
        className="bg-black/70 border-2 border-cyber-blue rounded-2xl p-6 max-w-2xl mx-auto box-glow text-center"
      >
        <h2 className="text-emerald-400 text-2xl font-bold text-glow mb-6">
          📜 Fiche Officielle du Duel
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 rounded-xl border-2 border-green-400 text-green-400 font-bold text-lg bg-black/60">
            {player1}
          </div>
          <div className="p-4 rounded-xl border-2 border-yellow-400 text-yellow-400 font-bold text-lg bg-black/60">
            {player2}
          </div>
        </div>

        <p className="text-gray-300">⚔️ Événement : {event}</p>
        <p className="text-gray-300">👨‍⚖️ Arbitre : {referee}</p>
        <p className="text-gray-300">🔄 Round : {round}</p>
        <p className="text-gray-300">⏱️ Durée : {duration === 0 ? "Illimitée" : duration / 60 + " min"}</p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button onClick={exportToPNG}>📥 Exporter PNG</Button>
          <Button
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  `📜 Fiche officielle : ${player1} vs ${player2} (${event})`
                )}`
              )
            }
            className="bg-green-600"
          >
            📱 WhatsApp
          </Button>
          <Button
            onClick={() =>
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(
                  "https://forge-jedaii.com"
                )}&text=${encodeURIComponent(
                  `📜 Fiche officielle : ${player1} vs ${player2} (${event})`
                )}`
              )
            }
            className="bg-blue-500"
          >
            ✈️ Telegram
          </Button>
          <Button
            onClick={() => window.open("https://discord.com/channels/@me")}
            className="bg-indigo-600"
          >
            🎮 Discord
          </Button>
        </div>

        <div className="mt-6">
          <Button onClick={handleReset}>↩️ Nouveau Duel</Button>
        </div>
      </div>
    );
  }

  // Sinon configuration
  return (
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
  );
  
}


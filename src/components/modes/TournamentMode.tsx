"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

interface Match {
  id: number;
  player1: string;
  player2: string;
  winner?: string;
}

export default function TournamentMode({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<"setup" | "bracket" | "results">("setup");
  const [tournamentName, setTournamentName] = useState("Tournoi de la Forge");
  const [tournamentType, setTournamentType] = useState<"elimination" | "roundrobin">("elimination");
  const [gameMode, setGameMode] = useState<"normal" | "handicap">("normal");
  const [timeLimit, setTimeLimit] = useState<number>(0);

  const [players, setPlayers] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [rounds, setRounds] = useState<Match[][]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  // Ajouter un participant
  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    setPlayers([...players, newParticipant.trim()]);
    setNewParticipant("");
  };

  // Mélanger les joueurs
  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Générer le premier tour
  const generateFirstRound = () => {
    const shuffled = shuffleArray([...players]);
    while ((shuffled.length & (shuffled.length - 1)) !== 0) shuffled.push("BYE"); // BYE pour puissance de 2
    const firstRound: Match[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      firstRound.push({ id: i / 2, player1: shuffled[i], player2: shuffled[i + 1] });
    }
    return firstRound;
  };

  // Lancer le tournoi
  const startTournament = () => {
    if (players.length < 2) return alert("⚠️ Il faut au moins 2 participants !");
    setRounds([generateFirstRound()]);
    setActiveTab("bracket");
  };

  // Définir le gagnant d'un match
  const setMatchWinner = (roundIndex: number, matchId: number, win: string) => {
    const updatedRounds = [...rounds];
    const match = updatedRounds[roundIndex][matchId];
    match.winner = match.player1 === "BYE" ? match.player2 : match.player2 === "BYE" ? match.player1 : win;
    updatedRounds[roundIndex] = updatedRounds[roundIndex].map((m, i) =>
      i === matchId ? match : m
    );
    setRounds(updatedRounds);
    advanceWinner(match.winner!, roundIndex);
  };

  const advanceWinner = (matchWinner: string, roundIndex: number) => {
    const currentRound = rounds[roundIndex];
    if (currentRound.every((m) => m.winner)) {
      const winners = currentRound.map((m) => m.winner!);
      if (winners.length === 1) {
        setWinner(winners[0]);
        setActiveTab("results");
      } else {
        const nextRound: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) {
          nextRound.push({ id: i / 2, player1: winners[i], player2: winners[i + 1] || "BYE" });
        }
        setRounds([...rounds, nextRound]);
      }
    }
  };

  const backToModeSelection = () => {
    setActiveTab("setup");
    setRounds([]);
    setWinner(null);
  };

  const shareToWhatsApp = () => {
    if (!winner) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🏆 Vainqueur du tournoi : ${winner}`)}`, "_blank");
  };

  const shareToTelegram = () => {
    if (!winner) return;
    window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(`🏆 Vainqueur du tournoi : ${winner}`)}`, "_blank");
  };

  const shareToDiscord = () => {
    if (!winner) return;
    navigator.clipboard.writeText(`🏆 Vainqueur du tournoi : ${winner}`).then(() => alert("Résultat copié pour Discord !"));
  };

  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-xl p-6 box-glow max-w-4xl mx-auto">
      {/* Setup */}
      {activeTab === "setup" && (
        <div id="tournamentSetup">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-6 text-cyber-blue text-glow text-center">
            🏆 Configuration du Tournoi 🏆
          </div>
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-cyber-blue font-bold mb-2">Nom du Tournoi:</label>
              <input
                type="text"
                value={tournamentName}
                maxLength={30}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white focus:outline-none"
              />
            </div>
            <div className="text-left">
              <label className="block text-cyber-blue font-bold mb-2">Type de Tournoi:</label>
              <select
  value={tournamentType}
  onChange={(e) =>
    setTournamentType(e.target.value as "elimination" | "roundrobin")
  }
  className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
>
  <option value="elimination">🏆 Élimination Directe</option>
  <option value="roundrobin">🔄 Round Robin</option>
</select>

            </div>
            <div className="text-left">
              <label className="block text-cyber-blue font-bold mb-2">Mode de Combat:</label>
              <select
  value={gameMode}
  onChange={(e) =>
    setGameMode(e.target.value as "normal" | "handicap")
  }
  className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
>
  <option value="normal">⚔️ Combat Normal</option>
  <option value="handicap">🎲 Avec Handicaps</option>
</select>

            </div>
            <div className="text-left">
              <label className="block text-cyber-blue font-bold mb-2">Durée par Combat:</label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
              >
                <option value={0}>⏳ Pas de limite</option>
                <option value={60}>⏱️ 1 minute</option>
                <option value={90}>⏱️ 1 minute 30</option>
                <option value={120}>⏱️ 2 minutes</option>
                <option value={180}>⏱️ 3 minutes</option>
              </select>
            </div>
            <div className="text-left">
              <label className="block text-cyber-blue font-bold mb-2">Participants:</label>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                {players.map((p, i) => (
                  <div key={i} className="text-white">{p}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom du Je'daii..."
                  maxLength={20}
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  className="flex-1 p-2 sm:p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white"
                />
                <Button onClick={addParticipant}>+ Ajouter</Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button onClick={startTournament}>🚀 Lancer le Tournoi</Button>
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
      )}

      {/* Bracket */}
      {activeTab === "bracket" && (
        <div id="tournamentBracket">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-cyber-blue text-glow text-center">
            🏆 {tournamentName} 🏆
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {rounds.map((round, ri) => (
              <div key={ri}>
                <h3 className="text-cyber-blue font-bold mb-2">{ri === rounds.length - 1 ? "Finale" : `Round ${ri + 1}`}</h3>
                <div className="space-y-2">
                  {round.map((match, mi) => (
                    <div key={mi} className="flex justify-between items-center p-2 border border-cyber-blue/30 rounded bg-black/50">
                      <span className="text-white font-bold">{match.player1}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-white font-bold">{match.player2}</span>
                      {!match.winner && match.player1 !== "BYE" && match.player2 !== "BYE" ? (
                        <div className="flex gap-2">
                          <Button onClick={() => setMatchWinner(ri, mi, match.player1)}>✅ {match.player1}</Button>
                          <Button onClick={() => setMatchWinner(ri, mi, match.player2)}>✅ {match.player2}</Button>
                        </div>
                      ) : match.winner ? (
                        <span className="text-cyber-blue font-bold">🏅 {match.winner}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setActiveTab("results")}>📊 Classement</Button>
            <Button onClick={backToModeSelection} className="bg-red-600 text-white">← Retour</Button>
          </div>
        </div>
      )}

      {/* Results */}
      {activeTab === "results" && winner && (
        <div id="tournamentResults">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-cyber-blue text-glow text-center">🏆 Classement Final 🏆</div>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-6 text-center">
            <div className="text-white font-bold text-lg">🏅 {winner}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={shareToWhatsApp}>📱 WhatsApp</Button>
            <Button onClick={shareToTelegram}>✈️ Telegram</Button>
            <Button onClick={shareToDiscord}>🎮 Discord</Button>
            <Button onClick={backToModeSelection} className="bg-red-600 text-white">← Nouveau Tournoi</Button>
          </div>
        </div>
      )}
    </div>
  );
}

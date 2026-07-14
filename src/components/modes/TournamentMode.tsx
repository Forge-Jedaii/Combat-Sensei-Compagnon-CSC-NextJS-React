"use client";

import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import { secureShuffle } from "@/lib/game/random";
import { TournamentWorkflowRepository } from "@/repositories/tournament-workflow.repository";
import { useUserMode } from "@/components/context/UserModeContext";
import type { Json, MatchMode } from "@/types/database.types";
import FighterField from "../combat/FighterField";

interface Match {
  id: number;
  player1: string;
  player2: string;
  player1Key: string;
  player2Key: string;
  winner?: string;
  winnerKey?: string;
  score1?: number;
  score2?: number;
}

type Standing = { key: string; name: string; wins: number; losses: number; score: number };
type Workflow = { status: "bracket" | "results"; activeTab: "bracket" | "results"; name: string; type: "elimination" | "roundrobin"; gameMode: "normal" | "handicap"; timeLimit: number; rounds: Match[][]; winner: string | null; winnerKey: string | null; standings: Standing[] };
type Player = { key: string; name: string };

function eliminationRounds(source: Player[]) {
  const shuffled = secureShuffle(source);
  while ((shuffled.length & (shuffled.length - 1)) !== 0) shuffled.push({ key: "BYE", name: "BYE" });
  const first: Match[] = [];
  for (let index = 0; index < shuffled.length; index += 2) {
    const one = shuffled[index]; const two = shuffled[index + 1]; const byeWinner = one.key === "BYE" ? two : two.key === "BYE" ? one : null;
    first.push({ id: index / 2, player1: one.name, player2: two.name, player1Key: one.key, player2Key: two.key, winner: byeWinner?.name, winnerKey: byeWinner?.key, score1: byeWinner?.key === one.key ? 1 : 0, score2: byeWinner?.key === two.key ? 1 : 0 });
  }
  return [first];
}

function roundRobinRounds(source: Player[]) {
  const rotating = [...source];
  if (rotating.length % 2) rotating.push({ key: "BYE", name: "BYE" });
  const rounds: Match[][] = [];
  for (let round = 0; round < rotating.length - 1; round += 1) {
    const matches: Match[] = [];
    for (let index = 0; index < rotating.length / 2; index += 1) {
      const one = rotating[index]; const two = rotating[rotating.length - 1 - index]; const byeWinner = one.key === "BYE" ? two : two.key === "BYE" ? one : null;
      matches.push({ id: index, player1: one.name, player2: two.name, player1Key: one.key, player2Key: two.key, winner: byeWinner?.name, winnerKey: byeWinner?.key, score1: byeWinner?.key === one.key ? 1 : 0, score2: byeWinner?.key === two.key ? 1 : 0 });
    }
    rounds.push(matches);
    rotating.splice(1, 0, rotating.pop()!);
  }
  return rounds;
}

function tournamentStandings(rounds: Match[][]): Standing[] {
  const standings = new Map<string, Standing>();
  for (const match of rounds.flat()) {
    for (const player of [{ key: match.player1Key, name: match.player1, score: match.score1 ?? 0 }, { key: match.player2Key, name: match.player2, score: match.score2 ?? 0 }]) {
      if (player.key === "BYE") continue;
      const standing = standings.get(player.key) ?? { key: player.key, name: player.name, wins: 0, losses: 0, score: 0 };
      standing.score += player.score;
      if (match.winnerKey) {
        if (match.winnerKey === player.key) standing.wins += 1;
        else standing.losses += 1;
      }
      standings.set(player.key, standing);
    }
  }
  return [...standings.values()].sort((left, right) => right.wins - left.wins || right.score - left.score || left.losses - right.losses || left.name.localeCompare(right.name));
}

export default function TournamentMode({ onBack }: { onBack?: () => void }) {
  const repository = React.useMemo(() => new TournamentWorkflowRepository(), []);
  const { mode, fighterId } = useUserMode();
  const [activeTab, setActiveTab] = useState<"setup" | "bracket" | "results">("setup");
  const [tournamentName, setTournamentName] = useState("Tournoi de la Forge");
  const [tournamentType, setTournamentType] = useState<"elimination" | "roundrobin">("elimination");
  const [gameMode, setGameMode] = useState<"normal" | "handicap">("normal");
  const [timeLimit, setTimeLimit] = useState<number>(0);

  const [players, setPlayers] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [rounds, setRounds] = useState<Match[][]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    if (mode !== "authenticated") return;
    void repository.latest().then((saved) => {
      if (!saved) return;
      const tournament = saved.tournament as { id: string; settings: { workflow?: Workflow } } | undefined;
      const state = tournament?.settings?.workflow;
      if (!tournament || !state) return;
      setTournamentId(tournament.id); setTournamentName(state.name); setTournamentType(state.type); setGameMode(state.gameMode); setTimeLimit(state.timeLimit); setRounds(state.rounds); setWinner(state.winner); setStandings(state.standings ?? tournamentStandings(state.rounds)); setPlayers([...new Set(state.rounds.flatMap((round) => round.flatMap((match) => [match.player1, match.player2])).filter((name) => name !== "BYE"))]); setActiveTab(state.activeTab);
    }).catch((error) => window.alert(error instanceof Error ? error.message : "Le tournoi n’a pas pu être repris."));
  }, [mode, repository]);

  // Ajouter un participant
  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    setPlayers([...players, newParticipant.trim()]);
    setNewParticipant("");
  };

  // Mélanger les joueurs
  // Générer le premier tour
  // Lancer le tournoi
  const startTournament = async () => {
    if (players.length < 2) return alert("⚠️ Il faut au moins 2 participants !");
    if (mode !== "authenticated") return alert("Connectez-vous pour créer un tournoi persistant.");
    if (new Set(players.map((name) => name.toLocaleLowerCase())).size !== players.length) return alert("Chaque participant doit avoir un nom unique.");
    const participantRecords = players.map((name) => ({ key: fighterId(name) ?? crypto.randomUUID(), name, user_id: fighterId(name) ?? null }));
    const generated = tournamentType === "roundrobin" ? roundRobinRounds(participantRecords) : eliminationRounds(participantRecords);
    const state: Workflow = { status: "bracket", activeTab: "bracket", name: tournamentName, type: tournamentType, gameMode, timeLimit, rounds: generated, winner: null, winnerKey: null, standings: tournamentStandings(generated) };
    setSaving(true);
    try {
      const saved = await repository.create({ name: tournamentName, type: tournamentType === "roundrobin" ? "round_robin" : "single_elimination", gameMode: (gameMode === "handicap" ? "handicap" : "tournament") as MatchMode, durationSeconds: timeLimit, participants: participantRecords as unknown as Json, workflow: state as unknown as Json });
      const tournament = saved.tournament as { id: string };
      setTournamentId(tournament.id); setRounds(generated); setActiveTab("bracket");
    } catch (error) { alert(error instanceof Error ? error.message : "Le tournoi n’a pas pu être créé."); }
    finally { setSaving(false); }
  };

  // Définir le gagnant d'un match
  const setMatchWinner = async (roundIndex: number, matchId: number, win: string) => {
    if (!tournamentId || saving) return;
    const updatedRounds = structuredClone(rounds);
    const match = updatedRounds[roundIndex][matchId];
    match.winner = win;
    match.winnerKey = win === match.player1 ? match.player1Key : match.player2Key;
    match.score1 = win === match.player1 ? 1 : 0; match.score2 = win === match.player2 ? 1 : 0;
    updatedRounds[roundIndex] = updatedRounds[roundIndex].map((m, i) =>
      i === matchId ? match : m
    );
    const next = advanceWinner(roundIndex, updatedRounds);
    const finalWinner = next.winner;
    const nextStandings = tournamentStandings(next.rounds);
    const state: Workflow = { status: finalWinner ? "results" : "bracket", activeTab: finalWinner ? "results" : "bracket", name: tournamentName, type: tournamentType, gameMode, timeLimit, rounds: next.rounds, winner: finalWinner?.name ?? null, winnerKey: finalWinner?.key ?? null, standings: nextStandings };
    setSaving(true);
    try { await repository.progress(tournamentId, { workflow: state, round: roundIndex + 1, position: matchId + 1, playerOneKey: match.player1Key, playerTwoKey: match.player2Key, winnerKey: match.winnerKey, scoreOne: match.score1, scoreTwo: match.score2 }); setRounds(next.rounds); setWinner(state.winner); setStandings(nextStandings); setActiveTab(state.activeTab); window.dispatchEvent(new Event("csc:data-refresh")); }
    catch (error) { alert(error instanceof Error ? error.message : "Le résultat n’a pas pu être enregistré."); }
    finally { setSaving(false); }
  };

  const advanceWinner = (roundIndex: number, sourceRounds: Match[][]): { rounds: Match[][]; winner: Player | null } => {
    if (tournamentType === "roundrobin") {
      if (!sourceRounds.flat().every((match) => match.winnerKey)) return { rounds: sourceRounds, winner: null };
      const scores = new Map<string, { name: string; wins: number }>();
      sourceRounds.flat().forEach((match) => { if (match.winnerKey && match.winnerKey !== "BYE") { const current = scores.get(match.winnerKey) ?? { name: match.winner!, wins: 0 }; current.wins += match.player1Key === "BYE" || match.player2Key === "BYE" ? 0 : 1; scores.set(match.winnerKey, current); } });
      const champion = [...scores.entries()].sort((left, right) => right[1].wins - left[1].wins || left[1].name.localeCompare(right[1].name))[0];
      return { rounds: sourceRounds, winner: champion ? { key: champion[0], name: champion[1].name } : null };
    }
    const currentRound = sourceRounds[roundIndex];
    if (currentRound.every((m) => m.winner)) {
      const winners = currentRound.map((m) => m.winner!);
      if (winners.length === 1) {
        const finalMatch = currentRound[0];
        return { rounds: sourceRounds, winner: { key: finalMatch.winnerKey!, name: finalMatch.winner! } };
      } else {
        const nextRound: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) {
          const first = currentRound[i]?.winnerKey ? { key: currentRound[i].winnerKey!, name: winners[i] } : { key: "BYE", name: "BYE" };
          const secondMatch = currentRound[i + 1]; const second = secondMatch?.winnerKey ? { key: secondMatch.winnerKey, name: winners[i + 1] } : { key: "BYE", name: "BYE" };
          const byeWinner = first.key === "BYE" ? second : second.key === "BYE" ? first : null;
          nextRound.push({ id: i / 2, player1: first.name, player2: second.name, player1Key: first.key, player2Key: second.key, winner: byeWinner?.name, winnerKey: byeWinner?.key, score1: byeWinner?.key === first.key ? 1 : 0, score2: byeWinner?.key === second.key ? 1 : 0 });
        }
        return { rounds: [...sourceRounds, nextRound], winner: null };
      }
    }
    return { rounds: sourceRounds, winner: null };
  };

  const backToModeSelection = () => {
    setActiveTab("setup");
    setRounds([]);
    setWinner(null);
    setStandings([]);
    setTournamentId(null);
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
                <FighterField
                  label="Ajouter un participant"
                  placeholder="Nom du Je'daii..."
                  value={newParticipant}
                  onChange={setNewParticipant}
                  excludedNames={players}
                  className="border-2 border-cyber-blue"
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
                        <span className="text-cyber-blue font-bold">🏅 {match.winner} · {match.score1 ?? 0}-{match.score2 ?? 0}</span>
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
            {standings.map((standing, index) => <div key={standing.key} className="text-white font-bold text-lg">{index + 1}. {standing.name} · {standing.wins} V · {standing.losses} D · {standing.score} pts</div>)}
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

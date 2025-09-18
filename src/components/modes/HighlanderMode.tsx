"use client";

import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import CombatArea from "../combat/CombatArea";

interface HighlanderData {
  championName: string;
  championHP: number;
  healingAmount: number;
  opponents: string[];
  currentOpponentIndex: number;
  defeatedOpponents: string[];
  timeLimit: number;
  isActive: boolean;
}

export default function HighlanderMode({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<"setup" | "progress" | "combat" | "results">("setup");
  const [data, setData] = useState<HighlanderData>({
    championName: "",
    championHP: 10,
    healingAmount: 2,
    opponents: [],
    currentOpponentIndex: 0,
    defeatedOpponents: [],
    timeLimit: 120,
    isActive: false,
  });

  const [player1HP, setPlayer1HP] = useState(10);
  const [player2HP, setPlayer2HP] = useState(10);
  const [player2Name, setPlayer2Name] = useState("");
  const [nextChampionHP, setNextChampionHP] = useState<number | null>(null);
  const [isStartingHighlander, setIsStartingHighlander] = useState(false);

  const addOpponent = (name: string) => {
    if (!name.trim() || data.opponents.includes(name) || data.opponents.length >= 8) return;
    setData(prev => ({ ...prev, opponents: [...prev.opponents, name] }));
  };

  const removeOpponent = (name: string) => {
    setData(prev => ({ ...prev, opponents: prev.opponents.filter(op => op !== name) }));
  };

  const startHighlander = (championName: string, healing: number, timeLimit: number) => {
  if (data.opponents.length < 2) {
    alert("⚠️ Il faut au moins 2 adversaires !");
    return;
  }

  const shuffled = [...data.opponents].sort(() => Math.random() - 0.5);

  setData(prev => ({
    ...prev,
    championName: championName || "Champion",
    healingAmount: healing,
    timeLimit,
    championHP: 10,
    currentOpponentIndex: 0,
    defeatedOpponents: [],
    opponents: shuffled,
    isActive: true,
  }));

  setIsStartingHighlander(true);
};

useEffect(() => {
  if (!isStartingHighlander) return;

  setPlayer1HP(10);
  setPlayer2HP(10);
  setStep("progress");
  setIsStartingHighlander(false);
}, [isStartingHighlander, data]);


const [isNextFightRequested, setIsNextFightRequested] = useState(false);

useEffect(() => {
  if (!isNextFightRequested || step !== "progress") return;

  const nextOpponent = data.opponents[data.currentOpponentIndex];
  setPlayer2Name(nextOpponent);
  setPlayer1HP(nextChampionHP ?? data.championHP);
  setPlayer2HP(10);
  setStep("combat");

  setIsNextFightRequested(false);
  setNextChampionHP(null);
}, [isNextFightRequested, step, data.opponents, data.currentOpponentIndex, data.championHP, nextChampionHP,]);

const handleCombatEnd = (winner: string) => {
  if (winner === data.championName) {
    const nextIndex = data.currentOpponentIndex + 1;
    const isLast = nextIndex >= data.opponents.length;
    const newHP = Math.min(player1HP + data.healingAmount, 10);
    setNextChampionHP(newHP);

    setData(prev => ({
      ...prev,
      championHP: newHP,
      defeatedOpponents: [...prev.defeatedOpponents, prev.opponents[prev.currentOpponentIndex]],
      currentOpponentIndex: nextIndex,
    }));

    if (isLast) {
      setStep("results");
    } else {
      setStep("progress");
    }
  } else {
    setData(prev => ({ ...prev, championHP: 0 }));
    setStep("results");
  }
};

const resetHighlander = () => {
  setData({
    championName: "",
    championHP: 10,
    healingAmount: 2,
    opponents: [],
    currentOpponentIndex: 0,
    defeatedOpponents: [],
    timeLimit: 120,
    isActive: false,
  });

  setPlayer1HP(10);
  setPlayer2HP(10);
  setPlayer2Name("");
  setNextChampionHP(null);
  setIsStartingHighlander(false);
  setIsNextFightRequested(false);
  setStep("setup");
};



  return (
    <div className="max-w-3xl mx-auto p-6 bg-black/40 border border-red-400/40 rounded-xl box-glow">
      {step === "setup" && (
        <div>
          <h2 className="text-red-400 text-2xl font-bold text-glow mb-6 text-center">🔥 Configuration Highlander 🔥</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-red-400 font-bold mb-2">👑 Nom du Champion :</label>
              <input
                type="text"
                value={data.championName}
                onChange={e => setData(prev => ({ ...prev, championName: e.target.value }))}
                className="w-full p-2 bg-black/70 border-2 border-red-400 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-red-400 font-bold mb-2">💚 PV récupérés entre combats :</label>
              <select
                value={data.healingAmount}
                onChange={e => setData(prev => ({ ...prev, healingAmount: parseInt(e.target.value) }))}
                className="w-full p-2 bg-black/70 border-2 border-red-400 rounded-lg text-white"
              >
                <option value={0}>☠️ Mode Hardcore (0 PV)</option>
                <option value={2}>⚔️ Mode Normal (2 PV)</option>
                <option value={3}>🛡️ Mode Facile (3 PV)</option>
                <option value={5}>💪 Mode Entraînement (5 PV)</option>
                <option value={10}>🌟 Mode Récupération Complète (10 PV)</option>
              </select>
            </div>
            <div>
              <label className="block text-red-400 font-bold mb-2">Durée par combat :</label>
              <select
                value={data.timeLimit}
                onChange={e => setData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="w-full p-2 bg-black/70 border-2 border-red-400 rounded-lg text-white"
              >
                <option value={0}>⏳ Pas de limite</option>
                <option value={60}>⏱️ 1 minute</option>
                <option value={90}>⏱️ 1 minute 30</option>
                <option value={120}>⏱️ 2 minutes</option>
                <option value={180}>⏱️ 3 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-red-400 font-bold mb-2">⚔️ Adversaires :</label>
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {data.opponents.map((op, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/50 border border-red-400 rounded-lg px-3 py-2">
                    <span className="text-red-400 font-bold">{op}</span>
                    <button onClick={() => removeOpponent(op)} className="text-red-400 hover:text-red-300 font-bold">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom de l'adversaire..."
                  className="flex-1 p-2 bg-black/70 border-2 border-red-400 rounded-lg text-white"
                  id="newOpponentInput"
                />
                <Button onClick={() => {
                  const input = document.getElementById("newOpponentInput") as HTMLInputElement;
                  addOpponent(input.value);
                  input.value = "";
                }}>+ Ajouter</Button>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center mt-6">
            <Button onClick={() => startHighlander(data.championName, data.healingAmount, data.timeLimit)}>🔥 Commencer l&apos;Épreuve</Button>
            <Button onClick={onBack}>← Retour</Button>
          </div>
        </div>
      )}

      {step === "progress" && (
        <div>
          <h2 className="text-red-400 text-2xl font-bold text-glow mb-6 text-center">🔥 Highlander - Progression 🔥</h2>
          <div className="bg-black/80 rounded-xl p-4 mb-6 border-2 border-red-400 box-glow text-center">
            <div className="text-red-400 font-bold mb-2">👑 CHAMPION</div>
            <div className="text-white font-bold text-xl">{data.championName} - {data.championHP} PV</div>
            <div className="text-cyber-blue font-bold mt-2">⚔️ {data.defeatedOpponents.length}/{data.opponents.length} adversaires vaincus</div>
          </div>
          <div className="bg-black/80 rounded-xl p-4 mb-6 border-2 border-red-400 box-glow">
            <div className="text-red-400 font-bold mb-4 text-center">⚔️ ADVERSAIRES</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.opponents.map((op, i) => {
                const status = data.defeatedOpponents.includes(op)
                  ? "💀 Vaincu"
                  : i === data.currentOpponentIndex
                    ? "⚔️ Prochain adversaire"
                    : "⏳ En attente";
                const statusColor = data.defeatedOpponents.includes(op)
                  ? "text-gray-500 border-gray-500"
                  : i === data.currentOpponentIndex
                    ? "text-orange-400 border-orange-400"
                    : "text-cyan-400 border-cyan-400";
                return (
                  <div key={i} className={`flex justify-between items-center bg-black/60 border-2 ${statusColor} rounded-lg px-3 py-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{status.split(" ")[0]}</span>
                      <span className="font-bold">{op}</span>
                    </div>
                    <span className="text-sm">{status.split(" ").slice(1).join(" ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setIsNextFightRequested(true)}>⚔️ Prochain Combat</Button>
            <Button onClick={onBack}>← Abandonner</Button>
          </div>
        </div>
      )}

      {step === "combat" && (
        <div className="fixed inset-0 z-50">
          <CombatArea
            key={`fight-${data.currentOpponentIndex}`}
            player1={data.championName}
            player1HP={player1HP}
            onPlayer1HPChange={setPlayer1HP}
            player2={player2Name}
            player2HP={player2HP}
            onPlayer2HPChange={setPlayer2HP}
            duration={data.timeLimit}
            onEnd={handleCombatEnd}
            mode="highlander"
          />
        </div>
      )}


      {step === "results" && (
        <div className="text-center">
          <h2 className="text-red-400 text-2xl font-bold text-glow mb-6">🔥 Résultat Highlander 🔥</h2>
          {data.championHP > 0 ? (
            <div className="text-cyber-blue font-bold text-xl mb-4">
              🏆 {data.championName} a survécu à tous les adversaires !
            </div>
          ) : (
            <div className="text-red-500 font-bold text-xl mb-4">
              ❌ {data.championName} a été éliminé par {data.opponents[data.currentOpponentIndex]}
            </div>
          )}
          <div className="flex gap-4 justify-center mb-4">
            <Button onClick={() => window.alert("Partager sur WhatsApp")}>📱 WhatsApp</Button>
            <Button onClick={() => window.alert("Partager sur Telegram")}>✈️ Telegram</Button>
            <Button onClick={() => window.alert("Partager sur Discord")}>🎮 Discord</Button>
          </div>
          <Button onClick={resetHighlander}>← Nouveau Défi</Button>
        </div>
      )}
    </div>
  );
}

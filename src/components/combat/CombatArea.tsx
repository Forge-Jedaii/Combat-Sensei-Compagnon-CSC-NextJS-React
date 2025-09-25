"use client";

import React, { useState, useEffect } from "react";
import Timer from "../ui/Timer";
import UndoHit from "../ui/UndoHit";
import { toPng } from "html-to-image";
import { processCombatResult } from "@/lib/game/rankings";

type CombatAreaProps = {
  player1: string;
  player2: string;
  duration: number;
  onEnd: (winner: string) => void
  mode?: "classic" | "highlander";

  // Props optionnelles pour Highlander
  player1HP?: number;
  onPlayer1HPChange?: (hp: number) => void;
  player2HP?: number;
  onPlayer2HPChange?: (hp: number) => void;
  onCombatEnd?: (winner: string) => void;
};

type LastHit = {
  target: "left" | "right";
  previousHp1: number;
  previousHp2: number;
};

type Fault = {
  player: string;
  type: "jaune" | "rouge" | "noir";
  reason: string;
  time: string;
};

export default function CombatArea({
  player1,
  player2,
  duration,
  onEnd,
  mode,
  player1HP,
  onPlayer1HPChange,
  player2HP,
  onPlayer2HPChange,
}: CombatAreaProps) {
  const [hp1, setHp1] = useState(10);
  const [hp2, setHp2] = useState(10);
  const [winner, setWinner] = useState<string | null>(null);
  const [hitHistory, setHitHistory] = useState<LastHit[]>([]);

  // Fautes
  const [fautes, setFautes] = useState<Fault[]>([]);
  const [showFautes, setShowFautes] = useState(false);
  const [showAttribution, setShowAttribution] = useState<{
    target: "left" | "right";
    type: Fault["type"];
  } | null>(null);
  const [reason, setReason] = useState("zone");
  const jaunesCount = React.useRef({ left: 0, right: 0 });

  // Timer
  const [paused, setPaused] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Gestion des touches
  const handleHit = (target: "left" | "right") => {
    if (winner) return;
    setHitHistory((prev) => {
      const newHistory = [...prev, { target, previousHp1: hp1, previousHp2: hp2 }];
      return newHistory.slice(-2);
    });
    if (target === "left") setHp1((prev) => Math.max(prev - 1, 0));
    else setHp2((prev) => Math.max(prev - 1, 0));
  };

  // Confirmer une faute depuis la modal
  const confirmFaute = () => {
    if (!showAttribution) return;
    const { target, type } = showAttribution;
    const playerName = target === "left" ? player1 : player2;
    const time = new Date().toLocaleTimeString();

    const newFault: Fault = { player: playerName, type, reason, time };
    setFautes((prev) => [...prev, newFault]);

    // Règles
    if (type === "jaune") {
      jaunesCount.current[target] += 1;
      if (jaunesCount.current[target] >= 2) {
        if (target === "left") setHp1((h) => Math.max(h - 1, 0));
        else setHp2((h) => Math.max(h - 1, 0));
        jaunesCount.current[target] = 0;
      }
    }
    if (type === "rouge") {
      setWinner(target === "left" ? player2 : player1);
      onEnd(target === "left" ? player2 : player1);
    }
    if (type === "noir") {
      setWinner((target === "left" ? player2 : player1) + " (victoire par disqualification)");
      onEnd(target === "left" ? player2 : player1);
    }

    setShowAttribution(null);
  };

  // Sync highlander
  useEffect(() => {
    if (mode === "highlander" && onPlayer1HPChange) onPlayer1HPChange(hp1);
  }, [hp1, mode, onPlayer1HPChange]);

  useEffect(() => {
    if (mode === "highlander" && onPlayer2HPChange) onPlayer2HPChange(hp2);
  }, [hp2, mode, onPlayer2HPChange]);

  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current && mode === "highlander") {
      if (typeof player1HP === "number") setHp1(player1HP);
      if (typeof player2HP === "number") setHp2(player2HP);
      initialized.current = true;
    }
  }, [mode, player1HP, player2HP]);

  useEffect(() => {
    if (winner) return;
    if (hp1 === 0) {
      setWinner(player2);
      if (mode === "highlander") onEnd(player2);
    } else if (hp2 === 0) {
      setWinner(player1);
      if (mode === "highlander") onEnd(player1);
    }
  }, [hp1, hp2, winner, mode, onEnd, player1, player2]);

  const handleUndo = () => {
    if (hitHistory.length === 0 || winner) return;
    const lastState = hitHistory[hitHistory.length - 1];
    setHp1(lastState.previousHp1);
    setHp2(lastState.previousHp2);
    setWinner(null);
    setHitHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-[100vh] relative bg-black/10">
      {/* HUD */}
      <div className="fixed top-0 left-0 w-full flex flex-col gap-2 py-2 px-4 bg-black/30 backdrop-blur-md z-50 border-b border-cyber-blue/30">
        <div className="flex justify-center items-center gap-3">
          <div className="text-cyber-blue font-bold text-xl font-mono text-glow px-4 py-1 bg-black/40 border border-cyber-blue/40 rounded">
            {duration > 0 ? (
              <Timer
                key={resetKey}
                duration={duration}
                paused={paused}
                onEnd={() => {
                  setWinner("⏳ Temps écoulé");
                  if (mode === "highlander") onEnd("⏳ Temps écoulé");
                }}
                compact
              />
            ) : "∞"}
          </div>
          <button onClick={() => setPaused((p) => !p)} className="w-10 h-10 flex justify-center items-center bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-full">
            {paused ? "▶️" : "⏸"}
          </button>
          <button onClick={() => setResetKey((k) => k + 1)} className="w-10 h-10 flex justify-center items-center bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-full">🔄</button>
          <button onClick={() => onEnd("")} className="w-10 h-10 flex justify-center items-center bg-cyber-navy/20 border border-cyber-navy text-cyber-navy rounded-full">🏠</button>
          <button onClick={() => setShowFautes(true)} className="px-3 py-1 bg-purple-500/30 text-purple-400 border border-purple-500 rounded">📋 Historique</button>
        </div>
      </div>

      {/* Zones */}
      <div className="flex flex-1 pt-24">
        <div onClick={() => handleHit("left")} className="flex-1 flex justify-center items-center cursor-pointer bg-green-zone border-r-2 border-cyber-blue active:scale-95 transition-all">
          <p className="text-white text-7xl font-extrabold text-glow">{hp1}</p>
        </div>
        <div onClick={() => handleHit("right")} className="flex-1 flex justify-center items-center cursor-pointer bg-gold-zone border-l-2 border-cyber-blue active:scale-95 transition-all">
          <p className="text-white text-7xl font-extrabold text-glow">{hp2}</p>
        </div>
      </div>

      {/* Fautes Cards */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 border-t border-cyber-blue/30">
        {[{ side: "left", name: player1, color: "text-green-400 border-green-400" },
          { side: "right", name: player2, color: "text-yellow-400 border-yellow-400" }]
          .map(({ side, name, color }) => (
          <div key={side} className={`bg-black/60 rounded-lg p-3 border ${color}`}>
            <div className={`${color} font-bold mb-2 text-center`}>{name}</div>
            <div className="flex justify-center gap-1 mb-2">
              {fautes.filter(f => f.player === name).map((f, i) => (
                <span key={i} className={
                  f.type === "jaune" ? "text-yellow-400" :
                  f.type === "rouge" ? "text-red-500" : "text-gray-200"
                }>
                  {f.type === "jaune" ? "🟨" : f.type === "rouge" ? "🟥" : "⬛"}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setShowAttribution({ target: side as "left"|"right", type: "jaune" })} className="bg-yellow-500/20 text-yellow-400 border border-yellow-400 px-2 py-1 rounded text-xs font-bold">⚡ Jaune</button>
              <button onClick={() => setShowAttribution({ target: side as "left"|"right", type: "rouge" })} className="bg-red-500/20 text-red-400 border border-red-400 px-2 py-1 rounded text-xs font-bold">⚡ Rouge</button>
              <button onClick={() => setShowAttribution({ target: side as "left"|"right", type: "noir" })} className="col-span-2 bg-gray-500/20 text-gray-400 border border-gray-400 px-2 py-1 rounded text-xs font-bold">⚡ Noir</button>
            </div>
          </div>
        ))}
      </div>

      {/* Undo */}
      <div className="flex justify-center p-3 bg-black/20 border-t border-cyber-blue/30">
        <UndoHit onUndo={handleUndo} disabled={hitHistory.length === 0 || !!winner} text="↻ Annuler la dernière touche" />
      </div>

      {/* Modal Attribution */}
      {showAttribution && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue max-w-md w-full text-center">
            <h2 className="text-cyber-blue text-xl font-bold mb-4">⚡ Attribution de Faute ⚡</h2>
            <p className="text-white font-bold mb-2">
              {showAttribution.target === "left" ? player1 : player2}
            </p>
            <p className={
              showAttribution.type === "jaune" ? "text-yellow-400" :
              showAttribution.type === "rouge" ? "text-red-500" : "text-gray-200"
            }>
              {showAttribution.type === "jaune" ? "🟨 Jaune" : showAttribution.type === "rouge" ? "🟥 Rouge" : "⬛ Noir"}
            </p>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 bg-black/70 border-2 border-cyber-blue rounded-lg text-white mt-4">
              <option value="zone">🚫 Sortie de zone répétée</option>
              <option value="technique">⚔️ Technique interdite</option>
              <option value="antigame">🐌 Anti-jeu</option>
              <option value="respect">😤 Non respect</option>
            </select>
            <div className="flex gap-3 mt-6">
              <button onClick={confirmFaute} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg">⚡ Confirmer</button>
              <button onClick={() => setShowAttribution(null)} className="flex-1 bg-gray-500 text-white font-bold py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showFautes && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue max-w-2xl w-full text-center">
            <h2 className="text-cyber-blue text-2xl font-bold mb-4">📋 Historique des Fautes 📋</h2>
            <div className="max-h-[70vh] overflow-y-auto space-y-2">
              {fautes.length === 0 && <p className="text-gray-300">Aucune faute enregistrée</p>}
              {fautes.map((f, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-black/40 border border-cyber-blue/30 rounded">
                  <span className="text-white font-bold">{f.player}</span>
                  <span className={
                    f.type === "jaune" ? "text-yellow-400 font-bold" :
                    f.type === "rouge" ? "text-red-500 font-bold" :
                    "text-gray-200 font-bold"
                  }>
                    {f.type === "jaune" ? "🟨" : f.type === "rouge" ? "🟥" : "⬛"} {f.reason}
                  </span>
                  <span className="text-sm text-gray-400">{f.time}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowFautes(false)} className="mt-4 w-full bg-red-600 text-white font-bold py-2 rounded-lg">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Fin Combat */}
      {winner && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue max-w-md w-full text-center">
            <div id="result-card" className="mb-6">
              <h2 className="text-cyber-blue text-2xl font-bold mb-3">⚔️ Résultat du combat</h2>
              <p className="text-white">{player1} : {hp1} PV</p>
              <p className="text-white">{player2} : {hp2} PV</p>
              <p className="text-cyber-blue font-bold mt-3">
                {winner === "⏳ Temps écoulé" ? winner : `🏆 Victoire de ${winner}`}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                const card = document.getElementById("result-card");
                if (card) {
                  const dataUrl = await toPng(card);
                  const newWindow = window.open();
                  if (newWindow) newWindow.document.write(`<img src="${dataUrl}" style="width:100%;height:auto;" />`);
                }
              }} className="w-full bg-cyan-600 px-4 py-2 rounded-lg font-bold">📸 Voir en PNG</button>
              <button onClick={() => {
                const text = `⚔️ Résultat du combat\n${player1}: ${hp1} PV\n${player2}: ${hp2} PV\n🏆 Vainqueur : ${winner}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }} className="w-full bg-green-600 px-4 py-2 rounded-lg font-bold">📱 WhatsApp</button>
              <button onClick={async () => {
                const text = `⚔️ Résultat du combat\n${player1}: ${hp1} PV\n${player2}: ${hp2} PV\n🏆 Vainqueur : ${winner}`;
                await navigator.clipboard.writeText(text);
                alert("✅ Résultat copié ! Collez-le dans Discord 🚀");
              }} className="w-full bg-indigo-600 px-4 py-2 rounded-lg font-bold">🎮 Discord</button>
              <button onClick={() => onEnd("")} className="w-full bg-red-600 px-4 py-2 rounded-lg font-bold">❌ Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

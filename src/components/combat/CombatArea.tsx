"use client";

import React, { useState, useEffect } from "react";
import Timer from "../ui/Timer";
import UndoHit from "../ui/UndoHit";
import FaultSystem from "./FaultSystem";
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

      {/* Fault System */}
      <FaultSystem 
        player1={player1}
        player2={player2}
        onFaultPenalty={(target, penaltyType, winner) => {
          if (penaltyType === "hp") {
            if (target === "left") setHp1((h) => Math.max(h - 1, 0));
            else setHp2((h) => Math.max(h - 1, 0));
          } else if (penaltyType === "disqualification") {
            setWinner(winner || (target === "left" ? player2 : player1));
            onEnd(winner || (target === "left" ? player2 : player1));
          }
        }}
      />

      {/* Undo */}
      <div className="flex justify-center p-3 bg-black/20 border-t border-cyber-blue/30">
        <UndoHit onUndo={handleUndo} disabled={hitHistory.length === 0 || !!winner} text="↻ Annuler la dernière touche" />
      </div>

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
              }} className="w-full bg-indigo-600 px-4 py-2 rounded-lg font-bold">📎 Discord</button>
              <button onClick={() => onEnd("")} className="w-full bg-red-600 px-4 py-2 rounded-lg font-bold">❌ Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
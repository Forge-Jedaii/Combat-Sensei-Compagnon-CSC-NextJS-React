"use client";

import React, { useState, useEffect } from "react";
import Timer from "../ui/Timer";
import UndoHit from "../ui/UndoHit";
import FaultSystem from "./FaultSystem";
import { toPng } from "html-to-image";
import { usePersistentCombat } from "@/hooks/usePersistentCombat";
import type { PersistedCombat } from "@/repositories/combat-workflow.repository";
import type { MatchMode, MatchResultType } from "@/types/database.types";
import { useUserMode } from "@/components/context/UserModeContext";

type CombatAreaProps = {
  player1: string;
  player2: string;
  player1IdentityName?: string;
  player2IdentityName?: string;
  duration: number;
  onEnd: (winner: string) => void
  mode?: "classic" | "highlander";

  // Props optionnelles pour Highlander
  player1HP?: number;
  onPlayer1HPChange?: (hp: number) => void;
  player2HP?: number;
  onPlayer2HPChange?: (hp: number) => void;
  onCombatEnd?: (winner: string) => void;
  onResult?: (result: { winner: string; player1HP: number; player2HP: number }) => void;
  persistenceMode?: MatchMode;
  eventName?: string;
  tournamentId?: string;
  onPersistedResult?: (result: PersistedCombat) => void;
  persistenceSettings?: import("@/types/database.types").Json;
};

type LastHit = {
  target: "left" | "right";
  previousHp1: number;
  previousHp2: number;
};

export default function CombatArea({
  player1,
  player2,
  player1IdentityName,
  player2IdentityName,
  duration,
  onEnd,
  mode,
  player1HP,
  onPlayer1HPChange,
  player2HP,
  onPlayer2HPChange,
  onResult,
  persistenceMode,
  eventName,
  tournamentId,
  onPersistedResult,
  persistenceSettings,
}: CombatAreaProps) {
  const [hp1, setHp1] = useState(10);
  const [hp2, setHp2] = useState(10);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerPosition, setWinnerPosition] = useState<1 | 2 | null>(null);
  const [completionType, setCompletionType] = useState<MatchResultType>("health");
  const [hitHistory, setHitHistory] = useState<LastHit[]>([]);

  // Timer
  const [paused, setPaused] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const { mode: userMode, fighterId } = useUserMode();
  const persistentMode = userMode === "authenticated" ? persistenceMode : undefined;
  const persistence = usePersistentCombat({ duration, eventName, mode: persistentMode, player1, player1UserId: fighterId(player1IdentityName ?? player1), player1StartingHealth: player1HP, player2, player2UserId: fighterId(player2IdentityName ?? player2), player2StartingHealth: player2HP, settings: persistenceSettings, tournamentId });
  const completionStarted = React.useRef(false);

  // Gestion des touches
  const handleHit = (target: "left" | "right") => {
    if (winner || (persistentMode && !persistence.combat)) return;
    setHitHistory((prev) => {
      const newHistory = [...prev, { target, previousHp1: hp1, previousHp2: hp2 }];
      return newHistory.slice(-2);
    });
    if (target === "left") setHp1((prev) => { const next = Math.max(prev - 1, 0); void persistence.recordHealth(1, next, "hit", { damage: 1 }); return next; });
    else setHp2((prev) => { const next = Math.max(prev - 1, 0); void persistence.recordHealth(2, next, "hit", { damage: 1 }); return next; });
  };

  // Sync highlander
  useEffect(() => {
    if (mode === "highlander" && onPlayer1HPChange) onPlayer1HPChange(hp1);
  }, [hp1, mode, onPlayer1HPChange]);

  useEffect(() => {
    if (mode === "highlander" && onPlayer2HPChange) onPlayer2HPChange(hp2);
  }, [hp2, mode, onPlayer2HPChange]);

  const initialized = React.useRef(false);
  const persistenceInitialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current && mode === "highlander") {
      if (typeof player1HP === "number") setHp1(player1HP);
      if (typeof player2HP === "number") setHp2(player2HP);
      initialized.current = true;
    }
  }, [mode, player1HP, player2HP]);

  useEffect(() => {
    if (!persistence.combat || persistenceInitialized.current) return;
    const [first, second] = persistence.combat.participants;
    if (typeof first?.final_health === "number") setHp1(first.final_health);
    if (typeof second?.final_health === "number") setHp2(second.final_health);
    persistenceInitialized.current = true;
  }, [persistence.combat]);

  useEffect(() => {
    if (winner) return;
    if (hp1 === 0) {
      setWinner(player2);
      setWinnerPosition(2);
      setCompletionType("health");
      onResult?.({ winner: player2, player1HP: hp1, player2HP: hp2 });
      if (mode === "highlander") onEnd(player2);
    } else if (hp2 === 0) {
      setWinner(player1);
      setWinnerPosition(1);
      setCompletionType("health");
      onResult?.({ winner: player1, player1HP: hp1, player2HP: hp2 });
      if (mode === "highlander") onEnd(player1);
    }
  }, [hp1, hp2, winner, mode, onEnd, onResult, player1, player2]);

  useEffect(() => {
    if (!winner || completionStarted.current || !persistence.combat) return;
    completionStarted.current = true;
    void persistence.finish(winnerPosition, completionType).then((result) => {
      if (result) onPersistedResult?.(result);
    });
  }, [completionType, onPersistedResult, persistence, winner, winnerPosition]);

  const handleUndo = () => {
    if (hitHistory.length === 0 || winner) return;
    const lastState = hitHistory[hitHistory.length - 1];
    setHp1(lastState.previousHp1);
    setHp2(lastState.previousHp2);
    setWinner(null);
    void persistence.recordHealth(1, lastState.previousHp1, "undo", { target: lastState.target });
    void persistence.recordHealth(2, lastState.previousHp2, "undo", { target: lastState.target });
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
                  const timeWinner = hp1 === hp2 ? "Égalité" : hp1 > hp2 ? player1 : player2;
                  setWinner(timeWinner);
                  setWinnerPosition(hp1 === hp2 ? null : hp1 > hp2 ? 1 : 2);
                  setCompletionType(hp1 === hp2 ? "draw" : "time");
                  onResult?.({ winner: timeWinner, player1HP: hp1, player2HP: hp2 });
                  if (mode === "highlander") onEnd(timeWinner);
                }}
                compact
              />
            ) : "∞"}
          </div>
          <button type="button" aria-label={paused ? "Reprendre le chronomètre" : "Mettre le chronomètre en pause"} onClick={() => setPaused((p) => !p)} className="w-10 h-10 flex justify-center items-center bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded-full">
            {paused ? "▶️" : "⏸"}
          </button>
          <button type="button" aria-label="Réinitialiser le chronomètre" onClick={() => setResetKey((k) => k + 1)} className="w-10 h-10 flex justify-center items-center bg-cyber-purple/20 border border-cyber-purple text-cyber-purple rounded-full">🔄</button>
          <button type="button" aria-label="Quitter le combat" onClick={() => onEnd("")} className="w-10 h-10 flex justify-center items-center bg-cyber-navy/20 border border-cyber-navy text-cyber-navy rounded-full">🏠</button>
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
        onFaultPenalty={(target, penaltyType, winner, fault) => {
          void persistence.recordFault(target === "left" ? 1 : 2, {
            healthDelta: penaltyType === "hp" ? -1 : 0,
            penalty: penaltyType === "hp" ? "health" : "disqualification",
            reasonCode: fault.reason,
            reasonLabel: fault.reason,
            type: fault.type === "jaune" ? "yellow" : fault.type === "rouge" ? "red" : "black",
          });
          if (penaltyType === "hp") {
            if (target === "left") setHp1((h) => Math.max(h - 1, 0));
            else setHp2((h) => Math.max(h - 1, 0));
          } else if (penaltyType === "disqualification") {
            const resultWinner = winner || (target === "left" ? player2 : player1);
            setWinner(resultWinner);
            setWinnerPosition(target === "left" ? 2 : 1);
            setCompletionType("disqualification");
            onResult?.({ winner: resultWinner, player1HP: hp1, player2HP: hp2 });
            if (mode === "highlander") onEnd(resultWinner);
          }
        }}
      />
      {persistence.error && <p role="alert" className="bg-red-950/80 p-2 text-center text-xs text-red-300">{persistence.error}</p>}

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

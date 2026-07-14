"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useUserMode } from "@/components/context/UserModeContext";
import { logout } from "@/app/auth/actions";

export type SelectableMode =
  | "duel"
  | "officialDuel"
  | "handicap"
  | "tournament"
  | "highlander"
  | "battleRoyale";

interface ModeSelectionProps {
  onSelect: (mode: SelectableMode) => void;
}

interface ModeDefinition {
  key: SelectableMode;
  label: string;
  subtitle: string;
  guest: boolean;
  className: string;
}

const OfficialRules = dynamic(() => import("../regulations/OfficialRules"));
const FJRules = dynamic(() => import("../regulations/OfficialsFJ1vs1"));

const MODES = [
  {
    key: "duel",
    label: "⚔️ Duel 1vs1",
    subtitle: "Combat Épique",
    guest: true,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyber-blue border-2 border-cyan-400 hover:border-cyan-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
  {
    key: "officialDuel",
    label: "🏆 Duel Officiel",
    subtitle: "Écrivez la légende",
    guest: false,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-2 border-emerald-400 hover:border-emerald-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
  {
    key: "handicap",
    label: "🎲 Mode Handicap",
    subtitle: "Défis Aléatoires",
    guest: true,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border-2 border-orange-400 hover:border-orange-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
  {
    key: "tournament",
    label: "🎟️ Mode Tournoi",
    subtitle: "L'Appel de la Forge",
    guest: true,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-2 border-yellow-400 hover:border-yellow-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
  {
    key: "highlander",
    label: "🛡️ Mode Highlander",
    subtitle: "Il ne peut en rester qu'un",
    guest: true,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border-2 border-red-400 hover:border-red-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
  {
    key: "battleRoyale",
    label: "💥 Battle Royale",
    subtitle: "Chaos Total",
    guest: true,
    className: "group relative text-glow overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 border-2 border-purple-400 hover:border-purple-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95",
  },
] as const satisfies readonly ModeDefinition[];

export default function ModeSelection({ onSelect }: ModeSelectionProps) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [activeRule, setActiveRule] = useState<"csc" | "fj1vs1">("csc");

  const { mode, user } = useUserMode(); // "guest" | "authenticated"
  const isGuest = mode === "guest";

  const router = useRouter();

  const visibleModes = MODES.filter((mode) => !isGuest || mode.guest);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 space-y-12 overflow-y-auto hide-scrollbar">
      {/* ===== HEADER ===== */}
      <header className="space-y-4 pt-4">
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 animate-pulse">
          ⚔️
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyber-blue text-glow font-orbitron">
          Forge Je&apos;daii
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl font-orbitron">
          Combat Sensei Compagnon
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-orbitron">
          <p className="text-purple-400">Mode : {isGuest ? "Invité" : `Connecté · ${user?.name ?? "Membre"}`}</p>
          {!isGuest && (
            <form action={logout}>
              <button type="submit" className="rounded-lg border border-red-400/50 px-3 py-1.5 text-red-300 hover:bg-red-500/10">
                Se déconnecter
              </button>
            </form>
          )}
        </div>
      </header>

      {/* ===== MODES ===== */}
      <section className="max-w-5xl w-full">
        <h2 className="text-cyber-blue text-glow text-2xl sm:text-3xl font-bold mb-4 font-orbitron">
          🎮 MODES DE COMBAT
        </h2>
        <p className="text-gray-400 mb-8 font-orbitron">
          Choisissez votre style de combat préféré
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {visibleModes.map((mode) => (
            <button
              type="button"
              key={mode.key}
              onClick={() => onSelect(mode.key)}
              className={`${mode.className} min-h-[180px] flex flex-col items-center justify-center text-center`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10">
                <div className="text-4xl mb-3">{mode.label.split(" ")[0]}</div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron">
                  {mode.label.substring(2)}
                </h3>
                <p className="text-sm text-gray-300 font-orbitron">
                  {mode.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* ===== OUTILS & RESSOURCES ===== */}
        <section className="mt-16">
          <h2 className="text-cyber-blue text-glow text-2xl sm:text-3xl font-bold mb-4 font-orbitron">
            🛠️ OUTILS & RESSOURCES
          </h2>
          <p className="text-gray-400 mb-8 font-orbitron">
            Règlements, statistiques et archives
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Règlements */}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="group relative w-full overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-400 border-2 border-cyan-400 hover:border-cyan-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95 min-h-[140px] flex flex-col items-center justify-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3 text-glow">📜</div>
                <h3 className="text-xl text-glow font-bold text-white mb-2 font-orbitron">
                  Règlements Officiels
                </h3>
                <div className="text-xs sm:text-sm text-cyan-300/80 font-orbitron">
                  Code de la Forge
                </div>
                <div className="text-xs text-cyan-200/60 mt-1 font-orbitron">
                  Règles • Fautes • Modes
                </div>
              </div>
            </button>

            {/* Archives */}
            <button
              type="button"
              onClick={() => router.push("/archives")}
              className="group relative w-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 border-2 border-purple-400 hover:border-purple-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95 min-h-[140px] flex flex-col items-center justify-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3 text-glow">🏛️</div>
                <h3 className="text-xl text-glow font-bold text-white mb-2 font-orbitron">
                  Archives de la Forge
                </h3>
                <div className="text-xs sm:text-sm text-purple-300/80 font-orbitron">
                  Base de Données
                </div>
                <div className="text-xs text-purple-200/60 mt-1 font-orbitron">
                  Classements • Profils • Stats
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ===== SÉPARATEUR ===== */}
        <hr className="w-full max-w-3xl mx-auto my-12 border-cyber-blue/30" />

        {/* ===== FOOTER ===== */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">
            <span className="text-cyber-blue font-semibold">Version 0.2.1</span>{" "}
            •<span> Forge Je&apos;daii Academy</span> •<span> © 2026</span>
          </div>
          <div className="text-xs text-gray-500">
            ⚔️ Que la Force soit avec vous ! ⚔️
          </div>
        </div>
      </section>

      {/* ===== MODALE RÈGLEMENTS ===== */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-dialog-title"
            className="bg-gray-900 border-2 border-cyber-blue rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-cyber-blue/20">
              <div className="flex items-center justify-between">
                <h2 id="rules-dialog-title" className="text-cyber-blue text-2xl font-bold text-glow">
                  📜 Règlement Officiel
                </h2>
                <button
                  type="button"
                  aria-label="Fermer le règlement"
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex space-x-4 mt-4 border-b border-cyber-blue/40">
                <button
                  onClick={() => setActiveRule("csc")}
                  className={`relative px-4 py-2 font-bold font-orbitron ${
                    activeRule === "csc"
                      ? "text-cyan-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Règlements du CSC
                  {activeRule === "csc" && (
                    <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveRule("fj1vs1")}
                  className={`relative px-4 py-2 font-bold font-orbitron ${
                    activeRule === "fj1vs1"
                      ? "text-cyan-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Règlements officiel FJ 1vs1
                  {activeRule === "fj1vs1" && (
                    <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] rounded-full"></span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeRule === "csc" && <OfficialRules embedded />}
              {activeRule === "fj1vs1" && <FJRules embedded />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

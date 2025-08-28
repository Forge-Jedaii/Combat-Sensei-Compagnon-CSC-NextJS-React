"use client";

import React from "react";

interface ModeSelectionProps {
  onSelect: (mode: string) => void;
}

export default function ModeSelection({ onSelect }: ModeSelectionProps) {
  const modes = [
    { 
      key: "duel", 
      label: "⚔️ Duel 1vs1",
      subtitle: "Combat Épique",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyber-blue border-2 border-cyan-400 hover:border-cyan-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
    { 
      key: "officialDuel", 
      label: "🏆 Duel Officiel",
      subtitle: "Écrivez la légende",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-2 border-emerald-400 hover:border-emerald-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
    { 
      key: "handicap", 
      label: "🎲 Mode Handicap",
      subtitle: "Défis Aléatoires",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border-2 border-orange-400 hover:border-orange-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
    { 
      key: "tournament", 
      label: "🎟️ Mode Tournoi",
      subtitle: "L'Appel de la Forge",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-2 border-yellow-400 hover:border-yellow-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
    { 
      key: "highlander", 
      label: "🛡️ Mode Highlander",
      subtitle: "Il ne peut en rester qu'un",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border-2 border-red-400 hover:border-red-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
    { 
      key: "battleRoyale", 
      label: "👥 Battle Royale",
      subtitle: "Chaos Total",
      className: "group relative text-glow overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 border-2 border-purple-400 hover:border-purple-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 space-y-12">
      {/* Header principal */}
      <header className="space-y-4">
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 sm:mb-4 animate-pulse">⚔️</div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyber-blue text-glow font-orbitron">
           Forge Je&apos;daii
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl font-orbitron">
          Combat Sensei Compagnon
        </p>
      </header>

      {/* Sélection des modes */}
      <section className="max-w-5xl w-full">
        <h2 className="text-cyber-blue text-glow text-2xl sm:text-3xl font-bold mb-8 font-orbitron">
          🎮 MODES DE COMBAT
        </h2>
        <p className="text-gray-400 mb-8 font-orbitron">Choisissez votre style de combat préféré</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modes.map((mode) => (
            <div
              key={mode.key}
              onClick={() => onSelect(mode.key)}
              className={`${mode.className} min-h-[180px] flex flex-col items-center justify-center text-center`}
            >
              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Contenu */}
              <div className="relative z-10">
                <div className="text-4xl mb-3">{mode.label.split(" ")[0]}</div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron">
                  {mode.label.substring(2)}
                </h3>
                <p className="text-sm text-gray-300 font-orbitron">{mode.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Outils & Ressources */}
        <section className="mt-16">
          <h2 className="text-cyber-blue text-glow text-2xl sm:text-3xl font-bold mb-8 font-orbitron">
            🛠️ OUTILS & RESSOURCES
          </h2>
          <p className="text-gray-400 mb-8 font-orbitron">Règlements, statistiques et archives</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Règlements Officiels */}
            <div 
              onClick={() => onSelect("officialRules")}
              className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-400 border-2 border-cyan-400 hover:border-cyan-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95 min-h-[140px] flex flex-col items-center justify-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">📜</div>
                <h3 className="text-xl text-glow font-bold text-white mb-2 font-orbitron">Règlements Officiels</h3>
                <div className="text-xs text-glow sm:text-sm text-cyan-300/80">Code de la Forge</div>
                <div className="text-xs text-glow text-cyan-200/60 mt-1">Règles • Fautes • Modes</div>
              </div>
            </div>
            
            {/* Archives de la Forge */}
            <div 
              onClick={() => onSelect("archives")}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 border-2 border-purple-400 hover:border-purple-300 px-6 py-6 rounded-2xl font-bold cursor-pointer transition-all duration-300 box-glow hover:scale-105 hover:box-glow-strong active:scale-95 min-h-[140px] flex flex-col items-center justify-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-xl text-glow font-bold text-white mb-2 font-orbitron">Archives de la Forge</h3>
                <div className="text-xs text-glow sm:text-sm text-purple-300/80">Base de Données</div>
                <div className="text-xs text-glow text-purple-200/60 mt-1">Classements • Profils • Stats</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center justify-center min-h-[200px] mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-cyber-blue/30">
            <div className="text-xs sm:text-sm text-gray-400 mb-2 text-center">
              <span className="text-cyber-blue font-semibold">Version 2.1</span> • 
              <span> Forge Je&apos;daii Academy</span> • 
              <span> © 2025</span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              ⚔️ Que la Force soit avec vous ! ⚔️
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

"use client";

import React from "react";

interface OfficialRulesProps {
  onBack?: () => void;
}

export default function OfficialRules({ onBack }: OfficialRulesProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-cyber-blue/40 rounded-xl box-glow max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header avec bouton fermer */}
        <div className="p-6 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <h2 className="text-cyber-blue text-2xl sm:text-3xl font-bold text-glow">
              📜 Règlement Officiel
            </h2>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4 text-gray-300">
            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3">
              ⚔️ RÈGLES GÉNÉRALES
            </div>
            <p>• Chaque Je&apos;daii commence avec 10 Points de Vie (PV)</p>
            <p>• Une touche = 1 PV de dégâts (sauf exceptions)</p>
            <p>• Le premier à 0 PV perd le combat</p>
            <p>• Possibilité d&apos;annuler la dernière touche</p>

            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
              🎲 MODE HANDICAP
            </div>
            <p>• Handicaps aléatoires assignés avant le combat</p>
            <p>• Types : PV réduits, attaques spéciales, restrictions</p>
            <p>• Au moins un joueur aura toujours un handicap</p>

            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
              🏆 TOURNOIS
            </div>
            <p>• Élimination directe : nombres pairs de participants</p>
            <p>• Round Robin : nombres impairs de participants</p>
            <p>• Classement final basé sur victoires et différentiel</p>

            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
              ⏱️ LIMITES DE TEMPS
            </div>
            <p>• Optionnelles : 30s à 5 minutes</p>
            <p>• En cas d&apos;égalité : le plus de PV gagne</p>
            <p>• Match nul si même nombre de PV</p>

            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
              🔥 MODE HIGHLANDER
            </div>
            <p>• Un champion affronte tous les adversaires</p>
            <p>• PV conservés entre les combats</p>
            <p>• Récupération paramétrable (0 à 10 PV)</p>
            <p>• Victoire : vaincre tous les adversaires</p>
            <p>• Défaite : perdre un seul combat</p>

            <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
              ⚡ SYSTÈME DE FAUTES
            </div>
            <p>• Carton Jaune : Avertissement (2 = -1 PV)</p>
            <p>• Carton Rouge : Défaite immédiate</p>
            <p>• Carton Noir : Disqualification du tournoi</p>
            <p>• Types : Sortie de zone, technique interdite, anti-jeu, non respect</p>
            <p>• Historique complet des fautes par combattant</p>

            <div className="text-center mt-4 sm:mt-6 text-purple-400 font-bold text-sm sm:text-base">
              🌟 Que la Force soit avec vous ! 🌟
            </div>
            <div className="text-center">
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
        </div>
      </div>
    </div>
  );
}
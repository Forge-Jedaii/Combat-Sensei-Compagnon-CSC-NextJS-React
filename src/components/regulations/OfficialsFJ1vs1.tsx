"use client";

import React from "react";

interface FJRulesProps {
  onBack?: () => void;
  embedded?: boolean;
}

export default function FJRules({ onBack, embedded = false }: FJRulesProps) {
  const rulesContent = (
    <div className="space-y-4 text-gray-300">
      {/* Introduction */}
      <div className="text-cyan-400 font-bold text-lg sm:text-xl mb-4">
        📖 INTRODUCTION
      </div>
      <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
        <p className="mb-3">
          Bienvenue à la <span className="text-cyan-400 font-semibold">Forge Je&apos;daii</span>, où la tradition et l&apos;innovation se rencontrent pour forger les combattants de demain.
        </p>
        <p className="mb-3">
          Ce livret de combat réaliste est conçu pour guider les adeptes de tous niveaux dans l&apos;apprentissage et la maîtrise de techniques de combat structurées et réglementées, reflétant l&apos;esprit de discipline et de respect inhérent à notre art.
        </p>
        <p>
          À la Forge Je&apos;daii, nous croyons que le combat n&apos;est pas seulement une question de force brute, mais un équilibre délicat entre <span className="text-purple-400">technique</span>, <span className="text-purple-400">stratégie</span> et <span className="text-purple-400">esprit</span>.
        </p>
      </div>

      {/* Objectifs */}
      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-3">
        🎯 OBJECTIFS DU LIVRET
      </div>
      <ul className="space-y-2 mb-6">
        <li>• <strong>Établir des Normes Claires :</strong> Offrir une compréhension commune des règles</li>
        <li>• <strong>Assurer la Sécurité :</strong> Garantir un environnement de combat sûr</li>
        <li>• <strong>Promouvoir l&apos;Excellence :</strong> Encourager les combattants à atteindre leur plein potentiel</li>
      </ul>

      {/* Règlement 1vs1 Débutant */}
      <div className="text-cyan-400 font-bold text-lg sm:text-xl mb-4 mt-8">
        ⚔️ RÈGLEMENT COMBAT 1vs1 NIVEAU DÉBUTANT
      </div>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4">
        ⏱️ DURÉE DU MATCH
      </div>
      <p>• Le match a une durée de <strong>10 minutes</strong></p>
      <p>• En cas de prolongations, la durée est fixée à <strong>3 minutes</strong></p>
      <p>• Les arrêts de combat ne sont pas inclus dans la durée</p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        💓 POINTS DE VIE
      </div>
      <p>• Chaque combattant commence avec <strong>10 points de vie</strong></p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        🏆 DÉSIGNATION DU VAINQUEUR
      </div>
      <p>• <strong>Points de Victoire :</strong> Le premier à atteindre 10 points gagne</p>
      <p>• <strong>Combat en 5 points :</strong> Possible si nécessaire</p>
      <p>• <strong>Fin du temps :</strong> Le combattant avec le plus de points l&apos;emporte</p>
      <p>• <strong>Égalité :</strong> Prolongations jusqu&apos;au premier point en zone vitale</p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        ✅ FRAPPE VALABLE
      </div>
      <p>Une frappe est valable si elle respecte :</p>
      <p>• <strong>Ardeur :</strong> Intensité suffisante</p>
      <p>• <strong>Posture :</strong> Posture correcte maintenue</p>
      <p>• <strong>Orientation du Sabre :</strong> Partie valable du sabre utilisée</p>
      <p>• <strong>Zone de Frappe :</strong> Zone valable atteinte</p>
      <p>• <strong>Double touche :</strong> Annulation si les deux touchent simultanément</p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        🎯 ZONES DE FRAPPE VALABLES
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-red-400 font-semibold">Zones Vitales (2 points) :</p>
          <p>• Tête</p>
          <p>• Torse</p>
          <p>• Dos</p>
        </div>
        <div>
          <p className="text-yellow-400 font-semibold">Autres Zones (1 point) :</p>
          <p>• Mains</p>
          <p>• Bras</p>
          <p>• Jambes</p>
        </div>
      </div>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        📊 VALEUR DES TOUCHES
      </div>
      <p>• <span className="text-red-400">Touches Vitales :</span> <strong>2 points</strong></p>
      <p>• <span className="text-yellow-400">Autres Touches :</span> <strong>1 point</strong></p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        🚫 PÉNALITÉS
      </div>
      <p>• <strong>Sortie de Zone :</strong> -1 point</p>
      <p>• <strong>Arrêt du Combat :</strong> Possible en cas d&apos;incapacité</p>

      <div className="text-purple-400 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 mt-4 sm:mt-6">
        ❌ COUPS INTERDITS
      </div>
      <p>• Coups de poing et pieds</p>
      <p>• Croche-pied, balayage</p>
      <p>• Saisie, projection, clé</p>

      <div className="text-center mt-6 p-4 bg-cyan-900/20 rounded-lg">
        <p className="text-cyan-400 font-bold">
          🌟 Ce règlement garantit un combat équitable et sécurisé tout en respectant l&apos;esprit et les traditions de la Forge Je&apos;daii 🌟
        </p>
      </div>

      {!embedded && (
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
      )}
    </div>
  );

  // Si embedded, retourner juste le contenu
  if (embedded) {
    return rulesContent;
  }

  // Sinon, retourner la modal complète
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-cyber-blue/40 rounded-xl box-glow max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header avec bouton fermer */}
        <div className="p-6 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <h2 className="text-cyber-blue text-2xl sm:text-3xl font-bold text-glow">
              🏆 Règlements Forge Je&apos;daii
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
          {rulesContent}
        </div>
      </div>
    </div>
  );
}
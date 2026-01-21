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
      <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
        <p className="mb-3">
          Bienvenue à la{" "}
          <span className="text-cyan-400 font-semibold">
            Forge Je&apos;daii
          </span>
          , où la tradition et l&apos;innovation se rencontrent pour forger les
          combattants de demain.
        </p>
        <p className="mb-3">
          Ce livret de combat réaliste est conçu pour guider les adeptes de tous
          niveaux dans l&apos;apprentissage et la maîtrise de techniques de
          combat structurées et réglementées, reflétant l&apos;esprit de
          discipline et de respect inhérent à notre art.
        </p>
        <p>
          À la Forge Je&apos;daii, nous croyons que le combat n&apos;est pas
          seulement une question de force brute, mais un équilibre délicat entre{" "}
          <span className="text-purple-400">technique</span>,{" "}
          <span className="text-purple-400">stratégie</span> et{" "}
          <span className="text-purple-400">esprit</span>.
        </p>
      </div>

      {/* Objectifs */}
      <div className="text-purple-400 font-bold text-lg mb-3">
        🎯 OBJECTIFS DU RÈGLEMENT
      </div>
      <ul className="space-y-2 mb-6">
        <li>• Sécurité des combattants</li>
        <li>• Clarté et lisibilité du combat</li>
        <li>• Valorisation de la technique et du déplacement</li>
        <li>• Rejet du jeu brouillon ou brutal</li>
      </ul>

      {/* Règlement */}
      <div className="text-cyan-400 font-bold text-lg sm:text-xl mb-4 mt-8">
        ⚔️ RÈGLEMENT COMBAT 1vs1 – NIVEAU DÉBUTANT
      </div>

      {/* Durée */}
      <div className="text-purple-400 font-bold mb-2 mt-4">
        ⏱️ DURÉE DU MATCH
      </div>
      <p>
        • Durée standard : <strong>10 minutes</strong>
      </p>
      <p>
        • Prolongation : <strong>3 minutes</strong>
      </p>

      {/* Points de vie */}
      <div className="text-purple-400 font-bold mb-2 mt-4">
        💓 POINTS DE VIE
      </div>
      <p>
        • Chaque combattant commence avec <strong>10 points de vie</strong>
      </p>

      {/* Désignation vainqueur */}
      <div className="text-purple-400 font-bold mb-2 mt-4">
        🏆 DÉSIGNATION DU VAINQUEUR
      </div>
      <p>• Premier à atteindre 10 points</p>
      <p>• Fin du temps : le score le plus élevé l&apos;emporte</p>
      <p>• Égalité : prolongation jusqu&apos;à une touche valide</p>

      {/* Frappe valable */}
      <div className="text-purple-400 font-bold mb-2 mt-6">
        ✅ CONDITIONS D&apos;UNE FRAPPE VALABLE
      </div>
      <p>Une frappe est considérée valable uniquement si :</p>
      <ul className="space-y-1 mt-2">
        <li>
          • Le combattant est <strong>en déplacement</strong>
        </li>
        <li>
          • Il existe une{" "}
          <strong>
            cohérence entre déplacement, posture du corps et technique
          </strong>
        </li>
        <li>• La frappe est lisible, contrôlée et maîtrisée</li>
        <li>• La distance est correctement gérée</li>
      </ul>

      {/* Jeu brouillon */}
      <div className="text-red-400 font-bold mb-2 mt-6">
        🚫 JEU BROUILLON – TOUCHES NON COMPTABILISÉES
      </div>
      <p>
        Ne seront <strong>pas comptabilisées</strong> :
      </p>
      <ul className="space-y-1 mt-2">
        <li>• Touches à distance trop courte (corps trop proches)</li>
        <li>• Enchaînements confus sans phase d&apos;arme identifiable</li>
        <li>• Mouvements rapides sans cohérence technique</li>
        <li>• Actions où la posture du corps est négligée</li>
      </ul>

      <p className="mt-2 italic text-gray-400">
        Chaque action doit être claire, irréprochable et compréhensible pour
        l&apos;arbitrage.
      </p>

      {/* Zones */}
      <div className="text-purple-400 font-bold mb-2 mt-6">
        🎯 ZONES DE FRAPPE VALABLES
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-red-400 font-semibold">Zones vitales (2 points)</p>
          <p>• Tête</p>
          <p>• Torse</p>
          <p>• Dos</p>
        </div>
        <div>
          <p className="text-yellow-400 font-semibold">
            Autres zones (1 point)
          </p>
          <p>• Bras</p>
          <p>• Jambes</p>
          <p>• Mains</p>
        </div>
      </div>

      {/* Frappes lourdes */}
      <div className="text-red-400 font-bold mb-2 mt-6">
        🟨 FRAPPES LOURDES – SANCTIONS
      </div>
      <p>
        Dès la <strong>première frappe lourde</strong>, un{" "}
        <strong>carton jaune</strong> est attribué.
      </p>

      <div className="mt-3">
        <p className="text-green-400 font-semibold">
          ✔ Frappe lourde acceptée :
        </p>
        <p>
          • Frappe rapide avec inertie maîtrisée
          <br />• Impact sonore sans intention de nuire
        </p>
      </div>

      <div className="mt-3">
        <p className="text-red-400 font-semibold">
          ❌ Frappe lourde non acceptée :
        </p>
        <p>
          • Intention de faire mal
          <br />
          • Posture du corps agressive ou déséquilibrée
          <br />• Arme utilisée de manière brutale
        </p>
      </div>

      {/* Coups interdits */}
      <div className="text-purple-400 font-bold mb-2 mt-6">
        ❌ COUPS INTERDITS
      </div>
      <p>• Coups de poing et de pied</p>
      <p>• Balayages, projections, saisies</p>
      <p>• Toute action mettant en danger l&apos;adversaire</p>

      {/* Conclusion */}
      <div className="text-center mt-6 p-4 bg-cyan-900/20 rounded-lg">
        <p className="text-cyan-400 font-bold">
          🌟 Ce règlement garantit un combat équitable et sécurisé tout en
          respectant l&apos;esprit et les traditions de la Forge Je&apos;daii 🌟
        </p>
      </div>

      {!embedded && (
        <div className="text-center">
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-[#ff275b] to-[#b300ff]
                       hover:from-[#ff4d77] hover:to-[#c233ff]
                       text-white px-8 py-3 rounded-lg font-bold transition-all
                       border border-white/10 hover:scale-105
                       shadow-[0_0_18px_rgba(255,39,91,0.35)]"
          >
            ← Retour
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) return rulesContent;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-cyber-blue/40 rounded-xl box-glow max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <h2 className="text-cyber-blue text-2xl font-bold text-glow">
              🏆 Règlements Forge Je&apos;daii
            </h2>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{rulesContent}</div>
      </div>
    </div>
  );
}

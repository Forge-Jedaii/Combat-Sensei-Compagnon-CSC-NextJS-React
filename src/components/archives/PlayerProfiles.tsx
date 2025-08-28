"use client";

import React from "react";

export default function PlayerProfiles() {
  return (
    <div className="bg-black/40 border border-green-400/40 rounded-xl p-6 box-glow max-w-4xl mx-auto">
      <h2 className="text-green-400 text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        👤 Profils Joueurs
      </h2>

      <div className="space-y-6 text-gray-300">
        <p>
          Chaque joueur dispose d’un <span className="text-green-400 font-bold">profil</span>
          recensant ses informations clés et ses performances.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>📛 Identité du joueur</li>
          <li>⚔️ Historique des combats</li>
          <li>📊 Statistiques individuelles</li>
          <li>🏆 Palmarès et distinctions</li>
        </ul>

        <div className="p-4 bg-black/60 border border-green-400/30 rounded-lg text-center">
          <p className="italic text-gray-400">
            🚧 Fonctionnalité en construction : fiches interactives bientôt disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";

export default function Rankings() {
  return (
    <div className="bg-black/40 border border-yellow-400/40 rounded-xl p-6 box-glow max-w-4xl mx-auto">
      <h2 className="text-yellow-400 text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        🏆 Classements
      </h2>

      <div className="space-y-6 text-gray-300">
        <p>
          Consultez les <span className="text-yellow-400 font-bold">classements</span> des joueurs
          en fonction de leurs performances en duel, tournoi ou mode spécifique.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>⚔️ Classement général</li>
          <li>🎲 Classement par modes (Duel, Handicap, Highlander, etc.)</li>
          <li>🏅 Joueurs en progression</li>
        </ul>

        <div className="p-4 bg-black/60 border border-yellow-400/30 rounded-lg text-center">
          <p className="italic text-gray-400">
            🚧 Fonctionnalité en construction : affichage dynamique des classements bientôt intégré.
          </p>
        </div>
      </div>
    </div>
  );
}

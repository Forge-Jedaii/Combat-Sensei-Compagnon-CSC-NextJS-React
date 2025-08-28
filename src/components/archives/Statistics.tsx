"use client";

import React from "react";

export default function Statistics() {
  return (
    <div className="bg-black/40 border border-purple-400/40 rounded-xl p-6 box-glow max-w-4xl mx-auto">
      <h2 className="text-purple-400 text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        📊 Statistiques Globales
      </h2>

      <div className="space-y-6 text-gray-300">
        <p>
          Analysez les <span className="text-purple-400 font-bold">statistiques globales</span> :
          tendances de jeu, ratios de victoires, temps moyen des combats et plus encore.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>⚔️ Nombre total de combats</li>
          <li>⏱️ Durée moyenne des duels</li>
          <li>🏅 Taux de victoires par joueur</li>
          <li>📈 Modes les plus populaires</li>
        </ul>

        <div className="p-4 bg-black/60 border border-purple-400/30 rounded-lg text-center">
          <p className="italic text-gray-400">
            🚧 Fonctionnalité en construction : graphiques et visualisations bientôt disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}

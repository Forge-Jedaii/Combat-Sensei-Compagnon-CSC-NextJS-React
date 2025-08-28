"use client";

import React from "react";

export default function DatabaseMain() {
  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-xl p-6 box-glow max-w-5xl mx-auto">
      <h2 className="text-cyber-blue text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        📚 Archives & Base de Données
      </h2>

      <div className="space-y-6 text-gray-300">
        <p>
          Bienvenue dans la section <span className="text-cyber-blue font-bold">Archives</span>.
          Retrouvez ici toutes les données des combats passés, le classement des joueurs,
          les statistiques et les profils détaillés.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>🏆 Classements généraux et par mode</li>
          <li>👤 Profils joueurs détaillés</li>
          <li>📊 Statistiques et performances</li>
          <li>📂 Historique des duels et tournois</li>
        </ul>

        <div className="p-4 bg-black/60 border border-cyber-blue/30 rounded-lg text-center">
          <p className="italic text-gray-400">
            🚧 Section en construction : intégration dynamique des données bientôt disponible.
          </p>
        </div>
      </div>
    </div>
  );
}

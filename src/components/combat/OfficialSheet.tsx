"use client";

import React from "react";

export default function OfficialSheet() {
  return (
    <div className="bg-black/40 border border-cyber-blue/40 rounded-xl p-6 box-glow max-w-4xl mx-auto">
      <h2 className="text-cyber-blue text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        📑 Fiche Officielle de Combat
      </h2>

      <div className="space-y-6 text-gray-300">
        <p>
          La fiche officielle récapitule toutes les informations d’un duel :
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>👥 Identité des deux combattants</li>
          <li>⚔️ Mode de combat utilisé</li>
          <li>🕒 Durée et phases du combat</li>
          <li>📊 Points, fautes et sanctions éventuelles</li>
          <li>🏆 Résultat final et vainqueur officiel</li>
        </ul>

        <div className="p-4 bg-black/60 border border-cyber-blue/30 rounded-lg text-center">
          <p className="italic text-gray-400">
            🚧 Fonctionnalité en construction : tableau interactif et export de la fiche à venir.
          </p>
        </div>
      </div>
    </div>
  );
}

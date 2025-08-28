"use client";

import React from "react";

export default function FaultSystem() {
  return (
    <div className="bg-black/40 border border-yellow-400/40 rounded-xl p-6 box-glow max-w-3xl mx-auto">
      <h2 className="text-yellow-400 text-2xl sm:text-3xl font-bold text-center text-glow mb-6">
        ⚠️ Système de Fautes
      </h2>

      <div className="space-y-4 text-gray-300">
        <p>
          Ce module permet de suivre les fautes commises par les combattants selon le règlement officiel.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li>❌ Fautes techniques (frappes interdites, sorties de zone, etc.)</li>
          <li>⚔️ Fautes comportementales (attitude antisportive, non-respect des consignes)</li>
          <li>🚫 Cumul de fautes entraînant une sanction ou disqualification</li>
        </ul>

        <p className="italic text-gray-400">
          🚧 Fonctionnalité en construction : affichage dynamique des fautes à venir.
        </p>
      </div>
    </div>
  );
}

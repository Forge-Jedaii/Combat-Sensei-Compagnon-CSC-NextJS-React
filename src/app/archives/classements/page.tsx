"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClassementsPage() {
  const [search, setSearch] = useState("");

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      {/* ================= RETOUR ARCHIVES ================= */}
      <div>
        <Link
          href="/archives"
          className="
      inline-flex items-center gap-2
      text-sm font-semibold
      text-gray-300
      border border-gray-600/40
      rounded-lg
      px-4 py-2
      bg-black/40
      hover:text-purple-400
      hover:border-purple-400/50
      hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]
      transition-all
    "
        >
          ← Retour aux Archives
        </Link>
      </div>

      {/* ================= MON CLASSEMENT ================= */}
      <section className="bg-gradient-to-br from-[#1a1f3b] to-[#12152b] border border-yellow-400/40 rounded-xl p-6 box-glow">
        <h1 className="text-yellow-400 text-2xl font-bold mb-6 text-glow">
          🏆 Mon Classement
        </h1>

        <div className="grid sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-5xl font-bold text-white">#12</p>
            <p className="text-gray-400 text-sm">Classement global</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-white">2450</p>
            <p className="text-gray-400 text-sm">Points CSC</p>
          </div>

          <div>
            <p className="text-xl font-semibold text-white">Je’daii Avancé</p>
            <p className="text-gray-400 text-sm">Catégorie</p>
          </div>

          <div>
            <p className="text-green-400 text-2xl font-bold">▲ +3</p>
            <p className="text-gray-400 text-sm">Évolution</p>
          </div>
        </div>
      </section>

      {/* ================= MON PARCOURS ================= */}
      <section className="bg-black/40 border border-purple-400/30 rounded-xl p-6">
        <h2 className="text-purple-400 text-xl font-bold mb-6">
          📜 Mon Parcours
        </h2>

        <div className="grid sm:grid-cols-3 gap-6 text-center text-gray-300">
          <div>
            <p className="text-3xl font-bold text-white">128</p>
            <p className="text-sm">Combats réalisés</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-white">72%</p>
            <p className="text-sm">Taux de victoire</p>
          </div>

          <div>
            <p className="text-xl font-semibold text-white">Forge Je’daii</p>
            <p className="text-sm">Club principal</p>
          </div>
        </div>
      </section>

      {/* ================= CLASSEMENTS GLOBAUX ================= */}
      <section className="bg-black/40 border border-blue-400/30 rounded-xl p-6">
        <h2 className="text-blue-400 text-xl font-bold mb-6">
          🌍 Classements Globaux
        </h2>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select className="bg-black border border-gray-600 rounded px-3 py-2 text-white">
            <option>Département</option>
            <option>06 - Alpes-Maritimes</option>
            <option>75 - Paris</option>
          </select>

          <select className="bg-black border border-gray-600 rounded px-3 py-2 text-white">
            <option>Région</option>
            <option>PACA</option>
            <option>Île-de-France</option>
          </select>

          <select className="bg-black border border-gray-600 rounded px-3 py-2 text-white">
            <option>Club</option>
            <option>Forge Je’daii</option>
            <option>Geneva Saber</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un combattant"
            className="bg-black border border-gray-600 rounded px-3 py-2 text-white flex-1"
          />
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead>
              <tr className="border-b border-gray-700 text-sm uppercase">
                <th className="py-2">#</th>
                <th>Nom</th>
                <th>Club</th>
                <th>Points</th>
                <th>Ratio</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-gray-800 hover:bg-white/5 transition">
                <td className="py-2 font-bold text-white">1</td>
                <td className="font-semibold text-white">Antho</td>
                <td>Forge Je’daii</td>
                <td>3120</td>
                <td>81%</td>
              </tr>

              <tr className="border-b border-gray-800 hover:bg-white/5 transition">
                <td className="py-2 font-bold text-white">2</td>
                <td className="font-semibold text-white">Romain</td>
                <td>Geneva Saber</td>
                <td>2980</td>
                <td>78%</td>
              </tr>

              <tr className="hover:bg-white/5 transition">
                <td className="py-2 font-bold text-white">3</td>
                <td className="font-semibold text-white">Sensei</td>
                <td>Forge Je’daii</td>
                <td>2750</td>
                <td>74%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

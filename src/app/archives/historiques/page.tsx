"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Combat = {
  id: number;
  date: string;
  type: "Amical" | "Officiel" | "Tournoi";
  mode: string;
  adversaire: string;
  resultat: "Victoire" | "Défaite" | "Égalité";
};

export default function HistoriquePage() {
  const evolutionData = [
    { date: "2024-01", points: 1200 },
    { date: "2024-03", points: 1450 },
    { date: "2024-06", points: 1800 },
    { date: "2024-09", points: 2100 },
    { date: "2025-01", points: 2450 },
  ];

  const combats: Combat[] = [
    {
      id: 1,
      date: "12/01/2025",
      type: "Amical",
      mode: "Duel libre",
      adversaire: "Antho",
      resultat: "Victoire",
    },
    {
      id: 2,
      date: "18/01/2025",
      type: "Officiel",
      mode: "CSC Standard",
      adversaire: "Romain",
      resultat: "Défaite",
    },
    {
      id: 3,
      date: "02/02/2025",
      type: "Tournoi",
      mode: "Survie",
      adversaire: "Multiple",
      resultat: "Victoire",
    },
  ];

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-10">
      {/* ================= RETOUR ================= */}
      <Link
        href="/archives"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300
        border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40
        hover:text-purple-400 hover:border-purple-400/50 transition-all"
      >
        ← Retour aux Archives
      </Link>

      {/* ================= RÉCAP GLOBAL ================= */}
      <section className="bg-gradient-to-br from-[#182047] to-[#101535] border border-blue-400/40 rounded-xl p-6">
        <h1 className="text-blue-400 text-2xl font-bold mb-6">
          📊 Mon Historique de Combat
        </h1>

        <div className="grid sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-white">54</p>
            <p className="text-sm text-gray-400">Combats totaux</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">31</p>
            <p className="text-sm text-gray-400">Victoires</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-400">20</p>
            <p className="text-sm text-gray-400">Défaites</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400">3</p>
            <p className="text-sm text-gray-400">Égalités</p>
          </div>
        </div>
      </section>

      {/* ================= TYPES DE COMBATS ================= */}
      <section className="bg-black/40 border border-purple-400/30 rounded-xl p-6">
        <h2 className="text-purple-400 text-xl font-bold mb-6">
          ⚔️ Par type de combat
        </h2>

        <div className="grid sm:grid-cols-3 gap-6 text-center text-gray-300">
          <div>
            <p className="text-xl font-bold text-white">Amical</p>
            <p>22 combats</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">Officiel</p>
            <p>18 combats</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">Tournoi</p>
            <p>14 combats</p>
          </div>
        </div>
      </section>

      {/* ================= MODES ================= */}
      <section className="bg-black/40 border border-cyan-400/30 rounded-xl p-6">
        <h2 className="text-cyan-400 text-xl font-bold mb-6">
          🎮 Par mode de jeu
        </h2>

        <div className="grid sm:grid-cols-4 gap-4 text-center text-gray-300">
          <div>CSC Standard</div>
          <div>Duel libre</div>
          <div>Survie</div>
          <div>Multi-adversaires</div>
        </div>
      </section>

      {/* ================= ÉVOLUTION ================= */}
      <section className="bg-black/40 border border-cyan-400/30 rounded-xl p-6">
        <h2 className="text-cyan-400 text-xl font-bold mb-6">
          📈 Évolution des performances
        </h2>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #22d3ee",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ================= LISTE DES COMBATS ================= */}
      <section className="bg-black/40 border border-gray-600/30 rounded-xl p-6">
        <h2 className="text-gray-200 text-xl font-bold mb-6">
          📜 Historique détaillé
        </h2>

        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
          {combats.map((combat) => (
            <div
              key={combat.id}
              className="border border-gray-700 rounded-lg p-4 bg-black/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="font-bold text-white">
                  {combat.type} — {combat.mode}
                </p>
                <p className="text-sm text-gray-400">
                  {combat.date} | Adversaire : {combat.adversaire}
                </p>
              </div>

              <span
                className={`font-bold ${
                  combat.resultat === "Victoire"
                    ? "text-green-400"
                    : combat.resultat === "Défaite"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {combat.resultat}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

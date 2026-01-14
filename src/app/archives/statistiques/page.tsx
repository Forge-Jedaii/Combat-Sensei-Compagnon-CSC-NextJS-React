"use client";

import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const resultsData = [
  { name: "Victoires", value: 31 },
  { name: "Défaites", value: 20 },
  { name: "Égalités", value: 3 },
];

const modesData = [
  { mode: "CSC Standard", combats: 22 },
  { mode: "Duel libre", combats: 14 },
  { mode: "Survie", combats: 10 },
  { mode: "Multi", combats: 8 },
];

const COLORS = ["#22c55e", "#ef4444", "#facc15"];

export default function StatistiquesPage() {
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

      {/* ================= KPI ================= */}
      <section className="bg-gradient-to-br from-[#2a1b3f] to-[#1a112b] border border-purple-400/40 rounded-xl p-6">
        <h1 className="text-purple-400 text-2xl font-bold mb-6">
          📊 Statistiques Globales
        </h1>

        <div className="grid sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-white">54</p>
            <p className="text-sm text-gray-400">Combats</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">72%</p>
            <p className="text-sm text-gray-400">Winrate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">2450</p>
            <p className="text-sm text-gray-400">Points CSC</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">3.2</p>
            <p className="text-sm text-gray-400">Moy. / combat</p>
          </div>
        </div>
      </section>

      {/* ================= RÉSULTATS ================= */}
      <section className="bg-black/40 border border-green-400/30 rounded-xl p-6">
        <h2 className="text-green-400 text-xl font-bold mb-6">🏆 Résultats</h2>

        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={resultsData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {resultsData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ================= MODES ================= */}
      <section className="bg-black/40 border border-cyan-400/30 rounded-xl p-6">
        <h2 className="text-cyan-400 text-xl font-bold mb-6">
          🎮 Répartition par mode
        </h2>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modesData}>
              <XAxis dataKey="mode" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="combats" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const resultColors = ["#22c55e", "#ef4444", "#facc15"] as const;

export function EvolutionChart({ data }: { data: Array<{ date: string; points: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #22d3ee", color: "#fff" }} />
        <Line type="monotone" dataKey="points" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ResultsChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
          {data.map((result, index) => <Cell key={result.name} fill={resultColors[index % resultColors.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ModesChart({ data }: { data: Array<{ mode: string; combats: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data}>
        <XAxis dataKey="mode" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="combats" fill="#22d3ee" />
      </BarChart>
    </ResponsiveContainer>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ModesChart, ResultsChart } from "@/components/charts/ArchiveCharts";
import { createClient } from "@/lib/supabase/server";
import { ArchiveService, calculateFighterStatistics } from "@/services/archive.service";

const modeLabels: Record<string, string> = { duel: "Duel", official_duel: "Duel officiel", handicap: "Handicap", tournament: "Tournoi", highlander: "Highlander", battle_royale: "Battle Royale" };

function combatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : "", `${seconds} s`].filter(Boolean).join(" ");
}

export default async function StatistiquesPage() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) redirect("/login?next=/archives/statistiques");
  const service = new ArchiveService(client);
  const fighterData = await service.fighterData(data.user.id);
  const { summaries, rankings } = fighterData;
  const statistics = calculateFighterStatistics(fighterData);
  const { victories: wins, defeats: losses, draws } = statistics;
  const overall = rankings.find((ranking) => ranking.mode === null);
  const modeCounts = Object.entries(summaries.reduce<Record<string, number>>((result, match) => ({ ...result, [match.mode]: (result[match.mode] ?? 0) + 1 }), {})).map(([mode, combats]) => ({ mode, combats }));
  const winRate = statistics.winRate;
  const statisticItems = [
    ["Victoires", statistics.victories], ["Défaites", statistics.defeats], ["Égalités", statistics.draws],
    ["Kills", statistics.kills], ["Deaths", statistics.deaths], ["Ratio K/D", statistics.killDeathRatio],
    ["Win Rate", `${statistics.winRate}%`], ["Matchs joués", statistics.matchesPlayed],
    ["Série actuelle", statistics.currentStreak], ["Meilleure série", statistics.longestStreak],
    ["Nombre de touches", statistics.touches], ["Dégâts infligés", statistics.damageDealt],
    ["Dégâts reçus", statistics.damageReceived], ["Cartons jaunes", statistics.yellowCards],
    ["Cartons rouges", statistics.redCards], ["Cartons noirs", statistics.blackCards],
    ["Temps de combat", combatDuration(statistics.combatTimeSeconds)],
    ["Mode préféré", statistics.favoriteMode ? modeLabels[statistics.favoriteMode] : "—"],
    ["Dernier combat", statistics.lastMatchAt ? new Date(statistics.lastMatchAt).toLocaleString("fr-FR") : "—"],
  ] as const;

  return <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-10">
    <Link href="/archives" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40 hover:text-purple-400">← Retour aux Archives</Link>
    <section className="bg-gradient-to-br from-[#2a1b3f] to-[#1a112b] border border-purple-400/40 rounded-xl p-6">
      <h1 className="text-purple-400 text-2xl font-bold mb-6">📊 Statistiques Globales</h1>
      <div className="grid sm:grid-cols-4 gap-6 text-center">
        <div><p className="text-3xl font-bold text-white">{summaries.length}</p><p className="text-sm text-gray-400">Combats</p></div>
        <div><p className="text-3xl font-bold text-white">{winRate}%</p><p className="text-sm text-gray-400">Winrate</p></div>
        <div><p className="text-3xl font-bold text-white">{overall?.score ?? 0}</p><p className="text-sm text-gray-400">Points CSC</p></div>
        <div><p className="text-3xl font-bold text-white">{overall?.longest_win_streak ?? 0}</p><p className="text-sm text-gray-400">Meilleure série</p></div>
      </div>
    </section>
    <section className="rounded-xl border border-cyan-400/30 bg-black/50 p-6">
      <h2 className="mb-4 text-xl font-bold text-cyan-300">Mon profil combattant</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statisticItems.map(([label, value]) => <div key={label} className="rounded-lg border border-gray-700 bg-black/40 p-3"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-bold text-white">{value}</p></div>)}
      </div>
    </section>
    <section className="bg-black/40 border border-green-400/30 rounded-xl p-6"><h2 className="text-green-400 text-xl font-bold mb-6">🏆 Résultats</h2><div className="w-full h-[260px]"><ResultsChart data={[{ name: "Victoires", value: wins }, { name: "Défaites", value: losses }, { name: "Égalités", value: draws }]} /></div></section>
    <section className="bg-black/40 border border-cyan-400/30 rounded-xl p-6"><h2 className="text-cyan-400 text-xl font-bold mb-6">🎮 Répartition par mode</h2><div className="w-full h-[300px]"><ModesChart data={modeCounts} /></div></section>
  </main>;
}

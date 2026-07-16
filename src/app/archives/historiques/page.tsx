import Link from "next/link";
import { redirect } from "next/navigation";
import { EvolutionChart } from "@/components/charts/ArchiveCharts";
import { createClient } from "@/lib/supabase/server";
import { ArchiveService } from "@/services";

const modeLabels: Record<string, string> = { duel: "Duel", official_duel: "Duel officiel", handicap: "Handicap", tournament: "Tournoi", highlander: "Highlander", battle_royale: "Battle Royale" };

export default async function HistoriquePage() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) redirect("/login?next=/archives/historiques");

  const fighterData = await new ArchiveService(client).fighterData(data.user.id);
  const { ownParticipants, summaries, faults } = fighterData;
  const completedSummaries = summaries.filter((summary) => summary.status === "completed");
  const ownByMatch = new Map(ownParticipants.map((participant) => [participant.match_id, participant]));
  const participantsByMatch = new Map(summaries.map((summary) => [summary.id, fighterData.participants.filter((participant) => participant.match_id === summary.id)]));
  const wins = completedSummaries.filter((summary) => ownByMatch.get(summary.id)?.is_winner).length;
  const draws = completedSummaries.filter((summary) => summary.result_type === "draw").length;
  const losses = completedSummaries.length - wins - draws;
  let cumulativeWins = 0;
  const evolution = [...completedSummaries].reverse().map((summary) => {
    if (ownByMatch.get(summary.id)?.is_winner) cumulativeWins += 1;
    return { date: summary.ended_at ? new Date(summary.ended_at).toLocaleDateString("fr-FR") : "—", points: cumulativeWins };
  });

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-10">
      <Link href="/archives" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40 hover:text-purple-400">← Retour aux Archives</Link>
      <section className="bg-gradient-to-br from-[#182047] to-[#101535] border border-blue-400/40 rounded-xl p-6">
        <h1 className="text-blue-400 text-2xl font-bold mb-6">📊 Mon Historique de Combat</h1>
        <div className="grid sm:grid-cols-4 gap-6 text-center">
          <div><p className="text-3xl font-bold text-white">{completedSummaries.length}</p><p className="text-sm text-gray-400">Combats terminés</p></div>
          <div><p className="text-3xl font-bold text-green-400">{wins}</p><p className="text-sm text-gray-400">Victoires</p></div>
          <div><p className="text-3xl font-bold text-red-400">{losses}</p><p className="text-sm text-gray-400">Défaites</p></div>
          <div><p className="text-3xl font-bold text-yellow-400">{draws}</p><p className="text-sm text-gray-400">Égalités</p></div>
        </div>
      </section>
      <section className="bg-black/40 border border-cyan-400/30 rounded-xl p-6">
        <h2 className="text-cyan-400 text-xl font-bold mb-6">📈 Évolution des victoires</h2>
        <div className="w-full h-[300px]"><EvolutionChart data={evolution} /></div>
      </section>
      <section className="bg-black/40 border border-gray-600/30 rounded-xl p-6">
        <h2 className="text-gray-200 text-xl font-bold mb-6">📜 Historique détaillé</h2>
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
          {!summaries.length && <p className="text-center text-gray-400">Aucun combat enregistré.</p>}
          {summaries.map((summary) => {
            const own = ownByMatch.get(summary.id);
            const matchParticipants = participantsByMatch.get(summary.id) ?? [];
            const opponents = matchParticipants.filter((participant) => participant.id !== own?.id);
            const winner = matchParticipants.find((participant) => participant.is_winner);
            const matchFaults = faults.filter((fault) => fault.match_id === summary.id);
            const result = summary.status === "active" ? "En cours"
              : summary.status === "cancelled" ? "Annulé"
              : summary.result_type === "draw" ? "Égalité"
              : own?.is_winner ? "Victoire" : "Défaite";
            const usesPoints = summary.result_type === "points";
            return (
              <div key={summary.id} className="border border-gray-700 rounded-lg p-4 bg-black/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-white">{summary.event_name ?? modeLabels[summary.mode]}</p>
                  <p className="text-sm text-gray-400">{summary.ended_at ? new Date(summary.ended_at).toLocaleString("fr-FR") : "En cours"} · CSC-{summary.public_id}</p>
                  <p className="text-sm text-gray-300">Adversaire{opponents.length > 1 ? "s" : ""} : {opponents.map((participant) => participant.display_name_snapshot).join(", ") || "—"}</p>
                  <p className="text-xs text-gray-400">{usesPoints ? "Score" : "PV finaux"} : {matchParticipants.map((participant) => `${participant.display_name_snapshot} ${usesPoints ? participant.score : participant.final_health ?? "—"}`).join(" · ")} · Vainqueur : {summary.status === "completed" ? winner?.display_name_snapshot ?? "Égalité" : "—"}</p>
                  <p className="text-xs text-gray-400">Durée : {summary.duration_seconds == null ? "—" : `${summary.duration_seconds} s`} · Fautes : {matchFaults.length}{matchFaults.length ? ` (${matchFaults.map((fault) => fault.type).join(", ")})` : ""}</p>
                </div>
                <span className={`font-bold ${result === "Victoire" ? "text-green-400" : result === "Défaite" ? "text-red-400" : result === "En cours" ? "text-cyan-300" : "text-yellow-400"}`}>{result}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

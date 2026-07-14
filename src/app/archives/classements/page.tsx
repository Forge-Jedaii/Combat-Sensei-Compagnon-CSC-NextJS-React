import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArchiveService } from "@/services";

export default async function ClassementsPage() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  const service = new ArchiveService(client);
  const [leaderboard, ownRankings] = await Promise.all([service.leaderboard(), data.user ? service.rankings(data.user.id) : Promise.resolve([])]);
  const own = ownRankings.find((ranking) => ranking.mode === null);
  const ownPosition = data.user ? leaderboard.find((entry) => entry.user_id === data.user.id)?.rank_position : null;
  return <main className="max-w-6xl mx-auto p-6 space-y-10">
    <Link href="/archives" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 border border-gray-600/40 rounded-lg px-4 py-2 bg-black/40 hover:text-purple-400">← Retour aux Archives</Link>
    <section className="bg-gradient-to-br from-[#1a1f3b] to-[#12152b] border border-yellow-400/40 rounded-xl p-6 box-glow">
      <h1 className="text-yellow-400 text-2xl font-bold mb-6 text-glow">🏆 Mon Classement</h1>
      <div className="grid sm:grid-cols-4 gap-6 text-center"><div><p className="text-5xl font-bold text-white">{ownPosition ? `#${ownPosition}` : "—"}</p><p className="text-gray-400 text-sm">Classement global</p></div><div><p className="text-3xl font-bold text-white">{own?.score ?? 0}</p><p className="text-gray-400 text-sm">Points CSC</p></div><div><p className="text-3xl font-bold text-white">{own?.victories ?? 0}</p><p className="text-gray-400 text-sm">Victoires</p></div><div><p className="text-3xl font-bold text-white">{own?.matches_played ?? 0}</p><p className="text-gray-400 text-sm">Combats</p></div></div>
    </section>
    <section className="bg-black/40 border border-blue-400/30 rounded-xl p-6"><h2 className="text-blue-400 text-xl font-bold mb-6">🌍 Classements Globaux</h2>{!leaderboard.length && <p className="text-gray-400">Aucun classement disponible.</p>}{leaderboard.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-gray-300"><thead><tr className="border-b border-gray-700 text-sm uppercase"><th scope="col" className="py-2">#</th><th scope="col">Nom</th><th scope="col">Club</th><th scope="col">Points</th><th scope="col">Ratio</th></tr></thead><tbody>{leaderboard.map((entry) => <tr key={entry.user_id} className="border-b border-gray-800 hover:bg-white/5"><td className="py-2 font-bold text-white">{entry.rank_position}</td><td className="font-semibold text-white">{entry.display_name}</td><td>{entry.club_name ?? "—"}</td><td>{entry.score}</td><td>{entry.win_rate}%</td></tr>)}</tbody></table></div>}</section>
  </main>;
}

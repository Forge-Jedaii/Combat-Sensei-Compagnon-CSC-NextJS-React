import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArchiveService } from "@/services";
import type { LeaderboardRow, MatchMode, RankingRow } from "@/types/database.types";

type BoardDefinition = { mode: MatchMode | null; title: string; description: string; tone: string };

const boards: BoardDefinition[] = [
  { mode: null, title: "Classement général", description: "Tous les modes de combat réunis.", tone: "text-yellow-300 border-yellow-400/30" },
  { mode: "duel", title: "Duel 1 contre 1", description: "Uniquement les duels classiques.", tone: "text-cyan-300 border-cyan-400/30" },
  { mode: "official_duel", title: "Duel officiel", description: "Uniquement les résultats homologués en Duel officiel.", tone: "text-purple-300 border-purple-400/30" },
];

function RankingTable({ entries }: { entries: LeaderboardRow[] }) {
  if (!entries.length) return <p className="text-sm text-gray-400">Aucun combat terminé dans ce classement.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-gray-300">
        <thead><tr className="border-b border-gray-700 text-xs uppercase text-gray-400"><th scope="col" className="py-2">#</th><th scope="col">Combattant</th><th scope="col">Club</th><th scope="col">Points</th><th scope="col">V-D-N</th><th scope="col">Win rate</th></tr></thead>
        <tbody>{entries.map((entry) => <tr key={`${entry.user_id}:${entry.mode ?? "global"}`} className="border-b border-gray-800 hover:bg-white/5"><td className="py-2 font-bold text-white">#{entry.rank_position}</td><td className="font-semibold text-white">{entry.display_name}</td><td>{entry.club_name ?? "—"}</td><td className="font-bold">{entry.score}</td><td>{entry.victories}-{entry.defeats}-{entry.draws}</td><td>{entry.win_rate}%</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function OwnRanking({ ranking, position }: { ranking?: RankingRow; position?: number | null }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg border border-gray-700 bg-black/40 p-4 text-center sm:grid-cols-4">
      <div><p className="text-2xl font-bold text-white">{position ? `#${position}` : "—"}</p><p className="text-xs text-gray-400">Ma position</p></div>
      <div><p className="text-2xl font-bold text-white">{ranking?.score ?? 0}</p><p className="text-xs text-gray-400">Points</p></div>
      <div><p className="text-2xl font-bold text-green-300">{ranking?.victories ?? 0}</p><p className="text-xs text-gray-400">Victoires</p></div>
      <div><p className="text-2xl font-bold text-white">{ranking?.matches_played ?? 0}</p><p className="text-xs text-gray-400">Combats</p></div>
    </div>
  );
}

export default async function ClassementsPage() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  const service = new ArchiveService(client);
  const [globalLeaderboard, duelLeaderboard, officialLeaderboard, ownRankings] = await Promise.all([
    service.leaderboard(),
    service.leaderboard("duel"),
    service.leaderboard("official_duel"),
    data.user ? service.rankings(data.user.id) : Promise.resolve([]),
  ]);
  const entriesByMode = new Map<MatchMode | null, LeaderboardRow[]>([
    [null, globalLeaderboard],
    ["duel", duelLeaderboard],
    ["official_duel", officialLeaderboard],
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-yellow-300 sm:text-3xl">Classements CSC</h1><p className="text-sm text-gray-400">Chaque discipline possède désormais son rang indépendant.</p></div><Link href="/archives" className="rounded-lg border border-gray-600/40 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-purple-400">← Archives</Link></div>
      {boards.map((board) => {
        const entries = entriesByMode.get(board.mode) ?? [];
        const ownRanking = ownRankings.find((ranking) => ranking.mode === board.mode);
        const ownPosition = data.user ? entries.find((entry) => entry.user_id === data.user.id)?.rank_position : null;
        return <section key={board.mode ?? "global"} className={`rounded-xl border bg-black/45 p-5 ${board.tone}`}><div className="mb-4"><h2 className="text-xl font-bold">{board.title}</h2><p className="text-xs text-gray-400">{board.description}</p></div>{data.user && <OwnRanking ranking={ownRanking} position={ownPosition}/>}<RankingTable entries={entries}/></section>;
      })}
    </main>
  );
}

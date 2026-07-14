import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modeLabels: Record<string, string> = { duel: "Duel", official_duel: "Duel officiel", handicap: "Handicap", tournament: "Tournoi", highlander: "Highlander", battle_royale: "Battle Royale" };

export default async function PublicFighterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();

  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect(`/login?next=/archives/profils/${id}`);

  const [profileResult, statisticsResult, rankingsResult, userBadgesResult] = await Promise.all([
    client.from("public_profiles").select("*").eq("id", id).maybeSingle(),
    client.from("user_statistics").select("*").eq("user_id", id).maybeSingle(),
    client.from("leaderboard").select("*").eq("user_id", id).order("mode", { ascending: true, nullsFirst: true }),
    client.from("user_badges").select("badge_id,progress,unlocked_at").eq("user_id", id),
  ]);
  const error = profileResult.error ?? statisticsResult.error ?? rankingsResult.error ?? userBadgesResult.error;
  if (error) throw new Error(`Chargement du profil public impossible : ${error.message}`);
  if (!profileResult.data) notFound();

  const badgeIds = (userBadgesResult.data ?? []).map((item) => item.badge_id);
  const badgeResult = badgeIds.length
    ? await client.from("badges").select("id,name,description,icon,rarity,category").in("id", badgeIds)
    : { data: [], error: null };
  if (badgeResult.error) throw new Error(`Chargement des badges impossible : ${badgeResult.error.message}`);

  const profile = profileResult.data;
  const statistics = statisticsResult.data;
  const rankings = rankingsResult.data ?? [];
  const overall = rankings.find((ranking) => ranking.mode === null);
  const badgeProgress = new Map((userBadgesResult.data ?? []).map((item) => [item.badge_id, item.progress]));
  const avatarUrl = profile.avatar_path ? client.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl : null;

  return <main className="mx-auto min-h-screen max-w-5xl space-y-7 p-6 text-white">
    <Link href="/archives/profils" className="text-sm text-cyan-300 hover:underline">← Retour aux profils</Link>
    <header className="flex flex-col gap-5 rounded-2xl border border-cyan-400/30 bg-black/60 p-6 sm:flex-row sm:items-center">
      <span role="img" aria-label={`Avatar de ${profile.display_name}`} className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/50 bg-black bg-cover bg-center text-4xl" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{avatarUrl ? "" : "👤"}</span>
      <div><h1 className="text-3xl font-bold text-cyan-300">{profile.display_name}</h1><p className="text-gray-400">{profile.club_name ?? "Sans club"}</p>{profile.bio && <p className="mt-3 max-w-2xl text-sm text-gray-300">{profile.bio}</p>}</div>
    </header>

    <section className="rounded-2xl border border-purple-400/30 bg-black/50 p-6">
      <h2 className="mb-4 text-xl font-bold text-purple-300">Statistiques publiques</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Rang global", overall?.rank_position ? `#${overall.rank_position}` : "—"], ["Points CSC", overall?.score ?? 0], ["Matchs", statistics?.matches_played ?? 0], ["Victoires", statistics?.victories ?? 0], ["Défaites", statistics?.defeats ?? 0], ["Égalités", statistics?.draws ?? 0], ["Win Rate", overall ? `${overall.win_rate}%` : "0%"], ["Meilleure série", overall?.longest_win_streak ?? 0]].map(([label, value]) => <div key={label} className="rounded-lg border border-gray-700 bg-black/40 p-3"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}
      </div>
      {rankings.some((ranking) => ranking.mode !== null) && <div className="mt-5"><h3 className="mb-2 font-bold text-cyan-300">Classements par mode</h3><div className="grid gap-2 sm:grid-cols-2">{rankings.filter((ranking) => ranking.mode !== null).map((ranking) => <p key={ranking.mode} className="rounded border border-gray-700 p-3 text-sm">{modeLabels[ranking.mode ?? ""] ?? ranking.mode} · #{ranking.rank_position} · {ranking.score} points</p>)}</div></div>}
    </section>

    <section className="rounded-2xl border border-yellow-400/30 bg-black/50 p-6">
      <h2 className="mb-4 text-xl font-bold text-yellow-300">Badges débloqués</h2>
      {!badgeResult.data?.length && <p className="text-gray-400">Aucun badge débloqué.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{(badgeResult.data ?? []).map((badge) => <article key={badge.id} className="rounded-xl border border-yellow-400/30 bg-yellow-950/10 p-4 text-center"><div className="text-4xl">{badge.icon}</div><h3 className="mt-2 font-bold">{badge.name}</h3><p className="mt-1 text-xs text-gray-400">{badge.description}</p><p className="mt-2 text-xs text-yellow-300">{badge.rarity} · {badgeProgress.get(badge.id) ?? 100}%</p></article>)}</div>
    </section>
  </main>;
}

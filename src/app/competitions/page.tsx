import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ParticipantCompetitionsPage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/login?next=/competitions");
  const { data: participations } = await client.from("tournament_participants").select("id,tournament_id,display_name_snapshot,final_rank,status").eq("user_id", auth.user.id);
  const participantIds = (participations ?? []).map((item) => item.id);
  const accessResult = participantIds.length ? await client.from("competition_participant_access").select("participant_id,public_token").in("participant_id", participantIds) : null;
  const accesses = accessResult?.data ?? [];
  const tournamentIds = (participations ?? []).map((item) => item.tournament_id);
  const [{ data: tournaments }, { data: rankings }, { data: badges }] = await Promise.all([
    tournamentIds.length ? client.from("tournaments").select("id,name,status,settings").in("id", tournamentIds) : Promise.resolve({ data: [], error: null }),
    client.from("rankings").select("mode,score,victories,defeats,draws,matches_played").eq("user_id", auth.user.id),
    client.from("user_badges").select("badge_id,progress").eq("user_id", auth.user.id),
  ]);
  const tournamentById = new Map((tournaments ?? []).map((item) => [item.id, item]));
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").origin;
  const badgeCount = badges?.length ?? 0;
  const accessByParticipant = new Map((accesses ?? []).map((item) => [item.participant_id, item.public_token]));
  const cards = (participations ?? []).flatMap((participation) => {
    const token = accessByParticipant.get(participation.id);
    if (!token) return [];
    const url = `${site}/competition/p/${token}`;
    return [{ participation, token, qr: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&ecc=M&margin=8&data=${encodeURIComponent(url)}` }];
  });

  return <main className="mx-auto min-h-screen max-w-lg space-y-5 bg-slate-950 p-4 text-white"><header className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-cyan-300">Mes compétitions</h1><p className="text-sm text-gray-400">Planning, combats et résultats</p></div><Link href="/archives" className="text-cyan-300">Archives</Link></header>
    {!cards.length && <p className="rounded-xl border border-gray-700 p-5 text-gray-400">Aucune participation liée à votre profil.</p>}
    {cards.map(({ participation, token, qr }) => { const tournament = tournamentById.get(participation.tournament_id); return <section key={participation.id} className="rounded-2xl border border-purple-400/30 bg-black/60 p-5"><h2 className="text-xl font-bold text-purple-300">{tournament?.name ?? "Tournoi"}</h2><p className="text-sm text-gray-400">{participation.status} · {participation.final_rank ? `Classement #${participation.final_rank}` : "Classement en cours"}</p><div className="mx-auto my-4 w-fit rounded-xl bg-white p-2"><Image src={qr} alt="QR Code participant" width={180} height={180} unoptimized/></div><Link href={`/competition/p/${token}`} className="block rounded-lg bg-purple-700 px-4 py-2 text-center font-bold">Ouvrir mon planning</Link></section>; })}
    <section className="rounded-xl border border-cyan-400/30 bg-black/50 p-4"><h2 className="mb-2 font-bold text-cyan-300">Statistiques et résultats</h2>{(rankings ?? []).map((ranking) => <p key={ranking.mode ?? "overall"} className="text-sm">{ranking.mode ?? "Général"} : {ranking.score} pts · {ranking.victories} V · {ranking.defeats} D · {ranking.draws} N · {ranking.matches_played} matchs</p>)}</section>
    <section className="rounded-xl border border-yellow-400/30 bg-black/50 p-4"><h2 className="mb-2 font-bold text-yellow-300">Badges gagnés</h2><p className="text-sm text-gray-300">{badgeCount ? `${badgeCount} badge(s) débloqué(s)` : "Aucun badge débloqué pour le moment."}</p></section>
  </main>;
}

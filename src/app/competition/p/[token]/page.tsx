import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PublicCompetition = {
  participant: { name: string; club: string | null; rank: number | null; status: string };
  tournament: { id: string; name: string; status: string; progress: string };
  event: { id: string; name: string; location: string; starts_at: string; status: string };
  next_match: { id: number; scheduled_at: string | null; round: number | null; opponent: string | null } | null;
  activity: { name: string; estimated_start_at: string; room: string | null; tatami: string | null } | null;
  planning: Array<{ name: string; estimated_start_at: string; duration_minutes: number; room: string | null; tatami: string | null }>;
};

export default async function PublicParticipantPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) notFound();
  const client = await createClient();
  const { data, error } = await client.rpc("competition_participant_public", { target_token: token });
  if (error || !data) notFound();
  const competition = data as unknown as PublicCompetition;
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").origin;
  const url = `${site}/competition/p/${token}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=M&margin=8&data=${encodeURIComponent(url)}`;

  return <main className="mx-auto min-h-screen max-w-lg space-y-5 bg-slate-950 p-4 text-white">
    <header className="rounded-2xl border border-cyan-400/30 bg-black/60 p-5 text-center"><p className="text-xs uppercase tracking-widest text-cyan-300">{competition.event.name}</p><h1 className="mt-2 text-3xl font-bold">{competition.participant.name}</h1><p className="text-gray-400">{competition.participant.club ?? "Club non renseigné"}</p><div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3"><Image src={qr} alt={`QR Code de ${competition.participant.name}`} width={240} height={240} unoptimized/></div></header>
    <section className="grid grid-cols-2 gap-3">{[["Tournoi", competition.tournament.name],["Classement", competition.participant.rank ? `#${competition.participant.rank}` : "En cours"],["Lieu", competition.event.location],["Progression", competition.tournament.progress]].map(([label,value]) => <div key={label} className="rounded-xl border border-gray-700 bg-black/50 p-3"><p className="text-xs text-gray-400">{label}</p><p className="font-bold">{value}</p></div>)}</section>
    <section className="rounded-xl border border-purple-400/30 bg-black/50 p-4"><h2 className="font-bold text-purple-300">Prochain combat</h2>{competition.next_match ? <div className="mt-2 text-sm"><p>Adversaire : <strong>{competition.next_match.opponent ?? "À déterminer"}</strong></p><p>Round : {competition.next_match.round ?? "—"}</p><p>Horaire : {competition.next_match.scheduled_at ? new Date(competition.next_match.scheduled_at).toLocaleString("fr-FR") : competition.activity ? new Date(competition.activity.estimated_start_at).toLocaleString("fr-FR") : "À déterminer"}</p><p>Tatami : {competition.activity?.tatami ?? "À déterminer"}</p></div> : <p className="mt-2 text-sm text-gray-400">Le prochain adversaire n’est pas encore déterminé.</p>}</section>
    <section className="rounded-xl border border-green-400/30 bg-black/50 p-4"><h2 className="mb-3 font-bold text-green-300">Planning de la journée</h2><div className="space-y-2">{competition.planning.map((item) => <div key={`${item.name}-${item.estimated_start_at}`} className="border-l-2 border-green-500 pl-3 text-sm"><p className="font-bold">{item.name}</p><p className="text-gray-400">{new Date(item.estimated_start_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {item.duration_minutes} min · {item.room ?? "Salle —"} · Tatami {item.tatami ?? "—"}</p></div>)}</div></section>
    <Link href="/competitions" className="block rounded-xl border border-cyan-400 px-4 py-3 text-center text-cyan-300">Mon espace compétition</Link>
  </main>;
}

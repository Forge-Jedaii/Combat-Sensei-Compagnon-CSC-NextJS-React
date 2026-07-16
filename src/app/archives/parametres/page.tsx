import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeProfileStatus, changeRole, createClub, deleteClub, deleteMatch, toggleAchievement, toggleBadge } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

const panel = "rounded-xl border border-gray-700 bg-black/50 p-5";
const input = "rounded border border-gray-600 bg-black px-2 py-1.5 text-sm text-white";

export default async function DatabaseSettingsPage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/login?next=/archives/parametres");
  const { data: adminRole } = await client.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
  if (!adminRole) redirect("/archives");

  const [profilesResult, rolesResult, clubsResult, achievementsResult, badgesResult, auditResult, outboxResult, matchesCount, tournamentsCount, matchesResult] = await Promise.all([
    client.from("profiles").select("id,display_name,status,club_id,created_at").order("created_at", { ascending: false }),
    client.from("user_roles").select("user_id,role,granted_at"),
    client.from("clubs").select("id,name,slug,city,is_verified").order("name"),
    client.from("achievements").select("id,name,is_active,is_secret,points_reward").order("name"),
    client.from("badges").select("id,name,rarity,is_active").order("name"),
    client.from("role_audit_log").select("*").order("occurred_at", { ascending: false }).limit(100),
    client.from("email_outbox").select("id,user_id,template,created_at,sent_at,last_error").order("created_at", { ascending: false }).limit(100),
    client.from("matches").select("id", { count: "exact", head: true }),
    client.from("tournaments").select("id", { count: "exact", head: true }),
    client.from("matches").select("id,public_id,mode,status,result_type,winner_participant_id,started_at,ended_at,duration_seconds,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  const dashboardError = profilesResult.error ?? rolesResult.error ?? clubsResult.error ?? achievementsResult.error
    ?? badgesResult.error ?? auditResult.error ?? outboxResult.error ?? matchesCount.error ?? tournamentsCount.error ?? matchesResult.error;
  if (dashboardError) throw new Error(`Chargement de l’administration impossible : ${dashboardError.message}`);
  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];
  const authUsers = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authUsers.error) throw new Error(`Chargement des comptes Auth impossible : ${authUsers.error.message}`);
  const emailById = new Map((authUsers.data.users ?? []).map((user) => [user.id, user.email ?? "—"]));
  const pending = profiles.filter((profile) => profile.status === "pending");
  const matches = matchesResult.data ?? [];
  const matchIds = matches.map((match) => match.id);
  const matchParticipantsResult = matchIds.length
    ? await client.from("match_participants").select("id,match_id,display_name_snapshot,position,starting_health,final_health,score,is_winner,user_id").in("match_id", matchIds).order("position")
    : { data: [], error: null };
  if (matchParticipantsResult.error) throw new Error(`Chargement des participants impossible : ${matchParticipantsResult.error.message}`);
  const matchParticipants = matchParticipantsResult.data ?? [];

  return <main className="mx-auto min-h-screen max-w-7xl space-y-7 p-6 text-white">
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-cyan-300">Paramètres DB</h1><p className="text-sm text-gray-400">Administration Supabase et PostgreSQL</p></div><Link href="/archives" className="text-cyan-300 hover:underline">← Archives</Link></div>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Utilisateurs", profiles.length], ["En attente", pending.length], ["Matchs", matchesCount.count ?? 0], ["Tournois", tournamentsCount.count ?? 0], ["Emails en attente", (outboxResult.data ?? []).filter((item) => !item.sent_at).length]].map(([label,value]) => <div className={panel} key={label}><p className="text-xs text-gray-400">{label}</p><p className="text-2xl font-bold text-cyan-300">{value}</p></div>)}</section>

    <section className={panel}>
      <div className="mb-4"><h2 className="text-xl font-bold text-red-300">Historique de tous les matchs</h2><p className="text-xs text-gray-400">La suppression reconstruit automatiquement points, statistiques, rankings, achievements et badges des participants.</p></div>
      {!matches.length && <p className="text-gray-400">Aucun match enregistré.</p>}
      <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-1">
        {matches.map((match) => {
          const participants = matchParticipants.filter((participant) => participant.match_id === match.id);
          const winner = participants.find((participant) => participant.id === match.winner_participant_id);
          return <article key={match.id} className="rounded-lg border border-gray-700 bg-black/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">CSC-{match.public_id} · {match.mode.replaceAll("_", " ")}</p>
                <p className="text-xs text-gray-400">{new Date(match.started_at ?? match.created_at).toLocaleString("fr-FR")} · {match.status} · {match.duration_seconds == null ? "durée —" : `${match.duration_seconds} s`}</p>
                <p className="mt-1 text-sm text-yellow-200">Vainqueur : {winner?.display_name_snapshot ?? (match.result_type === "draw" ? "Égalité" : "—")}</p>
              </div>
              <form action={deleteMatch}>
                <input type="hidden" name="matchId" value={match.id}/>
                <SubmitButton pendingLabel="Suppression…" confirmation={`Supprimer définitivement le match CSC-${match.public_id} et recalculer toute la progression liée ?`} className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-300 disabled:opacity-50">Supprimer</SubmitButton>
              </form>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {participants.map((participant) => {
                const points = match.status !== "completed" ? 0 : match.result_type === "draw" ? 5 : participant.is_winner ? 10 : 2;
                return <div key={participant.id} className="rounded border border-gray-800 p-2 text-sm"><p className="font-semibold">{participant.display_name_snapshot}</p><p className="text-gray-400">PV : {participant.starting_health ?? "—"} → {participant.final_health ?? "—"} · Score : {participant.score}</p><p className="text-cyan-300">Progression CSC : +{points} points</p></div>;
              })}
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className={panel}><h2 className="mb-4 text-xl font-bold text-yellow-300">Demandes en attente</h2>{!pending.length && <p className="text-gray-400">Aucune demande.</p>}<div className="space-y-3">{pending.map((profile) => <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-700 p-3"><div><p className="font-bold">{profile.display_name}</p><p className="text-xs text-gray-400">{emailById.get(profile.id)}</p></div><div className="flex gap-2"><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="status" value="active"/><SubmitButton pendingLabel="Validation…" className="rounded bg-green-700 px-3 py-1.5 disabled:opacity-50">Valider</SubmitButton></form><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="status" value="rejected"/><SubmitButton pendingLabel="Refus…" confirmation={`Refuser définitivement la demande de ${profile.display_name} ?`} className="rounded bg-red-700 px-3 py-1.5 disabled:opacity-50">Refuser</SubmitButton></form></div></div>)}</div></section>

    <section className={panel}><h2 className="mb-4 text-xl font-bold text-purple-300">Utilisateurs, profils et rôles</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-gray-400"><th>Profil</th><th>Email</th><th>Statut</th><th>Rôles</th><th>Actions</th></tr></thead><tbody>{profiles.map((profile) => { const userRoles = roles.filter((role) => role.user_id === profile.id).map((role) => role.role); return <tr key={profile.id} className="border-t border-gray-800"><td className="py-3">{profile.display_name}</td><td>{emailById.get(profile.id)}</td><td>{profile.status}</td><td>{userRoles.join(", ")}</td><td><div className="flex flex-wrap gap-1"><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><select name="status" defaultValue={profile.status} className={input}><option value="pending">pending</option><option value="active">active</option><option value="suspended">suspended</option><option value="rejected">rejected</option></select><button className="ml-1 rounded border border-cyan-600 px-2 py-1">Appliquer</button></form>{(["member","moderator","admin"] as const).map((role) => <form action={changeRole} key={role}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="role" value={role}/><input type="hidden" name="operation" value={userRoles.includes(role) ? "revoke" : "grant"}/><button className="rounded border border-gray-600 px-2 py-1">{userRoles.includes(role) ? "−" : "+"} {role}</button></form>)}</div></td></tr>; })}</tbody></table></div></section>

    <section className="grid gap-6 lg:grid-cols-2"><div className={panel}><h2 className="mb-3 text-xl font-bold text-green-300">Clubs</h2><form action={createClub} className="mb-4 flex flex-wrap gap-2"><input aria-label="Nom du club" name="name" required placeholder="Nom" className={input}/><input aria-label="Identifiant du club" name="slug" required pattern="[a-z0-9-]+" placeholder="slug" className={input}/><input aria-label="Ville du club" name="city" placeholder="Ville" className={input}/><SubmitButton pendingLabel="Ajout…" className="rounded bg-green-700 px-3 disabled:opacity-50">Ajouter</SubmitButton></form>{(clubsResult.data ?? []).map((club) => <div key={club.id} className="flex justify-between gap-3 border-t border-gray-800 py-2"><span>{club.name} · {club.city ?? "—"}</span><form action={deleteClub}><input type="hidden" name="clubId" value={club.id}/><SubmitButton pendingLabel="Suppression…" confirmation={`Supprimer le club ${club.name} ?`} className="text-red-300 disabled:opacity-50">Supprimer</SubmitButton></form></div>)}</div>
    <div className={panel}><h2 className="mb-3 text-xl font-bold text-yellow-300">Achievements</h2>{(achievementsResult.data ?? []).map((achievement) => <div key={achievement.id} className="flex justify-between border-t border-gray-800 py-2"><span>{achievement.name} {achievement.is_secret ? "🔒" : ""}</span><form action={toggleAchievement}><input type="hidden" name="id" value={achievement.id}/><input type="hidden" name="active" value={String(achievement.is_active)}/><button className={achievement.is_active ? "text-green-300" : "text-gray-500"}>{achievement.is_active ? "Actif" : "Inactif"}</button></form></div>)}</div></section>

    <section className="grid gap-6 lg:grid-cols-2"><div className={panel}><h2 className="mb-3 text-xl font-bold text-orange-300">Badges</h2>{(badgesResult.data ?? []).map((badge) => <div key={badge.id} className="flex justify-between border-t border-gray-800 py-2"><span>{badge.name} · {badge.rarity}</span><form action={toggleBadge}><input type="hidden" name="id" value={badge.id}/><input type="hidden" name="active" value={String(badge.is_active)}/><button className={badge.is_active ? "text-green-300" : "text-gray-500"}>{badge.is_active ? "Actif" : "Inactif"}</button></form></div>)}</div><div className={panel}><h2 className="mb-3 text-xl font-bold text-blue-300">File email</h2>{(outboxResult.data ?? []).map((item) => <div key={item.id} className="border-t border-gray-800 py-2 text-sm"><p>{item.template} · {emailById.get(item.user_id)}</p><p className={item.sent_at ? "text-green-400" : item.last_error ? "text-red-400" : "text-yellow-400"}>{item.sent_at ? "Envoyé" : item.last_error ?? "En attente de transport"}</p></div>)}</div></section>

    <section className={panel}><h2 className="mb-3 text-xl font-bold text-gray-200">Journal d’audit des rôles</h2><div className="max-h-72 overflow-auto">{(auditResult.data ?? []).map((entry) => <p key={entry.id} className="border-t border-gray-800 py-2 text-sm">{new Date(entry.occurred_at).toLocaleString("fr-FR")} · {entry.action} {entry.role} · cible {entry.target_user_id}</p>)}</div></section>
  </main>;
}

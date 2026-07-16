import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeProfileStatus, changeRole, createClub, deleteClub, deleteMatch, toggleAchievement, toggleBadge } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import AdminSection from "@/components/admin/AdminSection";
import AdminMetricLink from "@/components/admin/AdminMetricLink";

const input = "rounded border border-gray-600 bg-black px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400";
const modeLabels: Record<string, string> = { duel: "Duel", official_duel: "Duel officiel", handicap: "Handicap", tournament: "Tournoi", highlander: "Highlander", battle_royale: "Battle Royale" };
const statusClasses: Record<string, string> = { active: "text-green-300", pending: "text-yellow-300", suspended: "text-orange-300", rejected: "text-red-300", completed: "text-green-300", cancelled: "text-gray-400", draft: "text-gray-400" };

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
  const clubs = clubsResult.data ?? [];
  const achievements = achievementsResult.data ?? [];
  const badges = badgesResult.data ?? [];
  const emails = outboxResult.data ?? [];
  const auditEntries = auditResult.data ?? [];
  const matches = matchesResult.data ?? [];
  const pending = profiles.filter((profile) => profile.status === "pending");
  const waitingEmails = emails.filter((item) => !item.sent_at).length;

  const authUsers = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authUsers.error) throw new Error(`Chargement des comptes Auth impossible : ${authUsers.error.message}`);
  const emailById = new Map((authUsers.data.users ?? []).map((user) => [user.id, user.email ?? "—"]));

  const matchIds = matches.map((match) => match.id);
  const matchParticipantsResult = matchIds.length
    ? await client.from("match_participants").select("id,match_id,display_name_snapshot,position,starting_health,final_health,score,is_winner,user_id").in("match_id", matchIds).order("position")
    : { data: [], error: null };
  if (matchParticipantsResult.error) throw new Error(`Chargement des participants impossible : ${matchParticipantsResult.error.message}`);
  const matchParticipants = matchParticipantsResult.data ?? [];

  const metrics = [
    { label: "Utilisateurs", value: profiles.length, href: "#users", tone: "text-cyan-300" },
    { label: "À valider", value: pending.length, href: "#pending", tone: pending.length ? "text-yellow-300" : "text-green-300" },
    { label: "Matchs", value: matchesCount.count ?? 0, href: "#matches", tone: "text-red-300" },
    { label: "Tournois", value: tournamentsCount.count ?? 0, href: "/archives/competitions", tone: "text-purple-300" },
    { label: "Emails en attente", value: waitingEmails, href: "#emails", tone: waitingEmails ? "text-yellow-300" : "text-green-300" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 p-4 text-white sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-400/20 bg-black/50 p-5">
        <div><h1 className="text-2xl font-bold text-cyan-300 sm:text-3xl">Paramètres DB</h1><p className="mt-1 text-sm text-gray-400">Administration Supabase et PostgreSQL · sections fermées par défaut</p></div>
        <div className="flex gap-2"><Link href="/archives/competitions" className="rounded-lg border border-purple-500/40 px-3 py-2 text-sm text-purple-300 hover:bg-purple-500/10">Compétitions</Link><Link href="/archives" className="rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10">← Archives</Link></div>
      </header>

      <nav aria-label="Résumé de l’administration" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => <AdminMetricLink key={metric.label} {...metric} />)}
      </nav>

      <AdminSection id="pending" title="Demandes en attente" description="Valider ou refuser les nouvelles inscriptions." count={pending.length} tone="yellow">
        {!pending.length ? <p className="text-sm text-gray-400">Aucune demande à traiter.</p> : <div className="space-y-3">{pending.map((profile) => <article key={profile.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-700 p-3"><div><p className="font-bold">{profile.display_name}</p><p className="text-xs text-gray-400">{emailById.get(profile.id)}</p></div><div className="flex flex-wrap gap-2"><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="status" value="active"/><SubmitButton pendingLabel="Validation…" className="rounded bg-green-700 px-3 py-1.5 disabled:opacity-50">Valider</SubmitButton></form><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="status" value="rejected"/><SubmitButton pendingLabel="Refus…" confirmation={`Refuser définitivement la demande de ${profile.display_name} ?`} className="rounded bg-red-700 px-3 py-1.5 disabled:opacity-50">Refuser</SubmitButton></form></div></article>)}</div>}
      </AdminSection>

      <AdminSection id="matches" title="Historique de tous les matchs" description="Consulter les résultats et supprimer un match avec recalcul automatique de la progression." count={matches.length} tone="red">
        {!matches.length ? <p className="text-gray-400">Aucun match enregistré.</p> : <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-1">{matches.map((match) => {
          const participants = matchParticipants.filter((participant) => participant.match_id === match.id);
          const winner = participants.find((participant) => participant.id === match.winner_participant_id);
          return <article key={match.id} className="rounded-lg border border-gray-700 bg-black/40 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">CSC-{match.public_id} · {modeLabels[match.mode] ?? match.mode}</p><p className="text-xs text-gray-400">{new Date(match.started_at ?? match.created_at).toLocaleString("fr-FR")} · <span className={statusClasses[match.status]}>{match.status}</span> · {match.duration_seconds == null ? "durée —" : `${match.duration_seconds} s`}</p><p className="mt-1 text-sm text-yellow-200">Vainqueur : {winner?.display_name_snapshot ?? (match.result_type === "draw" ? "Égalité" : "—")}</p></div><form action={deleteMatch}><input type="hidden" name="matchId" value={match.id}/><SubmitButton pendingLabel="Suppression…" confirmation={`Supprimer définitivement le match CSC-${match.public_id} et recalculer toute la progression liée ?`} className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-300 disabled:opacity-50">Supprimer</SubmitButton></form></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{participants.map((participant) => { const points = match.status !== "completed" ? 0 : match.result_type === "draw" ? 5 : participant.is_winner ? 10 : 2; return <div key={participant.id} className="rounded border border-gray-800 p-2 text-sm"><p className="font-semibold">{participant.display_name_snapshot}</p><p className="text-gray-400">PV : {participant.starting_health ?? "—"} → {participant.final_health ?? "—"} · Score : {participant.score}</p><p className="text-cyan-300">Progression CSC : +{points} points</p></div>; })}</div></article>;
        })}</div>}
      </AdminSection>

      <AdminSection id="users" title="Utilisateurs, profils et rôles" description="Gérer le statut et les permissions de chaque compte." count={profiles.length} tone="purple">
        <div className="max-h-[36rem] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-[#080b16] text-gray-400"><tr><th className="p-2">Profil</th><th>Email</th><th>Statut</th><th>Rôles</th><th>Actions</th></tr></thead><tbody>{profiles.map((profile) => { const userRoles = roles.filter((role) => role.user_id === profile.id).map((role) => role.role); return <tr key={profile.id} className="border-t border-gray-800"><td className="p-2 font-semibold">{profile.display_name}</td><td>{emailById.get(profile.id)}</td><td className={statusClasses[profile.status]}>{profile.status}</td><td>{userRoles.join(", ")}</td><td className="py-2"><div className="flex flex-wrap gap-1"><form action={changeProfileStatus}><input type="hidden" name="userId" value={profile.id}/><select aria-label={`Statut de ${profile.display_name}`} name="status" defaultValue={profile.status} className={input}><option value="pending">pending</option><option value="active">active</option><option value="suspended">suspended</option><option value="rejected">rejected</option></select><button className="ml-1 rounded border border-cyan-600 px-2 py-1">Appliquer</button></form>{(["member","moderator","admin"] as const).map((role) => <form action={changeRole} key={role}><input type="hidden" name="userId" value={profile.id}/><input type="hidden" name="role" value={role}/><input type="hidden" name="operation" value={userRoles.includes(role) ? "revoke" : "grant"}/><button title={`${userRoles.includes(role) ? "Retirer" : "Ajouter"} le rôle ${role}`} className="rounded border border-gray-600 px-2 py-1">{userRoles.includes(role) ? "−" : "+"} {role}</button></form>)}</div></td></tr>; })}</tbody></table></div>
      </AdminSection>

      <AdminSection id="clubs" title="Clubs" description="Créer et supprimer les clubs disponibles dans les profils." count={clubs.length} tone="green">
        <form action={createClub} className="mb-4 grid gap-2 sm:grid-cols-4"><input aria-label="Nom du club" name="name" required placeholder="Nom" className={input}/><input aria-label="Identifiant du club" name="slug" required pattern="[a-z0-9-]+" placeholder="slug-exemple" className={input}/><input aria-label="Ville du club" name="city" placeholder="Ville" className={input}/><SubmitButton pendingLabel="Ajout…" className="rounded bg-green-700 px-3 disabled:opacity-50">Ajouter le club</SubmitButton></form><div className="max-h-72 overflow-y-auto">{clubs.map((club) => <div key={club.id} className="flex items-center justify-between gap-3 border-t border-gray-800 py-2"><span>{club.name} · <span className="text-gray-400">{club.city ?? "ville non renseignée"}</span></span><form action={deleteClub}><input type="hidden" name="clubId" value={club.id}/><SubmitButton pendingLabel="Suppression…" confirmation={`Supprimer le club ${club.name} ?`} className="text-red-300 disabled:opacity-50">Supprimer</SubmitButton></form></div>)}</div>
      </AdminSection>

      <AdminSection id="achievements" title="Achievements" description="Activer ou masquer les objectifs proposés aux combattants." count={achievements.length} tone="yellow">
        <div className="grid max-h-[32rem] gap-x-6 overflow-y-auto md:grid-cols-2">{achievements.map((achievement) => <div key={achievement.id} className="flex items-center justify-between gap-3 border-t border-gray-800 py-2"><span>{achievement.name} {achievement.is_secret ? "🔒" : ""}<small className="ml-2 text-gray-500">{achievement.points_reward} pts</small></span><form action={toggleAchievement}><input type="hidden" name="id" value={achievement.id}/><input type="hidden" name="active" value={String(achievement.is_active)}/><button aria-label={`${achievement.is_active ? "Désactiver" : "Activer"} ${achievement.name}`} className={achievement.is_active ? "text-green-300" : "text-gray-500"}>{achievement.is_active ? "Actif" : "Inactif"}</button></form></div>)}</div>
      </AdminSection>

      <AdminSection id="badges" title="Badges et titres" description="Contrôler les récompenses visibles dans le catalogue." count={badges.length} tone="orange">
        <div className="grid max-h-[32rem] gap-x-6 overflow-y-auto md:grid-cols-2">{badges.map((badge) => <div key={badge.id} className="flex items-center justify-between gap-3 border-t border-gray-800 py-2"><span>{badge.name} · <small className="text-gray-400">{badge.rarity}</small></span><form action={toggleBadge}><input type="hidden" name="id" value={badge.id}/><input type="hidden" name="active" value={String(badge.is_active)}/><button aria-label={`${badge.is_active ? "Désactiver" : "Activer"} ${badge.name}`} className={badge.is_active ? "text-green-300" : "text-gray-500"}>{badge.is_active ? "Actif" : "Inactif"}</button></form></div>)}</div>
      </AdminSection>

      <AdminSection id="emails" title="File email" description="Surveiller les notifications en attente, envoyées ou en erreur." count={waitingEmails} tone="blue">
        {!emails.length ? <p className="text-gray-400">Aucun email en file.</p> : <div className="max-h-80 overflow-y-auto">{emails.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-800 py-2 text-sm"><div><p>{item.template} · {emailById.get(item.user_id)}</p><p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString("fr-FR")}</p></div><p className={item.sent_at ? "text-green-400" : item.last_error ? "text-red-400" : "text-yellow-400"}>{item.sent_at ? "Envoyé" : item.last_error ?? "En attente de transport"}</p></div>)}</div>}
      </AdminSection>

      <AdminSection id="audit" title="Journal d’audit des rôles" description="Historique récent des attributions et retraits de permissions." count={auditEntries.length} tone="gray">
        {!auditEntries.length ? <p className="text-gray-400">Aucune opération enregistrée.</p> : <div className="max-h-80 overflow-y-auto">{auditEntries.map((entry) => <p key={entry.id} className="border-t border-gray-800 py-2 text-sm"><span className="text-gray-400">{new Date(entry.occurred_at).toLocaleString("fr-FR")}</span> · <strong>{entry.action}</strong> {entry.role} · cible {entry.target_user_id}</p>)}</div>}
      </AdminSection>
    </main>
  );
}

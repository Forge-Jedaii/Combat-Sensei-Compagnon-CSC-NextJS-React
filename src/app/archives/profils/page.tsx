import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, updateEmail, updateProfile, uploadAvatar } from "./actions";
import { logout } from "@/app/auth/actions";
import { ArchiveService, calculateFighterStatistics } from "@/services/archive.service";

const inputClass = "w-full rounded-lg border border-gray-600 bg-black px-3 py-2 text-white outline-none focus:border-cyan-400";
const modeLabels: Record<string, string> = { duel: "Duel", official_duel: "Duel officiel", handicap: "Handicap", tournament: "Tournoi", highlander: "Highlander", battle_royale: "Battle Royale" };

function combatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : "", `${seconds} s`].filter(Boolean).join(" ");
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/archives/profils");

  const [{ data: profile }, { data: clubs }, fighterData] = await Promise.all([
    supabase.from("profiles").select("display_name, bio, avatar_path, share_data, club_id, created_at").eq("id", authData.user.id).single(),
    supabase.from("clubs").select("id, name").order("name"),
    new ArchiveService(supabase).fighterData(authData.user.id),
  ]);
  if (!profile) redirect("/login?error=Profil+introuvable.");

  const avatarUrl = profile.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;
  const statistics = calculateFighterStatistics(fighterData);
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

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-7 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/archives" className="text-sm text-cyan-300 hover:underline">← Retour aux Archives</Link>
        <form action={logout}><button className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:border-red-400">Se déconnecter</button></form>
      </div>

      <header>
        <h1 className="text-3xl font-bold text-cyan-300">Mon profil</h1>
        <p className="mt-1 text-sm text-gray-400">Compte vérifié : {authData.user.email_confirmed_at ? "oui" : "non"}</p>
      </header>

      {(params.error || params.message) && (
        <p className={`rounded-lg border p-3 text-sm ${params.error ? "border-red-500/40 text-red-300" : "border-green-500/40 text-green-300"}`}>
          {params.error ?? params.message}
        </p>
      )}

      <section className="grid gap-6 rounded-2xl border border-cyan-400/30 bg-black/60 p-6 md:grid-cols-[180px_1fr]">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-cyan-400/50 bg-black">
            {avatarUrl ? (
              <span
                role="img"
                aria-label="Avatar"
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
            ) : <span className="text-4xl">👤</span>}
          </div>
          <form action={uploadAvatar} className="space-y-2" encType="multipart/form-data">
            <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-xs text-gray-400" />
            <button className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-300">Changer l’avatar</button>
          </form>
        </div>

        <form action={updateProfile} className="space-y-4">
          <label className="block space-y-1 text-sm text-gray-300">Pseudo
            <input className={inputClass} name="displayName" defaultValue={profile.display_name} minLength={2} maxLength={40} required />
          </label>
          <label className="block space-y-1 text-sm text-gray-300">Club
            <select className={inputClass} name="clubId" defaultValue={profile.club_id ?? ""}>
              <option value="">Aucun club</option>
              {(clubs ?? []).map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm text-gray-300">Biographie
            <textarea className={inputClass} name="bio" defaultValue={profile.bio ?? ""} maxLength={500} rows={4} />
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input type="checkbox" name="shareData" defaultChecked={profile.share_data} className="h-5 w-5 accent-purple-500" />
            Afficher mon profil, mes badges et mon classement dans les espaces publics
          </label>
          <button className="rounded-lg bg-cyan-600 px-5 py-2.5 font-bold hover:bg-cyan-500">Enregistrer le profil</button>
        </form>
      </section>

      <section className="rounded-2xl border border-cyan-400/30 bg-black/60 p-6">
        <h2 className="mb-4 text-xl font-bold text-cyan-300">Profil combattant</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statisticItems.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-700 bg-black/40 p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="mt-1 font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-purple-400/30 bg-black/60 p-6">
        <h2 className="mb-4 text-xl font-bold text-purple-300">Adresse email</h2>
        <form action={updateEmail} className="flex flex-col gap-3 sm:flex-row">
          <input className={inputClass} name="email" type="email" defaultValue={authData.user.email} required />
          <button className="whitespace-nowrap rounded-lg bg-purple-600 px-5 py-2.5 font-bold hover:bg-purple-500">Modifier l’email</button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6">
        <h2 className="text-xl font-bold text-red-300">Zone dangereuse</h2>
        <p className="my-3 text-sm text-gray-400">La suppression retire définitivement le compte Auth et toutes les données liées par cascade.</p>
        <form action={deleteAccount} className="space-y-3">
          <label className="block max-w-md space-y-1 text-sm text-gray-300">
            Mot de passe actuel
            <input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          <button className="rounded-lg border border-red-500 bg-red-600/70 px-5 py-2.5 font-bold hover:bg-red-600">Supprimer définitivement mon compte</button>
        </form>
      </section>
    </main>
  );
}

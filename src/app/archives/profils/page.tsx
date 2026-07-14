import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, updateEmail, updatePassword, updateProfile, uploadAvatar } from "./actions";
import { logout } from "@/app/auth/actions";
import SubmitButton from "@/components/ui/SubmitButton";

const inputClass = "w-full rounded-lg border border-gray-600 bg-black px-3 py-2 text-white outline-none focus:border-cyan-400";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/archives/profils");

  const [{ data: profile }, { data: clubs }, { data: publicProfiles, error: directoryError }] = await Promise.all([
    supabase.from("profiles").select("display_name, bio, avatar_path, share_data, club_id, created_at").eq("id", authData.user.id).single(),
    supabase.from("clubs").select("id, name").order("name"),
    supabase.from("public_profiles").select("*").order("display_name"),
  ]);
  if (!profile) redirect("/login?error=Profil+introuvable.");
  if (directoryError) throw new Error(`Chargement de l’annuaire impossible : ${directoryError.message}`);

  const avatarUrl = profile.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;
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

      <section className="rounded-2xl border border-purple-400/30 bg-black/60 p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-purple-300">Combattants de la Forge</h2>
          <p className="mt-1 text-sm text-gray-400">Les membres présentés ici ont choisi de partager leur profil et leurs résultats.</p>
        </div>
        {!publicProfiles?.length && <p className="text-gray-400">Aucun profil public pour le moment.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(publicProfiles ?? []).map((member) => {
            const memberAvatar = member.avatar_path ? supabase.storage.from("avatars").getPublicUrl(member.avatar_path).data.publicUrl : null;
            return (
              <Link key={member.id} href={`/archives/profils/${member.id}`} className="rounded-xl border border-gray-700 bg-black/40 p-4 transition hover:border-cyan-400/60 hover:bg-cyan-950/20">
                <div className="flex items-center gap-3">
                  <span role="img" aria-label={`Avatar de ${member.display_name}`} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/40 bg-black bg-cover bg-center text-xl" style={memberAvatar ? { backgroundImage: `url(${memberAvatar})` } : undefined}>{memberAvatar ? "" : "👤"}</span>
                  <div className="min-w-0"><h3 className="truncate font-bold text-white">{member.display_name}</h3><p className="truncate text-xs text-gray-400">{member.club_name ?? "Sans club"}</p></div>
                </div>
                {member.bio && <p className="mt-3 line-clamp-2 text-sm text-gray-300">{member.bio}</p>}
                <p className="mt-3 text-xs font-semibold text-cyan-300">Voir statistiques, rang et badges →</p>
              </Link>
            );
          })}
        </div>
      </section>

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
            <SubmitButton pendingLabel="Envoi…" className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-300 disabled:opacity-50">Changer l’avatar</SubmitButton>
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
          <SubmitButton className="rounded-lg bg-cyan-600 px-5 py-2.5 font-bold hover:bg-cyan-500 disabled:opacity-50">Enregistrer le profil</SubmitButton>
        </form>
      </section>

      <section className="rounded-2xl border border-purple-400/30 bg-black/60 p-6">
        <h2 className="mb-4 text-xl font-bold text-purple-300">Adresse email</h2>
        <form action={updateEmail} className="flex flex-col gap-3 sm:flex-row">
          <input className={inputClass} name="email" type="email" defaultValue={authData.user.email} required />
          <SubmitButton pendingLabel="Modification…" className="whitespace-nowrap rounded-lg bg-purple-600 px-5 py-2.5 font-bold hover:bg-purple-500 disabled:opacity-50">Modifier l’email</SubmitButton>
        </form>
      </section>

      <section className="rounded-2xl border border-purple-400/30 bg-black/60 p-6">
        <h2 className="mb-4 text-xl font-bold text-purple-300">Mot de passe</h2>
        <form action={updatePassword} className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Nouveau mot de passe" required />
          <input className={inputClass} name="passwordConfirmation" type="password" minLength={8} autoComplete="new-password" placeholder="Confirmer le mot de passe" required />
          <SubmitButton pendingLabel="Modification…" className="rounded-lg bg-purple-600 px-5 py-2.5 font-bold hover:bg-purple-500 disabled:opacity-50 sm:col-span-2">Modifier le mot de passe</SubmitButton>
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
          <SubmitButton pendingLabel="Suppression…" confirmation="Supprimer définitivement votre compte et toutes les données associées ?" className="rounded-lg border border-red-500 bg-red-600/70 px-5 py-2.5 font-bold hover:bg-red-600 disabled:opacity-50">Supprimer définitivement mon compte</SubmitButton>
        </form>
      </section>
    </main>
  );
}

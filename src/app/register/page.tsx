import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AuthNotice, EmailField, PasswordField, SubmitButton } from "@/components/auth/AuthFields";
import { register } from "@/app/auth/actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell title="Créer un compte" subtitle="Rejoignez les combattants de la Forge">
      <form action={register} className="space-y-4">
        <AuthNotice error={params.error} />
        <label className="block space-y-1.5 text-sm text-gray-300">
          <span>Pseudo</span>
          <input
            className="w-full rounded-lg border border-gray-600 bg-black/70 px-3 py-2.5 outline-none focus:border-cyan-400"
            name="displayName"
            minLength={2}
            maxLength={31}
            autoComplete="nickname"
            required
          />
        </label>
        <EmailField />
        <PasswordField autoComplete="new-password" />
        <PasswordField name="passwordConfirmation" label="Confirmer le mot de passe" autoComplete="new-password" />
        <SubmitButton>Créer mon compte</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-gray-400">
        Déjà inscrit ?{" "}<Link href="/login" className="text-purple-300 hover:underline">Se connecter</Link>
      </p>
    </AuthShell>
  );
}

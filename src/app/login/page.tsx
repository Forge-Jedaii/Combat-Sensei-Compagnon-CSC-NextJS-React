import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AuthNotice, EmailField, PasswordField, SubmitButton } from "@/components/auth/AuthFields";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace Combat Sensei">
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={params.next ?? "/archives"} />
        <AuthNotice error={params.error} message={params.message} />
        <EmailField />
        <PasswordField />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-cyan-300 hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-gray-400">
        Nouveau membre ?{" "}
        <Link href="/register" className="text-purple-300 hover:underline">Créer un compte</Link>
      </p>
    </AuthShell>
  );
}

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { AuthNotice, EmailField, SubmitButton } from "@/components/auth/AuthFields";
import { forgotPassword } from "@/app/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Nous vous enverrons un lien sécurisé">
      <form action={forgotPassword} className="space-y-4">
        <AuthNotice error={params.error} message={params.message} />
        <EmailField />
        <SubmitButton>Envoyer le lien</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm"><Link href="/login" className="text-cyan-300 hover:underline">Retour à la connexion</Link></p>
    </AuthShell>
  );
}

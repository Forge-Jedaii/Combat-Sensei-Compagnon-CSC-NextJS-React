import AuthShell from "@/components/auth/AuthShell";
import { AuthNotice, PasswordField, SubmitButton } from "@/components/auth/AuthFields";
import { resetPassword } from "@/app/auth/actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe d’au moins 8 caractères">
      <form action={resetPassword} className="space-y-4">
        <AuthNotice error={params.error} />
        <PasswordField autoComplete="new-password" />
        <PasswordField name="passwordConfirmation" label="Confirmer le mot de passe" autoComplete="new-password" />
        <SubmitButton>Mettre à jour le mot de passe</SubmitButton>
      </form>
    </AuthShell>
  );
}

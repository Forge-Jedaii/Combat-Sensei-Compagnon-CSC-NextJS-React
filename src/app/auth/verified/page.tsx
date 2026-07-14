import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";

export default async function VerifiedPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email_confirmed_at) redirect("/login");

  return (
    <AuthShell title="Email confirmé" subtitle="Votre identité a bien été vérifiée">
      <div className="space-y-5 text-center">
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
          Votre compte est actif. Vous pouvez accéder aux Archives de la Forge.
        </p>
        <Link href="/archives" className="block rounded-lg bg-purple-600 px-4 py-2.5 font-bold hover:bg-purple-500">
          Continuer
        </Link>
      </div>
    </AuthShell>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-6 text-white">
      <section role="alert" className="w-full rounded-2xl border border-red-500/40 bg-black/70 p-6 text-center">
        <h1 className="text-2xl font-bold text-red-300">Une erreur est survenue</h1>
        <p className="mt-3 text-sm text-gray-300">L’action n’a pas pu aboutir. Vous pouvez réessayer sans recharger toute l’application.</p>
        {error.digest && <p className="mt-2 text-xs text-gray-500">Référence : {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-red-600 px-4 py-2 font-bold hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300">Réessayer</button>
          <Link href="/" className="rounded-lg border border-gray-600 px-4 py-2 hover:border-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}

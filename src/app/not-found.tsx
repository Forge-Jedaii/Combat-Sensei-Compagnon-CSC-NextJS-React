import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-6 text-center text-white">
      <section className="w-full rounded-2xl border border-purple-400/30 bg-black/70 p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-purple-300">Erreur 404</p>
        <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-gray-400">Cette page n’existe pas ou n’est plus disponible.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-purple-600 px-4 py-2 font-bold hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">Retour à l’accueil</Link>
      </section>
    </main>
  );
}

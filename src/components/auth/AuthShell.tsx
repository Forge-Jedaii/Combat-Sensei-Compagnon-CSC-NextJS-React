import Image from "next/image";
import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-cyan-400/30 bg-black/70 p-7 shadow-[0_0_35px_rgba(34,211,238,0.15)] backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" aria-label="Retour à l'accueil">
            <Image src="/logojapanforge.png" alt="Forge Je'daii" width={88} height={88} priority />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-cyan-300">{title}</h1>
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

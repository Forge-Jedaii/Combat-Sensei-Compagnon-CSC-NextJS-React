"use client";

import Link from "next/link";

const sections = [
  {
    id: "classements",
    title: "Classements",
    subtitle: "Panthéon des héros",
    icon: "🏆",
    color: "from-[#1a1f3b] to-[#12152b]",
    borderColor: "border-[#FFD54F]/40",
    glow: "hover:shadow-[0_0_24px_rgba(255,213,79,0.25)]",
  },
  {
    id: "profils",
    title: "Profils",
    subtitle: "Registre Je'daii",
    icon: "👤",
    color: "from-[#173f3f] to-[#0f2b2b]",
    borderColor: "border-[#4DD0E1]/40",
    glow: "hover:shadow-[0_0_24px_rgba(77,208,225,0.25)]",
  },
  {
    id: "historiques",
    title: "Historique",
    subtitle: "Combats logs",
    icon: "📊",
    color: "from-[#182047] to-[#101535]",
    borderColor: "border-[#64B5F6]/40",
    glow: "hover:shadow-[0_0_24px_rgba(100,181,246,0.25)]",
  },
  {
    id: "statistiques",
    title: "Statistiques",
    subtitle: "Analytics",
    icon: "📈",
    color: "from-[#2a1b3f] to-[#1a112b]",
    borderColor: "border-[#CE93D8]/40",
    glow: "hover:shadow-[0_0_24px_rgba(206,147,216,0.25)]",
  },
  {
    id: "achievements",
    title: "Succès",
    subtitle: "Badges & Titres",
    icon: "🏅",
    color: "from-[#3b1d17] to-[#26110d]",
    borderColor: "border-[#FFAB91]/40",
    glow: "hover:shadow-[0_0_24px_rgba(255,171,145,0.25)]",
  },
  {
    id: "parametres",
    title: "Paramètres",
    subtitle: "Gestion DB",
    icon: "⚙️",
    color: "from-[#2b2b2b] to-[#181818]",
    borderColor: "border-[#B0BEC5]/30",
    glow: "hover:shadow-[0_0_24px_rgba(176,190,197,0.2)]",
  },
];

export default function ArchivesPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ================= RETOUR ACCUEIL ================= */}
      <div>
        <Link
          href="/"
          className="
            inline-flex items-center gap-2
            text-sm font-semibold
            text-gray-300
            border border-gray-600/40
            rounded-lg
            px-4 py-2
            bg-black/40
            hover:text-purple-400
            hover:border-purple-400/50
            hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]
            transition-all
          "
        >
          ← Retour à l’accueil
        </Link>
      </div>

      {/* ================= GRILLE ARCHIVES ================= */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/archives/${section.id}`}
            className={`
              relative rounded-xl border p-6
              bg-gradient-to-br ${section.color}
              ${section.borderColor} ${section.glow}
              transition-all duration-300
            `}
          >
            <div className="text-4xl mb-3">{section.icon}</div>
            <h3 className="text-xl font-bold text-white">{section.title}</h3>
            <p className="text-sm text-gray-300">{section.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

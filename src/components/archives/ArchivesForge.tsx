import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchivesForge({ onBack }: { onBack?: () => void }) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Global");
  const [viewingProfile, setViewingProfile] = useState<null | string>(null); // nom du joueur sélectionné
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    {
      id: "classements",
      title: "Classements",
      subtitle: "Hall of Fame",
      icon: "🏆",
      color: "from-[#1a1f3b] to-[#12152b]",
      borderColor: "border-[#FFD54F]/40",
      glow: "hover:shadow-[0_0_24px_rgba(255,213,79,0.25)]",
    },
    {
      id: "profils",
      title: "Profils",
      subtitle: "Je'daii registry",
      icon: "👤",
      color: "from-[#173f3f] to-[#0f2b2b]",
      borderColor: "border-[#4DD0E1]/40",
      glow: "hover:shadow-[0_0_24px_rgba(77,208,225,0.25)]",
    },
    {
      id: "historique",
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
      title: "Achievements",
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

  const globalStats = [
    { label: "Joueurs", value: "5", color: "text-[#4DD0E1]" },
    { label: "Combats", value: "0", color: "text-[#64B5F6]" },
    { label: "Tournois", value: "0", color: "text-[#CE93D8]" },
    { label: "Points", value: "5", color: "text-[#FFD54F]" },
  ];

  // Exemple mock data joueurs
  const playerProfiles = [
    "Luke Skywalker",
    "Rey",
    "Anakin Skywalker",
    "Ahsoka Tano",
    "Mace Windu",
  ];

  const filteredProfiles = playerProfiles.filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderClassementsContent = () => {
    switch (activeTab) {
      case "Global":
        return <p>🌍 Classement général de tous les joueurs (bientôt dispo).</p>;
      case "Mensuel":
        return <p>📅 Classement des joueurs du mois (bientôt dispo).</p>;
      case "Hebdomadaire":
        return <p>📆 Classement des joueurs de la semaine (bientôt dispo).</p>;
      case "Par modes":
        return <p>🎮 Classement par modes de jeu (bientôt dispo).</p>;
      default:
        return null;
    }
  };

  const renderSectionContent = () => {
    if (selectedSection === "classements") {
      return (
        <div>
          <h3 className="text-[#FFD54F] text-2xl font-bold mb-6">🏆 Classements</h3>

          {/* Onglets */}
          <div className="flex justify-center gap-3 mb-6">
            {["Global", "Mensuel", "Hebdomadaire", "Par modes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-[#FFD54F]/20 border border-[#FFD54F]/50 text-[#FFD54F]"
                    : "bg-black/40 border border-white/10 text-gray-300 hover:bg-black/60"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Contenu de l’onglet */}
          <div className="bg-black/30 border border-[#FFD54F]/20 rounded-lg p-4 text-gray-300 text-sm">
            {renderClassementsContent()}
          </div>
        </div>
      );
    }

    if (selectedSection === "profils") {
      if (viewingProfile) {
        // Détail joueur
        return (
          <div>
            <h3 className="text-cyber-blue text-3xl font-bold mb-6 text-center">
              Profil Je&apos;daii : {viewingProfile}
            </h3>
            <div className="max-h-96 overflow-y-auto mb-6 text-gray-300">
              <p className="text-center">Informations détaillées sur {viewingProfile}...</p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setViewingProfile(null)}
                className="bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border-2 border-red-400 px-6 py-3 rounded-lg font-bold hover:scale-105 transition"
              >
                ← Retour
              </button>
            </div>
          </div>
        );
      }

      // Vue liste joueurs
      return (
        <div>
          <h3 className="text-cyber-blue text-3xl font-bold mb-6 text-center">👤 Profils Je&apos;daii 👤</h3>
          <input
            type="text"
            placeholder="Rechercher un Je'daii..."
            className="w-full p-3 bg-black/70 border-2 border-cyber-blue rounded-lg text-white mb-4 text-sm sm:text-base focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
            {filteredProfiles.map((player) => (
              <button
                key={player}
                onClick={() => setViewingProfile(player)}
                className="w-full text-left bg-black/40 border border-white/10 px-4 py-2 rounded-lg hover:bg-black/60 transition"
              >
                {player}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedSection(null)}
            className="bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border-2 border-red-400 px-6 py-3 rounded-lg font-bold hover:scale-105 transition"
          >
            ← Retour
          </button>
        </div>
      );
    }

    return <div className="text-gray-300">🚧 Section en cours de développement</div>;
  };

  return (
    <div className="min-h-screen px-4 pt-10 pb-12 bg-gradient-to-br from-[#0b1220] via-[#0e0b1f] to-[#0b1220]">
      {/* En-tête */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#00F5FF] via-[#FF00E5] to-[#00F5FF] drop-shadow-[0_0_18px_rgba(0,245,255,0.25)]">
          🏛️ Archives de la Forge 🏛️
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-[#00F5FF] to-[#FF00E5] mx-auto rounded-full mt-3 opacity-80" />
      </div>

      {/* Grille Sections */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 max-w-6xl mx-auto">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            onClick={() => {
              setSelectedSection(section.id);
              setActiveTab("Global");
              setViewingProfile(null);
              setSearchTerm("");
            }}
            className={`group relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${section.glow} bg-gradient-to-br ${section.color} rounded-xl p-6 border ${section.borderColor} shadow-lg backdrop-blur-sm`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3 drop-shadow">{section.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{section.title}</h3>
              <p className="text-sm text-gray-200/90">{section.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {selectedSection && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-8 max-w-3xl w-full relative shadow-xl overflow-y-auto max-h-[90vh]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Contenu de la section */}
              {renderSectionContent()}

              {/* Stats globales uniquement pour Classements */}
              {selectedSection === "classements" && (
                <div className="bg-gradient-to-r from-[#0f1630]/80 to-[#0a0f24]/80 backdrop-blur-sm border border-[#00F5FF]/20 rounded-xl p-6 mt-8">
                  <h2 className="text-[#00F5FF] text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    📊 Statistiques Globales
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {globalStats.map((stat, index) => (
                      <div
                        key={index}
                        className="bg-black/40 border border-white/10 rounded-lg p-4 text-center"
                      >
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className="text-gray-400 text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton retour global */}
      <div className="text-center mt-10">
        <button
          onClick={onBack}
          className="bg-gradient-to-r from-[#ff275b] to-[#b300ff] text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 border border-white/10 shadow-[0_0_18px_rgba(255,39,91,0.35)]"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

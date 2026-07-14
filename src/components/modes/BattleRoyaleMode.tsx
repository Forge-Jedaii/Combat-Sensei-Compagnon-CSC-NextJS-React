"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { CombatWorkflowClient } from "@/services/combat-workflow.client";
import { useUserMode } from "@/components/context/UserModeContext";
import FighterField from "../combat/FighterField";

export default function BattleRoyaleMode({ onBack }: { onBack?: () => void }) {
  const workflow = React.useMemo(() => new CombatWorkflowClient(), []);
  const { mode, fighterId } = useUserMode();
  const [players, setPlayers] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    if (players.length < 3 || players.some((p) => !p.trim())) {
      alert("Veuillez entrer au moins 3 joueurs !");
      return;
    }
    if (mode !== "authenticated") {
      setStarted(true);
      return;
    }
    try {
      const saved = await workflow.start({ clientSessionId: crypto.randomUUID(), durationSeconds: 0, eventName: "Battle Royale", mode: "battle_royale", participants: players.map((name) => ({ name, userId: fighterId(name) })) });
      localStorage.setItem("csc:active-match:battle_royale", saved.match.id);
      setStarted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Le Battle Royale n’a pas pu être enregistré.");
    }
  };

  const handleReset = () => {
    setPlayers([]);
    setStarted(false);
  };

  return (
    <div className="bg-black/40 border border-red-500/40 rounded-xl p-6 box-glow max-w-3xl mx-auto">
      <h2 className="text-red-500 text-xl sm:text-2xl font-bold text-glow mb-6">
        ⚔️ Mode Battle Royale
      </h2>

      {!started ? (
        <>
          {/* Texte explicatif */}
          <div className="mb-6 text-gray-300 space-y-3">
            <p>
              Bienvenue dans le <span className="text-red-500 font-bold">Mode Battle Royale</span> !  
              Ici, tous les joueurs s’affrontent dans une arène commune. Chaque échange peut éliminer un joueur,
              et il ne doit en rester qu’un à la fin : <span className="text-red-400 italic">le survivant</span>.
            </p>
            <p>
              🚧 <span className="font-bold text-red-400">Cette section est encore en construction</span>.  
              Pour l’instant, vous pouvez ajouter les joueurs et lancer le mode, mais la logique d’élimination automatique
              sera intégrée prochainement.
            </p>
          </div>

          {/* Ajout des joueurs */}
          <div className="mb-6">
            {players.map((p, i) => (
              <FighterField
                key={i}
                label={`Joueur ${i + 1}`}
                placeholder={`Choisir le joueur ${i + 1}`}
                value={p}
                excludedNames={players.filter((_, index) => index !== i)}
                onChange={(name) => {
                  const newPlayers = [...players];
                  newPlayers[i] = name;
                  setPlayers(newPlayers);
                }}
                className="mb-2 border border-red-500/40"
              />
            ))}
            <Button
              onClick={() => setPlayers([...players, ""])}
              className="mt-2 bg-red-600/60 border-red-400"
            >
              ➕ Ajouter un joueur
            </Button>
          </div>

          {/* Lancer le mode */}
          <div className="text-center">
            <Button onClick={handleStart} className="bg-red-600/80 border-red-400">
              🚀 Lancer le Battle Royale
            </Button>
            <button
          onClick={onBack}
          className="bg-gradient-to-r from-[#ff275b] to-[#b300ff] hover:from-[#ff4d77] hover:to-[#c233ff]
                     text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 
                     border border-white/10 hover:scale-105 shadow-[0_0_18px_rgba(255,39,91,0.35)]"
        >
          ← Retour
        </button>
          </div>
        </>
      ) : (
        <>
          {/* Message construction */}
          <div className="mb-6 text-center text-gray-300">
            <h3 className="text-red-500 font-bold text-lg mb-2">🚧 En construction 🚧</h3>
            <p>
              La logique d’élimination <span className="italic">(round par round jusqu’au survivant)</span>{" "}
              sera bientôt disponible. Merci de votre patience !
            </p>
          </div>

          {/* Affichage joueurs inscrits */}
          <div className="mb-6">
            <h3 className="text-red-400 font-bold mb-3">👥 Joueurs inscrits :</h3>
            <ul className="list-disc list-inside text-white">
              {players.map((p, i) => (
                <li key={i}>{p || <span className="italic text-gray-500">Nom manquant</span>}</li>
              ))}
            </ul>
          </div>

          {/* Reset */}
          <div className="text-center">
            <Button
              onClick={handleReset}
              className="bg-red-600/60 border-red-400 hover:scale-105"
            >
              ❌ Réinitialiser le Battle Royale
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

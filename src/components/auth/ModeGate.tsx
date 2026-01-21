"use client";

import { useUserMode } from "../context/UserModeContext";

export default function ModeGate() {
  const { setMode } = useUserMode();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cyber-gradient text-white">
      <h1 className="text-3xl font-bold text-cyber-blue text-glow">
        ⚔️ Combat Sensei Compagnon
      </h1>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={() => setMode("guest")}
          className="p-4 rounded-xl bg-black/60 border border-cyber-blue/40
                     hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition"
        >
          ▶ Mode Invité
        </button>

        <button
          onClick={() => setMode("authenticated")}
          className="p-4 rounded-xl bg-purple-600/80 border border-purple-400
                     hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition"
        >
          🔐 Se connecter
        </button>
      </div>

      <p className="text-sm text-gray-400 text-center max-w-xs">
        Le mode invité ne sauvegarde aucune donnée.
      </p>
    </div>
  );
}

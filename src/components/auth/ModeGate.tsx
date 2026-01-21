"use client";

import Image from "next/image";
import { useUserMode } from "../context/UserModeContext";
import { useRouter } from "next/navigation";



export default function ModeGate() {
  const { setMode } = useUserMode();
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cyber-gradient text-white px-4">
      {/* ===== LOGO ===== */}
      <div className="flex justify-center">
        <Image
          src="/logojapanforge.png"
          alt="Forge Je'daii - Logo"
          width={140}
          height={140}
          priority
          className="drop-shadow-[0_0_25px_rgba(0,255,255,0.35)]"
        />
      </div>

      {/* ===== TITRE ===== */}
      <h1 className="text-3xl sm:text-4xl font-bold text-cyber-blue text-glow text-center">
        Combat Sensei Compagnon
      </h1>

      {/* ===== BOUTONS ===== */}
      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={() => setMode("guest")}
          className="
            p-4 rounded-xl bg-black/60 border border-cyber-blue/40
            hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]
            transition
          "
        >
          ▶ Mode Invité
        </button>

        <button
          onClick={() => router.push("/login")}
          className="
            p-4 rounded-xl bg-purple-600/80 border border-purple-400
            hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]
            transition
          "
        >
          🔐 Se connecter
        </button>
      </div>

      {/* ===== INFO ===== */}
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Le mode invité ne sauvegarde aucune donnée.
      </p>
    </div>
  );
}

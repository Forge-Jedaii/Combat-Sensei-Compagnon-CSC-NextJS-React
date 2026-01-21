"use client";

import { useState } from "react";
import { useUserMode } from "../components/context/UserModeContext";
import ModeGate from "../components/auth/ModeGate";
import ModeSelection from "../components/modes/ModeSelection";

import DuelMode from "../components/modes/DuelMode";
import HandicapMode from "../components/modes/HandicapMode";
import TournamentMode from "../components/modes/TournamentMode";
import HighlanderMode from "../components/modes/HighlanderMode";
import BattleRoyaleMode from "../components/modes/BattleRoyaleMode";

export default function HomePage() {
  const { mode } = useUserMode();
  const [activeMode, setActiveMode] = useState<string | null>(null);

  // 1️⃣ Choix invité / connecté
  if (!mode) return <ModeGate />;

  // 2️⃣ Menu principal
  if (!activeMode) {
    return <ModeSelection onSelect={setActiveMode} />;
  }

  // 3️⃣ Modes internes
  switch (activeMode) {
    case "duel":
      return <DuelMode onBack={() => setActiveMode(null)} />;

    case "handicap":
      return <HandicapMode onBack={() => setActiveMode(null)} />;

    case "tournament":
      return <TournamentMode onBack={() => setActiveMode(null)} />;

    case "highlander":
      return <HighlanderMode onBack={() => setActiveMode(null)} />;

    case "battleRoyale":
      return <BattleRoyaleMode onBack={() => setActiveMode(null)} />;

    default:
      return <ModeSelection onSelect={setActiveMode} />;
  }
}

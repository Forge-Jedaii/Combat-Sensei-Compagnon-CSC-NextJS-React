"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ComponentType } from "react";
import { useUserMode } from "../components/context/UserModeContext";
import ModeGate from "../components/auth/ModeGate";
import ModeSelection from "../components/modes/ModeSelection";
import type { SelectableMode } from "../components/modes/ModeSelection";

interface CombatModeProps {
  onBack?: () => void;
}

const MODE_COMPONENTS = {
  duel: dynamic(() => import("../components/modes/DuelMode")),
  officialDuel: dynamic(() => import("../components/modes/OfficialDuelMode")),
  handicap: dynamic(() => import("../components/modes/HandicapMode")),
  tournament: dynamic(() => import("../components/modes/TournamentMode")),
  highlander: dynamic(() => import("../components/modes/HighlanderMode")),
  battleRoyale: dynamic(() => import("../components/modes/BattleRoyaleMode")),
} satisfies Record<SelectableMode, ComponentType<CombatModeProps>>;

export default function HomePage() {
  const { mode } = useUserMode();
  const [activeMode, setActiveMode] = useState<SelectableMode | null>(null);
  const returnToMenu = useCallback(() => setActiveMode(null), []);

  // 1️⃣ Choix invité / connecté
  if (!mode) return <ModeGate />;

  // 2️⃣ Menu principal
  if (!activeMode) {
    return <ModeSelection onSelect={setActiveMode} />;
  }

  // 3️⃣ Modes internes
  const ActiveMode = MODE_COMPONENTS[activeMode];
  return <ActiveMode onBack={returnToMenu} />;
}

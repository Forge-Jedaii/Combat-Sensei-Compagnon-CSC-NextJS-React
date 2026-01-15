"use client";

import React, { useState } from "react";
import ModeSelection from "@/components/ModeSelection";
import DuelMode from "@/components/modes/DuelMode";
import OfficialDuelMode from "@/components/modes/OfficialDuelMode";
import HandicapMode from "@/components/modes/HandicapMode";
import TournamentMode from "@/components/modes/TournamentMode";
import HighlanderMode from "@/components/modes/HighlanderMode";
import BattleRoyaleMode from "@/components/modes/BattleRoyaleMode";
import OfficialRules from "@/components/regulations/OfficialRules";
// import ArchivesForge from "@/app/archives/page"; // Nouveau composant

export default function Page() {
  const [mode, setMode] = useState<string | null>(null);

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div
        className="p-6 max-h-screen overflow-y-auto hide-scrollbar"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* Internet Explorer 10+ */,
        }}
      >
        {!mode && <ModeSelection onSelect={setMode} />}

        {mode === "duel" && <DuelMode onBack={() => setMode(null)} />}
        {mode === "officialDuel" && (
          <OfficialDuelMode onBack={() => setMode(null)} />
        )}
        {mode === "handicap" && <HandicapMode onBack={() => setMode(null)} />}
        {mode === "tournament" && (
          <TournamentMode onBack={() => setMode(null)} />
        )}
        {mode === "highlander" && (
          <HighlanderMode onBack={() => setMode(null)} />
        )}
        {mode === "battleRoyale" && (
          <BattleRoyaleMode onBack={() => setMode(null)} />
        )}
        {mode === "officialRules" && (
          <OfficialRules onBack={() => setMode(null)} />
        )}

        {/* Utilisation du nouveau composant ArchivesForge */}
        {/* {mode === "archives" && <ArchivesForge onBack={() => setMode(null)} />} */}
      </div>
    </>
  );
}

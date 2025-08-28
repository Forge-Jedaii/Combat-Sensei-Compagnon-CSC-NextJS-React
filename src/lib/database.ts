// lib/database.ts
import { Player, Match } from "@/data/types";

// ⚠️ à remplacer par de vrais appels DB/API
const matches: Match[] = [];
const players: Player[] = [];

export async function saveMatch(match: Match): Promise<void> {
  matches.push(match);
  console.log("Saved match:", match);
}

export async function getMatches(): Promise<Match[]> {
  return matches;
}

export async function getPlayer(id: string): Promise<Player | null> {
  return players.find((p) => p.id === id) || null;
}

export async function savePlayer(player: Player): Promise<void> {
  const existing = players.findIndex((p) => p.id === player.id);
  if (existing >= 0) {
    players[existing] = player;
  } else {
    players.push(player);
  }
  console.log("Saved player:", player);
}

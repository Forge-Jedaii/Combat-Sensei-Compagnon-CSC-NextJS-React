import Badge from "@/models/Badge";

interface Player {
  userId: string;
  score: number;
}

export async function assignBadges(player: Player) {
  if (player.score >= 1000) {
    await Badge.updateOne(
      { userId: player.userId, name: "Guerrier confirmé" },
      { $setOnInsert: { description: "Atteint 1000 points", icon: "⚔️", rarity: "rare" } },
      { upsert: true }
    );
  }
}

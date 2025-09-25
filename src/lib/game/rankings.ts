import Ranking from "@/models/Ranking";
import Achievement from "@/models/Achievement";
import Badge from "@/models/Badge";
import { checkAchievements } from "./achievements";
import { assignBadges } from "./badges";

export async function processCombatResult(winner: string, loser: string) {
  // Charger / créer les classements
  const winnerDoc = await Ranking.findOneAndUpdate(
    { userId: winner },
    { $inc: { victories: 1, score: 30 } },
    { upsert: true, new: true }
  );
  const loserDoc = await Ranking.findOneAndUpdate(
    { userId: loser },
    { $inc: { defeats: 1, score: -10 } },
    { upsert: true, new: true }
  );

  // Vérifier achievements
  await checkAchievements(winnerDoc);
  await checkAchievements(loserDoc);

  // Vérifier badges
  await assignBadges(winnerDoc);
}

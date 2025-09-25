import Achievement from "@/models/Achievement";
import Ranking, { IRanking } from "@/models/Ranking";

export async function checkAchievements(player: IRanking) {
  if (player.victories >= 5) {
    await Achievement.updateOne(
      { userId: player.userId, condition: "5_victories" },
      {
        $setOnInsert: {
          name: "Champion débutant",
          description: "5 victoires !",
          icon: "🥇",
        },
      },
      { upsert: true }
    );
  }
}

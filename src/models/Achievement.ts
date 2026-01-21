import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  name: string;
  description: string;
  condition: string; // ex: "5_victories"
  icon: string;
  badge? : string;
  rarities : mongoose.Types.ObjectId[];
}

const AchievementSchema = new Schema<IAchievement>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  condition: { type: String, required: true },
  icon: { type: String, required: true },
  badge: { type: String, required: false },
  rarities: [
      {
        type: Schema.Types.ObjectId,
        ref: "Rarity",
      },
    ],
},
  {
    collection: "achievements",
    timestamps: true,
  }
);

export default mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);

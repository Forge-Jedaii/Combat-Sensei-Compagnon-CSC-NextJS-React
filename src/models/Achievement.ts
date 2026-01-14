import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  name: string;
  description: string;
  condition: string; // ex: "5_victories"
  icon: string;
}

const AchievementSchema = new Schema<IAchievement>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  condition: { type: String, required: true },
  icon: { type: String, required: true },
});

export default mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);

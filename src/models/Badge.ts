import mongoose, { Schema, Document, models } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const BadgeSchema = new Schema<IBadge>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  rarity: { type: String, enum: ["common", "rare", "epic", "legendary"], default: "common" },
});

export default models.Badge || mongoose.model<IBadge>("Badge", BadgeSchema);

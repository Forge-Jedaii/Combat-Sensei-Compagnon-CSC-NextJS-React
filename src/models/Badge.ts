import mongoose, { Schema, Document } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  rarity: number;
}

const BadgeSchema = new Schema<IBadge>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  rarity: { type: Number, default: 1 },
});

export default mongoose.models.Badge ||
  mongoose.model<IBadge>("Badge", BadgeSchema);

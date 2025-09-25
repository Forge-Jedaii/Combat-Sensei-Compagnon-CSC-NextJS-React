import mongoose, { Schema, Document, models } from "mongoose";

export interface IRanking extends Document {
  userId: string;
  score: number;
  victories: number;
  defeats: number;
}

const RankingSchema = new Schema<IRanking>({
  userId: { type: String, required: true },
  score: { type: Number, default: 1000 },
  victories: { type: Number, default: 0 },
  defeats: { type: Number, default: 0 },
});

export default models.Ranking || mongoose.model<IRanking>("Ranking", RankingSchema);

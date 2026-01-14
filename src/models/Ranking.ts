import mongoose, { Schema, Document } from "mongoose";

export interface IRanking extends Document {
  userId: number;
  score: number;
  victories: number;
  defeats: number;
}

const RankingSchema = new Schema<IRanking>({
  userId: { type: Number, required: true },
  score: { type: Number, default: 1000 },
  victories: { type: Number, default: 0 },
  defeats: { type: Number, default: 0 },
});

export default mongoose.models.Ranking ||
  mongoose.model<IRanking>("Ranking", RankingSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IRarity extends Document {
  id: number;
  name: string;
}

const RaritySchema = new Schema<IRarity>({
  id: {type : Number, required : true},
  name: { type: String, required: true },
});

export default mongoose.models.Rarity ||
  mongoose.model<IRarity>("Rarity", RaritySchema);
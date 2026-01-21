import mongoose, { Schema, Document } from "mongoose";

export interface IRarity extends Document {
  name: string;
  category : string;
  description? : string;
}

const RaritySchema = new Schema<IRarity>({
  name: { type: String, required: true },
  category : { type : String, required : true},
  description : { type : String },
}, 
{ 
  collection: "rarities", 
  timestamps: true, 
});

export default mongoose.models.Rarity ||
  mongoose.model<IRarity>("Rarity", RaritySchema);
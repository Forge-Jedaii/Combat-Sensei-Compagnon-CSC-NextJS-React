import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: number;
  username: string;
  email: string;
  points: number;
  achievements: string[];
  mdp : string;
}

const UserSchema = new Schema<IUser>({
  id: {type : Number, required : true},
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  achievements: [{ type: String }],
  mdp : { type: String, required: true },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
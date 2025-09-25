import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  points: number;
  badges: string[];
  achievements: string[];
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  achievements: [{ type: String }],
});

export default models.User || mongoose.model<IUser>("User", UserSchema);

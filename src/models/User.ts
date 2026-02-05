import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: number;
  name: string;
  email: string;
  points: number;
  achievements: { _id: mongoose.Types.ObjectId }[];
  password : string;
  club : string;
  partage_donnees : string;
  photo : string;
}

const UserSchema = new Schema<IUser>({
  id: {type : Number, required : true},
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  achievements: [
    {
    _id: { type: Schema.Types.ObjectId, ref: "Achievement" },
    },],
  password : { type: String, required: true },
  club : { type: String },
  partage_donnees : { type: String, required: true, default: "false"},
  photo : { type : String },
},
  {
    collection: "users",
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
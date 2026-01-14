import mongoose, { Schema, Document } from "mongoose";

export interface ICombatsLog extends Document {
  CbLogId: number;
}

const CombatsLogSchema = new Schema<ICombatsLog>({
  CbLogId: { type: Number, required: true },
});

export default mongoose.models.CombatsLog ||
  mongoose.model<ICombatsLog>("CombatsLog", CombatsLogSchema);

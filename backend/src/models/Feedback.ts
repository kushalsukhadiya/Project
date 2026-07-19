import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  citizen: mongoose.Types.ObjectId;
  collector: mongoose.Types.ObjectId;
  request: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    citizen: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collector: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    request: { type: Schema.Types.ObjectId, ref: 'PlasticRequest', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);

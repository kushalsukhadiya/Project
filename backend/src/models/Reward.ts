import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  citizen: mongoose.Types.ObjectId;
  points: number;
  type: 'credit' | 'debit';
  description: string;
  request?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RewardSchema: Schema = new Schema(
  {
    citizen: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
    description: { type: String, required: true },
    request: { type: Schema.Types.ObjectId, ref: 'PlasticRequest' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IReward>('Reward', RewardSchema);

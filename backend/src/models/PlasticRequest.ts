import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestHistory {
  status: 'pending' | 'accepted' | 'picked_up' | 'received' | 'recycled' | 'cancelled';
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export interface IPlasticRequest extends Document {
  citizen: mongoose.Types.ObjectId;
  wasteCategory: string;
  estimatedWeight: number; // in kg
  pickupDate: Date;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
    address: string;
  };
  images: string[];
  status: 'pending' | 'accepted' | 'picked_up' | 'received' | 'recycled' | 'cancelled';
  collector?: mongoose.Types.ObjectId;
  recyclingCenter?: mongoose.Types.ObjectId;
  pickupProofImage?: string;
  history: IRequestHistory[];
  feedbackRating?: number; // 1 to 5
  feedbackComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'received', 'recycled', 'cancelled'],
    required: true
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const PlasticRequestSchema: Schema = new Schema(
  {
    citizen: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wasteCategory: { 
      type: String, 
      enum: [
        'Plastic Bottles', 
        'Plastic Bags', 
        'Food Packaging', 
        'PET Bottles', 
        'Containers', 
        'Industrial Plastic', 
        'Mixed Plastic', 
        'Other'
      ],
      required: true 
    },
    estimatedWeight: { type: Number, required: true },
    pickupDate: { type: Date, required: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { 
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 2,
          message: 'Coordinates must contain [longitude, latitude]'
        }
      },
      address: { type: String, required: true }
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'picked_up', 'received', 'recycled', 'cancelled'],
      default: 'pending'
    },
    collector: { type: Schema.Types.ObjectId, ref: 'User' },
    recyclingCenter: { type: Schema.Types.ObjectId, ref: 'User' },
    pickupProofImage: { type: String },
    history: [RequestHistorySchema],
    feedbackRating: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String }
  },
  { timestamps: true }
);

// Index location coordinates for geo queries (e.g. finding nearby requests)
PlasticRequestSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model<IPlasticRequest>('PlasticRequest', PlasticRequestSchema);

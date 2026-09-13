import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'citizen' | 'collector' | 'recycler' | 'admin' | 'municipal';
  profilePicture: string;
  phoneNumber: string;
  address: string;
  city: string;
  area: string;
  rewards: {
    points: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  };
  collectorDetails: {
    availability: boolean;
    earnings: number;
    completedJobsToday: number;
  };
  recyclerDetails: {
    facilityName: string;
    capacity: number; // in kg
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['citizen', 'collector', 'recycler', 'admin', 'municipal'], 
      default: 'citizen' 
    },
    profilePicture: { 
      type: String, 
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' 
    },
    phoneNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    rewards: {
      points: { type: Number, default: 0 },
      tier: { 
        type: String, 
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], 
        default: 'Bronze' 
      }
    },
    collectorDetails: {
      availability: { type: Boolean, default: false },
      earnings: { type: Number, default: 0 },
      completedJobsToday: { type: Number, default: 0 }
    },
    recyclerDetails: {
      facilityName: { type: String, default: '' },
      capacity: { type: Number, default: 10000 }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);

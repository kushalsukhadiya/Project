export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'citizen' | 'collector' | 'recycler' | 'admin' | 'municipal';
  profilePicture: string;
  phoneNumber: string;
  address: string;
  city: string;
  area: string;
  rewards?: {
    points: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  };
  collectorDetails?: {
    availability: boolean;
    earnings: number;
    completedJobsToday: number;
  };
  recyclerDetails?: {
    facilityName: string;
    capacity: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestHistory {
  status: 'pending' | 'reminder_sent' | 'assigned_municipality' | 'escalated' | 'assigned_ngo' | 'in_progress' | 'completed' | 'verified' | 'closed' | 'rejected' | 'duplicate' | 'accepted' | 'picked_up' | 'received' | 'recycled' | 'cancelled';
  updatedAt: string;
  updatedBy: string | User;
}

export interface PlasticRequest {
  _id: string;
  citizen: string | User;
  wasteCategory: 'Plastic Bottles' | 'Plastic Bags' | 'Food Packaging' | 'PET Bottles' | 'Containers' | 'Industrial Plastic' | 'Mixed Plastic' | 'Other';
  estimatedWeight: number;
  pickupDate: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
    address: string;
  };
  images: string[];
  status: 'pending' | 'reminder_sent' | 'assigned_municipality' | 'escalated' | 'assigned_ngo' | 'in_progress' | 'completed' | 'verified' | 'closed' | 'rejected' | 'duplicate' | 'accepted' | 'picked_up' | 'received' | 'recycled' | 'cancelled';
  collector?: User;
  recyclingCenter?: User;
  pickupProofImage?: string;
  history: RequestHistory[];
  feedbackRating?: number;
  feedbackComment?: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    pointsToEarn: number;
    co2ReductionKg: number;
  };

  // New SLA Escalation Fields
  assignedTo?: string;
  assignedOrganizationType?: 'municipality' | 'ngo';
  assignedAt?: string;
  acceptedAt?: string;
  reminderSentAt?: string;
  escalatedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  slaDeadline?: string;
  reminderDeadline?: string;
  beforeImage?: string;
  afterImage?: string;
  adminRemarks?: string;
  claimedBy?: string;
  claimTimestamp?: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface LeaderboardUser {
  _id: string;
  name: string;
  rewards: {
    points: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  };
  profilePicture: string;
  area: string;
  city: string;
}

export interface Feedback {
  _id: string;
  citizen: User;
  collector: User;
  request: {
    _id: string;
    wasteCategory: string;
    estimatedWeight: number;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

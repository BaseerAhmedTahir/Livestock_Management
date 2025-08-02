import { Database } from '../lib/database.types';

export type DbGoat = Database['public']['Tables']['goats']['Row'];
export type DbCaretaker = Database['public']['Tables']['caretakers']['Row'];
export type DbHealthRecord = Database['public']['Tables']['health_records']['Row'];
export type DbWeightRecord = Database['public']['Tables']['weight_records']['Row'];
export type DbExpense = Database['public']['Tables']['expenses']['Row'];
export type DbTransaction = Database['public']['Tables']['transactions']['Row'];

export interface Business {
  id: string;
  name: string;
  description?: string;
  address: string;
  paymentModelType: 'percentage' | 'monthly';
  paymentModelAmount: number;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBusinessRole {
  id: string;
  userId: string;
  businessId: string;
  role: 'owner' | 'caretaker';
  linkedCaretakerId?: string;
  createdAt: Date;
  permissions?: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  userId: string;
  role: 'owner' | 'caretaker';
  createdAt: Date;
}

export interface CaretakerInvitation {
  email: string;
  businessId: string;
  caretakerId?: string;
}

export interface Goat {
  id: string;
  businessId: string;
  tagNumber: string;
  nickname?: string;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: Date;
  color?: string;
  currentWeight: number;
  photos: string[];
  qrCode: string;
  status: 'Active' | 'Sold' | 'Deceased' | 'Archived';
  caretakerId?: string;
  purchasePrice: number;
  purchaseDate: Date;
  salePrice?: number;
  saleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Caretaker {
  id: string;
  businessId: string;
  name: string;
  photo?: string;
  contactInfo: {
    phone: string;
    email?: string;
  };
  address?: string;
  assignedGoats: string[];
  totalEarnings: number;
  createdAt: Date;
  loginCredentials?: {
    email: string;
    password: string;
    hasAccount: boolean;
    lastLogin?: Date;
  };
}

export interface HealthRecord {
  id: string;
  businessId: string;
  goatId: string;
  type: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive';
  date: Date;
  description: string;
  treatment?: string;
  veterinarian?: string;
  cost: number;
  notes?: string;
  status: 'Healthy' | 'Under Treatment' | 'Recovered';
  nextDueDate?: Date;
}

export interface WeightRecord {
  id: string;
  businessId: string;
  goatId: string;
  weight: number;
  date: Date;
  notes?: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  goatId: string;
  type: 'Purchase' | 'Sale' | 'Expense';
  amount: number;
  date: Date;
  description: string;
  vendor?: string;
  buyer?: string;
  category?: string;
}

export interface Expense {
  id: string;
  businessId: string;
  goatId?: string;
  category: 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other';
  amount: number;
  date: Date;
  description: string;
  caretakerId?: string;
}

export interface AppState {
  businesses: Business[];
  userBusinessRoles: UserBusinessRole[];
  activeBusiness: Business | null;
  goats: Goat[];
  caretakers: Caretaker[];
  healthRecords: HealthRecord[];
  weightRecords: WeightRecord[];
  transactions: Transaction[];
  expenses: Expense[];
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  userRole: 'owner' | 'caretaker' | null;
  setActiveBusiness: (business: Business) => void;
  createBusiness: (name: string, description?: string, address?: string, paymentModelType?: 'percentage' | 'monthly', paymentModelAmount?: number) => Promise<void>;
  inviteCaretaker: (email: string, businessId: string, caretakerId?: string) => Promise<any>;
  deleteBusiness: (businessId: string) => Promise<void>;
  forceDeleteBusiness?: (businessId: string) => Promise<void>;
  caretakerPermissions: Record<string, boolean> | null;
  updateCaretakerBusinessRolePermissions: (userBusinessRoleId: string, newPermissions: Record<string, boolean>) => Promise<void>;
  fetchCaretakerBusinessRole: (caretakerUserId: string, businessId: string) => Promise<UserBusinessRole | null>;
  updateBusinessSettings: (businessId: string, updates: {
    name?: string;
    description?: string;
    address?: string;
    payment_model_type?: 'percentage' | 'monthly';
    payment_model_amount?: number;
  }) => Promise<void>;
  loading: boolean;
}
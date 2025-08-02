export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string
          payment_model_type: 'percentage' | 'monthly'
          payment_model_amount: number
          created_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address: string
          payment_model_type?: 'percentage' | 'monthly'
          payment_model_amount?: number
          created_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string
          payment_model_type?: 'percentage' | 'monthly'
          payment_model_amount?: number
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_business_roles: {
        Row: {
          id: string
          user_id: string
          business_id: string
          role: 'owner' | 'caretaker'
          linked_caretaker_id: string | null
          permissions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          role: 'owner' | 'caretaker'
          linked_caretaker_id?: string | null
          permissions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          role?: 'owner' | 'caretaker'
          linked_caretaker_id?: string | null
          permissions?: Json | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          role: 'owner' | 'caretaker'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'owner' | 'caretaker'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'owner' | 'caretaker'
          created_at?: string
        }
      }
      goats: {
        Row: {
          id: string
          business_id: string
          tag_number: string
          nickname: string | null
          breed: string
          gender: 'Male' | 'Female'
          date_of_birth: string
          color: string | null
          current_weight: number
          photos: string[]
          qr_code: string
          status: 'Active' | 'Sold' | 'Deceased' | 'Archived'
          caretaker_id: string | null
          purchase_price: number
          purchase_date: string
          sale_price: number | null
          sale_date: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          tag_number: string
          nickname?: string | null
          breed: string
          gender: 'Male' | 'Female'
          date_of_birth: string
          color?: string | null
          current_weight?: number
          photos?: string[]
          qr_code: string
          status?: 'Active' | 'Sold' | 'Deceased' | 'Archived'
          caretaker_id?: string | null
          purchase_price?: number
          purchase_date: string
          sale_price?: number | null
          sale_date?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          tag_number?: string
          nickname?: string | null
          breed?: string
          gender?: 'Male' | 'Female'
          date_of_birth?: string
          color?: string | null
          current_weight?: number
          photos?: string[]
          qr_code?: string
          status?: 'Active' | 'Sold' | 'Deceased' | 'Archived'
          caretaker_id?: string | null
          purchase_price?: number
          purchase_date?: string
          sale_price?: number | null
          sale_date?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      caretakers: {
        Row: {
          id: string
          business_id: string
          name: string
          photo: string | null
          phone: string
          email: string | null
          address: string
          total_earnings: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          photo?: string | null
          phone: string
          email?: string | null
          address: string
          total_earnings?: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          photo?: string | null
          phone?: string
          email?: string | null
          address?: string
          total_earnings?: number
          user_id?: string
          created_at?: string
        }
      }
      health_records: {
        Row: {
          id: string
          business_id: string
          goat_id: string
          type: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive'
          date: string
          description: string
          treatment: string | null
          veterinarian: string | null
          cost: number
          notes: string | null
          status: 'Healthy' | 'Under Treatment' | 'Recovered'
          next_due_date: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          goat_id: string
          type: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive'
          date: string
          description: string
          treatment?: string | null
          veterinarian?: string | null
          cost?: number
          notes?: string | null
          status?: 'Healthy' | 'Under Treatment' | 'Recovered'
          next_due_date?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          goat_id?: string
          type?: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive'
          date?: string
          description?: string
          treatment?: string | null
          veterinarian?: string | null
          cost?: number
          notes?: string | null
          status?: 'Healthy' | 'Under Treatment' | 'Recovered'
          next_due_date?: string | null
          user_id?: string
          created_at?: string
        }
      }
      weight_records: {
        Row: {
          id: string
          business_id: string
          goat_id: string
          weight: number
          date: string
          notes: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          goat_id: string
          weight: number
          date: string
          notes?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          goat_id?: string
          weight?: number
          date?: string
          notes?: string | null
          user_id?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          business_id: string
          goat_id: string | null
          caretaker_id: string | null
          category: 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other'
          amount: number
          date: string
          description: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          goat_id?: string | null
          caretaker_id?: string | null
          category: 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other'
          amount: number
          date: string
          description: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          goat_id?: string | null
          caretaker_id?: string | null
          category?: 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other'
          amount?: number
          date?: string
          description?: string
          user_id?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          business_id: string
          goat_id: string
          type: 'Purchase' | 'Sale' | 'Expense'
          amount: number
          date: string
          description: string
          vendor: string | null
          buyer: string | null
          category: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          goat_id: string
          type: 'Purchase' | 'Sale' | 'Expense'
          amount: number
          date: string
          description: string
          vendor?: string | null
          buyer?: string | null
          category?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          goat_id?: string
          type?: 'Purchase' | 'Sale' | 'Expense'
          amount?: number
          date?: string
          description?: string
          vendor?: string | null
          buyer?: string | null
          category?: string | null
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
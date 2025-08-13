import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AppState, Goat, Caretaker, HealthRecord, WeightRecord, Expense, Transaction, Business, UserBusinessRole } from '../types';
import { DbGoat, DbCaretaker, DbHealthRecord, DbWeightRecord, DbExpense, DbTransaction } from '../types';
import { useBusiness } from '../context/BusinessContext';

// Utility functions to convert between database and app types
const dbToGoat = (dbGoat: DbGoat): Goat => ({
  id: dbGoat.id,
  businessId: dbGoat.business_id,
  tagNumber: dbGoat.tag_number,
  nickname: dbGoat.nickname || undefined,
  breed: dbGoat.breed,
  gender: dbGoat.gender,
  dateOfBirth: new Date(dbGoat.date_of_birth),
  color: dbGoat.color || undefined,
  currentWeight: dbGoat.current_weight,
  photos: dbGoat.photos,
  qrCode: dbGoat.qr_code,
  status: dbGoat.status,
  caretakerId: dbGoat.caretaker_id || undefined,
  purchasePrice: dbGoat.purchase_price,
  purchaseDate: new Date(dbGoat.purchase_date),
  salePrice: dbGoat.sale_price || undefined,
  saleDate: dbGoat.sale_date ? new Date(dbGoat.sale_date) : undefined,
  createdAt: new Date(dbGoat.created_at),
  updatedAt: new Date(dbGoat.updated_at)
});

const dbToCaretaker = (dbCaretaker: DbCaretaker, assignedGoats: string[] = []): Caretaker => ({
  id: dbCaretaker.id,
  businessId: dbCaretaker.business_id,
  name: dbCaretaker.name,
  photo: dbCaretaker.photo || undefined,
  contactInfo: {
    phone: dbCaretaker.phone,
    email: dbCaretaker.email || undefined
  },
  address: dbCaretaker.address || undefined,
  assignedGoats,
  totalEarnings: dbCaretaker.total_earnings,
  createdAt: new Date(dbCaretaker.created_at),
  loginCredentials: dbCaretaker.email ? {
    email: dbCaretaker.email,
    password: '••••••••', // Placeholder - actual password would be stored securely
    hasAccount: !!dbCaretaker.email,
    lastLogin: undefined
  } : undefined
});

const dbToHealthRecord = (dbRecord: DbHealthRecord): HealthRecord => ({
  id: dbRecord.id,
  businessId: dbRecord.business_id,
  goatId: dbRecord.goat_id,
  type: dbRecord.type,
  date: new Date(dbRecord.date),
  description: dbRecord.description,
  treatment: dbRecord.treatment || undefined,
  veterinarian: dbRecord.veterinarian || undefined,
  cost: dbRecord.cost,
  notes: dbRecord.notes || undefined,
  status: dbRecord.status,
  nextDueDate: dbRecord.next_due_date ? new Date(dbRecord.next_due_date) : undefined
});

const dbToWeightRecord = (dbRecord: DbWeightRecord): WeightRecord => ({
  id: dbRecord.id,
  businessId: dbRecord.business_id,
  goatId: dbRecord.goat_id,
  weight: dbRecord.weight,
  date: new Date(dbRecord.date),
  notes: dbRecord.notes || undefined
});

const dbToExpense = (dbExpense: DbExpense): Expense => ({
  id: dbExpense.id,
  businessId: dbExpense.business_id,
  goatId: dbExpense.goat_id || undefined,
  category: dbExpense.category,
  amount: dbExpense.amount,
  date: new Date(dbExpense.date),
  description: dbExpense.description,
  caretakerId: dbExpense.caretaker_id || undefined
});

const dbToTransaction = (dbTransaction: DbTransaction): Transaction => ({
  id: dbTransaction.id,
  businessId: dbTransaction.business_id,
  goatId: dbTransaction.goat_id,
  type: dbTransaction.type,
  amount: dbTransaction.amount,
  date: new Date(dbTransaction.date),
  description: dbTransaction.description,
  vendor: dbTransaction.vendor || undefined,
  buyer: dbTransaction.buyer || undefined,
  category: dbTransaction.category || undefined
});

const generateQRCode = (goatId: string, tagNumber: string): string => {
  return `GOAT_${tagNumber}_${goatId}`;
};

// Query keys for React Query
const queryKeys = {
  goats: (businessId: string) => ['goats', businessId],
  caretakers: (businessId: string) => ['caretakers', businessId],
  healthRecords: (businessId: string) => ['healthRecords', businessId],
  weightRecords: (businessId: string) => ['weightRecords', businessId],
  expenses: (businessId: string) => ['expenses', businessId],
  transactions: (businessId: string) => ['transactions', businessId],
};

// Fetch functions
const fetchGoats = async (businessId: string): Promise<Goat[]> => {
  const { data, error } = await supabase
    .from('goats')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbToGoat);
};

const fetchCaretakers = async (businessId: string, goats: Goat[]): Promise<Caretaker[]> => {
  const { data, error } = await supabase
    .from('caretakers')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbCaretaker => {
    const assignedGoats = goats.filter(g => g.caretakerId === dbCaretaker.id).map(g => g.id);
    return dbToCaretaker(dbCaretaker, assignedGoats);
  });
};

const fetchHealthRecords = async (businessId: string): Promise<HealthRecord[]> => {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbToHealthRecord);
};

const fetchWeightRecords = async (businessId: string): Promise<WeightRecord[]> => {
  const { data, error } = await supabase
    .from('weight_records')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbToWeightRecord);
};

const fetchExpenses = async (businessId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbToExpense);
};

const fetchTransactions = async (businessId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId);
  
  if (error) throw error;
  return (data || []).map(dbToTransaction);
};

export const useSupabaseData = (user: User | null) => {
  const { activeBusiness } = useBusiness();
  const queryClient = useQueryClient();

  const businessId = activeBusiness?.id;
  const isEnabled = !!(user && businessId);

  // Fetch goats
  const {
    data: goats = [],
    isLoading: goatsLoading,
    error: goatsError
  } = useQuery({
    queryKey: queryKeys.goats(businessId || ''),
    queryFn: () => fetchGoats(businessId!),
    enabled: isEnabled,
  });

  // Fetch caretakers (depends on goats for assigned goats calculation)
  const {
    data: caretakers = [],
    isLoading: caretakersLoading,
    error: caretakersError
  } = useQuery({
    queryKey: queryKeys.caretakers(businessId || ''),
    queryFn: () => fetchCaretakers(businessId!, goats),
    enabled: isEnabled && goats.length >= 0, // Allow empty goats array
  });

  // Fetch health records
  const {
    data: healthRecords = [],
    isLoading: healthLoading,
    error: healthError
  } = useQuery({
    queryKey: queryKeys.healthRecords(businessId || ''),
    queryFn: () => fetchHealthRecords(businessId!),
    enabled: isEnabled,
  });

  // Fetch weight records
  const {
    data: weightRecords = [],
    isLoading: weightLoading,
    error: weightError
  } = useQuery({
    queryKey: queryKeys.weightRecords(businessId || ''),
    queryFn: () => fetchWeightRecords(businessId!),
    enabled: isEnabled,
  });

  // Fetch expenses
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError
  } = useQuery({
    queryKey: queryKeys.expenses(businessId || ''),
    queryFn: () => fetchExpenses(businessId!),
    enabled: isEnabled,
  });

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useQuery({
    queryKey: queryKeys.transactions(businessId || ''),
    queryFn: () => fetchTransactions(businessId!),
    enabled: isEnabled,
  });

  // Aggregate loading and error states
  const loading = goatsLoading || caretakersLoading || healthLoading || weightLoading || expensesLoading || transactionsLoading;
  const error = goatsError || caretakersError || healthError || weightError || expensesError || transactionsError;

  // Mutations
  const addGoatMutation = useMutation({
    mutationFn: async (goatData: Omit<Goat, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      // Check for duplicate tag number within the same business
      const { data: existingGoat, error: checkError } = await supabase
        .from('goats')
        .select('id')
        .eq('tag_number', goatData.tagNumber)
        .eq('business_id', activeBusiness.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingGoat) {
        throw new Error(`Tag number "${goatData.tagNumber}" is already in use in this business`);
      }

      const qrCode = generateQRCode('temp', goatData.tagNumber);
      
      const { data: newGoat, error } = await supabase
        .from('goats')
        .insert({
          user_id: user.id,
          business_id: activeBusiness.id,
          tag_number: goatData.tagNumber,
          nickname: goatData.nickname || null,
          breed: goatData.breed,
          gender: goatData.gender,
          date_of_birth: goatData.dateOfBirth.toISOString().split('T')[0],
          color: goatData.color || null,
          current_weight: goatData.currentWeight,
          photos: goatData.photos,
          qr_code: qrCode,
          status: goatData.status,
          caretaker_id: goatData.caretakerId || null,
          purchase_price: goatData.purchasePrice,
          purchase_date: goatData.purchaseDate.toISOString().split('T')[0],
          sale_price: goatData.salePrice || null,
          sale_date: goatData.saleDate?.toISOString().split('T')[0] || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update QR code with actual ID
      const actualQrCode = generateQRCode(newGoat.id, goatData.tagNumber);
      await supabase
        .from('goats')
        .update({ qr_code: actualQrCode })
        .eq('id', newGoat.id);

      return dbToGoat({ ...newGoat, qr_code: actualQrCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  const updateGoatMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goat> }) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const dbUpdates: any = {};
      
      if (updates.tagNumber !== undefined) dbUpdates.tag_number = updates.tagNumber;
      if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
      if (updates.breed !== undefined) dbUpdates.breed = updates.breed;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth.toISOString().split('T')[0];
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.currentWeight !== undefined) dbUpdates.current_weight = updates.currentWeight;
      if (updates.photos !== undefined) dbUpdates.photos = updates.photos;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.caretakerId !== undefined) dbUpdates.caretaker_id = updates.caretakerId;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate.toISOString().split('T')[0];
      if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
      if (updates.saleDate !== undefined) dbUpdates.sale_date = updates.saleDate?.toISOString().split('T')[0];

      const { error } = await supabase
        .from('goats')
        .update(dbUpdates)
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  const deleteGoatMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { error } = await supabase
        .from('goats')
        .delete()
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  const addCaretakerMutation = useMutation({
    mutationFn: async (caretakerData: Omit<Caretaker, 'id' | 'createdAt' | 'assignedGoats' | 'totalEarnings'>) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      // If login credentials are provided, create the account first
      if (caretakerData.loginCredentials?.email && caretakerData.loginCredentials?.password) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('No active session');

          const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-caretaker', {
            body: {
              email: caretakerData.loginCredentials.email,
              businessId: activeBusiness.id,
              password: caretakerData.loginCredentials.password
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (inviteError) {
            throw new Error(`Failed to create caretaker account: ${inviteError.message}`);
          }
          
          if (!inviteData?.success) {
            throw new Error(`Failed to create caretaker account: ${inviteData?.error || 'Unknown error'}`);
          }
        } catch (error) {
          throw error;
        }
      }

      const { data: newCaretaker, error } = await supabase
        .from('caretakers')
        .insert({
          user_id: user.id,
          business_id: activeBusiness.id,
          name: caretakerData.name,
          photo: caretakerData.photo || null,
          phone: caretakerData.contactInfo.phone,
          email: caretakerData.contactInfo.email || null,
          address: caretakerData.address || 'Not specified'
        })
        .select()
        .single();

      if (error) throw error;
      return dbToCaretaker(newCaretaker, []);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  const updateCaretakerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Caretaker> }) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      // If login credentials are being updated, update the account
      if (updates.loginCredentials?.email && updates.loginCredentials?.password) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('No active session');

          const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-caretaker', {
            body: {
              email: updates.loginCredentials.email,
              businessId: activeBusiness.id,
              caretakerId: id,
              password: updates.loginCredentials.password === '••••••••' ? undefined : updates.loginCredentials.password
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (inviteError) {
            throw new Error(`Failed to update caretaker account: ${inviteError.message}`);
          }
          
          if (!inviteData?.success) {
            throw new Error(`Failed to update caretaker account: ${inviteData?.error || 'Unknown error'}`);
          }
        } catch (error) {
          throw error;
        }
      }

      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
      if (updates.contactInfo?.phone !== undefined) dbUpdates.phone = updates.contactInfo.phone;
      if (updates.contactInfo?.email !== undefined) dbUpdates.email = updates.contactInfo.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address || 'Not specified';
      if (updates.totalEarnings !== undefined) dbUpdates.total_earnings = updates.totalEarnings;

      const { error } = await supabase
        .from('caretakers')
        .update(dbUpdates)
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  const deleteCaretakerMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      // First, check if this caretaker has an associated user account
      const { data: caretakerData, error: caretakerError } = await supabase
        .from('caretakers')
        .select('email')
        .eq('id', id)
        .eq('business_id', activeBusiness.id)
        .single();

      if (caretakerError) throw caretakerError;

      let caretakerUserId = null;
      
      // If caretaker has an email, find their user account
      if (caretakerData.email) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: userLookup, error: userLookupError } = await supabase.functions.invoke('get-user-by-email', {
              body: {
                email: caretakerData.email,
                businessId: activeBusiness.id
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });

            if (!userLookupError && userLookup?.success) {
              caretakerUserId = userLookup.userId;
            }
          }
        } catch (error) {
          console.warn('Failed to lookup caretaker user account:', error);
        }
      }

      // First unassign goats from this caretaker
      await supabase
        .from('goats')
        .update({ caretaker_id: null })
        .eq('caretaker_id', id)
        .eq('business_id', activeBusiness.id);

      // Delete the caretaker record
      const { error } = await supabase
        .from('caretakers')
        .delete()
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;

      // If caretaker had a user account, delete it
      if (caretakerUserId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.functions.invoke('delete-caretaker-account', {
              body: {
                userId: caretakerUserId,
                businessId: activeBusiness.id
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });
          }
        } catch (error) {
          console.error('Failed to delete caretaker user account:', error);
        }
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
    },
  });

  const addHealthRecordMutation = useMutation({
    mutationFn: async (recordData: Omit<HealthRecord, 'id'>) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { data: newRecord, error } = await supabase
        .from('health_records')
        .insert({
          user_id: user.id,
          business_id: activeBusiness.id,
          goat_id: recordData.goatId,
          type: recordData.type,
          date: recordData.date.toISOString().split('T')[0],
          description: recordData.description,
          treatment: recordData.treatment || null,
          veterinarian: recordData.veterinarian || null,
          cost: recordData.cost,
          notes: recordData.notes || null,
          status: recordData.status,
          next_due_date: recordData.nextDueDate?.toISOString().split('T')[0] || null,
        })
        .select()
        .single();

      if (error) throw error;
      return dbToHealthRecord(newRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords(businessId!) });
    },
  });

  const updateHealthRecordMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HealthRecord> }) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const dbUpdates: any = {};
      
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0];
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.treatment !== undefined) dbUpdates.treatment = updates.treatment;
      if (updates.veterinarian !== undefined) dbUpdates.veterinarian = updates.veterinarian;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.nextDueDate !== undefined) dbUpdates.next_due_date = updates.nextDueDate?.toISOString().split('T')[0];

      const { error } = await supabase
        .from('health_records')
        .update(dbUpdates)
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords(businessId!) });
    },
  });

  const deleteHealthRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords(businessId!) });
    },
  });

  const addWeightRecordMutation = useMutation({
    mutationFn: async (recordData: Omit<WeightRecord, 'id'>) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { data: newRecord, error } = await supabase
        .from('weight_records')
        .insert({
          business_id: activeBusiness.id,
          goat_id: recordData.goatId,
          weight: recordData.weight,
          date: recordData.date.toISOString().split('T')[0],
          notes: recordData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update goat's current weight
      await supabase
        .from('goats')
        .update({ current_weight: recordData.weight })
        .eq('id', recordData.goatId)
        .eq('business_id', activeBusiness.id);

      return dbToWeightRecord(newRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weightRecords(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id'>) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          business_id: activeBusiness.id,
          goat_id: expenseData.goatId || null,
          caretaker_id: expenseData.caretakerId || null,
          category: expenseData.category,
          amount: expenseData.amount,
          date: expenseData.date.toISOString().split('T')[0],
          description: expenseData.description,
        })
        .select()
        .single();

      if (error) throw error;
      return dbToExpense(newExpense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(businessId!) });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const dbUpdates: any = {};
      
      if (updates.goatId !== undefined) dbUpdates.goat_id = updates.goatId;
      if (updates.caretakerId !== undefined) dbUpdates.caretaker_id = updates.caretakerId;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0];
      if (updates.description !== undefined) dbUpdates.description = updates.description;

      const { error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(businessId!) });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(businessId!) });
    },
  });

  const sellGoatMutation = useMutation({
    mutationFn: async ({ goatId, salePrice, saleDate, buyer }: { goatId: string; salePrice: number; saleDate: Date; buyer?: string }) => {
      if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

      // Update goat status and sale info
      await supabase
        .from('goats')
        .update({ 
          status: 'Sold',
          sale_price: salePrice,
          sale_date: saleDate.toISOString().split('T')[0]
        })
        .eq('id', goatId)
        .eq('business_id', activeBusiness.id);

      // Add transaction record
      const goat = goats.find(g => g.id === goatId);
      if (goat) {
        // Calculate total expenses for this goat
        const specificExpenses = expenses.filter(e => e.goatId === goatId).reduce((sum, e) => sum + e.amount, 0);
        const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
        const activeGoats = goats.filter(g => g.status === 'Active');
        const totalActiveGoats = activeGoats.length;
        const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
        const goatExpenses = specificExpenses + sharedExpensePerGoat;
        
        const healthCosts = healthRecords.filter(h => h.goatId === goatId).reduce((sum, h) => sum + h.cost, 0);
        const totalExpenses = goatExpenses + healthCosts;
        const netProfit = salePrice - goat.purchasePrice - totalExpenses;
        
        const { data: newTransaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            business_id: activeBusiness.id,
            goat_id: goatId,
            type: 'Sale',
            amount: salePrice,
            date: saleDate.toISOString().split('T')[0],
            description: `Sale of goat ${goat.tagNumber} - Net Profit: ₹${netProfit.toLocaleString()} (Expenses: ₹${totalExpenses.toLocaleString()})`,
            buyer: buyer || null,
            category: `Net Profit: ₹${netProfit.toLocaleString()}`,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;
        
        // Update caretaker earnings if applicable
        if (goat.caretakerId) {
          const caretaker = caretakers.find(c => c.id === goat.caretakerId);
          if (caretaker && activeBusiness.paymentModelType === 'percentage') {
            const caretakerShare = (netProfit * activeBusiness.paymentModelAmount) / 100;
            await supabase
              .from('caretakers')
              .update({ 
                total_earnings: caretaker.totalEarnings + caretakerShare 
              })
              .eq('id', goat.caretakerId);
          }
        }

        return dbToTransaction(newTransaction);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(businessId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId!) });
    },
  });

  // Wrapper functions for mutations
  const addGoat = useCallback((goatData: Omit<Goat, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>) => {
    return addGoatMutation.mutateAsync(goatData);
  }, [addGoatMutation]);

  const updateGoat = useCallback((id: string, updates: Partial<Goat>) => {
    return updateGoatMutation.mutateAsync({ id, updates });
  }, [updateGoatMutation]);

  const deleteGoat = useCallback((id: string) => {
    return deleteGoatMutation.mutateAsync(id);
  }, [deleteGoatMutation]);

  const addCaretaker = useCallback((caretakerData: Omit<Caretaker, 'id' | 'createdAt' | 'assignedGoats' | 'totalEarnings'>) => {
    return addCaretakerMutation.mutateAsync(caretakerData);
  }, [addCaretakerMutation]);

  const updateCaretaker = useCallback((id: string, updates: Partial<Caretaker>) => {
    return updateCaretakerMutation.mutateAsync({ id, updates });
  }, [updateCaretakerMutation]);

  const deleteCaretaker = useCallback((id: string) => {
    return deleteCaretakerMutation.mutateAsync(id);
  }, [deleteCaretakerMutation]);

  const addHealthRecord = useCallback((recordData: Omit<HealthRecord, 'id'>) => {
    return addHealthRecordMutation.mutateAsync(recordData);
  }, [addHealthRecordMutation]);

  const updateHealthRecord = useCallback((id: string, updates: Partial<HealthRecord>) => {
    return updateHealthRecordMutation.mutateAsync({ id, updates });
  }, [updateHealthRecordMutation]);

  const deleteHealthRecord = useCallback((id: string) => {
    return deleteHealthRecordMutation.mutateAsync(id);
  }, [deleteHealthRecordMutation]);

  const addWeightRecord = useCallback((recordData: Omit<WeightRecord, 'id'>) => {
    return addWeightRecordMutation.mutateAsync(recordData);
  }, [addWeightRecordMutation]);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    return addExpenseMutation.mutateAsync(expenseData);
  }, [addExpenseMutation]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    return updateExpenseMutation.mutateAsync({ id, updates });
  }, [updateExpenseMutation]);

  const deleteExpense = useCallback((id: string) => {
    return deleteExpenseMutation.mutateAsync(id);
  }, [deleteExpenseMutation]);

  const assignGoatToCaretaker = useCallback((goatId: string, caretakerId: string) => {
    return updateGoat(goatId, { caretakerId });
  }, [updateGoat]);

  const sellGoat = useCallback((goatId: string, salePrice: number, saleDate: Date, buyer?: string) => {
    return sellGoatMutation.mutateAsync({ goatId, salePrice, saleDate, buyer });
  }, [sellGoatMutation]);

  const refreshData = useCallback(async () => {
    if (!businessId) return;
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goats(businessId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.caretakers(businessId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.healthRecords(businessId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.weightRecords(businessId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(businessId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(businessId) }),
    ]);
  }, [queryClient, businessId]);

  const data: AppState = {
    businesses: [],
    userBusinessRoles: [],
    activeBusiness,
    goats,
    caretakers,
    healthRecords,
    weightRecords,
    transactions,
    expenses
  };

  return {
    data,
    loading,
    error: error ? (error as Error).message : null,
    addGoat,
    updateGoat,
    deleteGoat,
    addCaretaker,
    updateCaretaker,
    deleteCaretaker,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    addWeightRecord,
    addExpense,
    updateExpense,
    deleteExpense,
    assignGoatToCaretaker,
    sellGoat,
    refreshData
  };
};

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
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

const dbToCaretaker = (dbCaretaker: DbCaretaker, assignedGoats: string[] = [], photo?: string): Caretaker => ({
  id: dbCaretaker.id,
  businessId: dbCaretaker.business_id,
  name: dbCaretaker.name,
  photo: photo,
  contactInfo: {
    phone: dbCaretaker.phone,
    email: dbCaretaker.email || undefined,
    address: dbCaretaker.address
  },
  paymentModel: {
    type: dbCaretaker.payment_type,
    amount: dbCaretaker.payment_amount
  },
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

export const useSupabaseData = (user: User | null) => {
  const { activeBusiness } = useBusiness();
  const [data, setData] = useState<AppState>({
    businesses: [],
    userBusinessRoles: [],
    activeBusiness: null,
    goats: [],
    caretakers: [],
    healthRecords: [],
    weightRecords: [],
    transactions: [],
    expenses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !activeBusiness) {
      setData({
        businesses: [],
        userBusinessRoles: [],
        activeBusiness: null,
        goats: [],
        caretakers: [],
        healthRecords: [],
        weightRecords: [],
        transactions: [],
        expenses: []
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        { data: goatsData, error: goatsError },
        { data: caretakersData, error: caretakersError },
        { data: healthRecordsData, error: healthError },
        { data: weightRecordsData, error: weightError },
        { data: expensesData, error: expensesError },
        { data: transactionsData, error: transactionsError }
      ] = await Promise.all([
        supabase.from('goats').select('*').eq('business_id', activeBusiness.id),
        supabase.from('caretakers').select('*').eq('business_id', activeBusiness.id),
        supabase.from('health_records').select('*').eq('business_id', activeBusiness.id),
        supabase.from('weight_records').select('*').eq('business_id', activeBusiness.id),
        supabase.from('expenses').select('*').eq('business_id', activeBusiness.id),
        supabase.from('transactions').select('*').eq('business_id', activeBusiness.id)
      ]);

      if (goatsError) throw goatsError;
      if (caretakersError) throw caretakersError;
      if (healthError) throw healthError;
      if (weightError) throw weightError;
      if (expensesError) throw expensesError;
      if (transactionsError) throw transactionsError;

      // Convert database types to app types
      const goats = (goatsData || []).map(dbToGoat);
      const caretakers = (caretakersData || []).map(dbCaretaker => {
        const assignedGoats = goats.filter(g => g.caretakerId === dbCaretaker.id).map(g => g.id);
        return dbToCaretaker(dbCaretaker, assignedGoats);
      });

      setData({
        businesses: [],
        userBusinessRoles: [],
        activeBusiness,
        goats,
        caretakers,
        healthRecords: (healthRecordsData || []).map(dbToHealthRecord),
        weightRecords: (weightRecordsData || []).map(dbToWeightRecord),
        transactions: (transactionsData || []).map(dbToTransaction),
        expenses: (expensesData || []).map(dbToExpense)
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, activeBusiness]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addGoat = async (goatData: Omit<Goat, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>) => {
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

    await fetchData();
  };

  const updateGoat = async (id: string, updates: Partial<Goat>) => {
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
    await fetchData();
  };

  const deleteGoat = async (id: string) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    const { error } = await supabase
      .from('goats')
      .delete()
      .eq('id', id)
      .eq('business_id', activeBusiness.id);

    if (error) throw error;
    await fetchData();
  };

  const addCaretaker = async (caretakerData: Omit<Caretaker, 'id' | 'createdAt' | 'assignedGoats' | 'totalEarnings'>) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    // If login credentials are provided, create the account first
    if (caretakerData.loginCredentials?.email && caretakerData.loginCredentials?.password) {
      try {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        // Call the edge function to create the caretaker account
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

        if (inviteError || !inviteData?.success) {
          console.error('Failed to create caretaker account:', inviteError || inviteData?.error);
          // Continue with caretaker creation even if account creation fails
        }
      } catch (error) {
        console.error('Error creating caretaker account:', error);
        // Continue with caretaker creation even if account creation fails
      }
    }

    const { error } = await supabase
      .from('caretakers')
      .insert({
        user_id: user.id,
        business_id: activeBusiness.id,
        name: caretakerData.name,
        photo: caretakerData.photo || null,
        phone: caretakerData.contactInfo.phone,
        email: caretakerData.contactInfo.email || null,
        address: caretakerData.contactInfo.address,
        payment_type: caretakerData.paymentModel.type,
        payment_amount: caretakerData.paymentModel.amount,
      });

    if (error) throw error;
    await fetchData();
  };

  const updateCaretaker = async (id: string, updates: Partial<Caretaker>) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    // If login credentials are being updated, update the account
    if (updates.loginCredentials?.email && updates.loginCredentials?.password) {
      try {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        // Call the edge function to update/create the caretaker account
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-caretaker', {
          body: {
            email: updates.loginCredentials.email,
            businessId: activeBusiness.id,
            caretakerId: id,
            password: updates.loginCredentials.password
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (inviteError || !inviteData?.success) {
          console.error('Failed to update caretaker account:', inviteError || inviteData?.error);
          // Continue with caretaker update even if account update fails
        }
      } catch (error) {
        console.error('Error updating caretaker account:', error);
        // Continue with caretaker update even if account update fails
      }
    }

    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.contactInfo?.phone !== undefined) dbUpdates.phone = updates.contactInfo.phone;
    if (updates.contactInfo?.email !== undefined) dbUpdates.email = updates.contactInfo.email;
    if (updates.contactInfo?.address !== undefined) dbUpdates.address = updates.contactInfo.address;
    if (updates.paymentModel?.type !== undefined) dbUpdates.payment_type = updates.paymentModel.type;
    if (updates.paymentModel?.amount !== undefined) dbUpdates.payment_amount = updates.paymentModel.amount;
    if (updates.totalEarnings !== undefined) dbUpdates.total_earnings = updates.totalEarnings;

    const { error } = await supabase
      .from('caretakers')
      .update(dbUpdates)
      .eq('id', id)
      .eq('business_id', activeBusiness.id);

    if (error) throw error;
    await fetchData();
  };

  const deleteCaretaker = async (id: string) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    // First unassign goats from this caretaker
    await supabase
      .from('goats')
      .update({ caretaker_id: null })
      .eq('caretaker_id', id)
      .eq('business_id', activeBusiness.id);

    const { error } = await supabase
      .from('caretakers')
      .delete()
      .eq('id', id)
      .eq('business_id', activeBusiness.id);

    if (error) throw error;
    await fetchData();
  };

  const addHealthRecord = async (recordData: Omit<HealthRecord, 'id'>) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    const { error } = await supabase
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
      });

    if (error) throw error;
    await fetchData();
  };

  const updateHealthRecord = async (id: string, updates: Partial<HealthRecord>) => {
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
    await fetchData();
  };

  const deleteHealthRecord = async (id: string) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('id', id)
      .eq('business_id', activeBusiness.id);

    if (error) throw error;
    await fetchData();
  };

  const addWeightRecord = async (recordData: Omit<WeightRecord, 'id'>) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    const { error } = await supabase
      .from('weight_records')
      .insert({
        business_id: activeBusiness.id,
        goat_id: recordData.goatId,
        weight: recordData.weight,
        date: recordData.date.toISOString().split('T')[0],
        notes: recordData.notes || null,
      });

    if (error) throw error;

    // Update goat's current weight
    await updateGoat(recordData.goatId, { currentWeight: recordData.weight });
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    const { error } = await supabase
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
      });

    if (error) throw error;
    await fetchData();
  };

  const assignGoatToCaretaker = async (goatId: string, caretakerId: string) => {
    await updateGoat(goatId, { caretakerId });
  };

  const sellGoat = async (goatId: string, salePrice: number, saleDate: Date, buyer?: string) => {
    if (!user || !activeBusiness) throw new Error('User not authenticated or no active business');

    // Update goat status and sale info
    await updateGoat(goatId, { 
      status: 'Sold', 
      salePrice, 
      saleDate 
    });

    // Add transaction record
    const goat = data.goats.find(g => g.id === goatId);
    if (goat) {
      // Calculate total expenses for this goat
      const specificExpenses = data.expenses.filter(e => e.goatId === goatId).reduce((sum, e) => sum + e.amount, 0);
      const generalExpenses = data.expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
      const activeGoats = data.goats.filter(g => g.status === 'Active');
      const totalActiveGoats = activeGoats.length;
      const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
      const goatExpenses = specificExpenses + sharedExpensePerGoat;
      
      const healthCosts = data.healthRecords.filter(h => h.goatId === goatId).reduce((sum, h) => sum + h.cost, 0);
      const totalExpenses = goatExpenses + healthCosts;
      const netProfit = salePrice - goat.purchasePrice - totalExpenses;
      
      await supabase
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
        });
      
      // Update caretaker earnings if applicable
      if (goat.caretakerId) {
        const caretaker = data.caretakers.find(c => c.id === goat.caretakerId);
        if (caretaker && caretaker.paymentModel.type === 'percentage') {
          const caretakerShare = (netProfit * caretaker.paymentModel.amount) / 100;
          await supabase
            .from('caretakers')
            .update({ 
              total_earnings: caretaker.totalEarnings + caretakerShare 
            })
            .eq('id', goat.caretakerId);
        }
      }
    }

    await fetchData();
  };

  return {
    data,
    loading,
    error,
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
    assignGoatToCaretaker,
    sellGoat,
    refreshData: fetchData
  };
};
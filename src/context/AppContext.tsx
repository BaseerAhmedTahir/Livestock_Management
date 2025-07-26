import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBusiness } from './BusinessContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { AppState, Goat, Caretaker, HealthRecord, WeightRecord, Expense } from '../types';

interface AppContextType extends AppState {
  loading: boolean;
  error: string | null;
  addGoat: (goat: Omit<Goat, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>) => void;
  updateGoat: (id: string, updates: Partial<Goat>) => void;
  deleteGoat: (id: string) => void;
  addCaretaker: (caretaker: Omit<Caretaker, 'id' | 'createdAt' | 'assignedGoats' | 'totalEarnings'>) => void;
  updateCaretaker: (id: string, updates: Partial<Caretaker>) => void;
  deleteCaretaker: (id: string) => void;
  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => void;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => void;
  deleteHealthRecord: (id: string) => void;
  addWeightRecord: (record: Omit<WeightRecord, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  assignGoatToCaretaker: (goatId: string, caretakerId: string) => void;
  sellGoat: (goatId: string, salePrice: number, saleDate: Date, buyer?: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const {
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
    refreshData
  } = useSupabaseData(user);

  const value: AppContextType = {
    ...data,
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
    refreshData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
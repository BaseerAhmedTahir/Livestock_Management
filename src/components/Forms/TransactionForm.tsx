import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionFormData {
  type: 'Expense';
  goatId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  buyer: string;
  category: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose }) => {
  const { goats, addExpense } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'Expense',
      goatId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      vendor: '',
      buyer: '',
      category: 'Feed'
    }
  });

  const transactionType = watch('type');

  const onSubmit = async (data: TransactionFormData) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);

    try {
      await addExpense({
        goatId: data.goatId || undefined,
        category: data.category as 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other',
        amount: Number(data.amount),
        date: new Date(data.date),
        description: data.description
      });

      onClose();
      // Reset form after successful submission and modal close
      setTimeout(() => {
        reset();
        setError(null);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700 pb-20">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>
        
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Type *
            </label>
            <input
              type="text"
              value="Expense"
              disabled
              className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Feed">Feed</option>
              <option value="Medicine">Medicine</option>
              <option value="Transport">Transport</option>
              <option value="Veterinary">Veterinary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Goat (Optional)
            </label>
            <select
              {...register('goatId')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Goat (Optional)</option>
              {goats.map(goat => (
                <option key={goat.id} value={goat.id}>
                  {goat.tagNumber} - {goat.nickname || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Amount (₹) *
            </label>
            <input
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 1, message: 'Amount must be greater than 0' }
              })}
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="1000"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Date *
            </label>
            <input
              {...register('date', { required: 'Date is required' })}
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe the transaction..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
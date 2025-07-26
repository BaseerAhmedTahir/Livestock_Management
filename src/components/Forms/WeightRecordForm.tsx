import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WeightRecord } from '../../types';

interface WeightRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  goatId?: string;
  weightRecord?: WeightRecord;
  isEdit?: boolean;
}

interface WeightRecordFormData {
  goatId: string;
  weight: number;
  date: string;
  notes: string;
}

export const WeightRecordForm: React.FC<WeightRecordFormProps> = ({ 
  isOpen, 
  onClose, 
  goatId,
  weightRecord,
  isEdit = false 
}) => {
  const { goats, addWeightRecord } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeightRecordFormData>({
    defaultValues: weightRecord ? {
      goatId: weightRecord.goatId,
      weight: weightRecord.weight,
      date: weightRecord.date.toISOString().split('T')[0],
      notes: weightRecord.notes || ''
    } : {
      goatId: goatId || '',
      weight: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const onSubmit = async (data: WeightRecordFormData) => {
    setLoading(true);
    setError(null);

    try {
      const recordData = {
        goatId: data.goatId,
        weight: Number(data.weight),
        date: new Date(data.date),
        notes: data.notes || undefined
      };

      await addWeightRecord(recordData);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Weight Record
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goat *
            </label>
            <select
              {...register('goatId', { required: 'Please select a goat' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Goat</option>
              {goats.filter(g => g.status === 'Active').map(goat => (
                <option key={goat.id} value={goat.id}>
                  {goat.tagNumber} - {goat.nickname || 'Unnamed'}
                </option>
              ))}
            </select>
            {errors.goatId && (
              <p className="text-red-500 text-sm mt-1">{errors.goatId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) *
            </label>
            <input
              {...register('weight', { 
                required: 'Weight is required',
                min: { value: 1, message: 'Weight must be greater than 0' }
              })}
              type="number"
              step="0.1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="25.5"
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Additional notes about the weight measurement..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {loading ? 'Saving...' : 'Add Weight Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
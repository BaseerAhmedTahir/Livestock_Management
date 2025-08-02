import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HealthRecord } from '../../types';

interface HealthRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  goatId?: string;
  healthRecord?: HealthRecord;
  isEdit?: boolean;
}

interface HealthRecordFormData {
  goatId: string;
  type: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive';
  date: string;
  description: string;
  treatment: string;
  veterinarian: string;
  cost: number;
  notes: string;
  status: 'Healthy' | 'Under Treatment' | 'Recovered';
  nextDueDate: string;
}

export const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ 
  isOpen, 
  onClose, 
  goatId,
  healthRecord,
  isEdit = false 
}) => {
  const { goats, addHealthRecord, updateHealthRecord } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HealthRecordFormData>({
    defaultValues: healthRecord ? {
      goatId: healthRecord.goatId,
      type: healthRecord.type,
      date: healthRecord.date.toISOString().split('T')[0],
      description: healthRecord.description,
      treatment: healthRecord.treatment || '',
      veterinarian: healthRecord.veterinarian || '',
      cost: healthRecord.cost,
      notes: healthRecord.notes || '',
      status: healthRecord.status,
      nextDueDate: healthRecord.nextDueDate?.toISOString().split('T')[0] || ''
    } : {
      goatId: goatId || '',
      type: 'Vaccination',
      date: new Date().toISOString().split('T')[0],
      description: '',
      treatment: '',
      veterinarian: '',
      cost: 0,
      notes: '',
      status: 'Healthy',
      nextDueDate: ''
    }
  });

  const onSubmit = async (data: HealthRecordFormData) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);

    try {
      const recordData = {
        goatId: data.goatId,
        type: data.type,
        date: new Date(data.date),
        description: data.description,
        treatment: data.treatment || undefined,
        veterinarian: data.veterinarian || undefined,
        cost: Number(data.cost),
        notes: data.notes || undefined,
        status: data.status,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined
      };

      if (isEdit && healthRecord) {
        await updateHealthRecord(healthRecord.id, recordData);
      } else {
        await addHealthRecord(recordData);
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700 pb-20">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
            {isEdit ? 'Edit Health Record' : 'Add Health Record'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>
        
        {error && (
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </label>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Goat *
              </label>
              <select
                {...register('goatId', { required: 'Please select a goat' })}
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
              >
                <option value="">Select Goat</option>
                {goats.filter(g => g.status === 'Active').map(goat => (
                  <option key={goat.id} value={goat.id}>
                    {goat.tagNumber} - {goat.nickname || 'Unnamed'}
                  </option>
                ))}
              </select>
              {errors.goatId && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.goatId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Type *
              </label>
              <select
                {...register('type', { required: 'Type is required' })}
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
              >
                <option value="Vaccination">Vaccination</option>
                <option value="Illness">Illness</option>
                <option value="Injury">Injury</option>
                <option value="Deworming">Deworming</option>
                <option value="Checkup">Checkup</option>
                <option value="Reproductive">Reproductive</option>
              </select>
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
                Status *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Healthy">Healthy</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovered">Recovered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Cost (₹) *
              </label>
              <input
                {...register('cost', { 
                  required: 'Cost is required',
                  min: { value: 0, message: 'Cost must be 0 or greater' }
                })}
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="500"
              />
              {errors.cost && (
                <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Next Due Date
              </label>
              <input
                {...register('nextDueDate')}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe the health record..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Treatment
            </label>
            <input
              {...register('treatment')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Treatment given..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Veterinarian
            </label>
            <input
              {...register('veterinarian')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Dr. Ahmed Khan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Additional notes..."
            />
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
              {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
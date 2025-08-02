import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Copy, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goat } from '../../types';

interface GoatDuplicateFormProps {
  isOpen: boolean;
  onClose: () => void;
  sourceGoat: Goat;
}

interface DuplicateFormData {
  tagNumber: string;
  nickname: string;
  dateOfBirth: string;
  currentWeight: number;
  purchasePrice: number;
  purchaseDate: string;
  count: number;
}

export const GoatDuplicateForm: React.FC<GoatDuplicateFormProps> = ({
  isOpen,
  onClose,
  sourceGoat
}) => {
  const { addGoat } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DuplicateFormData>({
    defaultValues: {
      tagNumber: '',
      nickname: '',
      dateOfBirth: sourceGoat.dateOfBirth.toISOString().split('T')[0],
      currentWeight: sourceGoat.currentWeight,
      purchasePrice: sourceGoat.purchasePrice,
      purchaseDate: new Date().toISOString().split('T')[0],
      count: 1
    }
  });

  const count = watch('count');

  const onSubmit = async (data: DuplicateFormData) => {
    setLoading(true);
    setError(null);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.count; i++) {
      try {
        const tagNumber = data.count === 1 
          ? data.tagNumber 
          : `${data.tagNumber}${i + 1}`;
        
        const nickname = data.count === 1 
          ? data.nickname 
          : data.nickname ? `${data.nickname} ${i + 1}` : undefined;

        await addGoat({
          tagNumber,
          nickname,
          breed: sourceGoat.breed,
          gender: sourceGoat.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          color: sourceGoat.color,
          currentWeight: data.currentWeight,
          purchasePrice: data.purchasePrice,
          purchaseDate: new Date(data.purchaseDate),
          caretakerId: sourceGoat.caretakerId,
          photos: [], // No photos for duplicated goats
          status: 'Active'
        });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Goat ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setLoading(false);

    if (errorCount === 0) {
      setSuccess(`Successfully created ${successCount} goat${successCount > 1 ? 's' : ''}!`);
      setTimeout(() => {
        onClose();
        reset();
        setError(null);
        setSuccess(null);
      }, 2000);
    } else {
      setError(`Created ${successCount} goats. ${errorCount} failed:\n${errors.join('\n')}`);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
              Duplicate Goat
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Duplicating from: {sourceGoat.tagNumber}
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Breed: {sourceGoat.breed} • Gender: {sourceGoat.gender} • Caretaker: {sourceGoat.caretakerId ? 'Assigned' : 'Unassigned'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-300 font-medium">Errors occurred:</p>
              </div>
              <pre className="text-red-600 dark:text-red-400 text-xs whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Number of Goats to Create *
              </label>
              <input
                {...register('count', { 
                  required: 'Count is required',
                  min: { value: 1, message: 'Must create at least 1 goat' },
                  max: { value: 50, message: 'Cannot create more than 50 goats at once' }
                })}
                type="number"
                min="1"
                max="50"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.count && (
                <p className="text-red-500 text-sm mt-1">{errors.count.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Base Tag Number *
              </label>
              <input
                {...register('tagNumber', { required: 'Tag number is required' })}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={count > 1 ? "GT100 (will create GT1001, GT1002, etc.)" : "GT100"}
              />
              {errors.tagNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.tagNumber.message}</p>
              )}
              {count > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Numbers will be appended: {watch('tagNumber')}1, {watch('tagNumber')}2, etc.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Base Nickname
              </label>
              <input
                {...register('nickname')}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={count > 1 ? "Brownie (will create Brownie 1, Brownie 2, etc.)" : "Brownie"}
              />
              {count > 1 && watch('nickname') && (
                <p className="text-xs text-gray-500 mt-1">
                  Numbers will be appended: {watch('nickname')} 1, {watch('nickname')} 2, etc.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Date of Birth *
                </label>
                <input
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Weight (kg) *
                </label>
                <input
                  {...register('currentWeight', { 
                    required: 'Weight is required',
                    min: { value: 1, message: 'Weight must be greater than 0' }
                  })}
                  type="number"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Purchase Price (₹) *
                </label>
                <input
                  {...register('purchasePrice', { 
                    required: 'Purchase price is required',
                    min: { value: 1, message: 'Price must be greater than 0' }
                  })}
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Purchase Date *
                </label>
                <input
                  {...register('purchaseDate', { required: 'Purchase date is required' })}
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Inherited Properties:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Breed:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{sourceGoat.breed}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{sourceGoat.gender}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Color:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{sourceGoat.color || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Caretaker:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{sourceGoat.caretakerId ? 'Assigned' : 'Unassigned'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Creating...' : `Create ${count} Goat${count > 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};